# Homework 3 — Specification-Driven Design

## Student & task summary

**Student:** Vladimir Kiryakov
**Task:** Produce a *specification package* (no code) for a regulated FinTech feature. I chose the
**virtual card lifecycle** — create, freeze/unfreeze, set limits, view transactions — modeled as an
**in-house issuer-processor that owns and tokenizes the PAN itself**. That last choice deliberately
puts the design in **full PCI-DSS scope**, which makes the security, audit, and edge-case layers
carry real weight instead of being decorative.

**Deliverables in `homework-3/`:**
- `specification.md` — the layered spec (the graded artifact).
- `agents.md` — binding AI-agent domain/safety rules.
- `.claude/CLAUDE.md` — Claude Code editor rules (portable to Copilot/Cursor).
- `README.md` — this file.

**Assumed stack:** Rust · Axum · sqlx/PostgreSQL · Apalis · Redis · KMS/HSM envelope encryption.

---

## Rationale

### Why this shape
The spec is layered so requirements are **traceable top-to-bottom**: one High-Level Objective →
ten observable **Mid-Level Objectives** (`MO-1…MO-10`) → non-functional/policy targets →
implementation guardrails → explicit begin/end context → **18 low-level tasks** (`T1…T18`), each
citing the objective it serves and ending with acceptance criteria. Section 11 makes traceability a
**review gate**: an MO with no verification, or a task with no MO, means the spec is incomplete.
This mirrors how I actually run spec-driven work — the spec, not the code, is the artifact you argue
about.

### Why "we tokenize the PAN ourselves"
Delegating issuance to an external processor (Marqeta/Stripe-Issuing style) is easier and shrinks
PCI scope — which is exactly why it makes a *weaker* homework. Owning the PAN forces the interesting
problems onto the page: envelope encryption with KMS-held KEKs, a zeroizing non-`Debug`/non-`Serialize`
`Pan` type, a one-time reveal grant, HMAC-based lookup so plaintext is never a query key, and DB
role-splitting so the read-model literally cannot select ciphertext. Those become concrete tasks
(`T3`, `T4`, `T9`) and concrete tests, not hand-waving.

### Why integer minor units, not `Decimal`
The provided template reaches for Python `Decimal`. In a Rust card ledger the stronger default is
**integer minor units** (`i64`, aggregated in `i128`) with an ISO-4217 currency code — no rounding
surprises, no float class of bugs, cheap to serialize and reconcile. `rust_decimal` is only justified
at FX/display boundaries, and FX is explicitly out of scope, so the spec bans floats outright
(`specification.md` §5, `agents.md` §2.4). This is an opinionated deviation from the template and I
call it out on purpose.

### How I chose the performance targets
Every number is labelled **(assumed target)** and defended where it lives (`specification.md` §4.5):

- **Authorization decision p99 ≤ 300 ms.** The card network stands-in / times out the issuer on the
  order of 2–5 s. The issuer's job is to answer *well* inside that. 300 ms p99 leaves a large safety
  margin for network + our own DB/lock time while keeping approvals snappy. p50 ≤ 80 ms reflects that
  the happy path is a single locked row read + counter check.
- **Create/reveal are slower budgets (500 ms / 800 ms p99)** because they include a KMS round-trip
  (key wrap / decrypt), which dominates and is outside pure app latency.
- **Freeze propagation ≤ 1 s** because a freeze is a fraud/compliance control — "eventually" is not
  acceptable; the auth path must see it almost immediately, and the spec makes state
  read-after-write on the primary with fail-closed cache fallback (§6).
- **Throughput 500 TPS / 1500 TPS burst, rate limits (reveal 5/card/h, create 10/user/h)** are
  round, defensible starting points for a mid-size program, tunable with Risk. The point isn't the
  exact number — it's that they're **measurable and testable**, not "should be fast".

### Observability as a first-class layer, not wiring
Observability gets its own objective (`MO-11`), a full spec section (§4.6), five tasks (`T19–T23`),
edge cases (`E25–E29`), and verification — the same discipline as the money path. Three deliberate
stances drive it: **audit ≠ telemetry** (compliance evidence is durable/immutable/in-transaction;
telemetry is best-effort and sampleable — conflating them either bloats the audit store or makes you
trust sampled data as evidence); **telemetry fails open while money fails closed** (a metrics outage
must never block an authorization, the exact inverse of the §6 rule, and the code must make that
inversion explicit); and **no CHD in telemetry, structurally**, including metric labels and span
attributes, with `card_id` banned as a label to keep cardinality sane and avoid per-user leakage
through the metrics store. The alerting bias is toward **money-integrity signals** — reconciliation
drift pages P1 — because in card issuing the scariest failures are silent-wrong-number failures, not
loud 500s.

### How I chose verification depth

