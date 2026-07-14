# Virtual Card Lifecycle — Specification

> Ingest the information from this file, implement the Low-Level Tasks, and generate the code
> that satisfies the High- and Mid-Level Objectives. This document is the source of truth.
> Where a number is labelled **(assumed target)** it is a working assumption to be confirmed
> with Product/Risk before GA; it is nonetheless binding for implementation and testing until changed.

**Domain:** consumer virtual payment cards, issued and processed in-house.
**We are the issuer-processor.** We own the PAN, tokenize it ourselves, and respond to
authorization requests coming from the card network. This places us in **full PCI-DSS scope**.

---

## 0. Glossary (so nobody guesses)

| Term | Meaning in this spec |
|------|----------------------|
| **PAN** | Primary Account Number (the 16-digit card number). Cardholder Data (CHD). Never logged. |
| **PAN token** | Our opaque, non-reversible-without-vault reference to a PAN. Safe to store/return. |
| **BIN** | First 6–8 digits of the PAN (network + product). Not secret, but not sensitive alone. |
| **last4** | Last 4 digits of PAN. Displayable. |
| **DEK / KEK** | Data Encryption Key / Key Encryption Key. Envelope encryption; KEK lives in KMS/HSM. |
| **Authorization (auth)** | Real-time request from the network asking us to approve/decline a spend. |
| **Hold / captured / settled** | Auth lifecycle: reserved funds → merchant claims → money moves. |
| **Velocity** | Count/sum of transactions over a rolling window (fraud + limit control). |
| **minor units** | Smallest currency unit (cents for USD). All money is integer minor units. |
| **Ops/Compliance** | Internal back-office actor. RBAC-scoped. Can inspect, cannot see full PAN/CVV. |

---

## 1. High-Level Objective

**Provide a secure, auditable service that lets a cardholder create a virtual card and manage
its full lifecycle — activate, freeze/unfreeze, set spending limits, and view transactions —
while the same service authorizes spend in real time against those limits and card state.**

**Scope boundary:** issuance, lifecycle state, limit configuration, real-time authorization
decisioning, and transaction read models for **one card program, single-currency per card**.
**Out of scope:** clearing/settlement money movement, ledger-to-GL posting, KYC/onboarding,
dispute/chargeback resolution, physical cards, multi-currency FX, and the card-network gateway
transport itself (we consume an already-parsed auth request).

---

## 2. Stakeholders & Views

| Stakeholder | Needs | Hard boundary |
|-------------|-------|---------------|
| **End-user (cardholder)** | Create card, reveal PAN once for provisioning, freeze/unfreeze, set limits, see transactions | Sees own cards only; full PAN exactly once via secure reveal |
| **Ops / Compliance** | Inspect any card's state, limits, transactions, and full audit trail; force-freeze/close | **Never** sees full PAN or CVV; every access is itself audited |
| **Fraud** | Read velocity/decline signals; force-freeze | Same PAN boundary as Ops |
| **Support** | Read masked card state to help a user | Read-only, masked, no limit/state mutation |
| **Authorization system (network-facing)** | Sub-second approve/decline against state+limits | Machine actor; no PII beyond what the auth requires |

---

## 3. Mid-Level Objectives (observable outcomes)

Each is phrased as *what changes in the world* when it succeeds. IDs (`MO-n`) are referenced by
every low-level task and every verification item.

- **MO-1 — Issuance.** A cardholder request produces a card in `ACTIVE` state with a stored
  encrypted PAN, a returned **token + BIN + last4**, and a network-provisionable token — the
  full PAN is **never** in the create response body.
- **MO-2 — One-time PAN reveal.** The cardholder can reveal the full PAN exactly once per
  issued short-lived reveal grant; each reveal is audited and the plaintext never touches logs.
- **MO-3 — Lifecycle state machine.** Card status transitions follow a strict, enforced state
  machine (`PENDING → ACTIVE ⇄ FROZEN`, any → `CLOSED` terminal); illegal transitions are
  rejected without side effects.
- **MO-4 — Freeze is authoritative and near-instant.** A freeze causes the **next**
  authorization to decline; propagation to the auth path is bounded (see §6).
- **MO-5 — Limit configuration.** A cardholder/ops actor can set per-transaction, daily,
  monthly, and lifetime limits (integer minor units, card currency); invalid limits are rejected
  atomically with a typed error.
- **MO-6 — Authorization decisioning.** An incoming auth request is approved **iff** card is
  `ACTIVE`, amount ≤ available per-transaction limit, and all velocity windows (daily/monthly/
  lifetime) have headroom; otherwise it is declined with a specific reason code. The decision is
  idempotent on the network's auth id.
- **MO-7 — Transaction read model.** Authorized/declined transactions are queryable by the
  cardholder with keyset pagination and stable ordering; counters used for limits reconcile with
  the transaction records.
- **MO-8 — Immutable audit trail.** Every state change, limit change, reveal, and back-office
  access writes an append-only audit record **in the same transaction** as the change it
  describes; audit records are never updated or deleted.
- **MO-9 — RBAC & least privilege.** Every endpoint enforces actor role and ownership; ops/
  compliance reads are permitted but PAN/CVV are structurally unreachable for them.
