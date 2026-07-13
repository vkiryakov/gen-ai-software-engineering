# Ticket System: full Next.js/TSX rewrite — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static React-UMD/Babel-standalone prototype (`apps/web/public/ticket-system/`) with a real Next.js/TypeScript frontend, mounted at `apps/web`'s home route, talking to the already-working `apps/api` backend — no mocks, no browser-side Babel.

**Architecture:** Design-system primitives ported verbatim (visually) from `_ds_bundle.js` into `apps/web/components/ticket-system/ds/*.tsx`; feature components (`Sidebar`, `TicketList`, `TicketDetail`, `TicketFormModal`, `ImportModal`, `LoginScreen`, `TopBar`, `Toast`) ported from the `.jsx` prototype files into `apps/web/components/ticket-system/*.tsx`; a typed REST client in `apps/web/lib/ticket-system/api.ts`; shared enums/labels in `apps/web/lib/ticket-system/constants.ts` (sourced from `@repo/contracts` where possible); a root client component `TriageApp.tsx` holding the login→app state machine, rendered by `apps/web/app/page.tsx`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind v4 (untouched, coexists with the ported inline-style components), `lucide-react` (new dependency, replaces the Lucide CDN + `data-lucide` pattern).

## Global Constraints

- Node >=22, pnpm 10.16.1, monorepo root for all commands below is `homework-2/` (has `pnpm-workspace.yaml`).
- `apps/web` package name is `web` — use `pnpm --filter web <script>` from `homework-2/`.
- Do not modify `apps/api` or `packages/contracts` — the backend contract is already implemented and documented in `docs/superpowers/specs/2026-07-12-ticket-api-design.md`.
- No mock API, no fake/demo login rule, no Babel-in-browser, no UMD React/ReactDOM, no Lucide CDN script — everything is real, compiled TSX.
- Copy CSS token *values* verbatim from `apps/web/public/ticket-system/_ds/triage-design-system-a9a780a9-7c56-4382-83bd-c978a6eefa88/` — do not invent new colors/spacing/radii.
- There is no test runner configured for `apps/web` and adding one is out of scope (see spec's "Вне объёма"). The per-task verification gate is `pnpm --filter web exec tsc --noEmit --project tsconfig.json` (must report zero errors). Lint (`pnpm --filter web lint`) and a full `pnpm --filter web build` run only at the end (Task 16), plus a manual browser walkthrough.
- Backend test credentials: `admin@ignore.com` / `123`. Backend runs on `http://localhost:3001` by default (`apps/api/.env.example`), frontend dev server on `http://localhost:3000` (CORS in `apps/api/src/main.ts` is locked to that origin).
- Ticket enums (`TicketCategory`, `TicketPriority`, `TicketStatus`, `TicketSource`, `DeviceType`) come from `@repo/contracts` (`packages/contracts/src/enums.ts`) — never redeclare the literal value lists by hand.

---

## Task 1: Dependencies + design tokens

**Files:**
- Modify: `apps/web/package.json` (add `lucide-react` dependency)
- Create: `apps/web/app/styles/tokens/fonts.css`
- Create: `apps/web/app/styles/tokens/colors.css`
- Create: `apps/web/app/styles/tokens/typography.css`
- Create: `apps/web/app/styles/tokens/spacing.css`
- Create: `apps/web/app/styles/tokens/radius.css`
- Create: `apps/web/app/styles/tokens/elevation.css`
- Create: `apps/web/app/styles/tokens/base.css`
- Create: `apps/web/app/styles/design-tokens.css`
- Create: `apps/web/app/styles/ticket-system.css`
- Modify: `apps/web/app/globals.css`

**Interfaces:**
- Produces: CSS custom properties (`--brand-500`, `--text-sm`, `--radius-md`, `--shadow-md`, `--dur-fast`, `--ease-standard`, etc. — full list below) available globally to every component written in later tasks. Produces CSS classes `.triage-mobile-only`, `.triage-sidebar-backdrop`, `.triage-sidebar`, `.triage-sidebar.is-open`, `.triage-list-pane`, `.triage-detail-pane`, `.triage-filter-popover`, `.triage-collapse-toggle` used by `Sidebar.tsx`/`TicketList.tsx`/`TicketDetail.tsx` (Tasks 9–11).

- [ ] **Step 1: Add `lucide-react` to `apps/web/package.json`**

Edit the `dependencies` block:

```json
  "dependencies": {
    "@repo/contracts": "workspace:*",
    "lucide-react": "^0.462.0",
    "next": "16.2.10",
    "react": "19.2.4",
    "react-dom": "19.2.4"
  },
```

- [ ] **Step 2: Install**

Run: `cd homework-2 && pnpm install`
Expected: lockfile updates, `apps/web/node_modules/lucide-react` exists, no errors.

- [ ] **Step 3: Create `apps/web/app/styles/tokens/fonts.css`**

```css
/* Triage — Webfonts. Served via Google Fonts CDN (no binaries were provided). */
@import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=Schibsted+Grotesk:wght@500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
```

- [ ] **Step 4: Create `apps/web/app/styles/tokens/colors.css`**

```css
/* Triage — Color tokens. Warm-neutral slate base with an indigo "signal" primary. */
:root {
  --white: #ffffff;
  --ink-50:  #f6f7f9;
  --ink-100: #eef0f4;
  --ink-150: #e4e7ec;
  --ink-200: #d6dae2;
  --ink-300: #b6bdc9;
  --ink-400: #8b94a3;
  --ink-500: #6a7383;
  --ink-600: #515a6a;
  --ink-700: #3c4351;
  --ink-800: #2a2f3a;
  --ink-900: #1d212a;
  --ink-950: #14171d;

  --brand-50:  #f1f1fd;
  --brand-100: #e3e2fb;
  --brand-200: #c9c6f6;
  --brand-300: #a49dee;
  --brand-400: #7d72e6;
  --brand-500: #5a4bd6;
  --brand-600: #4a3cc0;
  --brand-700: #3c319e;
  --brand-800: #322a7f;
  --brand-900: #2a2566;

  --priority-urgent:      #d22f3a;
  --priority-urgent-bg:   #fdecee;
  --priority-urgent-border:#f6c9ce;
  --priority-high:        #d9631a;
  --priority-high-bg:     #fdf0e6;
  --priority-high-border: #f6d4bb;
  --priority-medium:      #b6820a;
  --priority-medium-bg:   #fbf3d9;
  --priority-medium-border:#eddda3;
  --priority-low:         #2f7ecb;
  --priority-low-bg:      #e9f1fb;
  --priority-low-border:  #c3dbf3;
  --priority-none:        #6a7383;
  --priority-none-bg:     #eef0f4;
  --priority-none-border: #d6dae2;

  --status-new:     #5a4bd6;
  --status-new-bg:  #ecebfb;
  --status-open:    #2f7ecb;
  --status-open-bg: #e9f1fb;
  --status-pending: #b6820a;
  --status-pending-bg:#fbf3d9;
  --status-solved:  #1f9d63;
  --status-solved-bg:#e5f5ed;
  --status-closed:  #6a7383;
  --status-closed-bg:#eef0f4;

  --success:      #17935a;
  --success-bg:   #e5f5ed;
  --success-border:#b6e2cb;
  --warning:      #b6820a;
  --warning-bg:   #fbf3d9;
  --warning-border:#eddda3;
  --danger:       #d22f3a;
  --danger-bg:    #fdecee;
  --danger-border:#f6c9ce;
  --info:         #2f7ecb;
  --info-bg:      #e9f1fb;
  --info-border:  #c3dbf3;

  --bg-app:        var(--ink-50);
  --bg-canvas:     var(--white);
  --surface-card:  var(--white);
  --surface-sunken:var(--ink-100);
  --surface-raised:var(--white);
  --surface-hover: var(--ink-50);
  --surface-active:var(--ink-100);
  --surface-selected: var(--brand-50);
  --surface-inverse: var(--ink-900);

  --text-primary:  var(--ink-900);
  --text-secondary:var(--ink-600);
  --text-tertiary: var(--ink-500);
  --text-disabled: var(--ink-400);
  --text-inverse:  var(--white);
  --text-link:     var(--brand-600);
  --text-brand:    var(--brand-600);

  --border-subtle: var(--ink-150);
  --border-default:var(--ink-200);
  --border-strong: var(--ink-300);
  --border-focus:  var(--brand-500);

  --accent:        var(--brand-500);
  --accent-hover:  var(--brand-600);
  --accent-active: var(--brand-700);
  --accent-soft:   var(--brand-50);

  --focus-ring: color-mix(in oklch, var(--brand-500) 40%, transparent);
}
```

- [ ] **Step 5: Create `apps/web/app/styles/tokens/typography.css`**

```css
/* Triage — Typography tokens */
:root {
  --font-display: 'Schibsted Grotesk', 'Hanken Grotesk', system-ui, sans-serif;
  --font-sans:    'Hanken Grotesk', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-mono:    'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, monospace;

  --text-2xs:  11px;
  --text-xs:   12px;
  --text-sm:   13px;
  --text-base: 14px;
  --text-md:   15px;
  --text-lg:   17px;
  --text-xl:   20px;
  --text-2xl:  24px;
  --text-3xl:  30px;
  --text-4xl:  38px;
  --text-5xl:  50px;

  --leading-tight:   1.15;
  --leading-snug:    1.3;
  --leading-normal:  1.5;
  --leading-relaxed: 1.65;

  --weight-regular:  400;
  --weight-medium:   500;
  --weight-semibold: 600;
  --weight-bold:     700;
  --weight-extra:    800;

  --tracking-tight:  -0.02em;
  --tracking-snug:   -0.01em;
  --tracking-normal: 0;
  --tracking-wide:   0.02em;
  --tracking-caps:   0.06em;
}
```

- [ ] **Step 6: Create `apps/web/app/styles/tokens/spacing.css`**

```css
/* Triage — Spacing & layout tokens. 4px base grid. */
:root {
  --space-0:  0;
  --space-1:  2px;
  --space-2:  4px;
  --space-3:  6px;
  --space-4:  8px;
  --space-5:  12px;
  --space-6:  16px;
  --space-7:  20px;
  --space-8:  24px;
  --space-9:  32px;
  --space-10: 40px;
  --space-11: 48px;
  --space-12: 64px;
  --space-13: 80px;
  --space-14: 96px;

  --sidebar-w:      248px;
  --sidebar-w-collapsed: 60px;
  --topbar-h:       52px;
  --list-pane-w:    380px;
  --content-max:    1120px;
  --row-h:          44px;
  --row-h-compact:  36px;
}
```

- [ ] **Step 7: Create `apps/web/app/styles/tokens/radius.css`**

```css
/* Triage — Radius tokens */
:root {
  --radius-xs:  3px;
  --radius-sm:  5px;
  --radius-md:  7px;
  --radius-lg:  10px;
  --radius-xl:  14px;
  --radius-2xl: 20px;
  --radius-pill: 999px;
}
```

- [ ] **Step 8: Create `apps/web/app/styles/tokens/elevation.css`**

```css
/* Triage — Elevation / shadow & motion tokens */
:root {
  --shadow-xs: 0 1px 2px rgba(20, 23, 29, 0.05);
  --shadow-sm: 0 1px 2px rgba(20, 23, 29, 0.06), 0 1px 3px rgba(20, 23, 29, 0.05);
  --shadow-md: 0 2px 4px rgba(20, 23, 29, 0.06), 0 4px 10px rgba(20, 23, 29, 0.07);
  --shadow-lg: 0 4px 8px rgba(20, 23, 29, 0.06), 0 12px 28px rgba(20, 23, 29, 0.12);
  --shadow-xl: 0 8px 16px rgba(20, 23, 29, 0.08), 0 24px 56px rgba(20, 23, 29, 0.18);
  --shadow-focus: 0 0 0 3px var(--focus-ring);
  --shadow-inset: inset 0 1px 2px rgba(20, 23, 29, 0.06);

  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-out:      cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out:   cubic-bezier(0.65, 0, 0.35, 1);
  --dur-instant: 80ms;
  --dur-fast:    130ms;
  --dur-base:    200ms;
  --dur-slow:    320ms;
}
```

- [ ] **Step 9: Create `apps/web/app/styles/tokens/base.css`**

```css
/* Triage — base element styles & resets (scoped additions on top of Tailwind's own reset) */
h1, h2, h3, h4, h5 { font-family: var(--font-display); font-weight: var(--weight-bold); line-height: var(--leading-tight); letter-spacing: var(--tracking-tight); margin: 0; color: var(--text-primary); }

code, kbd, samp { font-family: var(--font-mono); font-size: 0.92em; }

::selection { background: var(--brand-100); color: var(--brand-900); }

.tabular { font-variant-numeric: tabular-nums; }
```

- [ ] **Step 10: Create `apps/web/app/styles/design-tokens.css`**

```css
/* Triage Design System — token entry point. Keep to @import lines only. */
@import "./tokens/fonts.css";
@import "./tokens/colors.css";
@import "./tokens/typography.css";
@import "./tokens/spacing.css";
@import "./tokens/radius.css";
@import "./tokens/elevation.css";
@import "./tokens/base.css";
```

- [ ] **Step 11: Create `apps/web/app/styles/ticket-system.css`**

```css
/* Triage agent app — responsive layout rules (drawer sidebar, stacked panes
   below 860px). Classes are applied directly by Sidebar/TicketList/TicketDetail. */
.triage-mobile-only { display: none; }
.triage-sidebar-backdrop { display: none; }

@media (max-width: 860px) {
  .triage-mobile-only { display: inline-flex !important; }
  .triage-sidebar {
    position: fixed; top: 0; left: 0; z-index: 60; height: 100vh !important;
    transform: translateX(-100%); transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1);
    box-shadow: var(--shadow-lg);
  }
  .triage-sidebar.is-open { transform: translateX(0); }
  .triage-sidebar-backdrop {
    display: block; position: fixed; inset: 0;
    background: color-mix(in oklch, var(--ink-950) 45%, transparent);
    z-index: 55;
  }
  .triage-list-pane, .triage-detail-pane { width: 100% !important; border-right: none !important; }
  .triage-filter-popover { width: 220px !important; right: 0 !important; }
  .triage-collapse-toggle { display: none !important; }
}
```

- [ ] **Step 12: Wire both into `apps/web/app/globals.css`**

Add at the very top of the file (before the existing `@import "tailwindcss";`):

```css
@import "./styles/design-tokens.css";
@import "./styles/ticket-system.css";
@import "tailwindcss";
```

- [ ] **Step 13: Type-check**

Run: `cd homework-2 && pnpm --filter web exec tsc --noEmit --project tsconfig.json`
Expected: no errors (this task touched no `.ts`/`.tsx` files, so this just confirms the workspace still compiles).

- [ ] **Step 14: Commit**

```bash
git add apps/web/package.json apps/web/pnpm-lock.yaml apps/web/app/styles apps/web/app/globals.css
git -C homework-2 add apps/web/package.json pnpm-lock.yaml apps/web/app/styles apps/web/app/globals.css
git -C homework-2 commit -m "feat(hw2-web): add lucide-react and Triage design tokens"
```

---

## Task 2: Shared constants (`lib/ticket-system/constants.ts`)

**Files:**
- Create: `apps/web/lib/ticket-system/constants.ts`

**Interfaces:**
- Consumes: `TicketCategorySchema`, `TicketPrioritySchema`, `TicketStatusSchema`, `TicketSourceSchema`, `DeviceTypeSchema` and their inferred types from `@repo/contracts`.
- Produces: `CATEGORIES`, `CATEGORY_LABEL`, `PRIORITIES`, `PRIORITY_LABEL`, `STATUSES`, `STATUS_TAG`, `SOURCES`, `SOURCE_LABEL`, `DEVICE_TYPES`, `DEVICE_LABEL`, `AGENTS` (`Agent[]`), `QUEUES` (`Queue[]`), `QueueId` type, `ToastState` type, `relative(iso: string | null): string` — all consumed by Tasks 7–14.

- [ ] **Step 1: Create the file**

```ts
// apps/web/lib/ticket-system/constants.ts
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
```

- [ ] **Step 2: Type-check**

Run: `cd homework-2 && pnpm --filter web exec tsc --noEmit --project tsconfig.json`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git -C homework-2 add apps/web/lib/ticket-system/constants.ts
git -C homework-2 commit -m "feat(hw2-web): port TRIAGE_META to typed constants.ts"
```

---

## Task 3: Design-system primitives — buttons & data display

**Files:**
- Create: `apps/web/components/ticket-system/ds/Button.tsx`
- Create: `apps/web/components/ticket-system/ds/IconButton.tsx`
- Create: `apps/web/components/ticket-system/ds/Avatar.tsx`
- Create: `apps/web/components/ticket-system/ds/Badge.tsx`
- Create: `apps/web/components/ticket-system/ds/PriorityTag.tsx`
- Create: `apps/web/components/ticket-system/ds/StatusTag.tsx`

**Interfaces:**
- Produces: `Button`, `IconButton`, `Avatar`, `Badge`, `PriorityTag`, `StatusTag` components, each `'use client'` (all use `useState` for hover), consumed by Tasks 7–14.

- [ ] **Step 1: Create `apps/web/components/ticket-system/ds/Button.tsx`**

```tsx
'use client';

import { useState } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-soft';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  style?: React.CSSProperties;
}