Verification is a first-class layer, not a trailing bullet (`specification.md` §9). Each objective
has an explicit **objective → verification map**, edge cases (§8) map to concrete tests, and the
hardest correctness property — *sum(approved) ≤ limit under concurrency* (`E6`) — gets a mandatory
concurrency test that any decisioning change must ship. Compliance-flavored checks (no CHD in logs,
CVV never stored, read-role can't read ciphertext, reveal audited) are written **as executable
assertions**, plus a manual compliance checklist as a release gate. Depth is proportional to blast
radius: money and PAN paths get the most, read models get less.

---

## Industry best practices — what I added and where it appears

| Best practice | Where in the spec |
|---------------|-------------------|
| **PCI-DSS: no post-auth CVV storage; PAN encrypted; displayable derivatives only** | `specification.md` §4.1; `agents.md` §2.1–2.3; `CLAUDE.md` golden rules 1–2 |
| **Envelope encryption (DEK/KEK), KEK in KMS/HSM, rotation without full re-encrypt** | `specification.md` §4.1, task `T3`; ending context §7.2 |
| **Tokenization + HMAC lookup (PAN never a query key)** | `specification.md` §4.1, §5; `T3`/`T4`; `agents.md` §2.8 |
| **One-time, short-TTL, audited PAN reveal** | `specification.md` MO-2, §4.1, `T9`; edge cases E3–E4, E15 |
| **Immutable, in-transaction, hash-chained audit trail** | `specification.md` MO-8, §4.3, `T7`; `agents.md` §2.5 |
| **Append-only system of record: no hard deletes; reverse, don't delete; crypto-shred for erasure; DB-level `DELETE`/`UPDATE` revoked** | `specification.md` §5, `T4`; `agents.md` rule 10; `CLAUDE.md` rule 10; edge cases E30–E32 |
| **Least-privilege DB roles (read-model can't read ciphertext)** | `specification.md` §4.1, `T4`; verification §9.2 |
| **Idempotency keys for unsafe writes (replay + conflict semantics)** | `specification.md` MO-10, §5, `T5`; edge cases E1–E2 |
| **Idempotent authorization on network auth id (no double-count)** | `specification.md` MO-6, `T13`; edge case E7 |
| **Concurrency safety: row-locking so limits can't be jointly breached** | `specification.md` §5, `T13`; edge case E6; verification §9.2 |
| **Integer money (minor units), floats forbidden** | `specification.md` §5, `T1`; `agents.md` §2.4; `CLAUDE.md` rule 3 |
| **Fail-closed on the money path (KMS/Redis/state uncertainty ⇒ decline)** | `specification.md` §6, §4.5; edge cases E14–E16, E21; `agents.md` §2.6 |
| **RFC 9457 problem+json errors; no internal/CHD leakage** | `specification.md` §5, `T18`; `agents.md` §3 |
| **RBAC + ownership; enumeration-safe `404`; audited access** | `specification.md` MO-9, §2, `T6`; edge cases E17–E19 |
| **Structured logs with a CHD denylist filter + correlation id** | `specification.md` §4.3, §4.6.1, `T17`; `agents.md` §5a, §7 |
| **Distributed tracing (OpenTelemetry) with CHD-safe span attributes + tail sampling** | `specification.md` §4.6.1, `T20` |
| **SLIs/SLOs + error budgets, multi-window multi-burn-rate alerting** | `specification.md` §4.6.2, `T19`, `T21` |
| **Money-integrity monitoring (decline-rate anomaly, reconciliation drift P1, velocity)** | `specification.md` §4.6.3, `T21`, `T23`; edge case E27 |
| **Metric-label cardinality discipline (no `card_id` label)** | `specification.md` §4.6, `T19`; edge case E28 |
| **Telemetry fails open / money fails closed / audit ≠ telemetry separation** | `specification.md` §4.6(a–c); `agents.md` §5a; `CLAUDE.md` rule 9; edge case E25 |
| **Fail-closed readiness probes (drain, don't mass-decline)** | `specification.md` §4.6.4, `T22`; edge case E29 |
| **Access-controlled + audited monitoring surfaces** | `specification.md` §4.6.4, `T23` |
| **Keyset pagination (no OFFSET) for financial read models** | `specification.md` MO-7, `T14`; edge case E20 |
| **Reconciliation as a scheduled control (counter == txn sum == limit-consumed)** | `specification.md` §9.3, `T15` |
| **SLOs / availability / RPO-RTO as stated targets, not vibes** | `specification.md` §4.4–4.5 |
| **Data minimization, retention, crypto-shred for erasure** | `specification.md` §4.2 |
| **Compile-time-checked SQL (sqlx), no string SQL** | `agents.md` §1; `CLAUDE.md` rule 7 |

---

## Notes on scope and honesty

The clearing/settlement money movement, KYC, disputes, and the network transport itself are
explicitly **out of scope** (`specification.md` §1) so the spec stays deep rather than wide — the
homework rewards decomposition and traceability, not surface area. Where I made up a number, it's
labelled **(assumed target)** with a reason; where a rule is non-negotiable, it appears in all three
of the spec, `agents.md`, and `CLAUDE.md` so an AI agent can't miss it regardless of which file it
loads.