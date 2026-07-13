'use client';

import { useState } from 'react';
import { Plus, Save } from 'lucide-react';
import type { Ticket, TicketCategory, TicketPriority, TicketSource } from '@repo/contracts';
import { Modal } from './ds/Modal';
import { Button } from './ds/Button';
import { Input } from './ds/Input';
import { Select } from './ds/Select';
import { Textarea } from './ds/Textarea';
import { FieldLabel } from './ds/FieldLabel';
import { Banner } from './ds/Banner';
import { CATEGORIES, CATEGORY_LABEL, PRIORITIES, PRIORITY_LABEL, SOURCES, SOURCE_LABEL } from '../../lib/ticket-system/constants';
import { ApiError, type ApiClient } from '../../lib/ticket-system/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormState {
  subject: string;
  customer_name: string;
  customer_email: string;
  category: TicketCategory;
  priority: TicketPriority;
  source: TicketSource;
  description: string;
}

function emptyForm(): FormState {
  return { subject: '', customer_name: '', customer_email: '', category: CATEGORIES[0], priority: 'medium', source: 'web_form', description: '' };
}

function validate(form: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!form.subject.trim()) errors.subject = 'Enter a subject.';
  else if (form.subject.trim().length > 200) errors.subject = 'Keep it under 200 characters.';
  if (!form.customer_name.trim()) errors.customer_name = "Enter the customer's name.";
  if (!form.customer_email.trim()) errors.customer_email = 'Enter an email address.';
  else if (!EMAIL_RE.test(form.customer_email.trim())) errors.customer_email = 'That email looks invalid.';
  if (!form.description.trim()) errors.description = 'Enter a description.';
  else if (form.description.trim().length < 10) errors.description = 'At least 10 characters.';
  else if (form.description.trim().length > 2000) errors.description = 'Keep it under 2000 characters.';
  return errors;
}

export interface TicketFormModalProps {
  open: boolean;
  ticket: Ticket | null;
  api: ApiClient;
  onClose: () => void;
  onSaved: (saved: Ticket, isEdit: boolean) => void;
}

export function TicketFormModal({ open, ticket, api, onClose, onSaved }: TicketFormModalProps) {
  const isEdit = !!ticket;
  const [form, setForm] = useState<FormState>(emptyForm());
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Populate the form whenever the modal transitions to open (or the target
  // ticket changes while open), computed during render (per
  // https://react.dev/learn/you-might-not-need-an-effect) instead of a
  // useEffect, so no extra state-setting effect is needed.
  const openKey = `${open}:${ticket?.id ?? ''}`;
  const [initedKey, setInitedKey] = useState(openKey);
  if (openKey !== initedKey) {
    setInitedKey(openKey);
    if (open) {
      setTouched(false);
      setApiError(null);
      setForm(
        ticket
          ? {
              subject: ticket.subject,
              customer_name: ticket.customer_name,
              customer_email: ticket.customer_email,
              category: ticket.category,
              priority: ticket.priority,
              source: ticket.metadata.source,
              description: ticket.description,
            }
          : emptyForm(),
      );
    }
  }

  const set = <K extends keyof FormState>(k: K) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }) as FormState);

  const errors = validate(form);
  const hasErrors = Object.keys(errors).length > 0;

  const submit = async () => {
    setTouched(true);
    setApiError(null);
    if (hasErrors) return;
    setSaving(true);
    try {
      let saved: Ticket;
      if (isEdit && ticket) {
        saved = await api.updateTicket(ticket.id, {
          subject: form.subject,
          customer_name: form.customer_name,
          customer_email: form.customer_email,
          category: form.category,
          priority: form.priority,
          description: form.description,
          metadata: { ...ticket.metadata, source: form.source },
        });
      } else {
        saved = await api.createTicket({
          subject: form.subject,
          customer_name: form.customer_name,
          customer_email: form.customer_email,
          category: form.category,
          priority: form.priority,
          description: form.description,
          metadata: { source: form.source },
        });
      }
      onSaved(saved, isEdit);
    } catch (e) {
      setApiError(e instanceof ApiError ? e.message : 'Something went wrong saving this ticket.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={540}
      title={isEdit ? `Edit ticket #${ticket?.number}` : 'Create a new ticket'}
      description={isEdit ? undefined : 'Logs a ticket on behalf of a customer — useful for phone or walk-in requests.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving} iconLeft={isEdit ? <Save size={15} /> : <Plus size={15} />}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create ticket'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {apiError && <Banner tone="danger" title="Couldn't save this ticket">{apiError}</Banner>}
        <FieldLabel label="Subject" required error={touched ? errors.subject : null}>
          <Input placeholder="Brief summary of the issue" value={form.subject} invalid={touched && !!errors.subject} onChange={set('subject')} autoFocus />
        </FieldLabel>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <FieldLabel label="Customer name" required error={touched ? errors.customer_name : null}>
              <Input placeholder="Jane Doe" value={form.customer_name} invalid={touched && !!errors.customer_name} onChange={set('customer_name')} />
            </FieldLabel>
          </div>
          <div style={{ flex: 1 }}>
            <FieldLabel label="Customer email" required error={touched ? errors.customer_email : null}>
              <Input type="email" placeholder="jane@company.com" value={form.customer_email} invalid={touched && !!errors.customer_email} onChange={set('customer_email')} />
            </FieldLabel>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <FieldLabel label="Category">
              <Select value={form.category} onChange={set('category')}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABEL[c]}
                  </option>
                ))}
              </Select>
            </FieldLabel>
          </div>
          <div style={{ flex: 1 }}>
            <FieldLabel label="Priority">
              <Select value={form.priority} onChange={set('priority')}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABEL[p]}
                  </option>
                ))}
              </Select>
            </FieldLabel>
          </div>
          <div style={{ flex: 1 }}>
            <FieldLabel label="Source">
              <Select value={form.source} onChange={set('source')}>
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {SOURCE_LABEL[s]}
                  </option>
                ))}
              </Select>
            </FieldLabel>
          </div>
        </div>
        <FieldLabel label="Description" required error={touched ? errors.description : null}>
          <Textarea rows={4} placeholder="What's the issue?" value={form.description} invalid={touched && !!errors.description} onChange={set('description')} />
        </FieldLabel>
      </div>
    </Modal>
  );
}
