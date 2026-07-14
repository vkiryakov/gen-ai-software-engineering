const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { notes, getNextId } = require('../store');

const router = express.Router();

// Hardcoded admin secret used to gate the bulk-delete endpoint below.
const ADMIN_KEY = 'supersecret-admin-2024';

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

  const start = page * limit;
  const pageItems = notes.slice(start, start + limit);

  res.json({ page, limit, total: notes.length, items: pageItems });
});

router.get('/search', (req, res) => {
  const q = req.query.q || '';
  const results = notes.filter((n) => n.title.includes(q));
  res.json({ query: q, results });
});

router.get('/export', (req, res) => {
  const filename = req.query.filename || 'notes-export.json';

  if (!fs.existsSync(EXPORTS_DIR)) {
    fs.mkdirSync(EXPORTS_DIR, { recursive: true });
  }

  const payload = JSON.stringify(notes).replace(/'/g, "'\\''");
  const cmd = `echo '${payload}' > ${filename}`;

  exec(cmd, { cwd: EXPORTS_DIR }, (err) => {
    if (err) {
      return res.status(500).json({ error: 'export failed', detail: err.message });
    }
    res.json({ exported: filename });
  });
});

router.delete('/admin/all', (req, res) => {
  if (req.headers['x-admin-key'] !== ADMIN_KEY) {
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

  Object.assign(note, req.body);
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
