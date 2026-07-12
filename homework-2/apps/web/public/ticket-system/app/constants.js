// Triage — reference data + enums (NOT ticket records — those always come
// from the API, live or mocked). Shared by list/detail/form components.
window.TRIAGE_META = (function () {
  const agents = [
    { id: 'priya', name: 'Priya Nair' },
    { id: 'marco', name: 'Marco Diaz' },
    { id: 'sam', name: 'Sam Lee' },
    { id: 'jo', name: 'Jo Kim' },
  ];

  const CATEGORIES = ['account_access', 'technical_issue', 'billing_question', 'feature_request', 'bug_report', 'other'];
  const CATEGORY_LABEL = {
    account_access: 'Account access', technical_issue: 'Technical issue', billing_question: 'Billing question',
    feature_request: 'Feature request', bug_report: 'Bug report', other: 'Other',
  };
  const PRIORITIES = ['urgent', 'high', 'medium', 'low'];
  const PRIORITY_LABEL = { urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low' };
  const STATUSES = ['new', 'in_progress', 'waiting_customer', 'resolved', 'closed'];
  // Maps a schema status to the design system's fixed StatusTag palette (status = color key, label = shown text).
  const STATUS_TAG = {
    new: { status: 'new', label: 'New' },
    in_progress: { status: 'open', label: 'In progress' },
    waiting_customer: { status: 'pending', label: 'Waiting on customer' },
    resolved: { status: 'solved', label: 'Resolved' },
    closed: { status: 'closed', label: 'Closed' },
  };
  const SOURCES = ['web_form', 'email', 'api', 'chat', 'phone'];
  const SOURCE_LABEL = { web_form: 'Web form', email: 'Email', api: 'API', chat: 'Chat', phone: 'Phone' };
  const DEVICE_TYPES = ['desktop', 'mobile', 'tablet'];
  const DEVICE_LABEL = { desktop: 'Desktop', mobile: 'Mobile', tablet: 'Tablet' };

  const queues = [
    { id: 'all', label: 'All tickets', icon: 'inbox' },
    { id: 'mine', label: 'Assigned to me', icon: 'user' },
    { id: 'unassigned', label: 'Unassigned', icon: 'user-x' },
    { id: 'urgent', label: 'Urgent', icon: 'flame' },
    { id: 'waiting_customer', label: 'Waiting on customer', icon: 'clock' },
    { id: 'resolved', label: 'Resolved', icon: 'check-check' },
  ];

  function relative(iso) {
    if (!iso) return '—';
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.round(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.round(hrs / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toISOString().slice(0, 10);
  }

  return {
    agents, CATEGORIES, CATEGORY_LABEL, PRIORITIES, PRIORITY_LABEL, STATUSES, STATUS_TAG,
    SOURCES, SOURCE_LABEL, DEVICE_TYPES, DEVICE_LABEL, queues, relative,
  };
})();
