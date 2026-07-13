# Ticket API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `apps/api` (NestJS) — ticket CRUD, CSV/JSON/XML import, keyword-based auto-classification, JWT auth with a single test user, and >85% test coverage — matching the REST contract already consumed by the static prototype in `apps/web/public/ticket-system/`.

**Architecture:** NestJS modules (`auth`, `tickets` with `import/` and `classification/` sub-folders, `common` for cross-cutting pipe/interceptor/filter), backed by an in-memory `Map` repository. Validation and shared types live in `packages/contracts` as Zod schemas. Every `/tickets*` and `/auth/login` response is wrapped `{ data: ... }` / `{ error: { message } }`; `/health` is untouched.

**Tech Stack:** NestJS 11, Zod, `@nestjs/jwt`, `bcryptjs`, `csv-parse`, `fast-xml-parser`, `multer`, Jest + Supertest (already scaffolded).

## Global Constraints

- Endpoint contract: `GET/POST /tickets`, `GET/PATCH/DELETE /tickets/:id`, `PUT /tickets/:id` (alias of PATCH), `POST /tickets/:id/classify` (+ alias `/auto-classify`), `POST /tickets/import`, `POST /auth/login`. Source: `docs/superpowers/specs/2026-07-12-ticket-api-design.md`.
- Every success response (except `/health` and 204s) is wrapped `{ "data": ... }`; every error is `{ "error": { "message": "…" } }`.
- Test user: `admin@ignore.com` / `123`, hashed with bcrypt, held in `AuthService` (not a ticket).
- In-memory storage only, empty at boot (no seed tickets).
- Ticket public shape must match `apps/web/public/ticket-system/README.md`'s schema plus `number` (int, auto-increment). Internal-only field `classification_confidence` must never appear in API responses.
- `GET /health` keeps returning bare `{ "status": "ok" }` — do not wrap it, do not add auth to it.
- Classification keyword rules come from `TASKS.md`'s Task 2 section (not from the mock's rules, which differ).
- Import row numbering: CSV rows are 1-based including the header row (first data row → `row: 2`); JSON/XML rows are 1-based by element index (first ticket → `row: 1`).
- Coverage target: `pnpm --filter api test:cov` overall >85%.

---

### Task 1: Add dependencies

**Files:**
- Modify: `homework-2/apps/api/package.json`

**Interfaces:**
- Produces: `@nestjs/jwt`, `bcryptjs`, `csv-parse`, `fast-xml-parser`, `multer` as runtime deps; `@types/bcryptjs`, `@types/multer` as dev deps — all later tasks assume these are installed.

- [ ] **Step 1: Install runtime dependencies**

Run from `homework-2/`:
```bash
pnpm add @nestjs/jwt bcryptjs csv-parse fast-xml-parser multer --filter api
```
Expected: `apps/api/package.json` `dependencies` gains these five packages; `pnpm-lock.yaml` updates.

- [ ] **Step 2: Install dev dependencies**

```bash
pnpm add -D @types/bcryptjs @types/multer --filter api
```
Expected: `apps/api/package.json` `devDependencies` gains these two packages.

- [ ] **Step 3: Verify install**

