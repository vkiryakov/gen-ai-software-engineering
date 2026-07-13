'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

export interface CheckboxProps {
  checked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  label?: ReactNode;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  style?: React.CSSProperties;
}

export function Checkbox({ checked = false, indeterminate = false, disabled = false, label, onChange, style = {} }: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  const on = checked || indeterminate;
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontSize: 'var(--text-base)',
        color: 'var(--text-primary)',
        ...style,
      }}
    >
      <span style={{ position: 'relative', width: '17px', height: '17px', flex: '0 0 auto' }}>
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', margin: 0, cursor: 'inherit' }}
        />
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '17px',
            height: '17px',
            borderRadius: 'var(--radius-xs)',
            background: on ? 'var(--accent)' : 'var(--surface-card)',
            border: `1.5px solid ${on ? 'var(--accent)' : 'var(--border-strong)'}`,
            transition: 'background var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)',
            color: '#fff',
          }}
        >
          {indeterminate ? (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
              <path d="M5 12h14" />
            </svg>
          ) : checked ? (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : null}
        </span>
      </span>
      {label != null && <span>{label}</span>}
    </label>
  );
}
