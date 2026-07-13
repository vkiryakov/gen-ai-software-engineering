// apps/web/components/ticket-system/TriageApp.tsx
'use client';

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { Ticket, UpdateTicketInput } from '@repo/contracts';
import { createApiClient } from '../../lib/ticket-system/api';
import { type QueueId, type ToastState } from '../../lib/ticket-system/constants';
import { LoginScreen } from './LoginScreen';
import { TopBar } from './TopBar';
import { Toast } from './Toast';
import { Sidebar } from './Sidebar';
import { TicketList, type TicketListTab } from './TicketList';
import { TicketDetail } from './TicketDetail';
import { TicketFormModal } from './TicketFormModal';
import { ImportModal } from './ImportModal';

const TOKEN_KEY = 'triage_token';

const MOBILE_QUERY = '(max-width: 860px)';

function subscribeToMobileQuery(callback: () => void) {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
}

function getMobileSnapshot(): boolean {
  return window.matchMedia(MOBILE_QUERY).matches;
}

function getServerMobileSnapshot(): boolean {
  return false;
}

function useIsMobile(): boolean {
  return useSyncExternalStore(subscribeToMobileQuery, getMobileSnapshot, getServerMobileSnapshot);
}

export function TriageApp({ apiBaseUrl }: { apiBaseUrl: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    // One-time client-only read: localStorage isn't available during SSR, and
    // authReady intentionally gates rendering until this has run so the SSR'd
    // page and the first client render match (no login-screen/queue flash).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken(localStorage.getItem(TOKEN_KEY));
    setAuthReady(true);
  }, []);

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, []);

  const api = useMemo(() => createApiClient(apiBaseUrl, () => token, handleUnauthorized), [apiBaseUrl, token, handleUnauthorized]);

  const handleLoginSuccess = (newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  };

  if (!authReady) return null;
  if (!token) return <LoginScreen api={api} onSuccess={handleLoginSuccess} />;
  return <AgentApp api={api} onLogout={handleLogout} />;
}

