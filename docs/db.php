<?php
/**
 * BauSquad — Database Connection via PDO (MySQL)
 * Полное соответствие структуре базы данных bau7824897_db
 */
require_once __DIR__ . '/config.php';

$lastDbConnectionError = null;

function ensureDatabaseSchema(PDO $pdo): void {
    static $migrated = false;
    if ($migrated) return;
    $migrated = true;

    try {
        // 1. Create users table if missing
        $pdo->exec("CREATE TABLE IF NOT EXISTS `users` (
            `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            `login` VARCHAR(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            `password_hash` VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            `email` VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            `tg_id` BIGINT DEFAULT NULL,
            `role` ENUM('user','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
            `account_status` ENUM('active','banned','deleted') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
            `registration_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `is_verified` TINYINT(1) NOT NULL DEFAULT '0',
            `verification_code` VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            `contact` VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            `user_agreement` TINYINT(1) NOT NULL DEFAULT '0',
            `privacy_agreement` TINYINT(1) NOT NULL DEFAULT '0',
            `processing_personal_data_agreement` TINYINT(1) NOT NULL DEFAULT '0',
            `user_agreement_date` DATETIME DEFAULT NULL,
            `privacy_agreement_date` DATETIME DEFAULT NULL,
            `processing_personal_data_agreement_date` DATETIME DEFAULT NULL,
            `telegram_handle` VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
            UNIQUE KEY `login` (`login`),
            UNIQUE KEY `email` (`email`),
            UNIQUE KEY `tg_id` (`tg_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

        // 2. Create orders table if missing
        $pdo->exec("CREATE TABLE IF NOT EXISTS `orders` (
            `order_id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            `client_id` INT DEFAULT '1',
            `executer_id` INT DEFAULT NULL,
            `subject` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
            `description` TEXT COLLATE utf8mb4_unicode_ci,
            `deadline` VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `completed_at` DATETIME DEFAULT NULL,
            `status` ENUM('new','assigned','in_progress','rework','completed','closed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'new',
            `rework_count` INT NOT NULL DEFAULT '0',
            `contact` VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            `source` ENUM('telegram','website') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'website',
            `terms_accepted` TINYINT(1) NOT NULL DEFAULT '1',
            `privacy_accepted` TINYINT(1) NOT NULL DEFAULT '1',
            `consent_accepted` TINYINT(1) NOT NULL DEFAULT '1',
            `agreements_accepted_at` DATETIME DEFAULT NULL,
            KEY `fk_orders_client` (`client_id`),
            KEY `fk_orders_executer` (`executer_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

        // 3. Create payments table if missing
        $pdo->exec("CREATE TABLE IF NOT EXISTS `payments` (
            `order_id` INT NOT NULL PRIMARY KEY,
            `client_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            `client_payment_date` DATETIME DEFAULT NULL,
            `executer_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            `executer_payment_date` DATETIME DEFAULT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

        // 4. Create support_requests table if missing
        $pdo->exec("CREATE TABLE IF NOT EXISTS `support_requests` (
            `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            `client_id` INT NOT NULL DEFAULT 1,
            `message` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            `status` ENUM('new','in_progress','closed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'new',
            `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            KEY `fk_support_client` (`client_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

        // 5. Create verification_codes table if missing
        $pdo->exec("CREATE TABLE IF NOT EXISTS `verification_codes` (
            `email` VARCHAR(191) NOT NULL PRIMARY KEY,
            `code` VARCHAR(20) NOT NULL,
            `username` VARCHAR(100) NOT NULL,
            `password_hash` VARCHAR(255) NOT NULL,
            `expires_at` INT NOT NULL,
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        // 6. Ensure default guest user (ID 1)
        $pdo->exec("INSERT IGNORE INTO `users` (`id`, `login`, `password_hash`, `email`, `role`, `account_status`, `is_verified`, `registration_date`) 
                    VALUES (1, 'website_guest', 'nopassword', 'guest@bausquad.org', 'user', 'active', 1, NOW())");

    } catch (\Throwable $e) {
        error_log("[DB Schema Init Notice]: " . $e->getMessage());
    }
}

function getDB(): ?PDO {
    static $pdo = null;
    global $lastDbConnectionError;

    if ($pdo !== null) {
        return $pdo;
    }

    $primaryHost = DB_HOST ?: 'mysql.hosting.nic.ru';
    $hosts = array_unique([$primaryHost, 'localhost', '127.0.0.1']);

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::ATTR_TIMEOUT            => 2,
    ];

    foreach ($hosts as $host) {
        try {
            $dsn = "mysql:host={$host};port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $conn = new PDO($dsn, DB_USER, DB_PASS, $options);
            $pdo = $conn;
            $lastDbConnectionError = null;
            ensureDatabaseSchema($pdo);
            return $pdo;
        } catch (\Throwable $e) {
            $lastDbConnectionError = $e->getMessage() . " (Host: {$host})";
            error_log("[MySQL PDO Try {$host} Failed]: " . $e->getMessage());
        }
    }

    return null;
}

function getTableColumns(PDO $pdo, string $tableName): array {
    static $cache = [];
    if (isset($cache[$tableName])) {
        return $cache[$tableName];
    }
    try {
        $stmt = $pdo->prepare("SHOW COLUMNS FROM `{$tableName}`");
        $stmt->execute();
        $cols = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
        $cache[$tableName] = $cols ?: [];
        return $cache[$tableName];
    } catch (\Throwable $e) {
        return [];
    }
}

function getOrderPrimaryKey(PDO $pdo): string {
    $cols = getTableColumns($pdo, 'orders');
    if (in_array('order_id', $cols, true)) {
        return 'order_id';
    }
    return 'id';
}
