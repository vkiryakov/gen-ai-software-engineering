import {
  TicketCategorySchema,
  TicketPrioritySchema,
  TicketStatusSchema,
  TicketSourceSchema,
  DeviceTypeSchema,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
  type TicketSource,
  type DeviceType,
} from '@repo/contracts';

export const CATEGORIES = TicketCategorySchema.options;
export const CATEGORY_LABEL: Record<TicketCategory, string> = {
  account_access: 'Account access',
  technical_issue: 'Technical issue',
  billing_question: 'Billing question',
  feature_request: 'Feature request',
  bug_report: 'Bug report',
  other: 'Other',
};

export const PRIORITIES = TicketPrioritySchema.options;
export const PRIORITY_LABEL: Record<TicketPriority, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const STATUSES = TicketStatusSchema.options;

export interface StatusTagMeta {
  status: 'new' | 'open' | 'pending' | 'solved' | 'closed';
  label: string;
}

export const STATUS_TAG: Record<TicketStatus, StatusTagMeta> = {
  new: { status: 'new', label: 'New' },
  in_progress: { status: 'open', label: 'In progress' },
  waiting_customer: { status: 'pending', label: 'Waiting on customer' },
  resolved: { status: 'solved', label: 'Resolved' },
  closed: { status: 'closed', label: 'Closed' },
};

export const SOURCES = TicketSourceSchema.options;
export const SOURCE_LABEL: Record<TicketSource, string> = {
  web_form: 'Web form',
  email: 'Email',
  api: 'API',
  chat: 'Chat',
  phone: 'Phone',
};

export const DEVICE_TYPES = DeviceTypeSchema.options;
export const DEVICE_LABEL: Record<DeviceType, string> = {
  desktop: 'Desktop',
  mobile: 'Mobile',
  tablet: 'Tablet',
};

export interface Agent {
  id: string;
  name: string;
}

// No agent/user management on the backend (single admin account) — this list
// only powers the "Assignee" dropdown and the "Assigned to me" queue, matching
// the original prototype. See plan Task 16 for the documented limitation.
export const AGENTS: Agent[] = [
  { id: 'priya', name: 'Priya Nair' },
  { id: 'marco', name: 'Marco Diaz' },
  { id: 'sam', name: 'Sam Lee' },
  { id: 'jo', name: 'Jo Kim' },
];

export type QueueId = 'all' | 'mine' | 'unassigned' | 'urgent' | 'waiting_customer' | 'resolved';

export interface Queue {
  id: QueueId;
  label: string;
  icon: 'inbox' | 'user' | 'user-x' | 'flame' | 'clock' | 'check-check';
}

export const QUEUES: Queue[] = [
  { id: 'all', label: 'All tickets', icon: 'inbox' },
  { id: 'mine', label: 'Assigned to me', icon: 'user' },
  { id: 'unassigned', label: 'Unassigned', icon: 'user-x' },
  { id: 'urgent', label: 'Urgent', icon: 'flame' },
  { id: 'waiting_customer', label: 'Waiting on customer', icon: 'clock' },
  { id: 'resolved', label: 'Resolved', icon: 'check-check' },
];

export interface ToastState {
  message: string;
  type: 'success' | 'danger';
}

export function relative(iso: string | null): string {
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
