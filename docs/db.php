<?php
/**
 * BauSquad — Database Connection via PDO (MySQL)
 * Совместимость с официальным дампом базы данных MySQL bau7824897_db
 */
require_once __DIR__ . '/config.php';

$lastDbConnectionError = null;

function ensureDatabaseSchema(PDO $pdo): void {
    static $migrated = false;
    if ($migrated) return;
    $migrated = true;

    try {
        // 1. Create verification_codes table if it does not exist
        $pdo->exec("CREATE TABLE IF NOT EXISTS `verification_codes` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `email` VARCHAR(255) NOT NULL,
            `code` VARCHAR(10) NOT NULL,
            `expires_at` DATETIME NOT NULL,
            `created_at` DATETIME NOT NULL,
            INDEX `idx_email_code` (`email`, `code`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        // 2. Ensure missing columns in users table
        $userCols = getTableColumns($pdo, 'users');
        if (!empty($userCols)) {
            $userAdds = [];
            if (!in_array('telegram_handle', $userCols, true)) $userAdds[] = "ADD COLUMN `telegram_handle` VARCHAR(255) DEFAULT ''";
            if (!in_array('tg_id', $userCols, true)) $userAdds[] = "ADD COLUMN `tg_id` VARCHAR(255) DEFAULT ''";
            if (!in_array('user_agreement', $userCols, true)) $userAdds[] = "ADD COLUMN `user_agreement` TINYINT DEFAULT 1";
            if (!in_array('user_agreement_date', $userCols, true)) $userAdds[] = "ADD COLUMN `user_agreement_date` DATETIME NULL";
            if (!in_array('privacy_agreement', $userCols, true)) $userAdds[] = "ADD COLUMN `privacy_agreement` TINYINT DEFAULT 1";
            if (!in_array('privacy_agreement_date', $userCols, true)) $userAdds[] = "ADD COLUMN `privacy_agreement_date` DATETIME NULL";
            if (!in_array('processing_personal_data_agreement', $userCols, true)) $userAdds[] = "ADD COLUMN `processing_personal_data_agreement` TINYINT DEFAULT 1";
            if (!in_array('processing_personal_data_agreement_date', $userCols, true)) $userAdds[] = "ADD COLUMN `processing_personal_data_agreement_date` DATETIME NULL";
            if (!in_array('account_status', $userCols, true)) $userAdds[] = "ADD COLUMN `account_status` VARCHAR(50) DEFAULT 'active'";
            if (!in_array('is_verified', $userCols, true)) $userAdds[] = "ADD COLUMN `is_verified` TINYINT DEFAULT 1";

            if (!empty($userAdds)) {
                @$pdo->exec("ALTER TABLE `users` " . implode(', ', $userAdds));
            }
        }

        // 3. Ensure missing columns in orders table
        $orderCols = getTableColumns($pdo, 'orders');
        if (!empty($orderCols)) {
            $orderAdds = [];
            if (!in_array('subject', $orderCols, true)) $orderAdds[] = "ADD COLUMN `subject` VARCHAR(255) DEFAULT ''";
            if (!in_array('title', $orderCols, true)) $orderAdds[] = "ADD COLUMN `title` VARCHAR(255) DEFAULT ''";
            if (!in_array('work_type', $orderCols, true)) $orderAdds[] = "ADD COLUMN `work_type` VARCHAR(100) DEFAULT 'Чертеж'";
            if (!in_array('deadline', $orderCols, true)) $orderAdds[] = "ADD COLUMN `deadline` VARCHAR(100) DEFAULT ''";
            if (!in_array('contact', $orderCols, true)) $orderAdds[] = "ADD COLUMN `contact` VARCHAR(255) DEFAULT ''";
            if (!in_array('price', $orderCols, true)) $orderAdds[] = "ADD COLUMN `price` VARCHAR(100) DEFAULT 'На обсуждении'";
            if (!in_array('client_price', $orderCols, true)) $orderAdds[] = "ADD COLUMN `client_price` VARCHAR(100) DEFAULT 'На обсуждении'";
            if (!in_array('executer_price', $orderCols, true)) $orderAdds[] = "ADD COLUMN `executer_price` VARCHAR(100) DEFAULT ''";
            if (!in_array('files', $orderCols, true)) $orderAdds[] = "ADD COLUMN `files` TEXT NULL";
            if (!in_array('updated_at', $orderCols, true)) $orderAdds[] = "ADD COLUMN `updated_at` DATETIME NULL";

            if (!empty($orderAdds)) {
                @$pdo->exec("ALTER TABLE `orders` " . implode(', ', $orderAdds));
            }
        }
    } catch (\Throwable $e) {
        error_log("[DB Schema Check Notice]: " . $e->getMessage());
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
        PDO::ATTR_TIMEOUT            => 2, // 2 секунды таймаут
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
