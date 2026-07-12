# Turborepo Scaffold (NestJS + Next.js) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Рабочий turborepo-монорепозиторий в `homework-2/`: NestJS API (порт 3001, `GET /health`) + Next.js web (порт 3000, страница статуса API) + общие пакеты contracts / eslint-config / typescript-config на pnpm.

**Architecture:** pnpm workspace (`apps/*`, `packages/*`) с turbo 2 как таск-раннером. Приложения генерируются официальными CLI (`@nestjs/cli`, `create-next-app`) и подключаются к общим пакетам воркспейса. `@repo/contracts` компилируется tsc в CJS (`dist/`), потребляется и NestJS, и Next.js.

**Tech Stack:** pnpm 10, turbo ^2.10, NestJS 11, Next.js 16 (App Router, Tailwind, Turbopack), TypeScript ^5.9, eslint 9 (flat config), jest 30, zod ^4.

**Spec:** `homework-2/docs/superpowers/specs/2026-07-12-turborepo-scaffold-design.md`

## Global Constraints

- Все команды выполняются из `/Users/vkiryakov/workspace/set/gen-ai-software-engineering/homework-2`, если не указано иное. Ниже этот каталог называется «корень HW2».
- Node >= 22 (локально v24), пакетный менеджер только pnpm (`packageManager: pnpm@10.16.1`).
- Имена общих пакетов: `@repo/contracts`, `@repo/eslint-config`, `@repo/typescript-config`. Приложения: `api`, `web`.
- API слушает порт 3001 (env `PORT`, дефолт 3001); web — 3000. CORS в api только для `http://localhost:3000`.
- `GET /health` отвечает ровно `{"status":"ok"}`.
- Web читает адрес API из `NEXT_PUBLIC_API_URL` (дефолт `http://localhost:3001`).
- Функциональность тикетов НЕ реализуется — только каркас.
- Коммит после каждой задачи; сообщения в стиле conventional commits.

---

