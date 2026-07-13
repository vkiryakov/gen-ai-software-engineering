export type PriorityLevel = 'urgent' | 'high' | 'medium' | 'low' | 'none';
export type PriorityTagVariant = 'soft' | 'bare';

export interface PriorityTagProps {
  level?: PriorityLevel;
  variant?: PriorityTagVariant;
  showLabel?: boolean;
  style?: React.CSSProperties;
}

const LEVELS: Record<PriorityLevel, { label: string; fg: string; bg: string; bd: string; bars: number }> = {
  urgent: { label: 'Urgent', fg: 'var(--priority-urgent)', bg: 'var(--priority-urgent-bg)', bd: 'var(--priority-urgent-border)', bars: 4 },
  high: { label: 'High', fg: 'var(--priority-high)', bg: 'var(--priority-high-bg)', bd: 'var(--priority-high-border)', bars: 3 },
  medium: { label: 'Medium', fg: 'var(--priority-medium)', bg: 'var(--priority-medium-bg)', bd: 'var(--priority-medium-border)', bars: 2 },
  low: { label: 'Low', fg: 'var(--priority-low)', bg: 'var(--priority-low-bg)', bd: 'var(--priority-low-border)', bars: 1 },
  none: { label: 'None', fg: 'var(--priority-none)', bg: 'var(--priority-none-bg)', bd: 'var(--priority-none-border)', bars: 0 },
};

function Signal({ level, color }: { level: number; color: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: '1.5px', height: '11px' }}>
      {[1, 2, 3, 4].map((n) => (
        <span
          key={n}
          style={{
            width: '2.5px',
            height: `${3 + n * 2}px`,
            borderRadius: '1px',
            background: n <= level ? color : 'currentColor',
            opacity: n <= level ? 1 : 0.25,
          }}
        />
      ))}
    </span>
  );
}

export function PriorityTag({ level = 'none', variant = 'soft', showLabel = true, style = {} }: PriorityTagProps) {
  const p = LEVELS[level];
  if (variant === 'bare') {
    return (
      <span
        title={p.label}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: p.fg, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' as unknown as number, ...style }}
      >
        <Signal level={p.bars} color={p.fg} />
        {showLabel && p.label}
      </span>
    );
  }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        height: '22px',
        padding: '0 8px',
        background: p.bg,
        color: p.fg,
        border: `1px solid ${p.bd}`,
        borderRadius: 'var(--radius-sm)',
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--weight-semibold)' as unknown as number,
        letterSpacing: 'var(--tracking-snug)',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      <Signal level={p.bars} color={p.fg} />
      {showLabel && p.label}
    </span>
  );
}