- **MO-10 — Idempotency.** Create-card and set-limit accept an `Idempotency-Key`; a retried
  request with the same key and body returns the original result and causes no duplicate effect.
- **MO-11 — Observability & monitoring.** The service emits metrics, structured logs, and
  distributed traces sufficient to (a) measure every SLO in §4.5 as a live SLI, (b) detect a
  money-path anomaly (decline spike, reconciliation drift, dependency failure) fast enough to act,
  and (c) do all of the above **without any CHD ever entering telemetry** — while remaining
  distinct from the compliance audit trail (MO-8).

---

## 4. Non-Functional & Policy Requirements

### 4.1 Security & PCI-DSS
- **CHD at rest:** PAN stored only as ciphertext via **envelope encryption** — per-record DEK,
  DEK wrapped by a KEK held in KMS/HSM (never in app memory beyond the decrypt call). CVV/CVC is
  **never stored** after issuance (PCI-DSS 3.2 prohibits post-auth storage of sensitive auth data).
- **CHD in transit:** TLS 1.2+ only, internal and external. mTLS on the auth path.
- **PAN lookups:** deterministic **HMAC-SHA-256 (keyed)** `pan_hash` for dedup/lookup; the raw
  PAN is never a query key.
- **Displayable derivatives only:** normal reads expose `token`, `bin`, `last4` — nothing else.
- **Reveal:** full PAN returns only through the one-time reveal flow (MO-2), decrypted on the fly,
  short TTL grant (**(assumed target)** 60s), single use, fully audited.
- **Secrets:** no secrets in code, logs, or error bodies. KEK rotation supported without
  re-encrypting every DEK.
- **Least privilege:** DB roles split — the service role can insert into the vault but the
  read-model role cannot select `ciphertext`.

### 4.2 Privacy & Data Handling
- Data minimization: store the minimum CHD needed. Retain per policy (**(assumed target)** PAN
  vault entries purgeable on card close + regulatory retention window; audit retained ≥ 7 years).
- Right-to-access/erasure honored **except** where financial-record retention law overrides
  (audit + transaction history are retained; PAN can be crypto-shredded by destroying the DEK).

### 4.3 Audit & Logging
- **Audit trail** (MO-8): append-only, tamper-evident (hash-chained per card **(assumed target)**),
  written in the same DB transaction as the mutation.
- **Application logs:** structured JSON, correlation id per request. **Denylist:** PAN, CVV, full
  reveal payloads, DEK/KEK material, `Idempotency-Key` values are never logged. Amounts and last4
  are allowed.
- Every ops/compliance read of a card is itself an audited event.

### 4.4 Reliability
- **Auth path availability (assumed target):** 99.95% monthly. It is the hot path the network
  waits on — degradation here is customer-visible declines.
- **Management API availability (assumed target):** 99.9%.
- **RPO ≤ 5 min, RTO ≤ 30 min (assumed targets)** for the primary data store.
- Freeze/close must be **strongly consistent** on the auth path: a committed freeze is visible to
  the next auth read (read-after-write on the primary), with any cache invalidated within the
  freeze-propagation budget (§6).

### 4.5 Performance / Latency Budgets *(all assumed targets; rationale in README)*
| Flow | p50 | p99 | Note |
|------|-----|-----|------|
| **Authorization decision** | ≤ 80 ms | ≤ 300 ms | Networks stand-in on issuer timeout (~2–5 s); 300 ms leaves wide margin |
| Create card | ≤ 150 ms | ≤ 500 ms | Includes KMS wrap + vault insert |
| Reveal PAN | ≤ 250 ms | ≤ 800 ms | KMS decrypt round-trip dominates |
| Freeze / unfreeze | ≤ 80 ms | ≤ 300 ms | Plus propagation ≤ 1 s to any cache |
| Set limits | ≤ 100 ms | ≤ 400 ms | |
| List transactions | ≤ 120 ms | ≤ 400 ms | Keyset pagination, page ≤ 100 (default 50) |

- **Auth throughput (assumed target):** 500 TPS sustained, 1500 TPS 60 s burst.
- **Rate limits (assumed target):** management API 20 req/s per user; reveal 5 per card per hour;
  create 10 per user per hour.
- **Idempotency retention (assumed target):** 24 h.

### 4.6 Observability & Monitoring

Observability is a first-class requirement (MO-11), not a wiring afterthought. Three principles
govern it here:

**(a) Audit ≠ telemetry — never conflate them.**
The **audit trail** (MO-8) is compliance evidence: durable, immutable, in-transaction, complete,
never sampled. **Operational telemetry** (metrics/logs/traces) is best-effort, sampleable, and may
drop under load. A monitoring outage must **never** be able to drop or corrupt an audit record, and
audit records are **not** a substitute for metrics (you cannot alert off an append-only log at auth
latency). They live in separate stores with separate retention.

**(b) No CHD in telemetry — structurally.**
PAN, CVV, DEK/KEK, reveal payloads, and `Idempotency-Key` values must never appear in a metric
label, log field, or trace span attribute. Metric labels are additionally **cardinality-bounded**:
allowed labels are low-cardinality dimensions (reason code, endpoint, status, currency). **Card id /
token is not a metric label** (unbounded cardinality) — correlate per-card via trace exemplars, not
labels.

**(c) Fail-open telemetry, fail-closed money.**
If the metrics/trace backend is unavailable, the request path continues (telemetry is dropped, not
blocking). This is the opposite of the money-path rule (§6) and the distinction must be explicit in
code: exporting a span must never gate an authorization.

#### 4.6.1 The three pillars
- **Metrics (RED + USE):** per-endpoint Rate/Errors/Duration; resource Utilization/Saturation
  (DB pool, Redis, worker queues). **Auth-decision latency histogram** with buckets aligned to the
  §4.5 budget (…50/80/150/300/500 ms…) so p99 is a direct SLI. Exemplars link a slow bucket to a trace.
- **Structured logs:** JSON, one correlation/trace id per request, CHD denylist filter applied at
  the sink (defense in depth, not just at call sites). Log **decisions and reason codes**, never CHD.
- **Distributed tracing (OpenTelemetry):** trace id propagated from the network gateway through
  auth → domain → repo → KMS/Redis calls. Span attributes run through the same denylist. Sampling:
  head-based low rate for management traffic, **tail-based keep-all for errors and slow auths**.

#### 4.6.2 SLIs, SLOs & error budgets
- Each §4.5 latency/availability target is registered as an **SLI**. The auth path SLO
  (99.95% availability, p99 ≤ 300 ms) drives a monthly **error budget**.
- **Multi-window, multi-burn-rate alerting** (fast burn → page; slow burn → ticket) rather than
  static threshold flapping. Budget policy: sustained fast burn freezes non-critical deploys.

#### 4.6.3 Domain / money-path monitoring (FinTech-specific)
These are the signals that turn an ops dashboard into a fraud/finance early-warning system:
| Signal | Why it matters | Alert (assumed target) |
|--------|----------------|------------------------|
| Approval / decline rate by reason code | A decline spike = outage, misconfig, or fraud | Page if decline rate deviates > Nσ / crosses baseline band |
| **Reconciliation drift** (§9.3) | Counter ≠ txn sum ≠ limit-consumed means money math is wrong | **P1 page on any non-zero drift** |
| `VELOCITY_EXCEEDED` trip rate | Fraud pattern / limit misconfig | Ticket on sustained rise; feed Fraud |
| Reveal rate per card / per user | Reveal abuse is an account-takeover signal | Alert on anomaly; already rate-limited (§4.5) |
| `STATE_UNAVAILABLE` / fail-closed decline rate | Dependency (KMS/Redis/DB) degradation surfacing as declines | Page — customer-visible |
| KMS / Redis / DB error & latency | Root dependencies of the money path | Page on error-rate or latency SLO burn |
| DB replication lag | Guards the RPO ≤ 5 min target (§4.4) | Page before RPO breach |
| Audit-write failure count | Audit is fail-closed; any failure is compliance-relevant | Page immediately |
| Idempotency-conflict (`409`) rate | Client bug or replay/abuse | Ticket on spike |
| Freeze-propagation lag | Enforces the ≤ 1 s §6 contract | Alert if p99 > 1 s |

#### 4.6.4 Health, readiness & dashboards
- **Liveness** (process up) and **readiness** (dependencies reachable) probes. Readiness reflects
  fail-closed posture: if KMS/DB are unreachable the auth instance reports **not-ready** so it stops
  taking traffic rather than mass-declining.
- Dashboards: an **Auth SLO** board (RED + budget burn), a **Money-integrity** board (reconciliation,
  decline mix, velocity), and a **Dependencies** board (KMS/Redis/DB). Every alert links a runbook.
- **Monitoring access is itself access-controlled and audited** — dashboards/logs are a read surface
  over sensitive operations even though they contain no CHD.

---

## 5. Implementation Notes (guardrails the agent must not violate)

- **Language/stack:** Rust (stable), **Axum** HTTP, **sqlx** (compile-time-checked queries,
  Postgres), **Apalis** for background jobs, **Redis** for idempotency keys, rate limits, velocity
  counters, and short-lived reveal grants.
- **Money is integer minor units.** Store amounts as `BIGINT` (minor units) + `currency_code
  CHAR(3)` (ISO 4217). Aggregate in `i128` to avoid overflow. **`f32`/`f64` are forbidden for any
  monetary value, anywhere.** `rust_decimal` is permitted only at display/FX boundaries — none
  exist in scope, so effectively integer-only here.
- **IDs:** all external identifiers are **UUIDv7** (time-sortable), rendered as strings. The
  network auth id is stored verbatim as the idempotency key for MO-6.
- **Idempotency:** `Idempotency-Key` (client-supplied UUID) on all unsafe, non-idempotent POSTs.
  Persist `(key, request_hash, response, status)`; same key + same body ⇒ replay stored response;
  same key + different body ⇒ `409 Conflict`. Back it with Redis for the fast path **and** a
  Postgres table for durability.
- **Concurrency:**
  - Card **state** mutations use optimistic locking (`version` column, `UPDATE … WHERE version=$`).
  - **Limit/velocity counters** at auth time use `SELECT … FOR UPDATE` on the card row (or a
    per-card advisory lock) to serialize concurrent auths for the same card — no double-spend past
    a limit under concurrency.
