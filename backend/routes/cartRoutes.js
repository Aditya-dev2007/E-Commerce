// routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getCart, addToCart, updateCartItem, removeCartItem, clearCart } = require('../controllers/cartController');

router.get('/', protect, getCart);
router.post('/add', protect, addToCart);
router.put('/update/:itemId', protect, updateCartItem);
router.delete('/remove/:itemId', protect, removeCartItem);
router.delete('/clear', protect, clearCart);

module.exports = router;
