'use client';

import { useState } from 'react';
import type { ReactNode, SelectHTMLAttributes } from 'react';

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'style'> {
  size?: SelectSize;
  invalid?: boolean;
  children: ReactNode;
  style?: React.CSSProperties;
  wrapperStyle?: React.CSSProperties;
}

const heights: Record<SelectSize, string> = { sm: '30px', md: '36px', lg: '42px' };
const fonts: Record<SelectSize, string> = { sm: 'var(--text-sm)', md: 'var(--text-base)', lg: 'var(--text-md)' };

export function Select({ size = 'md', invalid = false, disabled = false, children, style = {}, wrapperStyle = {}, ...rest }: SelectProps) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-flex', width: '100%', ...wrapperStyle }}>
      <select
        disabled={disabled}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          width: '100%',
          height: heights[size],
          boxSizing: 'border-box',
          padding: '0 32px 0 12px',
          appearance: 'none',
          fontFamily: 'var(--font-sans)',
          fontSize: fonts[size],
          color: 'var(--text-primary)',
          background: disabled ? 'var(--surface-sunken)' : 'var(--surface-card)',
          border: `1px solid ${invalid ? 'var(--danger)' : focus ? 'var(--border-focus)' : 'var(--border-default)'}`,
          borderRadius: 'var(--radius-md)',
          boxShadow: focus ? 'var(--shadow-focus)' : 'var(--shadow-inset)',
          outline: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)',
          ...style,
        }}
        {...rest}
      >
        {children}
      </select>
      <span style={{ position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-tertiary)', fontSize: '14px', lineHeight: 0 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
    </div>
  );
}
