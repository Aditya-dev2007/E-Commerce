// scripts/dbDoctor.js - diagnose MySQL connectivity from backend env
require('dotenv').config();
const mysql = require('mysql2/promise');

const safeConfig = () => ({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  database: process.env.DB_NAME || 'smart_store',
  hasPassword: Boolean(process.env.DB_PASSWORD),
});

async function main() {
  const cfg = safeConfig();
  console.log('DB config (safe):', cfg);

  try {
    // Connect without selecting a DB first; helps when DB doesn't exist yet
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true,
    });

    const [rows] = await connection.query('SELECT VERSION() AS version, CURRENT_USER() AS currentUser');
    console.log('✅ Connected. Server:', rows?.[0]);

    const dbName = process.env.DB_NAME || 'smart_store';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.query(`USE \`${dbName}\``);
    console.log(`✅ Database '${dbName}' is accessible.`);

    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection failed.');
    console.error('Code:', err?.code);
    console.error('Message:', err?.message);

    if (String(err?.code) === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\nFix options:');
      console.error('- Set correct DB_USER/DB_PASSWORD in backend/.env');
      console.error("- OR create a dedicated user by running: mysql -u root -p < database/create_user_and_db.sql");
      console.error("- Then set DB_USER=smartstore and DB_PASSWORD=SmartStore@123");
    } else if (String(err?.code) === 'ECONNREFUSED') {
      console.error('\nFix options:');
      console.error('- Ensure MySQL service is running on DB_HOST/DB_PORT');
      console.error('- Check DB_PORT (3306 by default)');
    }

    process.exit(1);
  }
}

main();