- **State machine:** transitions are a single source-of-truth table/enum; no ad-hoc status writes.
  `CLOSED` is terminal. Re-issuing requires a new card.
- **Error semantics:** typed domain errors → **RFC 9457 `application/problem+json`**. No internal
  detail, stack, SQL, or CHD in error bodies. Declines carry a machine reason code
  (`CARD_FROZEN`, `LIMIT_EXCEEDED_PER_TXN`, `LIMIT_EXCEEDED_DAILY`, `VELOCITY_EXCEEDED`,
  `CARD_NOT_ACTIVE`, `CURRENCY_MISMATCH`, …).
- **Time:** everything UTC in storage. Limit **windows** (daily/monthly) are evaluated against a
  fixed program timezone (**(assumed target)** UTC) — the boundary rule is explicit, not implicit.
- **PAN handling rule (non-negotiable):** the plaintext PAN exists in memory only inside the
  issuance and reveal code paths, is zeroized after use (`zeroize`), and is never placed in a
  struct that derives `Debug`/`Serialize`, never logged, never returned except per MO-1/MO-2.
- **Writes prefer idempotency; reads prefer keyset pagination** (no `OFFSET` on large sets).
- **Audit is not optional and not async:** it commits with the change (MO-8). A change that cannot
  be audited must fail closed.
- **No hard deletes — the financial system of record is append-only.** This is a hard rule:
  - **Never `DELETE` or in-place `UPDATE`** a settled/posted **transaction**, an **audit** record,
    or any **ledger/money** row. Corrections are made by appending a **reversing / compensating
    entry** that references the original — the original is preserved forever.
  - **Card "deletion" is a state transition to `CLOSED`** (soft, terminal), never a row delete.
  - **PII/PAN erasure (right-to-be-forgotten) = crypto-shred**: destroy the record's DEK so the
    ciphertext is unrecoverable, and tombstone the vault row. The card's audit and transaction
    history **remain** (financial-record retention law overrides erasure, §4.2).
  - **Only ephemeral operational state may expire**, and only by **TTL/GC**, never by business
    logic: idempotency keys past their 24 h window, expired reveal grants, velocity **cache**
    entries (the durable mirror stays), and sampled telemetry. This is *retention*, not deletion of
    a record, and it must never touch a transaction, audit, or ledger row.
  - **Enforced at the DB layer:** application roles have **no `DELETE` privilege** on `transactions`,
    `audit_log`, or ledger tables; `audit_log` also denies `UPDATE`. Mutation attempts fail as a
    permission error, not silently.

---

## 6. Freeze / State Propagation Contract

- Card status is authoritative in Postgres. The auth path reads status transactionally.
- If a Redis status cache is used for the auth hot path, a state change **must** invalidate it
  within **≤ 1 s (assumed target)**; on cache miss the auth path falls back to Postgres (fail
  toward the authoritative store, never toward "approve").
- **Fail-closed default:** if card state cannot be determined within the auth budget, **decline**
  with `STATE_UNAVAILABLE`. Approving on uncertainty is a compliance/fraud incident.

---

## 7. Context

### 7.1 Beginning context (exists before work starts — hypothetical but specific)
- Empty Rust workspace `virtual-card-service/` with `Cargo.toml` (Axum, sqlx, Apalis, Redis,
  tokio, uuid, serde, thiserror, zeroize, tracing).
- Provisioned but empty **PostgreSQL 16** database; migration runner (`sqlx migrate`) available.
- **Redis 7** reachable.
- **KMS/HSM** available exposing `generate_data_key`, `encrypt`, `decrypt` (KEK id configured).
- A parsed **auth request contract** from the network gateway (JSON: `network_auth_id`, `token`,
  `amount_minor`, `currency`, `merchant`, `mcc`, `timestamp`). The transport itself is out of scope.
- No cards, no limits, no transactions, no audit records yet.

### 7.2 Ending context (exists after work is done)
- **Migrations** for: `cards`, `card_pan_vault`, `card_limits`, `card_velocity` (or Redis-backed
  + reconciled), `transactions`, `audit_log`, `idempotency_keys`, `reveal_grants`.
- **Modules:**
  - `domain/` — card state machine, limit model, decisioning, money type (newtype over minor units).
  - `crypto/` — envelope encryption, HMAC pan-hash, zeroizing PAN type, KMS client wrapper.
  - `api/` — Axum routers: card CRUD, freeze/unfreeze, limits, reveal, transactions, auth endpoint.
  - `repo/` — sqlx repositories, all queries compile-time checked.
  - `jobs/` — Apalis workers: transaction materialization, velocity-window rollover, reveal-grant
    expiry, idempotency-key GC, daily reconciliation.
  - `security/` — RBAC middleware, rate limiting, request-context/correlation-id, audit writer.
- **Fixtures** and documented test categories (§ Verification).
- Structured logging + metrics + tracing wired (`telemetry/`: logging, metrics, tracing) — auth
  decision latency histogram, decline-reason counter, reconciliation-drift gauge, freeze-lag
  histogram — plus `api/health.rs` probes and `ops/` (alerts-as-code, runbooks, dashboards).

