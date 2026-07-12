// Triage — mock backend. Implements the exact same contract as the real API
// (see app/api.js) so the UI is identical either way. Swap off via Settings
// once the Tasks 1–2 backend is live — nothing in the UI layer changes.
window.TriageMockAPI = (function () {
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2));
  const hoursAgo = (h) => new Date(Date.now() - h * 3600 * 1000).toISOString();
  const minsAgo = (m) => new Date(Date.now() - m * 60 * 1000).toISOString();

  let nextNumber = 4791;
  const db = [
    {
      id: uid(), number: 4790, customer_id: 'cus_alex_turner', customer_email: 'alex.turner@fastmail.com', customer_name: 'Alex Turner',
      subject: 'Refund not showing on my statement',
      description: "I was told my refund of $128.40 was processed on the 3rd, but nothing has shown up on my statement. It's now been five business days. Order #A-99321.",
      category: 'billing_question', priority: 'urgent', status: 'in_progress',
      created_at: hoursAgo(5), updated_at: hoursAgo(2), resolved_at: null,
      assigned_to: 'priya', tags: ['refund', 'p1'],
      metadata: { source: 'email', browser: 'Chrome 126 / Windows', device_type: 'desktop' },
    },
    {
      id: uid(), number: 4788, customer_id: 'cus_dana_okoro', customer_email: 'dana@okoro.io', customer_name: 'Dana Okoro',
      subject: 'Cannot log in after password reset',
      description: "I've reset my password twice now and it still says invalid credentials when I try to log in on web. Mobile works fine though.",
      category: 'account_access', priority: 'high', status: 'in_progress',
      created_at: minsAgo(40), updated_at: minsAgo(25), resolved_at: null,
      assigned_to: 'priya', tags: ['login', 'auth'],
      metadata: { source: 'chat', browser: 'Safari / iOS', device_type: 'mobile' },
    },
    {
      id: uid(), number: 4787, customer_id: 'cus_wei_zhang', customer_email: 'wei.z@northloop.co', customer_name: 'Wei Zhang',
      subject: 'Feature request: bulk export to CSV',
      description: "Would love to be able to export all my records to CSV in one click instead of page by page. Is that on the roadmap?",
      category: 'feature_request', priority: 'low', status: 'waiting_customer',
      created_at: hoursAgo(3), updated_at: hoursAgo(1), resolved_at: null,
      assigned_to: 'marco', tags: ['feature-request'],
      metadata: { source: 'email', browser: 'Firefox / Linux', device_type: 'desktop' },
    },
    {
      id: uid(), number: 4785, customer_id: 'cus_grace_miller', customer_email: 'grace.miller@gmail.com', customer_name: 'Grace Miller',
      subject: 'Double charged for annual plan',
      description: "I've just noticed two identical $240 charges on the same day for my annual subscription. Please refund the duplicate urgently.",
      category: 'billing_question', priority: 'urgent', status: 'new',
      created_at: minsAgo(8), updated_at: minsAgo(8), resolved_at: null,
      assigned_to: null, tags: ['billing', 'refund', 'p1'],
      metadata: { source: 'email', browser: 'Chrome 126 / macOS', device_type: 'desktop' },
    },
    {
      id: uid(), number: 4782, customer_id: 'cus_tom_becker', customer_email: 'tom@beckerlabs.dev', customer_name: 'Tom Becker',
      subject: 'How do I add teammates to my workspace?',
      description: "I'm trying to invite two colleagues to my workspace but I only see a personal settings page — where do team invites live?",
      category: 'account_access', priority: 'medium', status: 'in_progress',
      created_at: hoursAgo(4), updated_at: hoursAgo(3), resolved_at: null,
      assigned_to: 'sam', tags: ['onboarding'],
      metadata: { source: 'chat', browser: 'Edge / Windows', device_type: 'desktop' },
    },
    {
      id: uid(), number: 4779, customer_id: 'cus_lena_fischer', customer_email: 'lena@stackpoint.io', customer_name: 'Lena Fischer',
      subject: 'API returning 500 on /tickets endpoint',
      description: "Since ~6am UTC roughly 1 in 5 calls to /v2/tickets returns a 500 error with no body. Nothing changed on our side. Can you check?",
      category: 'bug_report', priority: 'high', status: 'in_progress',
      created_at: hoursAgo(5), updated_at: hoursAgo(4), resolved_at: null,
      assigned_to: null, tags: ['api', 'bug'],
      metadata: { source: 'api', browser: '—', device_type: 'desktop' },
    },
    {
      id: uid(), number: 4771, customer_id: 'cus_omar_haddad', customer_email: 'omar.h@brightway.org', customer_name: 'Omar Haddad',
      subject: 'Thanks for the quick help yesterday!',
      description: "Just wanted to say thanks — the issue was resolved in minutes. Great support.",
      category: 'other', priority: 'low', status: 'resolved',
      created_at: hoursAgo(30), updated_at: hoursAgo(26), resolved_at: hoursAgo(26),
      assigned_to: 'jo', tags: [],
      metadata: { source: 'email', browser: 'Chrome 126 / macOS', device_type: 'desktop' },
    },
  ];

  function clone(t) { return JSON.parse(JSON.stringify(t)); }

  function find(id) {
    const t = db.find((x) => x.id === id);
    if (!t) throw new window.ApiError(`Ticket ${id} not found.`, 404);
    return t;
  }

  function validateInput(input, { partial = false } = {}) {
    const errors = [];
    const req = (k, label) => { if (!partial && !String(input[k] || '').trim()) errors.push(`${label} is required.`); };
    req('subject', 'Subject');
    req('customer_name', 'Customer name');
    req('customer_email', 'Customer email');
    req('description', 'Description');
    if (input.customer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.customer_email)) errors.push('Customer email looks invalid.');
    if (input.description && input.description.trim().length < 10) errors.push('Description must be at least 10 characters.');
    if (input.category && !window.TRIAGE_META.CATEGORIES.includes(input.category)) errors.push('Unknown category.');
    if (input.priority && !window.TRIAGE_META.PRIORITIES.includes(input.priority)) errors.push('Unknown priority.');
    if (input.status && !window.TRIAGE_META.STATUSES.includes(input.status)) errors.push('Unknown status.');
    if (errors.length) throw new window.ApiError(errors.join(' '), 422);
  }

  // --- classification heuristic -------------------------------------------
  const RULES = [
    { re: /refund|charge|invoice|billing|payment|statement|subscription/i, category: 'billing_question' },
    { re: /password|log ?in|access|locked out|credential|account/i, category: 'account_access' },
    { re: /\b50\d\b|\bapi\b|error|bug|crash|exception|endpoint/i, category: 'bug_report' },
    { re: /feature|roadmap|would love|request|wish/i, category: 'feature_request' },
    { re: /how do i|how to|where do|what is/i, category: 'technical_issue' },
  ];
  function classify(ticket) {
    const text = `${ticket.subject} ${ticket.description}`;
    const hit = RULES.find((r) => r.re.test(text));
    const category = hit ? hit.category : 'other';
    const urgent = /urgent|immediately|asap|double charged|can'?t access|no response/i.test(text);
    const high = /soon|important|escalat|business days/i.test(text);
    const priority = urgent ? 'urgent' : high ? 'high' : text.length > 220 ? 'medium' : 'low';
    let hash = 0;
    for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
    const confidence = Math.round((0.72 + (hash % 26) / 100) * 100) / 100;
    const matched = hit ? hit.re.exec(text)[0] : null;
    const reasoning = hit
      ? `Matched "${matched}" in the ticket text, which is characteristic of ${window.TRIAGE_META.CATEGORY_LABEL[category].toLowerCase()} tickets. Priority set to ${priority} based on urgency language${urgent ? ' ("urgent"/"immediately"-style phrasing)' : ''}.`
      : `No strong category signal found in the text — defaulted to "Other". Priority set to ${priority} based on message length and tone.`;
    return { category, priority, confidence, reasoning };
  }

  // --- bulk import ----------------------------------------------------------
  function parseCsv(text) {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
    if (!lines.length) return [];
    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map((line) => {
      const cells = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      const row = {};
      headers.forEach((h, i) => { row[h] = cells[i]; });
      return row;
    });
  }
  function parseXml(text) {
    const doc = new DOMParser().parseFromString(text, 'text/xml');
    if (doc.querySelector('parsererror')) throw new window.ApiError('Malformed XML file.', 400);
    return [...doc.querySelectorAll('ticket')].map((el) => {
      const row = {};
      [...el.children].forEach((child) => { row[child.tagName] = child.textContent; });
      return row;
    });
  }
  async function readFileText(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(new Error('Could not read file.'));
      r.readAsText(file);
    });
  }

  const api = {
    async listTickets(filters = {}) {
      await delay(280);
      let list = db.filter((t) => {
        if (filters.status && filters.status.length && !filters.status.includes(t.status)) return false;
        if (filters.priority && filters.priority.length && !filters.priority.includes(t.priority)) return false;
        if (filters.category && filters.category.length && !filters.category.includes(t.category)) return false;
        if (filters.assigned_to && t.assigned_to !== filters.assigned_to) return false;
        if (filters.unassigned && t.assigned_to) return false;
        if (filters.q) {
          const q = filters.q.toLowerCase();
          const hay = `${t.subject} ${t.customer_name} ${t.customer_email} ${t.number}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
      list = list.slice().sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      return list.map(clone);
    },

    async getTicket(id) {
      await delay(200);
      return clone(find(id));
    },

    async createTicket(input) {
      await delay(320);
      validateInput(input);
      const now = new Date().toISOString();
      const ticket = {
        id: uid(), number: nextNumber++,
        customer_id: 'cus_' + input.customer_name.toLowerCase().replace(/[^a-z]+/g, '_'),
        customer_email: input.customer_email, customer_name: input.customer_name,
        subject: input.subject, description: input.description,
        category: input.category || 'other', priority: input.priority || 'medium', status: 'new',
        created_at: now, updated_at: now, resolved_at: null,
        assigned_to: input.assigned_to || null, tags: input.tags || [],
        metadata: { source: (input.metadata && input.metadata.source) || 'web_form', browser: '—', device_type: 'desktop' },
      };
      db.unshift(ticket);
      return clone(ticket);
    },

    async updateTicket(id, patch) {
      await delay(280);
      validateInput(patch, { partial: true });
      const t = find(id);
      Object.assign(t, patch);
      t.updated_at = new Date().toISOString();
      if (patch.status === 'resolved' && !patch.resolved_at) t.resolved_at = t.updated_at;
      return clone(t);
    },

    async deleteTicket(id) {
      await delay(240);
      const idx = db.findIndex((x) => x.id === id);
      if (idx === -1) throw new window.ApiError(`Ticket ${id} not found.`, 404);
      db.splice(idx, 1);
      return true;
    },

    async classifyTicket(id) {
      await delay(650);
      const t = find(id);
      return classify(t);
    },

    async importTickets(file) {
      await delay(500);
      const ext = (/\.([a-z0-9]+)$/i.exec(file.name) || [, ''])[1].toLowerCase();
      const text = await readFileText(file);
      let rows = [];
      try {
        if (ext === 'json') {
          const parsed = JSON.parse(text);
          rows = Array.isArray(parsed) ? parsed : parsed.tickets || [];
        } else if (ext === 'csv') {
          rows = parseCsv(text);
        } else if (ext === 'xml') {
          rows = parseXml(text);
        } else {
          throw new window.ApiError(`Unsupported file type ".${ext}" — use .csv, .json or .xml.`, 400);
        }
      } catch (e) {
        throw new window.ApiError(e.message || 'Could not parse the file.', 400);
      }

      const errors = [];
      let imported = 0;
      rows.forEach((row, i) => {
        try {
          const input = {
            subject: row.subject, customer_name: row.customer_name, customer_email: row.customer_email,
            description: row.description || row.subject,
            category: window.TRIAGE_META.CATEGORIES.includes(row.category) ? row.category : 'other',
            priority: window.TRIAGE_META.PRIORITIES.includes(row.priority) ? row.priority : 'medium',
          };
          validateInput(input);
          const now = new Date().toISOString();
          db.unshift({
            id: uid(), number: nextNumber++,
            customer_id: 'cus_' + input.customer_name.toLowerCase().replace(/[^a-z]+/g, '_'),
            customer_email: input.customer_email, customer_name: input.customer_name,
            subject: input.subject, description: input.description,
            category: input.category, priority: input.priority, status: 'new',
            created_at: now, updated_at: now, resolved_at: null,
            assigned_to: null, tags: ['imported'],
            metadata: { source: 'email', browser: '—', device_type: 'desktop' },
          });
          imported++;
        } catch (e) {
          errors.push({ row: i + 2, message: e.message || 'Invalid row.' });
        }
      });

      return { imported_count: imported, failed_count: errors.length, errors };
    },
  };

  return api;
})();
