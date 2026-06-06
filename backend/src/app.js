const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const db = require('./config/database');
const apiRoutes = require('./routes');
const { errorHandler } = require('./middlewares/errorMiddleware');

const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());

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
