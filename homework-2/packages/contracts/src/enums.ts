import { z } from 'zod';

/**
 * Domain enums for the support ticket system.
 * Each is declared as a readonly tuple so it can back both a Zod enum
 * (runtime validation) and a TypeScript union (compile-time types).
 */

export const TICKET_CATEGORIES = [
  'account_access',
  'technical_issue',
  'billing_question',
  'feature_request',
  'bug_report',
  'other',
] as const;

export const TICKET_PRIORITIES = ['urgent', 'high', 'medium', 'low'] as const;

export const TICKET_STATUSES = [
  'new',
  'in_progress',
  'waiting_customer',
  'resolved',
  'closed',
] as const;

export const TICKET_SOURCES = ['web_form', 'email', 'api', 'chat', 'phone'] as const;

export const DEVICE_TYPES = ['desktop', 'mobile', 'tablet'] as const;

export const ticketCategorySchema = z.enum(TICKET_CATEGORIES);
export const ticketPrioritySchema = z.enum(TICKET_PRIORITIES);
export const ticketStatusSchema = z.enum(TICKET_STATUSES);
export const ticketSourceSchema = z.enum(TICKET_SOURCES);
export const deviceTypeSchema = z.enum(DEVICE_TYPES);

export type TicketCategory = z.infer<typeof ticketCategorySchema>;
export type TicketPriority = z.infer<typeof ticketPrioritySchema>;
export type TicketStatus = z.infer<typeof ticketStatusSchema>;
export type TicketSource = z.infer<typeof ticketSourceSchema>;
export type DeviceType = z.infer<typeof deviceTypeSchema>;
