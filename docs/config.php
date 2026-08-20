<?php
/**
 * BauSquad — PHP Backend Configuration (Root Level)
 * Автоматическая загрузка и чтение параметров из .env файла
 * Оптимизировано для работы на PHP 7.4+ (RU-CENTER / nic.ru и других хостингах)
 */

error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING & ~E_DEPRECATED);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

if (!ob_get_level()) {
    ob_start();
}

// 1. Автоматический поиск и парсинг .env файла
function loadEnv($customPath = null): ?string {
    $docRoot = isset($_SERVER['DOCUMENT_ROOT']) ? rtrim($_SERVER['DOCUMENT_ROOT'], '/') : '';
    $candidatePaths = array_filter([
        $customPath,
        __DIR__ . '/.env',
        __DIR__ . '/../.env',
        __DIR__ . '/../../.env',
        $docRoot ? $docRoot . '/.env' : null,
        $docRoot ? dirname($docRoot) . '/.env' : null,
        dirname(__DIR__, 2) . '/.env',
        dirname(__DIR__, 3) . '/.env',
        getcwd() . '/.env',
        getcwd() . '/../.env'
    ]);

    $loadedPath = null;
    foreach ($candidatePaths as $path) {
        if (!empty($path) && file_exists($path) && is_readable($path)) {
            $lines = @file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            if ($lines !== false) {
                foreach ($lines as $line) {
                    $line = trim($line);
                    if ($line === '' || strpos($line, '#') === 0 || strpos($line, ';') === 0) {
                        continue;
                    }

                    if (strpos($line, '=') !== false) {
                        list($key, $val) = explode('=', $line, 2);
                        $key = trim($key);
                        $val = trim($val);

                        if ((strpos($val, '"') === 0 && substr($val, -1) === '"') ||
                            (strpos($val, "'") === 0 && substr($val, -1) === "'")) {
                            $val = substr($val, 1, -1);
                        }

                        if (!empty($key)) {
                            putenv("{$key}={$val}");
                            $_ENV[$key] = $val;
                            $_SERVER[$key] = $val;
                        }
                    }
                }
                $loadedPath = $path;
                break;
            }
        }
    }
    return $loadedPath;
}

function env(string $key, $default = null) {
    $val = getenv($key);
    if ($val !== false && $val !== null && $val !== '') {
        return $val;
    }
    if (isset($_ENV[$key]) && $_ENV[$key] !== '') {
        return $_ENV[$key];
    }
    if (isset($_SERVER[$key]) && $_SERVER[$key] !== '') {
        return $_SERVER[$key];
    }
    return $default;
}

$loadedEnvFile = loadEnv();

// 2. Основные параметры приложения
define('APP_NAME', env('APP_NAME', 'BauSquad'));
define('APP_ENV', env('APP_ENV', 'production'));
define('APP_URL', env('APP_URL', 'https://www.bausquad.org'));

// 3. Database Configuration (MySQL)
define('DB_HOST', env('MYSQL_HOST', 'mysql.hosting.nic.ru'));
define('DB_PORT', env('MYSQL_PORT', '3306'));
define('DB_NAME', env('MYSQL_DATABASE', 'bau7824897_db'));
define('DB_USER', env('MYSQL_USER', 'bau7824897_mysql'));
define('DB_PASS', env('MYSQL_PASSWORD', 'AhTFV6g/'));

// 4. Telegram Bot API Settings
define('TELEGRAM_BOT_TOKEN', env('TELEGRAM_BOT_TOKEN', '8655510215:AAHD2y49HbYoXn1lXVbu81sf77Ng9rUPuW8'));
define('TELEGRAM_CHAT_ID', env('TELEGRAM_CHAT_ID', '-1003463870817'));
define('TELEGRAM_API_PROXY', env('TELEGRAM_API_PROXY', 'https://odd.gooilipok2.workers.dev/'));

// 5. SMTP Mail Settings
define('SMTP_HOST', env('SMTP_HOST', 'mail.nic.ru'));
define('SMTP_PORT', (int)env('SMTP_PORT', 465));
define('SMTP_USER', env('SMTP_USER', 'bausquadresponse@bausquad.org'));
define('SMTP_PASS', env('SMTP_PASS', 'W%9_P2y8%i9/'));
define('SMTP_SECURE', env('SMTP_SECURE', 'ssl'));
define('SMTP_FROM', env('SMTP_FROM', 'BauSquad <bausquadresponse@bausquad.org>'));

// 6. Security & JWT Settings
define('JWT_SECRET', env('SECRET_KEY', 'f8d9a2b7c4e109831a'));
define('JWT_ACCESS_EXPIRY', (int)env('ACCESS_TOKEN_EXPIRE_MINUTES', 30) * 60);
define('JWT_REFRESH_EXPIRY', (int)env('REFRESH_TOKEN_EXPIRE_DAYS', 7) * 86400);

// 7. CORS Origins
define('ALLOWED_ORIGINS', env('ALLOWED_ORIGINS', 'http://localhost:3000,https://bausquad.org,https://www.bausquad.org,https://bausquad.ru,https://www.bausquad.ru'));

// 8. Uploads Directory
$uploadsDir = (is_dir(__DIR__ . '/uploads')) ? __DIR__ . '/uploads/' : (is_dir(__DIR__ . '/../uploads') ? __DIR__ . '/../uploads/' : __DIR__ . '/uploads/');
define('UPLOADS_DIR', $uploadsDir);
if (!is_dir(UPLOADS_DIR)) {
    @mkdir(UPLOADS_DIR, 0755, true);
}

// 9. Global CORS and JSON Headers
function sendCorsHeaders() {
    if (headers_sent()) return;

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
    $allowedList = array_map('trim', explode(',', ALLOWED_ORIGINS));

    if (in_array($origin, $allowedList) || in_array('*', $allowedList) || empty($_SERVER['HTTP_ORIGIN'])) {
        header("Access-Control-Allow-Origin: {$origin}");
    } else {
        header("Access-Control-Allow-Origin: " . ($allowedList[0] ?? '*'));
    }

    header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Max-Age: 86400");

    if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit(0);
    }
}

function jsonResponse($data, int $statusCode = 200) {
    while (ob_get_level()) {
        @ob_end_clean();
    }
    sendCorsHeaders();
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit(0);
}

function getJsonInput(): array {
    $input = file_get_contents('php://input');
    if (!empty($input)) {
        $data = json_decode($input, true);
        if (is_array($data)) {
            return !empty($_POST) ? array_merge($_POST, $data) : $data;
        }
    }
    return !empty($_POST) ? $_POST : [];
}

// Shutdown handler
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        while (ob_get_level()) {
            @ob_end_clean();
        }
        sendCorsHeaders();
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'error' => 'Критическая ошибка PHP на сервере',
            'detail' => $error['message'],
            'file' => basename($error['file']) . ':' . $error['line']
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
});
