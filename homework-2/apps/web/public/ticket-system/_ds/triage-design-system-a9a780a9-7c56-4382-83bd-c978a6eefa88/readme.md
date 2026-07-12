# Triage — Design System

Triage is a **customer support ticket management platform**. It imports tickets from
multiple file formats (CSV, JSON, EML/mbox, Zendesk/Intercom exports), automatically
categorizes issues and assigns priorities, then gives support **agents** a fast web
workspace to work the queue day to day.

This design system is the single source of truth for Triage's visual language, tone,
reusable UI components, and full-screen product recreations.

> **Provenance / sources.** This system was authored **from a product brief only** — no
> codebase, Figma file, brand assets, or existing UI were provided. Everything here
> (name, palette, type, components) is an original, internally-consistent proposal
> intended as a starting point, not a recreation of an existing product. If you have real
> Triage brand assets, a codebase, or Figma files, share them and this system should be
> reconciled against them.

---

## The product, in one paragraph

Support teams drown in inbound. Triage's job is to make a large, messy queue feel
**calm and workable**: pull tickets in from wherever they live, auto-tag and prioritize
them, and present agents a dense-but-legible list + conversation view where the next
right action is always obvious. The interface is a tool people stare at for eight hours,
so it favors clarity, low visual noise, tabular alignment, and restraint over decoration.

Primary product surface: **the agent web app** (sidebar of queues → ticket list → ticket
detail/conversation). Secondary contexts: import/setup flows, dashboards, settings.

---

## Content fundamentals — how Triage writes

**Voice:** calm, competent, quietly reassuring. Triage is the operations software that
never panics. It states facts and the next action; it does not cheerlead.

- **Person.** Address the agent as **you** ("You have 12 tickets assigned"). Triage
  refers to itself by name or not at all — never "I" / "we" in product UI.
- **Tone.** Plain and direct. Short verb-first labels: *Reply*, *Assign*, *Merge*,
  *Close ticket*, *Snooze*. Prefer the specific verb over generic ones ("Submit", "OK").
- **Casing.** **Sentence case everywhere** — buttons, menus, headings, table headers.
  Never Title Case UI. ALL-CAPS is reserved for tiny eyebrow labels / badges
  (`BILLING`, `SLA 2H`) at the `--text-2xs` size with `--tracking-caps`.
- **Numbers & IDs.** Ticket IDs are monospace with a leading hash: `#4790`. Counts are
  tabular. Time is relative in lists ("2h ago", "Yesterday"), absolute on hover / in
  detail ("2026-07-12 09:14").
- **Status language.** Lifecycle words are fixed and lowercase in prose but
  capitalized as labels: new, open, pending, solved, closed. Priority: Urgent, High,
  Medium, Low, None.
- **Empty & success states.** Neutral and brief. "No tickets match these filters."
  "Import complete — 412 tickets added." Never exclamatory, never "Woohoo!".
- **Errors.** Say what happened and what to do: "Couldn't send reply — check your
  connection and retry." No blame, no jargon codes in the primary line.
- **Emoji.** Not used in product UI. (Customers' own message content may contain them;
  render as-is.)

**Micro-examples**
- Button: `Reply` · `Assign to me` · `Close ticket` · `Merge tickets`
- Banner: *3 tickets breaching SLA — reassign or escalate before 4:00pm.*
- Toast: *Ticket assigned to Priya.*
- Tooltip: *Merge into another ticket*
- Empty: *You're all caught up. No tickets in this queue.*

---

## Visual foundations

**Overall feel.** Utilitarian-modern SaaS. Bright, near-white app canvas; content on
white cards defined by hairline borders; color used **sparingly and meaningfully** —
almost all color in the product comes from the priority and status ramps, not decoration.

**Color.**
- Base is a **warm-neutral slate** (`--ink-*`), a hair warmer than pure gray to reduce
  screen fatigue over long shifts. App background `--ink-50`, surfaces white, text
  `--ink-900`.
- The brand accent is **Indigo "Signal"** (`--brand-500` `#5a4bd6`) — trustworthy,
  focused, not the default Tailwind indigo. Used for the primary action, active nav,
  selection, focus rings. One accent per view; never fill large areas with it.
- **Priority ramp** (Urgent red → High orange → Medium gold → Low blue → None gray) and
  **Status ramp** (new indigo, open blue, pending gold, solved green, closed gray) carry
  the real semantic weight. These are the brand's most recognizable color story.
- Semantic feedback: success green, warning gold, danger red, info blue, each with a
  soft tinted background for banners.

**Type.**
- **Display — Schibsted Grotesk** (700/800): page titles, headings, big numerals. Tight
  tracking (−0.02em).
- **UI / Body — Hanken Grotesk** (400–700): everything else. Default body 14px, dense
  UI 13px. Comfortable, neutral grotesk.
- **Mono — IBM Plex Mono** (400–500): ticket IDs, timestamps, SLA timers, tags, code,
  any aligned numeric metadata. Tabular figures.
