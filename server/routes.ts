import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { api } from "@shared/routes";
import { OpenAI } from "openai";
import rateLimit from "express-rate-limit";

// ── TypeScript interfaces ─────────────────────────────────────────────────────

interface AiUseCaseJson {
  useCaseName: string;
  systemType: string;
  primaryFunction?: string;
  contextOfUse: {
    industry: string;
    environment: string;
  };
  stakeholders?: {
    primaryUsers: string[];
    indirectlyAffectedParties: string[];
    oversightOwners: string[];
  };
  decisionsAndActions?: {
    decisionsMadeBySystem: string[];
    actionsExecutedAutomatically: string[];
    actionsRequiringHumanApproval: string[];
  };
  dataInputs?: {
    dataTypesUsed: string[];
    dataSources: string[];
    personalOrSensitiveData: boolean;
  };
  modelAutonomyLevel: string;
  scaleAndReach?: {
    expectedNumberOfUsers: string;
    frequencyOfUse: string;
    geographicScope: string;
  };
}

interface GenerateJsonApiResponse {
  json: AiUseCaseJson;
}

interface AnalyzeApiResponse {
  analysis: string;
}

// ── OpenAI client (lazy initialisation) ──────────────────────────────────────

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  }
  return openai;
}

// ── Validation constants ──────────────────────────────────────────────────────

const AI_ANALYZER_REQUIRED_FIELDS = [
  "useCaseName",
  "systemType",
  "contextOfUse",
  "modelAutonomyLevel",
];

const AI_ANALYZER_SYSTEM_TYPES = [
  "Text-based conversational AI",
  "Voice-based conversational AI",
  "Decision support AI",
  "Agent assist AI",
];

const AI_ANALYZER_AUTONOMY_LEVELS = [
  "Informational only",
  "Recommendation with human decision",
  "Action execution with human override",
  "Fully autonomous action",
];

function validateGeneratedJson(data: unknown): data is AiUseCaseJson {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  for (const field of AI_ANALYZER_REQUIRED_FIELDS) {
    if (!(field in obj)) return false;
  }
  if (!AI_ANALYZER_SYSTEM_TYPES.includes(obj.systemType as string)) return false;
  if (!AI_ANALYZER_AUTONOMY_LEVELS.includes(obj.modelAutonomyLevel as string)) return false;
  return true;
}

// ── Input sanity check (gibberish detection) ──────────────────────────────────

function isValidDescription(text: string): boolean {
  if (text.trim().length < 10) return false;
  const meaningfulWords = text.trim().split(/\s+/).filter((w) => /[a-zA-Z]{2,}/.test(w));
  return meaningfulWords.length >= 3;
}

// ── Middleware: require OPENAI_API_KEY at system level ────────────────────────

function requireOpenAiKey(_req: Request, res: Response, next: NextFunction): void {
  if (!process.env.OPENAI_API_KEY) {
    res.status(500).json({ message: "Server configuration error: API key is missing" });
    return;
  }
  next();
}

// ── Rate limiter for AI analyzer endpoints ────────────────────────────────────

const aiAnalyzerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." },
});

// ── OpenAI error classifier ───────────────────────────────────────────────────

function classifyOpenAiError(err: unknown): { status: number; message: string } {
  if (err instanceof OpenAI.APIError) {
    const msg = err.message?.toLowerCase() ?? "";
    if (err.status === 429) {
      if (msg.includes("quota") || msg.includes("billing") || msg.includes("insufficient")) {
        return {
          status: 503,
          message: "Service temporarily unavailable due to billing limits. Please try again later.",
        };
      }
      return { status: 429, message: "Too many requests. Please try again later." };
    }
    if (err.status && err.status >= 500) {
      return {
        status: 502,
        message: "Unable to process request at the moment. Please try again.",
      };
    }
  }
  if (err instanceof Error) {
    const msg = err.message?.toLowerCase() ?? "";
    if (
      msg.includes("econnrefused") ||
      msg.includes("network") ||
      msg.includes("timeout") ||
      msg.includes("fetch failed")
    ) {
      return {
        status: 502,
        message: "Unable to process request at the moment. Please try again.",
      };
    }
  }
  return { status: 500, message: "An unexpected error occurred." };
}