function AgentApp({ api, onLogout }: { api: ReturnType<typeof createApiClient>; onLogout: () => void }) {
  const isMobile = useIsMobile();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeQueue, setActiveQueue] = useState<QueueId>('all');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tab, setTab] = useState<TicketListTab>('open');
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [formModal, setFormModal] = useState<{ open: boolean; ticket: Ticket | null }>({ open: false, ticket: null });
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    // One-time client-only read of a persisted UI preference; localStorage
    // isn't available during SSR so this can't be computed at render time.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSidebarCollapsed(localStorage.getItem('triage_sidebar_collapsed') === '1');
  }, []);

  const notify = (message: string, type: ToastState['type'] = 'success') => setToast({ message, type });

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const list = await api.listTickets({});
      setTickets(list);
      setActiveId((cur) => (cur && list.some((t) => t.id === cur) ? cur : list[0]?.id ?? null));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load tickets.');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    // Fetch tickets on mount — a canonical "synchronize with an external
    // system" effect, not derived UI state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const queueFiltered = (list: Ticket[]) => {
    if (activeQueue === 'mine') return list.filter((t) => t.assigned_to === 'priya');
    if (activeQueue === 'unassigned') return list.filter((t) => !t.assigned_to);
    if (activeQueue === 'urgent') return list.filter((t) => t.priority === 'urgent');
    if (activeQueue === 'waiting_customer') return list.filter((t) => t.status === 'waiting_customer');
    if (activeQueue === 'resolved') return list.filter((t) => t.status === 'resolved');
    return list;
  };

  const visibleTickets = queueFiltered(tickets);
  const active = tickets.find((t) => t.id === activeId) || null;

  const counts: Record<QueueId, number> = {
    all: tickets.length,
    mine: tickets.filter((t) => t.assigned_to === 'priya').length,
    unassigned: tickets.filter((t) => !t.assigned_to).length,
    urgent: tickets.filter((t) => t.priority === 'urgent').length,
    waiting_customer: tickets.filter((t) => t.status === 'waiting_customer').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
  };

  const selectTicket = (id: string) => {
    setActiveId(id);
    if (isMobile) setMobileView('detail');
  };

  const updateTicket = async (id: string, patch: UpdateTicketInput) => {
    try {
      const saved = await api.updateTicket(id, patch);
      setTickets((list) => list.map((t) => (t.id === id ? saved : t)));
      notify('Ticket updated.');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not update ticket.', 'danger');
    }
  };

  const deleteTicket = async (id: string) => {
    const ticket = tickets.find((t) => t.id === id);
    try {
      await api.deleteTicket(id);
      setTickets((list) => {
        const next = list.filter((t) => t.id !== id);
        setActiveId((cur) => (cur === id ? next[0]?.id ?? null : cur));
        return next;
      });
      if (isMobile) setMobileView('list');
      notify(`Deleted ticket #${ticket ? ticket.number : ''}.`);
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not delete ticket.', 'danger');
    }
  };

  const onTicketSaved = (saved: Ticket, isEdit: boolean) => {
    setTickets((list) => (isEdit ? list.map((t) => (t.id === saved.id ? saved : t)) : [saved, ...list]));
    setActiveId(saved.id);
    setActiveQueue('all');
    setFormModal({ open: false, ticket: null });
    if (isMobile) setMobileView('detail');
    notify(isEdit ? `Ticket #${saved.number} updated.` : `Ticket #${saved.number} created.`);
  };

  const onImported = (result: { imported_count: number; failed_count: number }) => {
    setImportOpen(false);
    refresh();
    setActiveQueue('all');
    if (result.failed_count) {
      notify(`Imported ${result.imported_count}, ${result.failed_count} row(s) failed — check the file and retry those rows.`, 'danger');
    } else {
      notify(`Import complete — ${result.imported_count} tickets added.`);
    }
  };

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((v) => {
      const next = !v;
      localStorage.setItem('triage_sidebar_collapsed', next ? '1' : '0');
      return next;
    });
  };

  const listPane = <TicketList tickets={visibleTickets} loading={loading} activeId={activeId} onSelect={selectTicket} tab={tab} onTab={setTab} onOpenMenu={() => setSidebarOpen(true)} />;
  const detailPane = (
    <TicketDetail
      t={active}
      key={active ? active.id : 'empty'}
      api={api}
      onUpdate={updateTicket}
      onDelete={deleteTicket}
      onEdit={(t) => setFormModal({ open: true, ticket: t })}
      showBack={isMobile}
      onBack={() => setMobileView('list')}
    />
  );

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: 'var(--bg-app)', overflow: 'hidden' }}>
      <Sidebar
        activeQueue={activeQueue}
        onSelectQueue={setActiveQueue}
        counts={counts}
        mobileOpen={isMobile && sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
        collapsed={!isMobile && sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapsed}
      />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <TopBar isMobile={isMobile} onImport={() => setImportOpen(true)} onNewTicket={() => setFormModal({ open: true, ticket: null })} onLogout={onLogout} />
        {loadError && (
          <div style={{ padding: '10px 16px' }}>
            <div>
              Couldn&apos;t load tickets — {loadError}{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  refresh();
                }}
              >
                retry
              </a>
            </div>
          </div>
        )}
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>{isMobile ? (mobileView === 'list' ? listPane : detailPane) : (<>{listPane}{detailPane}</>)}</div>
      </div>
      <ImportModal open={importOpen} api={api} onClose={() => setImportOpen(false)} onImported={onImported} />
      <TicketFormModal open={formModal.open} ticket={formModal.ticket} api={api} onClose={() => setFormModal({ open: false, ticket: null })} onSaved={onTicketSaved} />
      <Toast toast={toast} />
    </div>
  );
}