const base: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  fontFamily: 'var(--font-sans)',
  fontWeight: 'var(--weight-semibold)' as unknown as number,
  border: '1px solid transparent',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition:
    'background var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)',
  userSelect: 'none',
  textDecoration: 'none',
  lineHeight: 1,
};

const sizes: Record<ButtonSize, React.CSSProperties> = {
  sm: { height: '30px', padding: '0 10px', fontSize: 'var(--text-sm)' },
  md: { height: '36px', padding: '0 14px', fontSize: 'var(--text-base)' },
  lg: { height: '42px', padding: '0 18px', fontSize: 'var(--text-md)' },
};

const variants: Record<ButtonVariant, React.CSSProperties> = {
  primary: { background: 'var(--accent)', color: 'var(--text-inverse)', borderColor: 'var(--accent)' },
  secondary: {
    background: 'var(--surface-card)',
    color: 'var(--text-primary)',
    borderColor: 'var(--border-default)',
    boxShadow: 'var(--shadow-xs)',
  },
  ghost: { background: 'transparent', color: 'var(--text-secondary)', borderColor: 'transparent' },
  danger: { background: 'var(--danger)', color: 'var(--text-inverse)', borderColor: 'var(--danger)' },
  'danger-soft': { background: 'var(--danger-bg)', color: 'var(--danger)', borderColor: 'var(--danger-border)' },
};

const hoverBg: Record<ButtonVariant, string> = {
  primary: 'var(--accent-hover)',
  secondary: 'var(--surface-hover)',
  ghost: 'var(--surface-hover)',
  danger: '#bd2932',
  'danger-soft': '#fbdfe2',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  iconLeft = null,
  iconRight = null,
  style = {},
  ...rest
}: ButtonProps) {
  const [hover, setHover] = useState(false);
  const composed: React.CSSProperties = {
    ...base,
    ...sizes[size],
    ...variants[variant],
    ...(hover && !disabled ? { background: hoverBg[variant] } : null),
    ...(fullWidth ? { width: '100%' } : null),
    ...(disabled ? { opacity: 0.5, cursor: 'not-allowed', boxShadow: 'none' } : null),
    ...style,
  };
  return (
    <button
      style={composed}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      {...rest}
    >
      {iconLeft}
      {children != null && <span>{children}</span>}
      {iconRight}
    </button>
  );
}
```

- [ ] **Step 2: Create `apps/web/components/ticket-system/ds/IconButton.tsx`**

```tsx
'use client';

import { useState } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type IconButtonVariant = 'secondary' | 'ghost' | 'primary';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  icon: ReactNode;
  label: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  style?: React.CSSProperties;
}

const sizes: Record<IconButtonSize, React.CSSProperties> = {
  sm: { width: '30px', height: '30px', fontSize: '15px' },
  md: { width: '36px', height: '36px', fontSize: '17px' },
  lg: { width: '42px', height: '42px', fontSize: '19px' },
};

const variants: Record<IconButtonVariant, React.CSSProperties> = {
  secondary: {
    background: 'var(--surface-card)',
    color: 'var(--text-secondary)',
    borderColor: 'var(--border-default)',
    boxShadow: 'var(--shadow-xs)',
  },
  ghost: { background: 'transparent', color: 'var(--text-secondary)', borderColor: 'transparent' },
  primary: { background: 'var(--accent)', color: 'var(--text-inverse)', borderColor: 'var(--accent)' },
};

const hoverBg: Record<IconButtonVariant, string> = {
  secondary: 'var(--surface-hover)',
  ghost: 'var(--surface-hover)',
  primary: 'var(--accent-hover)',
};

export function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  style = {},
  ...rest
}: IconButtonProps) {
  const [hover, setHover] = useState(false);
  const composed: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid transparent',
    borderRadius: 'var(--radius-md)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard)',
    ...sizes[size],
    ...variants[variant],
    ...(hover && !disabled
      ? { background: hoverBg[variant], color: variant === 'primary' ? 'var(--text-inverse)' : 'var(--text-primary)' }
      : null),
    ...(disabled ? { opacity: 0.45 } : null),
    ...style,
  };
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      style={composed}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      {...rest}
    >
      {icon}
    </button>
  );
}
```

- [ ] **Step 3: Create `apps/web/components/ticket-system/ds/Avatar.tsx`**

```tsx
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

export interface AvatarProps {
  name?: string;
  src?: string | null;
  size?: AvatarSize;
  style?: React.CSSProperties;
}

const sizes: Record<AvatarSize, number> = { xs: 20, sm: 26, md: 32, lg: 40 };

// Deterministic tint from name so avatars are stable per agent/customer.
const palette: Array<[string, string]> = [
  ['#e3e2fb', '#3c319e'],
  ['#e5f5ed', '#17935a'],
  ['#fdf0e6', '#d9631a'],
  ['#e9f1fb', '#2f7ecb'],
  ['#fbf3d9', '#8a6207'],
  ['#fdecee', '#bd2932'],
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function initials(name: string): string {
  const parts = String(name || '?').trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}

export function Avatar({ name = '', src = null, size = 'md', style = {} }: AvatarProps) {
  const px = sizes[size];
  const [bg, fg] = palette[hash(name) % palette.length];
  const common: React.CSSProperties = {
    width: px,
    height: px,
    borderRadius: '50%',
    flex: '0 0 auto',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-bold)' as unknown as number,
    fontSize: px * 0.42,
    letterSpacing: '0.01em',
    overflow: 'hidden',
    userSelect: 'none',
    ...style,
  };
  if (src) {
    return <img src={src} alt={name} style={{ ...common, objectFit: 'cover' }} />;
  }
  return <span style={{ ...common, background: bg, color: fg }}>{initials(name)}</span>;
}
```

- [ ] **Step 4: Create `apps/web/components/ticket-system/ds/Badge.tsx`**

```tsx
import type { ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeVariant = 'soft' | 'outline';

export interface BadgeProps {
  children?: ReactNode;
  tone?: BadgeTone;
  variant?: BadgeVariant;
  dot?: boolean;
  style?: React.CSSProperties;
}

const tones: Record<BadgeTone, { fg: string; bg: string; bd: string }> = {
  neutral: { fg: 'var(--ink-700)', bg: 'var(--ink-100)', bd: 'var(--ink-200)' },
  brand: { fg: 'var(--brand-700)', bg: 'var(--brand-50)', bd: 'var(--brand-200)' },
  success: { fg: 'var(--success)', bg: 'var(--success-bg)', bd: 'var(--success-border)' },
  warning: { fg: 'var(--warning)', bg: 'var(--warning-bg)', bd: 'var(--warning-border)' },
  danger: { fg: 'var(--danger)', bg: 'var(--danger-bg)', bd: 'var(--danger-border)' },
  info: { fg: 'var(--info)', bg: 'var(--info-bg)', bd: 'var(--info-border)' },
};

export function Badge({ children, tone = 'neutral', variant = 'soft', dot = false, style = {} }: BadgeProps) {
  const t = tones[tone];
  const outlined = variant === 'outline';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        height: '20px',
        padding: '0 7px',
        background: outlined ? 'transparent' : t.bg,
        color: t.fg,
        border: `1px solid ${outlined ? t.bd : 'transparent'}`,
        borderRadius: 'var(--radius-sm)',
        fontSize: 'var(--text-2xs)',
        fontWeight: 'var(--weight-semibold)' as unknown as number,
        letterSpacing: 'var(--tracking-wide)',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {dot && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: t.fg }} />}
      {children}
    </span>
  );
}
```

- [ ] **Step 5: Create `apps/web/components/ticket-system/ds/PriorityTag.tsx`**

```tsx
export type PriorityLevel = 'urgent' | 'high' | 'medium' | 'low' | 'none';
export type PriorityTagVariant = 'soft' | 'bare';

