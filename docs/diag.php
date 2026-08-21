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
        $allScriptsOk = false;
    } elseif (!$readable || $size === 0) {
        $status = 'error';
        $allScriptsOk = false;
    }

    $scriptChecks[$scriptName] = [
        'name' => $scriptName,
        'description' => $desc,
        'status' => $status,
        'exists' => $exists,
        'readable' => $readable,
        'size_bytes' => $size,
        'size_formatted' => $size > 1024 ? round($size / 1024, 1) . ' KB' : $size . ' B',
        'last_modified' => $mtime
    ];
}

$results['checks']['scripts'] = [
    'status' => $allScriptsOk ? 'OK' : 'FAIL',
    'total_checked' => count($coreScripts),
    'files' => $scriptChecks
];

// ==========================================
// 2. PHP EXTENSIONS & ENVIRONMENT
// ==========================================
$requiredExtensions = ['pdo', 'pdo_mysql', 'curl', 'json', 'mbstring', 'openssl', 'filter'];
$extResults = [];
$missingExts = [];

foreach ($requiredExtensions as $ext) {
    $isLoaded = extension_loaded($ext);
    $extResults[$ext] = $isLoaded;
    if (!$isLoaded) $missingExts[] = $ext;
}

$results['checks']['php_extensions'] = [
    'status' => empty($missingExts) ? 'OK' : 'FAIL',
    'loaded' => $extResults,
    'missing' => $missingExts,
    'allow_url_fopen' => (bool)ini_get('allow_url_fopen'),
    'memory_limit' => ini_get('memory_limit'),
    'upload_max_filesize' => ini_get('upload_max_filesize'),
    'post_max_size' => ini_get('post_max_size')
];

// ==========================================
// 3. DATABASE (MYSQL) CONNECTIVITY & SCHEMA
// ==========================================
$startDb = microtime(true);
$pdo = null;
try {
    $pdo = getDB();
} catch (\Throwable $e) {}
$dbDuration = round((microtime(true) - $startDb) * 1000, 2);

if ($pdo) {
    $tables = [];
    $tableCounts = [];
    $orderColumns = [];
    $userColumns = [];
    try {
        $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
        foreach ($tables as $t) {
            $c = $pdo->query("SELECT COUNT(*) FROM `{$t}`")->fetchColumn();
            $tableCounts[$t] = (int)$c;
        }
        $orderColumns = getTableColumns($pdo, 'orders');
        $userColumns = getTableColumns($pdo, 'users');
    } catch (\Throwable $e) {}

    $results['checks']['database'] = [
        'status' => 'OK',
        'host' => DB_HOST,
        'database' => DB_NAME,
        'user' => DB_USER,
        'ping_ms' => $dbDuration,
        'tables_count' => count($tables),
        'tables' => $tableCounts,
        'orders_columns' => $orderColumns,
        'users_columns' => $userColumns
    ];
} else {
    global $lastDbConnectionError;
    $results['checks']['database'] = [
        'status' => 'FAIL',
        'host' => DB_HOST,
        'database' => DB_NAME,
        'user' => DB_USER,
        'ping_ms' => $dbDuration,
        'error' => $lastDbConnectionError ?: 'Не удалось подключиться к MySQL'
    ];
    $results['overall_status'] = 'warning';
}

// ==========================================
// 4. TELEGRAM BOT CONNECTIVITY & PROXY
// ==========================================
$startTg = microtime(true);
$tgCheck = ['ok' => false, 'error' => 'Not tested'];

if (isset($_GET['test_telegram']) || $action === 'test_telegram') {
    $tgCheck = sendTelegramRequest('getMe', [], false, 3);
} else {
    $tgCheck = [
        'ok' => !empty(TELEGRAM_BOT_TOKEN),
        'note' => !empty(TELEGRAM_BOT_TOKEN) ? 'Токен задан. Для проверки связи нажмите кнопку "Тест Telegram" или добавьте ?action=test_telegram' : 'Токен бота не задан'
    ];
}
$tgDuration = round((microtime(true) - $startTg) * 1000, 2);