```bash
pnpm --filter api build
```
Expected: builds successfully (nothing imports the new packages yet, so this just proves the install didn't break anything).

- [ ] **Step 4: Commit**

```bash
git add homework-2/apps/api/package.json homework-2/pnpm-lock.yaml
git commit -m "chore(hw2-api): add jwt/bcrypt/csv/xml/multer dependencies"
```

---

### Task 2: Contracts package — Zod schemas

**Files:**
- Create: `homework-2/packages/contracts/src/enums.ts`
- Create: `homework-2/packages/contracts/src/ticket.ts`
- Create: `homework-2/packages/contracts/src/classification.ts`
- Create: `homework-2/packages/contracts/src/import.ts`
- Create: `homework-2/packages/contracts/src/auth.ts`
- Modify: `homework-2/packages/contracts/src/index.ts`

**Interfaces:**
- Produces (all re-exported from `@repo/contracts`): `TicketCategorySchema`/`TicketCategory`, `TicketPrioritySchema`/`TicketPriority`, `TicketStatusSchema`/`TicketStatus`, `TicketSourceSchema`/`TicketSource`, `DeviceTypeSchema`/`DeviceType`, `TicketMetadataSchema`/`TicketMetadata`, `TicketSchema`/`Ticket`, `CreateTicketInputSchema`/`CreateTicketInput`, `UpdateTicketInputSchema`/`UpdateTicketInput`, `ClassificationResultSchema`/`ClassificationResult`, `ImportErrorSchema`/`ImportError`, `ImportSummarySchema`/`ImportSummary`, `LoginInputSchema`/`LoginInput`, `LoginResponseSchema`/`LoginResponse`. `CONTRACTS_VERSION` must stay exported (consumed by `apps/web/app/page.tsx`).

- [ ] **Step 1: Write `enums.ts`**

```typescript
// homework-2/packages/contracts/src/enums.ts
import { z } from 'zod';

export const TicketCategorySchema = z.enum([
  'account_access',
  'technical_issue',
  'billing_question',
  'feature_request',
  'bug_report',
  'other',
]);
export type TicketCategory = z.infer<typeof TicketCategorySchema>;

export const TicketPrioritySchema = z.enum(['urgent', 'high', 'medium', 'low']);
export type TicketPriority = z.infer<typeof TicketPrioritySchema>;

export const TicketStatusSchema = z.enum([
  'new',
  'in_progress',
  'waiting_customer',
  'resolved',
  'closed',
]);
export type TicketStatus = z.infer<typeof TicketStatusSchema>;

export const TicketSourceSchema = z.enum(['web_form', 'email', 'api', 'chat', 'phone']);
export type TicketSource = z.infer<typeof TicketSourceSchema>;

export const DeviceTypeSchema = z.enum(['desktop', 'mobile', 'tablet']);
export type DeviceType = z.infer<typeof DeviceTypeSchema>;
```

- [ ] **Step 2: Write `ticket.ts`**

```typescript
// homework-2/packages/contracts/src/ticket.ts
import { z } from 'zod';
import {
  TicketCategorySchema,
  TicketPrioritySchema,
  TicketStatusSchema,
  TicketSourceSchema,
  DeviceTypeSchema,
} from './enums';

export const TicketMetadataSchema = z.object({
  source: TicketSourceSchema,
  browser: z.string(),
  device_type: DeviceTypeSchema,
});
export type TicketMetadata = z.infer<typeof TicketMetadataSchema>;

export const TicketSchema = z.object({
  id: z.string(),
  number: z.number().int(),
  customer_id: z.string(),
  customer_email: z.string().email(),
  customer_name: z.string(),
  subject: z.string().min(1).max(200),
  description: z.string().min(10).max(2000),
  category: TicketCategorySchema,
  priority: TicketPrioritySchema,
  status: TicketStatusSchema,
  created_at: z.string(),
  updated_at: z.string(),
  resolved_at: z.string().nullable(),
  assigned_to: z.string().nullable(),
  tags: z.array(z.string()),
  metadata: TicketMetadataSchema,
});
export type Ticket = z.infer<typeof TicketSchema>;

export const CreateTicketInputSchema = z.object({
  customer_email: z.string().email(),
  customer_name: z.string().min(1),
  subject: z.string().min(1).max(200),
  description: z.string().min(10).max(2000),
  category: TicketCategorySchema.optional(),
  priority: TicketPrioritySchema.optional(),
  status: TicketStatusSchema.optional(),
  resolved_at: z.string().nullable().optional(),
  assigned_to: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z
    .object({
      source: TicketSourceSchema.optional(),
      browser: z.string().optional(),
      device_type: DeviceTypeSchema.optional(),
    })
    .optional(),
  auto_classify: z.boolean().optional(),
});
export type CreateTicketInput = z.infer<typeof CreateTicketInputSchema>;

export const UpdateTicketInputSchema = CreateTicketInputSchema.partial();
export type UpdateTicketInput = z.infer<typeof UpdateTicketInputSchema>;
```

- [ ] **Step 3: Write `classification.ts`**

```typescript
// homework-2/packages/contracts/src/classification.ts
import { z } from 'zod';
import { TicketCategorySchema, TicketPrioritySchema } from './enums';

export const ClassificationResultSchema = z.object({
  category: TicketCategorySchema,
  priority: TicketPrioritySchema,
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  keywords: z.array(z.string()),
});
export type ClassificationResult = z.infer<typeof ClassificationResultSchema>;
```

- [ ] **Step 4: Write `import.ts`**

```typescript
// homework-2/packages/contracts/src/import.ts
import { z } from 'zod';

export const ImportErrorSchema = z.object({
  row: z.number().int(),
  message: z.string(),
});
export type ImportError = z.infer<typeof ImportErrorSchema>;

export const ImportSummarySchema = z.object({
  imported_count: z.number().int(),
  failed_count: z.number().int(),
  total_count: z.number().int(),
  errors: z.array(ImportErrorSchema),
});
export type ImportSummary = z.infer<typeof ImportSummarySchema>;
```

- [ ] **Step 5: Write `auth.ts`**

```typescript
// homework-2/packages/contracts/src/auth.ts
import { z } from 'zod';

export const LoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const LoginResponseSchema = z.object({
  token: z.string(),
  user: z.object({ email: z.string().email() }),
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
```

- [ ] **Step 6: Update `index.ts`**

```typescript
// homework-2/packages/contracts/src/index.ts
export const CONTRACTS_VERSION = '0.0.1';

export * from './enums';
export * from './ticket';
export * from './classification';
export * from './import';
export * from './auth';
```

- [ ] **Step 7: Build contracts and verify web still builds**

```bash
pnpm --filter @repo/contracts build
pnpm --filter web build
```
Expected: both succeed; `apps/web/app/page.tsx`'s `CONTRACTS_VERSION` import still resolves.

- [ ] **Step 8: Commit**

```bash
git add homework-2/packages/contracts
git commit -m "feat(hw2-contracts): add ticket/classification/import/auth zod schemas"
```

---

### Task 3: Common infrastructure — Zod pipe, envelope interceptor, exception filter

**Files:**
- Create: `homework-2/apps/api/src/common/zod-validation.pipe.ts`
- Create: `homework-2/apps/api/src/common/zod-validation.pipe.spec.ts`
- Create: `homework-2/apps/api/src/common/envelope.interceptor.ts`
- Create: `homework-2/apps/api/src/common/envelope.interceptor.spec.ts`
- Create: `homework-2/apps/api/src/common/http-exception.filter.ts`
- Create: `homework-2/apps/api/src/common/http-exception.filter.spec.ts`
- Modify: `homework-2/apps/api/src/app.module.ts`

**Interfaces:**
- Produces: `ZodValidationPipe` (constructor takes a Zod `ZodSchema`, `transform(value)` returns parsed value or throws `BadRequestException`), `EnvelopeInterceptor` (class implementing `NestInterceptor`), `HttpExceptionFilter` (class implementing `ExceptionFilter`, registered app-wide via `APP_FILTER`).
- Consumes: nothing from earlier tasks besides NestJS/Zod itself.

- [ ] **Step 1: Write `zod-validation.pipe.ts`**

```typescript
// homework-2/apps/api/src/common/zod-validation.pipe.ts
import { ArgumentMetadata, BadRequestException, PipeTransform } from '@nestjs/common';
import { ZodSchema } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const message = result.error.issues
        .map((issue) => `${issue.path.join('.') || 'value'}: ${issue.message}`)
        .join(' ');
      throw new BadRequestException(message);
    }
    return result.data;
  }
}
```

- [ ] **Step 2: Write the failing test for the pipe**

```typescript
// homework-2/apps/api/src/common/zod-validation.pipe.spec.ts
import { z } from 'zod';
import { BadRequestException } from '@nestjs/common';
import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
  const schema = z.object({ name: z.string().min(1) });
  const pipe = new ZodValidationPipe(schema);
  const metadata = { type: 'body' } as const;

  it('returns the parsed value when valid', () => {
    expect(pipe.transform({ name: 'Alice' }, metadata)).toEqual({ name: 'Alice' });
  });

  it('throws BadRequestException with a readable message when invalid', () => {
    expect(() => pipe.transform({ name: '' }, metadata)).toThrow(BadRequestException);
  });

  it('includes the field path in the error message', () => {
    try {
      pipe.transform({ name: '' }, metadata);
      fail('expected transform to throw');
    } catch (e) {
      expect((e as BadRequestException).message).toContain('name');
    }
  });
});
```

- [ ] **Step 3: Run the pipe tests**

```bash
pnpm --filter api test -- zod-validation.pipe
```
Expected: PASS (3 tests) — implementation already written in Step 1.

- [ ] **Step 4: Write `envelope.interceptor.ts`**

```typescript
// homework-2/apps/api/src/common/envelope.interceptor.ts
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class EnvelopeInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => (data === undefined ? data : { data })));
  }
}
```

- [ ] **Step 5: Write the test for the interceptor**

```typescript
// homework-2/apps/api/src/common/envelope.interceptor.spec.ts
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { EnvelopeInterceptor } from './envelope.interceptor';

describe('EnvelopeInterceptor', () => {
  const interceptor = new EnvelopeInterceptor();
  const context = {} as ExecutionContext;

  it('wraps a defined value in { data }', (done) => {
    const handler: CallHandler = { handle: () => of({ id: '1' }) };
    interceptor.intercept(context, handler).subscribe((result) => {
      expect(result).toEqual({ data: { id: '1' } });
      done();
    });
  });

  it('wraps an array value in { data }', (done) => {
    const handler: CallHandler = { handle: () => of([1, 2, 3]) };
    interceptor.intercept(context, handler).subscribe((result) => {
      expect(result).toEqual({ data: [1, 2, 3] });
      done();
    });
  });

  it('passes undefined through unwrapped (for 204 responses)', (done) => {
    const handler: CallHandler = { handle: () => of(undefined) };
    interceptor.intercept(context, handler).subscribe((result) => {
      expect(result).toBeUndefined();
      done();
    });
  });
});
```

- [ ] **Step 6: Run the interceptor tests**

```bash
pnpm --filter api test -- envelope.interceptor
```
Expected: PASS (3 tests).

- [ ] **Step 7: Write `http-exception.filter.ts`**

```typescript
// homework-2/apps/api/src/common/http-exception.filter.ts
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error.';
    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (body && typeof body === 'object' && 'message' in body) {
        const rawMessage = (body as { message: unknown }).message;
        message = Array.isArray(rawMessage) ? rawMessage.join(' ') : String(rawMessage);
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({ error: { message } });
  }
}
```

- [ ] **Step 8: Write the test for the filter**

```typescript
// homework-2/apps/api/src/common/http-exception.filter.spec.ts
import { ArgumentsHost, BadRequestException, NotFoundException } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

function makeHost() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  it('wraps a simple HttpException message', () => {
    const { host, status, json } = makeHost();
    filter.catch(new NotFoundException('Ticket abc not found.'), host);
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ error: { message: 'Ticket abc not found.' } });
  });

  it('joins array-style validation messages with a space', () => {
    const { host, status, json } = makeHost();
    filter.catch(new BadRequestException(['subject is required', 'email is invalid']), host);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error: { message: 'subject is required email is invalid' },
    });
  });

  it('falls back to 500 for a non-Http error', () => {
    const { host, status, json } = makeHost();
    filter.catch(new Error('boom'), host);
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ error: { message: 'boom' } });
  });
});
```

- [ ] **Step 9: Run the filter tests**

```bash
pnpm --filter api test -- http-exception.filter
```
Expected: PASS (3 tests).

- [ ] **Step 10: Wire the filter into `AppModule`**

```typescript
// homework-2/apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { HealthController } from './health.controller';
import { HttpExceptionFilter } from './common/http-exception.filter';

@Module({
  controllers: [HealthController],
  providers: [{ provide: APP_FILTER, useClass: HttpExceptionFilter }],
})
export class AppModule {}
```

- [ ] **Step 11: Run full unit suite and existing e2e test**

```bash
pnpm --filter api test
pnpm --filter api test:e2e
```
Expected: all PASS, including the pre-existing `health.controller.spec.ts` and `app.e2e-spec.ts`.

- [ ] **Step 12: Commit**

```bash
git add homework-2/apps/api/src/common homework-2/apps/api/src/app.module.ts
git commit -m "feat(hw2-api): add zod validation pipe, envelope interceptor, exception filter"
```

---

### Task 4: Auth module — login, JWT guard, test user

**Files:**
- Create: `homework-2/apps/api/src/auth/auth.service.ts`
- Create: `homework-2/apps/api/src/auth/auth.service.spec.ts`
- Create: `homework-2/apps/api/src/auth/jwt-auth.guard.ts`
- Create: `homework-2/apps/api/src/auth/jwt-auth.guard.spec.ts`
- Create: `homework-2/apps/api/src/auth/auth.controller.ts`
- Create: `homework-2/apps/api/src/auth/auth.module.ts`
- Create: `homework-2/apps/api/test/auth.e2e-spec.ts`
- Modify: `homework-2/apps/api/src/app.module.ts`

**Interfaces:**
- Consumes: `ZodValidationPipe`, `EnvelopeInterceptor` (Task 3); `LoginInput`, `LoginInputSchema`, `LoginResponse` (Task 2).
- Produces: `AuthService.login(email, password): LoginResponse` (throws `UnauthorizedException` on bad credentials); `JwtAuthGuard` (injectable `CanActivate`, exported `@Global()` from `AuthModule` — later tasks use `@UseGuards(JwtAuthGuard)` without importing `AuthModule` explicitly). Route: `POST /auth/login`.

- [ ] **Step 1: Write `auth.service.ts`**

```typescript
// homework-2/apps/api/src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { LoginResponse } from '@repo/contracts';

interface StoredUser {
  email: string;
  passwordHash: string;
}

@Injectable()
export class AuthService {
  private readonly users: StoredUser[] = [
    { email: 'admin@ignore.com', passwordHash: bcrypt.hashSync('123', 10) },
  ];

  constructor(private readonly jwtService: JwtService) {}

  login(email: string, password: string): LoginResponse {
    const user = this.users.find((u) => u.email === email);
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    const token = this.jwtService.sign({ email: user.email });
    return { token, user: { email: user.email } };
  }
}
```

- [ ] **Step 2: Write the failing test for `AuthService`**

```typescript
// homework-2/apps/api/src/auth/auth.service.spec.ts
import { Test } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test-secret' })],
      providers: [AuthService],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it('returns a token and user for the seeded admin account', () => {
    const result = service.login('admin@ignore.com', '123');
    expect(result.user).toEqual({ email: 'admin@ignore.com' });
    expect(typeof result.token).toBe('string');
    expect(result.token.length).toBeGreaterThan(0);
  });

  it('throws UnauthorizedException for a wrong password', () => {
    expect(() => service.login('admin@ignore.com', 'wrong')).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException for an unknown email', () => {
    expect(() => service.login('nobody@example.com', '123')).toThrow(UnauthorizedException);
  });
});
```

- [ ] **Step 3: Run `AuthService` tests**

```bash
pnpm --filter api test -- auth.service
```
Expected: PASS (3 tests).

- [ ] **Step 4: Write `jwt-auth.guard.ts`**

```typescript
// homework-2/apps/api/src/auth/jwt-auth.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header.');
    }
    const token = authHeader.slice('Bearer '.length);
    try {
      const payload = this.jwtService.verify<{ email: string }>(token);
      (request as Request & { user?: { email: string } }).user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }
}
```

- [ ] **Step 5: Write the failing test for `JwtAuthGuard`**

```typescript
// homework-2/apps/api/src/auth/jwt-auth.guard.spec.ts
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

function makeContext(headers: Record<string, string>) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ headers }) }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  const jwtService = new JwtService({ secret: 'test-secret' });
  const guard = new JwtAuthGuard(jwtService);

  it('allows a request with a valid Bearer token', () => {
    const token = jwtService.sign({ email: 'admin@ignore.com' });
    expect(guard.canActivate(makeContext({ authorization: `Bearer ${token}` }))).toBe(true);
  });

  it('rejects a request with no Authorization header', () => {
    expect(() => guard.canActivate(makeContext({}))).toThrow(UnauthorizedException);
  });

  it('rejects a request with a malformed token', () => {
    expect(() =>
      guard.canActivate(makeContext({ authorization: 'Bearer not-a-real-token' })),
    ).toThrow(UnauthorizedException);
  });
});
```

- [ ] **Step 6: Run `JwtAuthGuard` tests**

```bash
pnpm --filter api test -- jwt-auth.guard
```
Expected: PASS (3 tests).

- [ ] **Step 7: Write `auth.controller.ts`**

```typescript
// homework-2/apps/api/src/auth/auth.controller.ts
import { Body, Controller, HttpCode, HttpStatus, Post, UseInterceptors } from '@nestjs/common';
import { LoginInput, LoginInputSchema } from '@repo/contracts';
import { EnvelopeInterceptor } from '../common/envelope.interceptor';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AuthService } from './auth.service';

@Controller('auth')
@UseInterceptors(EnvelopeInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body(new ZodValidationPipe(LoginInputSchema)) body: LoginInput) {
    return this.authService.login(body.email, body.password);
  }
}
```

- [ ] **Step 8: Write `auth.module.ts`**

```typescript
// homework-2/apps/api/src/auth/auth.module.ts
import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      signOptions: { expiresIn: '8h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [JwtAuthGuard, JwtModule],
})
export class AuthModule {}
```

- [ ] **Step 9: Wire `AuthModule` into `AppModule`**

```typescript
// homework-2/apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { HealthController } from './health.controller';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [HealthController],
  providers: [{ provide: APP_FILTER, useClass: HttpExceptionFilter }],
})
export class AppModule {}
```

- [ ] **Step 10: Write the e2e test for login**

```typescript
// homework-2/apps/api/test/auth.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('logs in the seeded admin user and returns a token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@ignore.com', password: '123' })
      .expect(200);
    expect(res.body.data.user).toEqual({ email: 'admin@ignore.com' });
    expect(typeof res.body.data.token).toBe('string');
  });

  it('rejects a wrong password with a wrapped error', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@ignore.com', password: 'wrong' })
      .expect(401);
    expect(res.body.error.message).toContain('Invalid email or password');
  });

  it('rejects a malformed body with 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'not-an-email' })
      .expect(400);
    expect(res.body.error.message).toBeDefined();
  });
});
```

- [ ] **Step 11: Run the auth e2e tests**

```bash
pnpm --filter api test:e2e -- auth
```
Expected: PASS (3 tests).

- [ ] **Step 12: Commit**

```bash
git add homework-2/apps/api/src/auth homework-2/apps/api/src/app.module.ts homework-2/apps/api/test/auth.e2e-spec.ts
git commit -m "feat(hw2-api): add JWT login, guard, and seeded admin test user"
```

---

### Task 5: Ticket model validation tests (`test_ticket_model`)

**Files:**
- Create: `homework-2/packages/contracts/src/ticket.spec.ts`

**Interfaces:**
- Consumes: `CreateTicketInputSchema`, `UpdateTicketInputSchema` (Task 2). No production code changes — this task is pure test coverage for the schemas already written.

- [ ] **Step 1: Write the schema validation tests**

```typescript
// homework-2/packages/contracts/src/ticket.spec.ts
import { CreateTicketInputSchema, UpdateTicketInputSchema } from './ticket';

const validInput = {
  customer_email: 'alice@example.com',
  customer_name: 'Alice Smith',
  subject: 'Cannot log in',
  description: 'I forgot my password and cannot log in to my account after resetting it.',
};

describe('CreateTicketInputSchema', () => {
  it('accepts a minimal valid input', () => {
    expect(CreateTicketInputSchema.safeParse(validInput).success).toBe(true);
  });

  it('rejects a missing subject', () => {
    const { subject: _subject, ...rest } = validInput;
    expect(CreateTicketInputSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects a subject longer than 200 characters', () => {
    const result = CreateTicketInputSchema.safeParse({ ...validInput, subject: 'x'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('rejects a description shorter than 10 characters', () => {
    const result = CreateTicketInputSchema.safeParse({ ...validInput, description: 'too short' });
    expect(result.success).toBe(false);
  });

  it('rejects a description longer than 2000 characters', () => {
    const result = CreateTicketInputSchema.safeParse({
      ...validInput,
      description: 'x'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = CreateTicketInputSchema.safeParse({ ...validInput, customer_email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown category', () => {
    const result = CreateTicketInputSchema.safeParse({ ...validInput, category: 'not_a_category' });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown priority', () => {
    const result = CreateTicketInputSchema.safeParse({ ...validInput, priority: 'super-urgent' });
    expect(result.success).toBe(false);
  });
});

describe('UpdateTicketInputSchema', () => {
  it('accepts an empty object (fully partial)', () => {
    expect(UpdateTicketInputSchema.safeParse({}).success).toBe(true);
  });
});
```

- [ ] **Step 2: Run the tests**

```bash
pnpm --filter @repo/contracts test
```
If `@repo/contracts`'s `package.json` has no `test` script yet, add one first:

```json
"scripts": {
  "build": "tsc -p tsconfig.json",
  "lint": "eslint src",
  "test": "jest --rootDir src --testRegex '.*\\.spec\\.ts$' --preset ts-jest --testEnvironment node"
}
```
And add `ts-jest`, `jest`, `@types/jest` as devDependencies if missing: `pnpm add -D jest ts-jest @types/jest --filter @repo/contracts`.

Expected: PASS (9 tests).

- [ ] **Step 3: Commit**

```bash
git add homework-2/packages/contracts
git commit -m "test(hw2-contracts): cover ticket input schema validation"
```

---

### Task 6: Classification service (`test_categorization`)

**Files:**
- Create: `homework-2/apps/api/src/tickets/classification/classification.service.ts`
- Create: `homework-2/apps/api/src/tickets/classification/classification.service.spec.ts`

**Interfaces:**
- Consumes: `ClassificationResult`, `TicketCategory`, `TicketPriority` (Task 2).
- Produces: `ClassificationService.classify(subject: string, description: string): ClassificationResult` — used by Task 7's `TicketsService` and Task 12's `ImportService`.

- [ ] **Step 1: Write `classification.service.ts`**

```typescript
// homework-2/apps/api/src/tickets/classification/classification.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ClassificationResult, TicketCategory, TicketPriority } from '@repo/contracts';

interface CategoryRule {
  category: TicketCategory;
  keywords: string[];
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'account_access',
    keywords: ['log in', 'login', 'password', '2fa', 'two-factor', 'locked out', 'credential'],
  },
  {
    category: 'technical_issue',
    keywords: ['bug', 'error', 'crash', 'exception', 'not working', 'broken'],
  },
  {
    category: 'billing_question',
    keywords: ['payment', 'invoice', 'refund', 'billing', 'charge', 'subscription'],
  },
  {
    category: 'feature_request',
    keywords: ['enhancement', 'suggestion', 'feature request', 'would love', 'wish', 'roadmap'],
  },
  {
    category: 'bug_report',
    keywords: ['reproduce', 'steps to reproduce', 'defect', 'stack trace'],
  },
];

interface PriorityRule {
  priority: TicketPriority;
  keywords: string[];
}

const PRIORITY_RULES: PriorityRule[] = [
  {
    priority: 'urgent',
    keywords: ["can't access", 'cannot access', 'critical', 'production down', 'security'],
  },
  { priority: 'high', keywords: ['important', 'blocking', 'asap'] },
  { priority: 'low', keywords: ['minor', 'cosmetic', 'suggestion'] },
];

@Injectable()
export class ClassificationService {
  private readonly logger = new Logger(ClassificationService.name);

  classify(subject: string, description: string): ClassificationResult {
    const text = `${subject} ${description}`.toLowerCase();
    const matched: string[] = [];

    let category: TicketCategory = 'other';
    for (const rule of CATEGORY_RULES) {
      const hits = rule.keywords.filter((keyword) => text.includes(keyword));
      if (hits.length) {
        category = rule.category;
        matched.push(...hits);
        break;
      }
    }

    let priority: TicketPriority = 'medium';
    for (const rule of PRIORITY_RULES) {
      const hits = rule.keywords.filter((keyword) => text.includes(keyword));
      if (hits.length) {
        priority = rule.priority;
        matched.push(...hits);
        break;
      }
    }

    const keywords = [...new Set(matched)];
    const confidence = keywords.length ? Math.min(0.95, 0.6 + keywords.length * 0.1) : 0.5;
    const reasoning = keywords.length
      ? `Matched keyword(s) "${keywords.join('", "')}" — categorized as ${category}, priority ${priority}.`
      : `No strong keyword signal found — defaulted to category "other", priority "${priority}".`;

    const result: ClassificationResult = { category, priority, confidence, reasoning, keywords };

    this.logger.log(
      `Classified ticket as ${result.category}/${result.priority} (confidence=${result.confidence}) keywords=${JSON.stringify(keywords)}`,
    );

    return result;
  }
}
```

- [ ] **Step 2: Write the failing tests**

```typescript
// homework-2/apps/api/src/tickets/classification/classification.service.spec.ts
import { ClassificationService } from './classification.service';

describe('ClassificationService', () => {
  const service = new ClassificationService();

  it('categorizes account_access from login/password keywords', () => {
    const result = service.classify('Cannot log in', 'My password reset link never arrives.');
    expect(result.category).toBe('account_access');
  });

  it('categorizes technical_issue from crash/error keywords', () => {
    const result = service.classify('App keeps crashing', 'I get an error every time it opens.');
    expect(result.category).toBe('technical_issue');
  });

  it('categorizes billing_question from refund/invoice keywords', () => {
    const result = service.classify('Refund question', 'My invoice shows a duplicate charge for billing.');
    expect(result.category).toBe('billing_question');
  });

  it('categorizes feature_request from roadmap/suggestion keywords', () => {
    const result = service.classify('Feature request', 'Would love a roadmap for bulk export, just a suggestion.');
    expect(result.category).toBe('feature_request');
  });

  it('categorizes bug_report from reproduce/stack trace keywords', () => {
    const result = service.classify('Bug with steps to reproduce', 'Here is the stack trace and defect details.');
    expect(result.category).toBe('bug_report');
  });

  it('falls back to other with no keyword match', () => {
    const result = service.classify('General question', 'Just wanted to say thanks for the great support team.');
    expect(result.category).toBe('other');
    expect(result.keywords).toHaveLength(0);
  });

  it('assigns urgent priority for critical/security language', () => {
    const result = service.classify('Security issue', "I can't access the app and this looks like production down.");
    expect(result.priority).toBe('urgent');
  });

  it('assigns high priority for important/asap language', () => {
    const result = service.classify('Please help', 'This is important and blocking my team, need it asap.');
    expect(result.priority).toBe('high');
  });

  it('assigns low priority for minor/cosmetic language', () => {
    const result = service.classify('Small issue', 'This is a minor cosmetic suggestion, no rush at all.');
    expect(result.priority).toBe('low');
  });

  it('defaults to medium priority and returns confidence/reasoning', () => {
    const result = service.classify('Question', 'Just a regular question about how something works.');
    expect(result.priority).toBe('medium');
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(result.reasoning.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: Run the tests**

```bash
pnpm --filter api test -- classification.service
```
Expected: PASS (10 tests).

- [ ] **Step 4: Commit**

```bash
git add homework-2/apps/api/src/tickets/classification
git commit -m "feat(hw2-api): add keyword-based ticket classification service"
```

---

### Task 7: Tickets repository + service (CRUD business logic)

**Files:**
- Create: `homework-2/apps/api/src/tickets/tickets.repository.ts`
- Create: `homework-2/apps/api/src/tickets/tickets.repository.spec.ts`
- Create: `homework-2/apps/api/src/tickets/tickets.service.ts`
- Create: `homework-2/apps/api/src/tickets/tickets.service.spec.ts`

**Interfaces:**
- Consumes: `Ticket`, `CreateTicketInput`, `UpdateTicketInput`, `ClassificationResult` (Task 2); `ClassificationService.classify(subject, description): ClassificationResult` (Task 6).
- Produces: `TicketsRepository` with `create`, `findAll`, `findById`, `update`, `delete` operating on `StoredTicket` (= `Ticket & { classification_confidence: number | null }`). `TicketsService` with `list(filters): Ticket[]`, `getById(id): Ticket`, `create(input, classification?): Ticket`, `update(id, patch): Ticket`, `delete(id): void`, `classify(id): ClassificationResult` — Tasks 8 and 12 depend on these exact names and signatures.

- [ ] **Step 1: Write `tickets.repository.ts`**

```typescript
// homework-2/apps/api/src/tickets/tickets.repository.ts
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Ticket } from '@repo/contracts';

