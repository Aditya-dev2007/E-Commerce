// routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { getCategories, createCategory, updateCategory } = require('../controllers/categoryController');

router.get('/', getCategories);
router.post('/', protect, adminOnly, createCategory);
router.put('/:id', protect, adminOnly, updateCategory);

module.exports = router;
