// middleware/dbGuard.js - block DB-backed routes when DB is down
const { isDbConnected } = require('../config/db');

const dbGuard = (req, res, next) => {
  // Always allow health checks even if DB is down
  if (req.path === '/health') return next();

  if (!isDbConnected()) {
    return res.status(503).json({ success: false, message: 'Database unavailable' });
  }

  next();
};

module.exports = dbGuard;