export interface PriorityTagProps {
  level?: PriorityLevel;
  variant?: PriorityTagVariant;
  showLabel?: boolean;
  style?: React.CSSProperties;
}

const LEVELS: Record<PriorityLevel, { label: string; fg: string; bg: string; bd: string; bars: number }> = {
  urgent: { label: 'Urgent', fg: 'var(--priority-urgent)', bg: 'var(--priority-urgent-bg)', bd: 'var(--priority-urgent-border)', bars: 4 },
  high: { label: 'High', fg: 'var(--priority-high)', bg: 'var(--priority-high-bg)', bd: 'var(--priority-high-border)', bars: 3 },
  medium: { label: 'Medium', fg: 'var(--priority-medium)', bg: 'var(--priority-medium-bg)', bd: 'var(--priority-medium-border)', bars: 2 },
  low: { label: 'Low', fg: 'var(--priority-low)', bg: 'var(--priority-low-bg)', bd: 'var(--priority-low-border)', bars: 1 },
  none: { label: 'None', fg: 'var(--priority-none)', bg: 'var(--priority-none-bg)', bd: 'var(--priority-none-border)', bars: 0 },
};

function Signal({ level, color }: { level: number; color: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: '1.5px', height: '11px' }}>
      {[1, 2, 3, 4].map((n) => (
        <span
          key={n}
          style={{
            width: '2.5px',
            height: `${3 + n * 2}px`,
            borderRadius: '1px',
            background: n <= level ? color : 'currentColor',
            opacity: n <= level ? 1 : 0.25,
          }}
        />
      ))}
    </span>
  );
}

export function PriorityTag({ level = 'none', variant = 'soft', showLabel = true, style = {} }: PriorityTagProps) {
  const p = LEVELS[level];
  if (variant === 'bare') {
    return (
      <span
        title={p.label}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: p.fg, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' as unknown as number, ...style }}
      >
        <Signal level={p.bars} color={p.fg} />
        {showLabel && p.label}
      </span>
    );
  }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        height: '22px',
        padding: '0 8px',
        background: p.bg,
        color: p.fg,
        border: `1px solid ${p.bd}`,
        borderRadius: 'var(--radius-sm)',
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--weight-semibold)' as unknown as number,
        letterSpacing: 'var(--tracking-snug)',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      <Signal level={p.bars} color={p.fg} />
      {showLabel && p.label}
    </span>
  );
}
```

- [ ] **Step 6: Create `apps/web/components/ticket-system/ds/StatusTag.tsx`**

```tsx
export type StatusTagStatus = 'new' | 'open' | 'pending' | 'solved' | 'closed';

export interface StatusTagProps {
  status?: StatusTagStatus;
  label?: string;
  style?: React.CSSProperties;
}

const STATUSES: Record<StatusTagStatus, { label: string; fg: string; bg: string }> = {
  new: { label: 'New', fg: 'var(--status-new)', bg: 'var(--status-new-bg)' },
  open: { label: 'Open', fg: 'var(--status-open)', bg: 'var(--status-open-bg)' },
  pending: { label: 'Pending', fg: 'var(--status-pending)', bg: 'var(--status-pending-bg)' },
  solved: { label: 'Solved', fg: 'var(--status-solved)', bg: 'var(--status-solved-bg)' },
  closed: { label: 'Closed', fg: 'var(--status-closed)', bg: 'var(--status-closed-bg)' },
};

export function StatusTag({ status = 'open', label, style = {} }: StatusTagProps) {
  const s = STATUSES[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        height: '22px',
        padding: '0 10px 0 8px',
        background: s.bg,
        color: s.fg,
        borderRadius: 'var(--radius-pill)',
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--weight-semibold)' as unknown as number,
        letterSpacing: 'var(--tracking-snug)',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: s.fg }} />
      {label || s.label}
    </span>
  );
}
```

- [ ] **Step 7: Type-check**

Run: `cd homework-2 && pnpm --filter web exec tsc --noEmit --project tsconfig.json`
Expected: no errors. (`'var(--weight-semibold)' as unknown as number` is a deliberate cast — CSS custom properties are valid as `fontWeight` string values at runtime, but React's `CSSProperties.fontWeight` type is `Property.FontWeight` and rejects arbitrary strings; the cast documents that this is intentional, not a mistake.)

- [ ] **Step 8: Commit**

```bash
git -C homework-2 add apps/web/components/ticket-system/ds/Button.tsx apps/web/components/ticket-system/ds/IconButton.tsx apps/web/components/ticket-system/ds/Avatar.tsx apps/web/components/ticket-system/ds/Badge.tsx apps/web/components/ticket-system/ds/PriorityTag.tsx apps/web/components/ticket-system/ds/StatusTag.tsx
git -C homework-2 commit -m "feat(hw2-web): port Button/IconButton/Avatar/Badge/PriorityTag/StatusTag to TSX"
```

---

## Task 4: Design-system primitives — forms

**Files:**
- Create: `apps/web/components/ticket-system/ds/Input.tsx`
- Create: `apps/web/components/ticket-system/ds/Textarea.tsx`
- Create: `apps/web/components/ticket-system/ds/Select.tsx`
- Create: `apps/web/components/ticket-system/ds/Checkbox.tsx`
- Create: `apps/web/components/ticket-system/ds/FieldLabel.tsx`

**Interfaces:**
- Produces: `Input`, `Textarea`, `Select`, `Checkbox`, `FieldLabel` components consumed by Tasks 9–12.

- [ ] **Step 1: Create `apps/web/components/ticket-system/ds/Input.tsx`**

```tsx
'use client';

import { useState } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'style'> {
  size?: InputSize;
  invalid?: boolean;
  iconLeft?: ReactNode;
  style?: React.CSSProperties;
  wrapperStyle?: React.CSSProperties;
}

const heights: Record<InputSize, string> = { sm: '30px', md: '36px', lg: '42px' };
const fonts: Record<InputSize, string> = { sm: 'var(--text-sm)', md: 'var(--text-base)', lg: 'var(--text-md)' };

export function Input({
  size = 'md',
  invalid = false,
  iconLeft = null,
  disabled = false,
  style = {},
  wrapperStyle = {},
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', width: '100%', ...wrapperStyle }}>
      {iconLeft && (
        <span style={{ position: 'absolute', left: '10px', display: 'inline-flex', color: 'var(--text-tertiary)', pointerEvents: 'none', fontSize: '16px' }}>
          {iconLeft}
        </span>
      )}
      <input
        disabled={disabled}
        onFocus={(e) => {
          setFocus(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocus(false);
          onBlur?.(e);
        }}
        style={{
          width: '100%',
          height: heights[size],
          boxSizing: 'border-box',
          padding: iconLeft ? '0 12px 0 32px' : '0 12px',
          fontFamily: 'var(--font-sans)',
          fontSize: fonts[size],
          color: 'var(--text-primary)',
          background: disabled ? 'var(--surface-sunken)' : 'var(--surface-card)',
          border: `1px solid ${invalid ? 'var(--danger)' : focus ? 'var(--border-focus)' : 'var(--border-default)'}`,
          borderRadius: 'var(--radius-md)',
          boxShadow: focus ? (invalid ? '0 0 0 3px var(--danger-bg)' : 'var(--shadow-focus)') : 'var(--shadow-inset)',
          outline: 'none',
          transition: 'border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)',
          cursor: disabled ? 'not-allowed' : 'text',
          ...style,
        }}
        {...rest}
      />
    </div>
  );
}
```

- [ ] **Step 2: Create `apps/web/components/ticket-system/ds/Textarea.tsx`**

```tsx
'use client';

import { useState } from 'react';
import type { TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'style'> {
  invalid?: boolean;
  style?: React.CSSProperties;
}

export function Textarea({ invalid = false, rows = 4, disabled = false, style = {}, onFocus, onBlur, ...rest }: TextareaProps) {
  const [focus, setFocus] = useState(false);
  return (
    <textarea
      rows={rows}
      disabled={disabled}
      onFocus={(e) => {
        setFocus(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocus(false);
        onBlur?.(e);
      }}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        padding: '9px 12px',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-base)',
        lineHeight: 'var(--leading-normal)',
        color: 'var(--text-primary)',
        resize: 'vertical',
        minHeight: '76px',
        background: disabled ? 'var(--surface-sunken)' : 'var(--surface-card)',
        border: `1px solid ${invalid ? 'var(--danger)' : focus ? 'var(--border-focus)' : 'var(--border-default)'}`,
        borderRadius: 'var(--radius-md)',
        boxShadow: focus ? (invalid ? '0 0 0 3px var(--danger-bg)' : 'var(--shadow-focus)') : 'var(--shadow-inset)',
        outline: 'none',
        transition: 'border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)',
        ...style,
      }}
      {...rest}
    />
  );
}
```

- [ ] **Step 3: Create `apps/web/components/ticket-system/ds/Select.tsx`**

```tsx
'use client';

import { useState } from 'react';
import type { ReactNode, SelectHTMLAttributes } from 'react';

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'style'> {
  size?: SelectSize;
  invalid?: boolean;
  children: ReactNode;
  style?: React.CSSProperties;
  wrapperStyle?: React.CSSProperties;
}

const heights: Record<SelectSize, string> = { sm: '30px', md: '36px', lg: '42px' };
const fonts: Record<SelectSize, string> = { sm: 'var(--text-sm)', md: 'var(--text-base)', lg: 'var(--text-md)' };

export function Select({ size = 'md', invalid = false, disabled = false, children, style = {}, wrapperStyle = {}, ...rest }: SelectProps) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-flex', width: '100%', ...wrapperStyle }}>
      <select
        disabled={disabled}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          width: '100%',
          height: heights[size],
          boxSizing: 'border-box',
          padding: '0 32px 0 12px',
          appearance: 'none',
          fontFamily: 'var(--font-sans)',
          fontSize: fonts[size],
          color: 'var(--text-primary)',
          background: disabled ? 'var(--surface-sunken)' : 'var(--surface-card)',
          border: `1px solid ${invalid ? 'var(--danger)' : focus ? 'var(--border-focus)' : 'var(--border-default)'}`,
          borderRadius: 'var(--radius-md)',
          boxShadow: focus ? 'var(--shadow-focus)' : 'var(--shadow-inset)',
          outline: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)',
          ...style,
        }}
        {...rest}
      >
        {children}
      </select>
      <span style={{ position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-tertiary)', fontSize: '14px', lineHeight: 0 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
    </div>
  );
}
```

- [ ] **Step 4: Create `apps/web/components/ticket-system/ds/Checkbox.tsx`**

```tsx
'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

export interface CheckboxProps {
  checked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  label?: ReactNode;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  style?: React.CSSProperties;
}

export function Checkbox({ checked = false, indeterminate = false, disabled = false, label, onChange, style = {} }: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  const on = checked || indeterminate;
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontSize: 'var(--text-base)',
        color: 'var(--text-primary)',
        ...style,
      }}
    >
      <span style={{ position: 'relative', width: '17px', height: '17px', flex: '0 0 auto' }}>
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', margin: 0, cursor: 'inherit' }}
        />
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '17px',
            height: '17px',
            borderRadius: 'var(--radius-xs)',
            background: on ? 'var(--accent)' : 'var(--surface-card)',
            border: `1.5px solid ${on ? 'var(--accent)' : 'var(--border-strong)'}`,
            transition: 'background var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)',
            color: '#fff',
          }}
        >
          {indeterminate ? (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
              <path d="M5 12h14" />
            </svg>
          ) : checked ? (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : null}
        </span>
      </span>
      {label != null && <span>{label}</span>}
    </label>
  );
}
```

- [ ] **Step 5: Create `apps/web/components/ticket-system/ds/FieldLabel.tsx`**

```tsx
import type { ReactNode } from 'react';

export interface FieldLabelProps {
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  htmlFor?: string;
  children?: ReactNode;
  style?: React.CSSProperties;
}

