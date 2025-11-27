-- Create database
CREATE DATABASE IF NOT EXISTS oyun_satis_db DEFAULT CHARACTER SET 'utf8mb4';
USE oyun_satis_db;

-- ============================================================================
-- SIRA 1: TABLES WITH NO DEPENDENCIES
-- ============================================================================

-- CUSTOMER Table
CREATE TABLE IF NOT EXISTS `CUSTOMER` (
  `customer_id` INT NOT NULL AUTO_INCREMENT,
  `first_name` VARCHAR(50) NOT NULL,
  `last_name` VARCHAR(50) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20),
  `registration_date` DATE,
  `last_login_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `active_status` BOOLEAN DEFAULT TRUE,
  `is_admin` BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (`customer_id`),
  UNIQUE KEY `uk_email` (`email`)
);

-- PRODUCT Table
CREATE TABLE IF NOT EXISTS `PRODUCT` (
  `product_id` INT NOT NULL AUTO_INCREMENT,
  `product_name` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(10, 2) NOT NULL,
  `release_date` DATE,
  `product_type` VARCHAR(20),
  `brand` VARCHAR(100),
  `status` VARCHAR(20),
  `weight` DECIMAL(6, 2),
  `dimensions` VARCHAR(50),
  `stock_alert_level` INT DEFAULT 10,
  PRIMARY KEY (`product_id`),
  CONSTRAINT `chk_price` CHECK (`price` > 0),
  CONSTRAINT `chk_product_type` CHECK (`product_type` IN ('game', 'console'))
);

-- SUPPLIER Table
CREATE TABLE IF NOT EXISTS `SUPPLIER` (
  `supplier_id` INT NOT NULL AUTO_INCREMENT,
  `supplier_name` VARCHAR(150) NOT NULL,
  `payment_terms` VARCHAR(100),
  `active_status` BOOLEAN DEFAULT TRUE,
  `contact_address` TEXT,
  `contact_phone` VARCHAR(20),
  `contact_email` VARCHAR(100),
  PRIMARY KEY (`supplier_id`)
);

-- GENRE Table
CREATE TABLE IF NOT EXISTS `GENRE` (
  `genre_id` INT NOT NULL AUTO_INCREMENT,
  `genre_name` VARCHAR(50) NOT NULL,
  `description` TEXT,
  PRIMARY KEY (`genre_id`),
  UNIQUE KEY `uk_genre_name` (`genre_name`)
);

-- ============================================================================
-- SIRA 2: TABLES DEPENDENT ON SIRA 1 TABLES
-- ============================================================================

-- ADDRESS Table
CREATE TABLE IF NOT EXISTS `ADDRESS` (
  `address_id` INT NOT NULL AUTO_INCREMENT,
  `customer_id` INT,
  `address_type` VARCHAR(20),
  `city` VARCHAR(100),
  `district` VARCHAR(100),
  `neighborhood` VARCHAR(100),
  `full_address` TEXT,
  `postal_code` VARCHAR(10),
  `default_address` BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (`address_id`),
  CONSTRAINT `fk_address_customer`
    FOREIGN KEY (`customer_id`) REFERENCES `CUSTOMER` (`customer_id`)
    ON DELETE CASCADE
);

-- GAME Table (Subclass of PRODUCT)
CREATE TABLE IF NOT EXISTS `GAME` (
  `product_id` INT NOT NULL,
  `platform` VARCHAR(255),
  `developer` VARCHAR(100),
  `publisher` VARCHAR(100),
  `ESRB_rating` VARCHAR(10),
  `multiplayer` BOOLEAN,
  `language_support` TEXT,
  `subtitle_languages` TEXT,
  PRIMARY KEY (`product_id`),
  CONSTRAINT `fk_game_product`
    FOREIGN KEY (`product_id`) REFERENCES `PRODUCT` (`product_id`)
    ON DELETE CASCADE
);

-- CONSOLE Table (Subclass of PRODUCT)
CREATE TABLE IF NOT EXISTS `CONSOLE` (
  `product_id` INT NOT NULL,
  `manufacturer` VARCHAR(100),
  `model` VARCHAR(100),
  `storage_capacity` VARCHAR(20),
  `color` VARCHAR(30),
  `included_accessories` TEXT,
  `warranty_period` INT,
  PRIMARY KEY (`product_id`),
  CONSTRAINT `fk_console_product`
    FOREIGN KEY (`product_id`) REFERENCES `PRODUCT` (`product_id`)
    ON DELETE CASCADE
);

-- PRODUCT_MEDIA Table
CREATE TABLE IF NOT EXISTS `PRODUCT_MEDIA` (
  `media_id` INT NOT NULL AUTO_INCREMENT,
  `product_id` INT NOT NULL,
  `media_type` VARCHAR(10),
  `media_url` VARCHAR(500),
  `order_no` INT,
  `main_image` BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (`media_id`),
  CONSTRAINT `fk_media_product`
    FOREIGN KEY (`product_id`) REFERENCES `PRODUCT` (`product_id`)
    ON DELETE CASCADE,
  CONSTRAINT `chk_media_type` CHECK (`media_type` IN ('video', 'photo'))
);

-- ORDER Table
CREATE TABLE IF NOT EXISTS `ORDER` (
  `order_id` INT NOT NULL AUTO_INCREMENT,
  `customer_id` INT,
  `order_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `order_status` VARCHAR(20),
  `total_amount` DECIMAL(10, 2),
  `shipping_fee` DECIMAL(6, 2),
  `payment_method` VARCHAR(30),
  `payment_status` VARCHAR(20),
  `tracking_number` VARCHAR(50),
  `estimated_delivery_date` DATE,
  `actual_delivery_date` DATE,
  `delivery_full_address` TEXT,
  `delivery_city` VARCHAR(100),
  `billing_full_address` TEXT,
  `billing_city` VARCHAR(100),
  PRIMARY KEY (`order_id`),
  CONSTRAINT `fk_order_customer`
    FOREIGN KEY (`customer_id`) REFERENCES `CUSTOMER` (`customer_id`)
    ON DELETE SET NULL
);

