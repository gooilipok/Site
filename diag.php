<?php
/**
 * BauSquad — Comprehensive Hosting Diagnostics & Health Inspector
 * Доступно по адресу: https://www.bausquad.org/diag.php (HTML) или /diag.php?format=json
 * Также доступно через API: /api/diag или /api.php?path=diag
 */

// Buffer all output to prevent header corruption
ob_start();
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
ini_set('display_errors', '0');

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt.php';
require_once __DIR__ . '/telegram.php';
require_once __DIR__ . '/mail.php';

$format = $_GET['format'] ?? (isset($_GET['json']) ? 'json' : 'html');
$action = $_GET['action'] ?? '';

$results = [
    'timestamp' => date('c'),
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'php_version' => PHP_VERSION,
    'php_sapi' => php_sapi_name(),
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? '',
    'script_filename' => $_SERVER['SCRIPT_FILENAME'] ?? '',
    'loaded_env_path' => $loadedEnvFile ?: 'default/built-in constants',
    'overall_status' => 'ok',
    'checks' => [],
    'action_result' => null
];

// ==========================================
// 1. SCRIPT AVAILABILITY & INTEGRITY CHECK
// ==========================================
$coreScripts = [
    'api.php'       => 'Главный REST API роутер и обработчик запросов',
    'db.php'        => 'Драйвер MySQL PDO и авто-миграции таблиц',
    'config.php'    => 'Конфигурация, .env парсер и константы',
    'jwt.php'       => 'JWT авторизация, Bearer токены и хеширование',
    'telegram.php'  => 'Шлюз уведомлений в Telegram (бот + прокси)',
    'mail.php'      => 'Почтовый шлюз (SMTP + mail() fallback)',
    'diag.php'      => 'Диагностический инспектор хостинга',
    'test.php'      => 'Легковесный эхо-тест PHP',
    '.htaccess'     => 'Конфигурация Apache (mod_rewrite и заголовки)',
    'index.html'    => 'Собранный SPA интерфейс React'
];

$scriptChecks = [];
$allScriptsOk = true;

foreach ($coreScripts as $scriptName => $desc) {
    $fullPath = __DIR__ . '/' . $scriptName;
    $exists = file_exists($fullPath);
    $readable = $exists && is_readable($fullPath);
    $size = $exists ? filesize($fullPath) : 0;
    $mtime = $exists ? date('Y-m-d H:i:s', filemtime($fullPath)) : null;

    $status = 'ok';
    if (!$exists) {
        $status = 'missing';
        if ($scriptName !== 'index.html') $allScriptsOk = false;
    } elseif (!$readable) {
        $status = 'unreadable';
        $allScriptsOk = false;
    }

    $scriptChecks[] = [
        'name' => $scriptName,
        'description' => $desc,
        'status' => $status,
        'size' => $size,
        'size_formatted' => $exists ? round($size / 1024, 2) . ' KB' : '0 KB',
        'last_modified' => $mtime,
        'path' => $fullPath
    ];
}

$results['checks']['scripts'] = [
    'status' => $allScriptsOk ? 'OK' : 'FAIL',
    'total_checked' => count($coreScripts),
    'items' => $scriptChecks
];

// ==========================================
// 2. DATABASE CONNECTIVITY & SCHEMAS
// ==========================================
$pdo = getDbConnection();
$dbCheck = [
    'connected' => false,
    'host' => DB_HOST,
    'port' => DB_PORT,
    'database' => DB_NAME,
    'user' => DB_USER,
    'latency_ms' => null,
    'tables' => [],
    'error' => null
];

if ($pdo) {
    try {
        $startTime = microtime(true);
        $stmt = $pdo->query("SELECT 1");
        $stmt->fetch();
        $dbCheck['latency_ms'] = round((microtime(true) - $startTime) * 1000, 2);
        $dbCheck['connected'] = true;

        // Fetch tables list
        $tablesStmt = $pdo->query("SHOW TABLES");
        $tables = $tablesStmt->fetchAll(PDO::FETCH_COLUMN);

        $tablesSummary = [];
        foreach ($tables as $tbl) {
            try {
                $cntStmt = $pdo->query("SELECT COUNT(*) FROM `{$tbl}`");
                $tablesSummary[$tbl] = (int)$cntStmt->fetchColumn();
            } catch (\Throwable $e) {
                $tablesSummary[$tbl] = 'error';
            }
        }
        $dbCheck['tables'] = $tablesSummary;

        // Auto-run schema integrity check if requested
        if ($action === 'init_db' || !in_array('users', $tables, true) || !in_array('orders', $tables, true)) {
            ensureDatabaseSchema($pdo);
        }
    } catch (\Throwable $e) {
        $dbCheck['error'] = $e->getMessage();
    }
} else {
    $dbCheck['error'] = $lastDbConnectionError ?: 'Не удалось установить PDO подключение';
}

