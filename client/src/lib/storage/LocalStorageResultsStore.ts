import { ScanResult, ResultsStore } from '@/types/results';

const STORAGE_KEY = 'ai-governance-results';

export class LocalStorageResultsStore implements ResultsStore {
  private getStoredResults(): ScanResult[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      
      // Check if stored data is in the old format (object) or new format (array)
      if (Array.isArray(parsed)) {
        return parsed;
      } else {
        // Convert old format to new array format
        // For now, return empty array - migration can be done later
        return [];
      }
    } catch (error) {
      console.error('Error reading stored results:', error);
      return [];
    }
  }

  private saveToStorage(results: ScanResult[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
    } catch (error) {
      console.error('Error saving results to storage:', error);
      throw new Error('Failed to save results');
    }
  }

  save(result: ScanResult): void {
    const currentResults = this.getStoredResults();
    currentResults.push(result);
    this.saveToStorage(currentResults);
  }

  get(scan_id: string): ScanResult | null {
    const results = this.getStoredResults();
    return results.find(result => result.scan_id === scan_id) || null;
  }

  list(): ScanResult[] {
    return this.getStoredResults();
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