---

## 8. Edge Cases & Failure Modes

Scoped to this feature. Each row states the **expected behavior** (user-visible + audit/compliance
implication). This table is itself a requirement, not documentation.

| # | Situation | Expected behavior | Audit/compliance implication |
|---|-----------|-------------------|------------------------------|
| E1 | Create-card retried with same `Idempotency-Key`, same body | Return original card, no new card, no new PAN | One issuance event; retry noted, not re-audited as new issuance |
| E2 | Create-card same key, **different** body | `409 Conflict`, no mutation | Audited as idempotency conflict |
| E3 | Reveal called a second time on a used grant | `410 Gone` / `403`; no PAN returned | Second attempt audited as denied reveal (possible fraud signal) |
| E4 | Reveal grant expired mid-request | Decline reveal, require new grant | Audited; no plaintext produced |
| E5 | Freeze then immediate auth for same card | Auth **declines** `CARD_FROZEN` | Freeze + decline both audited; demonstrates §6 consistency |
| E6 | Two concurrent auths, each within limit but together exceeding it | Exactly one approved up to remaining headroom; the other declined `LIMIT_EXCEEDED_*` | Serialized via row lock; no over-limit spend (MO-6) |
| E7 | Duplicate auth request (same `network_auth_id`) | Return the **same** prior decision, no double count | Idempotent decisioning; counters not double-incremented |
| E8 | Auth in a currency ≠ card currency | Decline `CURRENCY_MISMATCH` | No FX in scope; audited |
| E9 | Set limit below already-spent amount in the current window | Accept the new limit; further spend blocked until window/rollover; **do not** retroactively reverse settled spend | Audited limit change with old→new values |
| E10 | Set negative / zero / non-integer / overflowing limit | `422` typed validation error, no change | Audited as rejected change |
| E11 | Limit change and an auth race for the same card | Serialized; auth sees either fully-old or fully-new limits, never a torn read | Row lock / version guard |
| E12 | Auth arrives for a `CLOSED` card | Decline `CARD_NOT_ACTIVE` | Audited |
| E13 | Auth arrives for a `PENDING` card (never activated) | Decline `CARD_NOT_ACTIVE` | Audited |
| E14 | KMS/HSM unavailable during create | Fail create `503`, no half-written vault row (transactional) | No card without protected PAN; audited failure |
| E15 | KMS unavailable during reveal | Reveal fails `503`; grant **not** consumed | User can retry; audited |
| E16 | Redis (velocity cache) down at auth time | Fall back to Postgres counters; if neither available, **fail-closed decline** `STATE_UNAVAILABLE` | Never approve on unknown velocity |
| E17 | Ops user attempts to read full PAN | Structurally impossible (no code path/role); request rejected `403` | Attempt audited as a security event |
| E18 | Support user attempts to change a limit/state | `403`, no change | Audited authz denial |
| E19 | Cardholder A requests card owned by B | `404` (not `403`, to avoid enumeration) | Audited access-boundary denial |
| E20 | Transaction list requested with a tampered/expired keyset cursor | `400 Bad Request`, no data leak | — |
| E21 | Partial failure: auth approved but transaction record insert fails | Whole decision rolls back; network sees a decline/timeout, counters not moved | Consistency > availability on the money path; audited |
| E22 | Stale read: user sees old limit right after a change | Acceptable for the **read model** within a bounded lag; the **auth path** must use fresh data | Read-after-write required only where money is decided |
| E23 | Clock skew across daily/monthly window boundary | Window boundary computed from a single authoritative clock/timezone rule (§5) | Deterministic, testable |
| E24 | Fraud-ish velocity spike (many small auths) | Velocity window trips `VELOCITY_EXCEEDED`; optional auto-freeze hook | Signals surfaced to Fraud; auto-freeze audited |
| E25 | Metrics/trace backend down at auth time | Auth proceeds normally; telemetry dropped, **never blocks the decision** | Telemetry fails open; money path unaffected (§4.6c) |
| E26 | A dev logs a struct containing a PAN by mistake | Sink-level denylist filter redacts it; a test fails the build if it reaches a sink | Defense-in-depth; CHD-in-logs is a reportable incident |
| E27 | Reconciliation job finds counter ≠ transaction sum for a card | P1 page; release pipeline blocked; card flagged for review | Money-integrity signal; audited investigation |
| E28 | Someone adds `card_id` as a metric label | Rejected in review; cardinality guard/lint catches it | Prevents metric-store blowup and per-user leakage via labels |
| E29 | KMS/DB unreachable on an auth instance | Readiness probe reports **not-ready**; instance drained instead of mass-declining | Fail-closed at the fleet level; alerted |
| E30 | Any code path attempts to `DELETE`/`UPDATE` a settled transaction or audit row | Fails as a DB permission error (roles lack the grant); no data lost | Append-only system of record proven at the DB layer |
| E31 | A cardholder disputes / a merchant refunds a prior spend | A **new reversing transaction** is appended referencing the original; the original is untouched | Full history preserved; counters adjusted forward, not by rewriting the past |
| E32 | Erasure (right-to-be-forgotten) request for a closed card | PAN crypto-shredded (DEK destroyed), vault row tombstoned; audit + transaction history retained | Privacy honored where possible; financial retention law overrides for records (§4.2) |

