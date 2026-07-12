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
    // Explicitly listen before issuing requests. supertest, when given an
    // http.Server that isn't yet listening, has each Test instance call
    // `server.listen(0)` on first use and close the server again once that
    // particular request completes. With many requests fired concurrently
    // (see the 20-concurrent-creates test below), the first request to
    // finish closes the shared server out from under the other in-flight
    // ones, producing spurious ECONNRESET errors. Listening up front avoids
    // that race for every test in this file.
    await app.listen(0);
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
