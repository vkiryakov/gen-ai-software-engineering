'use client';

import { useState } from 'react';
import { ArrowLeft, Inbox, Pencil, Sparkles, Trash2 } from 'lucide-react';
import type { ClassificationResult, Ticket, UpdateTicketInput } from '@repo/contracts';
import { PriorityTag } from './ds/PriorityTag';
import { StatusTag } from './ds/StatusTag';
import { Badge } from './ds/Badge';
import { Avatar } from './ds/Avatar';
import { Button } from './ds/Button';
import { IconButton } from './ds/IconButton';
import { Select } from './ds/Select';
import { Tooltip } from './ds/Tooltip';
import { Modal } from './ds/Modal';
import { Banner } from './ds/Banner';
import { Spinner } from './ds/Spinner';
import { AGENTS, CATEGORIES, CATEGORY_LABEL, DEVICE_LABEL, PRIORITIES, PRIORITY_LABEL, SOURCE_LABEL, STATUSES, STATUS_TAG, relative } from '../../lib/ticket-system/constants';
import { ApiError, type ApiClient } from '../../lib/ticket-system/api';

function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{label}</span>
      {children}
    </div>
  );
}

function EmptyDetail() {
  return (
    <section style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)', gap: '8px' }}>
      <Inbox size={32} color="var(--text-tertiary)" />
      <div style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)' }}>You&apos;re all caught up. No tickets in this queue.</div>
    </section>
  );
}

function ClassificationPanel({ t, api, onApply }: { t: Ticket; api: ApiClient; onApply: (r: ClassificationResult) => void }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setState('loading');
    setError(null);
    try {
      const r = await api.classifyTicket(t.id);
      setResult(r);
      setState('done');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Classification failed.');
      setState('error');
    }
  };

  const changed = result && (result.category !== t.category || result.priority !== t.priority);

  return (
    <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Sparkles size={15} color="var(--brand-500)" />
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>Auto-classification</span>
        <Button size="sm" variant="secondary" onClick={run} disabled={state === 'loading'}>
          {state === 'loading' ? 'Classifying…' : 'Run classification'}
        </Button>
      </div>

      {state === 'error' && <Banner tone="danger" title="Couldn't classify this ticket">{error}</Banner>}

      {state === 'loading' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
          <Spinner size={14} /> Analyzing subject and description…
        </div>
      )}

      {result && state === 'done' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Badge tone="brand">{CATEGORY_LABEL[result.category]}</Badge>
            <PriorityTag level={result.priority} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{Math.round(result.confidence * 100)}% confidence</span>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0, lineHeight: 'var(--leading-normal)' }}>{result.reasoning}</p>
          {changed ? (
            <Button size="sm" onClick={() => onApply(result)}>
              Apply to ticket
            </Button>
          ) : (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Matches the ticket&apos;s current category and priority.</span>
          )}
        </div>
      )}
    </div>
  );
}

export interface TicketDetailProps {
  t: Ticket | null;
  api: ApiClient;
  onUpdate: (id: string, patch: UpdateTicketInput) => void;
  onDelete: (id: string) => void;
  onEdit: (t: Ticket) => void;
  onBack: () => void;
  showBack: boolean;
}

export function TicketDetail({ t, api, onUpdate, onDelete, onEdit, onBack, showBack }: TicketDetailProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!t) return <EmptyDetail />;
  const statusMeta = STATUS_TAG[t.status];

  return (
    <section className="triage-detail-pane" style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
      <header style={{ padding: '11px 18px', background: 'var(--surface-card)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        {showBack && (
          <button onClick={onBack} aria-label="Back to list" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4, flex: '0 0 auto' }}>
            <ArrowLeft size={18} />
          </button>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{t.subject}</h1>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>#{t.number}</span>
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <PriorityTag level={t.priority} />
            <StatusTag status={statusMeta.status} label={statusMeta.label} />
            <Badge tone="neutral">{CATEGORY_LABEL[t.category]}</Badge>
            <Badge tone="info" variant="outline">{SOURCE_LABEL[t.metadata.source]}</Badge>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '2px' }}>
          <Tooltip label="Edit ticket" side="bottom">
            <IconButton icon={<Pencil size={16} />} label="Edit ticket" variant="ghost" onClick={() => onEdit(t)} />
          </Tooltip>
          <Tooltip label="Delete ticket" side="bottom">
            <IconButton icon={<Trash2 size={16} />} label="Delete ticket" variant="ghost" onClick={() => setDeleteOpen(true)} />
          </Tooltip>
        </div>
        <Button variant="secondary" size="sm" onClick={() => onUpdate(t.id, { status: 'resolved' })} disabled={t.status === 'resolved' || t.status === 'closed'}>
          Resolve
        </Button>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '18px', display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '760px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Avatar name={t.customer_name} size="md" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)' }}>{t.customer_name}</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{t.customer_email}</span>
            </div>
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)', lineHeight: 'var(--leading-normal)', marginTop: '8px', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '12px 14px' }}>
              {t.description}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px' }}>
          <PropRow label="Assignee">
            <Select size="sm" value={t.assigned_to || ''} onChange={(e) => onUpdate(t.id, { assigned_to: e.target.value || null })}>
              <option value="">Unassigned</option>
              {AGENTS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </PropRow>
          <PropRow label="Priority">
            <Select size="sm" value={t.priority} onChange={(e) => onUpdate(t.id, { priority: e.target.value as Ticket['priority'] })}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </option>
              ))}
            </Select>
          </PropRow>
          <PropRow label="Status">
            <Select size="sm" value={t.status} onChange={(e) => onUpdate(t.id, { status: e.target.value as Ticket['status'] })}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_TAG[s].label}
                </option>
              ))}
            </Select>
          </PropRow>
          <PropRow label="Category">
            <Select size="sm" value={t.category} onChange={(e) => onUpdate(t.id, { category: e.target.value as Ticket['category'] })}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </Select>
          </PropRow>
        </div>

        <ClassificationPanel t={t} api={api} onApply={(r) => onUpdate(t.id, { category: r.category, priority: r.priority })} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px' }}>
          <PropRow label="Tags">
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {t.tags.length ? (
                t.tags.map((tag) => (
                  <Badge key={tag} tone="brand">
                    {tag}
                  </Badge>
                ))
              ) : (
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>No tags</span>
              )}
            </div>
          </PropRow>
          <PropRow label="Source">
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{SOURCE_LABEL[t.metadata.source]}</span>
          </PropRow>
          <PropRow label="Device">
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{DEVICE_LABEL[t.metadata.device_type]}</span>
          </PropRow>
          <PropRow label="Browser">
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{t.metadata.browser}</span>
          </PropRow>
          <PropRow label="Created">
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }} title={t.created_at}>
              {relative(t.created_at)}
            </span>
          </PropRow>
          <PropRow label="Updated">
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }} title={t.updated_at}>
              {relative(t.updated_at)}
            </span>
          </PropRow>
          <PropRow label="Resolved">
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }} title={t.resolved_at || ''}>
              {t.resolved_at ? relative(t.resolved_at) : '—'}
            </span>
          </PropRow>
        </div>
      </div>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        width={420}
        title="Delete ticket?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setDeleteOpen(false);
                onDelete(t.id);
              }}
            >
              Delete ticket
            </Button>
          </>
        }
      >
        <Banner tone="danger" title={`This removes #${t.number} — ${t.subject}`}>
          This can&apos;t be undone.
        </Banner>
      </Modal>
    </section>
  );
}
