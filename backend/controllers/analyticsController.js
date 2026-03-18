// controllers/analyticsController.js - Admin analytics dashboard
const { pool } = require('../config/db');

/**
 * GET /api/analytics/dashboard - Main dashboard stats
 */
const getDashboard = async (req, res) => {
  try {
    // Revenue stats
    const [revenueStats] = await pool.execute(
      `SELECT
        COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN total_amount ELSE 0 END), 0) AS today_revenue,
        COALESCE(SUM(CASE WHEN YEARWEEK(created_at) = YEARWEEK(NOW()) THEN total_amount ELSE 0 END), 0) AS week_revenue,
        COALESCE(SUM(CASE WHEN MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW()) THEN total_amount ELSE 0 END), 0) AS month_revenue,
        COALESCE(SUM(total_amount), 0) AS total_revenue,
        COUNT(*) AS total_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) AS completed_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled_orders,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) AS today_orders
       FROM orders WHERE status != 'cancelled'`
    );

    // User stats
    const [userStats] = await pool.execute(
      `SELECT
        COUNT(*) AS total_users,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) AS new_today,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) AS new_this_month
       FROM users WHERE role = 'customer'`
    );

    // Product stats
    const [productStats] = await pool.execute(
      `SELECT
        COUNT(*) AS total_products,
        COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) AS out_of_stock,
        COUNT(CASE WHEN stock_quantity <= 5 AND stock_quantity > 0 THEN 1 END) AS low_stock
       FROM products WHERE is_active = 1`
    );

    // Monthly revenue for chart (last 12 months)
    const [monthlyRevenue] = await pool.execute(
      `SELECT
        DATE_FORMAT(created_at, '%Y-%m') AS month,
        DATE_FORMAT(created_at, '%b %Y') AS label,
        COALESCE(SUM(total_amount), 0) AS revenue,
        COUNT(*) AS orders
       FROM orders
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH) AND status != 'cancelled'
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month ASC`
    );

    // Top selling products
    const [topProducts] = await pool.execute(
      `SELECT p.id, p.name, p.thumbnail, p.base_price,
              SUM(oi.quantity) AS total_sold,
              SUM(oi.subtotal) AS total_revenue
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status != 'cancelled'
         AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY p.id
       ORDER BY total_sold DESC
       LIMIT 5`
    );

    // Category breakdown
    const [categoryBreakdown] = await pool.execute(
      `SELECT c.name AS category, COUNT(DISTINCT p.id) AS products,
              SUM(oi.quantity) AS total_sold,
              COALESCE(SUM(oi.subtotal), 0) AS revenue
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       LEFT JOIN order_items oi ON oi.product_id = p.id
       LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
       GROUP BY c.id
       ORDER BY revenue DESC`
    );

    // Order status breakdown
    const [orderStatus] = await pool.execute(
      `SELECT status, COUNT(*) AS count FROM orders GROUP BY status`
    );

    // Daily orders for last 7 days
    const [dailyOrders] = await pool.execute(
      `SELECT DATE(created_at) AS date, COUNT(*) AS orders,
              COALESCE(SUM(total_amount), 0) AS revenue
       FROM orders
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND status != 'cancelled'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );

    res.json({
      success: true,
      data: {
        revenue: revenueStats[0],
        users: userStats[0],
        products: productStats[0],
        monthly_revenue: monthlyRevenue,
        top_products: topProducts,
        category_breakdown: categoryBreakdown,
        order_status: orderStatus,
        daily_orders: dailyOrders,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
};

/**
 * GET /api/analytics/sales-trend
 */
const getSalesTrend = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const [trend] = await pool.execute(
      `SELECT DATE(o.created_at) AS date,
              COUNT(o.id) AS orders,
              SUM(o.total_amount) AS revenue,
              COUNT(DISTINCT o.user_id) AS unique_customers
       FROM orders o
       WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) AND o.status != 'cancelled'
       GROUP BY DATE(o.created_at)
       ORDER BY date ASC`,
      [parseInt(period)]
    );
    res.json({ success: true, data: trend });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch sales trend' });
  }
};

/**
 * GET /api/analytics/users - User analytics
 */
const getUserAnalytics = async (req, res) => {
  try {
    const [topCustomers] = await pool.execute(
      `SELECT u.id, u.name, u.email,
              COUNT(o.id) AS order_count,
              SUM(o.total_amount) AS total_spent
       FROM users u
       JOIN orders o ON o.user_id = u.id AND o.status = 'delivered'
       WHERE u.role = 'customer'
       GROUP BY u.id
       ORDER BY total_spent DESC
       LIMIT 10`
    );

    res.json({ success: true, data: { top_customers: topCustomers } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user analytics' });
  }
};

module.exports = { getDashboard, getSalesTrend, getUserAnalytics };
