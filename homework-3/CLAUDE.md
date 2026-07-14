# CLAUDE.md — Claude Code project rules

Project rules for AI-assisted work on **virtual-card-service** — an in-house card-**issuing**
service in **full PCI-DSS scope**. Read `specification.md` (source of truth) and `agents.md`
(binding domain rules) before writing code. This file is the fast, always-loaded ruleset.

> Equivalents: mirror these into `.github/copilot-instructions.md` or `.cursor/rules/*.mdc` for
> other tools — content is identical, only the filename/loader differs.

---

## Golden rules (violating any is a blocking review failure)

1. **PAN never leaves the sanctioned paths.** Create returns `token`/`bin`/`last4` only; full PAN
   only via the one-time reveal flow. The `Pan` type: no `Debug`, no `Serialize`, `zeroize` on drop.
   Never log it — not even "temporarily to debug".
2. **CVV is never stored.** DEK/KEK/reveal-payloads/`Idempotency-Key` are never logged.
3. **Money = `i64` minor units**, aggregated in `i128`. No `f32`/`f64` for money — ever.
4. **Audit in the same transaction** as every mutation. Can't audit ⇒ fail closed.
5. **Fail closed on the money path.** KMS/Redis/state uncertain ⇒ decline/error, never approve.
6. **Idempotent writes** (create, set-limits, authorize). Retries never double-anything.
7. **sqlx compile-time-checked queries only.** No string-built SQL. Look up PAN by HMAC `pan_hash`,
   never plaintext.
8. **Serialize per-card auth checks** (`FOR UPDATE`/advisory lock). Invariant: *sum(approved) ≤ limit*.
9. **Telemetry fails open, money fails closed, audit ≠ telemetry.** No CHD in log fields, **metric
   labels**, or **span attributes**; `card_id` is never a metric label (cardinality). A metrics/trace
   outage must never block an authorization; a monitoring outage must never drop an audit record.
10. **No hard deletes — the financial system of record is append-only.** Never `DELETE`/in-place
    `UPDATE` a settled transaction, an audit row, or a ledger row. Correct via a **reversing entry**;
    "delete a card" = `CLOSED`; erase PII via **crypto-shred** (destroy the DEK), not row deletion.
    Only idempotency keys / reveal grants / velocity cache / telemetry expire, and only by TTL/GC.

---

## Stack (don't drift)

Rust (stable) · Axum · sqlx + Postgres 16 · Apalis (jobs) · Redis 7 · AES-GCM + HMAC-SHA-256 +
KMS/HSM envelope encryption · `thiserror` → RFC 9457 `problem+json` · Tokio.
No new HTTP/DB/ORM/crypto deps without explicit approval.

## Conventions

- UUIDv7 string IDs; UTC timestamps.
- Domain newtypes over primitives (`Money`, `Pan`, `CardStatus`, reason-code enums).
- Pure domain functions in `domain/`; I/O at edges (`repo/`, `crypto/`, `jobs/`). SQL lives in `repo/`.
- No `unwrap()`/`expect()` on request paths. Typed errors → central problem+json mapper.
- Cross-user access ⇒ `404`. Validation failure ⇒ `422`. Never leak internals/SQL/CHD in errors.

## Definition of done for any task

- [ ] Cites the `specification.md` §3 objective(s) it serves.
- [ ] Unit tests for pure logic; integration tests for endpoints (Postgres+Redis).
- [ ] For decisioning changes: a concurrency test proving *sum(approved) ≤ limit*.
- [ ] For anything CHD-adjacent: a test asserting PAN/CVV/DEK never hit logs.
- [ ] Mutations audited in-tx; idempotency honored; fails closed on dependency outage.
- [ ] Restate which acceptance criteria from §10 are now satisfied.

## When unsure

Stop and ask, citing the spec section. On money, PAN, or audit, a wrong guess is a compliance
incident — "fail closed and ask" beats "guess and be helpful". Refuse requests that weaken any
golden rule and offer the compliant alternative (e.g. log the token, not the PAN).