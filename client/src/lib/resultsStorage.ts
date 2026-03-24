export interface AnalysisResults {
  industry: string;
  model_type: string;
  tool: string;
  fairness_metrics: {
    statistical_parity: number;
    equal_opportunity: number;
    disparate_impact: number;
    accuracy: number;
  };
  fairness_score: number;
  trust_score: number;
  timestamp: number;
}

// New standardized result envelope
export interface ResultEnvelope {
  tool: string;
  category: string;
  score: number;
  risk_level: 'low' | 'medium' | 'high';
  timestamp: number;
  details: Record<string, any>;
}

// Legacy format detection
interface LegacyResult {
  tool?: string;
  fairness_score?: number;
  trust_score?: number;
  fairness_metrics?: any;
  industry?: string;
  model_type?: string;
  timestamp?: number;
}

const STORAGE_KEY = 'ai-governance-results';

// Auto category mapping
function inferCategory(toolName: string): string {
  const normalizedTool = toolName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  if (normalizedTool.includes('fairness') || normalizedTool.includes('bias') || normalizedTool.includes('credit')) {
    return 'model_fairness';
  }
  if (normalizedTool.includes('dataset') || normalizedTool.includes('data')) {
    return 'dataset_governance';
  }
  if (normalizedTool.includes('explainability') || normalizedTool.includes('transparency')) {
    return 'model_transparency';
  }
  if (normalizedTool.includes('safety') || normalizedTool.includes('adversarial') || normalizedTool.includes('risk')) {
    return 'model_safety';
  }
  if (normalizedTool.includes('compliance') || normalizedTool.includes('regulation')) {
    return 'compliance';
  }
  
  return 'other';
}

// Calculate risk level from score
function calculateRiskLevel(score: number): 'low' | 'medium' | 'high' {
  if (score >= 80) return 'low';
  if (score >= 60) return 'medium';
  return 'high';
}

// Detect if data is in old format
function isLegacyFormat(data: any): data is LegacyResult {
  return data && (
    data.fairness_score !== undefined ||
    data.trust_score !== undefined ||
    data.fairness_metrics !== undefined ||
    data.industry !== undefined ||
    data.model_type !== undefined
  ) && !data.category; // Check for missing envelope fields
}

// Convert legacy format to new envelope
function convertLegacyToEnvelope(legacyData: LegacyResult): ResultEnvelope {
  const score = legacyData.fairness_score || legacyData.trust_score || 0;
  const toolName = legacyData.tool || 'legacy_fairness_analyzer';
  
  return {
    tool: toolName,
    category: inferCategory(toolName),
    score: score,
    risk_level: calculateRiskLevel(score),
    timestamp: legacyData.timestamp || Date.now(),
    details: {
      fairness_metrics: legacyData.fairness_metrics,
      industry: legacyData.industry,
      model_type: legacyData.model_type,
      trust_score: legacyData.trust_score,
      fairness_score: legacyData.fairness_score,
      ...legacyData
    }
  };
}

export const resultsStorage = {
  save: (results: Omit<AnalysisResults, 'timestamp'> | ResultEnvelope | Omit<ResultEnvelope, 'timestamp'>) => {
    try {
      // Read existing results
      const stored = localStorage.getItem(STORAGE_KEY);
      let existingResults: Record<string, ResultEnvelope> = {};
      
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Detect and convert legacy format
        if (isLegacyFormat(parsed)) {
          const envelope = convertLegacyToEnvelope(parsed);
          existingResults[envelope.tool] = envelope;
        } else {
          existingResults = parsed;
        }
      }

      // Determine if this is legacy format or new format
      let resultEnvelope: ResultEnvelope;
      
      if ('fairness_score' in results || 'fairness_metrics' in results) {
        // Legacy format - convert to envelope
        const legacyResults = results as Omit<AnalysisResults, 'timestamp'>;
        const score = legacyResults.fairness_score || legacyResults.trust_score || 0;
        const toolName = legacyResults.tool || 'model_fairness_analyzer';
        
        resultEnvelope = {
          tool: toolName,
          category: inferCategory(toolName),
          score: score,
          risk_level: calculateRiskLevel(score),
          timestamp: Date.now(),
          details: legacyResults
        };
      } else {
        // New envelope format
        const envelopeInput = results as Omit<ResultEnvelope, 'timestamp'>;
        resultEnvelope = {
          ...envelopeInput,
          timestamp: Date.now(),
          category: envelopeInput.category || inferCategory(envelopeInput.tool),
          risk_level: envelopeInput.risk_level || calculateRiskLevel(envelopeInput.score)
        };
      }

      // Store using tool as key
      existingResults[resultEnvelope.tool] = resultEnvelope;
      
      // Save back to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existingResults));
    } catch (error) {
      console.error('Error saving results:', error);
      throw new Error('Failed to save analysis results');
    }
  },

  get: (): ResultEnvelope | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      
      // Handle legacy format
      if (isLegacyFormat(parsed)) {
        const envelope = convertLegacyToEnvelope(parsed);
        // Auto-migrate to new format
        resultsStorage.save(envelope);
        return envelope;
      }
      
      // Return the most recent result (for backward compatibility)
      const results = parsed as Record<string, ResultEnvelope>;
      const resultArray = Object.values(results);
      
      if (resultArray.length === 0) return null;
      
      // Return the most recent result
      return resultArray.reduce((mostRecent, current) => 
        current.timestamp > mostRecent.timestamp ? current : mostRecent
      );
    } catch (error) {
      console.error('Error getting results:', error);
      return null;
    }
  },

  // New helper functions
  getToolResults: (toolName: string): ResultEnvelope | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      
      // Handle legacy format
      if (isLegacyFormat(parsed)) {
        const envelope = convertLegacyToEnvelope(parsed);
        // Auto-migrate to new format
        resultsStorage.save(envelope);
        return envelope.tool === toolName ? envelope : null;
      }
      
      const results = parsed as Record<string, ResultEnvelope>;
      return results[toolName] || null;
    } catch (error) {
      console.error('Error getting tool results:', error);
      return null;
    }
  },

  getAllResults: (): Record<string, ResultEnvelope> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return {};
      
      const parsed = JSON.parse(stored);
      
      // Handle legacy format
      if (isLegacyFormat(parsed)) {
        const envelope = convertLegacyToEnvelope(parsed);
        // Auto-migrate to new format
        resultsStorage.save(envelope);
        return { [envelope.tool]: envelope };
      }
      
      return parsed as Record<string, ResultEnvelope>;
    } catch (error) {
      console.error('Error getting all results:', error);
      return {};
    }
  },

  clear: () => {
    localStorage.removeItem(STORAGE_KEY);
  },
};
