export interface DatasetScanResponse {
  dataset_summary: {
    columns: number;
    rows: number;
  };
  signals: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    location?: {
      row?: number;
      column?: string;
    };
  }>;
  signals_detected: number;
  score: number;
  risk_level: 'low' | 'medium' | 'high';
  timestamp: number;
  tool: string;
}

export async function scanDataset(file: File): Promise<DatasetScanResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('http://localhost:8000/scan-dataset', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Dataset scan failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Dataset scan error:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Unknown error occurred during dataset scan'
    );
  }
}
