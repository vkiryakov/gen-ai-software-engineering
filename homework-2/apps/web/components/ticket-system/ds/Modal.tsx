'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';

export interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  width?: number;
  style?: React.CSSProperties;
}

export function Modal({ open, onClose, title, description, children, footer, width = 480, style = {} }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(20,23,29,0.45)', backdropFilter: 'blur(2px)' }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{ width: '100%', maxWidth: `${width}px`, maxHeight: '86vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', ...style }}
      >
        {(title || onClose) && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '18px 20px 0' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {title && <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)' as unknown as number }}>{title}</h3>}
              {description && <p style={{ marginTop: '4px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{description}</p>}
            </div>
            {onClose && (
              <button onClick={onClose} aria-label="Close" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '4px', lineHeight: 0, borderRadius: 'var(--radius-sm)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        <div style={{ padding: '16px 20px', overflowY: 'auto', fontSize: 'var(--text-base)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)' }}>{children}</div>
        {footer && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '14px 20px', borderTop: '1px solid var(--border-subtle)', background: 'var(--ink-50)' }}>{footer}</div>}
      </div>
    </div>
  );
}
