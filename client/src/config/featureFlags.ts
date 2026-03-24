export const FEATURE_FLAGS = {

  tools:{
  // Fairness & Bias Monitoring
  model_fairness_analyzer: true,
  fairness_analyzer_monitor: false,
  hiring_bias_monitor: false,

  // Data Governance
  data_minimization_analyzer: false,
  data_risk_analyzer: true,
  model_explainability_monitor: false,

  // AI Safety & Reliability
  prompt_risk_analyzer: false,
  hallucination_monitor: false,
  adversarial_risk_scanner: false,
  regulation_checker: false,
  },
  // Model Types
  modelTypes: {
    classification: true,
    regression: false,
    clustering: false,
    anomaly_detection: false,
    recommendation: false,
    generative: false,
    llm: false
  }
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS.tools;

export function isFeatureEnabled(feature: FeatureFlag): boolean {
  return FEATURE_FLAGS.tools[feature];
}
