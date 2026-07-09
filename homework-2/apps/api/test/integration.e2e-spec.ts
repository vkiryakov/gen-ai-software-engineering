import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { Ticket } from '@repo/contracts';
import { AppModule } from '../src/app.module';

const fixture = (...parts: string[]) => readFileSync(join(__dirname, 'fixtures', ...parts));

const validTicket = {
  customer_id: 'cust-1',
  customer_email: 'ada@example.com',
  customer_name: 'Ada Lovelace',
  subject: 'Cannot log in',
  description: 'I forgot my password and cannot access my account at all.',
};

describe('Integration workflows (e2e)', () => {
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

  it('runs the complete ticket lifecycle: create → progress → resolve → delete', async () => {
    const created = await http().post('/tickets').send({ ...validTicket, auto_classify: true }).expect(201);
    const id = created.body.id as string;

    await http().put(`/tickets/${id}`).send({ status: 'in_progress', assigned_to: 'agent-7' }).expect(200);

    const resolved = await http().put(`/tickets/${id}`).send({ status: 'resolved' }).expect(200);
    expect(resolved.body.resolved_at).not.toBeNull();

    await http().delete(`/tickets/${id}`).expect(204);
    await http().get(`/tickets/${id}`).expect(404);
  });

  it('bulk imports the 50-row CSV with auto-classification applied to every row', async () => {
    const res = await http()
      .post('/tickets/import?auto_classify=true')
      .attach('file', fixture('sample_tickets.csv'), { filename: 'sample_tickets.csv', contentType: 'text/csv' })
      .expect(200);
    expect(res.body).toMatchObject({ total: 50, successful: 50, failed: 0 });

    const list = await http().get('/tickets').expect(200);
    const tickets = list.body as Ticket[];
    expect(tickets).toHaveLength(50);
    expect(tickets.every((t) => t.classification !== undefined)).toBe(true);

    // Seed index 5 of every cycle is the "production down" ticket → urgent.
    const outage = tickets.find((t) => t.subject.startsWith('Production down'));
    expect(outage?.priority).toBe('urgent');
  });

  it('bulk imports the 30-row XML happy path', async () => {
    const res = await http()
      .post('/tickets/import')
      .attach('file', fixture('sample_tickets.xml'), { filename: 'sample_tickets.xml', contentType: 'application/xml' })
      .expect(200);
    expect(res.body).toMatchObject({ total: 30, successful: 30, failed: 0 });

    const list = await http().get('/tickets').expect(200);
    expect(list.body).toHaveLength(30);
  });

  it('handles 25 concurrent creates without losing or duplicating tickets', async () => {
    // supertest's `Test` implicitly calls `server.listen(0)` the first time it sees a
    // non-listening server, then closes that server once *its own* request finishes.
    // With 25 requests fired synchronously via Promise.all, only the first `Test`
    // instance owns that listen()/close() pair — its early completion closes the
    // shared server while the other 24 requests are still in flight, producing
    // ECONNRESET. Listening once up front (so the server is already bound before any
    // `Test` is constructed) avoids the implicit listen/close entirely.
    await app.listen(0);

    const responses = await Promise.all(
      Array.from({ length: 25 }, (_, i) =>
        http().post('/tickets').send({ ...validTicket, subject: `Concurrent ticket ${i}` }),
      ),
    );
    expect(responses.every((r) => r.status === 201)).toBe(true);
    expect(new Set(responses.map((r) => (r.body as Ticket).id)).size).toBe(25);

    const list = await http().get('/tickets').expect(200);
    expect(list.body).toHaveLength(25);
  });

  it('filters by category and priority combined', async () => {
    await http().post('/tickets').send({ ...validTicket, category: 'billing_question', priority: 'high' }).expect(201);
    await http().post('/tickets').send({ ...validTicket, category: 'billing_question', priority: 'low' }).expect(201);
    await http().post('/tickets').send({ ...validTicket, category: 'bug_report', priority: 'high' }).expect(201);

    const res = await http().get('/tickets').query({ category: 'billing_question', priority: 'high' }).expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ category: 'billing_question', priority: 'high' });
  });

  it('reports partial failures row-by-row when importing invalid-rows.json', async () => {
    const res = await http()
      .post('/tickets/import')
      .attach('file', fixture('invalid', 'invalid-rows.json'), { filename: 'invalid-rows.json', contentType: 'application/json' })
      .expect(200);
    expect(res.body).toMatchObject({ total: 3, successful: 1, failed: 2 });
    expect(res.body.errors.map((e: { row: number }) => e.row)).toEqual([0, 1]);
  });
});
