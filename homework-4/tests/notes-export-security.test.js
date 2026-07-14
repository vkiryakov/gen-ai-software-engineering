'use strict';

/**
 * Regression tests for Bug 001, Changes 5 & 6 (see
 * context/bugs/001/fix-summary.md): GET /api/notes/export no longer shells
 * out via child_process.exec with an unescaped, user-controlled filename
 * (OS command injection / path traversal). It now sanitizes the filename
 * with path.basename() and writes the export via fs.writeFile().
 *
 * `fs` is mocked so every test does zero real filesystem I/O (FIRST: Fast).
 * The mock is configured once and cleared between tests (FIRST: Independent)
 * so behavior from one test can never leak into another.
 */

jest.mock('fs');

const path = require('path');
const fs = require('fs');
const request = require('supertest');
const createApp = require('../src/app');

const EXPORTS_DIR = path.join(__dirname, '..', 'exports');

describe('Bug 001 - Changes 5 & 6: /export path traversal & command injection fix', () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(true);
    fs.mkdirSync.mockReturnValue(undefined);
    fs.writeFile.mockImplementation((_filePath, _data, cb) => cb(null));
  });

  test('sanitizes a path-traversal filename to stay inside the exports dir (regression)', async () => {
    const res = await request(app)
      .get('/api/notes/export')
      .query({ filename: '../../../etc/evil.json' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ exported: 'evil.json' });
    expect(fs.writeFile).toHaveBeenCalledTimes(1);
    const [writtenPath] = fs.writeFile.mock.calls[0];
    expect(writtenPath).toBe(path.join(EXPORTS_DIR, 'evil.json'));
    expect(writtenPath.includes('..')).toBe(false);
  });

  test('never shells out for a filename containing shell metacharacters (regression)', async () => {
    const res = await request(app)
      .get('/api/notes/export')
      .query({ filename: 'x;touch /tmp/pwned;.json' });

    expect(res.status).toBe(200);
    expect(fs.writeFile).toHaveBeenCalledTimes(1);
    const [writtenPath, payload] = fs.writeFile.mock.calls[0];
    // path.basename() strips everything up to the last "/", so the write
    // target can never fall outside EXPORTS_DIR regardless of the
    // shell-like characters present in the original query value, and
    // fs.writeFile (not a shell) is the only thing ever invoked.
    expect(path.dirname(writtenPath)).toBe(EXPORTS_DIR);
    expect(typeof payload).toBe('string');
  });

  test('uses the default filename when none is supplied', async () => {
    const res = await request(app).get('/api/notes/export');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ exported: 'notes-export.json' });
    expect(fs.writeFile.mock.calls[0][0]).toBe(path.join(EXPORTS_DIR, 'notes-export.json'));
  });

  test('creates the exports directory when it does not already exist', async () => {
    fs.existsSync.mockReturnValue(false);

    await request(app).get('/api/notes/export');

    expect(fs.mkdirSync).toHaveBeenCalledWith(EXPORTS_DIR, { recursive: true });
  });

  test('returns 500 with an error body when the write fails', async () => {
    fs.writeFile.mockImplementation((_filePath, _data, cb) => cb(new Error('disk full')));

    const res = await request(app).get('/api/notes/export');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('export failed');
    expect(res.body.detail).toBe('disk full');
  });
});
