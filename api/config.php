<?php
/**
 * BauSquad — PHP Backend Configuration
 * Настройки подключения к базе данных MySQL, Telegram Bot API и почте SMTP
 */

// 1. Database Configuration (MySQL)
define('DB_HOST', getenv('MYSQL_HOST') ?: 'mysql.hosting.nic.ru');
define('DB_PORT', getenv('MYSQL_PORT') ?: '3306');
define('DB_NAME', getenv('MYSQL_DATABASE') ?: 'bau7824897_db');
define('DB_USER', getenv('MYSQL_USER') ?: 'bau7824897_mysql');
define('DB_PASS', getenv('MYSQL_PASSWORD') ?: 'AhTFV6g/');

// 2. Telegram Bot Configuration
define('TELEGRAM_BOT_TOKEN', getenv('TELEGRAM_BOT_TOKEN') ?: '8028795777:AAGFz2YxYm4G_0W8tWqB3rF7M-3t9Y0g-tM');
define('TELEGRAM_CHAT_ID', getenv('TELEGRAM_ADMIN_CHAT_ID') ?: (getenv('TELEGRAM_CHAT_ID') ?: '-1002345678901'));
define('TELEGRAM_API_PROXY', getenv('TELEGRAM_API_PROXY') ?: '');

// 3. SMTP / Mailer Configuration
define('SMTP_HOST', getenv('SMTP_HOST') ?: 'mail.nic.ru');
define('SMTP_PORT', getenv('SMTP_PORT') ?: 465);
define('SMTP_USER', getenv('SMTP_USER') ?: 'bausquadresponse@bausquad.org');
define('SMTP_PASS', getenv('SMTP_PASSWORD') ?: (getenv('SMTP_PASS') ?: 'I*D8J2{W51zG(a^f'));
define('SMTP_FROM', getenv('SMTP_FROM') ?: 'BauSquad <bausquadresponse@bausquad.org>');

// 4. Security & JWT
define('JWT_SECRET', getenv('SECRET_KEY') ?: 'bau_squad_php_secret_key_2026');
define('JWT_ACCESS_EXPIRY', 1800); // 30 mins
define('JWT_REFRESH_EXPIRY', 7 * 86400); // 7 days

// 5. Uploads Directory
define('UPLOADS_DIR', __DIR__ . '/../uploads/');
if (!is_dir(UPLOADS_DIR)) {
    @mkdir(UPLOADS_DIR, 0755, true);
}

// 6. Global CORS and JSON Headers
function sendCorsHeaders() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
    header("Access-Control-Allow-Origin: {$origin}");
    header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization");
    header("Access-Control-Allow-Credentials: true");
    
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}

function getJsonInput() {
    $raw = file_get_contents('php://input');
    if (!$raw) return $_POST;
    $parsed = json_decode($raw, true);
    return is_array($parsed) ? array_merge($_POST, $parsed) : $_POST;
}
