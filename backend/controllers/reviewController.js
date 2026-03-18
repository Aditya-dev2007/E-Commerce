// controllers/reviewController.js
const { pool } = require('../config/db');

/**
 * POST /api/reviews - Add review
 */
const addReview = async (req, res) => {
  try {
    const { product_id, rating, title, comment } = req.body;

    // Check if user purchased product
    const [purchases] = await pool.execute(
      `SELECT oi.id FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.product_id = ? AND o.user_id = ? AND o.status = 'delivered'
       LIMIT 1`,
      [product_id, req.user.id]
    );

    // Check existing review
    const [existing] = await pool.execute(
      'SELECT id FROM reviews WHERE product_id = ? AND user_id = ?',
      [product_id, req.user.id]
    );

    if (existing.length) {
      return res.status(409).json({ success: false, message: 'You already reviewed this product' });
    }

    const isVerified = purchases.length > 0 ? 1 : 0;

    const [result] = await pool.execute(
      `INSERT INTO reviews (product_id, user_id, rating, title, comment, is_verified_purchase, is_approved)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [product_id, req.user.id, rating, title, comment, isVerified]
    );

    res.status(201).json({ success: true, message: 'Review submitted', data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit review' });
  }
};

/**
 * GET /api/reviews/product/:productId
 */
const getProductReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, rating } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = ['r.product_id = ?', 'r.is_approved = 1'];
    const params = [req.params.productId];

    if (rating) { conditions.push('r.rating = ?'); params.push(rating); }

    const [reviews] = await pool.execute(
      `SELECT r.id, r.rating, r.title, r.comment, r.is_verified_purchase,
              r.helpful_votes, r.created_at,
              u.name AS user_name, u.avatar AS user_avatar
       FROM reviews r JOIN users u ON r.user_id = u.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY r.helpful_votes DESC, r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
  }
};

/**
 * POST /api/reviews/:id/helpful
 */
const markHelpful = async (req, res) => {
  try {
    await pool.execute('UPDATE reviews SET helpful_votes = helpful_votes + 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Marked as helpful' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark helpful' });
  }
};

module.exports = { addReview, getProductReviews, markHelpful };
