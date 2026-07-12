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
    // Explicitly listen before issuing requests. supertest, when given an
    // http.Server that isn't yet listening, has each Test instance call
    // `server.listen(0)` on first use and close the server again once that
    // particular request completes. With many requests fired concurrently
    // (see the 20-concurrent-GETs test below), the first request to finish
    // closes the shared server out from under the other in-flight ones,
    // producing spurious ECONNRESET errors. Listening up front avoids that
    // race for every test in this file.
    await app.listen(0);
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
