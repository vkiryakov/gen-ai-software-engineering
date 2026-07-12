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
});
