// apps/web/components/ticket-system/Sidebar.tsx
'use client';

import { Flame, Inbox, PanelLeftClose, PanelLeftOpen, User, UserX, Clock, CheckCheck, X } from 'lucide-react';
import type { ComponentType } from 'react';
import { NavItem } from './ds/NavItem';
import { Avatar } from './ds/Avatar';
import { Tooltip } from './ds/Tooltip';
import { QUEUES, type QueueId, type Queue } from '../../lib/ticket-system/constants';

const COLLAPSED_W = 60;

const QUEUE_ICONS: Record<Queue['icon'], ComponentType<{ size?: number }>> = {
  inbox: Inbox,
  user: User,
  'user-x': UserX,
  flame: Flame,
  clock: Clock,
  'check-check': CheckCheck,
};

function SidebarSection({ title }: { title: string }) {
  return (
    <div style={{ padding: '14px 10px 6px', fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
      {title}
    </div>
  );
}

export interface SidebarProps {
  activeQueue: QueueId;
  onSelectQueue: (id: QueueId) => void;
  counts: Record<QueueId, number>;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ activeQueue, onSelectQueue, counts, mobileOpen, onCloseMobile, collapsed, onToggleCollapse }: SidebarProps) {
  const item = (q: Queue) => {
    const Icon = QUEUE_ICONS[q.icon];
    const el = (
      <NavItem
        key={q.id}
        icon={<Icon size={17} />}
        label={collapsed ? '' : q.label}
        count={collapsed ? undefined : counts[q.id]}
        active={activeQueue === q.id}
        onClick={() => {
          onSelectQueue(q.id);
          onCloseMobile();
        }}
        style={collapsed ? { justifyContent: 'center', padding: '9px 0' } : undefined}
      />
    );
    return collapsed ? (
      <Tooltip key={q.id} label={q.label} side="right">
        {el}
      </Tooltip>
    ) : (
      el
    );
  };

  return (
    <>
      {mobileOpen && <div className="triage-sidebar-backdrop" onClick={onCloseMobile} />}
      <aside
        className={'triage-sidebar' + (mobileOpen ? ' is-open' : '')}
        style={{
          width: collapsed ? COLLAPSED_W : 'var(--sidebar-w)',
          flex: '0 0 auto',
          height: '100%',
          boxSizing: 'border-box',
          background: 'var(--surface-card)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width var(--dur-med) var(--ease-standard)',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', height: 'var(--topbar-h)', padding: collapsed ? '0 12px' : '0 12px 0 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: '2.5px', height: '18px', flex: '0 0 auto' }}>
            {[9, 13, 17, 21].map((h, i) => (
              <span key={i} style={{ width: '4px', height: h, borderRadius: '1.5px', background: 'var(--brand-500)' }} />
            ))}
          </span>
          {!collapsed && <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '19px', letterSpacing: '-0.03em', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>Triage</span>}
          <div style={{ flex: 1 }} />
          {!collapsed && (
            <button className="triage-mobile-only" onClick={onCloseMobile} aria-label="Close menu" style={{ display: 'none', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}>
              <X size={18} />
            </button>
          )}
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: collapsed ? '8px 6px' : '8px 10px' }}>
          {!collapsed && <SidebarSection title="Queues" />}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>{QUEUES.map(item)}</div>
        </div>

        <button
          className="triage-collapse-toggle"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-end',
            gap: '6px',
            padding: '8px 12px',
            border: 'none',
            borderTop: '1px solid var(--border-subtle)',
            background: 'transparent',
            color: 'var(--text-tertiary)',
            cursor: 'pointer',
          }}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: collapsed ? '10px 0' : '10px 14px', justifyContent: collapsed ? 'center' : 'flex-start', borderTop: '1px solid var(--border-subtle)' }}>
          <Avatar name="Priya Nair" size="sm" />
          {!collapsed && (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>Priya Nair</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Support agent</div>
              </div>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} title="Online" />
            </>
          )}
        </div>
      </aside>
    </>
  );
}
