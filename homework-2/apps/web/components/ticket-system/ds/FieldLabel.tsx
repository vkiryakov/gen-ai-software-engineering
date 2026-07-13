import type { ReactNode } from 'react';

export interface FieldLabelProps {
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  htmlFor?: string;
  children?: ReactNode;
  style?: React.CSSProperties;
}

export function FieldLabel({ label, required = false, hint, error, htmlFor, children, style = {} }: FieldLabelProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', ...style }}>
      {label && (
        <label htmlFor={htmlFor} style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' as unknown as number, color: 'var(--text-primary)' }}>
          {label}
          {required && <span style={{ color: 'var(--danger)', marginLeft: '3px' }}>*</span>}
        </label>
      )}
      {children}
      {error ? (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)' }}>{error}</span>
      ) : hint ? (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{hint}</span>
      ) : null}
    </div>
  );
}
