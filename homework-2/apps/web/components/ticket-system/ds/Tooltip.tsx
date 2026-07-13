'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

export type TooltipSide = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  label: string;
  side?: TooltipSide;
  children: ReactNode;
  style?: React.CSSProperties;
}

const positions: Record<TooltipSide, React.CSSProperties> = {
  top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '7px' },
  bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '7px' },
  left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '7px' },
  right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '7px' },
};

export function Tooltip({ label, side = 'top', children, style = {} }: TooltipProps) {
  const [open, setOpen] = useState(false);
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            ...positions[side],
            zIndex: 50,
            background: 'var(--ink-900)',
            color: '#fff',
            padding: '5px 8px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--weight-medium)' as unknown as number,
            whiteSpace: 'nowrap',
            boxShadow: 'var(--shadow-md)',
            pointerEvents: 'none',
            ...style,
          }}
        >
          {label}
        </span>
      )}
    </span>
  );
}