### Task 1: Корень воркспейса (pnpm + turbo)

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.gitignore`
- Create: `.prettierrc`

**Interfaces:**
- Produces: workspace-глоб `apps/*`, `packages/*`; turbo-таски `build` (dependsOn `^build`), `dev` (persistent, без кеша), `lint`, `test`; корневые скрипты `pnpm dev|build|lint|test`. Все последующие задачи полагаются на них.

- [ ] **Step 1: Создать `package.json`**

```json
{
  "name": "homework-2",
  "private": true,
  "packageManager": "pnpm@10.16.1",
  "engines": {
    "node": ">=22"
  },
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\""
  },
  "devDependencies": {
    "prettier": "^3.6.0",
    "turbo": "^2.10.4"
  }
}
```

- [ ] **Step 2: Создать `pnpm-workspace.yaml`**

```yaml
packages:
  - apps/*
  - packages/*

onlyBuiltDependencies:
  - '@nestjs/core'
  - sharp
  - unrs-resolver
```

- [ ] **Step 3: Создать `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

- [ ] **Step 4: Создать `.gitignore`**

```gitignore
node_modules/
dist/
.next/
.turbo/
coverage/
*.tsbuildinfo
.env
.env.local
.DS_Store
```

- [ ] **Step 5: Создать `.prettierrc`**

```json
{
  "singleQuote": true,
  "trailingComma": "all"
}
```

- [ ] **Step 6: Проверить установку**

Run: `pnpm install`
Expected: завершается без ошибок, появляется `pnpm-lock.yaml`, `node_modules/.bin/turbo` существует.

Run: `pnpm turbo --version`
Expected: `2.10.x`

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json .gitignore .prettierrc
git commit -m "feat(hw2): scaffold pnpm workspace root with turbo"
```

---

### Task 2: Пакет @repo/typescript-config

**Files:**
- Create: `packages/typescript-config/package.json`
- Create: `packages/typescript-config/base.json`
- Create: `packages/typescript-config/nest.json`
- Create: `packages/typescript-config/next.json`

**Interfaces:**
- Produces: tsconfig-пресеты, подключаемые как `"extends": "@repo/typescript-config/base.json"` (аналогично `nest.json`, `next.json`). Используются в Task 4 (contracts), Task 5 (api), Task 6 (web).

- [ ] **Step 1: Создать `packages/typescript-config/package.json`**

```json
{
  "name": "@repo/typescript-config",
  "version": "0.0.1",
  "private": true,
  "files": ["*.json"]
}
```

- [ ] **Step 2: Создать `packages/typescript-config/base.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true
  }
}
```

- [ ] **Step 3: Создать `packages/typescript-config/nest.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2023",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "sourceMap": true,
    "incremental": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

- [ ] **Step 4: Создать `packages/typescript-config/next.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "allowJs": true,
    "noEmit": true,
    "declaration": false,
    "incremental": true
  }
}
```

- [ ] **Step 5: Проверить, что воркспейс видит пакет**

Run: `pnpm install && pnpm ls -r --depth -1`
Expected: в списке есть `@repo/typescript-config@0.0.1`.

- [ ] **Step 6: Commit**

```bash
git add packages/typescript-config pnpm-lock.yaml
git commit -m "feat(hw2): add shared typescript-config package"
```

---

### Task 3: Пакет @repo/eslint-config

**Files:**
- Create: `packages/eslint-config/package.json`
- Create: `packages/eslint-config/base.js`
- Create: `packages/eslint-config/nest.js`

**Interfaces:**
- Produces: flat-config пресеты `@repo/eslint-config/base` (js + typescript-eslint recommended + prettier) и `@repo/eslint-config/nest` (base + node/jest globals). Используются в Task 4 (contracts) и Task 5 (api). Web их НЕ использует (конфликт двух экземпляров typescript-eslint) — оставляет сгенерированный `eslint-config-next`.

- [ ] **Step 1: Создать `packages/eslint-config/package.json`**

```json
{
  "name": "@repo/eslint-config",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "exports": {
    "./base": "./base.js",
    "./nest": "./nest.js"
  },
  "dependencies": {
    "@eslint/js": "^9.30.0",
    "eslint-config-prettier": "^10.1.0",
    "globals": "^16.0.0",
    "typescript-eslint": "^8.35.0"
  },
  "devDependencies": {
    "eslint": "^9.30.0"
  }
}
```

- [ ] **Step 2: Создать `packages/eslint-config/base.js`**

```js
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
);
```

- [ ] **Step 3: Создать `packages/eslint-config/nest.js`**

```js
import globals from 'globals';
import base from './base.js';

export default [
  ...base,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },
];
```

- [ ] **Step 4: Проверить установку зависимостей**

Run: `pnpm install && pnpm ls -r --depth -1`
Expected: в списке есть `@repo/eslint-config@0.0.1`, установка без ошибок.

- [ ] **Step 5: Commit**

```bash
git add packages/eslint-config pnpm-lock.yaml
git commit -m "feat(hw2): add shared eslint-config package"
```

---

### Task 4: Пакет @repo/contracts

**Files:**
- Create: `packages/contracts/package.json`
- Create: `packages/contracts/tsconfig.json`
- Create: `packages/contracts/eslint.config.mjs`
- Create: `packages/contracts/src/index.ts`

**Interfaces:**
- Consumes: `@repo/typescript-config/base.json`, `@repo/eslint-config/base`.
- Produces: пакет `@repo/contracts` с экспортом `CONTRACTS_VERSION: string` (значение `'0.0.1'`), собранный в `dist/index.js` + `dist/index.d.ts` (CJS). Task 5 и Task 6 подключают его как `"@repo/contracts": "workspace:*"` и импортируют `CONTRACTS_VERSION`.

- [ ] **Step 1: Создать `packages/contracts/package.json`**

```json
{
  "name": "@repo/contracts",
  "version": "0.0.1",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "lint": "eslint src"
  },
  "dependencies": {
    "zod": "^4.0.0"
  },
  "devDependencies": {
    "@repo/eslint-config": "workspace:*",
    "@repo/typescript-config": "workspace:*",
    "eslint": "^9.30.0",
    "typescript": "^5.9.0"
  }
}
```

- [ ] **Step 2: Создать `packages/contracts/tsconfig.json`**

```json
{
  "extends": "@repo/typescript-config/base.json",
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2022",
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Создать `packages/contracts/eslint.config.mjs`**

```js
import base from '@repo/eslint-config/base';

export default base;
```

- [ ] **Step 4: Создать `packages/contracts/src/index.ts`**

```ts
export const CONTRACTS_VERSION = '0.0.1';
```

- [ ] **Step 5: Установить и собрать**

Run: `pnpm install && pnpm --filter @repo/contracts build`
Expected: без ошибок, появились `packages/contracts/dist/index.js` и `dist/index.d.ts`.

- [ ] **Step 6: Проверить экспорт**

Run: `node -e "console.log(require('./packages/contracts/dist/index.js').CONTRACTS_VERSION)"`
Expected: `0.0.1`

Run: `pnpm --filter @repo/contracts lint`
Expected: exit 0, без ошибок.

- [ ] **Step 7: Commit**

```bash
git add packages/contracts pnpm-lock.yaml
git commit -m "feat(hw2): add contracts package with version stub"
```

---

### Task 5: apps/api — NestJS с health-check

**Files:**
- Create: `apps/api/` (генератор `@nestjs/cli`), затем модифицировать:
- Modify: `apps/api/package.json` (полная замена, см. Step 2)
- Modify: `apps/api/tsconfig.json`, `apps/api/tsconfig.build.json`
- Modify: `apps/api/eslint.config.mjs` (полная замена)
- Delete: `apps/api/src/app.controller.ts`, `apps/api/src/app.controller.spec.ts`, `apps/api/src/app.service.ts`
- Create: `apps/api/src/health.controller.ts`
- Test: `apps/api/src/health.controller.spec.ts`
- Modify: `apps/api/src/app.module.ts`, `apps/api/src/main.ts`, `apps/api/test/app.e2e-spec.ts`
- Create: `apps/api/.env.example`

**Interfaces:**
- Consumes: `@repo/contracts` (`CONTRACTS_VERSION`), `@repo/typescript-config/nest.json`, `@repo/eslint-config/nest`.
- Produces: HTTP-сервис на `http://localhost:3001`, `GET /health` → `200 {"status":"ok"}`, CORS для `http://localhost:3000`. Скрипты пакета: `dev`, `build`, `lint`, `test`, `test:e2e`. Task 6 (web) ходит на `/health`; Task 7 проверяет всё из корня.

- [ ] **Step 1: Сгенерировать приложение**

Run (из корня HW2):
```bash
mkdir -p apps
cd apps && pnpm dlx @nestjs/cli@11 new api --package-manager pnpm --skip-git --skip-install --strict && cd ..
```
Expected: создан каталог `apps/api` со стандартной структурой (`src/main.ts`, `src/app.module.ts`, `nest-cli.json`, `test/`).

- [ ] **Step 2: Полностью заменить `apps/api/package.json`**

```json
{
  "name": "api",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "nest build",
    "dev": "nest start --watch",
    "start": "nest start",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,test}/**/*.ts\"",
    "test": "jest",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\""
  },
  "dependencies": {
    "@nestjs/common": "^11.1.28",
    "@nestjs/core": "^11.1.28",
    "@nestjs/platform-express": "^11.1.28",
    "@repo/contracts": "workspace:*",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "@nestjs/testing": "^11.1.28",
    "@repo/eslint-config": "workspace:*",
    "@repo/typescript-config": "workspace:*",
    "@types/express": "^5.0.0",
    "@types/jest": "^30.0.0",
    "@types/node": "^24.0.0",
    "@types/supertest": "^6.0.0",
    "eslint": "^9.30.0",
    "jest": "^30.0.0",
    "prettier": "^3.6.0",
    "source-map-support": "^0.5.21",
    "supertest": "^7.0.0",
    "ts-jest": "^29.4.0",
    "ts-loader": "^9.5.0",
    "ts-node": "^10.9.0",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.9.0"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": ["**/*.(t|j)s"],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
```

- [ ] **Step 3: Заменить `apps/api/tsconfig.json` и `apps/api/tsconfig.build.json`**

`apps/api/tsconfig.json`:
```json
{
  "extends": "@repo/typescript-config/nest.json",
  "compilerOptions": {
    "outDir": "./dist",
    "baseUrl": "./"
  },
  "include": ["src", "test"]
}
```

`apps/api/tsconfig.build.json`:
```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
```

- [ ] **Step 4: Заменить `apps/api/eslint.config.mjs`**

```js
import nest from '@repo/eslint-config/nest';

export default nest;
```

- [ ] **Step 5: Удалить дефолтные Hello-World файлы**

```bash
rm apps/api/src/app.controller.ts apps/api/src/app.controller.spec.ts apps/api/src/app.service.ts
```

- [ ] **Step 6: Написать падающий тест `apps/api/src/health.controller.spec.ts`**

```ts
import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns status ok', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    const controller = moduleRef.get(HealthController);

    expect(controller.getHealth()).toEqual({ status: 'ok' });
  });
});
```

- [ ] **Step 7: Установить зависимости и убедиться, что тест падает**

Run: `pnpm install && pnpm --filter api test`
Expected: FAIL — `Cannot find module './health.controller'`.

- [ ] **Step 8: Создать `apps/api/src/health.controller.ts`**

```ts
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): { status: string } {
    return { status: 'ok' };
  }
}
```

- [ ] **Step 9: Обновить `apps/api/src/app.module.ts`**

```ts
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
})
export class AppModule {}
```

- [ ] **Step 10: Убедиться, что unit-тест проходит**

Run: `pnpm --filter api test`
Expected: PASS (1 suite, 1 test).

- [ ] **Step 11: Обновить `apps/api/src/main.ts` (порт 3001 + CORS)**

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: 'http://localhost:3000' });
  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
```

