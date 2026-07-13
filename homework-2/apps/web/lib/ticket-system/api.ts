import type { ClassificationResult, CreateTicketInput, ImportSummary, LoginResponse, Ticket, UpdateTicketInput } from '@repo/contracts';

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export interface TicketFilters {
  status?: string[];
  priority?: string[];
  category?: string[];
  assigned_to?: string;
  unassigned?: boolean;
  q?: string;
}

function buildQuery(filters: TicketFilters): string {
  const p = new URLSearchParams();
  if (filters.q) p.set('q', filters.q);
  if (filters.status?.length) p.set('status', filters.status.join(','));
  if (filters.priority?.length) p.set('priority', filters.priority.join(','));
  if (filters.category?.length) p.set('category', filters.category.join(','));
  if (filters.assigned_to) p.set('assigned_to', filters.assigned_to);
  if (filters.unassigned) p.set('unassigned', 'true');
  const s = p.toString();
  return s ? `?${s}` : '';
}

interface RequestInit_ {
  method?: string;
  body?: unknown;
  isForm?: boolean;
}

export function createApiClient(baseUrl: string, getToken: () => string | null, onUnauthorized: () => void) {
  async function request<T>(path: string, init: RequestInit_ = {}): Promise<T> {
    const { method = 'GET', body, isForm = false } = init;
    const headers: Record<string, string> = {};
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (!isForm) headers['Content-Type'] = 'application/json';

    let res: Response;
    try {
      res = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, {
        method,
        headers,
        body: isForm ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new ApiError('Network error — check the API base URL and your connection.');
    }

    if (!res.ok) {
      if (res.status === 401) onUnauthorized();
      let message = `Request failed (${res.status})`;
      try {
        const errBody = (await res.json()) as { error?: { message?: string } };
        if (errBody.error?.message) message = errBody.error.message;
      } catch {
        // no JSON body — keep the generic message
      }
      throw new ApiError(message, res.status);
    }
    if (res.status === 204) return undefined as T;
    const parsed = (await res.json()) as { data: T };
    return parsed.data;
  }

  return {
    login(email: string, password: string): Promise<LoginResponse> {
      return request<LoginResponse>('/auth/login', { method: 'POST', body: { email, password } });
    },
    listTickets(filters: TicketFilters): Promise<Ticket[]> {
      return request<Ticket[]>(`/tickets${buildQuery(filters)}`);
    },
    getTicket(id: string): Promise<Ticket> {
      return request<Ticket>(`/tickets/${encodeURIComponent(id)}`);
    },
    createTicket(input: CreateTicketInput): Promise<Ticket> {
      return request<Ticket>('/tickets', { method: 'POST', body: input });
    },
    updateTicket(id: string, patch: UpdateTicketInput): Promise<Ticket> {
      return request<Ticket>(`/tickets/${encodeURIComponent(id)}`, { method: 'PATCH', body: patch });
    },
    async deleteTicket(id: string): Promise<void> {
      await request<undefined>(`/tickets/${encodeURIComponent(id)}`, { method: 'DELETE' });
    },
    classifyTicket(id: string): Promise<ClassificationResult> {
      return request<ClassificationResult>(`/tickets/${encodeURIComponent(id)}/classify`, { method: 'POST' });
    },
    importTickets(file: File): Promise<ImportSummary> {
      const form = new FormData();
      form.append('file', file);
      return request<ImportSummary>('/tickets/import', { method: 'POST', body: form, isForm: true });
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
