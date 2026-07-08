import { z } from 'zod';

/** Supported bulk-import file formats (Task 1). */
export const importFormatSchema = z.enum(['csv', 'json', 'xml']);
export type ImportFormat = z.infer<typeof importFormatSchema>;

/** A single row-level failure in a bulk import. */
export const importErrorSchema = z
  .object({
    row: z.number().int().nonnegative(),
    message: z.string(),
    field: z.string().optional(),
  })
  .strict();

export type ImportError = z.infer<typeof importErrorSchema>;

/** Summary returned by `POST /tickets/import`. */
export const importSummarySchema = z
  .object({
    total: z.number().int().nonnegative(),
    successful: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    errors: z.array(importErrorSchema),
  })
  .strict();

export type ImportSummary = z.infer<typeof importSummarySchema>;