- [ ] **Step 12: Обновить e2e-тест `apps/api/test/app.e2e-spec.ts`**

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppModule (e2e)', () => {
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

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });
});
```

Run: `pnpm --filter api test:e2e`
Expected: PASS.

- [ ] **Step 13: Создать `apps/api/.env.example`**

```dotenv
# Порт HTTP-сервера (дефолт 3001)
PORT=3001
```

- [ ] **Step 14: Линт и сборка**

Run: `pnpm --filter api lint && pnpm --filter api build`
Expected: оба exit 0; появился `apps/api/dist/main.js`.

- [ ] **Step 15: Smoke-проверка запуска**

Run: `node apps/api/dist/main.js & sleep 2 && curl -s http://localhost:3001/health; kill %1`
Expected: вывод `{"status":"ok"}`.

- [ ] **Step 16: Commit**

```bash
git add apps/api pnpm-lock.yaml
git commit -m "feat(hw2): add NestJS api app with health endpoint"
```

---

### Task 6: apps/web — Next.js со страницей статуса API

**Files:**
- Create: `apps/web/` (генератор `create-next-app`), затем модифицировать:
- Modify: `apps/web/package.json` (добавить `@repo/contracts` и `@repo/typescript-config`)
- Modify: `apps/web/tsconfig.json` (полная замена)
- Modify: `apps/web/app/page.tsx` (полная замена)
- Create: `apps/web/.env.example`