-- BRANCH Table
CREATE TABLE IF NOT EXISTS `BRANCH` (
  `branch_id` INT NOT NULL AUTO_INCREMENT,
  `address_id` INT,
  `branch_name` VARCHAR(100),
  `phone` VARCHAR(20),
  `email` VARCHAR(100),
  `working_hours` VARCHAR(100),
  `manager_name` VARCHAR(100),
  `opening_date` DATE,
  PRIMARY KEY (`branch_id`),
  CONSTRAINT `fk_branch_address`
    FOREIGN KEY (`address_id`) REFERENCES `ADDRESS` (`address_id`)
    ON DELETE SET NULL
);

-- CART Table
CREATE TABLE IF NOT EXISTS `CART` (
  `customer_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `quantity` INT DEFAULT 1,
  `added_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`customer_id`, `product_id`),
  CONSTRAINT `fk_cart_customer`
    FOREIGN KEY (`customer_id`) REFERENCES `CUSTOMER` (`customer_id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_cart_product`
    FOREIGN KEY (`product_id`) REFERENCES `PRODUCT` (`product_id`)
    ON DELETE CASCADE,
  CONSTRAINT `chk_cart_quantity` CHECK (`quantity` > 0)
);

-- REVIEW Table
CREATE TABLE IF NOT EXISTS `REVIEW` (
  `review_id` INT NOT NULL AUTO_INCREMENT,
  `customer_id` INT,
  `product_id` INT NOT NULL,
  `rating` INT NOT NULL,
  `review_title` VARCHAR(200),
  `review_text` TEXT,
  `review_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `helpful_count` INT DEFAULT 0,
  `approved` BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (`review_id`),
  CONSTRAINT `fk_review_customer`
    FOREIGN KEY (`customer_id`) REFERENCES `CUSTOMER` (`customer_id`)
    ON DELETE SET NULL,
  CONSTRAINT `fk_review_product`
    FOREIGN KEY (`product_id`) REFERENCES `PRODUCT` (`product_id`)
    ON DELETE CASCADE,
  CONSTRAINT `chk_rating` CHECK (`rating` >= 1 AND `rating` <= 5)
);

-- PURCHASE Table
CREATE TABLE IF NOT EXISTS `PURCHASE` (
  `purchase_id` INT NOT NULL AUTO_INCREMENT,
  `supplier_id` INT,
  `product_id` INT,
  `transaction_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `quantity` INT,
  `unit_cost` DECIMAL(10, 2),
  `total_cost` DECIMAL(10, 2),
  `payment_status` VARCHAR(20),
  `payment_date` DATE,
  `invoice_no` VARCHAR(50),
  PRIMARY KEY (`purchase_id`),
  CONSTRAINT `fk_purchase_supplier`
    FOREIGN KEY (`supplier_id`) REFERENCES `SUPPLIER` (`supplier_id`)
    ON DELETE SET NULL,
  CONSTRAINT `fk_purchase_product`
    FOREIGN KEY (`product_id`) REFERENCES `PRODUCT` (`product_id`)
    ON DELETE SET NULL,
  CONSTRAINT `chk_purchase_quantity` CHECK (`quantity` > 0),
  CONSTRAINT `chk_purchase_unit_cost` CHECK (`unit_cost` > 0)
);

