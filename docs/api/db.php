<?php
/**
 * BauSquad — Database Connection via PDO (MySQL)
 * Совместимость с официальным дампом базы данных MySQL bau7824897_db
 */
require_once __DIR__ . '/config.php';

$lastDbConnectionError = null;

function getDB(): ?PDO {
    static $pdo = null;
    global $lastDbConnectionError;

    if ($pdo !== null) {
        return $pdo;
    }

    $hosts = array_unique(array_filter([
        DB_HOST,
        'localhost',
        '127.0.0.1',
        'mysql.hosting.nic.ru',
        'bau7824897.mysql'
    ]));

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::ATTR_TIMEOUT            => 3,
    ];

    foreach ($hosts as $host) {
        try {
            $dsn = "mysql:host={$host};port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $conn = new PDO($dsn, DB_USER, DB_PASS, $options);
            $pdo = $conn;
            $lastDbConnectionError = null;
            return $pdo;
        } catch (\Throwable $e) {
            $lastDbConnectionError = $e->getMessage() . " (Host: {$host})";
            error_log("[MySQL PDO Try {$host} Failed]: " . $e->getMessage());
        }
    }

    return null;
}

/**
 * Получить список колонок таблицы (кешируется в памяти)
 */
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

/**
 * Проверить существование таблицы
 */
function tableExists(PDO $pdo, string $tableName): bool {
    try {
        $stmt = $pdo->prepare("SHOW TABLES LIKE ?");
        $stmt->execute([$tableName]);
        return (bool)$stmt->fetch();
    } catch (\Throwable $e) {
        return false;
    }
}

/**
 * Инициализация структуры таблиц базы данных (в соответствии со схемой дампа)
 */
function initDatabaseTables(PDO $pdo): array {
    $results = [];
    try {
        // Users Table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `users` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `login` VARCHAR(64) NULL UNIQUE,
            `password_hash` VARCHAR(255) NULL,
            `email` VARCHAR(255) NULL UNIQUE,
            `tg_id` BIGINT NULL UNIQUE,
            `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user',
            `account_status` ENUM('active', 'banned', 'deleted') NOT NULL DEFAULT 'active',
            `registration_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `is_verified` TINYINT(1) NOT NULL DEFAULT 0,
            `verification_code` VARCHAR(10) NULL,
            `contact` VARCHAR(255) NULL,
            `user_agreement` TINYINT(1) NOT NULL DEFAULT 0,
            `privacy_agreement` TINYINT(1) NOT NULL DEFAULT 0,
            `processing_personal_data_agreement` TINYINT(1) NOT NULL DEFAULT 0,
            `user_agreement_date` DATETIME NULL,
            `privacy_agreement_date` DATETIME NULL,
            `processing_personal_data_agreement_date` DATETIME NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
        $results[] = "Таблица `users` проверена";

        // Ensure system guest user (id = 1)
        try {
            $stmt = $pdo->prepare("SELECT id FROM users WHERE id = 1");
            $stmt->execute();
            if (!$stmt->fetch()) {
                $pdo->exec("INSERT IGNORE INTO users (id, login, email, password_hash, role, account_status, is_verified, registration_date)
                            VALUES (1, 'website_guest', 'guest@bausquad.org', 'nopassword', 'user', 'active', 1, NOW())");
                $results[] = "Гостевой пользователь (ID 1) добавлен";
            }
        } catch (\Throwable $e) {}

        // Ensure default admin user exists
        try {
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = 'admin@bausquad.ru' OR login = 'BauAdmin'");
            $stmt->execute();
            if (!$stmt->fetch()) {
                $adminPass = password_hash('admin123', PASSWORD_BCRYPT);
                $pdo->exec("INSERT IGNORE INTO users (login, email, password_hash, role, account_status, is_verified, registration_date)
                            VALUES ('BauAdmin', 'admin@bausquad.ru', '$adminPass', 'admin', 'active', 1, NOW())");
                $results[] = "Администратор BauAdmin добавлен";
            }
        } catch (\Throwable $e) {}

        // Orders Table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `orders` (
            `order_id` INT AUTO_INCREMENT PRIMARY KEY,
            `client_id` INT DEFAULT 1,
            `executer_id` INT DEFAULT NULL,
            `subject` VARCHAR(255) NOT NULL,
            `description` TEXT NULL,
            `deadline` VARCHAR(255) NULL,
            `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `completed_at` DATETIME DEFAULT NULL,
            `status` ENUM('new', 'assigned', 'in_progress', 'rework', 'completed', 'closed', 'cancelled') NOT NULL DEFAULT 'new',
            `rework_count` INT NOT NULL DEFAULT 0,
            `contact` VARCHAR(255) NULL,
            `source` ENUM('telegram', 'website') NOT NULL DEFAULT 'website',
            `terms_accepted` TINYINT(1) NOT NULL DEFAULT 1,
            `privacy_accepted` TINYINT(1) NOT NULL DEFAULT 1,
            `consent_accepted` TINYINT(1) NOT NULL DEFAULT 1,
            `agreements_accepted_at` DATETIME NULL,
            `guest_email` VARCHAR(255) NULL,
            INDEX (`client_id`),
            INDEX (`executer_id`),
            INDEX (`status`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
        $results[] = "Таблица `orders` проверена";

        // Payments Table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `payments` (
            `order_id` INT NOT NULL PRIMARY KEY,
            `client_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            `client_payment_date` DATETIME NULL,
            `executer_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            `executer_payment_date` DATETIME NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
        $results[] = "Таблица `payments` проверена";

        // Support Requests Table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `support_requests` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `client_id` INT NOT NULL DEFAULT 1,
            `message` TEXT NOT NULL,
            `status` ENUM('new', 'in_progress', 'closed') NOT NULL DEFAULT 'new',
            `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX (`client_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
        $results[] = "Таблица `support_requests` проверена";

        // Verification Codes Table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `verification_codes` (
            `email` VARCHAR(191) PRIMARY KEY,
            `code` VARCHAR(20) NOT NULL,
            `username` VARCHAR(100) NOT NULL,
            `password_hash` VARCHAR(255) NOT NULL,
            `expires_at` INT NOT NULL,
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
        $results[] = "Таблица `verification_codes` проверена";

        return ['success' => true, 'messages' => $results];
    } catch (\Throwable $e) {
        error_log("[MySQL Schema Init Error]: " . $e->getMessage());
        return ['success' => false, 'error' => $e->getMessage(), 'messages' => $results];
    }
}
