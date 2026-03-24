export function generateReport(scans: any[]) {
  return {
    generated_at: Date.now(),
    summary: {
      total_scans: scans.length
    },
    scans
  };
}
