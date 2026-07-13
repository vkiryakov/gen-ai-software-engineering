import { Injectable, NotFoundException } from '@nestjs/common';
import { ClassificationResult, CreateTicketInput, Ticket, UpdateTicketInput } from '@repo/contracts';
import { StoredTicket, TicketsRepository } from './tickets.repository';
import { ClassificationService } from './classification/classification.service';

export interface TicketFilters {
  status?: string[];
  priority?: string[];
  category?: string[];
  assigned_to?: string;
  unassigned?: boolean;
  q?: string;
}

@Injectable()
export class TicketsService {
  private lastTimestamp = 0;

  constructor(
    private readonly repository: TicketsRepository,
    private readonly classificationService: ClassificationService,
  ) {}

  /**
   * Returns an ISO timestamp guaranteed to be strictly greater than the
   * previous one returned by this instance. `Date.now()` only has
   * millisecond resolution, so two calls issued back-to-back (e.g. create()
   * immediately followed by update()) can otherwise produce identical
   * timestamps, which breaks updated_at-based ordering/change detection.
   */
  private timestamp(): string {
    const now = Date.now();
    const ts = now > this.lastTimestamp ? now : this.lastTimestamp + 1;
    this.lastTimestamp = ts;
    return new Date(ts).toISOString();
  }

  list(filters: TicketFilters): Ticket[] {
    let list = this.repository.findAll();
    if (filters.status?.length) list = list.filter((t) => filters.status!.includes(t.status));
    if (filters.priority?.length) list = list.filter((t) => filters.priority!.includes(t.priority));
    if (filters.category?.length) list = list.filter((t) => filters.category!.includes(t.category));
    if (filters.assigned_to) list = list.filter((t) => t.assigned_to === filters.assigned_to);
    if (filters.unassigned) list = list.filter((t) => !t.assigned_to);
    if (filters.q) {
      const q = filters.q.toLowerCase();
      list = list.filter((t) =>
        `${t.subject} ${t.customer_name} ${t.customer_email} ${t.number}`.toLowerCase().includes(q),
      );
    }
    const sorted = [...list].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );
    return sorted.map((t) => this.toPublic(t));
  }

  getById(id: string): Ticket {
    const ticket = this.repository.findById(id);
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found.`);
    return this.toPublic(ticket);
  }

  create(input: CreateTicketInput, classification?: ClassificationResult): Ticket {
    const now = this.timestamp();
    const effectiveClassification =
      classification ?? (input.auto_classify ? this.classificationService.classify(input.subject, input.description) : null);

    const stored = this.repository.create({
      customer_id: `cus_${input.customer_name.toLowerCase().replace(/[^a-z]+/g, '_')}`,
      customer_email: input.customer_email,
      customer_name: input.customer_name,
      subject: input.subject,
      description: input.description,
      category: input.category ?? effectiveClassification?.category ?? 'other',
      priority: input.priority ?? effectiveClassification?.priority ?? 'medium',
      status: input.status ?? 'new',
      created_at: now,
      updated_at: now,
      resolved_at: input.resolved_at ?? null,
      assigned_to: input.assigned_to ?? null,
      tags: input.tags ?? [],
      metadata: {
        source: input.metadata?.source ?? 'web_form',
        browser: input.metadata?.browser ?? '—',
        device_type: input.metadata?.device_type ?? 'desktop',
      },
      classification_confidence: effectiveClassification?.confidence ?? null,
    });
    return this.toPublic(stored);
  }

  update(id: string, patch: UpdateTicketInput): Ticket {
    const existing = this.repository.findById(id);
    if (!existing) throw new NotFoundException(`Ticket ${id} not found.`);

    const now = this.timestamp();
    const nextStatus = patch.status ?? existing.status;
    const resolvedAt =
      nextStatus === 'resolved' && existing.status !== 'resolved' && patch.resolved_at === undefined
        ? now
        : (patch.resolved_at ?? existing.resolved_at);

    // The rest-destructure below intentionally drops `auto_classify` from the
    // patch before forwarding it to the repository (it's a request-only flag,
    // not a persisted field). The discarded binding is unused by design.
    // `metadata` is also pulled out separately because `UpdateTicketInput`'s
    // metadata sub-fields are all optional, while `StoredTicket.metadata`
    // must always be fully populated — so a partial patch is merged onto the
    // existing metadata rather than forwarded as-is.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { auto_classify: _autoClassify, metadata: metadataPatch, ...patchWithoutFlag } = patch;
    const updated = this.repository.update(id, {
      ...patchWithoutFlag,
      ...(metadataPatch ? { metadata: { ...existing.metadata, ...metadataPatch } } : {}),
      status: nextStatus,
      resolved_at: resolvedAt,
      updated_at: now,
    });
    return this.toPublic(updated as StoredTicket);
  }

  delete(id: string): void {
    const deleted = this.repository.delete(id);
    if (!deleted) throw new NotFoundException(`Ticket ${id} not found.`);
  }

  classify(id: string): ClassificationResult {
    const ticket = this.repository.findById(id);
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found.`);
    const result = this.classificationService.classify(ticket.subject, ticket.description);
    this.repository.update(id, {
      category: result.category,
      priority: result.priority,
      classification_confidence: result.confidence,
      updated_at: this.timestamp(),
    });
    return result;
  }

  private toPublic(ticket: StoredTicket): Ticket {
    // classification_confidence is internal-only and must never appear in a
    // public API response; the rest-destructure strips it and the discarded
    // binding is unused by design.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { classification_confidence: _classificationConfidence, ...publicTicket } = ticket;
    return publicTicket;
  }
}
