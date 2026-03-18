// controllers/orderController.js - Order placement, tracking, management
const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/** Dynamic price helper */
const getDynamicPrice = (basePrice, stockQty, recentOrders) => {
  let price = parseFloat(basePrice);
  if (recentOrders >= 10) price *= Math.min(1.20, 1 + (recentOrders - 10) * 0.01);
  if (stockQty > 100) price *= 0.85;
  else if (stockQty <= 5 && stockQty > 0) price *= 1.10;
  return Math.round(price * 100) / 100;
};

/**
 * POST /api/orders/place - Place order from cart
 */
const placeOrder = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { shipping_address, payment_method = 'cod', coupon_code } = req.body;

    // Get active cart
    const [carts] = await conn.execute(
      'SELECT id FROM carts WHERE user_id = ? AND status = "active"',
      [req.user.id]
    );
    if (!carts.length) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const cartId = carts[0].id;

    // Get cart items with product details
    const [items] = await conn.execute(
      `SELECT ci.product_id, ci.quantity,
              p.name, p.base_price, p.stock_quantity,
              COALESCE((
                SELECT SUM(oi.quantity) FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
                WHERE oi.product_id = p.id
                AND o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
              ), 0) AS recent_orders
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = ?`,
      [cartId]
    );

    if (!items.length) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Validate stock and calculate totals
    for (const item of items) {
      if (item.stock_quantity < item.quantity) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${item.name}". Available: ${item.stock_quantity}`,
        });
      }
    }

    const subtotal = items.reduce((sum, item) => {
      const price = getDynamicPrice(item.base_price, item.stock_quantity, item.recent_orders);
      return sum + price * item.quantity;
    }, 0);

    const shipping = subtotal >= 499 ? 0 : 49;
    const tax = Math.round(subtotal * 0.18 * 100) / 100;
    const totalAmount = Math.round((subtotal + shipping + tax) * 100) / 100;
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create order
    const [orderResult] = await conn.execute(
      `INSERT INTO orders (user_id, order_number, subtotal, shipping_cost, tax_amount,
       total_amount, shipping_address, payment_method, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'placed')`,
      [req.user.id, orderNumber, Math.round(subtotal * 100) / 100,
       shipping, tax, totalAmount, JSON.stringify(shipping_address), payment_method]
    );

    const orderId = orderResult.insertId;

    // Insert order items and reduce stock
    for (const item of items) {
      const price = getDynamicPrice(item.base_price, item.stock_quantity, item.recent_orders);
      await conn.execute(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, price, Math.round(price * item.quantity * 100) / 100]
      );

      // Reduce stock
      await conn.execute(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // Insert first tracking event
    await conn.execute(
      `INSERT INTO order_tracking (order_id, status, message, location)
       VALUES (?, 'placed', 'Order placed successfully. Payment pending.', 'Online')`,
      [orderId]
    );

    // Mark cart as completed
    await conn.execute('UPDATE carts SET status = "completed" WHERE id = ?', [cartId]);

    await conn.commit();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      data: { order_id: orderId, order_number: orderNumber, total_amount: totalAmount },
    });
  } catch (error) {
    await conn.rollback();
    console.error('PlaceOrder error:', error);
    res.status(500).json({ success: false, message: 'Failed to place order' });
  } finally {
    conn.release();
  }
};

/**
 * GET /api/orders - User's orders
 */
const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = ['o.user_id = ?'];
    const params = [req.user.id];

    if (status) { conditions.push('o.status = ?'); params.push(status); }

    const [orders] = await pool.execute(
      `SELECT o.id, o.order_number, o.status, o.total_amount, o.payment_method,
              o.created_at, o.updated_at,
              COUNT(oi.id) AS item_count
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE ${conditions.join(' AND ')}
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) AS total FROM orders o WHERE ${conditions.join(' AND ')}`,
      params
    );

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page), limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

/**
 * GET /api/orders/:id - Single order with tracking
 */
const getOrder = async (req, res) => {
  try {
    const [orders] = await pool.execute(
      `SELECT o.*, u.name AS user_name, u.email AS user_email
       FROM orders o JOIN users u ON o.user_id = u.id
       WHERE o.id = ? AND (o.user_id = ? OR ? = 'admin')`,
      [req.params.id, req.user.id, req.user.role]
    );

    if (!orders.length) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = orders[0];
    try { order.shipping_address = JSON.parse(order.shipping_address); } catch {}

    const [items] = await pool.execute(
      `SELECT oi.*, p.name AS product_name, p.thumbnail AS product_thumbnail
       FROM order_items oi JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [order.id]
    );

    const [tracking] = await pool.execute(
      `SELECT * FROM order_tracking WHERE order_id = ? ORDER BY created_at ASC`,
      [order.id]
    );

    res.json({ success: true, data: { ...order, items, tracking } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch order' });
  }
};

/**
 * PUT /api/orders/:id/status - Update order status (admin)
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { status, message, location } = req.body;
    const validStatuses = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    await pool.execute('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);

    const statusMessages = {
      confirmed: 'Order confirmed and being processed',
      packed: 'Your order has been packed',
      shipped: 'Your order is on its way',
      out_for_delivery: 'Out for delivery today!',
      delivered: 'Order delivered successfully',
      cancelled: 'Order cancelled',
    };

    await pool.execute(
      'INSERT INTO order_tracking (order_id, status, message, location) VALUES (?, ?, ?, ?)',
      [req.params.id, status, message || statusMessages[status] || `Status updated to ${status}`, location || null]
    );

    res.json({ success: true, message: 'Order status updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
};

/**
 * GET /api/orders/admin/all - All orders (admin)
 */
const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = status ? ['o.status = ?'] : [];
    const params = status ? [status] : [];

    const [orders] = await pool.execute(
      `SELECT o.id, o.order_number, o.status, o.total_amount, o.payment_method,
              o.created_at, u.name AS user_name, u.email AS user_email,
              COUNT(oi.id) AS item_count
       FROM orders o
       JOIN users u ON o.user_id = u.id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

module.exports = { placeOrder, getOrders, getOrder, updateOrderStatus, getAllOrders };