$results['checks']['telegram'] = [
    'status' => !empty($tgCheck['ok']) ? 'OK' : 'WARNING',
    'ping_ms' => $tgDuration,
    'bot_token_set' => !empty(TELEGRAM_BOT_TOKEN),
    'chat_id_set' => !empty(TELEGRAM_CHAT_ID),
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
} elseif ($action === 'send_tg_message') {
    $testMsg = "🧪 <b>BauSquad — Тестовое сообщение</b>\n"
             . "Время: " . date('Y-m-d H:i:s') . "\n"
             . "Сервер: " . ($_SERVER['SERVER_NAME'] ?? 'bausquad.org') . "\n"
             . "Статус: Все системы работают штатно.";
    $sendRes = sendTelegramNotification($testMsg);
    $results['action_result'] = [
        'action' => 'send_tg_message',
        'success' => !empty($sendRes['ok']),
        'response' => $sendRes
    ];
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
            --bg-main: #0b0f14;
            --bg-card: #131b24;
            --bg-header: #1a2530;
            --border: #233342;
            --gold: #d4af37;
            --text-main: #e2e8f0;
            --text-muted: #94a3b8;
            --green: #10b981;
            --red: #ef4444;
            --yellow: #f59e0b;
        }
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: var(--bg-main);
            color: var(--text-main);
            margin: 0;
            padding: 24px 16px;
            line-height: 1.5;
        }
        .container { max-width: 960px; margin: 0 auto; }
        .header {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 24px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 16px;
        }
        h1 { margin: 0; font-size: 22px; color: var(--gold); display: flex; align-items: center; gap: 10px; }
        .subtitle { font-size: 13px; color: var(--text-muted); margin-top: 4px; }
        .card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .card h2 {
            font-size: 16px;
            color: var(--gold);
            margin-top: 0;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .badge {
            display: inline-flex;
            align-items: center;
            padding: 4px 10px;
            border-radius: 4px;
            font-weight: 700;
            font-size: 12px;
            text-transform: uppercase;
        }
        .badge-ok { background: rgba(16, 185, 129, 0.2); color: var(--green); border: 1px solid var(--green); }
        .badge-fail { background: rgba(239, 68, 68, 0.2); color: var(--red); border: 1px solid var(--red); }
        .badge-warn { background: rgba(245, 158, 11, 0.2); color: var(--yellow); border: 1px solid var(--yellow); }
        
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
        .row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid rgba(255,255,255,0.06);
            font-size: 14px;
        }
        .row:last-child { border-bottom: none; }
        .label { color: var(--text-muted); }
        .val { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-weight: 600; color: #fff; }
        
        table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 10px; }
        th, td { text-align: left; padding: 10px; border-bottom: 1px solid var(--border); }
        th { color: var(--text-muted); font-weight: 600; background: rgba(0,0,0,0.2); }
        tr:hover td { background: rgba(255,255,255,0.02); }
        
        .btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: var(--gold);
            color: #000;
            font-weight: 700;
            padding: 8px 16px;
            border-radius: 6px;
            text-decoration: none;
            font-size: 13px;
            border: none;
            cursor: pointer;
            transition: opacity 0.2s;
        }
        .btn:hover { opacity: 0.9; }
        .btn-outline {
            background: transparent;
            color: var(--gold);
            border: 1px solid var(--gold);
        }
        .btn-outline:hover { background: rgba(212, 175, 55, 0.1); }
        
        .actions-bar {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid var(--border);
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
            <?= htmlspecialchars($results['action_result']['message'] ?? ($results['action_result']['error'] ?? json_encode($results['action_result']))) ?>
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
            <span>🗄️ База данных MySQL</span>
            <span class="badge <?= $results['checks']['database']['status'] === 'OK' ? 'badge-ok' : 'badge-fail' ?>">
                <?= $results['checks']['database']['status'] === 'OK' ? 'ПОДКЛЮЧЕНО (' . $results['checks']['database']['ping_ms'] . ' ms)' : 'ОШИБКА ПОДКЛЮЧЕНИЯ' ?>
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
            </div>
            <div>
                <div class="row"><span class="label">Прокси-сервер:</span><span class="val"><?= htmlspecialchars(TELEGRAM_API_PROXY) ?></span></div>
                <div class="row"><span class="label">Статус проверки:</span><span class="val"><?= json_encode($results['checks']['telegram']['response'], JSON_UNESCAPED_UNICODE) ?></span></div>
            </div>
        </div>

        <div class="actions-bar">
            <a href="?action=test_telegram" class="btn btn-outline">🔍 Пинг Telegram (getMe)</a>
            <a href="?action=send_tg_message" class="btn">✉️ Отправить тестовое сообщение в Telegram</a>
        </div>
    </div>

    <!-- 4. Файловая система & Окружение PHP -->
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
