// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { placeOrder, getOrders, getOrder, updateOrderStatus, getAllOrders } = require('../controllers/orderController');

router.post('/place', protect, placeOrder);
router.get('/', protect, getOrders);
router.get('/admin/all', protect, adminOnly, getAllOrders);
router.get('/:id', protect, getOrder);
router.put('/:id/status', protect, adminOnly, updateOrderStatus);

module.exports = router;