---

## 9. Verification

How we *know* each mid-level objective is met. Test categories are documentation of intent; each
maps to objectives and edge cases.

### 9.1 Objective → verification map
| Objective | How verified |
|-----------|--------------|
| MO-1 Issuance | Integration test: create → response has token/bin/last4, **no PAN**; vault row is ciphertext; `pan_hash` present. Assert response schema forbids a PAN-shaped field. |
| MO-2 Reveal | e2e: grant → reveal once returns PAN → second reveal `410`; log scraper asserts PAN never in logs (E3, E4). |
| MO-3 State machine | Unit: property test over all (state, event) pairs; only legal transitions succeed, illegal are no-ops (E12, E13). |
| MO-4 Freeze authoritative | Integration: freeze then auth ⇒ decline `CARD_FROZEN`; measure propagation ≤ budget (E5, §6). |
| MO-5 Limits | Unit + integration: valid limits persist; invalid rejected `422` (E10); below-spent accepted without reversal (E9). |
| MO-6 Decisioning | Integration + **concurrency** test: parallel auths cannot exceed a limit (E6); duplicate `network_auth_id` returns same decision (E7); currency mismatch declines (E8). |
| MO-7 Read model | Integration: keyset pagination stable under inserts; counters reconcile with transaction sums (reconciliation check). |
| MO-8 Audit | Integration: every mutating call produces exactly one audit row **in the same tx**; forced audit-write failure rolls back the mutation (fail-closed). |
| MO-9 RBAC | Integration matrix: each (role × endpoint) yields expected allow/deny; ops PAN read impossible (E17); cross-user `404` (E19). |
| MO-10 Idempotency | Integration: same key+body replays; key+different body `409` (E1, E2). |
| MO-11 Observability | Unit: denylist filter redacts PAN/CVV/DEK from logs, metric labels, and span attributes even when passed in (E26); cardinality guard rejects `card_id` as a label (E28). Integration: auth-decision histogram + decline-reason counter emitted; telemetry-backend-down does not affect the decision (E25); readiness flips to not-ready on KMS/DB loss (E29). Reconciliation drift raises a P1 and blocks release (E27). |

### 9.2 Test categories (as documentation)
- **Unit:** money newtype (no float, overflow-safe), state machine, limit math, reason-code mapping,
  pan-hash determinism, zeroize-on-drop.
- **Integration (Postgres+Redis via testcontainers):** each endpoint incl. idempotency, RBAC,
  audit-in-same-tx, KMS-down and Redis-down fault injection (E14–E16).
- **Concurrency:** N parallel auths against a shared limit; assert invariant *sum(approved) ≤ limit*.
- **e2e:** issuance → reveal → spend → freeze → declined spend → view transactions.
- **Compliance review checklist (manual):** no CHD in logs; CVV never stored; reveal audited;
  KEK rotation runbook exists; DB read-role cannot select ciphertext.

### 9.3 Fixtures & reconciliation
- Deterministic test PANs from a reserved test BIN; fixed KEK in test KMS mock.
- **Reconciliation check (also a scheduled job):** for each card, `sum(approved transactions in
  window) == velocity counter == limit-consumed`. Any drift is a P1 alert and blocks release.

### 9.4 Review checkpoints
1. Schema + crypto review before any endpoint work (PAN never reachable by read-model role).
2. Decisioning review focused on concurrency invariant (E6) and idempotency (E7).
3. Pre-release compliance checklist (§9.2) signed by Compliance.

---

## 10. Low-Level Tasks

Each task cites the objective(s) it serves and ends with **DoD/acceptance criteria**. Ordered so
dependencies come first.

### T1 — Money & currency newtype (MO-5, MO-6)
- **CREATE** `domain/money.rs` — `Money(i64 minor, Currency)` newtype; `i128` accumulator;
  checked add/sub; no `f*`; `Display` shows major.minor + code; `Serialize` as `{amount_minor, currency}`.
- **DoD:** property tests prove no overflow on realistic aggregates; attempting to build `Money`
  from a float does not compile; round-trip serde stable.

### T2 — Card state machine (MO-3)
- **CREATE** `domain/state.rs` — `CardStatus { Pending, Active, Frozen, Closed }`, `CardEvent`,
  `fn transition(status, event) -> Result<CardStatus, TransitionError>`. `Closed` terminal.
- **DoD:** exhaustive property test over all pairs; illegal transitions return typed error and
  produce no state; matches §8 E12/E13.

### T3 — Crypto: envelope encryption + zeroizing PAN (MO-1, MO-2, §4.1)
- **CREATE** `crypto/vault.rs`, `crypto/pan.rs` — `Pan` type: `zeroize`, no `Debug`/`Serialize`;
  `encrypt_pan` (generate DEK via KMS, AES-GCM, wrap DEK, return ciphertext+iv+wrapped_dek+dek_id);
  `decrypt_pan`; keyed `pan_hash` (HMAC-SHA-256).
