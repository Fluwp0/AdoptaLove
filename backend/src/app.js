const express = require('express');
const path = require('path');
const cors = require('cors');
const env = require('./config/env');
const db = require('./config/database');
const apiRoutes = require('./routes');
const { errorHandler } = require('./middlewares/errorMiddleware');
const { readUploadedFile } = require('./services/fileStorage');

const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
app.get(/^\/(?:api\/)?uploads\/(.+)$/, async (req, res, next) => {
  try {
    if (env.storage.driver !== 'r2') {
      next();
      return;
    }

    const file = await readUploadedFile(req.params[0]);

    if (!file) {
      res.status(404).json({ status: 'error', message: 'Imagen no encontrada.' });
      return;
    }

    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    if (file.etag) {
      res.setHeader('ETag', file.etag);
    }
    res.send(file.body);
  } catch (error) {
    next(error);
  }
});
if (env.storage.driver !== 'r2') {
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'AdoptaLove API' });
});

app.get('/api/health/db', async (_req, res, next) => {
  try {
    await db.query('SELECT 1 AS ok');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    error.statusCode = 500;
    error.message = 'Database connection failed';
    next(error);
  }
});

app.use('/api', apiRoutes);
app.use(errorHandler);

module.exports = app;
