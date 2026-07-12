import { TicketsRepository } from './tickets.repository';
import { Ticket } from '@repo/contracts';

const baseData: Omit<Ticket, 'id' | 'number'> & { classification_confidence: null } = {
  customer_id: 'cus_alice',
  customer_email: 'alice@example.com',
  customer_name: 'Alice Smith',
  subject: 'Cannot log in',
  description: 'I forgot my password and cannot log in to my account after resetting it.',
  category: 'account_access',
  priority: 'high',
  status: 'new',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  resolved_at: null,
  assigned_to: null,
  tags: [],
  metadata: { source: 'web_form', browser: '—', device_type: 'desktop' },
  classification_confidence: null,
};

describe('TicketsRepository', () => {
  let repo: TicketsRepository;

  beforeEach(() => {
    repo = new TicketsRepository();
  });

  it('creates a ticket with a generated id and an auto-incrementing number', () => {
    const first = repo.create(baseData);
    const second = repo.create(baseData);
    expect(first.id).not.toEqual(second.id);
    expect(second.number).toBe(first.number + 1);
  });

  it('finds a ticket by id', () => {
    const created = repo.create(baseData);
    expect(repo.findById(created.id)).toEqual(created);
  });

  it('returns undefined for a missing id', () => {
    expect(repo.findById('does-not-exist')).toBeUndefined();
  });

  it('lists all created tickets', () => {
    repo.create(baseData);
    repo.create(baseData);
    expect(repo.findAll()).toHaveLength(2);
  });

  it('updates a ticket by merging the patch', () => {
    const created = repo.create(baseData);
    const updated = repo.update(created.id, { status: 'resolved' });
    expect(updated?.status).toBe('resolved');
    expect(updated?.subject).toBe(baseData.subject);
  });

  it('returns undefined when updating a missing id', () => {
    expect(repo.update('does-not-exist', { status: 'resolved' })).toBeUndefined();
  });

  it('deletes a ticket and reports success', () => {
    const created = repo.create(baseData);
    expect(repo.delete(created.id)).toBe(true);
    expect(repo.findById(created.id)).toBeUndefined();
  });

  it('reports failure deleting a missing id', () => {
    expect(repo.delete('does-not-exist')).toBe(false);
  });
});
