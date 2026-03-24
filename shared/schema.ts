import { z } from "zod";

// Zod schemas for the fairness API types
export const subgroupMetricsSchema = z.object({
  selection_rate: z.number(),
  tpr: z.number(),
  fpr: z.number(),
  precision: z.number(),
  mean_score: z.number(),
  count: z.number(),
});

export const disparitySchema = z.object({
  air: z.number(),
  tpr_disparity: z.number(),
  fpr_disparity: z.number(),
  predictive_parity_diff: z.number(),
  score_distribution_diff: z.number(),
});

export const sensitiveAttributeResultSchema = z.object({
  subgroups: z.record(z.string(), subgroupMetricsSchema),
  disparities: disparitySchema,
  risk_flag: z.enum(["LOW", "MEDIUM", "HIGH"]),
});

export const analyzeResponseSchema = z.object({
  dataset_summary: z.object({
    rows: z.number(),
    sensitive_columns_analyzed: z.array(z.string()),
  }),
  fairness_results: z.record(z.string(), sensitiveAttributeResultSchema),
});

export const columnMappingSchema = z.object({
  score: z.string(),
  approved: z.string(),
  actual_default: z.string(),
});

export type ColumnMapping = z.infer<typeof columnMappingSchema>;
