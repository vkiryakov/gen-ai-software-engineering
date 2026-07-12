// Triage agent app — create/edit ticket modal with client-side validation.
(function () {
const { Modal, Button, Input, Select, Textarea, FieldLabel, Banner } = window.TriageDesignSystem_a9a780;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form) {
  const errors = {};
  if (!form.subject.trim()) errors.subject = 'Enter a subject.';
  else if (form.subject.trim().length > 200) errors.subject = 'Keep it under 200 characters.';
  if (!form.customer_name.trim()) errors.customer_name = 'Enter the customer\'s name.';
  if (!form.customer_email.trim()) errors.customer_email = 'Enter an email address.';
  else if (!EMAIL_RE.test(form.customer_email.trim())) errors.customer_email = 'That email looks invalid.';
  if (!form.description.trim()) errors.description = 'Enter a description.';
  else if (form.description.trim().length < 10) errors.description = 'At least 10 characters.';
  else if (form.description.trim().length > 2000) errors.description = 'Keep it under 2000 characters.';
  return errors;
}

function TicketFormModal({ open, onClose, onSaved, ticket }) {
  const { CATEGORIES, CATEGORY_LABEL, PRIORITIES, PRIORITY_LABEL, SOURCES, SOURCE_LABEL } = window.TRIAGE_META;
  const isEdit = !!ticket;
  const empty = { subject: '', customer_name: '', customer_email: '', category: CATEGORIES[0], priority: 'medium', source: 'web_form', description: '' };
  const [form, setForm] = React.useState(empty);
  const [touched, setTouched] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [apiError, setApiError] = React.useState(null);

  React.useEffect(() => {
    if (!open) return;
    setTouched(false);
    setApiError(null);
    setForm(isEdit ? {
      subject: ticket.subject, customer_name: ticket.customer_name, customer_email: ticket.customer_email,
      category: ticket.category, priority: ticket.priority, source: ticket.metadata.source, description: ticket.description,
    } : empty);
  }, [open, ticket]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const errors = validate(form);
  const hasErrors = Object.keys(errors).length > 0;

  const submit = async () => {
    setTouched(true);
    setApiError(null);
    if (hasErrors) return;
    setSaving(true);
    try {
      let saved;
      if (isEdit) {
        saved = await window.TriageAPI.updateTicket(ticket.id, {
          subject: form.subject, customer_name: form.customer_name, customer_email: form.customer_email,
          category: form.category, priority: form.priority, description: form.description,
          metadata: { ...ticket.metadata, source: form.source },
        });
      } else {
        saved = await window.TriageAPI.createTicket({
          subject: form.subject, customer_name: form.customer_name, customer_email: form.customer_email,
          category: form.category, priority: form.priority, description: form.description,
          metadata: { source: form.source },
        });
      }
      onSaved(saved, isEdit);
    } catch (e) {
      setApiError(e.message || 'Something went wrong saving this ticket.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} width={540} title={isEdit ? `Edit ticket #${ticket.number}` : 'Create a new ticket'}
      description={isEdit ? undefined : "Logs a ticket on behalf of a customer — useful for phone or walk-in requests."}
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={submit} disabled={saving} iconLeft={<i data-lucide={isEdit ? 'save' : 'plus'} style={{ width: 15, height: 15 }} />}>
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create ticket'}
        </Button>
      </>}>
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
                {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
              </Select>
            </FieldLabel>
          </div>
          <div style={{ flex: 1 }}>
            <FieldLabel label="Priority">
              <Select value={form.priority} onChange={set('priority')}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
              </Select>
            </FieldLabel>
          </div>
          <div style={{ flex: 1 }}>
            <FieldLabel label="Source">
              <Select value={form.source} onChange={set('source')}>
                {SOURCES.map((s) => <option key={s} value={s}>{SOURCE_LABEL[s]}</option>)}
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
window.TicketFormModal = TicketFormModal;
})();
