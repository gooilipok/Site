-- =================================================================
-- BauSquad — База данных MySQL (Схема для phpMyAdmin / MySQL)
-- =================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Таблица пользователей (users)
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `login` varchar(100) NOT NULL UNIQUE,
  `email` varchar(191) NOT NULL UNIQUE,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('customer','admin','user') NOT NULL DEFAULT 'customer',
  `account_status` enum('active','banned','deleted') NOT NULL DEFAULT 'active',
  `is_verified` tinyint(1) NOT NULL DEFAULT 1,
  `verification_code` varchar(20) DEFAULT NULL,
  `telegram_handle` varchar(100) DEFAULT NULL,
  `tg_id` varchar(50) DEFAULT NULL,
  `user_agreement` tinyint(1) NOT NULL DEFAULT 1,
  `privacy_agreement` tinyint(1) NOT NULL DEFAULT 1,
  `processing_personal_data_agreement` tinyint(1) NOT NULL DEFAULT 1,
  `user_agreement_date` datetime DEFAULT NULL,
  `privacy_agreement_date` datetime DEFAULT NULL,
  `processing_personal_data_agreement_date` datetime DEFAULT NULL,
  `registration_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_users_email` (`email`),
  KEY `idx_users_login` (`login`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Системный гостевой пользователь (ID 1)
INSERT IGNORE INTO `users` (`id`, `login`, `email`, `password_hash`, `role`, `account_status`, `is_verified`, `registration_date`)
VALUES (1, 'website_guest', 'guest@bausquad.org', 'nopassword', 'customer', 'active', 1, NOW());

-- Администратор по умолчанию (Логин: BauAdmin / Пароль: admin123)
-- Хэш bcrypt для 'admin123'
INSERT IGNORE INTO `users` (`login`, `email`, `password_hash`, `role`, `account_status`, `is_verified`, `registration_date`)
VALUES ('BauAdmin', 'admin@bausquad.ru', '$2a$10$wE99Kq5K9e0jY/hWv8yBPe5Wq0X8iE1fOqZ9/3z6s4j7xK9.5gWae', 'admin', 'active', 1, NOW());

-- 2. Таблица заказов (orders)
CREATE TABLE IF NOT EXISTS `orders` (
  `order_id` int(11) NOT NULL AUTO_INCREMENT,
  `client_id` int(11) NOT NULL DEFAULT 1,
  `subject` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `deadline` varchar(100) DEFAULT NULL,
  `contact` varchar(255) NOT NULL,
  `source` varchar(50) NOT NULL DEFAULT 'website',
  `status` enum('new','assigned','in_progress','revision','rework','completed','closed','cancelled') NOT NULL DEFAULT 'new',
  `terms_accepted` tinyint(1) NOT NULL DEFAULT 1,
  `privacy_accepted` tinyint(1) NOT NULL DEFAULT 1,
  `consent_accepted` tinyint(1) NOT NULL DEFAULT 1,
  `agreements_accepted_at` datetime DEFAULT NULL,
  `guest_email` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`order_id`),
  KEY `idx_orders_client_id` (`client_id`),
  KEY `idx_orders_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Таблица стоимостей и расчетов (payments)
CREATE TABLE IF NOT EXISTS `payments` (
  `payment_id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL UNIQUE,
  `client_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `executer_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` varchar(50) NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`payment_id`),
  KEY `idx_payments_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Таблица обращений в техподдержку (support_requests)
CREATE TABLE IF NOT EXISTS `support_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `client_id` varchar(100) NOT NULL DEFAULT 'Гость',
  `message` text NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'new',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Таблица кодов подтверждения email (verification_codes)
CREATE TABLE IF NOT EXISTS `verification_codes` (
  `email` varchar(191) NOT NULL,
  `code` varchar(20) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `expires_at` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
