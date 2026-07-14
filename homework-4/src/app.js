const express = require('express');
const notesRouter = require('./routes/notes');

function createApp() {
  const app = express();
  app.use(express.json());

  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/notes', notesRouter);

  return app;
}

module.exports = createApp;
