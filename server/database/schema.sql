-- =========================================================================
-- WebNexa Multi-Vendor E-Commerce Marketplace
-- Normalized MySQL Relational Schema
-- Architecture: Strictly Separated Tables for `buyers`, `vendors`, and `admins`
-- Platform Features: Vendor Verification, Multi-Vendor Catalog, Escrow Ledger, Paystack Integration
-- =========================================================================

CREATE DATABASE IF NOT EXISTS `webnexa_marketplace` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `webnexa_marketplace`;

CREATE TABLE IF NOT EXISTS `restaurants` (
  `id` VARCHAR(36) NOT NULL, `vendor_id` VARCHAR(36) NOT NULL, `business_name` VARCHAR(255) NOT NULL,
  `cuisine_type` VARCHAR(120) NOT NULL, `opening_hours` VARCHAR(255) NOT NULL,
  `delivery_radius_km` DECIMAL(8,2) NOT NULL DEFAULT 10, `preparation_time_mins` INT NOT NULL DEFAULT 30,
  `hygiene_badges` JSON NULL, `logo_url` LONGTEXT NULL, `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), KEY `idx_restaurants_vendor` (`vendor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `menu_items` (
  `id` VARCHAR(36) NOT NULL, `restaurant_id` VARCHAR(36) NOT NULL, `item_name` VARCHAR(255) NOT NULL,
  `description` TEXT, `price` DECIMAL(12,2) NOT NULL, `category` VARCHAR(100) NOT NULL,
  `image_url` TEXT, `is_available` BOOLEAN NOT NULL DEFAULT TRUE, PRIMARY KEY (`id`),
  KEY `idx_menu_items_restaurant` (`restaurant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `menu_item_addons` (
  `id` VARCHAR(36) NOT NULL, `menu_item_id` VARCHAR(36) NOT NULL, `addon_name` VARCHAR(255) NOT NULL,
  `extra_price` DECIMAL(12,2) NOT NULL DEFAULT 0, PRIMARY KEY (`id`), KEY `idx_addons_item` (`menu_item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `food_orders` (
  `id` VARCHAR(36) NOT NULL, `buyer_id` VARCHAR(36) NOT NULL, `restaurant_id` VARCHAR(36) NOT NULL,
  `total_amount` DECIMAL(12,2) NOT NULL, `delivery_address` TEXT NOT NULL, `delivery_phone` VARCHAR(30) NULL, `preparation_status` VARCHAR(40) NOT NULL DEFAULT 'PLACED',
  `delivery_status` VARCHAR(40) NOT NULL DEFAULT 'PENDING', `delivery_notes` TEXT, `scheduled_for` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), KEY `idx_food_orders_buyer` (`buyer_id`), KEY `idx_food_orders_restaurant` (`restaurant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- Normalized multi-owner wallet ledger. Buyer payments settle into the
-- platform admin wallet; vendor payouts are internal, auditable transfers.
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `wallets` (
  `id` VARCHAR(36) NOT NULL,
  `owner_type` ENUM('buyer', 'vendor', 'admin') NOT NULL,
  `owner_id` VARCHAR(36) NOT NULL,
  `currency` CHAR(3) NOT NULL DEFAULT 'NGN',
  `balance` DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_wallet_owner_currency` (`owner_type`, `owner_id`, `currency`),
  KEY `idx_wallet_owner` (`owner_type`, `owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wallet_transactions` (
  `id` VARCHAR(36) NOT NULL,
  `wallet_id` VARCHAR(36) NOT NULL,
  `owner_type` ENUM('buyer', 'vendor', 'admin') NOT NULL,
  `owner_id` VARCHAR(36) NOT NULL,
  `transaction_type` ENUM('deposit', 'payment', 'payout', 'refund', 'fee', 'adjustment') NOT NULL,
  `direction` ENUM('credit', 'debit') NOT NULL,
  `amount` DECIMAL(18,2) NOT NULL,
  `currency` CHAR(3) NOT NULL DEFAULT 'NGN',
  `provider` ENUM('paystack', 'nowpayments', 'internal') NOT NULL,
  `provider_reference` VARCHAR(255) NULL,
  `status` ENUM('pending', 'completed', 'failed') NOT NULL DEFAULT 'pending',
  `description` VARCHAR(500) NOT NULL,
  `metadata` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_wallet_provider_reference` (`provider`, `provider_reference`),
  KEY `idx_wallet_transactions_owner` (`owner_type`, `owner_id`, `created_at`),
  CONSTRAINT `fk_wallet_transaction_wallet` FOREIGN KEY (`wallet_id`) REFERENCES `wallets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 1. Table: `admins` (WebNexa Administrator Credentials & Privileges)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admins` (
  `id` VARCHAR(36) NOT NULL,
  `username` VARCHAR(100) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `privilege_level` ENUM('SUPER_ADMIN', 'ESCROW_OFFICER', 'COMPLIANCE_MANAGER') NOT NULL DEFAULT 'SUPER_ADMIN',
  `last_login` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_admins_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 2. Table: `buyers` (Buyer Credentials, Profile & Shipping Locations)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `buyers` (
  `id` VARCHAR(36) NOT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `shipping_address` TEXT NULL,
  `phone` VARCHAR(50) NULL,
  `shipping_address_line1` VARCHAR(255) NULL,
  `shipping_address_line2` VARCHAR(255) NULL,
  `city` VARCHAR(100) NULL,
  `state` VARCHAR(100) NULL,
  `country` VARCHAR(100) NOT NULL DEFAULT 'Nigeria',
  `postal_code` VARCHAR(20) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_buyers_email` (`email`),
  KEY `idx_buyers_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 3. Table: `vendors` (Seller Business Info, Bank Payouts, Verification State)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `vendors` (
  `id` VARCHAR(36) NOT NULL,
  `store_name` VARCHAR(255) NULL,
  `business_name` VARCHAR(255) NOT NULL,
  `contact_person` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `company_registration_no` VARCHAR(100) NOT NULL COMMENT 'CAC / RC Number',
  `tax_id` VARCHAR(100) NULL,
  `bank_name` VARCHAR(100) NOT NULL,
  `bank_account_number` VARCHAR(50) NOT NULL,
  `bank_account_name` VARCHAR(255) NOT NULL,
  `bank_code` VARCHAR(20) NOT NULL,
  `store_description` TEXT NULL,
  `store_logo_url` LONGTEXT NULL,
  `is_approved` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Approval gating by Admin',
  `requested_categories` JSON NULL,
  `rejection_reason` TEXT NULL,
  `approved_at` DATETIME NULL,
  `approved_by_admin_id` VARCHAR(36) NULL,
  `wallet_balance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Available funds for withdrawal',
  `escrow_pending_balance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Funds held in escrow pending fulfillment',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_vendors_email` (`email`),
  UNIQUE KEY `idx_vendors_registration_no` (`company_registration_no`),
  KEY `idx_vendors_is_approved` (`is_approved`),
  CONSTRAINT `fk_vendors_approved_by_admin` FOREIGN KEY (`approved_by_admin_id`) 
    REFERENCES `admins` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 4. Table: `products` (Catalog Listed Exclusively by Approved Vendors)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
  `id` VARCHAR(36) NOT NULL,
  `vendor_id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `price` DECIMAL(12, 2) NOT NULL,
  `stock_quantity` INT NOT NULL DEFAULT 0,
  `compare_at_price` DECIMAL(12, 2) NULL,
  `inventory_count` INT NOT NULL DEFAULT 0,
  `category` VARCHAR(100) NOT NULL,
  `images` JSON NOT NULL COMMENT 'Array of image URLs',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `is_approved_by_admin` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_products_slug` (`slug`),
  KEY `idx_products_vendor_id` (`vendor_id`),
  KEY `idx_products_category` (`category`),
  KEY `idx_products_is_active` (`is_active`),
  CONSTRAINT `fk_products_vendor` FOREIGN KEY (`vendor_id`) 
    REFERENCES `vendors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 5. Table: `orders` (Marketplace Purchase Orders with Escrow Tracking)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `orders` (
  `id` VARCHAR(36) NOT NULL,
  `order_number` VARCHAR(50) NOT NULL,
  `buyer_id` VARCHAR(36) NOT NULL,
  `vendor_id` VARCHAR(36) NULL COMMENT 'Legacy compatibility; vendor ownership is normalized in order_items',
  `total_amount` DECIMAL(12, 2) NOT NULL,
  `escrow_fee` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `vendor_payout_amount` DECIMAL(12, 2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'NGN',
  `status` ENUM(
    'PENDING_PAYMENT',
    'HELD_IN_ESCROW',
    'SHIPPED',
    'DELIVERED',
    'delivered_and_completed',
    'ESCROW_RELEASED',
    'REFUNDED',
    'DISPUTED'
  ) NOT NULL DEFAULT 'PENDING_PAYMENT',
  `shipping_address` JSON NOT NULL,
  `carrier_name` VARCHAR(100) NULL,
  `tracking_number` VARCHAR(100) NULL,
  `shipped_at` DATETIME NULL,
  `delivered_at` DATETIME NULL,
  `escrow_released_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_orders_order_number` (`order_number`),
  KEY `idx_orders_buyer_id` (`buyer_id`),
  KEY `idx_orders_vendor_id` (`vendor_id`),
  KEY `idx_orders_status` (`status`),
  CONSTRAINT `fk_orders_buyer` FOREIGN KEY (`buyer_id`) 
    REFERENCES `buyers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_orders_vendor` FOREIGN KEY (`vendor_id`) 
    REFERENCES `vendors` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 6. Table: `order_items` (Individual line items per order)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` VARCHAR(36) NOT NULL,
  `order_id` VARCHAR(36) NOT NULL,
  `product_id` VARCHAR(36) NOT NULL,
  `vendor_id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `price` DECIMAL(12, 2) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `subtotal` DECIMAL(12, 2) NOT NULL,
  `image` VARCHAR(500) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_order_items_order_id` (`order_id`),
  KEY `idx_order_items_product_id` (`product_id`),
  KEY `idx_order_items_vendor_id` (`vendor_id`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) 
    REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) 
    REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_order_items_vendor` FOREIGN KEY (`vendor_id`) 
    REFERENCES `vendors` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 7. Table: `escrow_transactions` (Audit log of WebNexa Escrow Vault Holds & Releases)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `escrow_transactions` (
  `id` VARCHAR(36) NOT NULL,
  `order_id` VARCHAR(36) NOT NULL,
  `buyer_id` VARCHAR(36) NOT NULL,
  `vendor_id` VARCHAR(36) NOT NULL,
  `paystack_reference` VARCHAR(100) NOT NULL,
  `paystack_channel` VARCHAR(50) NULL DEFAULT 'card',
  `amount` DECIMAL(12, 2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'NGN',
  `status` ENUM('held', 'released', 'refunded') NOT NULL DEFAULT 'held',
  `escrow_status` ENUM(
    'HOLDING',
    'RELEASED_TO_VENDOR',
    'REFUNDED_TO_BUYER',
    'DISPUTED'
  ) NOT NULL DEFAULT 'HOLDING',
  `released_by_admin_id` VARCHAR(36) NULL,
  `released_at` DATETIME NULL,
  `paystack_metadata` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_escrow_paystack_ref` (`paystack_reference`),
  KEY `idx_escrow_order_id` (`order_id`),
  KEY `idx_escrow_buyer_id` (`buyer_id`),
  KEY `idx_escrow_vendor_id` (`vendor_id`),
  KEY `idx_escrow_status` (`escrow_status`),
  CONSTRAINT `fk_escrow_order` FOREIGN KEY (`order_id`) 
    REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_escrow_buyer` FOREIGN KEY (`buyer_id`) 
    REFERENCES `buyers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_escrow_vendor` FOREIGN KEY (`vendor_id`) 
    REFERENCES `vendors` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_escrow_admin` FOREIGN KEY (`released_by_admin_id`) 
    REFERENCES `admins` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `vendor_reviews` (
  `id` VARCHAR(36) NOT NULL,
  `vendor_id` VARCHAR(36) NOT NULL,
  `buyer_id` VARCHAR(36) NOT NULL,
  `order_id` VARCHAR(36) NOT NULL,
  `rating` TINYINT UNSIGNED NOT NULL,
  `review_text` TEXT NULL,
  `photo_url` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_vendor_reviews_buyer_order_vendor` (`vendor_id`, `buyer_id`, `order_id`),
  KEY `idx_vendor_reviews_vendor_id` (`vendor_id`),
  CONSTRAINT `fk_vendor_reviews_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vendor_reviews_buyer` FOREIGN KEY (`buyer_id`) REFERENCES `buyers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vendor_reviews_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_vendor_reviews_rating` CHECK (`rating` BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `vendor_wallet` (
  `id` VARCHAR(36) NOT NULL,
  `vendor_id` VARCHAR(36) NOT NULL,
  `available_balance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `pending_balance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'NGN',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_vendor_wallet_vendor_id` (`vendor_id`),
  CONSTRAINT `fk_vendor_wallet_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` VARCHAR(36) NOT NULL,
  `sender_id` VARCHAR(36) NOT NULL,
  `sender_role` ENUM('buyer', 'vendor') NOT NULL,
  `recipient_id` VARCHAR(36) NOT NULL,
  `recipient_role` ENUM('buyer', 'vendor') NOT NULL,
  `body` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_chat_participants` (`sender_id`, `recipient_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `social_posts` (
  `id` VARCHAR(36) NOT NULL,
  `author_id` VARCHAR(36) NOT NULL,
  `author_role` ENUM('buyer', 'vendor') NOT NULL,
  `handle` VARCHAR(80) NOT NULL,
  `body` TEXT NOT NULL,
  `media_url` VARCHAR(1000) NULL,
  `product_id` VARCHAR(36) NULL,
  `likes_count` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_social_posts_created_at` (`created_at`),
  KEY `idx_social_posts_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