// ── Multer for in-memory file uploads ─────────────────────────────────────────

const upload = multer({ storage: multer.memoryStorage() });

function parseCsv(buffer: Buffer): Record<string, unknown>[] {
  return parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    cast: true,
  });
}

// ── Route registration ────────────────────────────────────────────────────────

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to process file";
      res.status(400).json({ message });
    }
  });

  // Endpoint 2: Analyze fairness
  app.post(api.analyze.path, upload.single("file"), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const confirmedStr = req.body.confirmed_sensitive_columns as string | undefined;
      const mappingStr = req.body.column_mapping as string | undefined;

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

      const cols = Object.keys(records[0] || {});
      const required = [mapping.score, mapping.approved, mapping.actual_default];
      const missing = required.filter((c) => !cols.includes(c));
      if (missing.length > 0) {
        return res.status(400).json({ message: `Missing mapped columns: ${missing.join(", ")}` });
      }

      const result: {
        dataset_summary: { rows: number; sensitive_columns_analyzed: string[] };
        fairness_results: Record<string, unknown>;
      } = {
        dataset_summary: {
          rows: records.length,
          sensitive_columns_analyzed: confirmedColumns,
        },
        fairness_results: {},
      };

      for (const col of confirmedColumns) {
        const subgroups: Record<string, Record<string, unknown>[]> = {};
        for (const row of records) {
          const val = String(row[col] || "").trim();
          if (!val) continue;
          if (!subgroups[val]) subgroups[val] = [];
          subgroups[val].push(row);
        }

        const subgroupMetrics: Record<string, {
          selection_rate: number;
          tpr: number;
          fpr: number;
          precision: number;
          mean_score: number;
          count: number;
        }> = {};

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
            count: groupRecords.length,
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

        for (const [, m] of Object.entries(subgroupMetrics)) {
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
          risk_flag:
            worstAir < 0.7 || maxTprDisp > 0.1 || maxFprDisp > 0.1
              ? "HIGH"
              : worstAir < 0.8
              ? "MEDIUM"
              : "LOW",
        };

        void threshold;
      }

      res.status(200).json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      res.status(400).json({ message });
    }
  });

  // ── AI Outcome Analyzer: generate JSON from description ───────────────────
  app.post(
    "/api/ai-analyzer/generate-json",
    requireOpenAiKey,
    aiAnalyzerLimiter,
    async (req: Request, res: Response) => {
      try {
        const { description } = req.body as { description?: unknown };

        if (!description || typeof description !== "string" || !description.trim()) {
          return res.status(400).json({ message: "Description is required and cannot be empty." });
        }

        if (!isValidDescription(description)) {
          return res.status(400).json({
            message: "Please enter a meaningful description of the AI system",
          });
        }

        const prompt = `You are an expert in AI system design and schema validation. Convert the following free-text description of an AI system into a structured JSON object that strictly follows this schema:

{
  "useCaseName": "string - The name of the specific AI implementation",
  "systemType": "one of: Text-based conversational AI, Voice-based conversational AI, Decision support AI, Agent assist AI",
  "primaryFunction": "string (optional) - What the AI does",
  "contextOfUse": {
    "industry": "string - The industry",
    "environment": "one of: Internal, Customer-facing, Public"
  },
  "stakeholders": {
    "primaryUsers": ["array of strings"],
    "indirectlyAffectedParties": ["array of strings"],
    "oversightOwners": ["array of strings"]
  },
  "decisionsAndActions": {
    "decisionsMadeBySystem": ["array of strings"],
    "actionsExecutedAutomatically": ["array of strings"],
    "actionsRequiringHumanApproval": ["array of strings"]
  },
  "dataInputs": {
    "dataTypesUsed": ["array of strings"],
    "dataSources": ["array of strings"],
    "personalOrSensitiveData": boolean
  },
  "modelAutonomyLevel": "one of: Informational only, Recommendation with human decision, Action execution with human override, Fully autonomous action",
  "scaleAndReach": {
    "expectedNumberOfUsers": "string",
    "frequencyOfUse": "string",
    "geographicScope": "string"
  }
}

IMPORTANT RULES:
1. You MUST include all required fields: useCaseName, systemType, contextOfUse, modelAutonomyLevel
2. For enum fields, use EXACTLY the values specified above - no variations
3. For array fields, populate them with realistic values based on the description
4. Return ONLY valid JSON - no explanations, no markdown, no code blocks
5. If the description is unclear about a field, make reasonable inferences

Description to convert:
${description}

Return ONLY the JSON object, nothing else.`;

        const response = await getOpenAI().chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a JSON generation assistant. Return only valid JSON with no explanations or markdown.",
            },
            { role: "user", content: prompt },
          ],
        });

        const content = response.choices[0]?.message?.content ?? "";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : content;

        let generatedJson: unknown;
        try {
          generatedJson = JSON.parse(jsonString);
        } catch {
          return res.status(500).json({ message: "An unexpected error occurred." });
        }

        if (!validateGeneratedJson(generatedJson)) {
          return res.status(500).json({ message: "An unexpected error occurred." });
        }

        const body: GenerateJsonApiResponse = { json: generatedJson };
        return res.status(200).json(body);
      } catch (err: unknown) {
        const { status, message } = classifyOpenAiError(err);
        console.error("[ai-analyzer/generate-json]", err instanceof Error ? err.message : err);
        return res.status(status).json({ message });
      }
    }
  );

  // ── AI Outcome Analyzer: analyze outcomes ─────────────────────────────────
  app.post(
    "/api/ai-analyzer/analyze",
    requireOpenAiKey,
    aiAnalyzerLimiter,
    async (req: Request, res: Response) => {
      try {
        const input = req.body as Record<string, unknown>;

        for (const field of AI_ANALYZER_REQUIRED_FIELDS) {
          if (!input[field]) {
            return res.status(400).json({ message: `Missing required field: ${field}` });
          }
        }

        const modelAutonomyLevel = input.modelAutonomyLevel as string;
        const scaleAndReach = input.scaleAndReach;
        const dataInputs = input.dataInputs as { personalOrSensitiveData?: boolean } | undefined;
        const personalData = dataInputs?.personalOrSensitiveData ? "Yes" : "No";

        const prompt = `
Perform a structured ethical and impact analysis for the following AI use case provided in JSON format:
${JSON.stringify(input, null, 2)}

What are the other potential outcomes of this AI solution?

Analyze the following specifically:
- modelAutonomyLevel: ${modelAutonomyLevel}
- scaleAndReach: ${JSON.stringify(scaleAndReach) || "Not specified"}
- personalOrSensitiveData: ${personalData}

Categorize the output into exactly these 8 sections using bullet points:
1. Positive outcomes
2. Negative outcomes
3. Ethical risks
4. Legal risks
5. Social impacts
6. Economic impacts
7. Long-term systemic risks
8. Recommended Human Oversight Actions

Guidelines:
- Avoid promotional language.
- Explicitly analyze modelAutonomyLevel.
- Analyze scaleAndReach for amplified risks.
- Analyze dataInputs.personalOrSensitiveData carefully.
- Identify unintended consequences.
- Consider bias, privacy, fairness, transparency, accountability.
    `;

        const response = await getOpenAI().chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are an AI ethics and policy expert. Provide structured, critical analysis of AI use cases.",
            },
            { role: "user", content: prompt },
          ],
        });

        const analysis = response.choices[0]?.message?.content ?? "No analysis generated.";
        const body: AnalyzeApiResponse = { analysis };
        return res.status(200).json(body);
      } catch (err: unknown) {
        const { status, message } = classifyOpenAiError(err);
        console.error("[ai-analyzer/analyze]", err instanceof Error ? err.message : err);
        return res.status(status).json({ message });
      }
    }
  );

  return httpServer;
}
