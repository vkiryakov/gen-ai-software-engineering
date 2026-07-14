const express = require('express');
const path = require('path');
const fs = require('fs');
const { notes, getNextId } = require('../store');

const router = express.Router();

// Admin secret must be supplied via environment variable; no insecure default.
const ADMIN_KEY = process.env.ADMIN_KEY;

const EXPORTS_DIR = path.join(__dirname, '..', '..', 'exports');

router.post('/', (req, res) => {
  const { title, body, ownerId } = req.body;
  if (!title || !ownerId) {
    return res.status(400).json({ error: 'title and ownerId are required' });
  }
  const now = new Date().toISOString();
  const note = { id: getNextId(), title, body: body || '', ownerId, createdAt: now, updatedAt: now };
  notes.push(note);
  res.status(201).json(note);
});

router.get('/', (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  const start = (page - 1) * limit;
  const pageItems = notes.slice(start, start + limit);

  res.json({ page, limit, total: notes.length, items: pageItems });
});

router.get('/search', (req, res) => {
  const q = req.query.q || '';
  const results = notes.filter((n) => n.title.toLowerCase().includes(q.toLowerCase()));
  res.json({ query: q, results });
});

router.get('/export', (req, res) => {
  const requestedFilename = req.query.filename || 'notes-export.json';
  const filename = path.basename(requestedFilename);

  if (!fs.existsSync(EXPORTS_DIR)) {
    fs.mkdirSync(EXPORTS_DIR, { recursive: true });
  }

  const payload = JSON.stringify(notes);
  const filePath = path.join(EXPORTS_DIR, filename);

  fs.writeFile(filePath, payload, (err) => {
    if (err) {
      return res.status(500).json({ error: 'export failed', detail: err.message });
    }
    res.json({ exported: filename });
  });
});

router.delete('/admin/all', (req, res) => {
  if (!ADMIN_KEY || req.headers['x-admin-key'] !== ADMIN_KEY) {
    return res.status(403).json({ error: 'forbidden' });
  }
  notes.length = 0;
  res.json({ deleted: true });
});

router.get('/:id', (req, res) => {
  const note = notes.find((n) => n.id === parseInt(req.params.id, 10));
  if (!note) return res.status(404).json({ error: 'not found' });
  res.json(note);
});

router.patch('/:id', (req, res) => {
  const note = notes.find((n) => n.id === parseInt(req.params.id, 10));
  if (!note) return res.status(404).json({ error: 'not found' });

  const { title, body } = req.body;
  if (title !== undefined) note.title = title;
  if (body !== undefined) note.body = body;
  note.updatedAt = new Date().toISOString();
  res.json(note);
});

router.delete('/:id', (req, res) => {
  const index = notes.findIndex((n) => n.id === parseInt(req.params.id, 10));
  if (index === -1) return res.status(404).json({ error: 'not found' });
  const [removed] = notes.splice(index, 1);
  res.json(removed);
});

module.exports = router;
