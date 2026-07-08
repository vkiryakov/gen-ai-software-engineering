import { NotFoundException } from '@nestjs/common';
import type { CreateTicketInput } from '@repo/contracts';
import { ClassificationService } from './classification.service';
import { TicketsService } from './tickets.service';

const base: CreateTicketInput = {
  customer_id: 'cust-1',
  customer_email: 'user@example.com',
  customer_name: 'Ada Lovelace',
  subject: 'Cannot log in',
  description: 'I forgot my password and cannot access my account at all.',
};

describe('TicketsService', () => {
  let service: TicketsService;

  beforeEach(() => {
    service = new TicketsService(new ClassificationService());
  });

  it('creates a ticket with server-owned defaults', () => {
    const ticket = service.create(base);
    expect(ticket.id).toMatch(/[0-9a-f-]{36}/);
    expect(ticket.status).toBe('new');
    expect(ticket.resolved_at).toBeNull();
    expect(ticket.created_at).toBe(ticket.updated_at);
  });

  it('auto-classifies on creation when requested', () => {
    const ticket = service.create({ ...base, auto_classify: true });
    expect(ticket.category).toBe('account_access');
  });

  it('filters by priority', () => {
    service.create({ ...base, priority: 'high' });
    service.create({ ...base, priority: 'low' });
    expect(service.findAll({ priority: 'high' })).toHaveLength(1);
  });

  it('sets resolved_at when status transitions to resolved', () => {
    const created = service.create(base);
    const updated = service.update(created.id, { status: 'resolved' });
    expect(updated.resolved_at).not.toBeNull();
  });

  it('throws NotFound for missing ids', () => {
    expect(() => service.findOne('nope')).toThrow(NotFoundException);
  });

  it('summarizes a JSON import with row-level errors', () => {
    const summary = service.importJson([base, { customer_id: 'x' }]);
    expect(summary.total).toBe(2);
    expect(summary.successful).toBe(1);
    expect(summary.failed).toBe(1);
    expect(summary.errors[0].row).toBe(1);
  });
});
