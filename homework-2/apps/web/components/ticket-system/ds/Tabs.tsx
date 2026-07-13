export interface TabItem {
  value: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  style?: React.CSSProperties;
}

export function Tabs({ items, value, onChange, style = {} }: TabsProps) {
  return (
    <div role="tablist" style={{ display: 'flex', gap: '2px', borderBottom: '1px solid var(--border-subtle)', ...style }}>
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.value)}
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '9px 12px 11px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-base)',
              fontWeight: (active ? 'var(--weight-semibold)' : 'var(--weight-medium)') as unknown as number,
              color: active ? 'var(--text-primary)' : 'var(--text-tertiary)',
              transition: 'color var(--dur-fast) var(--ease-standard)',
            }}
          >
            {it.label}
            {it.count != null && (
              <span
                style={{
                  minWidth: '18px',
                  height: '18px',
                  padding: '0 5px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: 'var(--text-2xs)',
                  fontWeight: 'var(--weight-bold)' as unknown as number,
                  background: active ? 'var(--brand-100)' : 'var(--ink-100)',
                  color: active ? 'var(--brand-700)' : 'var(--text-tertiary)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {it.count}
              </span>
            )}
            <span
              style={{
                position: 'absolute',
                left: '6px',
                right: '6px',
                bottom: '-1px',
                height: '2px',
                borderRadius: '2px 2px 0 0',
                background: 'var(--accent)',
                opacity: active ? 1 : 0,
                transition: 'opacity var(--dur-fast) var(--ease-standard)',
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
