<?php
/**
 * BauSquad — Hosting Diagnostics & Health Inspector (Root Level)
 * Доступно по адресу: https://www.bausquad.org/diag.php (или /diag.php?format=json)
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt.php';
require_once __DIR__ . '/telegram.php';

$format = $_GET['format'] ?? (isset($_GET['json']) ? 'json' : 'html');

$report = [
    'timestamp' => date('c'),
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'php_version' => PHP_VERSION,
    'php_sapi' => php_sapi_name(),
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? '',
    'script_filename' => $_SERVER['SCRIPT_FILENAME'] ?? '',
    'loaded_env_path' => $loadedEnvFile ?: 'default constants',
    'checks' => []
];

// 1. Extensions
$requiredExtensions = ['pdo', 'pdo_mysql', 'curl', 'json', 'mbstring', 'openssl'];
$extResults = [];
foreach ($requiredExtensions as $ext) {
    $extResults[$ext] = extension_loaded($ext);
}
$report['checks']['extensions'] = [
    'status' => !in_array(false, $extResults, true) ? 'OK' : 'WARNING',
    'details' => $extResults
];

// 2. MySQL Connection
$startDb = microtime(true);
$pdo = null;
try {
    $pdo = getDB();
} catch (\Throwable $e) {}
$dbDuration = round((microtime(true) - $startDb) * 1000, 2);

if ($pdo) {
    $tables = [];
    $tableCounts = [];
    try {
        $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
        foreach ($tables as $t) {
            $c = $pdo->query("SELECT COUNT(*) FROM `{$t}`")->fetchColumn();
            $tableCounts[$t] = (int)$c;
        }
    } catch (\Throwable $e) {}

    $report['checks']['database'] = [
        'status' => 'OK',
        'host' => DB_HOST,
        'database' => DB_NAME,
        'user' => DB_USER,
        'ping_ms' => $dbDuration,
        'tables_count' => count($tables),
        'tables' => $tableCounts
    ];
} else {
    global $lastDbConnectionError;
    $report['checks']['database'] = [
        'status' => 'FAIL',
        'host' => DB_HOST,
        'database' => DB_NAME,
        'user' => DB_USER,
        'ping_ms' => $dbDuration,
        'error' => $lastDbConnectionError ?: 'Не удалось подключиться к MySQL'
    ];
}

// 3. Telegram Bot Check
$startTg = microtime(true);
$tgCheck = ['ok' => false, 'error' => 'Skipped in fast check'];
if (isset($_GET['test_telegram'])) {
    $tgCheck = sendTelegramRequest('getMe', [], false, 1);
} else {
    $tgCheck = ['ok' => !empty(TELEGRAM_BOT_TOKEN), 'note' => 'Token configured (add ?test_telegram=1 to ping live)'];
}
$tgDuration = round((microtime(true) - $startTg) * 1000, 2);

$report['checks']['telegram'] = [
    'status' => !empty($tgCheck['ok']) ? 'OK' : 'WARNING',
    'ping_ms' => $tgDuration,
    'bot_token_set' => !empty(TELEGRAM_BOT_TOKEN),
    'chat_id_set' => !empty(TELEGRAM_CHAT_ID),
    'proxy' => TELEGRAM_API_PROXY,
    'response' => $tgCheck
];

// 4. File System
$uploadsWritable = is_writable(UPLOADS_DIR);
$report['checks']['filesystem'] = [
    'uploads_dir' => UPLOADS_DIR,
    'uploads_exists' => is_dir(UPLOADS_DIR),
    'uploads_writable' => $uploadsWritable,
    'status' => $uploadsWritable ? 'OK' : 'WARNING'
];

// 5. Password Hashing Test
$testHash = password_hash('test12345', PASSWORD_BCRYPT);
$hashCheck = verifyPassword('test12345', $testHash);
$report['checks']['password_hashing'] = [
    'bcrypt_working' => $hashCheck,
    'status' => $hashCheck ? 'OK' : 'FAIL'
];

if ($format === 'json' || isset($_GET['json'])) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit(0);
}

// HTML View
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>BauSquad — Диагностика Хостинга</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f1418; color: #ecf0f1; margin: 0; padding: 24px; line-height: 1.6; }
        .container { max-width: 860px; margin: 0 auto; }
        h1 { color: #c5a059; margin-top: 0; font-size: 24px; border-bottom: 2px solid #c5a059; padding-bottom: 12px; }
        .card { background: #1a252f; border: 1px solid #2b3d4f; border-radius: 8px; padding: 18px; margin-bottom: 18px; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 12px; }
        .badge-ok { background: #2ecc71; color: #000; }
        .badge-fail { background: #e74c3c; color: #fff; }
        .badge-warn { background: #f39c12; color: #000; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .row:last-child { border-bottom: none; }
        .label { color: #95a5a6; font-weight: 500; }
        .val { font-family: monospace; font-weight: bold; }
        pre { background: #0b0e11; padding: 12px; border-radius: 6px; overflow-x: auto; font-size: 13px; color: #3498db; }
        .btn { display: inline-block; background: #c5a059; color: #000; padding: 10px 16px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 12px; }
    </style>
</head>
<body>
<div class="container">
    <h1>🛠️ BauSquad — Отчёт диагностики сервера хостинга</h1>
    
    <div class="card">
        <div class="row"><span class="label">Статус сервера:</span><span class="badge badge-ok">ОНЛАЙН (PHP <?= PHP_VERSION ?>)</span></div>
        <div class="row"><span class="label">SAPI / Веб-сервер:</span><span class="val"><?= htmlspecialchars($report['php_sapi'] . ' / ' . $report['server_software']) ?></span></div>
        <div class="row"><span class="label">Document Root:</span><span class="val"><?= htmlspecialchars($report['document_root']) ?></span></div>
        <div class="row"><span class="label">Файл конфигурации (.env):</span><span class="val"><?= htmlspecialchars($report['loaded_env_path']) ?></span></div>
    </div>

    <div class="card">
        <h3>🗄️ База данных MySQL</h3>
        <div class="row">
            <span class="label">Подключение:</span>
            <span class="badge <?= $report['checks']['database']['status'] === 'OK' ? 'badge-ok' : 'badge-fail' ?>">
                <?= $report['checks']['database']['status'] ?> (<?= $report['checks']['database']['ping_ms'] ?> ms)
            </span>
        </div>
        <div class="row"><span class="label">Хост / База:</span><span class="val"><?= DB_HOST ?> / <?= DB_NAME ?></span></div>
        <?php if ($report['checks']['database']['status'] === 'OK'): ?>
            <div class="row"><span class="label">Найдено таблиц:</span><span class="val"><?= $report['checks']['database']['tables_count'] ?> шт.</span></div>
            <pre><?= json_encode($report['checks']['database']['tables'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) ?></pre>
        <?php else: ?>
            <div class="row"><span class="label">Ошибка:</span><span class="val" style="color:#e74c3c;"><?= htmlspecialchars($report['checks']['database']['error']) ?></span></div>
        <?php endif; ?>
    </div>

    <div class="card">
        <h3>🤖 Telegram Bot</h3>
        <div class="row">
            <span class="label">Конфигурация токена:</span>
            <span class="badge <?= $report['checks']['telegram']['status'] === 'OK' ? 'badge-ok' : 'badge-warn' ?>">
                <?= $report['checks']['telegram']['status'] ?>
            </span>
        </div>
        <div class="row"><span class="label">Прокси:</span><span class="val"><?= htmlspecialchars($report['checks']['telegram']['proxy']) ?></span></div>
    </div>

    <div class="card">
        <h3>📁 Права доступа к папке загрузок</h3>
        <div class="row">
            <span class="label">Папка /uploads:</span>
            <span class="badge <?= $report['checks']['filesystem']['uploads_writable'] ? 'badge-ok' : 'badge-warn' ?>">
                <?= $report['checks']['filesystem']['uploads_writable'] ? 'ДОСТУПНА ДЛЯ ЗАПИСИ' : 'ТОЛЬКО ЧТЕНИЕ' ?>
            </span>
        </div>
    </div>

    <a href="?format=json" class="btn" target="_blank">📄 Посмотреть JSON-версию отчёта</a>
</div>
</body>
</html>
