// apps/web/components/ticket-system/Toast.tsx
import type { ToastState } from '../../lib/ticket-system/constants';

export function Toast({ toast }: { toast: ToastState | null }) {
  if (!toast) return null;
  const tones = {
    success: { bg: 'var(--ink-900)', color: '#fff' },
    danger: { bg: 'var(--danger)', color: '#fff' },
  };
  const t = tones[toast.type];
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: t.bg,
        color: t.color,
        padding: '10px 16px',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--text-sm)',
        fontWeight: 500,
        boxShadow: 'var(--shadow-lg)',
        maxWidth: '90vw',
        textAlign: 'center',
      }}
    >
      {toast.message}
    </div>
  );
}
