// controllers/categoryController.js
const { pool } = require('../config/db');

const getCategories = async (req, res) => {
  try {
    const [categories] = await pool.execute(
      `SELECT c.*, COUNT(p.id) AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
       WHERE c.is_active = 1
       GROUP BY c.id
       ORDER BY c.sort_order ASC, c.name ASC`
    );
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, slug, description, icon, image } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO categories (name, slug, description, icon, image) VALUES (?, ?, ?, ?, ?)',
      [name, slug || name.toLowerCase().replace(/\s+/g, '-'), description, icon, image]
    );
    res.status(201).json({ success: true, message: 'Category created', data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create category' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { name, description, icon, image, is_active } = req.body;
    await pool.execute(
      'UPDATE categories SET name = ?, description = ?, icon = ?, image = ?, is_active = ? WHERE id = ?',
      [name, description, icon, image, is_active ? 1 : 0, req.params.id]
    );
    res.json({ success: true, message: 'Category updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update category' });
  }
};

module.exports = { getCategories, createCategory, updateCategory };
