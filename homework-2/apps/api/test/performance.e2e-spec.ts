import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ClassificationService } from '../src/tickets/classification.service';
import { TicketsService } from '../src/tickets/tickets.service';

const validTicket = {
  customer_id: 'cust-1',
  customer_email: 'ada@example.com',
  customer_name: 'Ada Lovelace',
  subject: 'Cannot log in',
  description: 'I forgot my password and cannot access my account at all.',
};

describe('Performance benchmarks (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());
  const timed = async (label: string, fn: () => Promise<void> | void): Promise<number> => {
    const start = Date.now();
    await fn();
    const ms = Date.now() - start;
    console.log(`[benchmark] ${label}: ${ms}ms`);
    return ms;
  };

  it('creates 100 tickets over HTTP in under 2s', async () => {
    const ms = await timed('create 100 tickets (HTTP, sequential)', async () => {
      for (let i = 0; i < 100; i++) {
        await http().post('/tickets').send({ ...validTicket, subject: `Perf ticket ${i}` }).expect(201);
      }
    });
    expect(ms).toBeLessThan(2000);
  });

  it('imports the 50-row CSV in under 1s', async () => {
    const csv = readFileSync(join(__dirname, 'fixtures', 'sample_tickets.csv'));
    const ms = await timed('import 50-row CSV', async () => {
      await http()
        .post('/tickets/import?auto_classify=true')
        .attach('file', csv, { filename: 'sample_tickets.csv', contentType: 'text/csv' })
        .expect(200);
    });
    expect(ms).toBeLessThan(1000);
  });

  it('filters a 1000-ticket store in under 300ms', async () => {
    const service = app.get(TicketsService);
    for (let i = 0; i < 1000; i++) {
      service.create({ ...validTicket, subject: `Seed ${i}`, category: i % 2 ? 'bug_report' : 'billing_question', priority: i % 3 ? 'medium' : 'high' });
    }
    const ms = await timed('filtered list over 1000 tickets', async () => {
      await http().get('/tickets').query({ category: 'billing_question', priority: 'high', search: 'Seed' }).expect(200);
    });
    expect(ms).toBeLessThan(300);
  });

  it('classifies 1000 texts in under 500ms', async () => {
    const classifier = app.get(ClassificationService);
    const ms = await timed('classify 1000 texts (in-process)', () => {
      for (let i = 0; i < 1000; i++) {
        classifier.classify(`Ticket ${i} critical bug`, 'The production down error is blocking everyone, need refund');
      }
    });
    expect(ms).toBeLessThan(500);
  });

  it('serves 20 concurrent requests in under 1.5s', async () => {
    // Prevent ECONNRESET: listen once up front so the server is already bound
    // before constructing any supertest requests.
    await app.listen(0);

    const ms = await timed('20 concurrent creates', async () => {
      const responses = await Promise.all(
        Array.from({ length: 20 }, (_, i) =>
          http().post('/tickets').send({ ...validTicket, subject: `Burst ${i}` }),
        ),
      );
      if (!responses.every((r) => r.status === 201)) throw new Error('non-201 in burst');
    });
    expect(ms).toBeLessThan(1500);
  });
});
