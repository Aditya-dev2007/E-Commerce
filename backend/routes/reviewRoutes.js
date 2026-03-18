// routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { addReview, getProductReviews, markHelpful } = require('../controllers/reviewController');

router.post('/', protect, addReview);
router.get('/product/:productId', getProductReviews);
router.post('/:id/helpful', protect, markHelpful);

module.exports = router;
