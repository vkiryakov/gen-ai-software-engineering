import { z } from 'zod';
import { TicketCategorySchema, TicketPrioritySchema } from './enums';

export const ClassificationResultSchema = z.object({
  category: TicketCategorySchema,
  priority: TicketPrioritySchema,
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  keywords: z.array(z.string()),
});
export type ClassificationResult = z.infer<typeof ClassificationResultSchema>;
