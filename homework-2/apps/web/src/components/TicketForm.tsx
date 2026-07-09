import { useState, type FormEvent } from 'react';
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  type CreateTicketInput,
} from '@repo/contracts';

interface TicketFormProps {
  onSubmit: (input: CreateTicketInput) => Promise<void>;
  submitting: boolean;
}

const EMPTY: CreateTicketInput = {
  customer_id: '',
  customer_email: '',
  customer_name: '',
  subject: '',
  description: '',
  auto_classify: true,
};

export function TicketForm({ onSubmit, submitting }: TicketFormProps) {
  const [form, setForm] = useState<CreateTicketInput>(EMPTY);

  const update = <K extends keyof CreateTicketInput>(key: K, value: CreateTicketInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await onSubmit(form);
      setForm(EMPTY);
    } catch {
      // Submission failed; the page already surfaced the error, so just skip
      // the reset and leave the user's input in place.
    }
  };

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <h2>New ticket</h2>

      <div className="grid-2">
        <label>
          Customer name
          <input
            required
            value={form.customer_name}
            onChange={(e) => update('customer_name', e.target.value)}
          />
        </label>
        <label>
          Customer email
          <input
            required
            type="email"
            value={form.customer_email}
            onChange={(e) => update('customer_email', e.target.value)}
          />
        </label>
      </div>

      <label>
        Customer ID
        <input
          required
          value={form.customer_id}
          onChange={(e) => update('customer_id', e.target.value)}
        />
      </label>

      <label>
        Subject
        <input
          required
          maxLength={200}
          value={form.subject}
          onChange={(e) => update('subject', e.target.value)}
        />
      </label>

      <label>
        Description
        <textarea
          required
          rows={4}
          minLength={10}
          maxLength={2000}
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
        />
      </label>

      <div className="grid-2">
        <label>
          Category
          <select
            value={form.category ?? ''}
            onChange={(e) =>
              update('category', (e.target.value || undefined) as CreateTicketInput['category'])
            }
          >
            <option value="">Auto-detect</option>
            {TICKET_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          Priority
          <select
            value={form.priority ?? ''}
            onChange={(e) =>
              update('priority', (e.target.value || undefined) as CreateTicketInput['priority'])
            }
          >
            <option value="">Auto-detect</option>
            {TICKET_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="checkbox">
        <input
          type="checkbox"
          checked={form.auto_classify ?? false}
          onChange={(e) => update('auto_classify', e.target.checked)}
        />
        Auto-classify on creation
      </label>

      <button type="submit" disabled={submitting}>
        {submitting ? 'Creating…' : 'Create ticket'}
      </button>
    </form>
  );
}
