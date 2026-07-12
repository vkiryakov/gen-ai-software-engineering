import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Ticket } from '@repo/contracts';

export type StoredTicket = Ticket & { classification_confidence: number | null };

@Injectable()
export class TicketsRepository {
  private readonly tickets = new Map<string, StoredTicket>();
  private nextNumber = 1000;

  create(data: Omit<StoredTicket, 'id' | 'number'>): StoredTicket {
    const ticket: StoredTicket = { ...data, id: randomUUID(), number: this.nextNumber++ };
    this.tickets.set(ticket.id, ticket);
    return ticket;
  }

  findAll(): StoredTicket[] {
    return [...this.tickets.values()];
  }

  findById(id: string): StoredTicket | undefined {
    return this.tickets.get(id);
  }

  update(id: string, patch: Partial<StoredTicket>): StoredTicket | undefined {
    const existing = this.tickets.get(id);
    if (!existing) return undefined;
    const updated: StoredTicket = { ...existing, ...patch };
    this.tickets.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.tickets.delete(id);
  }
}