- **DoD:** unit test: ciphertext ≠ plaintext, decrypt round-trips, `pan_hash` deterministic &
  stable, `Pan` cannot be logged or serialized (compile-time), memory zeroized on drop.

### T4 — Migrations & append-only role grants (MO-1, MO-7, MO-8, MO-10, §5)
- **CREATE** `migrations/*.sql` — `cards` (id uuidv7, owner_id, status, currency, bin, last4,
  pan_token, pan_hash, version, timestamps), `card_pan_vault` (card_id, ciphertext BYTEA, iv,
  wrapped_dek, dek_id), `card_limits`, `transactions`, `audit_log` (append-only), `idempotency_keys`,
  `reveal_grants`. Split DB roles: read-model role has **no** select on `card_pan_vault.ciphertext`.
  **Revoke `DELETE`** from all application roles on `transactions`, `audit_log`, and ledger tables;
  **revoke `UPDATE`** on `audit_log` (append-only). Only TTL/GC-eligible operational tables
  (`idempotency_keys`, `reveal_grants`) permit deletes, and only to the GC job role.
- **DoD:** migrations apply/rollback clean; a `SELECT ciphertext` as read-role is denied in a test;
  a `DELETE`/`UPDATE` on `transactions`/`audit_log` as the app role is denied in a test (E30);
  all money columns are `BIGINT` minor units.

### T5 — Idempotency middleware (MO-10, E1, E2)
- **CREATE** `security/idempotency.rs` — extract `Idempotency-Key`; Redis fast path + `idempotency_keys`
  durable store; replay on same key+body; `409` on key+different body.
- **DoD:** integration tests for replay and conflict; retention GC job scheduled (T15).

### T6 — RBAC & request context (MO-9, E17–E19)
- **CREATE** `security/rbac.rs`, `security/context.rs` — role extraction, ownership guard
  (cross-user ⇒ `404`), correlation id, actor identity for audit.
- **DoD:** authz matrix test (role × endpoint) passes; ops has no PAN-read route at all.

### T7 — Audit writer (MO-8)
- **CREATE** `security/audit.rs` — `write_audit(tx, event)` that runs **inside** the caller's
  transaction; append-only; hash-chain per card; denylist enforced on payload.
- **DoD:** forced failure rolls back the mutation; no audit row is ever updated/deleted; PAN/CVV
  cannot appear in an audit payload (type-level).

### T8 — Create card endpoint (MO-1, E14)
- **CREATE** `api/cards_create.rs` — POST `/cards`; validate; generate PAN; T3 encrypt; insert card
  + vault + audit in one tx; return `{id, token, bin, last4, status}`. Idempotent (T5).
- **DoD:** response contains no PAN; KMS-down ⇒ `503` with **no** half-written rows; audited.

### T9 — Reveal PAN flow (MO-2, E3, E4, E15)
- **CREATE** `api/reveal.rs` — POST `/cards/{id}/reveal-grant` (issues single-use short-TTL grant in
  Redis) + POST `/cards/{id}/reveal` (consumes grant, decrypts, returns PAN once).
- **DoD:** exactly one successful reveal per grant; expired/used ⇒ `410`; every reveal audited;
  KMS-down does not consume the grant; PAN absent from all logs.

### T10 — Freeze / unfreeze (MO-3, MO-4, E5, §6)
- **CREATE** `api/freeze.rs` — POST `/cards/{id}/freeze` + `/unfreeze`; state machine (T2); optimistic
  version; invalidate status cache within budget; audit.
- **DoD:** next auth after freeze declines `CARD_FROZEN`; propagation ≤ 1 s; illegal transition ⇒ typed error.

### T11 — Set limits (MO-5, E9, E10, E11)
- **CREATE** `api/limits.rs` — PUT `/cards/{id}/limits` (per-txn, daily, monthly, lifetime, minor
  units); validate integer/positive/non-overflow; serialize vs concurrent auth; audit old→new.
- **DoD:** invalid ⇒ `422`; below-spent accepted without reversal; race with auth serialized (E11).

### T12 — Velocity counters (MO-6, MO-7, E16)
- **CREATE** `domain/velocity.rs`, `repo/velocity.rs` — Redis rolling counters (daily/monthly/lifetime)
  as authoritative fast path, mirrored to Postgres for durability/reconciliation; window rule per §5.
- **DoD:** counters increment only on approve; Redis-down ⇒ Postgres fallback; neither ⇒ fail-closed;
  reconcilable with transactions (T14).

### T13 — Authorization decision endpoint (MO-6, E6, E7, E8, E12, E13, E16, E21)
- **CREATE** `api/authorize.rs`, `domain/decision.rs` — POST `/authorize`; `FOR UPDATE`/advisory lock
  on card; check status + currency + per-txn + velocity; approve/decline with reason code;
  idempotent on `network_auth_id`; write transaction + counter + audit in one tx.
- **DoD:** concurrency test proves *sum(approved) ≤ limit* (E6); duplicate `network_auth_id` returns
  identical prior decision (E7); currency mismatch/closed/pending decline; approve-then-insert-fail
  rolls back whole decision (E21); p99 ≤ 300 ms under target load.