export function FieldLabel({ label, required = false, hint, error, htmlFor, children, style = {} }: FieldLabelProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', ...style }}>
      {label && (
        <label htmlFor={htmlFor} style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' as unknown as number, color: 'var(--text-primary)' }}>
          {label}
          {required && <span style={{ color: 'var(--danger)', marginLeft: '3px' }}>*</span>}
        </label>
      )}
      {children}
      {error ? (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)' }}>{error}</span>
      ) : hint ? (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{hint}</span>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 6: Type-check**

Run: `cd homework-2 && pnpm --filter web exec tsc --noEmit --project tsconfig.json`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git -C homework-2 add apps/web/components/ticket-system/ds/Input.tsx apps/web/components/ticket-system/ds/Textarea.tsx apps/web/components/ticket-system/ds/Select.tsx apps/web/components/ticket-system/ds/Checkbox.tsx apps/web/components/ticket-system/ds/FieldLabel.tsx
git -C homework-2 commit -m "feat(hw2-web): port Input/Textarea/Select/Checkbox/FieldLabel to TSX"
```

---

## Task 5: Design-system primitives — feedback, navigation, overlay

**Files:**
- Create: `apps/web/components/ticket-system/ds/Banner.tsx`
- Create: `apps/web/components/ticket-system/ds/Spinner.tsx`
- Create: `apps/web/components/ticket-system/ds/Tooltip.tsx`
- Create: `apps/web/components/ticket-system/ds/NavItem.tsx`
- Create: `apps/web/components/ticket-system/ds/Tabs.tsx`
- Create: `apps/web/components/ticket-system/ds/Modal.tsx`

**Interfaces:**
- Produces: `Banner`, `Spinner`, `Tooltip`, `NavItem`, `Tabs`, `Modal` components consumed by Tasks 8–14.

- [ ] **Step 1: Create `apps/web/components/ticket-system/ds/Banner.tsx`**

```tsx
import type { ReactNode } from 'react';

export type BannerTone = 'info' | 'success' | 'warning' | 'danger';

export interface BannerProps {
  tone?: BannerTone;
  title?: string;
  children?: ReactNode;
  onClose?: () => void;
  action?: ReactNode;
  style?: React.CSSProperties;
}

const tones: Record<BannerTone, { fg: string; bg: string; bd: string; icon: string }> = {
  info: { fg: 'var(--info)', bg: 'var(--info-bg)', bd: 'var(--info-border)', icon: 'M12 16v-4M12 8h.01M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20' },
  success: { fg: 'var(--success)', bg: 'var(--success-bg)', bd: 'var(--success-border)', icon: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3' },
  warning: { fg: 'var(--warning)', bg: 'var(--warning-bg)', bd: 'var(--warning-border)', icon: 'm10.29 3.86-8.48 14.7A2 2 0 0 0 3.53 21h16.94a2 2 0 0 0 1.72-2.44l-8.48-14.7a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01' },
  danger: { fg: 'var(--danger)', bg: 'var(--danger-bg)', bd: 'var(--danger-border)', icon: 'M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86L7.86 2zM12 8v4M12 16h.01' },
};

export function Banner({ tone = 'info', title, children, onClose, action, style = {} }: BannerProps) {
  const t = tones[tone];
  return (
    <div role="status" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px 14px', background: t.bg, color: 'var(--text-primary)', border: `1px solid ${t.bd}`, borderRadius: 'var(--radius-md)', ...style }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.fg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: '0 0 auto', marginTop: '1px' }}>
        <path d={t.icon} />
      </svg>
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && <div style={{ fontWeight: 'var(--weight-semibold)' as unknown as number, fontSize: 'var(--text-base)', color: t.fg, marginBottom: children ? '2px' : 0 }}>{title}</div>}
        {children && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)' }}>{children}</div>}
        {action && <div style={{ marginTop: '10px' }}>{action}</div>}
      </div>
      {onClose && (
        <button onClick={onClose} aria-label="Dismiss" style={{ flex: '0 0 auto', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '2px', lineHeight: 0, borderRadius: 'var(--radius-xs)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `apps/web/components/ticket-system/ds/Spinner.tsx`**

```tsx
export interface SpinnerProps {
  size?: number;
  thickness?: number;
  color?: string;
  style?: React.CSSProperties;
}

export function Spinner({ size = 18, thickness = 2.5, color = 'var(--accent)', style = {} }: SpinnerProps) {
  return (
    <span role="status" aria-label="Loading" style={{ display: 'inline-flex', ...style }}>
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation: 'triage-spin 0.7s linear infinite' }}>
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth={thickness} style={{ color }} />
        <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke={color} strokeWidth={thickness} strokeLinecap="round" />
      </svg>
      <style>{`@keyframes triage-spin{to{transform:rotate(360deg)}}`}</style>
    </span>
  );
}
```

- [ ] **Step 3: Create `apps/web/components/ticket-system/ds/Tooltip.tsx`**

```tsx
'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

export type TooltipSide = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  label: string;
  side?: TooltipSide;
  children: ReactNode;
  style?: React.CSSProperties;
}

const positions: Record<TooltipSide, React.CSSProperties> = {
  top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '7px' },
  bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '7px' },
  left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '7px' },
  right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '7px' },
};

export function Tooltip({ label, side = 'top', children, style = {} }: TooltipProps) {
  const [open, setOpen] = useState(false);
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            ...positions[side],
            zIndex: 50,
            background: 'var(--ink-900)',
            color: '#fff',
            padding: '5px 8px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--weight-medium)' as unknown as number,
            whiteSpace: 'nowrap',
            boxShadow: 'var(--shadow-md)',
            pointerEvents: 'none',
            ...style,
          }}
        >
          {label}
        </span>
      )}
    </span>
  );
}
```

- [ ] **Step 4: Create `apps/web/components/ticket-system/ds/NavItem.tsx`**

```tsx
'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

export interface NavItemProps {
  icon?: ReactNode;
  label: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function NavItem({ icon, label, count, active = false, onClick, style = {} }: NavItemProps) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        padding: '7px 10px',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        background: active ? 'var(--surface-selected)' : hover ? 'var(--surface-hover)' : 'transparent',
        color: active ? 'var(--brand-700)' : 'var(--text-secondary)',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-base)',
        fontWeight: (active ? 'var(--weight-semibold)' : 'var(--weight-medium)') as unknown as number,
        transition: 'background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard)',
        textAlign: 'left',
        ...style,
      }}
    >
      {icon && <span style={{ display: 'inline-flex', flex: '0 0 auto', color: active ? 'var(--brand-600)' : 'var(--text-tertiary)' }}>{icon}</span>}
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      {count != null && (
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' as unknown as number, color: active ? 'var(--brand-600)' : 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
          {count}
        </span>
      )}
    </button>
  );
}
```

- [ ] **Step 5: Create `apps/web/components/ticket-system/ds/Tabs.tsx`**

```tsx
export interface TabItem {
  value: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  style?: React.CSSProperties;
}

export function Tabs({ items, value, onChange, style = {} }: TabsProps) {
  return (
    <div role="tablist" style={{ display: 'flex', gap: '2px', borderBottom: '1px solid var(--border-subtle)', ...style }}>
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.value)}
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '9px 12px 11px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-base)',
              fontWeight: (active ? 'var(--weight-semibold)' : 'var(--weight-medium)') as unknown as number,
              color: active ? 'var(--text-primary)' : 'var(--text-tertiary)',
              transition: 'color var(--dur-fast) var(--ease-standard)',
            }}
          >
            {it.label}
            {it.count != null && (
              <span
                style={{
                  minWidth: '18px',
                  height: '18px',
                  padding: '0 5px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: 'var(--text-2xs)',
                  fontWeight: 'var(--weight-bold)' as unknown as number,
                  background: active ? 'var(--brand-100)' : 'var(--ink-100)',
                  color: active ? 'var(--brand-700)' : 'var(--text-tertiary)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {it.count}
              </span>
            )}
            <span
              style={{
                position: 'absolute',
                left: '6px',
                right: '6px',
                bottom: '-1px',
                height: '2px',
                borderRadius: '2px 2px 0 0',
                background: 'var(--accent)',
                opacity: active ? 1 : 0,
                transition: 'opacity var(--dur-fast) var(--ease-standard)',
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 6: Create `apps/web/components/ticket-system/ds/Modal.tsx`**

```tsx
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
```

- [ ] **Step 7: Type-check**

Run: `cd homework-2 && pnpm --filter web exec tsc --noEmit --project tsconfig.json`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git -C homework-2 add apps/web/components/ticket-system/ds/Banner.tsx apps/web/components/ticket-system/ds/Spinner.tsx apps/web/components/ticket-system/ds/Tooltip.tsx apps/web/components/ticket-system/ds/NavItem.tsx apps/web/components/ticket-system/ds/Tabs.tsx apps/web/components/ticket-system/ds/Modal.tsx
git -C homework-2 commit -m "feat(hw2-web): port Banner/Spinner/Tooltip/NavItem/Tabs/Modal to TSX"
```

---

## Task 6: REST API client (`lib/ticket-system/api.ts`)

**Files:**
- Create: `apps/web/lib/ticket-system/api.ts`

**Interfaces:**
- Consumes: `Ticket`, `CreateTicketInput`, `UpdateTicketInput`, `LoginResponse`, `ClassificationResult`, `ImportSummary` from `@repo/contracts`.
- Produces: `ApiError` class (`.status?: number`), `TicketFilters` interface, `createApiClient(baseUrl: string, getToken: () => string | null, onUnauthorized: () => void)` returning `{ login, listTickets, getTicket, createTicket, updateTicket, deleteTicket, classifyTicket, importTickets }` — consumed by `TriageApp.tsx` (Task 14) and passed down to feature components.

- [ ] **Step 1: Create the file**

```ts
// apps/web/lib/ticket-system/api.ts
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
```

- [ ] **Step 2: Type-check**

Run: `cd homework-2 && pnpm --filter web exec tsc --noEmit --project tsconfig.json`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git -C homework-2 add apps/web/lib/ticket-system/api.ts
git -C homework-2 commit -m "feat(hw2-web): add typed REST client for apps/api (real login, no mock)"
```

---

## Task 7: `LoginScreen.tsx`

**Files:**
- Create: `apps/web/components/ticket-system/LoginScreen.tsx`

**Interfaces:**
- Consumes: `Button`, `Input`, `FieldLabel`, `Banner` (Tasks 3–4), `ApiClient`/`ApiError` (Task 6).
- Produces: `LoginScreen` component with props `{ api: ApiClient; onSuccess: (token: string, email: string) => void }` — consumed by `TriageApp.tsx` (Task 14).

- [ ] **Step 1: Create the file**

```tsx
// apps/web/components/ticket-system/LoginScreen.tsx
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
```

- [ ] **Step 2: Type-check**

Run: `cd homework-2 && pnpm --filter web exec tsc --noEmit --project tsconfig.json`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git -C homework-2 add apps/web/components/ticket-system/LoginScreen.tsx
git -C homework-2 commit -m "feat(hw2-web): port LoginScreen with real POST /auth/login"
```

---

## Task 8: `Toast.tsx` + `TopBar.tsx`

**Files:**
- Create: `apps/web/components/ticket-system/Toast.tsx`
- Create: `apps/web/components/ticket-system/TopBar.tsx`

**Interfaces:**
- Consumes: `ToastState` (Task 2), `Button`, `IconButton` (Task 3).
- Produces: `Toast` (`{ toast: ToastState | null }`), `TopBar` (`{ isMobile: boolean; onImport: () => void; onNewTicket: () => void; onLogout: () => void }`) — consumed by `TriageApp.tsx` (Task 14).

- [ ] **Step 1: Create `apps/web/components/ticket-system/Toast.tsx`**

```tsx
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
```

- [ ] **Step 2: Create `apps/web/components/ticket-system/TopBar.tsx`**

```tsx
// apps/web/components/ticket-system/TopBar.tsx
import { LogOut, Plus, Upload } from 'lucide-react';
import { Button } from './ds/Button';

export interface TopBarProps {
  isMobile: boolean;
  onImport: () => void;
  onNewTicket: () => void;
  onLogout: () => void;
}

export function TopBar({ isMobile, onImport, onNewTicket, onLogout }: TopBarProps) {
  return (
    <header
      style={{
        height: 'var(--topbar-h)',
        flex: '0 0 auto',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '0 16px',
        background: 'var(--surface-card)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ flex: 1 }} />
      <Button variant="secondary" size="sm" iconLeft={<Upload size={15} />} onClick={onImport}>
        {isMobile ? null : 'Import'}
      </Button>
      <Button size="sm" iconLeft={<Plus size={15} />} onClick={onNewTicket}>
        {isMobile ? null : 'New ticket'}
      </Button>
      <div style={{ width: 1, height: 20, background: 'var(--border-subtle)', margin: '0 2px' }} />
      <button
        onClick={onLogout}
        title="Log out"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 30,
          height: 30,
          background: 'transparent',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <LogOut size={17} />
      </button>
    </header>
  );
}
```

Note: the original prototype showed a "Mock data" badge here when `config.mock` was true. Mocks no longer exist, so the badge is dropped — there is nothing to warn about.

- [ ] **Step 3: Type-check**

Run: `cd homework-2 && pnpm --filter web exec tsc --noEmit --project tsconfig.json`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git -C homework-2 add apps/web/components/ticket-system/Toast.tsx apps/web/components/ticket-system/TopBar.tsx
git -C homework-2 commit -m "feat(hw2-web): port Toast and TopBar (drop mock-data badge)"
```

---

## Task 9: `Sidebar.tsx`

**Files:**
- Create: `apps/web/components/ticket-system/Sidebar.tsx`

**Interfaces:**
- Consumes: `QUEUES`, `QueueId` (Task 2), `NavItem`, `Avatar`, `Tooltip` (Tasks 3, 5).
- Produces: `Sidebar` component with props `{ activeQueue: QueueId; onSelectQueue: (id: QueueId) => void; counts: Record<QueueId, number>; mobileOpen: boolean; onCloseMobile: () => void; collapsed: boolean; onToggleCollapse: () => void }` — consumed by `TriageApp.tsx` (Task 14).

- [ ] **Step 1: Create the file**

```tsx
// apps/web/components/ticket-system/Sidebar.tsx
'use client';

import { Flame, Inbox, PanelLeftClose, PanelLeftOpen, User, UserX, Clock, CheckCheck, X } from 'lucide-react';
import type { ComponentType } from 'react';
import { NavItem } from './ds/NavItem';
import { Avatar } from './ds/Avatar';
import { Tooltip } from './ds/Tooltip';
import { QUEUES, type QueueId, type Queue } from '../../lib/ticket-system/constants';

const COLLAPSED_W = 60;

const QUEUE_ICONS: Record<Queue['icon'], ComponentType<{ size?: number }>> = {
  inbox: Inbox,
  user: User,
  'user-x': UserX,
  flame: Flame,
  clock: Clock,
  'check-check': CheckCheck,
};

function SidebarSection({ title }: { title: string }) {
  return (
    <div style={{ padding: '14px 10px 6px', fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
      {title}
    </div>
  );
}

export interface SidebarProps {
  activeQueue: QueueId;
  onSelectQueue: (id: QueueId) => void;
  counts: Record<QueueId, number>;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ activeQueue, onSelectQueue, counts, mobileOpen, onCloseMobile, collapsed, onToggleCollapse }: SidebarProps) {
  const item = (q: Queue) => {
    const Icon = QUEUE_ICONS[q.icon];
    const el = (
      <NavItem
        key={q.id}
        icon={<Icon size={17} />}
        label={collapsed ? '' : q.label}
        count={collapsed ? undefined : counts[q.id]}
        active={activeQueue === q.id}
        onClick={() => {
          onSelectQueue(q.id);
          onCloseMobile();
        }}
        style={collapsed ? { justifyContent: 'center', padding: '9px 0' } : undefined}
      />
    );
    return collapsed ? (
      <Tooltip key={q.id} label={q.label} side="right">
        {el}
      </Tooltip>
    ) : (
      el
    );
  };

  return (
    <>
      {mobileOpen && <div className="triage-sidebar-backdrop" onClick={onCloseMobile} />}
      <aside
        className={'triage-sidebar' + (mobileOpen ? ' is-open' : '')}
        style={{
          width: collapsed ? COLLAPSED_W : 'var(--sidebar-w)',
          flex: '0 0 auto',
          height: '100%',
          boxSizing: 'border-box',
          background: 'var(--surface-card)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width var(--dur-med) var(--ease-standard)',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', height: 'var(--topbar-h)', padding: collapsed ? '0 12px' : '0 12px 0 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: '2.5px', height: '18px', flex: '0 0 auto' }}>
            {[9, 13, 17, 21].map((h, i) => (
              <span key={i} style={{ width: '4px', height: h, borderRadius: '1.5px', background: 'var(--brand-500)' }} />
            ))}
          </span>
          {!collapsed && <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '19px', letterSpacing: '-0.03em', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>Triage</span>}
          <div style={{ flex: 1 }} />
          {!collapsed && (
            <button className="triage-mobile-only" onClick={onCloseMobile} aria-label="Close menu" style={{ display: 'none', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}>
              <X size={18} />
            </button>
          )}
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: collapsed ? '8px 6px' : '8px 10px' }}>
          {!collapsed && <SidebarSection title="Queues" />}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>{QUEUES.map(item)}</div>
        </div>

        <button
          className="triage-collapse-toggle"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-end',
            gap: '6px',
            padding: '8px 12px',
            border: 'none',
            borderTop: '1px solid var(--border-subtle)',
            background: 'transparent',
            color: 'var(--text-tertiary)',
            cursor: 'pointer',
          }}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: collapsed ? '10px 0' : '10px 14px', justifyContent: collapsed ? 'center' : 'flex-start', borderTop: '1px solid var(--border-subtle)' }}>
          <Avatar name="Priya Nair" size="sm" />
          {!collapsed && (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>Priya Nair</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Support agent</div>
              </div>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} title="Online" />
            </>
          )}
        </div>
      </aside>
    </>
  );
}
```

Note: `--dur-med` doesn't exist in the token set (the original prototype referenced it too, presumably a browser no-op since CSS falls back to `initial` for unknown custom properties) — kept for visual parity with the design system's HTML rather than silently "fixing" a token that isn't part of the source spec.

- [ ] **Step 2: Type-check**

Run: `cd homework-2 && pnpm --filter web exec tsc --noEmit --project tsconfig.json`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git -C homework-2 add apps/web/components/ticket-system/Sidebar.tsx
git -C homework-2 commit -m "feat(hw2-web): port Sidebar to TSX with lucide-react icons"
```

---

## Task 10: `TicketList.tsx`

**Files:**
- Create: `apps/web/components/ticket-system/TicketList.tsx`

**Interfaces:**
- Consumes: `Ticket` (`@repo/contracts`), `PriorityTag`, `StatusTag`, `Badge`, `Avatar`, `Checkbox`, `Input`, `Button`, `IconButton`, `Tabs`, `Spinner` (Tasks 3–5), `STATUS_TAG`, `CATEGORY_LABEL`, `STATUSES`, `PRIORITIES`, `PRIORITY_LABEL`, `CATEGORIES`, `relative` (Task 2).
- Produces: `TicketList` component with props `{ tickets: Ticket[]; loading: boolean; activeId: string | null; onSelect: (id: string) => void; tab: 'open' | 'mine' | 'all'; onTab: (tab: 'open' | 'mine' | 'all') => void; onOpenMenu: () => void }` — consumed by `TriageApp.tsx` (Task 14).

- [ ] **Step 1: Create the file**

```tsx
// apps/web/components/ticket-system/TicketList.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Menu, Search, SlidersHorizontal } from 'lucide-react';
import type { Ticket } from '@repo/contracts';
import { PriorityTag } from './ds/PriorityTag';
import { StatusTag } from './ds/StatusTag';
import { Badge } from './ds/Badge';
import { Avatar } from './ds/Avatar';
import { Checkbox } from './ds/Checkbox';
import { Input } from './ds/Input';
import { Button } from './ds/Button';
import { IconButton } from './ds/IconButton';
import { Tabs } from './ds/Tabs';
import { Spinner } from './ds/Spinner';
import { CATEGORIES, CATEGORY_LABEL, PRIORITIES, PRIORITY_LABEL, STATUS_TAG, STATUSES, relative } from '../../lib/ticket-system/constants';

function TicketRow({ t, selected, active, onSelect, onToggle }: { t: Ticket; selected: boolean; active: boolean; onSelect: (id: string) => void; onToggle: (id: string) => void }) {
  const [hover, setHover] = useState(false);
  const statusMeta = STATUS_TAG[t.status];
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onSelect(t.id)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '11px 14px',
        borderBottom: '1px solid var(--border-subtle)',
        cursor: 'pointer',
        background: active ? 'var(--surface-selected)' : hover ? 'var(--surface-hover)' : 'var(--surface-card)',
        borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
      }}
    >
      <div
        style={{ paddingTop: '2px' }}
        onClick={(e) => {
          e.stopPropagation();
          onToggle(t.id);
        }}
      >
        <Checkbox checked={selected} onChange={() => onToggle(t.id)} />
      </div>
      <Avatar name={t.customer_name} size="sm" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{t.customer_name}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{relative(t.updated_at)}</span>
        </div>
        <div style={{ fontSize: 'var(--text-base)', fontWeight: 400, color: 'var(--text-secondary)', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginRight: '6px' }}>#{t.number}</span>
          {t.subject}
        </div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '7px', flexWrap: 'wrap' }}>
          <PriorityTag level={t.priority} />
          <StatusTag status={statusMeta.status} label={statusMeta.label} />
          <Badge tone="neutral">{CATEGORY_LABEL[t.category]}</Badge>
        </div>
      </div>
    </div>
  );
}

interface FilterPopoverProps {
  statusFilter: Set<string>;
  priorityFilter: Set<string>;
  categoryFilter: Set<string>;
  onToggleStatus: (v: string) => void;
  onTogglePriority: (v: string) => void;
  onToggleCategory: (v: string) => void;
  onClear: () => void;
  onClose: () => void;
}

function FilterPopover({ statusFilter, priorityFilter, categoryFilter, onToggleStatus, onTogglePriority, onToggleCategory, onClear, onClose }: FilterPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [onClose]);
  return (
    <div
      ref={ref}
      className="triage-filter-popover"
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: '6px',
        width: '240px',
        maxHeight: '70vh',
        overflowY: 'auto',
        zIndex: 20,
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      <div>
        <div style={{ fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '6px' }}>Status</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {STATUSES.map((s) => (
            <Checkbox key={s} checked={statusFilter.has(s)} onChange={() => onToggleStatus(s)} label={STATUS_TAG[s].label} />
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '6px' }}>Priority</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {PRIORITIES.map((p) => (
            <Checkbox key={p} checked={priorityFilter.has(p)} onChange={() => onTogglePriority(p)} label={PRIORITY_LABEL[p]} />
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '6px' }}>Category</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {CATEGORIES.map((c) => (
            <Checkbox key={c} checked={categoryFilter.has(c)} onChange={() => onToggleCategory(c)} label={CATEGORY_LABEL[c]} />
          ))}
        </div>
      </div>
      <Button size="sm" variant="ghost" onClick={onClear}>
        Clear filters
      </Button>
    </div>
  );
}

export type TicketListTab = 'open' | 'mine' | 'all';

export interface TicketListProps {
  tickets: Ticket[];
  loading: boolean;
  activeId: string | null;
  onSelect: (id: string) => void;
  tab: TicketListTab;
  onTab: (tab: TicketListTab) => void;
  onOpenMenu: () => void;
}

export function TicketList({ tickets, loading, activeId, onSelect, tab, onTab, onOpenMenu }: TicketListProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [priorityFilter, setPriorityFilter] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const toggleInSet = (setter: (fn: (s: Set<string>) => Set<string>) => void) => (v: string) =>
    setter((s) => {
      const n = new Set(s);
      n.has(v) ? n.delete(v) : n.add(v);
      return n;
    });

  const byTab = (list: Ticket[]) => {
    if (tab === 'mine') return list.filter((t) => t.assigned_to === 'priya');
    if (tab === 'open') return list.filter((t) => ['new', 'in_progress', 'waiting_customer'].includes(t.status));
    return list;
  };

  const q = search.trim().toLowerCase();
  const visible = byTab(tickets).filter((t) => {
    if (statusFilter.size && !statusFilter.has(t.status)) return false;
    if (priorityFilter.size && !priorityFilter.has(t.priority)) return false;
    if (categoryFilter.size && !categoryFilter.has(t.category)) return false;
    if (!q) return true;
    return t.subject.toLowerCase().includes(q) || t.customer_name.toLowerCase().includes(q) || t.customer_email.toLowerCase().includes(q) || String(t.number).includes(q);
  });

  const activeFilterCount = statusFilter.size + priorityFilter.size + categoryFilter.size;

  return (
    <section
      className="triage-list-pane"
      style={{ width: 'var(--list-pane-w)', flex: '0 0 auto', height: '100%', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-subtle)', background: 'var(--surface-card)' }}
    >
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="triage-mobile-only" onClick={onOpenMenu} aria-label="Open menu" style={{ display: 'none', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px 4px 4px 0' }}>
            <Menu size={20} />
          </button>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, flex: 1, margin: 0 }}>All tickets</h2>
          <div style={{ position: 'relative' }}>
            <IconButton icon={<SlidersHorizontal size={16} />} label="Filter" variant={activeFilterCount ? 'primary' : 'secondary'} size="sm" onClick={() => setFilterOpen((v) => !v)} />
            {activeFilterCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  minWidth: 15,
                  height: 15,
                  borderRadius: '999px',
                  background: 'var(--brand-500)',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 3px',
                }}
              >
                {activeFilterCount}
              </span>
            )}
            {filterOpen && (
              <FilterPopover
                statusFilter={statusFilter}
                priorityFilter={priorityFilter}
                categoryFilter={categoryFilter}
                onToggleStatus={toggleInSet(setStatusFilter)}
                onTogglePriority={toggleInSet(setPriorityFilter)}
                onToggleCategory={toggleInSet(setCategoryFilter)}
                onClear={() => {
                  setStatusFilter(new Set());
                  setPriorityFilter(new Set());
                  setCategoryFilter(new Set());
                }}
                onClose={() => setFilterOpen(false)}
              />
            )}
          </div>
        </div>
        <Input iconLeft={<Search size={16} />} placeholder="Search tickets…" size="sm" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {selected.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: 'var(--surface-selected)', borderBottom: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--brand-700)' }}>{selected.size} selected</span>
        </div>
      )}
      <div style={{ padding: '0 14px', borderBottom: '1px solid var(--border-subtle)' }}>
        <Tabs
          value={tab}
          onChange={(v) => onTab(v as TicketListTab)}
          items={[
            { value: 'open', label: 'Open', count: tickets.filter((t) => ['new', 'in_progress', 'waiting_customer'].includes(t.status)).length },
            { value: 'mine', label: 'Assigned to me', count: tickets.filter((t) => t.assigned_to === 'priya').length },
            { value: 'all', label: 'All', count: tickets.length },
          ]}
        />
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Spinner />
          </div>
        ) : visible.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>No tickets match these filters.</div>
        ) : (
          visible.map((t) => <TicketRow key={t.id} t={t} selected={selected.has(t.id)} active={t.id === activeId} onSelect={onSelect} onToggle={toggle} />)
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `cd homework-2 && pnpm --filter web exec tsc --noEmit --project tsconfig.json`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git -C homework-2 add apps/web/components/ticket-system/TicketList.tsx
git -C homework-2 commit -m "feat(hw2-web): port TicketList (rows, filters, tabs, search) to TSX"
```

---

## Task 11: `TicketDetail.tsx`

**Files:**
- Create: `apps/web/components/ticket-system/TicketDetail.tsx`

**Interfaces:**
- Consumes: `Ticket`, `UpdateTicketInput`, `ClassificationResult` (`@repo/contracts`), `PriorityTag`, `StatusTag`, `Badge`, `Avatar`, `Button`, `IconButton`, `Select`, `Tooltip`, `Modal`, `Banner`, `Spinner` (Tasks 3–5), `AGENTS`, `STATUSES`, `STATUS_TAG`, `PRIORITIES`, `PRIORITY_LABEL`, `CATEGORY_LABEL`, `CATEGORIES`, `SOURCE_LABEL`, `DEVICE_LABEL`, `relative` (Task 2), `ApiClient` (Task 6).
- Produces: `TicketDetail` component with props `{ t: Ticket | null; api: ApiClient; onUpdate: (id: string, patch: UpdateTicketInput) => void; onDelete: (id: string) => void; onEdit: (t: Ticket) => void; onBack: () => void; showBack: boolean }` — consumed by `TriageApp.tsx` (Task 14).

- [ ] **Step 1: Create the file**

```tsx
// apps/web/components/ticket-system/TicketDetail.tsx
'use client';

import { useState } from 'react';
import { ArrowLeft, Inbox, Pencil, Sparkles, Trash2 } from 'lucide-react';
import type { ClassificationResult, Ticket, UpdateTicketInput } from '@repo/contracts';
import { PriorityTag } from './ds/PriorityTag';
import { StatusTag } from './ds/StatusTag';
import { Badge } from './ds/Badge';
import { Avatar } from './ds/Avatar';
import { Button } from './ds/Button';
import { IconButton } from './ds/IconButton';
import { Select } from './ds/Select';
import { Tooltip } from './ds/Tooltip';
import { Modal } from './ds/Modal';
import { Banner } from './ds/Banner';
import { Spinner } from './ds/Spinner';
import { AGENTS, CATEGORIES, CATEGORY_LABEL, DEVICE_LABEL, PRIORITIES, PRIORITY_LABEL, SOURCE_LABEL, STATUSES, STATUS_TAG, relative } from '../../lib/ticket-system/constants';
import { ApiError, type ApiClient } from '../../lib/ticket-system/api';

function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: 'var(--tracking-caps)', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{label}</span>
      {children}
    </div>
  );
}

function EmptyDetail() {
  return (
    <section style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)', gap: '8px' }}>
      <Inbox size={32} color="var(--text-tertiary)" />
      <div style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)' }}>You&apos;re all caught up. No tickets in this queue.</div>
    </section>
  );
}

function ClassificationPanel({ t, api, onApply }: { t: Ticket; api: ApiClient; onApply: (r: ClassificationResult) => void }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setState('loading');
    setError(null);
    try {
      const r = await api.classifyTicket(t.id);
      setResult(r);
      setState('done');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Classification failed.');
      setState('error');
    }
  };

  const changed = result && (result.category !== t.category || result.priority !== t.priority);

  return (
    <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Sparkles size={15} color="var(--brand-500)" />
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>Auto-classification</span>
        <Button size="sm" variant="secondary" onClick={run} disabled={state === 'loading'}>
          {state === 'loading' ? 'Classifying…' : 'Run classification'}
        </Button>
      </div>

      {state === 'error' && <Banner tone="danger" title="Couldn't classify this ticket">{error}</Banner>}

      {state === 'loading' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
          <Spinner size={14} /> Analyzing subject and description…
        </div>
      )}

      {result && state === 'done' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Badge tone="brand">{CATEGORY_LABEL[result.category]}</Badge>
            <PriorityTag level={result.priority} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{Math.round(result.confidence * 100)}% confidence</span>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0, lineHeight: 'var(--leading-normal)' }}>{result.reasoning}</p>
          {changed ? (
            <Button size="sm" onClick={() => onApply(result)}>
              Apply to ticket
            </Button>
          ) : (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Matches the ticket&apos;s current category and priority.</span>
          )}
        </div>
      )}
    </div>
  );
}

export interface TicketDetailProps {
  t: Ticket | null;
  api: ApiClient;
  onUpdate: (id: string, patch: UpdateTicketInput) => void;
  onDelete: (id: string) => void;
  onEdit: (t: Ticket) => void;
  onBack: () => void;
  showBack: boolean;
}

export function TicketDetail({ t, api, onUpdate, onDelete, onEdit, onBack, showBack }: TicketDetailProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!t) return <EmptyDetail />;
  const statusMeta = STATUS_TAG[t.status];

  return (
    <section className="triage-detail-pane" style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
      <header style={{ padding: '11px 18px', background: 'var(--surface-card)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        {showBack && (
          <button onClick={onBack} aria-label="Back to list" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4, flex: '0 0 auto' }}>
            <ArrowLeft size={18} />
          </button>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{t.subject}</h1>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>#{t.number}</span>
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <PriorityTag level={t.priority} />
            <StatusTag status={statusMeta.status} label={statusMeta.label} />
            <Badge tone="neutral">{CATEGORY_LABEL[t.category]}</Badge>
            <Badge tone="info" variant="outline">{SOURCE_LABEL[t.metadata.source]}</Badge>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '2px' }}>
          <Tooltip label="Edit ticket" side="bottom">
            <IconButton icon={<Pencil size={16} />} label="Edit ticket" variant="ghost" onClick={() => onEdit(t)} />
          </Tooltip>
          <Tooltip label="Delete ticket" side="bottom">
            <IconButton icon={<Trash2 size={16} />} label="Delete ticket" variant="ghost" onClick={() => setDeleteOpen(true)} />
          </Tooltip>
        </div>
        <Button variant="secondary" size="sm" onClick={() => onUpdate(t.id, { status: 'resolved' })} disabled={t.status === 'resolved' || t.status === 'closed'}>
          Resolve
        </Button>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '18px', display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '760px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Avatar name={t.customer_name} size="md" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)' }}>{t.customer_name}</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{t.customer_email}</span>
            </div>
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)', lineHeight: 'var(--leading-normal)', marginTop: '8px', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '12px 14px' }}>
              {t.description}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px' }}>
          <PropRow label="Assignee">
            <Select size="sm" value={t.assigned_to || ''} onChange={(e) => onUpdate(t.id, { assigned_to: e.target.value || null })}>
              <option value="">Unassigned</option>
              {AGENTS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </PropRow>
          <PropRow label="Priority">
            <Select size="sm" value={t.priority} onChange={(e) => onUpdate(t.id, { priority: e.target.value as Ticket['priority'] })}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </option>
              ))}
            </Select>
          </PropRow>
          <PropRow label="Status">
            <Select size="sm" value={t.status} onChange={(e) => onUpdate(t.id, { status: e.target.value as Ticket['status'] })}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_TAG[s].label}
                </option>
              ))}
            </Select>
          </PropRow>
          <PropRow label="Category">
            <Select size="sm" value={t.category} onChange={(e) => onUpdate(t.id, { category: e.target.value as Ticket['category'] })}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </Select>
          </PropRow>
        </div>

        <ClassificationPanel t={t} api={api} onApply={(r) => onUpdate(t.id, { category: r.category, priority: r.priority })} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px' }}>
          <PropRow label="Tags">
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {t.tags.length ? (
                t.tags.map((tag) => (
                  <Badge key={tag} tone="brand">
                    {tag}
                  </Badge>
                ))
              ) : (
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>No tags</span>
              )}
            </div>
          </PropRow>
          <PropRow label="Source">
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{SOURCE_LABEL[t.metadata.source]}</span>
          </PropRow>
          <PropRow label="Device">
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{DEVICE_LABEL[t.metadata.device_type]}</span>
          </PropRow>
          <PropRow label="Browser">
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{t.metadata.browser}</span>
          </PropRow>
          <PropRow label="Created">
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }} title={t.created_at}>
              {relative(t.created_at)}
            </span>
          </PropRow>
          <PropRow label="Updated">
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }} title={t.updated_at}>
              {relative(t.updated_at)}
            </span>
          </PropRow>
          <PropRow label="Resolved">
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }} title={t.resolved_at || ''}>
              {t.resolved_at ? relative(t.resolved_at) : '—'}
            </span>
          </PropRow>
        </div>
      </div>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        width={420}
        title="Delete ticket?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setDeleteOpen(false);
                onDelete(t.id);
              }}
            >
              Delete ticket
            </Button>
          </>
        }
      >
        <Banner tone="danger" title={`This removes #${t.number} — ${t.subject}`}>
          This can&apos;t be undone.
        </Banner>
      </Modal>
    </section>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `cd homework-2 && pnpm --filter web exec tsc --noEmit --project tsconfig.json`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git -C homework-2 add apps/web/components/ticket-system/TicketDetail.tsx
git -C homework-2 commit -m "feat(hw2-web): port TicketDetail with real classify API call to TSX"
```

---

## Task 12: `TicketFormModal.tsx`

**Files:**
- Create: `apps/web/components/ticket-system/TicketFormModal.tsx`

**Interfaces:**
- Consumes: `Ticket`, `CreateTicketInput` (`@repo/contracts`), `Modal`, `Button`, `Input`, `Select`, `Textarea`, `FieldLabel`, `Banner` (Tasks 3–5), `CATEGORIES`, `CATEGORY_LABEL`, `PRIORITIES`, `PRIORITY_LABEL`, `SOURCES`, `SOURCE_LABEL` (Task 2), `ApiClient`/`ApiError` (Task 6).
- Produces: `TicketFormModal` component with props `{ open: boolean; ticket: Ticket | null; api: ApiClient; onClose: () => void; onSaved: (saved: Ticket, isEdit: boolean) => void }` — consumed by `TriageApp.tsx` (Task 14).

- [ ] **Step 1: Create the file**

```tsx
// apps/web/components/ticket-system/TicketFormModal.tsx
'use client';

import { useEffect, useState } from 'react';
import { Plus, Save } from 'lucide-react';
import type { Ticket, TicketCategory, TicketPriority, TicketSource } from '@repo/contracts';
import { Modal } from './ds/Modal';
import { Button } from './ds/Button';
import { Input } from './ds/Input';
import { Select } from './ds/Select';
import { Textarea } from './ds/Textarea';
import { FieldLabel } from './ds/FieldLabel';
import { Banner } from './ds/Banner';
import { CATEGORIES, CATEGORY_LABEL, PRIORITIES, PRIORITY_LABEL, SOURCES, SOURCE_LABEL } from '../../lib/ticket-system/constants';
import { ApiError, type ApiClient } from '../../lib/ticket-system/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormState {
  subject: string;
  customer_name: string;
  customer_email: string;
  category: TicketCategory;
  priority: TicketPriority;
  source: TicketSource;
  description: string;
}

function emptyForm(): FormState {
  return { subject: '', customer_name: '', customer_email: '', category: CATEGORIES[0], priority: 'medium', source: 'web_form', description: '' };
}

function validate(form: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!form.subject.trim()) errors.subject = 'Enter a subject.';
  else if (form.subject.trim().length > 200) errors.subject = 'Keep it under 200 characters.';
  if (!form.customer_name.trim()) errors.customer_name = "Enter the customer's name.";
  if (!form.customer_email.trim()) errors.customer_email = 'Enter an email address.';
  else if (!EMAIL_RE.test(form.customer_email.trim())) errors.customer_email = 'That email looks invalid.';
  if (!form.description.trim()) errors.description = 'Enter a description.';
  else if (form.description.trim().length < 10) errors.description = 'At least 10 characters.';
  else if (form.description.trim().length > 2000) errors.description = 'Keep it under 2000 characters.';
  return errors;
}

export interface TicketFormModalProps {
  open: boolean;
  ticket: Ticket | null;
  api: ApiClient;
  onClose: () => void;
  onSaved: (saved: Ticket, isEdit: boolean) => void;
}

export function TicketFormModal({ open, ticket, api, onClose, onSaved }: TicketFormModalProps) {
  const isEdit = !!ticket;
  const [form, setForm] = useState<FormState>(emptyForm());
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTouched(false);
    setApiError(null);
    setForm(
      ticket
        ? {
            subject: ticket.subject,
            customer_name: ticket.customer_name,
            customer_email: ticket.customer_email,
            category: ticket.category,
            priority: ticket.priority,
            source: ticket.metadata.source,
            description: ticket.description,
          }
        : emptyForm(),
    );
  }, [open, ticket]);

  const set = <K extends keyof FormState>(k: K) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }) as FormState);

  const errors = validate(form);
  const hasErrors = Object.keys(errors).length > 0;

  const submit = async () => {
    setTouched(true);
    setApiError(null);
    if (hasErrors) return;
    setSaving(true);
    try {
      let saved: Ticket;
      if (isEdit && ticket) {
        saved = await api.updateTicket(ticket.id, {
          subject: form.subject,
          customer_name: form.customer_name,
          customer_email: form.customer_email,
          category: form.category,
          priority: form.priority,
          description: form.description,
          metadata: { ...ticket.metadata, source: form.source },
        });
      } else {
        saved = await api.createTicket({
          subject: form.subject,
          customer_name: form.customer_name,
          customer_email: form.customer_email,
          category: form.category,
          priority: form.priority,
          description: form.description,
          metadata: { source: form.source },
        });
      }
      onSaved(saved, isEdit);
    } catch (e) {
      setApiError(e instanceof ApiError ? e.message : 'Something went wrong saving this ticket.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={540}
      title={isEdit ? `Edit ticket #${ticket?.number}` : 'Create a new ticket'}
      description={isEdit ? undefined : 'Logs a ticket on behalf of a customer — useful for phone or walk-in requests.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving} iconLeft={isEdit ? <Save size={15} /> : <Plus size={15} />}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create ticket'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {apiError && <Banner tone="danger" title="Couldn't save this ticket">{apiError}</Banner>}
        <FieldLabel label="Subject" required error={touched ? errors.subject : null}>
          <Input placeholder="Brief summary of the issue" value={form.subject} invalid={touched && !!errors.subject} onChange={set('subject')} autoFocus />
        </FieldLabel>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <FieldLabel label="Customer name" required error={touched ? errors.customer_name : null}>
              <Input placeholder="Jane Doe" value={form.customer_name} invalid={touched && !!errors.customer_name} onChange={set('customer_name')} />
            </FieldLabel>
          </div>
          <div style={{ flex: 1 }}>
            <FieldLabel label="Customer email" required error={touched ? errors.customer_email : null}>
              <Input type="email" placeholder="jane@company.com" value={form.customer_email} invalid={touched && !!errors.customer_email} onChange={set('customer_email')} />
            </FieldLabel>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <FieldLabel label="Category">
              <Select value={form.category} onChange={set('category')}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABEL[c]}
                  </option>
                ))}
              </Select>
            </FieldLabel>
          </div>
          <div style={{ flex: 1 }}>
            <FieldLabel label="Priority">
              <Select value={form.priority} onChange={set('priority')}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABEL[p]}
                  </option>
                ))}
              </Select>
            </FieldLabel>
          </div>
          <div style={{ flex: 1 }}>
            <FieldLabel label="Source">
              <Select value={form.source} onChange={set('source')}>
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {SOURCE_LABEL[s]}
                  </option>
                ))}
              </Select>
            </FieldLabel>
          </div>
        </div>
        <FieldLabel label="Description" required error={touched ? errors.description : null}>
          <Textarea rows={4} placeholder="What's the issue?" value={form.description} invalid={touched && !!errors.description} onChange={set('description')} />
        </FieldLabel>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `cd homework-2 && pnpm --filter web exec tsc --noEmit --project tsconfig.json`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git -C homework-2 add apps/web/components/ticket-system/TicketFormModal.tsx
