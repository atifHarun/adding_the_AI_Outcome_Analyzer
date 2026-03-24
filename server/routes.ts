import type { Express } from "express";
import type { Server } from "http";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { api } from "@shared/routes";
import feedbackRoutes from "./routes/feedback";

// Setup multer for in-memory file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Helper to parse CSV buffer
function parseCsv(buffer: Buffer): any[] {
  return parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    cast: true, // Casts numbers/booleans
  });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Endpoint 1: Detect all columns
  app.post(api.detectSensitive.path, upload.single("file"), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const records = parseCsv(req.file.buffer);
      if (records.length === 0) {
        return res.status(400).json({ message: "CSV file is empty" });
      }

      const columns = Object.keys(records[0]);
      res.status(200).json({ all_columns: columns });
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Failed to process file" });
    }
  });

  // Endpoint 2: Analyze fairness
  app.post(api.analyze.path, upload.single("file"), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const confirmedStr = req.body.confirmed_sensitive_columns;
      const mappingStr = req.body.column_mapping;

      if (!confirmedStr) {
        return res.status(400).json({ message: "No confirmed_sensitive_columns provided" });
      }
      if (!mappingStr) {
        return res.status(400).json({ message: "No column_mapping provided" });
      }

      let confirmedColumns: string[];
      let mapping: { score: string; approved: string; actual_default: string };

      try {
        confirmedColumns = JSON.parse(confirmedStr);
        mapping = JSON.parse(mappingStr);
      } catch {
        return res.status(400).json({ message: "Invalid JSON in parameters" });
      }

      const threshold = parseFloat(req.body.threshold || "0.5");
      const records = parseCsv(req.file.buffer);

      if (records.length === 0) {
        return res.status(400).json({ message: "CSV file is empty" });
      }

      // Validate mapping exists in columns
      const cols = Object.keys(records[0] || {});
      const required = [mapping.score, mapping.approved, mapping.actual_default];
      const missing = required.filter(c => !cols.includes(c));
      if (missing.length > 0) {
        return res.status(400).json({ message: `Missing mapped columns: ${missing.join(", ")}` });
      }

      const result: any = {
        dataset_summary: {
          rows: records.length,
          sensitive_columns_analyzed: confirmedColumns,
        },
        fairness_results: {},
      };

      for (const col of confirmedColumns) {
        const subgroups: Record<string, any[]> = {};
        for (const row of records) {
          const val = String(row[col] || "").trim();
          if (!val) continue;
          if (!subgroups[val]) subgroups[val] = [];
          subgroups[val].push(row);
        }

        const subgroupMetrics: Record<string, any> = {};
        for (const [groupName, groupRecords] of Object.entries(subgroups)) {
          let approvedCount = 0;
          let truePositives = 0;
          let actualGoodCount = 0;
          let actualBadCount = 0;
          let falsePositives = 0;
          let totalScore = 0;

          for (const row of groupRecords) {
            const approved = Boolean(Number(row[mapping.approved]));
            const actualDefault = Boolean(Number(row[mapping.actual_default]));
            const score = Number(row[mapping.score]);
            
            if (approved) approvedCount++;
            if (!actualDefault) {
              actualGoodCount++;
              if (approved) truePositives++;
            } else {
              actualBadCount++;
              if (approved) falsePositives++;
            }
            totalScore += score;
          }

          subgroupMetrics[groupName] = {
            selection_rate: groupRecords.length > 0 ? approvedCount / groupRecords.length : 0,
            tpr: actualGoodCount > 0 ? truePositives / actualGoodCount : 0,
            fpr: actualBadCount > 0 ? falsePositives / actualBadCount : 0,
            precision: approvedCount > 0 ? truePositives / approvedCount : 0,
            mean_score: groupRecords.length > 0 ? totalScore / groupRecords.length : 0,
            count: groupRecords.length
          };
        }

        if (Object.keys(subgroupMetrics).length === 0) continue;

        let maxSelectionRate = 0;
        let maxTpr = 0;
        let minFpr = 1;
        for (const m of Object.values(subgroupMetrics)) {
          maxSelectionRate = Math.max(maxSelectionRate, m.selection_rate);
          maxTpr = Math.max(maxTpr, m.tpr);
          minFpr = Math.min(minFpr, m.fpr);
        }

        let worstAir = 1;
        let maxTprDisp = 0;
        let maxFprDisp = 0;
        let maxPrecDiff = 0;
        let maxScoreDiff = 0;
        const names = Object.keys(subgroupMetrics);

        for (const [name, m] of Object.entries(subgroupMetrics)) {
          const air = maxSelectionRate > 0 ? m.selection_rate / maxSelectionRate : 1;
          worstAir = Math.min(worstAir, air);
          maxTprDisp = Math.max(maxTprDisp, maxTpr - m.tpr);
          maxFprDisp = Math.max(maxFprDisp, Math.abs(m.fpr - minFpr));
          for (const other of names) {
            maxPrecDiff = Math.max(maxPrecDiff, Math.abs(m.precision - subgroupMetrics[other].precision));
            maxScoreDiff = Math.max(maxScoreDiff, Math.abs(m.mean_score - subgroupMetrics[other].mean_score));
          }
        }

        result.fairness_results[col] = {
          subgroups: subgroupMetrics,
          disparities: {
            air: worstAir,
            tpr_disparity: maxTprDisp,
            fpr_disparity: maxFprDisp,
            predictive_parity_diff: maxPrecDiff,
            score_distribution_diff: maxScoreDiff,
          },
          risk_flag: (worstAir < 0.7 || maxTprDisp > 0.1 || maxFprDisp > 0.1) ? "HIGH" : (worstAir < 0.8 ? "MEDIUM" : "LOW")
        };
      }
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Analysis failed" });
    }
  });

  // Register feedback routes
  app.use("/api", feedbackRoutes);

  return httpServer;
}
