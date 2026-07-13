'use client';

import { useState } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type IconButtonVariant = 'secondary' | 'ghost' | 'primary';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  icon: ReactNode;
  label: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  style?: React.CSSProperties;
}

const sizes: Record<IconButtonSize, React.CSSProperties> = {
  sm: { width: '30px', height: '30px', fontSize: '15px' },
  md: { width: '36px', height: '36px', fontSize: '17px' },
  lg: { width: '42px', height: '42px', fontSize: '19px' },
};

const variants: Record<IconButtonVariant, React.CSSProperties> = {
  secondary: {
    background: 'var(--surface-card)',
    color: 'var(--text-secondary)',
    borderColor: 'var(--border-default)',
    boxShadow: 'var(--shadow-xs)',
  },
  ghost: { background: 'transparent', color: 'var(--text-secondary)', borderColor: 'transparent' },
  primary: { background: 'var(--accent)', color: 'var(--text-inverse)', borderColor: 'var(--accent)' },
};

const hoverBg: Record<IconButtonVariant, string> = {
  secondary: 'var(--surface-hover)',
  ghost: 'var(--surface-hover)',
  primary: 'var(--accent-hover)',
};

export function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  style = {},
  ...rest
}: IconButtonProps) {
  const [hover, setHover] = useState(false);
  const composed: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid transparent',
    borderRadius: 'var(--radius-md)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard)',
    ...sizes[size],
    ...variants[variant],
    ...(hover && !disabled
      ? { background: hoverBg[variant], color: variant === 'primary' ? 'var(--text-inverse)' : 'var(--text-primary)' }
      : null),
    ...(disabled ? { opacity: 0.45 } : null),
    ...style,
  };
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      style={composed}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      {...rest}
    >
      {icon}
    </button>
  );
}
