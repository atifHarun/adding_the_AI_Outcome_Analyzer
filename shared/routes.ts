import { z } from 'zod';
import { analyzeResponseSchema, columnMappingSchema } from './schema';

export const api = {
  detectSensitive: {
    method: 'POST' as const,
    path: '/api/detect-sensitive' as const,
    responses: {
      200: z.object({
        all_columns: z.array(z.string()),
      }),
      400: z.object({ message: z.string() })
    },
  },
  analyze: {
    method: 'POST' as const,
    path: '/api/analyze' as const,
    responses: {
      200: analyzeResponseSchema,
      400: z.object({ message: z.string() })
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
