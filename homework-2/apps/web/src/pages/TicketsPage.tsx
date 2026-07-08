import { useCallback, useEffect, useState } from 'react';
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  type CreateTicketInput,
  type ListTicketsQuery,
  type Ticket,
} from '@repo/contracts';
import { ticketsApi } from '../api/client';
import { TicketForm } from '../components/TicketForm';
import { TicketList } from '../components/TicketList';

export function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filters, setFilters] = useState<ListTicketsQuery>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setTickets(await ticketsApi.list(filters));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tickets');
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (input: CreateTicketInput) => {
    setSubmitting(true);
    try {
      await ticketsApi.create(input);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await ticketsApi.remove(id);
    await load();
  };

  const handleClassify = async (id: string) => {
    await ticketsApi.autoClassify(id);
    await load();
  };

  return (
    <>
      {error && <div className="alert">{error}</div>}

      <div className="layout">
        <section>
          <TicketForm onSubmit={handleCreate} submitting={submitting} />
        </section>

        <section>
          <div className="card filters">
            <h2>Tickets ({tickets.length})</h2>
            <div className="filter-row">
              <select
                value={filters.category ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    category: (e.target.value || undefined) as ListTicketsQuery['category'],
                  }))
                }
              >
                <option value="">All categories</option>
                {TICKET_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={filters.priority ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    priority: (e.target.value || undefined) as ListTicketsQuery['priority'],
                  }))
                }
              >
                <option value="">All priorities</option>
                {TICKET_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <TicketList tickets={tickets} onDelete={handleDelete} onClassify={handleClassify} />
        </section>
      </div>
    </>
  );
}
