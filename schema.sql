-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: mysql.hosting.nic.ru    Database: bau7824897_db
-- ------------------------------------------------------
-- Server version	5.6.41

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

--
-- Table structure for table `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `login` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tg_id` bigint DEFAULT NULL,
  `role` enum('user','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `account_status` enum('active','banned','deleted') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `registration_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_verified` tinyint(1) NOT NULL DEFAULT '0',
  `verification_code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agreement` tinyint(1) NOT NULL DEFAULT '0',
  `privacy_agreement` tinyint(1) NOT NULL DEFAULT '0',
  `processing_personal_data_agreement` tinyint(1) NOT NULL DEFAULT '0',
  `user_agreement_date` datetime DEFAULT NULL,
  `privacy_agreement_date` datetime DEFAULT NULL,
  `processing_personal_data_agreement_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `login` (`login`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `tg_id` (`tg_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `orders`
--

CREATE TABLE IF NOT EXISTS `orders` (
  `order_id` int NOT NULL AUTO_INCREMENT,
  `client_id` int DEFAULT '1',
  `executer_id` int DEFAULT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `deadline` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` datetime DEFAULT NULL,
  `status` enum('new','assigned','in_progress','rework','completed','closed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'new',
  `rework_count` int NOT NULL DEFAULT '0',
  `contact` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `source` enum('telegram','website') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'website',
  `terms_accepted` tinyint(1) NOT NULL DEFAULT '1',
  `privacy_accepted` tinyint(1) NOT NULL DEFAULT '1',
  `consent_accepted` tinyint(1) NOT NULL DEFAULT '1',
  `agreements_accepted_at` datetime DEFAULT NULL,
  `guest_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`order_id`),
  KEY `fk_orders_client` (`client_id`),
  KEY `fk_orders_executer` (`executer_id`),
  CONSTRAINT `fk_orders_client` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_orders_executer` FOREIGN KEY (`executer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `payments`
--

CREATE TABLE IF NOT EXISTS `payments` (
  `order_id` int NOT NULL,
  `client_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `client_payment_date` datetime DEFAULT NULL,
  `executer_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `executer_payment_date` datetime DEFAULT NULL,
  PRIMARY KEY (`order_id`),
  CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `support_requests`
--

CREATE TABLE IF NOT EXISTS `support_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL DEFAULT 1,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('new','in_progress','closed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'new',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_support_client` (`client_id`),
  CONSTRAINT `fk_support_client` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `verification_codes`
--

CREATE TABLE IF NOT EXISTS `verification_codes` (
  `email` varchar(191) NOT NULL,
  `code` varchar(20) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `expires_at` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Default Initial Records
--

INSERT IGNORE INTO `users` (`id`, `login`, `email`, `password_hash`, `role`, `account_status`, `is_verified`, `registration_date`)
VALUES (1, 'website_guest', 'guest@bausquad.org', 'nopassword', 'user', 'active', 1, NOW());

SET FOREIGN_KEY_CHECKS = 1;