**Interfaces:**
- Consumes: `@repo/contracts` (`CONTRACTS_VERSION`), `@repo/typescript-config/next.json`, `GET {NEXT_PUBLIC_API_URL}/health` из Task 5.
- Produces: Next.js-приложение на `http://localhost:3000`; главная страница показывает статус API (`ok` / `unavailable`) и версию contracts. Скрипты пакета: `dev`, `build`, `start`, `lint`.

- [ ] **Step 1: Сгенерировать приложение**

Run (из корня HW2):
```bash
cd apps && pnpm dlx create-next-app@16 web --typescript --tailwind --eslint --app --no-src-dir --turbopack --import-alias "@/*" --skip-install --disable-git --yes && cd ..
```
Expected: создан каталог `apps/web` (`app/page.tsx`, `next.config.ts`, `eslint.config.mjs`, `tsconfig.json`).

- [ ] **Step 2: Добавить workspace-зависимости в `apps/web/package.json`**

В сгенерированном файле добавить в `dependencies`:
```json
"@repo/contracts": "workspace:*"
```
и в `devDependencies`:
```json
"@repo/typescript-config": "workspace:*"
```
Остальное содержимое (scripts, react, next, tailwind, eslint-config-next) не менять. Сгенерированный `eslint.config.mjs` тоже не менять — web сознательно использует `eslint-config-next`, а не `@repo/eslint-config` (см. спеку).

- [ ] **Step 3: Заменить `apps/web/tsconfig.json`**