git -C homework-2 commit -m "feat(hw2-web): port TicketFormModal with real create/update API calls"
```

---

## Task 13: `ImportModal.tsx`

**Files:**
- Create: `apps/web/components/ticket-system/ImportModal.tsx`

**Interfaces:**
- Consumes: `ImportSummary` (`@repo/contracts`), `Modal`, `Button`, `Banner` (Tasks 3, 5), `ApiClient`/`ApiError` (Task 6).
- Produces: `ImportModal` component with props `{ open: boolean; api: ApiClient; onClose: () => void; onImported: (result: ImportSummary) => void }` — consumed by `TriageApp.tsx` (Task 14).

- [ ] **Step 1: Create the file**

```tsx
// apps/web/components/ticket-system/ImportModal.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { FileCheck2, FileCode, FileJson, FileSpreadsheet, FileUp, Upload } from 'lucide-react';
import type { ImportSummary } from '@repo/contracts';
import { Modal } from './ds/Modal';
import { Button } from './ds/Button';
import { Banner } from './ds/Banner';
import { ApiError, type ApiClient } from '../../lib/ticket-system/api';

function FormatRow({ icon, name, ext }: { icon: React.ReactNode; name: string; ext: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
      {icon}
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{name}</span>
      <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{ext}</span>
    </div>
  );
}

