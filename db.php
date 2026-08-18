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