### T14 — Transaction read model (MO-7, E20, E22)
- **CREATE** `api/transactions.rs`, `repo/transactions.rs` — GET `/cards/{id}/transactions` with
  keyset pagination (opaque signed cursor), stable ordering, page ≤ 100 default 50; filters.
- **DoD:** stable under concurrent inserts; tampered/expired cursor ⇒ `400`; counters reconcile with
  listed sums; no `OFFSET` scan.

### T15 — Apalis background workers (MO-7, MO-8, MO-10)
- **CREATE** `jobs/` — (a) transaction materialization/enrichment, (b) velocity-window rollover,
  (c) reveal-grant expiry cleanup, (d) idempotency-key GC (24 h), (e) daily reconciliation
  (raises P1 on drift, §9.3).
- **DoD:** each job idempotent and safe to retry; reconciliation job fails the pipeline on any
  card-level drift; no job logs CHD.

### T16 — Rate limiting (MO-9, §4.5)
- **CREATE** `security/ratelimit.rs` — Redis token bucket; management 20 rps/user, reveal 5/card/h,
  create 10/user/h; `429` + `Retry-After`.
- **DoD:** limits enforced per-actor; auth path exempt from user rate limits (machine actor);
  breaches audited when security-relevant.

### T17 — Logging & CHD denylist sink (MO-11, §4.3, §4.6)
- **CREATE** `telemetry/logging.rs` — structured JSON logs with correlation/trace id; **CHD denylist
  filter applied at the sink** (defense in depth), covering log fields, and reused by metric-label
  and span-attribute paths.
- **DoD:** a test asserts PAN/CVV/DEK/reveal-payload/`Idempotency-Key` never appear in emitted logs
  even when deliberately passed to a log call; correlation id present on every request log (E26).

### T18 — Error model (RFC 9457) (§5)
- **CREATE** `api/error.rs` — typed domain errors → `application/problem+json`; decline reason codes;
  never leak internals/CHD/SQL.
- **DoD:** golden tests for each error → problem+json shape; no error body contains CHD or stack.

### T19 — Metrics & SLIs (MO-11, §4.5, §4.6.1, §4.6.2)
- **CREATE** `telemetry/metrics.rs` — RED per endpoint + USE for DB pool/Redis/worker queues;
  **auth-decision latency histogram** with buckets aligned to §4.5; decline-reason counter; reveal
  counter; reconciliation-drift gauge; freeze-propagation-lag histogram. Enforce a **label allowlist**
  (reason/endpoint/status/currency) and reject high-cardinality labels.
- **DoD:** p99 auth latency computable directly from the histogram; adding `card_id` as a label fails
  a guard/lint (E28); each §4.5 target maps to a named SLI.

### T20 — Distributed tracing (MO-11, §4.6.1)
- **CREATE** `telemetry/tracing.rs` — OpenTelemetry; propagate trace id from the gateway through
  auth → domain → repo → KMS/Redis; span attributes run through the denylist (T17); tail-based
  sampling keeps all errors and slow auths; exemplars link slow histogram buckets to traces.
- **DoD:** a full auth produces a single connected trace; no span attribute contains CHD; exporter
  outage does **not** block or slow the decision (E25, fails open).

### T21 — Alerting & error budgets (MO-11, §4.6.2, §4.6.3)
- **CREATE** `ops/alerts/` (rules as code) + `ops/runbooks/` — multi-window multi-burn-rate SLO
  alerts (page/ticket); domain alerts from §4.6.3 (decline-rate anomaly, reconciliation-drift **P1**,
  fail-closed-decline rate, KMS/Redis/DB health, DB replication lag vs RPO, audit-write failure,
  idempotency-conflict spike, freeze-lag > 1 s). Every alert links a runbook.
- **DoD:** each §4.6.3 signal has an alert with severity + runbook; reconciliation drift pages P1 and
  blocks the release pipeline (E27); fast-burn on the auth SLO pages.

### T22 — Health & readiness probes (MO-11, §4.6.4, E29)
- **CREATE** `api/health.rs` — liveness (process) + readiness (KMS/DB/Redis reachability). Readiness
  reflects fail-closed posture: unreachable core dependency ⇒ **not-ready** so the instance drains
  instead of mass-declining.
- **DoD:** killing KMS/DB flips readiness to not-ready and the instance stops taking traffic (E29);
  liveness stays up so it isn't force-restarted mid-drain.

### T23 — Dashboards & monitoring access control (MO-11, MO-9, §4.6.4)
- **CREATE** `ops/dashboards/` — Auth-SLO board (RED + budget burn), Money-integrity board
  (reconciliation, decline mix, velocity), Dependencies board (KMS/Redis/DB). Access to
  dashboards/logs is RBAC-gated and each access audited.
- **DoD:** the three boards render the SLIs from T19; dashboard/log access requires an authorized
  role and is written to the audit trail; no panel exposes CHD.

---

## 11. Traceability summary

Every low-level task (T1–T18) cites ≥1 mid-level objective (MO-1…MO-10); every mid-level objective
has ≥1 verification entry (§9.1) and ≥1 edge case (§8); every non-functional target (§4) is either a
verification checkpoint (§9) or a task DoD. If a change adds a task with no MO, or an MO with no
verification, the spec is incomplete — that is the review gate.