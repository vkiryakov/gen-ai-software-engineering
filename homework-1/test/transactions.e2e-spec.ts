import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import {
  ValidationErrorResponse,
  validationExceptionFactory,
} from '../src/common/validation-exception.factory';

describe('Transactions API (e2e)', () => {
  let app: INestApplication<App>;
  let http: App;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        stopAtFirstError: true,
        exceptionFactory: validationExceptionFactory,
      }),
    );
    await app.init();
    http = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /transactions', () => {
    it('creates a deposit and returns 201 with a generated id, ISO timestamp, and completed status', async () => {
      const res = await request(http)
        .post('/transactions')
        .send({
          toAccount: 'ACC-00001',
          amount: 500,
          currency: 'USD',
          type: 'deposit',
        })
        .expect(201);

      expect(res.body).toMatchObject({
        fromAccount: null,
        toAccount: 'ACC-00001',
        amount: 500,
        currency: 'USD',
        type: 'deposit',
        status: 'completed',
      });
      expect(res.body.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
      expect(new Date(res.body.timestamp).toISOString()).toBe(
        res.body.timestamp,
      );
    });

    it('uppercases the currency code and account numbers on the way in', async () => {
      const res = await request(http)
        .post('/transactions')
        .send({
          toAccount: 'acc-00001',
          amount: 1,
          currency: 'eur',
          type: 'deposit',
        })
        .expect(201);

      expect(res.body.currency).toBe('EUR');
      expect(res.body.toAccount).toBe('ACC-00001');
    });

    it('rejects a non-positive amount with 400 and a structured error body', async () => {
      const res = await request(http)
        .post('/transactions')
        .send({
          toAccount: 'ACC-00001',
          amount: -1,
          currency: 'USD',
          type: 'deposit',
        })
        .expect(400);

      expect(res.body).toEqual({
        error: 'Validation failed',
        details: [
          { field: 'amount', message: 'Amount must be a positive number' },
        ],
      });
    });

    it('rejects an amount with more than 2 decimal places', async () => {
      const res = await request(http)
        .post('/transactions')
        .send({
          toAccount: 'ACC-00001',
          amount: 1.234,
          currency: 'USD',
          type: 'deposit',
        })
        .expect(400);

      const body = res.body as ValidationErrorResponse;
      expect(body.details).toEqual([
        {
          field: 'amount',
          message: 'Amount must be a number with at most 2 decimal places',
        },
      ]);
    });

    it('rejects an unknown ISO 4217 currency code', async () => {
      const res = await request(http)
        .post('/transactions')
        .send({
          toAccount: 'ACC-00001',
          amount: 1,
          currency: 'XYZ',
          type: 'deposit',
        })
        .expect(400);

      const body = res.body as ValidationErrorResponse;
      expect(body.details).toEqual([
        { field: 'currency', message: 'Invalid currency code' },
      ]);
    });

    it('rejects a malformed currency string', async () => {
      const res = await request(http)
        .post('/transactions')
        .send({
          toAccount: 'ACC-00001',
          amount: 1,
          currency: 'dollars',
          type: 'deposit',
        })
        .expect(400);

      const body = res.body as ValidationErrorResponse;
      expect(body.error).toBe('Validation failed');
      expect(body.details[0]).toEqual({
        field: 'currency',
        message: 'Invalid currency code',
      });
    });

    it('rejects an account number that does not match ACC-XXXXX', async () => {
      const res = await request(http)
        .post('/transactions')
        .send({
          toAccount: 'foo-1',
          amount: 1,
          currency: 'USD',
          type: 'deposit',
        })
        .expect(400);

      const body = res.body as ValidationErrorResponse;
      expect(body.details).toEqual([
        {
          field: 'toAccount',
          message:
            'Account number must follow format ACC-XXXXX (where X is alphanumeric)',
        },
      ]);
    });

    it('reports multiple field errors in a single response', async () => {
      const res = await request(http)
        .post('/transactions')
        .send({
          toAccount: 'foo-1',
          amount: -1,
          currency: 'XYZ',
          type: 'deposit',
        })
        .expect(400);

      const body = res.body as ValidationErrorResponse;
      expect(body.error).toBe('Validation failed');
      const fields = body.details.map((d) => d.field);
      expect(fields).toEqual(
        expect.arrayContaining(['toAccount', 'amount', 'currency']),
      );
    });

    it('rejects an unknown type with 400', async () => {
      await request(http)
        .post('/transactions')
        .send({
          toAccount: 'ACC-00001',
          amount: 1,
          currency: 'USD',
          type: 'bogus',
        })
        .expect(400);
    });

    it('rejects unknown fields (whitelist) with 400', async () => {
      await request(http)
        .post('/transactions')
        .send({
          toAccount: 'ACC-00001',
          amount: 1,
          currency: 'USD',
          type: 'deposit',
          stowaway: true,
        })
        .expect(400);
    });

    it('rejects a deposit missing toAccount with 400', async () => {
      const res = await request(http)
        .post('/transactions')
        .send({ amount: 1, currency: 'USD', type: 'deposit' })
        .expect(400);

      // Service-level error: surfaced as the default Nest BadRequest body,
      // not the class-validator pipeline.
      expect(res.body.message).toContain('toAccount');
    });

    it('rejects a transfer with identical accounts with 400', async () => {
      await request(http)
        .post('/transactions')
        .send({
          fromAccount: 'ACC-00001',
          toAccount: 'ACC-00001',
          amount: 10,
          currency: 'USD',
          type: 'transfer',
        })
        .expect(400);
    });
  });

  describe('GET /transactions and GET /transactions/:id', () => {
    it('lists previously created transactions', async () => {
      const res = await request(http).get('/transactions').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('returns a single transaction by id', async () => {
      const created = await request(http)
        .post('/transactions')
        .send({
          toAccount: 'ACC-LOOK1',
          amount: 42,
          currency: 'USD',
          type: 'deposit',
        })
        .expect(201);

      const fetched = await request(http)
        .get(`/transactions/${created.body.id}`)
        .expect(200);

      expect(fetched.body).toEqual(created.body);
    });

    it('returns 404 for an unknown id', async () => {
      await request(http).get('/transactions/does-not-exist').expect(404);
    });
  });

  describe('GET /transactions filtering', () => {
    let app: INestApplication<App>;
    let http: App;

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
          stopAtFirstError: true,
          exceptionFactory: validationExceptionFactory,
        }),
      );
      await app.init();
      http = app.getHttpServer();

      // Seed a fresh app instance so the filter assertions aren't perturbed
      // by transactions created in earlier describe blocks.
      await request(http).post('/transactions').send({
        toAccount: 'ACC-FLTR1',
        amount: 100,
        currency: 'USD',
        type: 'deposit',
      });
      await request(http).post('/transactions').send({
        fromAccount: 'ACC-FLTR1',
        toAccount: 'ACC-FLTR2',
        amount: 25,
        currency: 'USD',
        type: 'transfer',
      });
      await request(http).post('/transactions').send({
        fromAccount: 'ACC-FLTR1',
        amount: 10,
        currency: 'USD',
        type: 'withdrawal',
      });
      await request(http).post('/transactions').send({
        toAccount: 'ACC-FLTR3',
        amount: 5,
        currency: 'USD',
        type: 'deposit',
      });
    });

    afterAll(async () => {
      await app.close();
    });

    it('filters by accountId (matches both sides)', async () => {
      const res = await request(http)
        .get('/transactions?accountId=ACC-FLTR1')
        .expect(200);

      const list = res.body as Array<{
        fromAccount: string;
        toAccount: string;
      }>;
      expect(list).toHaveLength(3);
      for (const tx of list) {
        expect(
          tx.fromAccount === 'ACC-FLTR1' || tx.toAccount === 'ACC-FLTR1',
        ).toBe(true);
      }
    });

    it('uppercases the accountId query parameter', async () => {
      const res = await request(http)
        .get('/transactions?accountId=acc-fltr3')
        .expect(200);

      const list = res.body as Array<{ toAccount: string }>;
      expect(list).toHaveLength(1);
      expect(list[0].toAccount).toBe('ACC-FLTR3');
    });

    it('filters by type', async () => {
      const res = await request(http)
        .get('/transactions?type=transfer&accountId=ACC-FLTR1')
        .expect(200);

      const list = res.body as Array<{ type: string }>;
      expect(list).toHaveLength(1);
      expect(list[0].type).toBe('transfer');
    });

    it('filters by inclusive date range (treats date-only bounds as full UTC days)', async () => {
      const today = new Date().toISOString().slice(0, 10);
      const res = await request(http)
        .get(`/transactions?accountId=ACC-FLTR1&from=${today}&to=${today}`)
        .expect(200);

      const list = res.body as Array<unknown>;
      expect(list).toHaveLength(3);
    });

    it('returns an empty list when the date range excludes all transactions', async () => {
      const res = await request(http)
        .get('/transactions?accountId=ACC-FLTR1&from=1970-01-01&to=1970-12-31')
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('rejects a malformed accountId with 400', async () => {
      const res = await request(http)
        .get('/transactions?accountId=not-an-account')
        .expect(400);

      const body = res.body as ValidationErrorResponse;
      expect(body.details[0].field).toBe('accountId');
    });

    it('rejects an unknown type with 400', async () => {
      await request(http).get('/transactions?type=bogus').expect(400);
    });

    it('rejects a non-ISO date in "from" with 400', async () => {
      const res = await request(http)
        .get('/transactions?from=not-a-date')
        .expect(400);

      const body = res.body as ValidationErrorResponse;
      expect(body.details[0].field).toBe('from');
    });
  });

  describe('GET /accounts/:accountId/balance', () => {
    it('returns per-currency balances reconciled from completed transactions', async () => {
      const post = (body: Record<string, unknown>) =>
        request(http).post('/transactions').send(body).expect(201);

      await post({
        toAccount: 'ACC-ZZZZ1',
        amount: 1000,
        currency: 'USD',
        type: 'deposit',
      });
      await post({
        fromAccount: 'ACC-ZZZZ1',
        toAccount: 'ACC-YYYY1',
        amount: 300,
        currency: 'USD',
        type: 'transfer',
      });
      await post({
        fromAccount: 'ACC-ZZZZ1',
        amount: 100,
        currency: 'USD',
        type: 'withdrawal',
      });
      await post({
        toAccount: 'ACC-ZZZZ1',
        amount: 50,
        currency: 'EUR',
        type: 'deposit',
      });

      const res = await request(http)
        .get('/accounts/ACC-ZZZZ1/balance')
        .expect(200);

      expect(res.body).toEqual({
        accountId: 'ACC-ZZZZ1',
        balances: [
          { currency: 'EUR', amount: 50 },
          { currency: 'USD', amount: 600 },
        ],
      });
    });

    it('returns an empty balances list for an unknown account', async () => {
      const res = await request(http)
        .get('/accounts/never-seen/balance')
        .expect(200);

      expect(res.body).toEqual({
        accountId: 'never-seen',
        balances: [],
      });
    });
  });

  describe('GET /accounts/:accountId/interest', () => {
    it('computes simple interest per currency from the current balance', async () => {
      const post = (body: Record<string, unknown>) =>
        request(http).post('/transactions').send(body).expect(201);

      await post({
        toAccount: 'ACC-INT01',
        amount: 1000,
        currency: 'USD',
        type: 'deposit',
      });
      await post({
        toAccount: 'ACC-INT01',
        amount: 500,
        currency: 'EUR',
        type: 'deposit',
      });

      const res = await request(http)
        .get('/accounts/ACC-INT01/interest?rate=0.05&days=30')
        .expect(200);

      // 1000 * 0.05 * 30/365 = 4.1095... → 4.11
      //  500 * 0.05 * 30/365 = 2.0547... → 2.05
      expect(res.body).toEqual({
        accountId: 'ACC-INT01',
        rate: 0.05,
        days: 30,
        breakdown: [
          { currency: 'EUR', balance: 500, interest: 2.05 },
          { currency: 'USD', balance: 1000, interest: 4.11 },
        ],
      });
    });

    it('returns an empty breakdown for an unknown account', async () => {
      const res = await request(http)
        .get('/accounts/ACC-NONE9/interest?rate=0.05&days=30')
        .expect(200);

      expect(res.body).toEqual({
        accountId: 'ACC-NONE9',
        rate: 0.05,
        days: 30,
        breakdown: [],
      });
    });

    it('rejects a non-positive rate with 400 and a structured error body', async () => {
      const res = await request(http)
        .get('/accounts/ACC-INT01/interest?rate=0&days=30')
        .expect(400);

      const body = res.body as ValidationErrorResponse;
      expect(body.error).toBe('Validation failed');
      expect(body.details[0]).toEqual({
        field: 'rate',
        message: 'Rate must be a positive number',
      });
    });

    it('rejects a non-integer days value with 400', async () => {
      const res = await request(http)
        .get('/accounts/ACC-INT01/interest?rate=0.05&days=1.5')
        .expect(400);

      const body = res.body as ValidationErrorResponse;
      expect(body.details[0].field).toBe('days');
    });

    it('rejects a missing rate with 400', async () => {
      const res = await request(http)
        .get('/accounts/ACC-INT01/interest?days=30')
        .expect(400);

      const body = res.body as ValidationErrorResponse;
      expect(body.details.map((d) => d.field)).toContain('rate');
    });
  });
});
