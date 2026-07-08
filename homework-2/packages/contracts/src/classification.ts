import { z } from 'zod';
import { ticketCategorySchema, ticketPrioritySchema } from './enums.js';

/** Result of running auto-classification on a ticket (Task 2). */
export const classificationResultSchema = z
  .object({
    category: ticketCategorySchema,
    priority: ticketPrioritySchema,
    /** Confidence in [0, 1]. */
    confidence: z.number().min(0).max(1),
    reasoning: z.string(),
    keywords_found: z.array(z.string()),
  })
  .strict();

export type ClassificationResult = z.infer<typeof classificationResultSchema>;
