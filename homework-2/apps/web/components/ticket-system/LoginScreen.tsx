'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Check } from 'lucide-react';
import { Button } from './ds/Button';
import { Input } from './ds/Input';
import { FieldLabel } from './ds/FieldLabel';
import { Banner } from './ds/Banner';
import { ApiError, type ApiClient } from '../../lib/ticket-system/api';

export interface LoginScreenProps {
  api: ApiClient;
  onSuccess: (token: string, email: string) => void;
}

const MARK = (
  <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 3, height: 26 }}>
    <span style={{ width: 5, borderRadius: 2, background: 'var(--brand-500)', height: 10 }} />
    <span style={{ width: 5, borderRadius: 2, background: 'var(--brand-500)', height: 16 }} />
    <span style={{ width: 5, borderRadius: 2, background: 'var(--brand-500)', height: 22 }} />
    <span style={{ width: 5, borderRadius: 2, background: 'var(--brand-500)', height: 28 }} />
  </span>
);

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, boxSizing: 'border-box' }}>
      <div style={{ width: 380, maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          {MARK}
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', color: 'var(--ink-950)' }}>Triage</span>
        </div>
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', padding: 32, boxSizing: 'border-box' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function SuccessScreen() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center', padding: '12px 0' }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Check size={24} color="var(--success)" />
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--ink-950)' }}>Вход выполнен</div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 4 }}>Открываем очередь тикетов…</div>
      </div>
    </div>
  );
}

export function LoginScreen({ api, onSuccess }: LoginScreenProps) {
  const [step, setStep] = useState<'form' | 'done'>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const { token } = await api.login(email, password);
      setLoading(false);
      setStep('done');
      setTimeout(() => onSuccess(token, email), 900);
    } catch (err) {
      setLoading(false);
      setError(err instanceof ApiError ? err.message : 'Something went wrong logging in.');
    }
  };

  if (step === 'done') {
    return (
      <Shell>
        <SuccessScreen />
      </Shell>
    );
  }

  return (
    <Shell>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--ink-950)', letterSpacing: '-0.02em' }}>Вход в Triage</div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 4 }}>Войдите, чтобы продолжить работу с очередью тикетов.</div>
        </div>

        {error && (
          <Banner tone="danger" title="Не удалось войти">
            {error}
          </Banner>
        )}

        <FieldLabel label="Email">
          <Input type="email" required placeholder="you@company.com" value={email} invalid={!!error} onChange={(e) => setEmail(e.target.value)} autoFocus />
        </FieldLabel>

        <FieldLabel label="Пароль">
          <Input type="password" required placeholder="••••••••" value={password} invalid={!!error} onChange={(e) => setPassword(e.target.value)} />
        </FieldLabel>

        <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
          {loading ? 'Проверка…' : 'Войти'}
        </Button>
      </form>
    </Shell>
  );
}
