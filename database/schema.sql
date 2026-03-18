-- ============================================================
-- SMART STORE - COMPLETE MYSQL SCHEMA
-- Version: 1.0.0
-- ============================================================

CREATE DATABASE IF NOT EXISTS smart_store
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smart_store;

-- ─── USERS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  email        VARCHAR(191) NOT NULL UNIQUE,
  password     VARCHAR(255) NOT NULL,
  phone        VARCHAR(20),
  role         ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  avatar       VARCHAR(500),
  is_active    TINYINT(1) NOT NULL DEFAULT 1,
  last_login   DATETIME,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role  (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── CATEGORIES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  icon        VARCHAR(100),
  image       VARCHAR(500),
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  sort_order  INT DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── PRODUCTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  base_price      DECIMAL(10,2) NOT NULL,
  category_id     INT UNSIGNED,
  stock_quantity  INT NOT NULL DEFAULT 0,
  thumbnail       VARCHAR(500),
  images          JSON,
  sku             VARCHAR(100) UNIQUE,
  brand           VARCHAR(100),
  weight          DECIMAL(8,3),
  specifications  JSON,
  is_featured     TINYINT(1) NOT NULL DEFAULT 0,
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  view_count      INT UNSIGNED NOT NULL DEFAULT 0,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_category   (category_id),
  INDEX idx_price      (base_price),
  INDEX idx_featured   (is_featured),
  INDEX idx_active     (is_active),
  INDEX idx_stock      (stock_quantity),
  FULLTEXT idx_search  (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── CARTS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS carts (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  status     ENUM('active','completed','abandoned') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── CART ITEMS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cart_items (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cart_id     INT UNSIGNED NOT NULL,
  product_id  INT UNSIGNED NOT NULL,
  quantity    INT NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cart_id)    REFERENCES carts(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uq_cart_product (cart_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── ORDERS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id          INT UNSIGNED NOT NULL,
  order_number     VARCHAR(50) NOT NULL UNIQUE,
  status           ENUM('placed','confirmed','packed','shipped','out_for_delivery','delivered','cancelled')
                   NOT NULL DEFAULT 'placed',
  subtotal         DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping_cost    DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount       DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount  DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount     DECIMAL(10,2) NOT NULL,
  shipping_address JSON NOT NULL,
  payment_method   ENUM('cod','card','upi','wallet') NOT NULL DEFAULT 'cod',
  payment_status   ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  notes            TEXT,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_user       (user_id),
  INDEX idx_status     (status),
  INDEX idx_created    (created_at),
  INDEX idx_order_num  (order_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── ORDER ITEMS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id    INT UNSIGNED NOT NULL,
  product_id  INT UNSIGNED NOT NULL,
  quantity    INT NOT NULL,
  unit_price  DECIMAL(10,2) NOT NULL,
  subtotal    DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  INDEX idx_order   (order_id),
  INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── ORDER TRACKING ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_tracking (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id   INT UNSIGNED NOT NULL,
  status     VARCHAR(50) NOT NULL,
  message    TEXT,
  location   VARCHAR(200),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── REVIEWS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id           INT UNSIGNED NOT NULL,
  user_id              INT UNSIGNED NOT NULL,
  rating               TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title                VARCHAR(200),
  comment              TEXT,
  is_verified_purchase TINYINT(1) NOT NULL DEFAULT 0,
  is_approved          TINYINT(1) NOT NULL DEFAULT 1,
  helpful_votes        INT UNSIGNED NOT NULL DEFAULT 0,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  UNIQUE KEY uq_user_product (user_id, product_id),
  INDEX idx_product (product_id),
  INDEX idx_rating  (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── WISHLISTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlists (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_product (user_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Admin user (password: Admin@123)
INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@smartstore.com',
 '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewGY5oPn2r6C7rPS', 'admin')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  password = VALUES(password),
  role = VALUES(role),
  is_active = 1;

-- Sample customer (password: User@123)
INSERT INTO users (name, email, password, phone, role) VALUES
('Raj Sharma',    'raj@example.com',    '$2a$12$eImiTXuWVxfM37uY4JANjQ9SIIEjKZnMNFEbguPiF5HdkS1dHaHZ2', '9876543210', 'customer'),
('Priya Patel',   'priya@example.com',  '$2a$12$eImiTXuWVxfM37uY4JANjQ9SIIEjKZnMNFEbguPiF5HdkS1dHaHZ2', '9123456789', 'customer'),
('Amit Kumar',    'amit@example.com',   '$2a$12$eImiTXuWVxfM37uY4JANjQ9SIIEjKZnMNFEbguPiF5HdkS1dHaHZ2', '9988776655', 'customer')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  password = VALUES(password),
  phone = VALUES(phone),
  role = VALUES(role),
  is_active = 1;

-- Categories
INSERT INTO categories (name, slug, description, icon, sort_order) VALUES
('Electronics',    'electronics',    'Laptops, phones, gadgets & more',   '💻', 1),
('Fashion',        'fashion',        'Clothing, shoes & accessories',     '👗', 2),
('Home & Kitchen', 'home-kitchen',   'Furniture, appliances & decor',     '🏠', 3),
('Sports',         'sports',         'Fitness, outdoor & sports gear',    '🏋️', 4),
('Books',          'books',          'Fiction, non-fiction & textbooks',  '📚', 5),
('Beauty',         'beauty',         'Skincare, makeup & personal care',  '💄', 6)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  icon = VALUES(icon),
  sort_order = VALUES(sort_order),
  is_active = 1;

-- Products
INSERT INTO products (name, description, base_price, category_id, stock_quantity, thumbnail, sku, brand, is_featured, specifications) VALUES
('Apple MacBook Pro 14"',
 'M3 Pro chip, 18GB RAM, 512GB SSD. Professional performance in a stunning design.',
 189999.00, 1, 25,
 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600',
 'SKU-APPL-MBP14', 'Apple', 1,
 '{"processor":"Apple M3 Pro","ram":"18GB","storage":"512GB SSD","display":"14.2 inch Liquid Retina XDR","battery":"18 hours","os":"macOS Sonoma"}'),

('Samsung Galaxy S24 Ultra',
 '200MP camera, Snapdragon 8 Gen 3, 12GB RAM, 5000mAh battery.',
 124999.00, 1, 40,
 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600',
 'SKU-SAM-S24U', 'Samsung', 1,
 '{"processor":"Snapdragon 8 Gen 3","ram":"12GB","storage":"256GB","camera":"200MP","battery":"5000mAh","display":"6.8 inch Dynamic AMOLED 2X"}'),

('Sony WH-1000XM5',
 'Industry-leading noise cancellation, 30-hour battery, Hi-Res audio.',
 29999.00, 1, 60,
 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
 'SKU-SONY-WH5', 'Sony', 1,
 '{"type":"Over-ear","connectivity":"Bluetooth 5.2","battery":"30 hours","noiseCancellation":"Industry-leading","weight":"250g"}'),

('Nike Air Max 270',
 'Maximum comfort with large Air unit. Breathable mesh upper.',
 11999.00, 2, 80,
 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
 'SKU-NIKE-AM270', 'Nike', 1,
 '{"material":"Mesh + synthetic","sole":"Rubber","closure":"Lace-up","airUnit":"270° Max Air"}'),

('Levi''s 501 Original Jeans',
 'The original straight fit. 100% cotton denim, classic 5-pocket styling.',
 3999.00, 2, 120,
 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600',
 'SKU-LEV-501', 'Levi''s', 0,
 '{"fit":"Straight","material":"100% Cotton","rise":"High rise","closure":"Button fly"}'),

('Instant Pot Duo 7-in-1',
 'Electric pressure cooker, slow cooker, rice cooker, steamer, sauté, yogurt maker.',
 8999.00, 3, 35,
 'https://images.unsplash.com/photo-1585664811087-47f65abbad64?w=600',
 'SKU-IP-DUO7', 'Instant Pot', 1,
 '{"capacity":"6 Quart","functions":"7-in-1","programs":"13 built-in","material":"Stainless steel"}'),

('Yoga Mat Pro',
 'Non-slip, eco-friendly TPE material. 6mm thickness for joint support.',
 2499.00, 4, 200,
 'https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=600',
 'SKU-YOG-MAT-PRO', 'FitLife', 0,
 '{"material":"TPE","thickness":"6mm","dimensions":"183cm x 61cm","weight":"1.2kg"}'),

('Atomic Habits - James Clear',
 'Build good habits, break bad ones. #1 NY Times Bestseller.',
 499.00, 5, 300,
 'https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=600',
 'SKU-BK-ATOMIC', 'Penguin Random House', 0,
 '{"author":"James Clear","pages":"320","publisher":"Penguin Random House","language":"English","isbn":"9780735211292"}'),

('The Ordinary Niacinamide 10%',
 'Reduces blemishes, balances sebum, minimises pore appearance. 30ml.',
 699.00, 6, 150,
 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600',
 'SKU-TO-NIAC10', 'The Ordinary', 0,
 '{"concentration":"10% Niacinamide + 1% Zinc","volume":"30ml","skin_type":"All skin types","cruelty_free":"Yes"}'),

('Dell UltraSharp 27" 4K Monitor',
 'IPS panel, 99% sRGB, USB-C hub, adjustable stand.',
 54999.00, 1, 15,
 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600',
 'SKU-DELL-U27', 'Dell', 1,
 '{"resolution":"3840x2160","panel":"IPS","refresh":"60Hz","ports":"USB-C,HDMI,DP","hdr":"HDR400"}'),

('Adidas Ultraboost 23',
 'BOOST midsole for incredible energy return. Primeknit upper.',
 14999.00, 2, 55,
 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600',
 'SKU-ADI-UB23', 'Adidas', 1,
 '{"technology":"BOOST midsole","upper":"Primeknit+","drop":"10mm","weight":"310g"}'),

('Dyson V15 Detect',
 'Laser reveals hidden dust. Intelligent suction adjustment. 60-min runtime.',
 54900.00, 3, 8,
 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
 'SKU-DYS-V15', 'Dyson', 1,
 '{"runtime":"60 minutes","suction":"240 AW","filtration":"HEPA","laser":"Green laser detect"}')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  base_price = VALUES(base_price),
  category_id = VALUES(category_id),
  stock_quantity = VALUES(stock_quantity),
  thumbnail = VALUES(thumbnail),
  brand = VALUES(brand),
  is_featured = VALUES(is_featured),
  specifications = VALUES(specifications),
  is_active = 1;

-- Sample reviews
INSERT INTO reviews (product_id, user_id, rating, title, comment, is_verified_purchase, is_approved) VALUES
(1, 2, 5, 'Absolutely incredible machine',  'The M3 Pro chip is blazing fast. Battery lasts all day easily. Best laptop I''ve ever owned.', 0, 1),
(1, 3, 4, 'Great but expensive',             'Superb performance and build quality. Only wish it was a bit more affordable.', 0, 1),
(2, 4, 5, 'Best Android phone out there',   'Camera quality is insane. S Pen is super useful. Battery lasts two days.', 0, 1),
(3, 2, 5, 'Noise cancellation is magic',    'Put these on and the world disappears. Sound quality is reference-level.', 0, 1),
(4, 3, 4, 'Very comfortable shoes',         'Great cushioning, breathable upper. Runs true to size.', 0, 1),
(6, 4, 5, 'Changed my cooking routine',     'Makes cooking so easy! The pressure cooker function is a game changer.', 0, 1),
(8, 2, 5, 'Life-changing book',             'Genuinely changed how I approach habits and goals. Must-read!', 0, 1),
(10, 3, 5, 'Stunning monitor',              'Colors are incredibly accurate. The USB-C hub is super convenient.', 0, 1)
ON DUPLICATE KEY UPDATE
  rating = VALUES(rating),
  title = VALUES(title),
  comment = VALUES(comment),
  is_verified_purchase = VALUES(is_verified_purchase),
  is_approved = VALUES(is_approved);

-- Sample orders
INSERT INTO orders (user_id, order_number, status, subtotal, shipping_cost, tax_amount, total_amount, shipping_address, payment_method, payment_status) VALUES
(2, 'ORD-1700000001-123', 'delivered', 29999.00, 0, 5399.82, 35398.82,
 '{"name":"Raj Sharma","street":"123 MG Road","city":"Mumbai","state":"Maharashtra","pincode":"400001","phone":"9876543210"}',
 'card', 'paid'),
(3, 'ORD-1700000002-456', 'shipped', 124999.00, 0, 22499.82, 147498.82,
 '{"name":"Priya Patel","street":"45 Brigade Road","city":"Bengaluru","state":"Karnataka","pincode":"560001","phone":"9123456789"}',
 'upi', 'paid'),
(4, 'ORD-1700000003-789', 'placed', 2499.00, 49, 449.82, 2997.82,
 '{"name":"Amit Kumar","street":"78 Park Street","city":"Kolkata","state":"West Bengal","pincode":"700016","phone":"9988776655"}',
 'cod', 'pending')
ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  subtotal = VALUES(subtotal),
  shipping_cost = VALUES(shipping_cost),
  tax_amount = VALUES(tax_amount),
  discount_amount = VALUES(discount_amount),
  total_amount = VALUES(total_amount),
  shipping_address = VALUES(shipping_address),
  payment_method = VALUES(payment_method),
  payment_status = VALUES(payment_status);

-- Order items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES
(1, 3, 1, 29999.00, 29999.00),
(2, 2, 1, 124999.00, 124999.00),
(3, 7, 1, 2499.00, 2499.00);

-- Order tracking
INSERT INTO order_tracking (order_id, status, message, location) VALUES
(1, 'placed',           'Order placed successfully',           'Online'),
(1, 'confirmed',        'Payment confirmed',                   'Online'),
(1, 'packed',           'Item packed and ready to dispatch',   'Mumbai Warehouse'),
(1, 'shipped',          'Dispatched via Blue Dart. AWB: BD12345', 'Mumbai Hub'),
(1, 'out_for_delivery', 'Out for delivery',                    'Mumbai'),
(1, 'delivered',        'Delivered successfully. Enjoy!',      'Mumbai'),
(2, 'placed',           'Order placed successfully',           'Online'),
(2, 'confirmed',        'Payment confirmed via UPI',           'Online'),
(2, 'packed',           'Packed and ready',                    'Bengaluru Warehouse'),
(2, 'shipped',          'Shipped via DTDC. AWB: DT98765',      'Bengaluru Hub'),
(3, 'placed',           'Order placed. Awaiting confirmation', 'Online');
