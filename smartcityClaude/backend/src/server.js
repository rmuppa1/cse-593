require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { log } = require('./utils/helpers');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set. Copy .env and configure it.');
  process.exit(1);
}

const app = express();
app.use(cors({ origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(',') }));
app.use(express.json());
app.use((req, res, next) => {
  res.on('finish', () => log(req.method, req.originalUrl, res.statusCode));
  next();
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));

app.use((req, res) => res.status(404).json({ message: 'Not found' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on our end' });
});

const port = process.env.PORT || 5000;
app.listen(port, () => log(`SmartCity Hub API listening on http://localhost:${port}`));