```json
{
  "extends": "@repo/typescript-config/next.json",
  "compilerOptions": {
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Заменить `apps/web/app/page.tsx`**

```tsx
import { CONTRACTS_VERSION } from '@repo/contracts';

export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type ApiStatus = 'ok' | 'unavailable';

async function getApiStatus(): Promise<ApiStatus> {
  try {
    const res = await fetch(`${API_URL}/health`, { cache: 'no-store' });
    if (!res.ok) return 'unavailable';
    const body = (await res.json()) as { status?: string };
    return body.status === 'ok' ? 'ok' : 'unavailable';
  } catch {
    return 'unavailable';
  }
}

export default async function Home() {
  const status = await getApiStatus();
  const ok = status === 'ok';

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold">
        Homework 2 — Customer Support System
      </h1>
      <div className="flex items-center gap-3 rounded-lg border px-6 py-4">
        <span
          className={`h-3 w-3 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`}
        />
        <p className="text-lg">
          API ({API_URL}): {status}
        </p>
      </div>
      <p className="text-sm text-gray-500">contracts v{CONTRACTS_VERSION}</p>
    </main>
  );
}
```

- [ ] **Step 5: Создать `apps/web/.env.example`**

```dotenv
# Базовый URL NestJS API (дефолт http://localhost:3001)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

- [ ] **Step 6: Установить, слинтовать, собрать**

Run: `pnpm install && pnpm --filter web lint && pnpm --filter web build`
Expected: все exit 0; `next build` завершился успешно (для сборки contracts должен быть собран — если `dist/` отсутствует, сначала `pnpm --filter @repo/contracts build`).

- [ ] **Step 7: Commit**

```bash
git add apps/web pnpm-lock.yaml
git commit -m "feat(hw2): add Next.js web app with API status page"
```

---

### Task 7: Интеграция из корня + README

**Files:**
- Modify: `README.md` (корень HW2, полная замена)

**Interfaces:**
- Consumes: всё из Task 1–6.
- Produces: подтверждённые критерии приёмки спеки; README с описанием структуры и команд.

- [ ] **Step 1: Полный прогон из корня HW2**

Run: `pnpm build && pnpm lint && pnpm test`
Expected: turbo выполняет таски для `@repo/contracts`, `api`, `web` без ошибок (test — только в api: 1 suite PASS).

- [ ] **Step 2: Проверить `pnpm dev` end-to-end**

Run: `pnpm dev` в фоне; подождать до 15 секунд; затем:
```bash
curl -s http://localhost:3001/health
curl -s http://localhost:3000 | grep -o 'API ([^)]*): ok'
```
Expected: первый — `{"status":"ok"}`; второй — `API (http://localhost:3001): ok`. После проверки остановить dev-процесс.

- [ ] **Step 3: Заменить `README.md` корня HW2**

```markdown
# 🎧 Homework 2: Intelligent Customer Support System

> **Student Name**: Volodymyr Kiryakov
> **AI Tools Used**: Claude Code

Turborepo-монорепозиторий: NestJS API + Next.js web + общие пакеты.

## Структура

```
apps/
  api/                 # NestJS 11 — REST API (порт 3001), GET /health
  web/                 # Next.js 16 (App Router, Tailwind) — UI (порт 3000)
packages/
  contracts/           # @repo/contracts — zod-схемы и общие типы
  eslint-config/       # @repo/eslint-config — общие eslint-пресеты (base, nest)
  typescript-config/   # @repo/typescript-config — общие tsconfig (base, nest, next)
```

## Запуск

Требования: Node >= 22, pnpm 10.

```bash
pnpm install
pnpm dev        # api на :3001, web на :3000
```

Прочие команды: `pnpm build`, `pnpm lint`, `pnpm test`.

Переменные окружения — см. `apps/api/.env.example` и `apps/web/.env.example`.

## Статус

Каркас монорепозитория. Функциональность тикетов (CRUD, импорт CSV/JSON/XML,
автоклассификация) — следующие этапы, задание см. в `TASKS.md`.
```

Примечание: вложенный fenced-блок в README оформить с отступом или альтернативными ограждениями (` ```text `), чтобы markdown не ломался.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs(hw2): describe monorepo structure and commands in README"
```