function extFor(name: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(name || '');
  return m ? m[1].toLowerCase() : '';
}

export interface ImportModalProps {
  open: boolean;
  api: ApiClient;
  onClose: () => void;
  onImported: (result: ImportSummary) => void;
}

const ACCEPTED = ['csv', 'json', 'xml'];

export function ImportModal({ open, api, onClose, onImported }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setFile(null);
      setError(null);
      setImporting(false);
    }
  }, [open]);

  const acceptFile = (f: File | null | undefined) => {
    if (!f) return;
    const ext = extFor(f.name);
    if (!ACCEPTED.includes(ext)) {
      setError(`Unsupported file type ".${ext || '?'}" — use .csv, .json or .xml.`);
      setFile(null);
      return;
    }
    setError(null);
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    acceptFile(e.dataTransfer.files?.[0]);
  };

  const startImport = async () => {
    if (!file) return;
    setImporting(true);
    setError(null);
    try {
      const result = await api.importTickets(file);
      onImported(result);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={520}
      title="Import tickets"
      description="Bring in tickets from another tool as CSV, JSON, or XML. Triage auto-detects the format, then categorizes and prioritizes each ticket on ingest."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={importing}>
            Cancel
          </Button>
          <Button onClick={startImport} disabled={!file || importing} iconLeft={<Upload size={15} />}>
            {importing ? 'Importing…' : 'Start import'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <input ref={inputRef} type="file" accept=".csv,.json,.xml" style={{ display: 'none' }} onChange={(e) => acceptFile(e.target.files?.[0])} />
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `1.5px dashed ${dragOver ? 'var(--border-focus)' : 'var(--border-strong)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '26px',
            textAlign: 'center',
            background: dragOver ? 'var(--surface-selected)' : 'var(--surface-sunken)',
            cursor: 'pointer',
          }}
        >
          {file ? (
            <>
              <FileCheck2 size={28} color="var(--success)" />
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', marginTop: '8px' }}>{file.name}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: '2px' }}>{(file.size / 1024).toFixed(1)} KB — click to choose a different file</div>
            </>
          ) : (
            <>
              <FileUp size={28} color="var(--brand-500)" />
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', marginTop: '8px' }}>Drag a file here, or browse</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: '2px' }}>.csv, .json, or .xml — up to 50 MB</div>
            </>
          )}
        </div>

        {error && <Banner tone="danger" title="Import failed">{error}</Banner>}

        <div>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>Supported formats</div>
          <FormatRow icon={<FileSpreadsheet size={16} color="var(--text-tertiary)" />} name="Comma-separated values" ext=".csv" />
          <FormatRow icon={<FileJson size={16} color="var(--text-tertiary)" />} name="JSON export" ext=".json" />
          <FormatRow icon={<FileCode size={16} color="var(--text-tertiary)" />} name="XML export" ext=".xml" />
        </div>

        <Banner tone="info" title="Auto-classification is on">
          Imported tickets are categorized and assigned a priority automatically. You can review and override before they enter your queues.
        </Banner>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `cd homework-2 && pnpm --filter web exec tsc --noEmit --project tsconfig.json`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git -C homework-2 add apps/web/components/ticket-system/ImportModal.tsx
git -C homework-2 commit -m "feat(hw2-web): port ImportModal with real POST /tickets/import call"
```

---

## Task 14: `TriageApp.tsx` root + wire `page.tsx`/`layout.tsx`

**Files:**
- Create: `apps/web/components/ticket-system/TriageApp.tsx`
- Modify: `apps/web/app/page.tsx`
- Modify: `apps/web/app/layout.tsx` (metadata only)

**Interfaces:**
- Consumes: everything from Tasks 2, 6–13.
- Produces: `TriageApp` component with props `{ apiBaseUrl: string }`, rendered by `page.tsx`.

- [ ] **Step 1: Create `apps/web/components/ticket-system/TriageApp.tsx`**

```tsx
// apps/web/components/ticket-system/TriageApp.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Ticket, UpdateTicketInput } from '@repo/contracts';
import { createApiClient } from '../../lib/ticket-system/api';
import { type QueueId, type ToastState } from '../../lib/ticket-system/constants';
import { LoginScreen } from './LoginScreen';
import { TopBar } from './TopBar';
import { Toast } from './Toast';
import { Sidebar } from './Sidebar';
import { TicketList, type TicketListTab } from './TicketList';
import { TicketDetail } from './TicketDetail';
import { TicketFormModal } from './TicketFormModal';
import { ImportModal } from './ImportModal';

const TOKEN_KEY = 'triage_token';

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 860px)');
    setIsMobile(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return isMobile;
}

export function TriageApp({ apiBaseUrl }: { apiBaseUrl: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    setToken(localStorage.getItem(TOKEN_KEY));
    setAuthReady(true);
  }, []);

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, []);

  const api = useMemo(() => createApiClient(apiBaseUrl, () => token, handleUnauthorized), [apiBaseUrl, token, handleUnauthorized]);

  const handleLoginSuccess = (newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  };

  if (!authReady) return null;
  if (!token) return <LoginScreen api={api} onSuccess={handleLoginSuccess} />;
  return <AgentApp api={api} onLogout={handleLogout} />;
}

function AgentApp({ api, onLogout }: { api: ReturnType<typeof createApiClient>; onLogout: () => void }) {
  const isMobile = useIsMobile();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeQueue, setActiveQueue] = useState<QueueId>('all');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tab, setTab] = useState<TicketListTab>('open');
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [formModal, setFormModal] = useState<{ open: boolean; ticket: Ticket | null }>({ open: false, ticket: null });
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    setSidebarCollapsed(localStorage.getItem('triage_sidebar_collapsed') === '1');
  }, []);

  const notify = (message: string, type: ToastState['type'] = 'success') => setToast({ message, type });

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const list = await api.listTickets({});
      setTickets(list);
      setActiveId((cur) => (cur && list.some((t) => t.id === cur) ? cur : list[0]?.id ?? null));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load tickets.');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const queueFiltered = (list: Ticket[]) => {
    if (activeQueue === 'mine') return list.filter((t) => t.assigned_to === 'priya');
    if (activeQueue === 'unassigned') return list.filter((t) => !t.assigned_to);
    if (activeQueue === 'urgent') return list.filter((t) => t.priority === 'urgent');
    if (activeQueue === 'waiting_customer') return list.filter((t) => t.status === 'waiting_customer');
    if (activeQueue === 'resolved') return list.filter((t) => t.status === 'resolved');
    return list;
  };

  const visibleTickets = queueFiltered(tickets);
  const active = tickets.find((t) => t.id === activeId) || null;

  const counts: Record<QueueId, number> = {
    all: tickets.length,
    mine: tickets.filter((t) => t.assigned_to === 'priya').length,
    unassigned: tickets.filter((t) => !t.assigned_to).length,
    urgent: tickets.filter((t) => t.priority === 'urgent').length,
    waiting_customer: tickets.filter((t) => t.status === 'waiting_customer').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
  };

  const selectTicket = (id: string) => {
    setActiveId(id);
    if (isMobile) setMobileView('detail');
  };

  const updateTicket = async (id: string, patch: UpdateTicketInput) => {
    try {
      const saved = await api.updateTicket(id, patch);
      setTickets((list) => list.map((t) => (t.id === id ? saved : t)));
      notify('Ticket updated.');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not update ticket.', 'danger');
    }
  };

  const deleteTicket = async (id: string) => {
    const ticket = tickets.find((t) => t.id === id);
    try {
      await api.deleteTicket(id);
      setTickets((list) => {
        const next = list.filter((t) => t.id !== id);
        setActiveId((cur) => (cur === id ? next[0]?.id ?? null : cur));
        return next;
      });
      if (isMobile) setMobileView('list');
      notify(`Deleted ticket #${ticket ? ticket.number : ''}.`);
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not delete ticket.', 'danger');
    }
  };

  const onTicketSaved = (saved: Ticket, isEdit: boolean) => {
    setTickets((list) => (isEdit ? list.map((t) => (t.id === saved.id ? saved : t)) : [saved, ...list]));
    setActiveId(saved.id);
    setActiveQueue('all');
    setFormModal({ open: false, ticket: null });
    if (isMobile) setMobileView('detail');
    notify(isEdit ? `Ticket #${saved.number} updated.` : `Ticket #${saved.number} created.`);
  };

  const onImported = (result: { imported_count: number; failed_count: number }) => {
    setImportOpen(false);
    refresh();
    setActiveQueue('all');
    if (result.failed_count) {
      notify(`Imported ${result.imported_count}, ${result.failed_count} row(s) failed — check the file and retry those rows.`, 'danger');
    } else {
      notify(`Import complete — ${result.imported_count} tickets added.`);
    }
  };

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((v) => {
      const next = !v;
      localStorage.setItem('triage_sidebar_collapsed', next ? '1' : '0');
      return next;
    });
  };

  const listPane = <TicketList tickets={visibleTickets} loading={loading} activeId={activeId} onSelect={selectTicket} tab={tab} onTab={setTab} onOpenMenu={() => setSidebarOpen(true)} />;
  const detailPane = (
    <TicketDetail
      t={active}
      key={active ? active.id : 'empty'}
      api={api}
      onUpdate={updateTicket}
      onDelete={deleteTicket}
      onEdit={(t) => setFormModal({ open: true, ticket: t })}
      showBack={isMobile}
      onBack={() => setMobileView('list')}
    />
  );

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: 'var(--bg-app)', overflow: 'hidden' }}>
      <Sidebar
        activeQueue={activeQueue}
        onSelectQueue={setActiveQueue}
        counts={counts}
        mobileOpen={isMobile && sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
        collapsed={!isMobile && sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapsed}
      />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <TopBar isMobile={isMobile} onImport={() => setImportOpen(true)} onNewTicket={() => setFormModal({ open: true, ticket: null })} onLogout={onLogout} />
        {loadError && (
          <div style={{ padding: '10px 16px' }}>
            <div>
              Couldn&apos;t load tickets — {loadError}{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  refresh();
                }}
              >
                retry
              </a>
            </div>
          </div>
        )}
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>{isMobile ? (mobileView === 'list' ? listPane : detailPane) : (<>{listPane}{detailPane}</>)}</div>
      </div>
      <ImportModal open={importOpen} api={api} onClose={() => setImportOpen(false)} onImported={onImported} />
      <TicketFormModal open={formModal.open} ticket={formModal.ticket} api={api} onClose={() => setFormModal({ open: false, ticket: null })} onSaved={onTicketSaved} />
      <Toast toast={toast} />
    </div>
  );
}
```

- [ ] **Step 2: Replace `apps/web/app/page.tsx`**

```tsx
// apps/web/app/page.tsx
import { TriageApp } from '../components/ticket-system/TriageApp';

