'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

export interface NavItemProps {
  icon?: ReactNode;
  label: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function NavItem({ icon, label, count, active = false, onClick, style = {} }: NavItemProps) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        padding: '7px 10px',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        background: active ? 'var(--surface-selected)' : hover ? 'var(--surface-hover)' : 'transparent',
        color: active ? 'var(--brand-700)' : 'var(--text-secondary)',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-base)',
        fontWeight: (active ? 'var(--weight-semibold)' : 'var(--weight-medium)') as unknown as number,
        transition: 'background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard)',
        textAlign: 'left',
        ...style,
      }}
    >
      {icon && <span style={{ display: 'inline-flex', flex: '0 0 auto', color: active ? 'var(--brand-600)' : 'var(--text-tertiary)' }}>{icon}</span>}
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      {count != null && (
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' as unknown as number, color: active ? 'var(--brand-600)' : 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
          {count}
        </span>
      )}
    </button>
  );
}
