import type { ReactNode } from 'react';

export type BannerTone = 'info' | 'success' | 'warning' | 'danger';

export interface BannerProps {
  tone?: BannerTone;
  title?: string;
  children?: ReactNode;
  onClose?: () => void;
  action?: ReactNode;
  style?: React.CSSProperties;
}

const tones: Record<BannerTone, { fg: string; bg: string; bd: string; icon: string }> = {
  info: { fg: 'var(--info)', bg: 'var(--info-bg)', bd: 'var(--info-border)', icon: 'M12 16v-4M12 8h.01M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20' },
  success: { fg: 'var(--success)', bg: 'var(--success-bg)', bd: 'var(--success-border)', icon: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3' },
  warning: { fg: 'var(--warning)', bg: 'var(--warning-bg)', bd: 'var(--warning-border)', icon: 'm10.29 3.86-8.48 14.7A2 2 0 0 0 3.53 21h16.94a2 2 0 0 0 1.72-2.44l-8.48-14.7a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01' },
  danger: { fg: 'var(--danger)', bg: 'var(--danger-bg)', bd: 'var(--danger-border)', icon: 'M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86L7.86 2zM12 8v4M12 16h.01' },
};

export function Banner({ tone = 'info', title, children, onClose, action, style = {} }: BannerProps) {
  const t = tones[tone];
  return (
    <div role="status" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px 14px', background: t.bg, color: 'var(--text-primary)', border: `1px solid ${t.bd}`, borderRadius: 'var(--radius-md)', ...style }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.fg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: '0 0 auto', marginTop: '1px' }}>
        <path d={t.icon} />
      </svg>
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && <div style={{ fontWeight: 'var(--weight-semibold)' as unknown as number, fontSize: 'var(--text-base)', color: t.fg, marginBottom: children ? '2px' : 0 }}>{title}</div>}
        {children && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)' }}>{children}</div>}
        {action && <div style={{ marginTop: '10px' }}>{action}</div>}
      </div>
      {onClose && (
        <button onClick={onClose} aria-label="Dismiss" style={{ flex: '0 0 auto', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '2px', lineHeight: 0, borderRadius: 'var(--radius-xs)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
