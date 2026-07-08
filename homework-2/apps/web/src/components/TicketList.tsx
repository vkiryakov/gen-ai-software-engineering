import type { Ticket } from '@repo/contracts';

interface TicketListProps {
  tickets: Ticket[];
  onDelete: (id: string) => void;
  onClassify: (id: string) => void;
}

export function TicketList({ tickets, onDelete, onClassify }: TicketListProps) {
  if (tickets.length === 0) {
    return <p className="empty">No tickets yet. Create one to get started.</p>;
  }

  return (
    <ul className="ticket-list">
      {tickets.map((ticket) => (
        <li key={ticket.id} className="card ticket">
          <div className="ticket-head">
            <h3>{ticket.subject}</h3>
            <div className="badges">
              <span className={`badge priority-${ticket.priority}`}>{ticket.priority}</span>
              <span className="badge category">{ticket.category}</span>
              <span className={`badge status-${ticket.status}`}>{ticket.status}</span>
            </div>
          </div>
          <p className="description">{ticket.description}</p>
          <div className="ticket-meta">
            <span>
              {ticket.customer_name} · {ticket.customer_email}
            </span>
            <span>{new Date(ticket.created_at).toLocaleString()}</span>
          </div>
          <div className="ticket-actions">
            <button type="button" className="ghost" onClick={() => onClassify(ticket.id)}>
              Auto-classify
            </button>
            <button type="button" className="danger" onClick={() => onDelete(ticket.id)}>
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