- Scale is compact (11 → 38px) because the product is information-dense. Line-height
  1.5 for reading, 1.15–1.3 for headings.

**Spacing & layout.** 4px base grid. Chrome is dense — toolbars and table rows use the
2–12px end of the scale; page sections use 16–32px. Fixed layout rails: 248px sidebar,
52px topbar, ~380px list pane, 44px ticket rows. Content is left-aligned and tabular;
avoid centered marketing layouts inside the product.

**Corners & borders.** Restrained radii: inputs/badges 5px, buttons/small cards 7px,
cards/panels 10px, modals/popovers 14px. **Pills (999px) only for status/priority
chips.** Borders are hairline `--ink-150/200`; surfaces are **border-first**, not
shadow-heavy.

**Elevation.** Shadows are cool-slate tinted, low-spread, layered (xs→xl). Product
surfaces stay mostly flat and border-defined; shadow appears only to signal genuine
**lift** — popovers, dropdowns, modals, drag. Modals sit on a 45%-ink scrim with a 2px
backdrop blur.

**Motion.** Quick and functional. Durations 80/130/200/320ms; easing
`cubic-bezier(0.2,0,0,1)` (standard) and an ease-out for entrances. **No bounce, no
springy overshoot** in product chrome. Transitions are limited to color, background,
border, box-shadow, opacity, and small transforms (1px hover lift, toggle knob slide).
Respect `prefers-reduced-motion`.

**Interaction states.**
- *Hover:* surfaces go one step darker (`--surface-hover`); primary button →
  `--brand-600`; ghost buttons get a subtle fill; cards lift 1px + gain md shadow.
- *Active/press:* primary → `--brand-700`; no scale-down.
- *Focus:* 3px `--focus-ring` (indigo @ 40% alpha) box-shadow, never a raw outline.
- *Selected:* `--surface-selected` (brand-50) background + indigo text.
- *Disabled:* 45–50% opacity, no shadow, `not-allowed` cursor.

**Backgrounds & imagery.** No gradients, no photographic hero imagery inside the
product. The canvas is flat neutral. The one recurring motif is the **signal-bar glyph**
(the four ascending bars used in the priority indicator and the wordmark). No textures,
no illustration set was provided.

**Transparency & blur.** Used only for overlays (modal scrim) and never for legibility-
critical text surfaces.

---

## Iconography

- **System: Lucide** (https://lucide.dev) — chosen to match the interface's 2px-stroke,
  round-cap, round-join line style. Loaded from CDN
  (`https://unpkg.com/lucide@latest`); in HTML use `<i data-lucide="inbox"></i>` then
  call `lucide.createIcons()`. This is a **substitution flag**: no icon set was provided,
  so Lucide is the recommended stand-in. Swap for the real set if one exists.
- **Style rules.** Line icons only (no filled/duotone), stroke-width 2, size 16–18px in
  chrome and 20px for primary nav. Icons inherit `currentColor` — tint via text color,
  don't hard-code hex. Never mix icon families.
- **The signal-bar glyph** (ascending bars) is drawn inline in `PriorityTag` and the
  wordmark — it is the one bespoke brand glyph and is *not* a Lucide icon.
- **Emoji / unicode as icons:** not used. Arrows in prose (→) are acceptable as
  connectors, not as interactive affordances.
- No PNG/sprite icons; everything is inline SVG or Lucide.

---

## Components

Reusable React primitives (namespace `TriageDesignSystem_a9a780`). Each lives in
`components/<group>/` with `.jsx` + `.d.ts` + `.prompt.md` and a group card HTML.

**buttons/** — `Button`, `IconButton`
**forms/** — `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch`, `FieldLabel`
**data-display/** — `PriorityTag`, `StatusTag`, `Badge`, `Avatar`, `Card`
**feedback/** — `Banner`, `Toast`, `Tooltip`, `Spinner`
**navigation/** — `Tabs`, `NavItem`
**overlays/** — `Modal`

*Intentional additions* (no source component library existed, so a standard set was
authored, tuned to the domain): `PriorityTag` and `StatusTag` are domain-specific to
ticket triage; `NavItem` supports the queue sidebar; `FieldLabel` wraps form controls.

---

## Index / manifest

- `styles.css` — global entry point (link this). `@import`s all token files.
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `radius.css`,
  `elevation.css` (shadow + motion), `fonts.css` (webfonts), `base.css` (resets).
- `_ds_bundle.js` — compiled bundle of the reusable React primitives listed above,
  exposed as `window.TriageDesignSystem_a9a780`.

## Caveats / open questions

- **Fonts are served from Google Fonts CDN**, not self-hosted, because no font binaries
  were provided. To self-host, drop woff2 files in `assets/fonts/` and replace the
  `@import` in `tokens/fonts.css` with local `@font-face` rules. (The compiler currently
  reports 0 shipped font binaries for this reason.)
- **No logo was supplied** — the wordmark is set in Schibsted Grotesk with the signal-bar
  mark. Replace with the real mark if one exists.
- **Icons are Lucide (substituted)** — swap for the real icon set if Triage has one.