-- GAME_GENRE Table (Associative Entity)
CREATE TABLE IF NOT EXISTS `GAME_GENRE` (
  `product_id` INT NOT NULL,
  `genre_id` INT NOT NULL,
  PRIMARY KEY (`product_id`, `genre_id`),
  CONSTRAINT `fk_gg_game`
    FOREIGN KEY (`product_id`) REFERENCES `GAME` (`product_id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_gg_genre`
    FOREIGN KEY (`genre_id`) REFERENCES `GENRE` (`genre_id`)
    ON DELETE CASCADE
);

-- ============================================================================
-- SIRA 3: TABLES DEPENDENT ON SIRA 2 TABLES
-- ============================================================================

-- ORDER_DETAIL Table (Weak Entity)
CREATE TABLE IF NOT EXISTS `ORDER_DETAIL` (
  `order_id` INT NOT NULL,
  `line_no` INT NOT NULL,
  `product_id` INT,
  `quantity` INT,
  `unit_price` DECIMAL(10, 2),
  PRIMARY KEY (`order_id`, `line_no`),
  CONSTRAINT `fk_od_order`
    FOREIGN KEY (`order_id`) REFERENCES `ORDER` (`order_id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_od_product`
    FOREIGN KEY (`product_id`) REFERENCES `PRODUCT` (`product_id`)
    ON DELETE SET NULL,
  CONSTRAINT `chk_od_quantity` CHECK (`quantity` > 0)
);

-- RETURN Table
CREATE TABLE IF NOT EXISTS `RETURN` (
  `return_id` INT NOT NULL AUTO_INCREMENT,
  `customer_id` INT,
  `order_id` INT,
  `product_id` INT,
  `transaction_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `quantity` INT,
  `refund_amount` DECIMAL(10, 2),
  `return_reason` TEXT,
  `return_status` VARCHAR(20),
  `refund_date` DATE,
  PRIMARY KEY (`return_id`),
  CONSTRAINT `fk_return_customer`
    FOREIGN KEY (`customer_id`) REFERENCES `CUSTOMER` (`customer_id`)
    ON DELETE SET NULL,
  CONSTRAINT `fk_return_order`
    FOREIGN KEY (`order_id`) REFERENCES `ORDER` (`order_id`)
    ON DELETE SET NULL,
  CONSTRAINT `fk_return_product`
    FOREIGN KEY (`product_id`) REFERENCES `PRODUCT` (`product_id`)
    ON DELETE SET NULL,
  CONSTRAINT `chk_return_quantity` CHECK (`quantity` > 0)
);

-- SALE Table
CREATE TABLE IF NOT EXISTS `SALE` (
  `sale_id` INT NOT NULL AUTO_INCREMENT,
  `customer_id` INT,
  `order_id` INT,
  `branch_id` INT,
  `transaction_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `transaction_amount` DECIMAL(10, 2),
  `cost` DECIMAL(10, 2),
  `profit` DECIMAL(10, 2),
  `sale_type` VARCHAR(20),
  `sale_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`sale_id`),
  CONSTRAINT `fk_sale_customer`
    FOREIGN KEY (`customer_id`) REFERENCES `CUSTOMER` (`customer_id`)
    ON DELETE SET NULL,
  CONSTRAINT `fk_sale_order`
    FOREIGN KEY (`order_id`) REFERENCES `ORDER` (`order_id`)
    ON DELETE SET NULL,
  CONSTRAINT `fk_sale_branch`
    FOREIGN KEY (`branch_id`) REFERENCES `BRANCH` (`branch_id`)
    ON DELETE SET NULL,
  CONSTRAINT `chk_sale_type` CHECK (`sale_type` IN ('online', 'in-store'))
);

-- INVENTORY Table
CREATE TABLE IF NOT EXISTS `INVENTORY` (
  `inventory_id` INT NOT NULL AUTO_INCREMENT,
  `product_id` INT NOT NULL,
  `branch_id` INT NOT NULL,
  `quantity` INT NOT NULL,
  `minimum_stock` INT DEFAULT 10,
  `maximum_stock` INT DEFAULT 100,
  `shelf_location` VARCHAR(50),
  `last_update_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`inventory_id`),
  UNIQUE KEY `uk_product_branch` (`product_id`, `branch_id`),
  CONSTRAINT `fk_inv_product`
    FOREIGN KEY (`product_id`) REFERENCES `PRODUCT` (`product_id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_inv_branch`
    FOREIGN KEY (`branch_id`) REFERENCES `BRANCH` (`branch_id`)
    ON DELETE CASCADE,
  CONSTRAINT `chk_quantity` CHECK (`quantity` >= 0)
);

-- ============================================================================
-- SIRA 4: INDEXES & VIEWS (PERFORMANS VE RAPORLAMA)
-- ============================================================================

-- 4.1 INDEXES (Sorgu Performansı İçin)
-- Ürün aramaları ve sıralamaları için indeksler
CREATE INDEX idx_product_name ON PRODUCT(product_name);
CREATE INDEX idx_product_price ON PRODUCT(price);
CREATE INDEX idx_product_type ON PRODUCT(product_type);

-- Sipariş sorguları için indeksler
CREATE INDEX idx_order_date ON `ORDER`(order_date);
CREATE INDEX idx_order_customer ON `ORDER`(customer_id);

-- Oyun filtreleme için indeks
CREATE INDEX idx_game_rating ON GAME(ESRB_rating);

-- 4.2 VIEWS (Karmaşık Sorguları Basitleştirmek İçin)

-- VIEW 1: VIEW_PRODUCT_DETAILS
-- Tüm ürünleri (Game ve Console) tek bir tabloda gibi listeler
CREATE OR REPLACE VIEW VIEW_PRODUCT_DETAILS AS
SELECT 
    p.product_id,
    p.product_name,
    p.price,
    p.product_type,
    p.brand,
    p.status,
    -- Oyun detayları (Varsa)
    g.platform,
    g.developer,
    g.ESRB_rating,
    -- Konsol detayları (Varsa)
    c.manufacturer,
    c.storage_capacity,
    c.color
FROM PRODUCT p
LEFT JOIN GAME g ON p.product_id = g.product_id
LEFT JOIN CONSOLE c ON p.product_id = c.product_id;

-- VIEW 2: VIEW_ORDER_SUMMARY
-- Admin paneli için hızlı sipariş özeti
CREATE OR REPLACE VIEW VIEW_ORDER_SUMMARY AS
SELECT 
    o.order_id,
    o.order_date,
    o.order_status,
    o.total_amount,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    c.email,
    COUNT(od.line_no) as item_count
FROM `ORDER` o
JOIN CUSTOMER c ON o.customer_id = c.customer_id
LEFT JOIN ORDER_DETAIL od ON o.order_id = od.order_id
GROUP BY o.order_id;

-- VIEW 3: VIEW_LOW_STOCK
-- Kritik stok seviyesinin altındaki ürünleri listeler
CREATE OR REPLACE VIEW VIEW_LOW_STOCK AS
SELECT 
    i.inventory_id,
    p.product_name,
    b.branch_name,
    i.quantity,
    i.minimum_stock
FROM INVENTORY i
JOIN PRODUCT p ON i.product_id = p.product_id
JOIN BRANCH b ON i.branch_id = b.branch_id
WHERE i.quantity <= i.minimum_stock;

-- ============================================================================
-- SIRA 5: TRIGGERS & LOGS (OTOMASYON)
-- ============================================================================

-- STOCK_LOG Table
CREATE TABLE IF NOT EXISTS `STOCK_LOG` (
  `log_id` INT NOT NULL AUTO_INCREMENT,
  `product_id` INT NOT NULL,
  `branch_id` INT NOT NULL,
  `old_quantity` INT,
  `new_quantity` INT,
  `change_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  CONSTRAINT `fk_log_product`
    FOREIGN KEY (`product_id`) REFERENCES `PRODUCT` (`product_id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_log_branch`
    FOREIGN KEY (`branch_id`) REFERENCES `BRANCH` (`branch_id`)
    ON DELETE CASCADE
);

-- TRIGGER: after_inventory_update
-- Stok değiştiğinde otomatik loglama yapar
DELIMITER //
CREATE TRIGGER after_inventory_update
AFTER UPDATE ON INVENTORY
FOR EACH ROW
BEGIN
    IF OLD.quantity != NEW.quantity THEN
        INSERT INTO STOCK_LOG (product_id, branch_id, old_quantity, new_quantity, change_date)
        VALUES (NEW.product_id, NEW.branch_id, OLD.quantity, NEW.quantity, NOW());
    END IF;
END//
DELIMITER ;