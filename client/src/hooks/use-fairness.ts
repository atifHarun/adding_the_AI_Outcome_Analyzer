import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Create custom parsers that log validation errors to help debug mismatches
function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw new Error(`Invalid response format from server: ${result.error.errors[0].message}`);
  }
  return result.data;
}

export function useDetectSensitive() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(api.detectSensitive.path, {
        method: api.detectSensitive.method,
        body: formData,
        // Omit Content-Type so browser sets multipart/form-data with boundary
      });

      if (!res.ok) {
        let errorMessage = "Failed to process dataset";
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // Ignore json parse errors for text responses
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      return parseWithLogging(api.detectSensitive.responses[200], data, "detectSensitive");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Detection Failed",
        description: error.message,
      });
    },
  });
}

export function useAnalyze() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      file,
      columns,
      threshold,
      mapping,
    }: {
      file: File;
      columns: string[];
      threshold: number;
      mapping: { score: string; approved: string; actual_default: string };
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("confirmed_sensitive_columns", JSON.stringify(columns));
      formData.append("threshold", threshold.toString());
      formData.append("column_mapping", JSON.stringify(mapping));

      const res = await fetch(api.analyze.path, {
        method: api.analyze.method,
        body: formData,
      });

      if (!res.ok) {
        let errorMessage = "Analysis failed";
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {}
        throw new Error(errorMessage);
      }

      const data = await res.json();
      // Ensure we parse dates or numbers correctly per schema
      return parseWithLogging(api.analyze.responses[200], data, "analyze");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error.message,
      });
    },
  });
}
