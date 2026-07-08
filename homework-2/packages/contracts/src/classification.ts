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

/**
 * Classification provenance persisted on a ticket: what the classifier said, and when.
 * The ticket's own category/priority remain the operative values.
 */
export const ticketClassificationSchema = classificationResultSchema.extend({
  classified_at: z.string().datetime(),
});

export type TicketClassification = z.infer<typeof ticketClassificationSchema>;
