import { identity } from "@/lib/identity/identity";

export function buildScanResult({
  tool,
  tool_label,
  scores = {},
  risks = [],
  metadata = {}
}: {
  tool: string;
  tool_label?: string;
  scores?: Record<string, number>;
  risks?: Array<{ id: string; severity: "low" | "medium" | "high"; message: string }>;
  metadata?: Record<string, any>;
}) {
  return {
    scan_id: Date.now().toString(),
    tool,
    tool_label: tool_label || tool,
    timestamp: Date.now(),
    user_id: identity.getUserId(),
    scores,
    risks,
    metadata
  };
}
