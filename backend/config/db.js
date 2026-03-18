// config/db.js - MySQL connection pool with promise support
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_store',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
});

let dbConnected = false;

const getSafeDbConfigForLogs = () => ({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  database: process.env.DB_NAME || 'smart_store',
  hasPassword: Boolean(process.env.DB_PASSWORD),
});

// Test connection on startup
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL connected successfully');
    connection.release();
    dbConnected = true;
    return true;
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    console.error('🔎 DB config:', getSafeDbConfigForLogs());
    if (String(err?.code) === 'ER_ACCESS_DENIED_ERROR') {
      console.error(
        "💡 Fix: update backend/.env with correct DB_USER/DB_PASSWORD (and ensure that user has access to DB_NAME)."
      );
      console.error(
        "💡 Recommended: create a dedicated user: mysql -u root -p < database/create_user_and_db.sql (then set DB_USER=smartstore, DB_PASSWORD=SmartStore@123)."
      );
    }
    if (String(err?.code) === 'ECONNREFUSED') {
      console.error('💡 Fix: ensure MySQL service is running and DB_PORT is correct (default 3306).');
    }
    dbConnected = false;
    return false;
  }
};

const isDbConnected = () => dbConnected;

module.exports = { pool, testConnection, isDbConnected };