export type StoredTicket = Ticket & { classification_confidence: number | null };

@Injectable()
export class TicketsRepository {
  private readonly tickets = new Map<string, StoredTicket>();
  private nextNumber = 1000;

  create(data: Omit<StoredTicket, 'id' | 'number'>): StoredTicket {
    const ticket: StoredTicket = { ...data, id: randomUUID(), number: this.nextNumber++ };
    this.tickets.set(ticket.id, ticket);
    return ticket;
  }

  findAll(): StoredTicket[] {
    return [...this.tickets.values()];
  }

  findById(id: string): StoredTicket | undefined {
    return this.tickets.get(id);
  }

  update(id: string, patch: Partial<StoredTicket>): StoredTicket | undefined {
    const existing = this.tickets.get(id);
    if (!existing) return undefined;
    const updated: StoredTicket = { ...existing, ...patch };
    this.tickets.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.tickets.delete(id);
  }
}
```

- [ ] **Step 2: Write the failing test for the repository**

```typescript
// homework-2/apps/api/src/tickets/tickets.repository.spec.ts
import { TicketsRepository } from './tickets.repository';
import { Ticket } from '@repo/contracts';

const baseData: Omit<Ticket, 'id' | 'number'> & { classification_confidence: null } = {
  customer_id: 'cus_alice',
  customer_email: 'alice@example.com',
  customer_name: 'Alice Smith',
  subject: 'Cannot log in',
  description: 'I forgot my password and cannot log in to my account after resetting it.',
  category: 'account_access',
  priority: 'high',
  status: 'new',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  resolved_at: null,
  assigned_to: null,
  tags: [],
  metadata: { source: 'web_form', browser: '—', device_type: 'desktop' },
  classification_confidence: null,
};

describe('TicketsRepository', () => {
  let repo: TicketsRepository;

  beforeEach(() => {
    repo = new TicketsRepository();
  });

  it('creates a ticket with a generated id and an auto-incrementing number', () => {
    const first = repo.create(baseData);
    const second = repo.create(baseData);
    expect(first.id).not.toEqual(second.id);
    expect(second.number).toBe(first.number + 1);
  });

  it('finds a ticket by id', () => {
    const created = repo.create(baseData);
    expect(repo.findById(created.id)).toEqual(created);
  });

  it('returns undefined for a missing id', () => {
    expect(repo.findById('does-not-exist')).toBeUndefined();
  });

  it('lists all created tickets', () => {
    repo.create(baseData);
    repo.create(baseData);
    expect(repo.findAll()).toHaveLength(2);
  });

  it('updates a ticket by merging the patch', () => {
    const created = repo.create(baseData);
    const updated = repo.update(created.id, { status: 'resolved' });
    expect(updated?.status).toBe('resolved');
    expect(updated?.subject).toBe(baseData.subject);
  });

  it('returns undefined when updating a missing id', () => {
    expect(repo.update('does-not-exist', { status: 'resolved' })).toBeUndefined();
  });

  it('deletes a ticket and reports success', () => {
    const created = repo.create(baseData);
    expect(repo.delete(created.id)).toBe(true);
    expect(repo.findById(created.id)).toBeUndefined();
  });

  it('reports failure deleting a missing id', () => {
    expect(repo.delete('does-not-exist')).toBe(false);
  });
});
```

- [ ] **Step 3: Run the repository tests**

```bash
pnpm --filter api test -- tickets.repository
```
Expected: PASS (8 tests).

- [ ] **Step 4: Write `tickets.service.ts`**

```typescript
// homework-2/apps/api/src/tickets/tickets.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { ClassificationResult, CreateTicketInput, Ticket, UpdateTicketInput } from '@repo/contracts';
import { StoredTicket, TicketsRepository } from './tickets.repository';
import { ClassificationService } from './classification/classification.service';

export interface TicketFilters {
  status?: string[];
  priority?: string[];
  category?: string[];
  assigned_to?: string;
  unassigned?: boolean;
  q?: string;
}

@Injectable()
export class TicketsService {
  constructor(
    private readonly repository: TicketsRepository,
    private readonly classificationService: ClassificationService,
  ) {}

  list(filters: TicketFilters): Ticket[] {
    let list = this.repository.findAll();
    if (filters.status?.length) list = list.filter((t) => filters.status!.includes(t.status));
    if (filters.priority?.length) list = list.filter((t) => filters.priority!.includes(t.priority));
    if (filters.category?.length) list = list.filter((t) => filters.category!.includes(t.category));
    if (filters.assigned_to) list = list.filter((t) => t.assigned_to === filters.assigned_to);
    if (filters.unassigned) list = list.filter((t) => !t.assigned_to);
    if (filters.q) {
      const q = filters.q.toLowerCase();
      list = list.filter((t) =>
        `${t.subject} ${t.customer_name} ${t.customer_email} ${t.number}`.toLowerCase().includes(q),
      );
    }
    const sorted = [...list].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );
    return sorted.map((t) => this.toPublic(t));
  }

  getById(id: string): Ticket {
    const ticket = this.repository.findById(id);
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found.`);
    return this.toPublic(ticket);
  }

  create(input: CreateTicketInput, classification?: ClassificationResult): Ticket {
    const now = new Date().toISOString();
    const effectiveClassification =
      classification ?? (input.auto_classify ? this.classificationService.classify(input.subject, input.description) : null);

    const stored = this.repository.create({
      customer_id: `cus_${input.customer_name.toLowerCase().replace(/[^a-z]+/g, '_')}`,
      customer_email: input.customer_email,
      customer_name: input.customer_name,
      subject: input.subject,
      description: input.description,
      category: input.category ?? effectiveClassification?.category ?? 'other',
      priority: input.priority ?? effectiveClassification?.priority ?? 'medium',
      status: input.status ?? 'new',
      created_at: now,
      updated_at: now,
      resolved_at: input.resolved_at ?? null,
      assigned_to: input.assigned_to ?? null,
      tags: input.tags ?? [],
      metadata: {
        source: input.metadata?.source ?? 'web_form',
        browser: input.metadata?.browser ?? '—',
        device_type: input.metadata?.device_type ?? 'desktop',
      },
      classification_confidence: effectiveClassification?.confidence ?? null,
    });
    return this.toPublic(stored);
  }

  update(id: string, patch: UpdateTicketInput): Ticket {
    const existing = this.repository.findById(id);
    if (!existing) throw new NotFoundException(`Ticket ${id} not found.`);

    const now = new Date().toISOString();
    const nextStatus = patch.status ?? existing.status;
    const resolvedAt =
      nextStatus === 'resolved' && existing.status !== 'resolved' && patch.resolved_at === undefined
        ? now
        : (patch.resolved_at ?? existing.resolved_at);

    const { auto_classify: _autoClassify, ...patchWithoutFlag } = patch;
    const updated = this.repository.update(id, {
      ...patchWithoutFlag,
      status: nextStatus,
      resolved_at: resolvedAt,
      updated_at: now,
    });
    return this.toPublic(updated as StoredTicket);
  }

  delete(id: string): void {
    const deleted = this.repository.delete(id);
    if (!deleted) throw new NotFoundException(`Ticket ${id} not found.`);
  }

  classify(id: string): ClassificationResult {
    const ticket = this.repository.findById(id);
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found.`);
    const result = this.classificationService.classify(ticket.subject, ticket.description);
    this.repository.update(id, {
      category: result.category,
      priority: result.priority,
      classification_confidence: result.confidence,
      updated_at: new Date().toISOString(),
    });
    return result;
  }

  private toPublic(ticket: StoredTicket): Ticket {
    const { classification_confidence: _classificationConfidence, ...publicTicket } = ticket;
    return publicTicket;
  }
}
```

- [ ] **Step 5: Write the failing tests for `TicketsService`**

```typescript
// homework-2/apps/api/src/tickets/tickets.service.spec.ts
import { NotFoundException } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsRepository } from './tickets.repository';
import { ClassificationService } from './classification/classification.service';
import { CreateTicketInput } from '@repo/contracts';

const validInput: CreateTicketInput = {
  customer_email: 'alice@example.com',
  customer_name: 'Alice Smith',
  subject: 'Cannot log in',
  description: 'I forgot my password and cannot log in to my account after resetting it.',
};

describe('TicketsService', () => {
  let service: TicketsService;

  beforeEach(() => {
    service = new TicketsService(new TicketsRepository(), new ClassificationService());
  });

  it('creates a ticket defaulting category/priority/status when not given', () => {
    const ticket = service.create(validInput);
    expect(ticket.category).toBe('other');
    expect(ticket.priority).toBe('medium');
    expect(ticket.status).toBe('new');
    expect(ticket.number).toBeGreaterThan(0);
  });

  it('does not expose classification_confidence on the public ticket', () => {
    const ticket = service.create(validInput);
    expect(ticket).not.toHaveProperty('classification_confidence');
  });

  it('auto-classifies on create when auto_classify is true', () => {
    const ticket = service.create({
      ...validInput,
      subject: "Can't access my account, this is critical",
      description: 'I cannot log in at all and this is blocking my whole team urgently.',
      auto_classify: true,
    });
    expect(ticket.category).toBe('account_access');
    expect(ticket.priority).toBe('urgent');
  });

  it('gets a ticket by id', () => {
    const created = service.create(validInput);
    expect(service.getById(created.id).id).toBe(created.id);
  });

  it('throws NotFoundException when getting a missing ticket', () => {
    expect(() => service.getById('missing')).toThrow(NotFoundException);
  });

  it('updates a ticket and bumps updated_at', () => {
    const created = service.create(validInput);
    const updated = service.update(created.id, { priority: 'high' });
    expect(updated.priority).toBe('high');
    expect(updated.updated_at).not.toBe(created.updated_at);
  });

  it('auto-sets resolved_at when status transitions to resolved', () => {
    const created = service.create(validInput);
    const updated = service.update(created.id, { status: 'resolved' });
    expect(updated.resolved_at).not.toBeNull();
  });

  it('honors an explicit resolved_at from the patch', () => {
    const created = service.create(validInput);
    const updated = service.update(created.id, { status: 'resolved', resolved_at: '2026-02-02T00:00:00.000Z' });
    expect(updated.resolved_at).toBe('2026-02-02T00:00:00.000Z');
  });

  it('throws NotFoundException when updating a missing ticket', () => {
    expect(() => service.update('missing', { priority: 'high' })).toThrow(NotFoundException);
  });

  it('deletes a ticket', () => {
    const created = service.create(validInput);
    service.delete(created.id);
    expect(() => service.getById(created.id)).toThrow(NotFoundException);
  });

  it('throws NotFoundException when deleting a missing ticket', () => {
    expect(() => service.delete('missing')).toThrow(NotFoundException);
  });

  it('lists tickets filtered by status and priority together', () => {
    service.create({ ...validInput, priority: 'urgent', status: 'new' });
    service.create({ ...validInput, priority: 'low', status: 'resolved' });
    const result = service.list({ status: ['new'], priority: ['urgent'] });
    expect(result).toHaveLength(1);
    expect(result[0].priority).toBe('urgent');
  });

  it('classifies an existing ticket and persists the result', () => {
    const created = service.create({
      ...validInput,
      subject: "Can't access my account",
      description: 'I cannot log in and need urgent help with this critical issue.',
    });
    const result = service.classify(created.id);
    expect(result.category).toBe('account_access');
    const refreshed = service.getById(created.id);
    expect(refreshed.category).toBe(result.category);
    expect(refreshed.priority).toBe(result.priority);
  });
});
```

- [ ] **Step 6: Run the service tests**

```bash
pnpm --filter api test -- tickets.service
```
Expected: PASS (13 tests).

- [ ] **Step 7: Commit**

```bash
git add homework-2/apps/api/src/tickets/tickets.repository.ts homework-2/apps/api/src/tickets/tickets.repository.spec.ts homework-2/apps/api/src/tickets/tickets.service.ts homework-2/apps/api/src/tickets/tickets.service.spec.ts
git commit -m "feat(hw2-api): add in-memory tickets repository and service"
```

---

### Task 8: Tickets controller — CRUD endpoints + classify (`test_ticket_api`)

**Files:**
- Create: `homework-2/apps/api/src/tickets/tickets.controller.ts`
- Create: `homework-2/apps/api/src/tickets/tickets.module.ts`
- Create: `homework-2/apps/api/test/tickets.e2e-spec.ts`
- Modify: `homework-2/apps/api/src/app.module.ts`

**Interfaces:**
- Consumes: `TicketsService` (Task 7), `JwtAuthGuard` (Task 4), `EnvelopeInterceptor`/`ZodValidationPipe` (Task 3), `CreateTicketInputSchema`/`UpdateTicketInputSchema` (Task 2).
- Produces: routes `GET/POST /tickets`, `GET/PATCH/PUT/DELETE /tickets/:id`, `POST /tickets/:id/classify`, `POST /tickets/:id/auto-classify`. Import route (`POST /tickets/import`) is added to this same controller in Task 12 — leave a `TODO`-free gap by NOT declaring it yet; Task 12 will add the method and its constructor dependency.

- [ ] **Step 1: Write `tickets.controller.ts`**

```typescript
// homework-2/apps/api/src/tickets/tickets.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CreateTicketInput, CreateTicketInputSchema, UpdateTicketInput, UpdateTicketInputSchema } from '@repo/contracts';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EnvelopeInterceptor } from '../common/envelope.interceptor';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { TicketsService } from './tickets.service';

