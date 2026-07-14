const request = require('supertest');
const createApp = require('../src/app');

describe('Notes API (baseline)', () => {
  const app = createApp();

  test('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('POST /api/notes creates a note', async () => {
    const res = await request(app)
      .post('/api/notes')
      .send({ title: 'Test note', body: 'hello', ownerId: 'u1' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Test note');
    expect(res.body.id).toBeDefined();
  });

  test('POST /api/notes requires title and ownerId', async () => {
    const res = await request(app).post('/api/notes').send({ body: 'no title' });
    expect(res.status).toBe(400);
  });

  test('GET /api/notes/:id returns 404 for missing note', async () => {
    const res = await request(app).get('/api/notes/999999');
    expect(res.status).toBe(404);
  });

  test('DELETE /api/notes/admin/all requires the admin key', async () => {
    const res = await request(app).delete('/api/notes/admin/all');
    expect(res.status).toBe(403);
  });
});
