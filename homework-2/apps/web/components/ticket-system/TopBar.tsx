// apps/web/components/ticket-system/TopBar.tsx
import { LogOut, Plus, Upload } from 'lucide-react';
import { Button } from './ds/Button';

export interface TopBarProps {
  isMobile: boolean;
  onImport: () => void;
  onNewTicket: () => void;
  onLogout: () => void;
}

export function TopBar({ isMobile, onImport, onNewTicket, onLogout }: TopBarProps) {
  return (
    <header
      style={{
        height: 'var(--topbar-h)',
        flex: '0 0 auto',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '0 16px',
        background: 'var(--surface-card)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ flex: 1 }} />
      <Button variant="secondary" size="sm" iconLeft={<Upload size={15} />} onClick={onImport}>
        {isMobile ? null : 'Import'}
      </Button>
      <Button size="sm" iconLeft={<Plus size={15} />} onClick={onNewTicket}>
        {isMobile ? null : 'New ticket'}
      </Button>
      <div style={{ width: 1, height: 20, background: 'var(--border-subtle)', margin: '0 2px' }} />
      <button
        onClick={onLogout}
        title="Log out"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 30,
          height: 30,
          background: 'transparent',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <LogOut size={17} />
      </button>
    </header>
  );
}