interface TicketsQuery {
  status?: string;
  priority?: string;
  category?: string;
  assigned_to?: string;
  unassigned?: string;
  q?: string;
}

@Controller('tickets')
@UseGuards(JwtAuthGuard)
@UseInterceptors(EnvelopeInterceptor)
export class TicketsController {
  constructor(protected readonly ticketsService: TicketsService) {}

  @Get()
  list(@Query() query: TicketsQuery) {
    return this.ticketsService.list({
      status: query.status?.split(',').filter(Boolean),
      priority: query.priority?.split(',').filter(Boolean),
      category: query.category?.split(',').filter(Boolean),
      assigned_to: query.assigned_to,
      unassigned: query.unassigned === 'true',
      q: query.q,
    });
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.ticketsService.getById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body(new ZodValidationPipe(CreateTicketInputSchema)) body: CreateTicketInput) {
    return this.ticketsService.create(body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateTicketInputSchema)) body: UpdateTicketInput,
  ) {
    return this.ticketsService.update(id, body);
  }

  @Put(':id')
  replace(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateTicketInputSchema)) body: UpdateTicketInput,
  ) {
    return this.ticketsService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    this.ticketsService.delete(id);
  }

  @Post(':id/classify')
  classify(@Param('id') id: string) {
    return this.ticketsService.classify(id);
  }

  @Post(':id/auto-classify')
  autoClassify(@Param('id') id: string) {
    return this.ticketsService.classify(id);
  }
}
```

- [ ] **Step 2: Write `tickets.module.ts`**

```typescript
// homework-2/apps/api/src/tickets/tickets.module.ts
import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { TicketsRepository } from './tickets.repository';
import { ClassificationService } from './classification/classification.service';

@Module({
  controllers: [TicketsController],
  providers: [TicketsService, TicketsRepository, ClassificationService],
})
export class TicketsModule {}
```

- [ ] **Step 3: Wire `TicketsModule` into `AppModule`**

```typescript
// homework-2/apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { HealthController } from './health.controller';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { AuthModule } from './auth/auth.module';
import { TicketsModule } from './tickets/tickets.module';

@Module({
  imports: [AuthModule, TicketsModule],
  controllers: [HealthController],
  providers: [{ provide: APP_FILTER, useClass: HttpExceptionFilter }],
})
export class AppModule {}
```

- [ ] **Step 4: Write the e2e tests**

```typescript
// homework-2/apps/api/test/tickets.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

async function loginToken(app: INestApplication<App>): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: 'admin@ignore.com', password: '123' });
  return res.body.data.token as string;
}

const validTicket = {
  customer_email: 'alice@example.com',
  customer_name: 'Alice Smith',
  subject: 'Cannot log in',
  description: 'I forgot my password and cannot log in to my account after resetting it.',
};

