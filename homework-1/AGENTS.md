# AGENTS.md — homework-1 (NestJS)

Project-specific conventions for AI agents working in this directory. These rules **override** the agent's default "write no comments" stance for this codebase.

## Service code documentation

This project is pedagogical: readers should be able to scan a service method and understand both *what it does* and *how it proceeds* without first parsing the implementation. Comments are therefore mandatory in service classes.

### 1. JSDoc on every service method

Every method of a `@Injectable()` service class — public **and** private — gets a TSDoc/JSDoc block immediately above its signature.

The block must document:

- **One-line summary** of what the method does (imperative mood: "Persist…", "Compute…", "Validate…").
- `@param` for each parameter (name + meaning, not just the type).
- `@returns` describing the shape and meaning of the return value.
- `@throws` for every exception type the method can raise (e.g. `NotFoundException`, `BadRequestException`).

Skip `@param`/`@returns` only when the method takes no parameters / returns `void`.

```typescript
/**
 * Look up a transaction by its generated id.
 *
 * @param id - UUID assigned at creation time.
 * @returns The matching transaction.
 * @throws NotFoundException if no transaction with this id exists.
 */
findById(id: string): Transaction {
  // ...
}
```

### 2. Step comments for major phases only

When a service method has more than one **major** logical phase (validate → transform → persist, fetch → replay → normalise, etc.), introduce each phase with a single-line `// <imperative phrase>` comment.

```typescript
create(dto: CreateTransactionDto): Transaction {
  // Validate account fields against the transaction type
  const { fromAccount, toAccount } = this.resolveAccounts(dto);

  // Build the record with a generated id and timestamp
  const transaction: Transaction = {
    id: randomUUID(),
    fromAccount,
    toAccount,
    amount: dto.amount,
    // ...
  };

  // Persist and return
  return this.repo.save(transaction);
}
```

Rules:

- **Phases, not lines.** Comment a *block* of related statements; never label individual statements (`// read x`, `// write y`).
- **Cap at ~3 step comments per method.** If you're tempted to write a 4th, the method is probably doing too much — extract a helper instead.
- Skip step comments entirely for one-/two-statement methods — JSDoc alone is enough.
- Use **imperative mood** describing the *intent* of the phase, not a transcription of the code (`// Build the record…`, not `// Create an object literal`).
- No `// Do action N:` prefix, no numbering — the order on the page already conveys the sequence.

### 3. Where this applies

- **Required:** every method in `*.service.ts` files.
- **Not required** (but allowed when WHY is non-obvious): controllers, repositories, DTOs, entities, modules, tests.

### 4. What still does *not* get a comment

These project rules do not override the agent's other defaults:

- No restating obvious WHAT (`// increment counter` above `counter++`).
- No author tags, change history, or "added for ticket #123" notes — that belongs in git.
- No commented-out code.

## Service return types

Service methods must **never** return an inline (anonymous) object type. Every non-primitive, non-`void` return — including from private helpers — has a named `interface` or `type` declaration.

This applies to return positions specifically. Inline object literals as *parameter* types, local variables, or destructured shapes are fine.

**Incorrect (inline shape on the return signature):**

```typescript
private resolveAccounts(dto: CreateTransactionDto): {
  fromAccount: string | null;
  toAccount: string | null;
} {
  // ...
}
```

**Correct (named interface):**

```typescript
interface ResolvedAccounts {
  fromAccount: string | null;
  toAccount: string | null;
}

private resolveAccounts(dto: CreateTransactionDto): ResolvedAccounts {
  // ...
}
```

Placement of the named type:

- If only the service uses it → declare in the service file (un-exported `interface`/`type` at the top).
- If a controller, another service, or tests also consume it → put it in the module's shared types file (e.g. `transaction.types.ts`) and export it.
- Domain entities live in `*.types.ts` or a dedicated `entities/` directory, never inlined.

Tuples and unions of primitives (`[number, number]`, `string | null`) are still allowed where they fit naturally — the rule targets anonymous *object* shapes, which are the ones that hurt readability and refactorability.

## Source of truth for everything else

For architecture, DI, validation, error handling, testing, etc., follow the [nestjs-best-practices skill](../.agents/skills/nestjs-best-practices/SKILL.md) as described in [CLAUDE.md](../CLAUDE.md).
