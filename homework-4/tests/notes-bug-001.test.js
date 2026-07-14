'use strict';

/**
 * Regression tests for Bug 001 (see context/bugs/001/fix-summary.md).
 * Covers Changes 1, 2, 3, 4, and 7 in src/routes/notes.js.
 *
 * The notes store (src/store.js) is shared, mutable, module-level state, and
 * ADMIN_KEY is captured as a module-level `const` read from process.env at
 * require time. To keep every test independent and repeatable regardless of
 * execution order (FIRST: Independent/Repeatable), each test builds its own
 * app via jest.isolateModules(), which forces a fresh require of the store
 * (pristine 12-note seed) and a fresh read of process.env.ADMIN_KEY. No test
 * can observe mutations made by another test.
 */

const request = require('supertest');

function freshApp() {
  let createApp;
  jest.isolateModules(() => {
    createApp = require('../src/app');
  });
  return createApp();
}

describe('Bug 001 - Changes 1 & 2: admin secret sourced from env, fails closed', () => {
  const originalAdminKey = process.env.ADMIN_KEY;

  afterEach(() => {
    if (originalAdminKey === undefined) delete process.env.ADMIN_KEY;
    else process.env.ADMIN_KEY = originalAdminKey;
  });

  test('rejects the old hardcoded secret now that ADMIN_KEY is not configured (security regression)', async () => {
    delete process.env.ADMIN_KEY;
    const app = freshApp();

    const res = await request(app)
      .delete('/api/notes/admin/all')
      .set('x-admin-key', 'supersecret-admin-2024');

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'forbidden' });
  });

  test('fails closed (403) when ADMIN_KEY is unset and no header is sent (regression)', async () => {
    delete process.env.ADMIN_KEY;
    const app = freshApp();

    const res = await request(app).delete('/api/notes/admin/all');

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'forbidden' });
  });

  test('allows bulk delete when the correct env-sourced key is supplied', async () => {
    process.env.ADMIN_KEY = 'test-only-secret-xyz';
    const app = freshApp();

    const res = await request(app)
      .delete('/api/notes/admin/all')
      .set('x-admin-key', 'test-only-secret-xyz');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ deleted: true });
  });

  test('rejects an incorrect key even when ADMIN_KEY is configured', async () => {
    process.env.ADMIN_KEY = 'test-only-secret-xyz';
    const app = freshApp();

    const res = await request(app)
      .delete('/api/notes/admin/all')
      .set('x-admin-key', 'wrong-key');

    expect(res.status).toBe(403);
  });
});

describe('Bug 001 - Change 3: pagination off-by-one', () => {
  test('page=1 returns the first `limit` items, not the second page (regression)', async () => {
    const app = freshApp();
    const res = await request(app).get('/api/notes').query({ page: 1, limit: 5 });

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(5);
    expect(res.body.items.map((n) => n.id)).toEqual([1, 2, 3, 4, 5]);
  });

  test('page=2 returns the next `limit` items', async () => {
    const app = freshApp();
    const res = await request(app).get('/api/notes').query({ page: 2, limit: 5 });

    expect(res.status).toBe(200);
    expect(res.body.items.map((n) => n.id)).toEqual([6, 7, 8, 9, 10]);
  });

  test('defaults to page=1, limit=10 when no query params are given', async () => {
    const app = freshApp();
    const res = await request(app).get('/api/notes');

    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(10);
    expect(res.body.items).toHaveLength(10);
    expect(res.body.items[0].id).toBe(1);
  });
});

describe('Bug 001 - Change 4: case-insensitive title search', () => {
  test('matches when the query is uppercase and the title is mixed-case (regression)', async () => {
    const app = freshApp();
    const res = await request(app).get('/api/notes/search').query({ q: 'MEETING' });

    expect(res.status).toBe(200);
    const titles = res.body.results.map((n) => n.title);
    expect(titles).toContain('Weekly Meeting Notes');
    expect(titles).toContain('Meeting Follow-up');
  });

  test('still matches when query and title case already align', async () => {
    const app = freshApp();
    const res = await request(app).get('/api/notes/search').query({ q: 'Budget' });

    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(1);
    expect(res.body.results[0].title).toBe('Budget Review');
  });

  test('returns an empty array when nothing matches', async () => {
    const app = freshApp();
    const res = await request(app).get('/api/notes/search').query({ q: 'zzz-no-match' });

    expect(res.status).toBe(200);
    expect(res.body.results).toEqual([]);
  });
});

describe('Bug 001 - Change 7: PATCH /:id allow-lists fields (mass assignment fix)', () => {
  test('ignores id and ownerId supplied in the request body (regression)', async () => {
    const app = freshApp();
    const res = await request(app)
      .patch('/api/notes/1')
      .send({ id: 999, ownerId: 'attacker', title: 'New Title' });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
    expect(res.body.ownerId).toBe('u1');
    expect(res.body.title).toBe('New Title');
  });

  test('updates title and body when they are supplied', async () => {
    const app = freshApp();
    const res = await request(app)
      .patch('/api/notes/2')
      .send({ title: 'Updated', body: 'Updated body' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated');
    expect(res.body.body).toBe('Updated body');
    expect(res.body.ownerId).toBe('u1');
  });

  test('leaves title/body unchanged when neither is supplied', async () => {
    const app = freshApp();
    const res = await request(app).patch('/api/notes/3').send({});

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Project Kickoff');
    expect(res.body.body).toBe('Align on scope and owners');
  });
});
