import { z } from 'zod';
import { ticketClassificationSchema } from './classification.js';
import {
  deviceTypeSchema,
  ticketCategorySchema,
  ticketPrioritySchema,
  ticketSourceSchema,
  ticketStatusSchema,
} from './enums.js';

/** Optional per-ticket metadata captured at intake. */
export const ticketMetadataSchema = z
  .object({
    source: ticketSourceSchema.optional(),
    browser: z.string().max(200).optional(),
    device_type: deviceTypeSchema.optional(),
  })
  .strict();

export type TicketMetadata = z.infer<typeof ticketMetadataSchema>;

/** The canonical, persisted ticket entity. */
export const ticketSchema = z
  .object({
    id: z.string().uuid(),
    customer_id: z.string().min(1),
    customer_email: z.string().email(),
    customer_name: z.string().min(1).max(200),
    subject: z.string().min(1).max(200),
    description: z.string().min(10).max(2000),
    category: ticketCategorySchema,
    priority: ticketPrioritySchema,
    status: ticketStatusSchema,
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
    resolved_at: z.string().datetime().nullable(),
    assigned_to: z.string().nullable(),
    tags: z.array(z.string()),
    metadata: ticketMetadataSchema,
    /** Provenance of the last auto-classification run, if any. */
    classification: ticketClassificationSchema.optional(),
  })
  .strict();

export type Ticket = z.infer<typeof ticketSchema>;

/**
 * Payload for creating a ticket. Server-owned fields (id, timestamps, status)
 * are omitted; category/priority are optional so auto-classification can fill them.
 */
export const createTicketSchema = z
  .object({
    customer_id: z.string().min(1),
    customer_email: z.string().email(),
    customer_name: z.string().min(1).max(200),
    subject: z.string().min(1).max(200),
    description: z.string().min(10).max(2000),
    category: ticketCategorySchema.optional(),
    priority: ticketPrioritySchema.optional(),
    status: ticketStatusSchema.optional(),
    assigned_to: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
    metadata: ticketMetadataSchema.optional(),
    /** When true, run auto-classification on creation. */
    auto_classify: z.boolean().optional(),
  })
  .strict();

export type CreateTicketInput = z.infer<typeof createTicketSchema>;

/** Partial update. All fields are optional; an empty payload is a no-op update that only bumps `updated_at`. */
export const updateTicketSchema = createTicketSchema.partial().omit({ auto_classify: true });

export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;

/** Query filters accepted by `GET /tickets`. */
export const listTicketsQuerySchema = z
  .object({
    category: ticketCategorySchema.optional(),
    priority: ticketPrioritySchema.optional(),
    status: ticketStatusSchema.optional(),
    assigned_to: z.string().optional(),
    search: z.string().optional(),
  })
  .strict();

export type ListTicketsQuery = z.infer<typeof listTicketsQuerySchema>;
