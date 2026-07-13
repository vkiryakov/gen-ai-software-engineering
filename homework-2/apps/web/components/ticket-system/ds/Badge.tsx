import type { ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeVariant = 'soft' | 'outline';

export interface BadgeProps {
  children?: ReactNode;
  tone?: BadgeTone;
  variant?: BadgeVariant;
  dot?: boolean;
  style?: React.CSSProperties;
}

const tones: Record<BadgeTone, { fg: string; bg: string; bd: string }> = {
  neutral: { fg: 'var(--ink-700)', bg: 'var(--ink-100)', bd: 'var(--ink-200)' },
  brand: { fg: 'var(--brand-700)', bg: 'var(--brand-50)', bd: 'var(--brand-200)' },
  success: { fg: 'var(--success)', bg: 'var(--success-bg)', bd: 'var(--success-border)' },
  warning: { fg: 'var(--warning)', bg: 'var(--warning-bg)', bd: 'var(--warning-border)' },
  danger: { fg: 'var(--danger)', bg: 'var(--danger-bg)', bd: 'var(--danger-border)' },
  info: { fg: 'var(--info)', bg: 'var(--info-bg)', bd: 'var(--info-border)' },
};

export function Badge({ children, tone = 'neutral', variant = 'soft', dot = false, style = {} }: BadgeProps) {
  const t = tones[tone];
  const outlined = variant === 'outline';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        height: '20px',
        padding: '0 7px',
        background: outlined ? 'transparent' : t.bg,
        color: t.fg,
        border: `1px solid ${outlined ? t.bd : 'transparent'}`,
        borderRadius: 'var(--radius-sm)',
        fontSize: 'var(--text-2xs)',
        fontWeight: 'var(--weight-semibold)' as unknown as number,
        letterSpacing: 'var(--tracking-wide)',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {dot && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: t.fg }} />}
      {children}
    </span>
  );
}
