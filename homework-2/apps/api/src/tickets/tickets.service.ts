import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  CreateTicketInput,
  ImportSummary,
  ListTicketsQuery,
  Ticket,
  UpdateTicketInput,
} from '@repo/contracts';
import { createTicketSchema } from '@repo/contracts';
import { ClassificationService } from './classification.service';

/**
 * In-memory ticket store. Swap the `Map` for a real repository (Prisma/TypeORM)
 * without changing the controller contract.
 */
@Injectable()
export class TicketsService {
  private readonly tickets = new Map<string, Ticket>();

  constructor(private readonly classifier: ClassificationService) {}

  create(input: CreateTicketInput): Ticket {
    const now = new Date().toISOString();
    const auto = input.auto_classify
      ? this.classifier.classify(input.subject, input.description)
      : undefined;

    const ticket: Ticket = {
      id: randomUUID(),
      customer_id: input.customer_id,
      customer_email: input.customer_email,
      customer_name: input.customer_name,
      subject: input.subject,
      description: input.description,
      category: input.category ?? auto?.category ?? 'other',
      priority: input.priority ?? auto?.priority ?? 'medium',
      status: input.status ?? 'new',
      created_at: now,
      updated_at: now,
      resolved_at: null,
      assigned_to: input.assigned_to ?? null,
      tags: input.tags ?? [],
      metadata: input.metadata ?? {},
    };

    this.tickets.set(ticket.id, ticket);
    return ticket;
  }

  findAll(query: ListTicketsQuery = {}): Ticket[] {
    let result = [...this.tickets.values()];

    if (query.category) result = result.filter((t) => t.category === query.category);
    if (query.priority) result = result.filter((t) => t.priority === query.priority);
    if (query.status) result = result.filter((t) => t.status === query.status);
    if (query.assigned_to) result = result.filter((t) => t.assigned_to === query.assigned_to);
    if (query.search) {
      const needle = query.search.toLowerCase();
      result = result.filter(
        (t) =>
          t.subject.toLowerCase().includes(needle) ||
          t.description.toLowerCase().includes(needle),
      );
    }

    return result.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  findOne(id: string): Ticket {
    const ticket = this.tickets.get(id);
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
    return ticket;
  }

  update(id: string, input: UpdateTicketInput): Ticket {
    const existing = this.findOne(id);
    const nowResolved =
      input.status === 'resolved' && existing.status !== 'resolved'
        ? new Date().toISOString()
        : existing.resolved_at;

    const updated: Ticket = {
      ...existing,
      ...input,
      metadata: input.metadata ?? existing.metadata,
      tags: input.tags ?? existing.tags,
      resolved_at: nowResolved,
      updated_at: new Date().toISOString(),
    };

    this.tickets.set(id, updated);
    return updated;
  }

  remove(id: string): void {
    if (!this.tickets.delete(id)) throw new NotFoundException(`Ticket ${id} not found`);
  }

  /** Auto-classify an existing ticket and persist the derived fields. */
  autoClassify(id: string) {
    const ticket = this.findOne(id);
    const result = this.classifier.classify(ticket.subject, ticket.description);
    this.update(id, { category: result.category, priority: result.priority });
    return result;
  }

  /** Bulk import a JSON array of ticket payloads, returning a per-row summary. */
  importJson(rows: unknown[]): ImportSummary {
    const summary: ImportSummary = {
      total: rows.length,
      successful: 0,
      failed: 0,
      errors: [],
    };

    rows.forEach((row, index) => {
      const parsed = createTicketSchema.safeParse(row);
      if (parsed.success) {
        this.create(parsed.data);
        summary.successful += 1;
      } else {
        summary.failed += 1;
        const firstIssue = parsed.error.errors[0];
        summary.errors.push({
          row: index,
          field: firstIssue?.path.join('.'),
          message: firstIssue?.message ?? 'Invalid record',
        });
      }
    });

    return summary;
  }
}
