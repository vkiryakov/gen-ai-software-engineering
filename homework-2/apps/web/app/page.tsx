import { CONTRACTS_VERSION } from '@repo/contracts';

export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type ApiStatus = 'ok' | 'unavailable';

async function getApiStatus(): Promise<ApiStatus> {
  try {
    const res = await fetch(`${API_URL}/health`, { cache: 'no-store' });
    if (!res.ok) return 'unavailable';
    const body = (await res.json()) as { status?: string };
    return body.status === 'ok' ? 'ok' : 'unavailable';
  } catch {
    return 'unavailable';
  }
}

export default async function Home() {
  const status = await getApiStatus();
  const ok = status === 'ok';

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold">
        Homework 2 — Customer Support System
      </h1>
      <div className="flex items-center gap-3 rounded-lg border px-6 py-4">
        <span
          className={`h-3 w-3 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`}
        />
        <p className="text-lg">
          API ({API_URL}): {status}
        </p>
      </div>
      <p className="text-sm text-gray-500">contracts v{CONTRACTS_VERSION}</p>
    </main>
  );
}
