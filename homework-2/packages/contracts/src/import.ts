import { z } from 'zod';

export const ImportErrorSchema = z.object({
  row: z.number().int(),
  message: z.string(),
});
export type ImportError = z.infer<typeof ImportErrorSchema>;

export const ImportSummarySchema = z.object({
  imported_count: z.number().int(),
  failed_count: z.number().int(),
  total_count: z.number().int(),
  errors: z.array(ImportErrorSchema),
});
export type ImportSummary = z.infer<typeof ImportSummarySchema>;
