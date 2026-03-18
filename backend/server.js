// server.js - Main Express application entry point
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { testConnection, isDbConnected } = require('./config/db');
const dbGuard = require('./middleware/dbGuard');

const app = express();

// ─── Security Middleware ────────────────────────────────────────────────────
app.use(helmet());
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser clients (curl, server-to-server, etc.)
      if (!origin) return callback(null, true);

      // Always allow the configured frontend origin
      if (origin === allowedOrigin) return callback(null, true);

      // In development, allow any localhost/127.0.0.1 port (Vite may switch ports)
      const isDev = (process.env.NODE_ENV || 'development') === 'development';
      if (isDev) {
        const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
        if (localhostRegex.test(origin)) return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ─── Body Parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Logging ────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use('/api', dbGuard);
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Smart Store API is running',
    db: { connected: isDbConnected() },
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ─── Start Server ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const start = async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });

  // If DB is down at boot, keep retrying so it auto-recovers
  setInterval(() => {
    if (!isDbConnected()) testConnection();
  }, 5000).unref?.();
};

start();