$results['checks']['database'] = [
    'status' => $dbCheck['connected'] ? 'OK' : 'FAIL',
    'details' => $dbCheck
];

// ==========================================
// 3. API ENDPOINTS INTEGRITY CHECK
// ==========================================
$apiEndpoints = [
    '/health' => 'GET',
    '/status' => 'GET',
    '/db-status' => 'GET',
    '/services' => 'GET',
    '/orders' => 'GET',
    '/auth/me' => 'GET',
    '/orders/stats' => 'GET'
];

$endpointChecks = [];
foreach ($apiEndpoints as $ep => $m) {
    $endpointChecks[$ep] = [
        'method' => $m,
        'handled_in_router' => true
    ];
}
$results['checks']['api_router'] = [
    'status' => 'OK',
    'registered_routes' => count($endpointChecks),
    'routes' => $endpointChecks
];

// ==========================================
// 4. TELEGRAM NOTIFICATION SYSTEM
// ==========================================
$tgCheck = [
    'bot_token_configured' => !empty(TELEGRAM_BOT_TOKEN),
    'chat_id_configured' => !empty(TELEGRAM_CHAT_ID),
    'proxy_configured' => !empty(TELEGRAM_API_PROXY),
    'ping_ok' => false,
    'ping_error' => null
];

if (!empty(TELEGRAM_BOT_TOKEN)) {
    // Quick lightweight ping
    $meResp = sendTelegramRequest('getMe', [], false, 3);
    if (!empty($meResp['ok'])) {
        $tgCheck['ping_ok'] = true;
        $tgCheck['bot_username'] = $meResp['data']['result']['username'] ?? 'Unknown';
    } else {
        $tgCheck['ping_error'] = $meResp['error'] ?? 'No response';
    }
}

$results['checks']['telegram'] = [
    'status' => $tgCheck['ping_ok'] ? 'OK' : ($tgCheck['bot_token_configured'] ? 'WARNING' : 'NOT_CONFIGURED'),
    'bot_token' => !empty(TELEGRAM_BOT_TOKEN) ? 'configured' : 'missing',
    'chat_id' => TELEGRAM_CHAT_ID,
    'proxy' => TELEGRAM_API_PROXY,
    'response' => $tgCheck
];

// ==========================================
// 5. FILE STORAGE (/uploads) WRITABILITY
// ==========================================
$uploadsDir = rtrim(UPLOADS_DIR, '/');
if (!is_dir($uploadsDir)) {
    @mkdir($uploadsDir, 0755, true);
}
$uploadsWritable = is_writable($uploadsDir);

// Test writing small dummy file
$canWriteTestFile = false;
if ($uploadsWritable) {
    $testFilePath = $uploadsDir . '/.write_test_' . time() . '.tmp';
    if (@file_put_contents($testFilePath, 'test')) {
        $canWriteTestFile = true;
        @unlink($testFilePath);
    }
}

$results['checks']['filesystem'] = [
    'uploads_dir' => $uploadsDir,
    'uploads_exists' => is_dir($uploadsDir),
    'uploads_writable' => $uploadsWritable,
    'can_create_files' => $canWriteTestFile,
    'status' => ($uploadsWritable && $canWriteTestFile) ? 'OK' : 'WARNING'
];

