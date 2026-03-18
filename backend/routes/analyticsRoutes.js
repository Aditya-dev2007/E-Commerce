// routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { getDashboard, getSalesTrend, getUserAnalytics } = require('../controllers/analyticsController');

router.get('/dashboard', protect, adminOnly, getDashboard);
router.get('/sales-trend', protect, adminOnly, getSalesTrend);
router.get('/users', protect, adminOnly, getUserAnalytics);

module.exports = router;
