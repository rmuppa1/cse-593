import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import { ZodError } from 'zod';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import flagRoutes from './routes/flagRoutes.js';

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

app.use(cors({
  origin(origin, callback) {
    const isLocalDevelopment = process.env.NODE_ENV !== 'production'
      && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || '');
    if (!origin || allowedOrigins.includes(origin) || isLocalDevelopment) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  },
}));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'SmartCity Hub API' }));
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/flags', flagRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((error, _req, res, _next) => {
  console.error(error);
  if (error instanceof ZodError) return res.status(400).json({ message: error.issues[0]?.message || 'Invalid request', issues: error.issues });
  if (error.code === 'P2025') return res.status(404).json({ message: 'Record not found' });
  if (error.code === 'P2002') return res.status(409).json({ message: 'That record already exists' });
  res.status(500).json({ message: 'Something went wrong on our side' });
});

const port = process.env.PORT || 5003;
app.listen(port, () => console.log(`SmartCity Hub API running on http://localhost:${port}`));

