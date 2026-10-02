const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
// Load environment variables
dotenv.config();
// Route imports
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/event');
const requestRoutes = require('./routes/request');
const flagRoutes = require('./routes/flags');
const app = express();
const PORT = process.env.PORT || 5000;
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/flags', flagRoutes);

// User alias route for admin
app.get('/api/users', (req, res, next) => {
  req.url = '/users';
  authRoutes(req, res, next);
});
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'SmartCity Hub API is healthy' });
});
// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});
// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});
// Start server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
