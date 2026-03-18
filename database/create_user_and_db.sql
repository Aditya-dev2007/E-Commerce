-- Create database + a dedicated app user (recommended)
-- Run this in MySQL as an admin user (root)

CREATE DATABASE IF NOT EXISTS smart_store
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Create user (MySQL 8+ supports IF NOT EXISTS)
CREATE USER IF NOT EXISTS 'smartstore'@'localhost' IDENTIFIED BY 'SmartStore@123';

-- Grant required privileges
GRANT ALL PRIVILEGES ON smart_store.* TO 'smartstore'@'localhost';
FLUSH PRIVILEGES;

