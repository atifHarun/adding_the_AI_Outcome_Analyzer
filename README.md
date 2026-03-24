# Package 1: One-Time Static Fairness Audit

This is a production-ready, minimal MVP for the One-Time Static Fairness Audit for Credit Scoring Models. It runs a purely API-first backend in Node.js/TypeScript that computes fairness metrics (Adverse Impact Ratio, TPR/FPR disparity, predictive parity difference, and score distribution shift).

## Architecture Overview

The project is structured with a strict separation between a core API backend and a minimal, swappable React frontend.

- **Backend (Core Engine)**: Built with Express, running in-memory (no database) to parse CSV files securely and perform subgroup fairness analysis. The data models and types are shared via `shared/schema.ts`.
- **Frontend (Thin Layer)**: Built with React and Vite. It consumes the API strictly through endpoints and maintains purely in-memory UI state, without implementing any fairness logic itself.

## How to Run Locally

1. Start the application:
   ```bash
   npm run dev
   ```
2. The server will start on port `5000` (or as specified by the `PORT` env var). 
3. The Vite frontend will serve the UI concurrently. You can visit the provided preview URL.

## API Endpoints

### 1. `POST /api/detect-sensitive`
Upload a dataset to automatically detect potential categorical sensitive columns.

**Example `curl` Command:**
```bash
curl -X POST -F "file=@your_dataset.csv" http://localhost:5000/api/detect-sensitive
```

**Example Output:**
```json
{
  "proposed_sensitive_columns": ["gender", "region", "age_band"]
}
```

### 2. `POST /api/analyze`
Trigger fairness analysis on specific approved columns.

**Example `curl` Command:**
```bash
curl -X POST \
  -F "file=@your_dataset.csv" \
  -F 'confirmed_sensitive_columns=["gender"]' \
  -F "threshold=0.5" \
  http://localhost:5000/api/analyze
```

**Example Output:**
```json
{
  "dataset_summary": {
    "rows": 10000,
    "sensitive_columns_analyzed": ["gender"]
  },
  "fairness_results": {
    "gender": {
      "subgroups": {
        "male": {
          "selection_rate": 0.8,
          "tpr": 0.85,
          "fpr": 0.15,
          "precision": 0.9,
          "mean_score": 0.75,
          "count": 5000
        },
        "female": {
          "selection_rate": 0.6,
          "tpr": 0.7,
          "fpr": 0.1,
          "precision": 0.85,
          "mean_score": 0.65,
          "count": 5000
        }
      },
      "disparities": {
        "air": 0.75,
        "tpr_disparity": 0.15,
        "fpr_disparity": 0.05,
        "predictive_parity_diff": 0.05,
        "score_distribution_diff": 0.1
      },
      "risk_flag": "MEDIUM"
    }
  }
}
```

## Frontend Connection

The frontend uses `@tanstack/react-query` to manage API requests. It follows a wizard flow:
1. It sends the CSV as `multipart/form-data` to `/api/detect-sensitive`.
2. It displays the `proposed_sensitive_columns` response as selectable pills.
3. Upon approval, it sends the original CSV along with `confirmed_sensitive_columns` to `/api/analyze`.
4. The frontend visualizes the returned `fairness_results` JSON structure.
