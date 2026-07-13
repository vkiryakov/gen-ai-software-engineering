// apps/web/components/ticket-system/TicketList.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Menu, Search, SlidersHorizontal } from 'lucide-react';
import type { Ticket } from '@repo/contracts';
import { PriorityTag } from './ds/PriorityTag';
import { StatusTag } from './ds/StatusTag';
import { Badge } from './ds/Badge';
import { Avatar } from './ds/Avatar';
import { Checkbox } from './ds/Checkbox';
import { Input } from './ds/Input';
import { Button } from './ds/Button';
import { IconButton } from './ds/IconButton';
import { Tabs } from './ds/Tabs';
import { Spinner } from './ds/Spinner';
import { CATEGORIES, CATEGORY_LABEL, PRIORITIES, PRIORITY_LABEL, STATUS_TAG, STATUSES, relative } from '../../lib/ticket-system/constants';

function TicketRow({ t, selected, active, onSelect, onToggle }: { t: Ticket; selected: boolean; active: boolean; onSelect: (id: string) => void; onToggle: (id: string) => void }) {
  const [hover, setHover] = useState(false);
  const statusMeta = STATUS_TAG[t.status];
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onSelect(t.id)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '11px 14px',
        borderBottom: '1px solid var(--border-subtle)',
        cursor: 'pointer',
        background: active ? 'var(--surface-selected)' : hover ? 'var(--surface-hover)' : 'var(--surface-card)',
        borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
      }}
    >
      <div
        style={{ paddingTop: '2px' }}
        onClick={(e) => {
          e.stopPropagation();
          onToggle(t.id);
        }}
      >
        <Checkbox checked={selected} onChange={() => onToggle(t.id)} />
      </div>
      <Avatar name={t.customer_name} size="sm" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{t.customer_name}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{relative(t.updated_at)}</span>
        </div>
        <div style={{ fontSize: 'var(--text-base)', fontWeight: 400, color: 'var(--text-secondary)', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginRight: '6px' }}>#{t.number}</span>
          {t.subject}
        </div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '7px', flexWrap: 'wrap' }}>
          <PriorityTag level={t.priority} />
          <StatusTag status={statusMeta.status} label={statusMeta.label} />
          <Badge tone="neutral">{CATEGORY_LABEL[t.category]}</Badge>
        </div>
      </div>
    </div>
  );
}

interface FilterPopoverProps {
  statusFilter: Set<string>;
  priorityFilter: Set<string>;
  categoryFilter: Set<string>;
  onToggleStatus: (v: string) => void;
  onTogglePriority: (v: string) => void;
  onToggleCategory: (v: string) => void;
  onClear: () => void;
  onClose: () => void;
}

