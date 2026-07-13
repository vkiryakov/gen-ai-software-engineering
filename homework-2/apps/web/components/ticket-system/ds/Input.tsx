'use client';

import { useState } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'style'> {
  size?: InputSize;
  invalid?: boolean;
  iconLeft?: ReactNode;
  style?: React.CSSProperties;
  wrapperStyle?: React.CSSProperties;
}

const heights: Record<InputSize, string> = { sm: '30px', md: '36px', lg: '42px' };
const fonts: Record<InputSize, string> = { sm: 'var(--text-sm)', md: 'var(--text-base)', lg: 'var(--text-md)' };

export function Input({
  size = 'md',
  invalid = false,
  iconLeft = null,
  disabled = false,
  style = {},
  wrapperStyle = {},
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', width: '100%', ...wrapperStyle }}>
      {iconLeft && (
        <span style={{ position: 'absolute', left: '10px', display: 'inline-flex', color: 'var(--text-tertiary)', pointerEvents: 'none', fontSize: '16px' }}>
          {iconLeft}
        </span>
      )}
      <input
        disabled={disabled}
        onFocus={(e) => {
          setFocus(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocus(false);
          onBlur?.(e);
        }}
        style={{
          width: '100%',
          height: heights[size],
          boxSizing: 'border-box',
          padding: iconLeft ? '0 12px 0 32px' : '0 12px',
          fontFamily: 'var(--font-sans)',
          fontSize: fonts[size],
          color: 'var(--text-primary)',
          background: disabled ? 'var(--surface-sunken)' : 'var(--surface-card)',
          border: `1px solid ${invalid ? 'var(--danger)' : focus ? 'var(--border-focus)' : 'var(--border-default)'}`,
          borderRadius: 'var(--radius-md)',
          boxShadow: focus ? (invalid ? '0 0 0 3px var(--danger-bg)' : 'var(--shadow-focus)') : 'var(--shadow-inset)',
          outline: 'none',
          transition: 'border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)',
          cursor: disabled ? 'not-allowed' : 'text',
          ...style,
        }}
        {...rest}
      />
    </div>
  );
}