describe('Tickets (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    token = await loginToken(app);
  });

  afterEach(async () => {
    await app.close();
  });

  it('rejects requests without a token', async () => {
    await request(app.getHttpServer()).get('/tickets').expect(401);
  });

  it('creates a ticket and returns 201 with a wrapped payload', async () => {
    const res = await request(app.getHttpServer())
      .post('/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send(validTicket)
      .expect(201);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.status).toBe('new');
  });

  it('rejects an invalid create body with 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({ subject: 'x' })
      .expect(400);
    expect(res.body.error.message).toBeDefined();
  });

  it('gets a ticket by id', async () => {
    const created = await request(app.getHttpServer())
      .post('/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send(validTicket);
    const res = await request(app.getHttpServer())
      .get(`/tickets/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.data.id).toBe(created.body.data.id);
  });

  it('returns 404 for a missing ticket', async () => {
    await request(app.getHttpServer())
      .get('/tickets/does-not-exist')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('lists tickets including newly created ones', async () => {
    await request(app.getHttpServer()).post('/tickets').set('Authorization', `Bearer ${token}`).send(validTicket);
    const res = await request(app.getHttpServer())
      .get('/tickets')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('filters the list by status', async () => {
    await request(app.getHttpServer()).post('/tickets').set('Authorization', `Bearer ${token}`).send(validTicket);
    const res = await request(app.getHttpServer())
      .get('/tickets?status=resolved')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.data).toHaveLength(0);
  });

  it('updates a ticket via PATCH', async () => {
    const created = await request(app.getHttpServer())
      .post('/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send(validTicket);
    const res = await request(app.getHttpServer())
      .patch(`/tickets/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ priority: 'urgent' })
      .expect(200);
    expect(res.body.data.priority).toBe('urgent');
  });

  it('updates a ticket via the PUT alias', async () => {
    const created = await request(app.getHttpServer())
      .post('/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send(validTicket);
    const res = await request(app.getHttpServer())
      .put(`/tickets/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'in_progress' })
      .expect(200);
    expect(res.body.data.status).toBe('in_progress');
  });

  it('deletes a ticket and returns 204, then 404 on re-fetch', async () => {
    const created = await request(app.getHttpServer())
      .post('/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send(validTicket);
    await request(app.getHttpServer())
      .delete(`/tickets/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);
    await request(app.getHttpServer())
      .get(`/tickets/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('classifies a ticket via /classify and persists the result', async () => {
    const created = await request(app.getHttpServer())
      .post('/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...validTicket,
        subject: "Can't access my account",
        description: 'I cannot log in and need urgent help with this critical issue.',
      });
    const res = await request(app.getHttpServer())
      .post(`/tickets/${created.body.data.id}/classify`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);
    expect(res.body.data.category).toBe('account_access');
    const refreshed = await request(app.getHttpServer())
      .get(`/tickets/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(refreshed.body.data.category).toBe('account_access');
  });

  it('also classifies via the /auto-classify alias', async () => {
    const created = await request(app.getHttpServer())
      .post('/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send(validTicket);
    await request(app.getHttpServer())
      .post(`/tickets/${created.body.data.id}/auto-classify`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);
  });
});
```

- [ ] **Step 5: Run the e2e tests**

```bash
pnpm --filter api test:e2e -- tickets
```
Expected: PASS (12 tests).

- [ ] **Step 6: Run full unit + e2e suites**

```bash
pnpm --filter api test
pnpm --filter api test:e2e
```
Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add homework-2/apps/api/src/tickets/tickets.controller.ts homework-2/apps/api/src/tickets/tickets.module.ts homework-2/apps/api/src/app.module.ts homework-2/apps/api/test/tickets.e2e-spec.ts
git commit -m "feat(hw2-api): add tickets CRUD + classify endpoints"
```

---

### Task 9: CSV import parser (`test_import_csv`)

**Files:**
- Create: `homework-2/apps/api/src/tickets/import/types.ts`
- Create: `homework-2/apps/api/src/tickets/import/csv-parser.service.ts`
- Create: `homework-2/apps/api/src/tickets/import/csv-parser.service.spec.ts`
- Create: `homework-2/apps/api/test/fixtures/tickets-valid.csv`
- Create: `homework-2/apps/api/test/fixtures/tickets-malformed.csv`

**Interfaces:**
- Produces: `ImportRow` type (`{ row: number; data: Record<string, unknown> }`), `CsvParserService.parse(text: string): ImportRow[]` (throws `BadRequestException` on malformed CSV). Consumed by Task 12's `ImportService`.

- [ ] **Step 1: Write `types.ts`**

```typescript
// homework-2/apps/api/src/tickets/import/types.ts
export interface ImportRow {
  row: number;
  data: Record<string, unknown>;
}
```

- [ ] **Step 2: Write `csv-parser.service.ts`**

```typescript
// homework-2/apps/api/src/tickets/import/csv-parser.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { ImportRow } from './types';

@Injectable()
export class CsvParserService {
  parse(text: string): ImportRow[] {
    let records: Record<string, string>[];
    try {
      records = parse(text, { columns: true, skip_empty_lines: true, trim: true });
    } catch (e) {
      throw new BadRequestException(`Malformed CSV file: ${(e as Error).message}`);
    }
    return records.map((data, index) => ({ row: index + 2, data }));
  }
}
```

- [ ] **Step 3: Create fixtures**

```csv
subject,customer_name,customer_email,description,category,priority
Cannot login to account,Alice Smith,alice@example.com,I forgot my password and cannot log in to my account after reset.,account_access,high
App crashes on startup,Bob Jones,bob@example.com,The mobile app crashes immediately every time I open it on Android.,bug_report,urgent
Question about invoice,Carol White,carol@example.com,I was charged twice for my subscription this month please check my invoice.,,
```
Save as `homework-2/apps/api/test/fixtures/tickets-valid.csv`.

```csv
subject,customer_name,customer_email,description
"Unterminated quote,Dave Brown,dave@example.com,"This row has a quote that never closes
```
Save as `homework-2/apps/api/test/fixtures/tickets-malformed.csv`.

- [ ] **Step 4: Write the failing tests**

```typescript
// homework-2/apps/api/src/tickets/import/csv-parser.service.spec.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import { BadRequestException } from '@nestjs/common';
import { CsvParserService } from './csv-parser.service';

const fixturesDir = join(__dirname, '../../../test/fixtures');
const validCsv = readFileSync(join(fixturesDir, 'tickets-valid.csv'), 'utf-8');
const malformedCsv = readFileSync(join(fixturesDir, 'tickets-malformed.csv'), 'utf-8');

describe('CsvParserService', () => {
  const parser = new CsvParserService();

  it('parses valid rows with 1-based row numbers including the header', () => {
    const rows = parser.parse(validCsv);
    expect(rows).toHaveLength(3);
    expect(rows[0].row).toBe(2);
    expect(rows[0].data.subject).toBe('Cannot login to account');
  });

  it('returns an empty array for a header-only file', () => {
    const rows = parser.parse('subject,customer_name,customer_email,description\n');
    expect(rows).toEqual([]);
  });

  it('throws BadRequestException for malformed CSV', () => {
    expect(() => parser.parse(malformedCsv)).toThrow(BadRequestException);
  });

  it('trims surrounding whitespace from cell values', () => {
    const rows = parser.parse('subject,customer_name\n  Trimmed Subject  , Bob \n');
    expect(rows[0].data.subject).toBe('Trimmed Subject');
    expect(rows[0].data.customer_name).toBe('Bob');
  });

  it('handles CRLF line endings', () => {
    const rows = parser.parse('subject,customer_name\r\nHello,Alice\r\n');
    expect(rows).toHaveLength(1);
    expect(rows[0].data.subject).toBe('Hello');
  });

  it('leaves unspecified optional columns as empty strings, not missing keys', () => {
    const rows = parser.parse(validCsv);
    expect(rows[2].data.category).toBe('');
  });
});
```

- [ ] **Step 5: Run the tests**

```bash
pnpm --filter api test -- csv-parser
```
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add homework-2/apps/api/src/tickets/import homework-2/apps/api/test/fixtures
git commit -m "feat(hw2-api): add CSV import parser"
```

---

### Task 10: JSON import parser (`test_import_json`)

**Files:**
- Create: `homework-2/apps/api/src/tickets/import/json-parser.service.ts`
- Create: `homework-2/apps/api/src/tickets/import/json-parser.service.spec.ts`
- Create: `homework-2/apps/api/test/fixtures/tickets-valid.json`
- Create: `homework-2/apps/api/test/fixtures/tickets-malformed.json`

**Interfaces:**
- Produces: `JsonParserService.parse(text: string): ImportRow[]` (throws `BadRequestException` on malformed/unshaped JSON). Consumed by Task 12's `ImportService`.

- [ ] **Step 1: Write `json-parser.service.ts`**

```typescript
// homework-2/apps/api/src/tickets/import/json-parser.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { ImportRow } from './types';

@Injectable()
export class JsonParserService {
  parse(text: string): ImportRow[] {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      throw new BadRequestException(`Malformed JSON file: ${(e as Error).message}`);
    }

    let rows: unknown[] | null = null;
    if (Array.isArray(parsed)) {
      rows = parsed;
    } else if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { tickets?: unknown }).tickets)) {
      rows = (parsed as { tickets: unknown[] }).tickets;
    }

    if (!rows) {
      throw new BadRequestException('JSON file must be an array of tickets or an object with a "tickets" array.');
    }

    return rows.map((data, index) => ({ row: index + 1, data: data as Record<string, unknown> }));
  }
}
```

- [ ] **Step 2: Create fixtures**

```json
[
  {
    "subject": "Duplicate charge on my account",
    "customer_name": "Grace Miller",
    "customer_email": "grace.miller@example.com",
    "description": "I noticed two identical charges on the same day for my annual subscription.",
    "category": "billing_question",
    "priority": "urgent"
  },
  {
    "subject": "How do I invite teammates?",
    "customer_name": "Tom Becker",
    "customer_email": "tom@example.com",
    "description": "I only see a personal settings page, where do team invites live in the product?"
  }
]
```
Save as `homework-2/apps/api/test/fixtures/tickets-valid.json`.

```json
{ "subject": "missing closing brace"
```
Save as `homework-2/apps/api/test/fixtures/tickets-malformed.json`.

- [ ] **Step 3: Write the failing tests**

```typescript
// homework-2/apps/api/src/tickets/import/json-parser.service.spec.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import { BadRequestException } from '@nestjs/common';
import { JsonParserService } from './json-parser.service';

const fixturesDir = join(__dirname, '../../../test/fixtures');
const validJson = readFileSync(join(fixturesDir, 'tickets-valid.json'), 'utf-8');
const malformedJson = readFileSync(join(fixturesDir, 'tickets-malformed.json'), 'utf-8');

describe('JsonParserService', () => {
  const parser = new JsonParserService();

  it('parses a top-level array with 1-based row numbers', () => {
    const rows = parser.parse(validJson);
    expect(rows).toHaveLength(2);
    expect(rows[0].row).toBe(1);
    expect(rows[1].row).toBe(2);
  });

  it('parses an object with a "tickets" array', () => {
    const rows = parser.parse(JSON.stringify({ tickets: [{ subject: 'A' }, { subject: 'B' }] }));
    expect(rows).toHaveLength(2);
    expect(rows[0].data.subject).toBe('A');
  });

  it('throws BadRequestException for malformed JSON syntax', () => {
    expect(() => parser.parse(malformedJson)).toThrow(BadRequestException);
  });

  it('throws BadRequestException when the shape is neither an array nor { tickets }', () => {
    expect(() => parser.parse(JSON.stringify({ foo: 'bar' }))).toThrow(BadRequestException);
  });

  it('returns an empty array for an empty JSON array', () => {
    expect(parser.parse('[]')).toEqual([]);
  });
});
```

- [ ] **Step 4: Run the tests**

```bash
pnpm --filter api test -- json-parser
```
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add homework-2/apps/api/src/tickets/import/json-parser.service.ts homework-2/apps/api/src/tickets/import/json-parser.service.spec.ts homework-2/apps/api/test/fixtures/tickets-valid.json homework-2/apps/api/test/fixtures/tickets-malformed.json
git commit -m "feat(hw2-api): add JSON import parser"
```

---

### Task 11: XML import parser (`test_import_xml`)

**Files:**
- Create: `homework-2/apps/api/src/tickets/import/xml-parser.service.ts`
- Create: `homework-2/apps/api/src/tickets/import/xml-parser.service.spec.ts`
- Create: `homework-2/apps/api/test/fixtures/tickets-valid.xml`
- Create: `homework-2/apps/api/test/fixtures/tickets-malformed.xml`

**Interfaces:**
- Produces: `XmlParserService.parse(text: string): ImportRow[]` (throws `BadRequestException` on malformed XML or a missing `<tickets>` root). Consumed by Task 12's `ImportService`.

- [ ] **Step 1: Write `xml-parser.service.ts`**

```typescript
// homework-2/apps/api/src/tickets/import/xml-parser.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { ImportRow } from './types';

@Injectable()
export class XmlParserService {
  private readonly parser = new XMLParser({
    ignoreAttributes: true,
    trimValues: true,
    parseTagValue: false,
  });

  parse(text: string): ImportRow[] {
    const validation = XMLValidator.validate(text);
    if (validation !== true) {
      throw new BadRequestException(`Malformed XML file: ${validation.err.msg}`);
    }

    const doc = this.parser.parse(text) as { tickets?: { ticket?: unknown } };
    const root = doc.tickets;
    if (!root) {
      throw new BadRequestException('XML file must have a root <tickets><ticket>...</ticket></tickets> structure.');
    }

    const rawTickets = root.ticket;
    const list = Array.isArray(rawTickets) ? rawTickets : rawTickets ? [rawTickets] : [];
    return list.map((data, index) => ({ row: index + 1, data: data as Record<string, unknown> }));
  }
}
```

- [ ] **Step 2: Create fixtures**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<tickets>
  <ticket>
    <subject>API returning 500 errors</subject>
    <customer_name>Lena Fischer</customer_name>
    <customer_email>lena@example.com</customer_email>
    <description>Since this morning roughly 1 in 5 calls to our endpoint returns a 500 with no body.</description>
    <category>bug_report</category>
    <priority>high</priority>
  </ticket>
  <ticket>
    <subject>Thanks for the quick help</subject>
    <customer_name>Omar Haddad</customer_name>
    <customer_email>omar@example.com</customer_email>
    <description>Just wanted to say thanks, the issue was resolved in minutes, great support team.</description>
  </ticket>
</tickets>
```
Save as `homework-2/apps/api/test/fixtures/tickets-valid.xml`.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<tickets>
  <ticket>
    <subject>Unclosed tag
  </ticket>
</tickets>
```
Save as `homework-2/apps/api/test/fixtures/tickets-malformed.xml`.

- [ ] **Step 3: Write the failing tests**

```typescript
// homework-2/apps/api/src/tickets/import/xml-parser.service.spec.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import { BadRequestException } from '@nestjs/common';
import { XmlParserService } from './xml-parser.service';

const fixturesDir = join(__dirname, '../../../test/fixtures');
const validXml = readFileSync(join(fixturesDir, 'tickets-valid.xml'), 'utf-8');
const malformedXml = readFileSync(join(fixturesDir, 'tickets-malformed.xml'), 'utf-8');

describe('XmlParserService', () => {
  const parser = new XmlParserService();

  it('parses multiple <ticket> elements with 1-based row numbers', () => {
    const rows = parser.parse(validXml);
    expect(rows).toHaveLength(2);
    expect(rows[0].row).toBe(1);
    expect(rows[0].data.subject).toBe('API returning 500 errors');
  });

  it('wraps a single <ticket> element into an array of length 1', () => {
    const xml = '<tickets><ticket><subject>Solo</subject></ticket></tickets>';
    const rows = parser.parse(xml);
    expect(rows).toHaveLength(1);
    expect(rows[0].data.subject).toBe('Solo');
  });

  it('throws BadRequestException for malformed XML', () => {
    expect(() => parser.parse(malformedXml)).toThrow(BadRequestException);
  });

  it('throws BadRequestException when the <tickets> root is missing', () => {
    expect(() => parser.parse('<other><ticket><subject>X</subject></ticket></other>')).toThrow(
      BadRequestException,
    );
  });

  it('returns an empty array for an empty <tickets> root', () => {
    expect(parser.parse('<tickets></tickets>')).toEqual([]);
  });
});
```

- [ ] **Step 4: Run the tests**

```bash
pnpm --filter api test -- xml-parser
```
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add homework-2/apps/api/src/tickets/import/xml-parser.service.ts homework-2/apps/api/src/tickets/import/xml-parser.service.spec.ts homework-2/apps/api/test/fixtures/tickets-valid.xml homework-2/apps/api/test/fixtures/tickets-malformed.xml
git commit -m "feat(hw2-api): add XML import parser"
```

---

### Task 12: Import orchestration + `/tickets/import` endpoint

**Files:**
- Create: `homework-2/apps/api/src/tickets/import/import.service.ts`
- Create: `homework-2/apps/api/src/tickets/import/import.service.spec.ts`
- Modify: `homework-2/apps/api/src/tickets/tickets.controller.ts`
- Modify: `homework-2/apps/api/src/tickets/tickets.module.ts`
- Modify: `homework-2/apps/api/test/tickets.e2e-spec.ts`

**Interfaces:**
- Consumes: `CsvParserService`, `JsonParserService`, `XmlParserService`, `ImportRow` (Tasks 9-11), `TicketsService.create` (Task 7), `ClassificationService.classify` (Task 6), `CreateTicketInputSchema`, `ImportSummary` (Task 2).
- Produces: `ImportService.importFile(file: Express.Multer.File | undefined): ImportSummary`. Route: `POST /tickets/import`.

- [ ] **Step 1: Write `import.service.ts`**

```typescript
// homework-2/apps/api/src/tickets/import/import.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateTicketInputSchema, ImportSummary } from '@repo/contracts';
import { TicketsService } from '../tickets.service';
import { ClassificationService } from '../classification/classification.service';
import { CsvParserService } from './csv-parser.service';
import { JsonParserService } from './json-parser.service';
import { XmlParserService } from './xml-parser.service';
import { ImportRow } from './types';

@Injectable()
export class ImportService {
  constructor(
    private readonly csvParser: CsvParserService,
    private readonly jsonParser: JsonParserService,
    private readonly xmlParser: XmlParserService,
    private readonly ticketsService: TicketsService,
    private readonly classificationService: ClassificationService,
  ) {}

  importFile(file: Express.Multer.File | undefined): ImportSummary {
    if (!file) {
      throw new BadRequestException('No file uploaded — expected multipart field "file".');
    }

    const ext = (/\.([a-z0-9]+)$/i.exec(file.originalname)?.[1] ?? '').toLowerCase();
    const text = file.buffer.toString('utf-8');

    let rows: ImportRow[];
    if (ext === 'csv') rows = this.csvParser.parse(text);
    else if (ext === 'json') rows = this.jsonParser.parse(text);
    else if (ext === 'xml') rows = this.xmlParser.parse(text);
    else throw new BadRequestException(`Unsupported file type ".${ext || 'unknown'}" — use .csv, .json or .xml.`);

    const errors: { row: number; message: string }[] = [];
    let imported = 0;

    for (const { row, data } of rows) {
      const candidate = {
        customer_email: data.customer_email,
        customer_name: data.customer_name,
        subject: data.subject,
        description: data.description || data.subject,
        category: data.category || undefined,
        priority: data.priority || undefined,
      };
      const parsed = CreateTicketInputSchema.safeParse(candidate);
      if (!parsed.success) {
        const message = parsed.error.issues
          .map((issue) => `${issue.path.join('.') || 'value'}: ${issue.message}`)
          .join(' ');
        errors.push({ row, message });
        continue;
      }

      const input = parsed.data;
      const needsClassification = !input.category || !input.priority;
      const classification = needsClassification
        ? this.classificationService.classify(input.subject, input.description)
        : undefined;

      this.ticketsService.create(
        { ...input, tags: [...(input.tags ?? []), 'imported'] },
        classification,
      );
      imported++;
    }

    return {
      imported_count: imported,
      failed_count: errors.length,
      total_count: rows.length,
      errors,
    };
  }
}
```

- [ ] **Step 2: Write the failing tests**

```typescript
// homework-2/apps/api/src/tickets/import/import.service.spec.ts
import { ImportService } from './import.service';
import { CsvParserService } from './csv-parser.service';
import { JsonParserService } from './json-parser.service';
import { XmlParserService } from './xml-parser.service';
import { TicketsService } from '../tickets.service';
import { TicketsRepository } from '../tickets.repository';
import { ClassificationService } from '../classification/classification.service';

function makeFile(name: string, content: string): Express.Multer.File {
  return {
    originalname: name,
    buffer: Buffer.from(content, 'utf-8'),
  } as Express.Multer.File;
}

describe('ImportService', () => {
  let service: ImportService;
  let ticketsService: TicketsService;

  beforeEach(() => {
    ticketsService = new TicketsService(new TicketsRepository(), new ClassificationService());
    service = new ImportService(
      new CsvParserService(),
      new JsonParserService(),
      new XmlParserService(),
      ticketsService,
      new ClassificationService(),
    );
  });

  it('throws BadRequestException when no file is provided', () => {
    expect(() => service.importFile(undefined)).toThrow('No file uploaded');
  });

  it('throws BadRequestException for an unsupported extension', () => {
    expect(() => service.importFile(makeFile('data.txt', 'irrelevant'))).toThrow('Unsupported file type');
  });

  it('imports a valid CSV and reports the correct summary counts', () => {
    const csv = [
      'subject,customer_name,customer_email,description',
      'Cannot log in,Alice Smith,alice@example.com,I forgot my password and cannot log in at all.',
      'App crash,Bob Jones,bob@example.com,The app crashes every single time I try to open it on my phone.',
    ].join('\n');
    const summary = service.importFile(makeFile('tickets.csv', csv));
    expect(summary.imported_count).toBe(2);
    expect(summary.failed_count).toBe(0);
    expect(summary.total_count).toBe(2);
    expect(ticketsService.list({})).toHaveLength(2);
  });

  it('reports per-row errors for invalid rows without failing the whole import', () => {
    const csv = [
      'subject,customer_name,customer_email,description',
      'Cannot log in,Alice Smith,alice@example.com,I forgot my password and cannot log in at all.',
      ',Bob Jones,not-an-email,short',
    ].join('\n');
    const summary = service.importFile(makeFile('tickets.csv', csv));
    expect(summary.imported_count).toBe(1);
    expect(summary.failed_count).toBe(1);
    expect(summary.errors[0].row).toBe(3);
  });

  it('auto-classifies rows that omit category/priority', () => {
    const json = JSON.stringify([
      {
        subject: "Can't access my account",
        customer_name: 'Dana Okoro',
        customer_email: 'dana@example.com',
        description: 'I cannot log in at all, this is critical and urgent for my whole team.',
      },
    ]);
    service.importFile(makeFile('tickets.json', json));
    const [ticket] = ticketsService.list({});
    expect(ticket.category).toBe('account_access');
    expect(ticket.priority).toBe('urgent');
  });

  it('keeps explicit category/priority from the row instead of classifying', () => {
    const json = JSON.stringify([
      {
        subject: 'Random topic',
        customer_name: 'Wei Zhang',
        customer_email: 'wei@example.com',
        description: 'This text has no strong keyword signal in it at all for classification.',
        category: 'feature_request',
        priority: 'low',
      },
    ]);
    service.importFile(makeFile('tickets.json', json));
    const [ticket] = ticketsService.list({});
    expect(ticket.category).toBe('feature_request');
    expect(ticket.priority).toBe('low');
  });

  it('imports a valid XML file', () => {
    const xml =
      '<tickets><ticket><subject>API 500s</subject><customer_name>Lena F</customer_name>' +
      '<customer_email>lena@example.com</customer_email>' +
      '<description>Roughly 1 in 5 calls return a 500 with no body since this morning.</description></ticket></tickets>';
    const summary = service.importFile(makeFile('tickets.xml', xml));
    expect(summary.imported_count).toBe(1);
  });
});
```

- [ ] **Step 3: Run the import service tests**

```bash
pnpm --filter api test -- import.service
```
Expected: PASS (7 tests).

- [ ] **Step 4: Add the `/tickets/import` route to the controller**

```typescript
// homework-2/apps/api/src/tickets/tickets.controller.ts
// Add these imports at the top, alongside the existing ones:
import { HttpCode, HttpStatus, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ImportService } from './import/import.service';

// Update the constructor:
constructor(
  protected readonly ticketsService: TicketsService,
  private readonly importService: ImportService,
) {}

// Add this method to the class (order among methods doesn't matter):
@Post('import')
@HttpCode(HttpStatus.CREATED)
@UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
importTickets(@UploadedFile() file: Express.Multer.File) {
  return this.importService.importFile(file);
}
```

Apply this as a real edit to the existing file — merge the new imports with the existing import block (don't duplicate `HttpCode`/`HttpStatus`/`Post`/`UseInterceptors`, which are already imported; only add `UploadedFile`), add the constructor parameter, and add the method.

- [ ] **Step 5: Register `ImportService` and its parsers in `TicketsModule`**

```typescript
// homework-2/apps/api/src/tickets/tickets.module.ts
import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { TicketsRepository } from './tickets.repository';
import { ClassificationService } from './classification/classification.service';
import { CsvParserService } from './import/csv-parser.service';
import { JsonParserService } from './import/json-parser.service';
import { XmlParserService } from './import/xml-parser.service';
import { ImportService } from './import/import.service';

@Module({
  controllers: [TicketsController],
  providers: [
    TicketsService,
    TicketsRepository,
    ClassificationService,
    CsvParserService,
    JsonParserService,
    XmlParserService,
    ImportService,
  ],
})
export class TicketsModule {}
```

- [ ] **Step 6: Add e2e tests for the import endpoint**

Append to `homework-2/apps/api/test/tickets.e2e-spec.ts` (inside the existing `describe('Tickets (e2e)', ...)` block):

```typescript
  it('imports a valid CSV file via multipart upload', async () => {
    const csv = [
      'subject,customer_name,customer_email,description',
      'Cannot log in,Alice Smith,alice@example.com,I forgot my password and cannot log in at all.',
    ].join('\n');
    const res = await request(app.getHttpServer())
      .post('/tickets/import')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from(csv), 'tickets.csv')
      .expect(201);
    expect(res.body.data.imported_count).toBe(1);
    expect(res.body.data.failed_count).toBe(0);
  });

  it('returns a 400 with per-row errors for a partially invalid CSV', async () => {
    const csv = [
      'subject,customer_name,customer_email,description',
      ',Bob Jones,not-an-email,short',
    ].join('\n');
    const res = await request(app.getHttpServer())
      .post('/tickets/import')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from(csv), 'tickets.csv')
      .expect(201);
    expect(res.body.data.failed_count).toBe(1);
    expect(res.body.data.errors[0].row).toBe(2);
  });

  it('rejects an unsupported file extension', async () => {
    const res = await request(app.getHttpServer())
      .post('/tickets/import')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('irrelevant'), 'tickets.txt')
      .expect(400);
    expect(res.body.error.message).toContain('Unsupported file type');
  });
