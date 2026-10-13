require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const urlRoutes = require('./routes/url');
const { redirectUrl } = require('./controllers/urlController');

const app = express();
const allowedOrigins = (process.env.FRONTEND_URLS || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:5173', 'http://127.0.0.1:5173');
}

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin.replace(/\/+$/, ''))) {
      return callback(null, true);
    }
    return callback(new Error('This origin is not allowed by the API CORS policy.'));
  },
}));
app.use(express.json({ limit: '16kb' }));

app.get('/api/health', (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  return res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? 'ok' : 'unavailable',
    database: databaseConnected ? 'connected' : 'disconnected',
  });
});

app.use('/api', urlRoutes);
app.get('/:code', redirectUrl);
app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  console.error('Request failed:', err);
  return res.status(500).json({ error: 'The request could not be completed.' });
});

async function start() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI must be configured before the API can start.');
  }

  await mongoose.connect(process.env.MONGO_URI);
  const port = process.env.PORT || 5000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`URL Shortener API listening on port ${port}`);
  });
}

if (require.main === module) {
  start().catch((err) => {
    console.error('Unable to start URL Shortener API:', err);
    process.exitCode = 1;
  });
}

module.exports = { app, start };
