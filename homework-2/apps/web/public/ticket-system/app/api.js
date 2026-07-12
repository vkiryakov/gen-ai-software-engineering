// Triage — REST API client. Talks to the real backend when config.mock is
// false, otherwise delegates to the in-browser mock (app/mock-api.js) which
// implements the exact same contract. UI code should only ever call
// window.TriageAPI.* — never fetch() directly and never hold literal ticket
// data.
//
// Contract (see README.md for the full write-up):
//   GET    /tickets?status=&priority=&category=&assigned_to=&unassigned=&q=
//   GET    /tickets/:id
//   POST   /tickets                body: TicketInput
//   PATCH  /tickets/:id            body: Partial<TicketInput>
//   DELETE /tickets/:id
//   POST   /tickets/:id/classify   -> { category, priority, confidence, reasoning }
//   POST   /tickets/import         multipart/form-data, field "file"
window.ApiError = class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
};

window.TriageAPI = (function () {
  function buildQuery(filters) {
    const p = new URLSearchParams();
    if (filters.q) p.set('q', filters.q);
    if (filters.status && filters.status.length) p.set('status', filters.status.join(','));
    if (filters.priority && filters.priority.length) p.set('priority', filters.priority.join(','));
    if (filters.category && filters.category.length) p.set('category', filters.category.join(','));
    if (filters.assigned_to) p.set('assigned_to', filters.assigned_to);
    if (filters.unassigned) p.set('unassigned', 'true');
    const s = p.toString();
    return s ? `?${s}` : '';
  }

  async function request(path, { method = 'GET', body, isForm = false } = {}) {
    const cfg = window.TriageConfig.get();
    const headers = {};
    if (cfg.token) headers['Authorization'] = `Bearer ${cfg.token}`;
    if (!isForm) headers['Content-Type'] = 'application/json';

    let res;
    try {
      res = await fetch(cfg.apiBaseUrl.replace(/\/$/, '') + path, {
        method, headers,
        body: isForm ? body : body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      throw new window.ApiError('Network error — check the API base URL in Settings and your connection.');
    }

    if (!res.ok) {
      let msg = `Request failed (${res.status})`;
      try {
        const j = await res.json();
        if (j && j.error && j.error.message) msg = j.error.message;
      } catch {}
      throw new window.ApiError(msg, res.status);
    }
    if (res.status === 204) return null;
    try { return await res.json(); } catch { return null; }
  }

  function useMock() {
    return !!window.TriageConfig.get().mock;
  }

  return {
    async listTickets(filters = {}) {
      if (useMock()) return window.TriageMockAPI.listTickets(filters);
      const json = await request(`/tickets${buildQuery(filters)}`);
      return json.data;
    },
    async getTicket(id) {
      if (useMock()) return window.TriageMockAPI.getTicket(id);
      const json = await request(`/tickets/${encodeURIComponent(id)}`);
      return json.data;
    },
    async createTicket(input) {
      if (useMock()) return window.TriageMockAPI.createTicket(input);
      const json = await request('/tickets', { method: 'POST', body: input });
      return json.data;
    },
    async updateTicket(id, patch) {
      if (useMock()) return window.TriageMockAPI.updateTicket(id, patch);
      const json = await request(`/tickets/${encodeURIComponent(id)}`, { method: 'PATCH', body: patch });
      return json.data;
    },
    async deleteTicket(id) {
      if (useMock()) return window.TriageMockAPI.deleteTicket(id);
      await request(`/tickets/${encodeURIComponent(id)}`, { method: 'DELETE' });
      return true;
    },
    async classifyTicket(id) {
      if (useMock()) return window.TriageMockAPI.classifyTicket(id);
      const json = await request(`/tickets/${encodeURIComponent(id)}/classify`, { method: 'POST' });
      return json.data;
    },
    async importTickets(file) {
      if (useMock()) return window.TriageMockAPI.importTickets(file);
      const form = new FormData();
      form.append('file', file);
      const json = await request('/tickets/import', { method: 'POST', body: form, isForm: true });
      return json.data;
    },
  };
})();
