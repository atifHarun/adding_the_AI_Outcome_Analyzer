export interface ScanResult {
  scan_id: string;
  tool: string;
  timestamp: number;
  scores?: Record<string, number>;
  risks?: Array<{ id: string; severity: "low" | "medium" | "high"; message: string }>;
  metadata?: Record<string, any>;
}

export interface ResultsStore {
  save(result: ScanResult): void;
  get(scan_id: string): ScanResult | null;
  list(): ScanResult[];
  clear(): void;
}
