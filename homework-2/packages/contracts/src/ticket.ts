import { z } from 'zod';
import {
  TicketCategorySchema,
  TicketPrioritySchema,
  TicketStatusSchema,
  TicketSourceSchema,
  DeviceTypeSchema,
} from './enums';

export const TicketMetadataSchema = z.object({
  source: TicketSourceSchema,
  browser: z.string(),
  device_type: DeviceTypeSchema,
});
export type TicketMetadata = z.infer<typeof TicketMetadataSchema>;

export const TicketSchema = z.object({
  id: z.string(),
  number: z.number().int(),
  customer_id: z.string(),
  customer_email: z.string().email(),
  customer_name: z.string(),
  subject: z.string().min(1).max(200),
  description: z.string().min(10).max(2000),
  category: TicketCategorySchema,
  priority: TicketPrioritySchema,
  status: TicketStatusSchema,
  created_at: z.string(),
  updated_at: z.string(),
  resolved_at: z.string().nullable(),
  assigned_to: z.string().nullable(),
  tags: z.array(z.string()),
  metadata: TicketMetadataSchema,
});
export type Ticket = z.infer<typeof TicketSchema>;

export const CreateTicketInputSchema = z.object({
  customer_email: z.string().email(),
  customer_name: z.string().min(1),
  subject: z.string().min(1).max(200),
  description: z.string().min(10).max(2000),
  category: TicketCategorySchema.optional(),
  priority: TicketPrioritySchema.optional(),
  status: TicketStatusSchema.optional(),
  resolved_at: z.string().nullable().optional(),
  assigned_to: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z
    .object({
      source: TicketSourceSchema.optional(),
      browser: z.string().optional(),
      device_type: DeviceTypeSchema.optional(),
    })
    .optional(),
  auto_classify: z.boolean().optional(),
});
export type CreateTicketInput = z.infer<typeof CreateTicketInputSchema>;

export const UpdateTicketInputSchema = CreateTicketInputSchema.partial();
export type UpdateTicketInput = z.infer<typeof UpdateTicketInputSchema>;
