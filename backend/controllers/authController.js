// controllers/authController.js - Registration, Login, Profile
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

/** Generate JWT */
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

/**
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check existing user
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone || null, 'customer']
    );

    const token = generateToken(result.insertId);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { id: result.insertId, name, email, role: 'customer', token },
    });
  } catch (error) {
    console.error('Register error:', error);
    if (
      String(error?.code) === 'ER_ACCESS_DENIED_ERROR' ||
      String(error?.code) === 'ECONNREFUSED' ||
      String(error?.code) === 'PROTOCOL_CONNECTION_LOST'
    ) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }
    if (String(error?.code) === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      ...(process.env.NODE_ENV === 'development'
        ? { error: { code: error?.code, message: error?.message } }
        : {}),
    });
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await pool.execute(
      'SELECT id, name, email, password, role, is_active FROM users WHERE email = ?',
      [email]
    );

    if (!users.length) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account deactivated' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Update last login
    await pool.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: { id: user.id, name: user.name, email: user.email, role: user.role, token },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.avatar, u.created_at,
              COUNT(DISTINCT o.id) AS total_orders,
              COALESCE(SUM(o.total_amount), 0) AS total_spent
       FROM users u
       LEFT JOIN orders o ON o.user_id = u.id AND o.status != 'cancelled'
       WHERE u.id = ?
       GROUP BY u.id`,
      [req.user.id]
    );

    res.json({ success: true, data: users[0] });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    await pool.execute('UPDATE users SET name = ?, phone = ? WHERE id = ?', [
      name, phone || null, req.user.id,
    ]);
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * PUT /api/auth/change-password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const [users] = await pool.execute('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const isMatch = await bcrypt.compare(currentPassword, users[0].password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password incorrect' });
    }
    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(newPassword, salt);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword };
