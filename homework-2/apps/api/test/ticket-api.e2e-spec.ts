import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

const validTicket = {
  customer_id: 'cust-1',
  customer_email: 'ada@example.com',
  customer_name: 'Ada Lovelace',
  subject: 'Cannot log in',
  description: 'I forgot my password and cannot access my account at all.',
};

const CSV = `customer_id,customer_email,customer_name,subject,description
cust-9,grace@example.com,Grace Hopper,Billing question,I was charged twice on my invoice this month.`;

describe('Tickets API (e2e)', () => {
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

  it('GET /health reports ok', async () => {
    const res = await http().get('/health').expect(200);
    expect(res.body.status).toBe('ok');
  });

  it('POST /tickets creates a ticket with 201 and server-owned defaults', async () => {
    const res = await http().post('/tickets').send(validTicket).expect(201);
    expect(res.body.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(res.body.status).toBe('new');
    expect(res.body.resolved_at).toBeNull();
  });

  it('POST /tickets rejects an invalid email with 400 and field errors', async () => {
    const res = await http().post('/tickets').send({ ...validTicket, customer_email: 'nope' }).expect(400);
    expect(res.body.message).toBe('Validation failed');
    expect(res.body.errors[0].path).toBe('customer_email');
  });

  it('POST /tickets rejects unknown fields (strict contract)', async () => {
    await http().post('/tickets').send({ ...validTicket, evil: true }).expect(400);
  });

  it('POST /tickets with auto_classify stores classification provenance', async () => {
    const res = await http().post('/tickets').send({ ...validTicket, auto_classify: true }).expect(201);
    expect(res.body.category).toBe('account_access');
    expect(res.body.classification.confidence).toBeGreaterThan(0);
    expect(res.body.classification.keywords_found).toContain('password');
  });

  it('GET /tickets lists created tickets', async () => {
    await http().post('/tickets').send(validTicket).expect(201);
    const res = await http().get('/tickets').expect(200);
    expect(res.body).toHaveLength(1);
  });

  it('GET /tickets?search= filters by subject/description text', async () => {
    await http().post('/tickets').send(validTicket).expect(201);
    await http().post('/tickets').send({ ...validTicket, subject: 'Slow dashboard today' }).expect(201);
    const res = await http().get('/tickets').query({ search: 'dashboard' }).expect(200);
    expect(res.body).toHaveLength(1);
  });

  it('GET /tickets/:id returns the ticket, 404 when missing', async () => {
    const created = await http().post('/tickets').send(validTicket).expect(201);
    await http().get(`/tickets/${created.body.id}`).expect(200);
    await http().get('/tickets/e58ed763-928c-4155-bee9-fdbaaadc15f3').expect(404);
  });

  it('PUT /tickets/:id updates fields', async () => {
    const created = await http().post('/tickets').send(validTicket).expect(201);
    const res = await http().put(`/tickets/${created.body.id}`).send({ status: 'in_progress' }).expect(200);
    expect(res.body.status).toBe('in_progress');
  });

  it('PUT /tickets/:id rejects invalid payloads with 400', async () => {
    const created = await http().post('/tickets').send(validTicket).expect(201);
    await http().put(`/tickets/${created.body.id}`).send({ priority: 'apocalyptic' }).expect(400);
  });

  it('DELETE /tickets/:id returns 204 and the ticket is gone; missing id → 404', async () => {
    const created = await http().post('/tickets').send(validTicket).expect(201);
    await http().delete(`/tickets/${created.body.id}`).expect(204);
    await http().get(`/tickets/${created.body.id}`).expect(404);
    await http().delete(`/tickets/${created.body.id}`).expect(404);
  });

  it('POST /tickets/:id/auto-classify returns the result and persists it', async () => {
    const created = await http().post('/tickets').send(validTicket).expect(201);
    const res = await http().post(`/tickets/${created.body.id}/auto-classify`).expect(200);
    expect(res.body.category).toBe('account_access');
    const reloaded = await http().get(`/tickets/${created.body.id}`).expect(200);
    expect(reloaded.body.classification.category).toBe('account_access');
  });

  it('POST /tickets/import accepts a CSV upload', async () => {
    const res = await http()
      .post('/tickets/import')
      .attach('file', Buffer.from(CSV), { filename: 'tickets.csv', contentType: 'text/csv' })
      .expect(200);
    expect(res.body).toEqual({ total: 1, successful: 1, failed: 0, errors: [] });
  });

  it('POST /tickets/import rejects an undeterminable format with 400', async () => {
    await http()
      .post('/tickets/import')
      .attach('file', Buffer.from('whatever'), { filename: 'upload.tmp', contentType: 'application/pdf' })
      .expect(400);
  });

  it('POST /tickets/import rejects a malformed file with a meaningful 400', async () => {
    const res = await http()
      .post('/tickets/import')
      .attach('file', Buffer.from('{"records": [oops'), { filename: 'bad.json', contentType: 'application/json' })
      .expect(400);
    expect(res.body.message).toContain('Malformed JSON');
  });
});
