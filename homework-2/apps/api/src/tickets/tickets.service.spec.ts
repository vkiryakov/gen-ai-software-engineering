import { NotFoundException } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsRepository } from './tickets.repository';
import { ClassificationService } from './classification/classification.service';
import { CreateTicketInput } from '@repo/contracts';

const validInput: CreateTicketInput = {
  customer_email: 'alice@example.com',
  customer_name: 'Alice Smith',
  subject: 'Cannot log in',
  description: 'I forgot my password and cannot log in to my account after resetting it.',
};

describe('TicketsService', () => {
  let service: TicketsService;

  beforeEach(() => {
    service = new TicketsService(new TicketsRepository(), new ClassificationService());
  });

  it('creates a ticket defaulting category/priority/status when not given', () => {
    const ticket = service.create(validInput);
    expect(ticket.category).toBe('other');
    expect(ticket.priority).toBe('medium');
    expect(ticket.status).toBe('new');
    expect(ticket.number).toBeGreaterThan(0);
  });

  it('does not expose classification_confidence on the public ticket', () => {
    const ticket = service.create(validInput);
    expect(ticket).not.toHaveProperty('classification_confidence');
  });

  it('auto-classifies on create when auto_classify is true', () => {
    const ticket = service.create({
      ...validInput,
      subject: "Can't access my account, this is critical",
      description: 'I cannot log in at all and this is blocking my whole team urgently.',
      auto_classify: true,
    });
    expect(ticket.category).toBe('account_access');
    expect(ticket.priority).toBe('urgent');
  });

  it('gets a ticket by id', () => {
    const created = service.create(validInput);
    expect(service.getById(created.id).id).toBe(created.id);
  });

  it('throws NotFoundException when getting a missing ticket', () => {
    expect(() => service.getById('missing')).toThrow(NotFoundException);
  });

  it('updates a ticket and bumps updated_at', () => {
    const created = service.create(validInput);
    const updated = service.update(created.id, { priority: 'high' });
    expect(updated.priority).toBe('high');
    expect(updated.updated_at).not.toBe(created.updated_at);
  });

  it('auto-sets resolved_at when status transitions to resolved', () => {
    const created = service.create(validInput);
    const updated = service.update(created.id, { status: 'resolved' });
    expect(updated.resolved_at).not.toBeNull();
  });

  it('honors an explicit resolved_at from the patch', () => {
    const created = service.create(validInput);
    const updated = service.update(created.id, { status: 'resolved', resolved_at: '2026-02-02T00:00:00.000Z' });
    expect(updated.resolved_at).toBe('2026-02-02T00:00:00.000Z');
  });

  it('throws NotFoundException when updating a missing ticket', () => {
    expect(() => service.update('missing', { priority: 'high' })).toThrow(NotFoundException);
  });

  it('deletes a ticket', () => {
    const created = service.create(validInput);
    service.delete(created.id);
    expect(() => service.getById(created.id)).toThrow(NotFoundException);
  });

  it('throws NotFoundException when deleting a missing ticket', () => {
    expect(() => service.delete('missing')).toThrow(NotFoundException);
  });

  it('lists tickets filtered by status and priority together', () => {
    service.create({ ...validInput, priority: 'urgent', status: 'new' });
    service.create({ ...validInput, priority: 'low', status: 'resolved' });
    const result = service.list({ status: ['new'], priority: ['urgent'] });
    expect(result).toHaveLength(1);
    expect(result[0].priority).toBe('urgent');
  });

  it('classifies an existing ticket and persists the result', () => {
    const created = service.create({
      ...validInput,
      subject: "Can't access my account",
      description: 'I cannot log in and need urgent help with this critical issue.',
    });
    const result = service.classify(created.id);
    expect(result.category).toBe('account_access');
    const refreshed = service.getById(created.id);
    expect(refreshed.category).toBe(result.category);
    expect(refreshed.priority).toBe(result.priority);
  });
});
