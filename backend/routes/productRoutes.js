// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getProducts, getProduct, getTrending, createProduct,
  updateProduct, deleteProduct, searchProducts, getLowStock,
} = require('../controllers/productController');

router.get('/', getProducts);
router.get('/trending', getTrending);
router.get('/search', searchProducts);
router.get('/low-stock', protect, adminOnly, getLowStock);
router.get('/:id', getProduct);
router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;
