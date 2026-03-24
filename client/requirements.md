## Packages
framer-motion | Page transitions and step-by-step wizard animations
recharts | Data visualization for subgroup fairness metrics
clsx | Utility for constructing className strings conditionally
tailwind-merge | Utility for merging tailwind classes without style conflicts

## Notes
- Endpoints `POST /api/detect-sensitive` and `POST /api/analyze` expect `multipart/form-data`
- The file input field must be named `file`
- The configuration fields (`confirmed_sensitive_columns`, `threshold`) must be sent alongside the file in the second step
- Application uses purely in-memory state for the 3-step wizard flow, no database persistence required
