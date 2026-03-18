// controllers/cartController.js - Full cart management
const { pool } = require('../config/db');

/** Get or create cart for user */
const getOrCreateCart = async (userId) => {
  let [carts] = await pool.execute(
    'SELECT id FROM carts WHERE user_id = ? AND status = "active"',
    [userId]
  );
  if (!carts.length) {
    const [result] = await pool.execute('INSERT INTO carts (user_id) VALUES (?)', [userId]);
    return result.insertId;
  }
  return carts[0].id;
};

/**
 * GET /api/cart
 */
const getCart = async (req, res) => {
  try {
    const cartId = await getOrCreateCart(req.user.id);

    const [items] = await pool.execute(
      `SELECT ci.id, ci.product_id, ci.quantity,
              p.name, p.thumbnail, p.base_price, p.stock_quantity, p.is_active,
              c.name AS category_name,
              COALESCE((
                SELECT SUM(oi.quantity) FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
                WHERE oi.product_id = p.id
                AND o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
              ), 0) AS recent_orders
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE ci.cart_id = ?
       ORDER BY ci.created_at DESC`,
      [cartId]
    );

    // Apply dynamic pricing
    const enrichedItems = items.map(item => {
      const demand = item.recent_orders;
      let price = parseFloat(item.base_price);
      if (demand >= 10) price *= Math.min(1.20, 1 + (demand - 10) * 0.01);
      if (item.stock_quantity > 100) price *= 0.85;
      else if (item.stock_quantity <= 5 && item.stock_quantity > 0) price *= 1.10;

      return {
        ...item,
        unit_price: Math.round(price * 100) / 100,
        subtotal: Math.round(price * item.quantity * 100) / 100,
      };
    });

    const subtotal = enrichedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const totalItems = enrichedItems.reduce((sum, item) => sum + item.quantity, 0);
    const shipping = subtotal >= 499 ? 0 : 49;
    const tax = Math.round(subtotal * 0.18 * 100) / 100; // 18% GST
    const total = Math.round((subtotal + shipping + tax) * 100) / 100;

    res.json({
      success: true,
      data: {
        cart_id: cartId,
        items: enrichedItems,
        summary: { subtotal: Math.round(subtotal * 100) / 100, shipping, tax, total, total_items: totalItems },
      },
    });
  } catch (error) {
    console.error('GetCart error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch cart' });
  }
};

/**
 * POST /api/cart/add
 */
const addToCart = async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    const cartId = await getOrCreateCart(req.user.id);

    // Validate product and stock
    const [products] = await pool.execute(
      'SELECT id, name, stock_quantity, is_active FROM products WHERE id = ?',
      [product_id]
    );
    if (!products.length || !products[0].is_active) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (products[0].stock_quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${products[0].stock_quantity} items available in stock`,
      });
    }

    // Check if already in cart
    const [existing] = await pool.execute(
      'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?',
      [cartId, product_id]
    );

    if (existing.length) {
      const newQty = existing[0].quantity + parseInt(quantity);
      if (newQty > products[0].stock_quantity) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more. Only ${products[0].stock_quantity} in stock`,
        });
      }
      await pool.execute('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existing[0].id]);
    } else {
      await pool.execute(
        'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)',
        [cartId, product_id, quantity]
      );
    }

    res.json({ success: true, message: 'Item added to cart' });
  } catch (error) {
    console.error('AddToCart error:', error);
    res.status(500).json({ success: false, message: 'Failed to add to cart' });
  }
};

/**
 * PUT /api/cart/update/:itemId
 */
const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { itemId } = req.params;

    if (parseInt(quantity) === 0) {
      await pool.execute('DELETE FROM cart_items WHERE id = ?', [itemId]);
      return res.json({ success: true, message: 'Item removed from cart' });
    }

    // Validate stock
    const [items] = await pool.execute(
      `SELECT ci.id, p.stock_quantity FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       JOIN carts c ON ci.cart_id = c.id
       WHERE ci.id = ? AND c.user_id = ?`,
      [itemId, req.user.id]
    );

    if (!items.length) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    if (items[0].stock_quantity < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    await pool.execute('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, itemId]);
    res.json({ success: true, message: 'Cart updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update cart' });
  }
};

/**
 * DELETE /api/cart/remove/:itemId
 */
const removeCartItem = async (req, res) => {
  try {
    await pool.execute(
      `DELETE ci FROM cart_items ci
       JOIN carts c ON ci.cart_id = c.id
       WHERE ci.id = ? AND c.user_id = ?`,
      [req.params.itemId, req.user.id]
    );
    res.json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove item' });
  }
};

/**
 * DELETE /api/cart/clear
 */
const clearCart = async (req, res) => {
  try {
    const [carts] = await pool.execute(
      'SELECT id FROM carts WHERE user_id = ? AND status = "active"',
      [req.user.id]
    );
    if (carts.length) {
      await pool.execute('DELETE FROM cart_items WHERE cart_id = ?', [carts[0].id]);
    }
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to clear cart' });
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
