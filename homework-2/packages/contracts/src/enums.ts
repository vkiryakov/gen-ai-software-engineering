import { z } from 'zod';

export const TicketCategorySchema = z.enum([
  'account_access',
  'technical_issue',
  'billing_question',
  'feature_request',
  'bug_report',
  'other',
]);
export type TicketCategory = z.infer<typeof TicketCategorySchema>;

export const TicketPrioritySchema = z.enum(['urgent', 'high', 'medium', 'low']);
export type TicketPriority = z.infer<typeof TicketPrioritySchema>;

export const TicketStatusSchema = z.enum([
  'new',
  'in_progress',
  'waiting_customer',
  'resolved',
  'closed',
]);
export type TicketStatus = z.infer<typeof TicketStatusSchema>;

export const TicketSourceSchema = z.enum(['web_form', 'email', 'api', 'chat', 'phone']);
export type TicketSource = z.infer<typeof TicketSourceSchema>;

export const DeviceTypeSchema = z.enum(['desktop', 'mobile', 'tablet']);
export type DeviceType = z.infer<typeof DeviceTypeSchema>;