```

- [ ] **Step 7: Run the full e2e suite**

```bash
pnpm --filter api test:e2e
```
Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
git add homework-2/apps/api/src/tickets homework-2/apps/api/test/tickets.e2e-spec.ts
git commit -m "feat(hw2-api): wire up multi-format ticket import with auto-classification"
```

---

### Task 13: Integration tests (`test_integration`)

**Files:**
- Create: `homework-2/apps/api/test/integration.e2e-spec.ts`

**Interfaces:**
- Consumes: the full stack from Tasks 1-12 (auth, tickets CRUD, classify, import). No production code changes.

- [ ] **Step 1: Write the integration tests**

```typescript
// homework-2/apps/api/test/integration.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

async function loginToken(app: INestApplication<App>): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: 'admin@ignore.com', password: '123' });
  return res.body.data.token as string;
}

describe('Integration (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    token = await loginToken(app);
  });

  afterEach(async () => {
    await app.close();
  });

  it('runs a full ticket lifecycle: create -> classify -> update -> resolve -> delete', async () => {
    const auth = (req: request.Test) => req.set('Authorization', `Bearer ${token}`);

    const created = await auth(
      request(app.getHttpServer())
        .post('/tickets')
        .send({
          customer_email: 'lifecycle@example.com',
          customer_name: 'Lifecycle Tester',
          subject: "Can't access my account",
          description: 'I cannot log in and need urgent help with this critical issue today.',
        }),
    ).expect(201);
    const id = created.body.data.id;

    const classified = await auth(request(app.getHttpServer()).post(`/tickets/${id}/classify`)).expect(201);
    expect(classified.body.data.category).toBe('account_access');

    const updated = await auth(
      request(app.getHttpServer()).patch(`/tickets/${id}`).send({ assigned_to: 'priya' }),
    ).expect(200);
    expect(updated.body.data.assigned_to).toBe('priya');

    const resolved = await auth(
      request(app.getHttpServer()).patch(`/tickets/${id}`).send({ status: 'resolved' }),
    ).expect(200);
    expect(resolved.body.data.resolved_at).not.toBeNull();

    await auth(request(app.getHttpServer()).delete(`/tickets/${id}`)).expect(204);
    await auth(request(app.getHttpServer()).get(`/tickets/${id}`)).expect(404);
  });

  it('bulk-imports tickets and verifies auto-classification ran for rows missing it', async () => {
    const json = JSON.stringify([
      {
        subject: "Can't access my account, security concern",
        customer_name: 'Integration User',
        customer_email: 'integration@example.com',
        description: 'I cannot log in at all and this looks like a critical security issue for us.',
      },
    ]);
    const res = await request(app.getHttpServer())
      .post('/tickets/import')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from(json), 'tickets.json')
      .expect(201);
    expect(res.body.data.imported_count).toBe(1);

    const list = await request(app.getHttpServer())
      .get('/tickets?q=integration@example.com')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(list.body.data[0].category).toBe('account_access');
    expect(list.body.data[0].priority).toBe('urgent');
  });

  it('handles 20 concurrent ticket creation requests without collisions', async () => {
    const requests = Array.from({ length: 20 }, (_, i) =>
      request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customer_email: `concurrent${i}@example.com`,
          customer_name: `Concurrent User ${i}`,
          subject: `Concurrent ticket ${i}`,
          description: 'This ticket was created as part of a concurrency test with 20 requests.',
        }),
    );
    const responses = await Promise.all(requests);
    responses.forEach((res) => expect(res.status).toBe(201));
    const ids = new Set(responses.map((res) => res.body.data.id));
    const numbers = new Set(responses.map((res) => res.body.data.number));
    expect(ids.size).toBe(20);
    expect(numbers.size).toBe(20);
  });

  it('filters combined by category and priority', async () => {
    const auth = (req: request.Test) => req.set('Authorization', `Bearer ${token}`);
    await auth(
      request(app.getHttpServer()).post('/tickets').send({
        customer_email: 'a@example.com',
        customer_name: 'A',
        subject: 'Billing issue',
        description: 'I have a billing question about my invoice this month, need help please.',
        category: 'billing_question',
        priority: 'urgent',
      }),
    );
    await auth(
      request(app.getHttpServer()).post('/tickets').send({
        customer_email: 'b@example.com',
        customer_name: 'B',
        subject: 'Billing issue low priority',
        description: 'I have a minor billing question about my invoice, not urgent at all.',
        category: 'billing_question',
        priority: 'low',
      }),
    );
    const res = await auth(
      request(app.getHttpServer()).get('/tickets?category=billing_question&priority=urgent'),
    ).expect(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].customer_email).toBe('a@example.com');
  });

  it('keeps /auth/login open while /tickets stays protected', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@ignore.com', password: '123' })
      .expect(200);
    await request(app.getHttpServer()).get('/tickets').expect(401);
  });
});
```

