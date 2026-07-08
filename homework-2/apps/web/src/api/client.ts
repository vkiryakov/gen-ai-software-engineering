import type {
  ClassificationResult,
  CreateTicketInput,
  ImportSummary,
  ListTicketsQuery,
  Ticket,
} from '@repo/contracts';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? `Request failed with status ${response.status}`);
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

function toQueryString(query: ListTicketsQuery): string {
  const entries = Object.entries(query).filter(
    (entry): entry is [string, string] => Boolean(entry[1]),
  );
  const params = new URLSearchParams(entries);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const ticketsApi = {
  list: (query: ListTicketsQuery = {}) => request<Ticket[]>(`/tickets${toQueryString(query)}`),
  create: (input: CreateTicketInput) =>
    request<Ticket>('/tickets', { method: 'POST', body: JSON.stringify(input) }),
  remove: (id: string) => request<void>(`/tickets/${id}`, { method: 'DELETE' }),
  autoClassify: (id: string) =>
    request<ClassificationResult>(`/tickets/${id}/auto-classify`, { method: 'POST' }),
  importFile: (file: File, autoClassify: boolean) => {
    const body = new FormData();
    body.append('file', file);
    return request<ImportSummary>(`/tickets/import?auto_classify=${autoClassify}`, {
      method: 'POST',
      body,
      // Override the JSON default so the browser sets the multipart boundary.
      headers: {},
    });
  },
};