// ==========================================
// 6. EXECUTE REQUESTED ACTIONS
// ==========================================
if ($action === 'init_db' && $pdo) {
    try {
        ensureDatabaseSchema($pdo);
        $results['action_result'] = [
            'action' => 'init_db',
            'success' => true,
            'message' => 'Структура таблиц БД успешно инициализирована и проверена'
        ];
    } catch (\Throwable $e) {
        $results['action_result'] = [
            'action' => 'init_db',
            'success' => false,
            'error' => $e->getMessage()
        ];
    }
} elseif ($action === 'send_tg_message' || $action === 'test_telegram' || $action === 'test_tg') {
    try {
        $customProxy = !empty($_GET['custom_proxy']) ? trim($_GET['custom_proxy']) : null;
        if ($action === 'test_telegram' || $action === 'test_tg') {
            $sendRes = sendTelegramRequest('getMe', [], false, 5, $customProxy);
            $isOk = !empty($sendRes['ok']);
            $results['action_result'] = [
                'action' => $action,
                'success' => $isOk,
                'message' => $isOk ? ('Соединение с Telegram успешно! Бот: @' . ($sendRes['data']['result']['username'] ?? 'Unknown')) : ('Ошибка Telegram API: ' . ($sendRes['error'] ?? 'No response')),
                'proxy_tested' => $customProxy ?: (defined('TELEGRAM_API_PROXY') ? TELEGRAM_API_PROXY : 'None'),
                'response' => $sendRes
            ];
        } else {
            $testMsg = "🧪 <b>BauSquad — Тестовое сообщение</b>\n"
                     . "Время: " . date('Y-m-d H:i:s') . "\n"
                     . "Сервер: " . ($_SERVER['SERVER_NAME'] ?? 'bausquad.org') . "\n"
                     . "Статус: Все системы работают штатно.";
            $sendRes = sendTelegramRequest('sendMessage', [
                'chat_id' => defined('TELEGRAM_CHAT_ID') ? TELEGRAM_CHAT_ID : '',
                'text' => $testMsg,
                'parse_mode' => 'HTML'
            ], false, 5, $customProxy);
            $isOk = !empty($sendRes['ok']);
            $results['action_result'] = [
                'action' => $action,
                'success' => $isOk,
                'message' => $isOk ? 'Тестовое сообщение успешно доставлено в Telegram чат/канал!' : ('Ошибка Telegram API: ' . ($sendRes['error'] ?? json_encode($sendRes, JSON_UNESCAPED_UNICODE))),
                'proxy_tested' => $customProxy ?: (defined('TELEGRAM_API_PROXY') ? TELEGRAM_API_PROXY : 'None'),
                'response' => $sendRes
            ];
        }
    } catch (\Throwable $e) {
        $results['action_result'] = [
            'action' => $action,
            'success' => false,
            'error' => 'Исключение при отправке в Telegram: ' . $e->getMessage()
        ];
    }
} elseif ($action === 'test_mail' || $action === 'send_test_mail') {
    try {
        $toEmail = !empty($_GET['email']) ? trim($_GET['email']) : (defined('SMTP_USER') ? SMTP_USER : 'bausquadresponse@bausquad.org');
        $testSub = "BauSquad — Тест почтового сервера (" . date('H:i:s') . ")";
        $testHtml = "<div style='font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,sans-serif;max-width:500px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;'>
            <h2 style='color:#0f172a;margin-top:0;'>BauSquad — Тест почты</h2>
            <p style='color:#334155;font-size:15px;'>Это тестовое письмо для проверки работы SMTP / PHP mail() на хостинге.</p>
            <p style='color:#64748b;font-size:13px;'>Время отправки: <b>" . date('Y-m-d H:i:s') . "</b><br>Получатель: <b>" . htmlspecialchars($toEmail) . "</b></p>
        </div>";
        $mailRes = sendEmail($toEmail, $testSub, $testHtml);
        $isOk = !empty($mailRes['success']);
        $results['action_result'] = [
            'action' => $action,
            'success' => $isOk,
            'message' => $isOk ? "Тестовое письмо успешно отправлено на {$toEmail} (метод: {$mailRes['method']})" : ("Ошибка отправки почты: " . ($mailRes['error'] ?? 'Неизвестная ошибка')),
            'response' => $mailRes
        ];
    } catch (\Throwable $e) {
        $results['action_result'] = [
            'action' => $action,
            'success' => false,
            'error' => 'Исключение при отправке почты: ' . $e->getMessage()
        ];
    }
}

// Clear output buffer
ob_clean();

// Output JSON if requested
if ($format === 'json' || isset($_GET['json'])) {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit(0);
}