- [ ] **Step 2: Run the integration tests**

```bash
pnpm --filter api test:e2e -- integration
```
Expected: PASS (5 tests).

- [ ] **Step 3: Commit**

```bash
git add homework-2/apps/api/test/integration.e2e-spec.ts
git commit -m "test(hw2-api): add end-to-end integration tests"
```

---

### Task 14: Performance benchmarks (`test_performance`)

**Files:**
- Create: `homework-2/apps/api/test/performance.e2e-spec.ts`

**Interfaces:**
- Consumes: the full stack from Tasks 1-12. No production code changes. Thresholds are deliberately generous (in-memory storage is fast) to avoid CI flakiness.

- [ ] **Step 1: Write the performance tests**

```typescript
// homework-2/apps/api/test/performance.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

async function loginToken(app: INestApplication<App>): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: 'admin@ignore.com', password: '123' });
  return res.body.data.token as string;
}

describe('Performance (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    token = await loginToken(app);
  });

  afterEach(async () => {
    await app.close();
  });

  it('lists 200 tickets in under 1000ms', async () => {
    for (let i = 0; i < 200; i++) {
      await request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customer_email: `perf${i}@example.com`,
          customer_name: `Perf User ${i}`,
          subject: `Perf ticket ${i}`,
          description: 'This ticket exists purely to pad the dataset for a list performance test.',
        });
    }
    const start = Date.now();
    const res = await request(app.getHttpServer())
      .get('/tickets')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(Date.now() - start).toBeLessThan(1000);
    expect(res.body.data).toHaveLength(200);
  }, 20000);

  it('imports 100 CSV rows in under 2000ms', async () => {
    const header = 'subject,customer_name,customer_email,description';
    const rows = Array.from(
      { length: 100 },
      (_, i) => `Bulk ticket ${i},Bulk User ${i},bulk${i}@example.com,This row is part of a 100-row bulk import performance test.`,
    );
    const csv = [header, ...rows].join('\n');
    const start = Date.now();
    const res = await request(app.getHttpServer())
      .post('/tickets/import')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from(csv), 'bulk.csv')
      .expect(201);
    expect(Date.now() - start).toBeLessThan(2000);
    expect(res.body.data.imported_count).toBe(100);
  }, 20000);

  it('classifies a ticket in under 200ms', async () => {
    const created = await request(app.getHttpServer())
      .post('/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customer_email: 'classify-perf@example.com',
        customer_name: 'Classify Perf',
        subject: 'Cannot log in',
        description: 'I forgot my password and cannot log in to my account after resetting it.',
      });
    const start = Date.now();
    await request(app.getHttpServer())
      .post(`/tickets/${created.body.data.id}/classify`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);
    expect(Date.now() - start).toBeLessThan(200);
  });

  it('handles 20 concurrent GET /tickets requests in under 1500ms total', async () => {
    const start = Date.now();
    const responses = await Promise.all(
      Array.from({ length: 20 }, () =>
        request(app.getHttpServer()).get('/tickets').set('Authorization', `Bearer ${token}`),
      ),
    );
    expect(Date.now() - start).toBeLessThan(1500);
    responses.forEach((res) => expect(res.status).toBe(200));
  }, 20000);

  it('filters a 100-ticket dataset in under 500ms', async () => {
    for (let i = 0; i < 100; i++) {
      await request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customer_email: `filter${i}@example.com`,
          customer_name: `Filter User ${i}`,
          subject: `Filter ticket ${i}`,
          description: 'This ticket exists purely to pad the dataset for a filtering performance test.',
          priority: i % 2 === 0 ? 'urgent' : 'low',
        });
    }
    const start = Date.now();
    const res = await request(app.getHttpServer())
      .get('/tickets?priority=urgent')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(Date.now() - start).toBeLessThan(500);
    expect(res.body.data.length).toBe(50);
  }, 20000);
});
```

- [ ] **Step 2: Run the performance tests**

```bash
pnpm --filter api test:e2e -- performance
```
Expected: PASS (5 tests). If any threshold is flaky in your environment, widen it — the point is regression detection, not tight SLAs.

- [ ] **Step 3: Commit**

```bash
git add homework-2/apps/api/test/performance.e2e-spec.ts
git commit -m "test(hw2-api): add performance benchmark tests"
```

---

### Task 15: Coverage check and final verification

**Files:**
- Modify: none expected; only touch files if coverage gaps require additional test cases in already-created spec files.

**Interfaces:**
- Consumes: everything from Tasks 1-14.

- [ ] **Step 1: Run full unit test coverage**

```bash
pnpm --filter api test:cov
```
Expected: overall coverage >85%. Inspect `apps/api/coverage/lcov-report/index.html` (or the terminal summary) for any file under 85%.

- [ ] **Step 2: If a file is under 85%, add targeted unit tests**

Identify the uncovered branches from the coverage report (e.g., an untested error path in `import.service.ts` or `tickets.service.ts`) and add a specific test case to that file's existing `.spec.ts` covering the missing branch. Re-run Step 1 until overall coverage is >85%.

- [ ] **Step 3: Run the full test suite (unit + e2e)**

```bash
pnpm --filter api test
pnpm --filter api test:e2e
```
Expected: all PASS.

- [ ] **Step 4: Lint and build**

```bash
pnpm --filter api lint
pnpm --filter api build
```
Expected: no errors.

- [ ] **Step 5: Manual smoke test with curl**

```bash
pnpm --filter api dev &
sleep 3
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@ignore.com","password":"123"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.token')
curl -s http://localhost:3001/tickets -H "Authorization: Bearer $TOKEN"
curl -s -X POST http://localhost:3001/tickets -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"customer_email":"smoke@example.com","customer_name":"Smoke Test","subject":"Smoke test ticket","description":"Just checking the API responds correctly end to end via curl."}'
curl -s http://localhost:3001/health
kill %1
```
Expected: login returns a token; `GET /tickets` returns `{"data":[...]}`; `POST /tickets` returns 201 with the created ticket; `/health` still returns `{"status":"ok"}` unwrapped.

- [ ] **Step 6: Commit any coverage-driven test additions**

```bash
git add homework-2/apps/api
git commit -m "test(hw2-api): close coverage gaps to reach >85%"
```
(Skip this commit if Step 2 required no changes.)

---

## Self-Review Notes

- **Spec coverage:** Task 1-2 covers dependencies/contracts; Task 3-4 covers common infra + auth; Task 5 covers ticket model validation tests; Task 6 covers classification; Task 7 covers CRUD business logic; Task 8 covers the CRUD/classify HTTP surface; Tasks 9-12 cover CSV/JSON/XML import + orchestration; Task 13-14 cover integration/performance; Task 15 closes the coverage gate. All of TASKS.md's Task 1, 2, 3, 6 requirements and the design spec's endpoint table are addressed.
- **Ordering fix:** classification (Task 6) is sequenced before the tickets service (Task 7) that depends on it, so tasks can be executed strictly in numeric order with no forward jumps.
- **Type consistency:** `ImportRow`, `ClassificationResult`, `Ticket`, `CreateTicketInput`, `UpdateTicketInput`, `StoredTicket` are defined once (Tasks 2, 7, 9) and referenced by the same names/shapes in every later task.