export default function Home() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  return <TriageApp apiBaseUrl={apiBaseUrl} />;
}
```

- [ ] **Step 3: Update metadata in `apps/web/app/layout.tsx`**

Replace the `metadata` export:

```tsx
export const metadata: Metadata = {
  title: 'Triage — Ticket System',
  description: 'Customer support ticket management — Next.js frontend for apps/api',
};
```

- [ ] **Step 4: Type-check**

Run: `cd homework-2 && pnpm --filter web exec tsc --noEmit --project tsconfig.json`
Expected: no errors.

- [ ] **Step 5: Manual smoke check**

Run: `cd homework-2 && pnpm --filter api dev` (separate terminal), then `pnpm --filter web dev`
Open `http://localhost:3000/` — expect the Triage login screen (not a blank page or the old health-check text).

- [ ] **Step 6: Commit**

```bash
git -C homework-2 add apps/web/components/ticket-system/TriageApp.tsx apps/web/app/page.tsx apps/web/app/layout.tsx
git -C homework-2 commit -m "feat(hw2-web): wire TriageApp as the Next.js home page"
```

---

## Task 15: Remove the static prototype, update docs

**Files:**
- Delete: `apps/web/public/ticket-system/` (entire directory — html, `app/*.jsx`, `_ds/`, README.md)
- Modify: `homework-2/README.md` (if it references the static prototype path — check and update)

