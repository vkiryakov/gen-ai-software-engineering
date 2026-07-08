import {
  createTicketSchema,
  ticketClassificationSchema,
  ticketSchema,
  updateTicketSchema,
} from '@repo/contracts';

const validTicket = {
  id: 'e58ed763-928c-4155-bee9-fdbaaadc15f3',
  customer_id: 'cust-1',
  customer_email: 'ada@example.com',
  customer_name: 'Ada Lovelace',
  subject: 'Cannot log in',
  description: 'I forgot my password and cannot access my account at all.',
  category: 'account_access',
  priority: 'high',
  status: 'new',
  created_at: '2026-07-09T10:00:00.000Z',
  updated_at: '2026-07-09T10:00:00.000Z',
  resolved_at: null,
  assigned_to: null,
  tags: ['auth'],
  metadata: { source: 'web_form', device_type: 'desktop' },
};

const validClassification = {
  category: 'account_access',
  priority: 'urgent',
  confidence: 0.8,
  reasoning: 'Matched keywords: password.',
  keywords_found: ['password'],
  classified_at: '2026-07-09T10:00:00.000Z',
};

describe('ticket model contracts', () => {
  it('accepts a fully valid ticket', () => {
    expect(ticketSchema.safeParse(validTicket).success).toBe(true);
  });

  it('rejects an invalid customer email', () => {
    const result = ticketSchema.safeParse({ ...validTicket, customer_email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects a subject longer than 200 characters', () => {
    const result = ticketSchema.safeParse({ ...validTicket, subject: 'x'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('rejects a description shorter than 10 characters', () => {
    const result = ticketSchema.safeParse({ ...validTicket, description: 'too short' });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown category enum value', () => {
    const result = ticketSchema.safeParse({ ...validTicket, category: 'spam' });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown status enum value', () => {
    const result = ticketSchema.safeParse({ ...validTicket, status: 'archived' });
    expect(result.success).toBe(false);
  });

  it('rejects unknown extra fields (strict mode)', () => {
    const result = ticketSchema.safeParse({ ...validTicket, hacker: true });
    expect(result.success).toBe(false);
  });

  it('accepts a ticket carrying classification provenance', () => {
    const result = ticketSchema.safeParse({ ...validTicket, classification: validClassification });
    expect(result.success).toBe(true);
  });

  it('rejects classification confidence outside [0, 1]', () => {
    const result = ticketClassificationSchema.safeParse({ ...validClassification, confidence: 1.5 });
    expect(result.success).toBe(false);
  });

  it('accepts a minimal create payload (server-owned fields omitted)', () => {
    const result = createTicketSchema.safeParse({
      customer_id: 'cust-1',
      customer_email: 'ada@example.com',
      customer_name: 'Ada Lovelace',
      subject: 'Cannot log in',
      description: 'I forgot my password and cannot access my account at all.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects auto_classify on update payloads (omitted from updateTicketSchema)', () => {
    const result = updateTicketSchema.safeParse({ auto_classify: true });
    expect(result.success).toBe(false);
  });
});
