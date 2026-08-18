<?php
/**
 * BauSquad — Database Connection via PDO (MySQL)
 */
require_once __DIR__ . '/config.php';

function getDB(): ?PDO {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    try {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::ATTR_TIMEOUT            => 5,
        ];
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        
        // Ensure initial tables exist if database is blank
        initDatabaseTables($pdo);

        return $pdo;
    } catch (PDOException $e) {
        error_log("[MySQL PDO Error]: " . $e->getMessage());
        return null;
    }
}

function initDatabaseTables(PDO $pdo) {
    try {
        // Users Table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `users` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `login` VARCHAR(100) NOT NULL UNIQUE,
            `email` VARCHAR(191) NOT NULL UNIQUE,
            `password_hash` VARCHAR(255) NOT NULL,
            `role` ENUM('customer', 'admin', 'user') DEFAULT 'customer',
            `account_status` ENUM('active', 'banned', 'deleted') DEFAULT 'active',
            `is_verified` TINYINT(1) DEFAULT 0,
            `verification_code` VARCHAR(20) NULL,
            `telegram_handle` VARCHAR(100) NULL,
            `tg_id` VARCHAR(50) NULL,
            `user_agreement` TINYINT(1) DEFAULT 1,
            `privacy_agreement` TINYINT(1) DEFAULT 1,
            `processing_personal_data_agreement` TINYINT(1) DEFAULT 1,
            `user_agreement_date` DATETIME NULL,
            `privacy_agreement_date` DATETIME NULL,
            `processing_personal_data_agreement_date` DATETIME NULL,
            `registration_date` DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        // Ensure system guest user (id = 1)
        $stmt = $pdo->prepare("SELECT id FROM users WHERE id = 1");
        $stmt->execute();
        if (!$stmt->fetch()) {
            $pdo->exec("INSERT INTO users (id, login, email, password_hash, role, account_status, is_verified, registration_date)
                        VALUES (1, 'website_guest', 'guest@bausquad.org', 'nopassword', 'customer', 'active', 1, NOW())");
        }

        // Ensure default admin user exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = 'admin@bausquad.ru' OR login = 'BauAdmin'");
        $stmt->execute();
        if (!$stmt->fetch()) {
            $adminPass = password_hash('admin123', PASSWORD_BCRYPT);
            $pdo->exec("INSERT INTO users (login, email, password_hash, role, account_status, is_verified, registration_date)
                        VALUES ('BauAdmin', 'admin@bausquad.ru', '$adminPass', 'admin', 'active', 1, NOW())");
        }

        // Orders Table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `orders` (
            `order_id` INT AUTO_INCREMENT PRIMARY KEY,
            `client_id` INT NOT NULL DEFAULT 1,
            `subject` VARCHAR(255) NOT NULL,
            `description` TEXT NOT NULL,
            `deadline` VARCHAR(100) NULL,
            `contact` VARCHAR(255) NOT NULL,
            `source` VARCHAR(50) DEFAULT 'website',
            `status` ENUM('new', 'assigned', 'in_progress', 'revision', 'rework', 'completed', 'closed', 'cancelled') DEFAULT 'new',
            `terms_accepted` TINYINT(1) DEFAULT 1,
            `privacy_accepted` TINYINT(1) DEFAULT 1,
            `consent_accepted` TINYINT(1) DEFAULT 1,
            `agreements_accepted_at` DATETIME NULL,
            `guest_email` VARCHAR(255) NULL,
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX (`client_id`),
            INDEX (`status`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        // Payments / Pricing Table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `payments` (
            `payment_id` INT AUTO_INCREMENT PRIMARY KEY,
            `order_id` INT NOT NULL UNIQUE,
            `client_price` DECIMAL(10,2) DEFAULT 0.00,
            `executer_price` DECIMAL(10,2) DEFAULT 0.00,
            `status` VARCHAR(50) DEFAULT 'pending',
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX (`order_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        // Support Requests Table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `support_requests` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `client_id` VARCHAR(100) DEFAULT 'Гость',
            `message` TEXT NOT NULL,
            `status` VARCHAR(50) DEFAULT 'new',
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        // Verification Codes Table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `verification_codes` (
            `email` VARCHAR(191) PRIMARY KEY,
            `code` VARCHAR(20) NOT NULL,
            `username` VARCHAR(100) NOT NULL,
            `password_hash` VARCHAR(255) NOT NULL,
            `expires_at` INT NOT NULL,
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    } catch (Exception $e) {
        error_log("[MySQL Schema Init Warning]: " . $e->getMessage());
    }
}