**Interfaces:** none (cleanup only).

- [ ] **Step 1: Remove the directory**

Run: `cd homework-2 && git rm -r apps/web/public/ticket-system`
Expected: git stages the deletion of every file under that path.

- [ ] **Step 2: Check for stale references**

Run: `cd homework-2 && grep -rl "ticket-system" --include="*.md" . | grep -v docs/superpowers`
Expected: review any hits (likely `README.md` if it links to the old path) and update or remove those lines so they don't point at a deleted directory. If `README.md` mentions "Ticket System.html" or `public/ticket-system`, replace that section with: the ticket UI is now the Next.js app itself at `apps/web`, run via `pnpm dev` and open `http://localhost:3000/`, login `admin@ignore.com` / `123`.

- [ ] **Step 3: Note the known "Assigned to me" limitation**

If `homework-2/README.md` has a "Known limitations" or equivalent section, add:

```md
- "Assigned to me" (sidebar queue and list tab) filters by the hardcoded
  agent id `priya` — the backend has a single admin account and no
  agent/user model, so this only matches tickets whose `assigned_to` was
  manually set to `"priya"` (e.g. via the ticket detail Assignee dropdown).
```

If there's no such section, skip this step — don't invent a new doc section that isn't asked for elsewhere in the plan.

- [ ] **Step 4: Verify the build still works without the deleted directory**

Run: `cd homework-2 && pnpm --filter web exec tsc --noEmit --project tsconfig.json`
Expected: no errors (nothing in `apps/web/app` or `apps/web/components` references `public/ticket-system`).

- [ ] **Step 5: Commit**

```bash
git -C homework-2 commit -m "chore(hw2-web): remove superseded static prototype (public/ticket-system)"
```

---

## Task 16: Full verification (lint, build, manual E2E)

**Files:** none — verification only.

- [ ] **Step 1: Lint**

Run: `cd homework-2 && pnpm --filter web lint`
Expected: no errors. If ESLint flags something in a ported file (e.g. an unescaped apostrophe already handled with `&apos;`, or an unused import), fix it in place and re-run.

- [ ] **Step 2: Full production build**

Run: `cd homework-2 && pnpm --filter web build`
Expected: build succeeds (this is the first time this app has ever gone through a real Next.js build — it never did as a static-HTML prototype). If it fails, read the error, fix the specific file it names, and re-run.

- [ ] **Step 3: Start both servers**

Run in two terminals from `homework-2/`:
- `pnpm --filter api dev` (expect: `Nest application successfully started`, listening on port 3001)
- `pnpm --filter web dev` (expect: `Ready on http://localhost:3000`)

- [ ] **Step 4: Manual E2E walkthrough**

In a browser at `http://localhost:3000/`:
1. Confirm the Triage login screen renders (brand mark, "Вход в Triage" heading) — not a blank page, not the old "Customer Support System" health-check text.
2. Submit with a wrong password (e.g. `admin@ignore.com` / `nope`) → expect a red banner with the real backend message "Invalid email or password." (open browser devtools Network tab and confirm a `POST /auth/login` request returned 401).
3. Log in with `admin@ignore.com` / `123` → expect the brief "Вход выполнен" success screen, then the ticket queue (empty list, since the backend starts with no tickets).
4. Click "New ticket", fill in subject/customer name/email/description, submit → expect the ticket to appear in the list and become the active detail pane; confirm in Network tab this was a real `POST /tickets` (not simulated).
5. In the detail pane, change Priority and Status via the dropdowns → expect a "Ticket updated." toast and a real `PATCH /tickets/:id` in the Network tab.
6. Click "Run classification" in the Auto-classification panel → expect a `POST /tickets/:id/classify` request and a category/priority/confidence/reasoning result to render.
7. Click "Import", drag in `apps/api/test/fixtures/tickets-valid.csv`, start the import → expect a success toast and the new tickets to appear after the list refreshes.
8. Delete one ticket via the trash icon → confirm modal → expect it to disappear from the list and a real `DELETE /tickets/:id` (204) in the Network tab.
9. Resize the browser window below 860px width → expect the sidebar to become a slide-over drawer (hamburger button appears in the list toolbar) and the list/detail panes to stack (detail full-screen with a back arrow when a ticket is selected).
10. Click the logout icon in the top bar → expect return to the login screen; open devtools Application/Storage tab and confirm `localStorage` no longer has a `triage_token` entry.
11. Reload the page while still logged out → expect the login screen again (not a flash of the ticket queue).
12. Log in again, then reload the page → expect it to go straight to the ticket queue without showing the login screen (token persisted from `localStorage`).

- [ ] **Step 5: Record the deliverable screenshot**

Per `TASKS.md` deliverables ("UI Screenshot… main ticket list or another representative screen with real data"), take a screenshot of the ticket queue with at least one real ticket visible and save it to `homework-2/docs/screenshots/ui.png` (create the `docs/screenshots/` directory if it doesn't exist).

- [ ] **Step 6: Final commit (if Steps 1–2 required fixes)**

```bash
git -C homework-2 add -A apps/web docs/screenshots
git -C homework-2 commit -m "fix(hw2-web): resolve lint/build issues found during full verification"
```

Skip this step if Steps 1–2 passed clean on the first try and only the screenshot was added — in that case commit just the screenshot:

```bash
git -C homework-2 add docs/screenshots/ui.png
git -C homework-2 commit -m "docs(hw2): add UI screenshot deliverable"
```

---

## Self-Review

**Spec coverage:** every section of `docs/superpowers/specs/2026-07-13-ticket-system-e2e-design.md` maps to a task — design tokens (Task 1), design-system primitives (Tasks 3–5), API client incl. real login/401 handling (Task 6), each feature component (Tasks 7–13), root state machine + responsive breakpoints + page wiring (Task 14), removal of `public/ticket-system` (Task 15), known "Assigned to me" limitation documented (Task 15, Step 3), manual E2E + `pnpm build` (Task 16).

**Placeholder scan:** no TBD/TODO; every step has complete, runnable code or an exact command with expected output.

**Type consistency:** `ApiClient` (Task 6) is threaded through unchanged into `LoginScreen`, `TicketDetail`, `TicketFormModal`, `ImportModal`, `TriageApp` (Tasks 7, 11–14). `QueueId` (Task 2) is used consistently in `Sidebar` (Task 9) and `TriageApp`'s `counts`/`activeQueue` (Task 14). `ToastState` (Task 2) matches `Toast.tsx`'s prop type (Task 8) and `TriageApp`'s `notify()` (Task 14). `TicketListTab` is exported from `TicketList.tsx` (Task 10) and imported by `TriageApp.tsx` (Task 14) rather than redeclared.