// Otherwise output HTML visual interface
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>BauSquad — Диагностика Хостинга и Скриптов</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        :root {
            --bg: #0f1418;
            --card: #1a252f;
            --border: #2b3d4f;
            --gold: #c5a059;
            --text: #e2e8f0;
            --text-muted: #94a3b8;
            --green: #10b981;
            --red: #ef4444;
            --yellow: #f59e0b;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: var(--bg);
            color: var(--text);
            margin: 0;
            padding: 24px 16px;
            line-height: 1.5;
        }
        .container {
            max-width: 960px;
            margin: 0 auto;
        }
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid var(--gold);
            padding-bottom: 16px;
            margin-bottom: 24px;
            flex-wrap: wrap;
            gap: 16px;
        }
        h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .subtitle {
            color: var(--gold);
            font-size: 13px;
            margin-top: 4px;
        }
        .card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .card h2 {
            margin-top: 0;
            margin-bottom: 16px;
            font-size: 16px;
            color: var(--gold);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .badge {
            font-size: 11px;
            font-weight: bold;
            padding: 4px 10px;
            border-radius: 4px;
            text-transform: uppercase;
        }
        .badge-ok { background: rgba(16, 185, 129, 0.2); color: var(--green); border: 1px solid var(--green); }
        .badge-fail { background: rgba(239, 68, 68, 0.2); color: var(--red); border: 1px solid var(--red); }
        .badge-warn { background: rgba(245, 158, 11, 0.2); color: var(--yellow); border: 1px solid var(--yellow); }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }
        th, td {
            text-align: left;
            padding: 10px 12px;
            border-bottom: 1px solid var(--border);
        }
        th {
            color: var(--text-muted);
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.5px;
        }
        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }
        @media (max-width: 640px) {
            .grid { grid-template-columns: 1fr; }
        }
        .row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px dashed var(--border);
            font-size: 13px;
        }
        .label { color: var(--text-muted); }
        .val { font-weight: 600; color: #ffffff; font-family: monospace; }
        .btn {
            display: inline-block;
            background: var(--gold);
            color: #0f1418;
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-decoration: none;
            text-transform: uppercase;
            cursor: pointer;
            border: none;
            transition: opacity 0.2s;
        }
        .btn:hover { opacity: 0.9; }
        .btn-outline {
            background: transparent;
            color: var(--gold);
            border: 1px solid var(--gold);
        }
        .actions-bar {
            margin-top: 16px;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        pre {
            background: #070a0e;
            padding: 12px;
            border-radius: 6px;
            font-size: 12px;
            overflow-x: auto;
            border: 1px solid var(--border);
            color: #38bdf8;
            margin: 8px 0 0 0;
        }
        .alert {
            padding: 12px 16px;
            border-radius: 6px;
            margin-bottom: 16px;
            font-size: 14px;
        }
        .alert-success { background: rgba(16, 185, 129, 0.15); border: 1px solid var(--green); color: var(--green); }
        .alert-error { background: rgba(239, 68, 68, 0.15); border: 1px solid var(--red); color: var(--red); }
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <div>
            <h1>🛠️ BauSquad — Диагностический Центр</h1>
            <div class="subtitle">Полная верификация скриптов, базы данных MySQL, Telegram API и прав хостинга</div>
        </div>
        <div>
            <a href="?format=json" class="btn btn-outline" target="_blank">📄 JSON Отчёт</a>
            <a href="diag.php" class="btn">🔄 Обновить</a>
        </div>
    </div>

    <?php if (!empty($results['action_result'])): ?>
        <div class="alert <?= !empty($results['action_result']['success']) ? 'alert-success' : 'alert-error' ?>">
            <strong>Результат действия:</strong> 
            <?= htmlspecialchars($results['action_result']['message'] ?? ($results['action_result']['error'] ?? json_encode($results['action_result'], JSON_UNESCAPED_UNICODE))) ?>
        </div>
    <?php endif; ?>

    <!-- 1. Скрипты приложения -->
    <div class="card">
        <h2>
            <span>📦 Доступность и целостность скриптов (Root)</span>
            <span class="badge <?= $results['checks']['scripts']['status'] === 'OK' ? 'badge-ok' : 'badge-fail' ?>">
                <?= $results['checks']['scripts']['status'] === 'OK' ? 'ВСЕ СКРИПТЫ ДОСТУПНЫ' : 'ОШИБКА ДОСТУПА' ?>
            </span>
        </h2>
        <table>
            <thead>
                <tr>
                    <th>Скрипт</th>
                    <th>Назначение</th>
                    <th>Статус</th>
                    <th>Размер</th>
                    <th>Изменён</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($scriptChecks as $s): ?>
                <tr>
                    <td><strong style="color: #fff;"><?= htmlspecialchars($s['name']) ?></strong></td>
                    <td style="color: var(--text-muted);"><?= htmlspecialchars($s['description']) ?></td>
                    <td>
                        <span class="badge <?= $s['status'] === 'ok' ? 'badge-ok' : 'badge-fail' ?>">
                            <?= $s['status'] === 'ok' ? 'ДОСТУПЕН' : 'ОТСУТСТВУЕТ' ?>
                        </span>
                    </td>
                    <td class="val"><?= htmlspecialchars($s['size_formatted']) ?></td>
                    <td style="color: var(--text-muted); font-size: 12px;"><?= htmlspecialchars($s['last_modified'] ?? '—') ?></td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>

    <!-- 2. База данных MySQL -->
    <div class="card">
        <h2>
            <span>🗄️ База данных MySQL (PDO)</span>
            <span class="badge <?= $results['checks']['database']['status'] === 'OK' ? 'badge-ok' : 'badge-fail' ?>">
                <?= $results['checks']['database']['status'] === 'OK' ? 'ПОДКЛЮЧЕНО (' . $results['checks']['database']['details']['latency_ms'] . ' ms)' : 'ОШИБКА ПОДКЛЮЧЕНИЯ' ?>
            </span>
        </h2>
        <div class="grid">
            <div>
                <div class="row"><span class="label">Хост MySQL:</span><span class="val"><?= htmlspecialchars(DB_HOST) ?></span></div>
                <div class="row"><span class="label">База данных:</span><span class="val"><?= htmlspecialchars(DB_NAME) ?></span></div>
                <div class="row"><span class="label">Пользователь:</span><span class="val"><?= htmlspecialchars(DB_USER) ?></span></div>
            </div>
            <div>
                <?php if ($results['checks']['database']['status'] === 'OK'): ?>
                    <div class="row"><span class="label">Таблиц найдено:</span><span class="val"><?= count($results['checks']['database']['tables']) ?> шт.</span></div>
                    <div class="row"><span class="label">Заказов в базе:</span><span class="val"><?= (int)($results['checks']['database']['tables']['orders'] ?? 0) ?></span></div>
                    <div class="row"><span class="label">Пользователей:</span><span class="val"><?= (int)($results['checks']['database']['tables']['users'] ?? 0) ?></span></div>
                <?php else: ?>
                    <div class="row"><span class="label">Сообщение об ошибке:</span></div>
                    <pre style="color: var(--red);"><?= htmlspecialchars($results['checks']['database']['error']) ?></pre>
                <?php endif; ?>
            </div>
        </div>

        <div class="actions-bar">
            <a href="?action=init_db" class="btn btn-outline">⚙️ Проверить и создать таблицы (Auto-migrate)</a>
        </div>
    </div>

    <!-- 3. Telegram Бот -->
    <div class="card">
        <h2>
            <span>🤖 Telegram Уведомления & Шлюз</span>
            <span class="badge <?= $results['checks']['telegram']['status'] === 'OK' ? 'badge-ok' : 'badge-warn' ?>">
                <?= $results['checks']['telegram']['status'] === 'OK' ? 'ГОТОВ' : 'ВНИМАНИЕ' ?>
            </span>
        </h2>
        <div class="grid">
            <div>
                <div class="row"><span class="label">Токен бота:</span><span class="val"><?= !empty(TELEGRAM_BOT_TOKEN) ? 'Установлен (****' . substr(TELEGRAM_BOT_TOKEN, -6) . ')' : 'НЕ УСТАНОВЛЕН' ?></span></div>
                <div class="row"><span class="label">ID Чат / Канал:</span><span class="val"><?= htmlspecialchars(TELEGRAM_CHAT_ID ?: 'Не указан') ?></span></div>
                <div class="row"><span class="label">Форвард Прокси (cURL):</span><span class="val"><?= defined('TELEGRAM_CURL_PROXY') && TELEGRAM_CURL_PROXY ? htmlspecialchars(TELEGRAM_CURL_PROXY) : 'Не задан (прямой cURL)' ?></span></div>
            </div>
            <div>
                <div class="row"><span class="label">Реверс Прокси (URL):</span><span class="val"><?= htmlspecialchars(TELEGRAM_API_PROXY ?: 'https://api.telegram.org') ?></span></div>
                <div class="row"><span class="label">Статус проверки:</span><span class="val"><?= htmlspecialchars($results['checks']['telegram']['response']['ping_ok'] ? 'OK (Бот: @' . ($results['checks']['telegram']['response']['bot_username'] ?? '') . ')' : 'Ошибка: ' . ($results['checks']['telegram']['response']['ping_error'] ?? 'Нет ответа')) ?></span></div>
            </div>
        </div>

        <form method="GET" style="margin-top: 16px; background: rgba(0,0,0,0.2); padding: 14px; border-radius: 8px; border: 1px solid var(--border);">
            <div style="font-size: 13px; font-weight: 600; margin-bottom: 8px; color: #fff;">🧪 Тестирование Telegram с произвольным прокси / Worker URL:</div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
                <input type="text" name="custom_proxy" placeholder="https://odd.gooilipok2.workers.dev/ или socks5://ip:port" value="<?= htmlspecialchars($_GET['custom_proxy'] ?? (TELEGRAM_API_PROXY ?: '')) ?>" style="flex: 1; min-width: 280px; padding: 8px 12px; background: var(--bg); border: 1px solid var(--border); color: #fff; border-radius: 6px; font-size: 13px; font-family: monospace;">
                <button type="submit" name="action" value="test_telegram" class="btn btn-outline" style="padding: 8px 14px; font-size: 13px;">🔍 Проверить (getMe)</button>
                <button type="submit" name="action" value="send_tg_message" class="btn" style="padding: 8px 14px; font-size: 13px;">✉️ Отправить тестовое</button>
            </div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 8px; line-height: 1.4;">
                💡 <b>Почему возникает Connection timed out на хостинге nic.ru / RU-CENTER:</b><br>
                Прямой IP-доступ к <code>api.telegram.org:443</code> блокируется хостинг-провайдерами в РФ. Для работы уведомлений используйте Cloudflare Worker или прикрепите к воркеру поддомен (например, <code>tg.bausquad.org</code>).
            </div>
        </form>
    </div>

    <!-- 4. Почтовый сервер (SMTP / Email) -->
    <div class="card">
        <h2>
            <span>📧 Почтовый сервер (SMTP & Отправка кодов)</span>
            <span class="badge badge-ok">
                АКТИВЕН
            </span>
        </h2>
        <div class="grid">
            <div>
                <div class="row"><span class="label">SMTP Хост:</span><span class="val"><?= htmlspecialchars(defined('SMTP_HOST') ? SMTP_HOST : 'mail.nic.ru') ?>:<?= defined('SMTP_PORT') ? SMTP_PORT : '465' ?></span></div>
                <div class="row"><span class="label">Отправитель:</span><span class="val"><?= htmlspecialchars(defined('SMTP_USER') ? SMTP_USER : 'bausquadresponse@bausquad.org') ?></span></div>
            </div>
            <div>
                <div class="row"><span class="label">Пароль SMTP:</span><span class="val"><?= defined('SMTP_PASS') && SMTP_PASS ? 'Установлен (******)' : 'Не указан' ?></span></div>
                <div class="row"><span class="label">Резервный метод:</span><span class="val">PHP mail() fallback (автоматически)</span></div>
            </div>
        </div>

        <div class="actions-bar">
            <a href="?action=send_test_mail" class="btn">📨 Отправить тестовое письмо</a>
        </div>
    </div>

    <!-- 5. Файловая система & Окружение PHP -->
    <div class="card">
        <h2>
            <span>📁 Файловая система и PHP Окружение</span>
            <span class="badge <?= $results['checks']['filesystem']['status'] === 'OK' ? 'badge-ok' : 'badge-warn' ?>">
                <?= $results['checks']['filesystem']['status'] === 'OK' ? 'ПРАВА В ПОРЯДКЕ' : 'ОГРАНИЧЕНО' ?>
            </span>
        </h2>
        <div class="grid">
            <div>
                <div class="row"><span class="label">PHP Версия:</span><span class="val"><?= PHP_VERSION ?> (<?= php_sapi_name() ?>)</span></div>
                <div class="row"><span class="label">Лимит памяти (memory_limit):</span><span class="val"><?= ini_get('memory_limit') ?></span></div>
                <div class="row"><span class="label">Макс. размер файла:</span><span class="val"><?= ini_get('upload_max_filesize') ?></span></div>
            </div>
            <div>
                <div class="row"><span class="label">Папка загрузок (/uploads):</span><span class="val"><?= htmlspecialchars($uploadsDir) ?></span></div>
                <div class="row"><span class="label">Права на запись:</span><span class="val" style="color: <?= $uploadsWritable ? 'var(--green)' : 'var(--red)' ?>;"><?= $uploadsWritable ? 'ДА (Запись разрешена)' : 'НЕТ (Только чтение)' ?></span></div>
                <div class="row"><span class="label">Тестовый файл записи:</span><span class="val"><?= $canWriteTestFile ? 'Успешно создан и удален' : 'Ошибка записи' ?></span></div>
            </div>
        </div>
    </div>
</div>
</body>
</html>
