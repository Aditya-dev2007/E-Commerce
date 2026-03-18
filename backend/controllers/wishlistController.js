// controllers/wishlistController.js
const { pool } = require('../config/db');

const getWishlist = async (req, res) => {
  try {
    const [items] = await pool.execute(
      `SELECT w.id, w.created_at, p.id AS product_id, p.name, p.base_price,
              p.thumbnail, p.stock_quantity, c.name AS category_name,
              COALESCE(AVG(r.rating), 0) AS avg_rating
       FROM wishlists w
       JOIN products p ON w.product_id = p.id
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN reviews r ON r.product_id = p.id AND r.is_approved = 1
       WHERE w.user_id = ? AND p.is_active = 1
       GROUP BY w.id, p.id
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch wishlist' });
  }
};

const addToWishlist = async (req, res) => {
  try {
    const { product_id } = req.body;

    const [existing] = await pool.execute(
      'SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?',
      [req.user.id, product_id]
    );

    if (existing.length) {
      return res.status(409).json({ success: false, message: 'Already in wishlist' });
    }

    await pool.execute('INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)', [req.user.id, product_id]);
    res.status(201).json({ success: true, message: 'Added to wishlist' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add to wishlist' });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    await pool.execute('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?', [req.user.id, req.params.productId]);
    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove from wishlist' });
  }
};

const moveToCart = async (req, res) => {
  try {
    const { product_id } = req.body;

    let [carts] = await pool.execute('SELECT id FROM carts WHERE user_id = ? AND status = "active"', [req.user.id]);
    if (!carts.length) {
      const [r] = await pool.execute('INSERT INTO carts (user_id) VALUES (?)', [req.user.id]);
      carts = [{ id: r.insertId }];
    }

    const [existing] = await pool.execute(
      'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?',
      [carts[0].id, product_id]
    );

    if (existing.length) {
      await pool.execute('UPDATE cart_items SET quantity = quantity + 1 WHERE id = ?', [existing[0].id]);
    } else {
      await pool.execute('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, 1)', [carts[0].id, product_id]);
    }

    await pool.execute('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?', [req.user.id, product_id]);
    res.json({ success: true, message: 'Moved to cart' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to move to cart' });
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist, moveToCart };
