export type StatusTagStatus = 'new' | 'open' | 'pending' | 'solved' | 'closed';

export interface StatusTagProps {
  status?: StatusTagStatus;
  label?: string;
  style?: React.CSSProperties;
}

const STATUSES: Record<StatusTagStatus, { label: string; fg: string; bg: string }> = {
  new: { label: 'New', fg: 'var(--status-new)', bg: 'var(--status-new-bg)' },
  open: { label: 'Open', fg: 'var(--status-open)', bg: 'var(--status-open-bg)' },
  pending: { label: 'Pending', fg: 'var(--status-pending)', bg: 'var(--status-pending-bg)' },
  solved: { label: 'Solved', fg: 'var(--status-solved)', bg: 'var(--status-solved-bg)' },
  closed: { label: 'Closed', fg: 'var(--status-closed)', bg: 'var(--status-closed-bg)' },
};

export function StatusTag({ status = 'open', label, style = {} }: StatusTagProps) {
  const s = STATUSES[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        height: '22px',
        padding: '0 10px 0 8px',
        background: s.bg,
        color: s.fg,
        borderRadius: 'var(--radius-pill)',
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--weight-semibold)' as unknown as number,
        letterSpacing: 'var(--tracking-snug)',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: s.fg }} />
      {label || s.label}
    </span>
  );
}