function FilterPopover({ statusFilter, priorityFilter, categoryFilter, onToggleStatus, onTogglePriority, onToggleCategory, onClear, onClose }: FilterPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [onClose]);
  return (
    <div
      ref={ref}
      className="triage-filter-popover"
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: '6px',
        width: '240px',
        maxHeight: '70vh',
        overflowY: 'auto',
        zIndex: 20,
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      <div>
        <div style={{ fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '6px' }}>Status</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {STATUSES.map((s) => (
            <Checkbox key={s} checked={statusFilter.has(s)} onChange={() => onToggleStatus(s)} label={STATUS_TAG[s].label} />
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '6px' }}>Priority</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {PRIORITIES.map((p) => (
            <Checkbox key={p} checked={priorityFilter.has(p)} onChange={() => onTogglePriority(p)} label={PRIORITY_LABEL[p]} />
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '6px' }}>Category</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {CATEGORIES.map((c) => (
            <Checkbox key={c} checked={categoryFilter.has(c)} onChange={() => onToggleCategory(c)} label={CATEGORY_LABEL[c]} />
          ))}
        </div>
      </div>
      <Button size="sm" variant="ghost" onClick={onClear}>
        Clear filters
      </Button>
    </div>
  );
}

export type TicketListTab = 'open' | 'mine' | 'all';

export interface TicketListProps {
  tickets: Ticket[];
  loading: boolean;
  activeId: string | null;
  onSelect: (id: string) => void;
  tab: TicketListTab;
  onTab: (tab: TicketListTab) => void;
  onOpenMenu: () => void;
}

export function TicketList({ tickets, loading, activeId, onSelect, tab, onTab, onOpenMenu }: TicketListProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [priorityFilter, setPriorityFilter] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const toggleInSet = (setter: (fn: (s: Set<string>) => Set<string>) => void) => (v: string) =>
    setter((s) => {
      const n = new Set(s);
      n.has(v) ? n.delete(v) : n.add(v);
      return n;
    });

  const byTab = (list: Ticket[]) => {
    if (tab === 'mine') return list.filter((t) => t.assigned_to === 'priya');
    if (tab === 'open') return list.filter((t) => ['new', 'in_progress', 'waiting_customer'].includes(t.status));
    return list;
  };

  const q = search.trim().toLowerCase();
  const visible = byTab(tickets).filter((t) => {
    if (statusFilter.size && !statusFilter.has(t.status)) return false;
    if (priorityFilter.size && !priorityFilter.has(t.priority)) return false;
    if (categoryFilter.size && !categoryFilter.has(t.category)) return false;
    if (!q) return true;
    return t.subject.toLowerCase().includes(q) || t.customer_name.toLowerCase().includes(q) || t.customer_email.toLowerCase().includes(q) || String(t.number).includes(q);
  });

  const activeFilterCount = statusFilter.size + priorityFilter.size + categoryFilter.size;

  return (
    <section
      className="triage-list-pane"
      style={{ width: 'var(--list-pane-w)', flex: '0 0 auto', height: '100%', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-subtle)', background: 'var(--surface-card)' }}
    >
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="triage-mobile-only" onClick={onOpenMenu} aria-label="Open menu" style={{ display: 'none', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px 4px 4px 0' }}>
            <Menu size={20} />
          </button>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, flex: 1, margin: 0 }}>All tickets</h2>
          <div style={{ position: 'relative' }}>
            <IconButton icon={<SlidersHorizontal size={16} />} label="Filter" variant={activeFilterCount ? 'primary' : 'secondary'} size="sm" onClick={() => setFilterOpen((v) => !v)} />
            {activeFilterCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  minWidth: 15,
                  height: 15,
                  borderRadius: '999px',
                  background: 'var(--brand-500)',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 3px',
                }}
              >
                {activeFilterCount}
              </span>
            )}
            {filterOpen && (
              <FilterPopover
                statusFilter={statusFilter}
                priorityFilter={priorityFilter}
                categoryFilter={categoryFilter}
                onToggleStatus={toggleInSet(setStatusFilter)}
                onTogglePriority={toggleInSet(setPriorityFilter)}
                onToggleCategory={toggleInSet(setCategoryFilter)}
                onClear={() => {
                  setStatusFilter(new Set());
                  setPriorityFilter(new Set());
                  setCategoryFilter(new Set());
                }}
                onClose={() => setFilterOpen(false)}
              />
            )}
          </div>
        </div>
        <Input iconLeft={<Search size={16} />} placeholder="Search tickets…" size="sm" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {selected.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: 'var(--surface-selected)', borderBottom: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--brand-700)' }}>{selected.size} selected</span>
        </div>
      )}
      <div style={{ padding: '0 14px', borderBottom: '1px solid var(--border-subtle)' }}>
        <Tabs
          value={tab}
          onChange={(v) => onTab(v as TicketListTab)}
          items={[
            { value: 'open', label: 'Open', count: tickets.filter((t) => ['new', 'in_progress', 'waiting_customer'].includes(t.status)).length },
            { value: 'mine', label: 'Assigned to me', count: tickets.filter((t) => t.assigned_to === 'priya').length },
            { value: 'all', label: 'All', count: tickets.length },
          ]}
        />
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Spinner />
          </div>
        ) : visible.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>No tickets match these filters.</div>
        ) : (
          visible.map((t) => <TicketRow key={t.id} t={t} selected={selected.has(t.id)} active={t.id === activeId} onSelect={onSelect} onToggle={toggle} />)
        )}
      </div>
    </section>
  );
}
