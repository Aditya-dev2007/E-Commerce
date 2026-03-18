// controllers/productController.js - Full product CRUD + dynamic pricing
const { pool } = require('../config/db');

/** Dynamic Pricing Engine */
const calculateDynamicPrice = (basePrice, stockQty, recentOrders) => {
  let price = parseFloat(basePrice);
  const DEMAND_THRESHOLD = parseInt(process.env.DEMAND_THRESHOLD) || 10;
  const STOCK_LOW_THRESHOLD = parseInt(process.env.STOCK_LOW_THRESHOLD) || 5;

  // High demand → increase price up to 20%
  if (recentOrders >= DEMAND_THRESHOLD) {
    const demandMultiplier = Math.min(1.20, 1 + (recentOrders - DEMAND_THRESHOLD) * 0.01);
    price *= demandMultiplier;
  }

  // High stock → decrease price up to 15%
  if (stockQty > 100) {
    price *= 0.85;
  } else if (stockQty <= STOCK_LOW_THRESHOLD && stockQty > 0) {
    // Low stock scarcity pricing → increase 10%
    price *= 1.10;
  }

  return Math.round(price * 100) / 100;
};

/**
 * GET /api/products - List with filters, sorting, pagination
 */
const getProducts = async (req, res) => {
  try {
    const {
      page = 1, limit = 12, category, search, sort = 'newest',
      minPrice, maxPrice, inStock, featured,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = ['p.is_active = 1'];
    const params = [];

    if (category) { conditions.push('c.slug = ?'); params.push(category); }
    if (search) { conditions.push('(p.name LIKE ? OR p.description LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
    if (minPrice) { conditions.push('p.base_price >= ?'); params.push(parseFloat(minPrice)); }
    if (maxPrice) { conditions.push('p.base_price <= ?'); params.push(parseFloat(maxPrice)); }
    if (inStock === 'true') { conditions.push('p.stock_quantity > 0'); }
    if (featured === 'true') { conditions.push('p.is_featured = 1'); }

    const sortMap = {
      newest: 'p.created_at DESC',
      oldest: 'p.created_at ASC',
      price_asc: 'p.base_price ASC',
      price_desc: 'p.base_price DESC',
      rating: 'avg_rating DESC',
      popular: 'total_orders DESC',
    };
    const orderBy = sortMap[sort] || 'p.created_at DESC';

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count query
    const [countResult] = await pool.execute(
      `SELECT COUNT(DISTINCT p.id) AS total
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ${whereClause}`,
      params
    );

    // Main query with recent orders for dynamic pricing
    const [products] = await pool.execute(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug,
              COALESCE(AVG(r.rating), 0) AS avg_rating,
              COUNT(DISTINCT r.id) AS review_count,
              COALESCE(SUM(oi.quantity), 0) AS total_orders,
              COALESCE((
                SELECT SUM(oi2.quantity) FROM order_items oi2
                JOIN orders o2 ON oi2.order_id = o2.id
                WHERE oi2.product_id = p.id
                AND o2.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
              ), 0) AS recent_orders
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN reviews r ON r.product_id = p.id AND r.is_approved = 1
       LEFT JOIN order_items oi ON oi.product_id = p.id
       ${whereClause}
       GROUP BY p.id
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const enriched = products.map(p => ({
      ...p,
      dynamic_price: calculateDynamicPrice(p.base_price, p.stock_quantity, p.recent_orders),
      is_low_stock: p.stock_quantity > 0 && p.stock_quantity <= 5,
    }));

    const total = countResult[0].total;

    res.json({
      success: true,
      data: enriched,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('GetProducts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
};

/**
 * GET /api/products/:id - Single product with recommendations
 */
const getProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const [products] = await pool.execute(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug,
              COALESCE(AVG(r.rating), 0) AS avg_rating,
              COUNT(DISTINCT r.id) AS review_count,
              COALESCE((
                SELECT SUM(oi.quantity) FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
                WHERE oi.product_id = p.id
                AND o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
              ), 0) AS recent_orders
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN reviews r ON r.product_id = p.id AND r.is_approved = 1
       WHERE p.id = ? AND p.is_active = 1
       GROUP BY p.id`,
      [id]
    );

    if (!products.length) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const product = products[0];
    product.dynamic_price = calculateDynamicPrice(
      product.base_price, product.stock_quantity, product.recent_orders
    );
    product.is_low_stock = product.stock_quantity > 0 && product.stock_quantity <= 5;

    // Parse images JSON
    try { product.images = JSON.parse(product.images || '[]'); } catch { product.images = []; }

    // Parse specs JSON
    try { product.specifications = JSON.parse(product.specifications || '{}'); } catch { product.specifications = {}; }

    // Frequently bought together
    const [fbt] = await pool.execute(
      `SELECT p2.id, p2.name, p2.base_price, p2.thumbnail, p2.stock_quantity,
              COALESCE(AVG(r2.rating), 0) AS avg_rating,
              COUNT(*) AS bought_together_count
       FROM order_items oi1
       JOIN order_items oi2 ON oi1.order_id = oi2.order_id AND oi2.product_id != oi1.product_id
       JOIN products p2 ON oi2.product_id = p2.id AND p2.is_active = 1
       LEFT JOIN reviews r2 ON r2.product_id = p2.id AND r2.is_approved = 1
       WHERE oi1.product_id = ?
       GROUP BY p2.id
       ORDER BY bought_together_count DESC
       LIMIT 4`,
      [id]
    );

    // Reviews
    const [reviews] = await pool.execute(
      `SELECT r.*, u.name AS user_name, u.avatar AS user_avatar
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ? AND r.is_approved = 1
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [id]
    );

    // Rating distribution
    const [ratingDist] = await pool.execute(
      `SELECT rating, COUNT(*) AS count FROM reviews WHERE product_id = ? AND is_approved = 1 GROUP BY rating`,
      [id]
    );

    // Increment view count
    await pool.execute('UPDATE products SET view_count = view_count + 1 WHERE id = ?', [id]);

    res.json({
      success: true,
      data: { ...product, frequently_bought_together: fbt, reviews, rating_distribution: ratingDist },
    });
  } catch (error) {
    console.error('GetProduct error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch product' });
  }
};

/**
 * GET /api/products/trending - Trending products
 */
const getTrending = async (req, res) => {
  try {
    const [products] = await pool.execute(
      `SELECT p.*, c.name AS category_name,
              COALESCE(AVG(r.rating), 0) AS avg_rating,
              COALESCE(SUM(oi.quantity), 0) AS total_sold,
              (p.view_count * 0.3 + COALESCE(SUM(oi.quantity), 0) * 0.7) AS trend_score
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN reviews r ON r.product_id = p.id AND r.is_approved = 1
       LEFT JOIN order_items oi ON oi.product_id = p.id
       LEFT JOIN orders o ON oi.order_id = o.id AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       WHERE p.is_active = 1
       GROUP BY p.id
       ORDER BY trend_score DESC
       LIMIT 8`
    );

    const enriched = products.map(p => ({
      ...p,
      dynamic_price: calculateDynamicPrice(p.base_price, p.stock_quantity, p.total_sold),
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch trending products' });
  }
};

/**
 * POST /api/products - Create product (admin)
 */
const createProduct = async (req, res) => {
  try {
    const {
      name, description, base_price, category_id, stock_quantity,
      thumbnail, images, sku, brand, weight, specifications, is_featured,
    } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO products (name, description, base_price, category_id, stock_quantity,
       thumbnail, images, sku, brand, weight, specifications, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, description, base_price, category_id, stock_quantity || 0,
        thumbnail, JSON.stringify(images || []), sku, brand, weight || null,
        JSON.stringify(specifications || {}), is_featured ? 1 : 0,
      ]
    );

    res.status(201).json({ success: true, message: 'Product created', data: { id: result.insertId } });
  } catch (error) {
    console.error('CreateProduct error:', error);
    res.status(500).json({ success: false, message: 'Failed to create product' });
  }
};

/**
 * PUT /api/products/:id - Update product (admin)
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;

    const allowed = ['name', 'description', 'base_price', 'category_id', 'stock_quantity',
      'thumbnail', 'sku', 'brand', 'weight', 'is_featured', 'is_active'];
    const updates = [];
    const values = [];

    allowed.forEach(field => {
      if (fields[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(fields[field]);
      }
    });

    if (fields.images !== undefined) {
      updates.push('images = ?');
      values.push(JSON.stringify(fields.images));
    }
    if (fields.specifications !== undefined) {
      updates.push('specifications = ?');
      values.push(JSON.stringify(fields.specifications));
    }

    if (!updates.length) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(id);
    await pool.execute(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, values);

    res.json({ success: true, message: 'Product updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
};

/**
 * DELETE /api/products/:id - Soft delete (admin)
 */
const deleteProduct = async (req, res) => {
  try {
    await pool.execute('UPDATE products SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
};

/**
 * GET /api/products/search - Optimized search
 */
const searchProducts = async (req, res) => {
  try {
    const { q, limit = 8 } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ success: true, data: [] });
    }

    const [products] = await pool.execute(
      `SELECT p.id, p.name, p.base_price, p.thumbnail, p.stock_quantity,
              c.name AS category_name,
              MATCH(p.name, p.description) AGAINST(? IN NATURAL LANGUAGE MODE) AS relevance
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = 1
         AND (MATCH(p.name, p.description) AGAINST(? IN NATURAL LANGUAGE MODE)
              OR p.name LIKE ?)
       ORDER BY relevance DESC
       LIMIT ?`,
      [q, q, `%${q}%`, parseInt(limit)]
    );

    res.json({ success: true, data: products });
  } catch (error) {
    // Fallback LIKE search if FULLTEXT not available
    try {
      const [products] = await pool.execute(
        `SELECT p.id, p.name, p.base_price, p.thumbnail, p.stock_quantity, c.name AS category_name
         FROM products p LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.is_active = 1 AND (p.name LIKE ? OR p.description LIKE ? OR p.brand LIKE ?)
         LIMIT ?`,
        [`%${req.query.q}%`, `%${req.query.q}%`, `%${req.query.q}%`, parseInt(req.query.limit || 8)]
      );
      res.json({ success: true, data: products });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Search failed' });
    }
  }
};

/**
 * GET /api/products/low-stock - Inventory alerts (admin)
 */
const getLowStock = async (req, res) => {
  try {
    const threshold = parseInt(process.env.STOCK_LOW_THRESHOLD) || 5;
    const [products] = await pool.execute(
      `SELECT p.id, p.name, p.stock_quantity, p.sku, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = 1 AND p.stock_quantity <= ?
       ORDER BY p.stock_quantity ASC`,
      [threshold]
    );
    res.json({ success: true, data: products, threshold });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch low stock' });
  }
};

module.exports = {
  getProducts, getProduct, getTrending, createProduct,
  updateProduct, deleteProduct, searchProducts, getLowStock,
};
