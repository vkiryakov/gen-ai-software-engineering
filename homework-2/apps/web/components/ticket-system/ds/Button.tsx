'use client';

import { useState } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-soft';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  style?: React.CSSProperties;
}

const base: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  fontFamily: 'var(--font-sans)',
  fontWeight: 'var(--weight-semibold)' as unknown as number,
  border: '1px solid transparent',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition:
    'background var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)',
  userSelect: 'none',
  textDecoration: 'none',
  lineHeight: 1,
};

const sizes: Record<ButtonSize, React.CSSProperties> = {
  sm: { height: '30px', padding: '0 10px', fontSize: 'var(--text-sm)' },
  md: { height: '36px', padding: '0 14px', fontSize: 'var(--text-base)' },
  lg: { height: '42px', padding: '0 18px', fontSize: 'var(--text-md)' },
};

const variants: Record<ButtonVariant, React.CSSProperties> = {
  primary: { background: 'var(--accent)', color: 'var(--text-inverse)', borderColor: 'var(--accent)' },
  secondary: {
    background: 'var(--surface-card)',
    color: 'var(--text-primary)',
    borderColor: 'var(--border-default)',
    boxShadow: 'var(--shadow-xs)',
  },
  ghost: { background: 'transparent', color: 'var(--text-secondary)', borderColor: 'transparent' },
  danger: { background: 'var(--danger)', color: 'var(--text-inverse)', borderColor: 'var(--danger)' },
  'danger-soft': { background: 'var(--danger-bg)', color: 'var(--danger)', borderColor: 'var(--danger-border)' },
};

const hoverBg: Record<ButtonVariant, string> = {
  primary: 'var(--accent-hover)',
  secondary: 'var(--surface-hover)',
  ghost: 'var(--surface-hover)',
  danger: '#bd2932',
  'danger-soft': '#fbdfe2',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  iconLeft = null,
  iconRight = null,
  style = {},
  ...rest
}: ButtonProps) {
  const [hover, setHover] = useState(false);
  const composed: React.CSSProperties = {
    ...base,
    ...sizes[size],
    ...variants[variant],
    ...(hover && !disabled ? { background: hoverBg[variant] } : null),
    ...(fullWidth ? { width: '100%' } : null),
    ...(disabled ? { opacity: 0.5, cursor: 'not-allowed', boxShadow: 'none' } : null),
    ...style,
  };
  return (
    <button
      style={composed}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      {...rest}
    >
      {iconLeft}
      {children != null && <span>{children}</span>}
      {iconRight}
    </button>
  );
}
