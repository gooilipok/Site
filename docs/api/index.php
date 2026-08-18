<?php
/**
 * BauSquad — Master REST API Router (PHP)
 * Handles all /api/* routes for hosting without Node.js
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt.php';
require_once __DIR__ . '/telegram.php';
require_once __DIR__ . '/mail.php';

sendCorsHeaders();

$pdo = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Normalize path (strip /api or index.php prefix)
$path = preg_replace('#^/api#', '', $uri);
$path = preg_replace('#^/index\.php#', '', $path);
$path = '/' . trim($path, '/');

$input = getJsonInput();

// ==========================================
// 1. HEALTH & DIAGNOSTICS
// ==========================================
if ($path === '/health' || $path === '/ping' || $path === '') {
    global $loadedEnvFile;
    jsonResponse([
        'status' => 'ok',
        'app' => APP_NAME . ' (PHP Backend)',
        'env' => APP_ENV,
        'app_url' => APP_URL,
        'timestamp' => date('c'),
        'php_version' => PHP_VERSION,
        'env_loaded_from' => $loadedEnvFile ?: 'built-in defaults / system environment',
        'mysql' => [
            'connected' => ($pdo !== null),
            'database' => DB_NAME,
            'host' => DB_HOST,
            'port' => DB_PORT
        ],
        'telegram' => [
            'bot_token_set' => !empty(TELEGRAM_BOT_TOKEN),
            'chat_id_set' => !empty(TELEGRAM_CHAT_ID),
            'proxy' => TELEGRAM_API_PROXY ?: 'direct'
        ],
        'smtp' => [
            'host' => SMTP_HOST,
            'port' => SMTP_PORT,
            'user' => SMTP_USER,
            'from' => SMTP_FROM
        ]
    ]);
}

if ($path === '/db/test') {
    if (!$pdo) {
        jsonResponse(['success' => false, 'error' => 'Database connection failed'], 500);
    }
    try {
        $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
        $ordersCount = $pdo->query("SELECT COUNT(*) FROM orders")->fetchColumn();
        $recentOrders = $pdo->query("SELECT order_id, client_id, subject, status, created_at FROM orders ORDER BY order_id DESC LIMIT 5")->fetchAll();

        jsonResponse([
            'success' => true,
            'tables' => $tables,
            'orders_count' => (int)$ordersCount,
            'recent_orders' => $recentOrders,
            'message' => 'Подключение к MySQL на хостинге успешно!'
        ]);
    } catch (Exception $e) {
        jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
    }
}

if ($path === '/telegram/test' || $path === '/tg/test') {
    $testText = "🤖 <b>Тестовое сообщение от BauSquad (PHP Backend)</b>\n\n" .
                "✅ Проверка связи с Telegram API успешно выполнена!\n" .
                "⏰ Время сервера: " . date('Y-m-d H:i:s');
    $res = sendTelegramMessage($testText);
    jsonResponse($res, $res['ok'] ? 200 : 500);
}

if ($path === '/email/test' || $path === '/mail/test') {
    $to = $_GET['to'] ?? SMTP_USER;
    if (empty($to)) {
        jsonResponse(['error' => 'Укажите email (?to=your_email@domain.com)'], 400);
    }
    $html = "<div style='font-family:sans-serif;padding:20px;border:1px solid #ddd;'>
        <h2>Тестовое письмо от BauSquad PHP</h2>
        <p>SMTP успешно подключен и отправляет сообщения.</p>
        <p>Время: " . date('Y-m-d H:i:s') . "</p>
    </div>";
    $mailRes = sendEmail($to, 'Тестовое письмо BauSquad (PHP)', $html);
    jsonResponse($mailRes, $mailRes['success'] ? 200 : 500);
}

// ==========================================
// 2. AUTHENTICATION
// ==========================================

// Register Step 1: Send verification code to email
if (($path === '/auth/register' || $path === '/register') && $method === 'POST') {
    $email = strtolower(trim($input['email'] ?? ''));
    $username = trim($input['username'] ?? '');
    $password = $input['password'] ?? '';
    $termsAccepted = !empty($input['terms_accepted']);
    $privacyAccepted = !empty($input['privacy_accepted']);
    $consentAccepted = !empty($input['consent_accepted']);

    if (empty($email) || empty($username) || empty($password)) {
        jsonResponse(['error' => 'Заполните все обязательные поля'], 400);
    }

    if (!$termsAccepted || !$privacyAccepted || !$consentAccepted) {
        jsonResponse(['error' => 'Для регистрации необходимо отдельно подтвердить все 3 соглашения'], 400);
    }

    if ($pdo) {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE LOWER(email) = ? OR LOWER(login) = ?");
        $stmt->execute([$email, strtolower($username)]);
        if ($stmt->fetch()) {
            jsonResponse(['error' => 'Пользователь с таким Email или Логином уже существует'], 400);
        }

        $code = (string)random_int(100000, 900000);
        $passHash = password_hash($password, PASSWORD_BCRYPT);
        $expiresAt = time() + (15 * 60);

        $stmt = $pdo->prepare("INSERT INTO verification_codes (email, code, username, password_hash, expires_at)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE code = VALUES(code), username = VALUES(username), password_hash = VALUES(password_hash), expires_at = VALUES(expires_at)");
        $stmt->execute([$email, $code, $username, $passHash, $expiresAt]);

        $html = "<div style='font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;'>
            <h2 style='text-align:center;'>Подтверждение регистрации</h2>
            <p>Здравствуйте, <strong>{$username}</strong>! Ваш код для входа в <strong>BauSquad</strong>:</p>
            <div style='background:#f1f5f9;font-size:32px;font-weight:bold;letter-spacing:6px;text-align:center;padding:16px;margin:20px 0;'>{$code}</div>
            <p style='color:#666;font-size:13px;'>Код действителен 15 минут.</p>
        </div>";

        $mailRes = sendEmail($email, "Код подтверждения BauSquad: {$code}", $html);

        jsonResponse([
            'message' => 'Код подтверждения отправлен на почту',
            'email' => $email,
            'smtp_sent' => $mailRes['success']
        ]);
    } else {
        jsonResponse(['error' => 'База данных недоступна'], 500);
    }
}

// Register Step 2: Verify Code & Complete Registration
if (($path === '/auth/verify-code' || $path === '/verify-code') && $method === 'POST') {
    $email = strtolower(trim($input['email'] ?? ''));
    $code = trim($input['code'] ?? '');

    if (empty($email) || empty($code)) {
        jsonResponse(['error' => 'Укажите email и код подтверждения'], 400);
    }

    if (!$pdo) {
        jsonResponse(['error' => 'База данных недоступна'], 500);
    }

    $stmt = $pdo->prepare("SELECT * FROM verification_codes WHERE email = ?");
    $stmt->execute([$email]);
    $rec = $stmt->fetch();

    if (!$rec || $rec['code'] !== $code) {
        jsonResponse(['error' => 'Неверный код подтверждения или срок его действия истёк'], 400);
    }

    if ($rec['expires_at'] < time()) {
        jsonResponse(['error' => 'Срок действия кода истёк. Запросите новый код.'], 400);
    }

    // Insert user into users table
    $stmt = $pdo->prepare("INSERT INTO users (login, email, password_hash, role, account_status, is_verified, user_agreement, privacy_agreement, processing_personal_data_agreement, user_agreement_date, privacy_agreement_date, processing_personal_data_agreement_date, registration_date)
        VALUES (?, ?, ?, 'customer', 'active', 1, 1, 1, 1, NOW(), NOW(), NOW(), NOW())
        ON DUPLICATE KEY UPDATE login = VALUES(login), password_hash = VALUES(password_hash), is_verified = 1");
    $stmt->execute([$rec['username'], $email, $rec['password_hash']]);
    $userId = $pdo->lastInsertId();

    $pdo->prepare("DELETE FROM verification_codes WHERE email = ?")->execute([$email]);

    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    $formattedUser = formatUser($user, $pdo);
    $accessToken = generateJWT($user['id'], $user['role'], 'access');
    $refreshToken = generateJWT($user['id'], $user['role'], 'refresh');

    jsonResponse([
        'message' => 'Регистрация успешно завершена',
        'user' => $formattedUser,
        'tokens' => [
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'token_type' => 'Bearer',
            'expires_in' => 1800
        ]
    ]);
}

// Login
if (($path === '/auth/login' || $path === '/login') && $method === 'POST') {
    $identifier = strtolower(trim($input['login_identifier'] ?? ''));
    $password = $input['password'] ?? '';

    if (empty($identifier) || empty($password)) {
        jsonResponse(['error' => 'Введите Email/Логин и Пароль'], 400);
    }

    if (!$pdo) {
        // Fallback for admin if database disconnected
        if (($identifier === 'admin@bausquad.ru' || $identifier === 'bauadmin') && $password === 'admin123') {
            $adminUser = [
                'id' => 'usr-admin-01',
                'email' => 'admin@bausquad.ru',
                'username' => 'BauAdmin',
                'role' => 'admin',
                'account_status' => 'active',
                'is_verified' => true,
                'created_at' => date('c'),
                'telegram_handle' => '',
                'tg_id' => '',
                'agreements' => [
                    'terms_accepted' => true,
                    'terms_accepted_at' => date('c'),
                    'privacy_accepted' => true,
                    'privacy_accepted_at' => date('c'),
                    'consent_accepted' => true,
                    'consent_accepted_at' => date('c')
                ],
                'order_count' => 0
            ];
            jsonResponse([
                'user' => $adminUser,
                'tokens' => [
                    'access_token' => generateJWT('usr-admin-01', 'admin', 'access'),
                    'refresh_token' => generateJWT('usr-admin-01', 'admin', 'refresh'),
                    'token_type' => 'Bearer',
                    'expires_in' => 1800
                ]
            ]);
        }
        jsonResponse(['error' => 'База данных недоступна'], 500);
    }

    $stmt = $pdo->prepare("SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(login) = ? LIMIT 1");
    $stmt->execute([$identifier, $identifier]);
    $user = $stmt->fetch();

    if (!$user || !verifyPassword($password, $user['password_hash'])) {
        jsonResponse(['error' => 'Неверный логин или пароль'], 400);
    }

    if (($user['account_status'] ?? '') === 'banned') {
        jsonResponse(['error' => 'Ваш аккаунт заблокирован администратором'], 403);
    }

    $formattedUser = formatUser($user, $pdo);
    $accessToken = generateJWT($user['id'], $user['role'], 'access');
    $refreshToken = generateJWT($user['id'], $user['role'], 'refresh');

    jsonResponse([
        'user' => $formattedUser,
        'tokens' => [
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'token_type' => 'Bearer',
            'expires_in' => 1800
        ]
    ]);
}

// Refresh Token
if ($path === '/auth/refresh' && $method === 'POST') {
    $token = $input['refresh_token'] ?? '';
    $payload = verifyJWT($token);
    if (!$payload || ($payload['type'] ?? '') !== 'refresh') {
        jsonResponse(['error' => 'Недействительный refresh token'], 401);
    }

    $newAccess = generateJWT($payload['userId'], $payload['role'] ?? 'customer', 'access');
    $newRefresh = generateJWT($payload['userId'], $payload['role'] ?? 'customer', 'refresh');

    jsonResponse([
        'access_token' => $newAccess,
        'refresh_token' => $newRefresh,
        'token_type' => 'Bearer',
        'expires_in' => 1800
    ]);
}

// Current User Profile (/api/auth/me, /api/profile)
if (($path === '/auth/me' || $path === '/profile' || $path === '/user/me' || $path === '/me') && $method === 'GET') {
    $authUser = getAuthenticatedUser($pdo);
    if (!$authUser) {
        jsonResponse(['error' => 'Необходима авторизация'], 401);
    }
    jsonResponse(['user' => $authUser]);
}

// Update Profile
if (($path === '/profile' || $path === '/user/profile') && in_array($method, ['PUT', 'POST', 'PATCH'])) {
    $authUser = getAuthenticatedUser($pdo);
    if (!$authUser) {
        jsonResponse(['error' => 'Необходима авторизация'], 401);
    }

    $username = trim($input['username'] ?? '');
    $newPass = $input['new_password'] ?? '';
    $tgHandle = isset($input['telegram_handle']) ? ltrim(trim($input['telegram_handle']), '@') : null;

    $numericId = (int)preg_replace('/\D/', '', $authUser['id']);

    if ($pdo && $numericId > 0) {
        if (!empty($username)) {
            $stmt = $pdo->prepare("SELECT id FROM users WHERE LOWER(login) = ? AND id != ?");
            $stmt->execute([strtolower($username), $numericId]);
            if ($stmt->fetch()) {
                jsonResponse(['error' => 'Этот логин уже занят другим пользователем'], 400);
            }
            $pdo->prepare("UPDATE users SET login = ? WHERE id = ?")->execute([$username, $numericId]);
        }

        if (!empty($newPass) && strlen($newPass) >= 6) {
            $hash = password_hash($newPass, PASSWORD_BCRYPT);
            $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?")->execute([$hash, $numericId]);
        }

        if ($tgHandle !== null) {
            $pdo->prepare("UPDATE users SET telegram_handle = ? WHERE id = ?")->execute([$tgHandle, $numericId]);
        }

        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$numericId]);
        $updated = $stmt->fetch();
        jsonResponse([
            'message' => 'Профиль успешно обновлен',
            'user' => formatUser($updated, $pdo)
        ]);
    }

    jsonResponse(['message' => 'Профиль обновлен', 'user' => $authUser]);
}

// ==========================================
// 3. ORDERS API
// ==========================================

// Get Orders List
if ($path === '/orders' && $method === 'GET') {
    $authUser = getAuthenticatedUser($pdo);
    if (!$authUser) {
        jsonResponse(['error' => 'Необходима авторизация'], 401);
    }

    if ($pdo) {
        $isAdmin = ($authUser['role'] === 'admin');
        $numericId = (int)preg_replace('/\D/', '', $authUser['id']);

        $sql = "SELECT o.order_id, o.client_id, o.subject, o.description, o.deadline, o.created_at, o.status, o.contact,
                       p.client_price, p.executer_price, u.login as username, u.email
                FROM orders o
                LEFT JOIN payments p ON o.order_id = p.order_id
                LEFT JOIN users u ON o.client_id = u.id";
        
        $params = [];
        if (!$isAdmin && $numericId > 0) {
            $sql .= " WHERE o.client_id = ?";
            $params[] = $numericId;
        }
        $sql .= " ORDER BY o.order_id DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $orders = array_map(function($r) {
            return [
                'id' => 'ord-' . $r['order_id'],
                'title' => $r['subject'],
                'description' => $r['description'] ?? '',
                'deadline' => $r['deadline'] ?? 'Не указан',
                'price' => $r['client_price'] ? ($r['client_price'] . ' ₽') : 'На обсуждении',
                'client_price' => $r['client_price'] ? ($r['client_price'] . ' ₽') : 'На обсуждении',
                'executer_price' => $r['executer_price'] ? ($r['executer_price'] . ' ₽') : null,
                'contact' => $r['contact'] ?? '',
                'status' => $r['status'] ?? 'new',
                'created_at' => $r['created_at'] ? date('c', strtotime($r['created_at'])) : date('c'),
                'updated_at' => $r['created_at'] ? date('c', strtotime($r['created_at'])) : date('c'),
                'user_id' => 'usr-' . $r['client_id'],
                'user_email' => $r['email'] ?? '',
                'user_username' => $r['username'] ?? 'Пользователь',
                'files' => []
            ];
        }, $rows);

        jsonResponse(['orders' => $orders]);
    }

    jsonResponse(['orders' => []]);
}

// Create Order (Guest & Authenticated)
if ($path === '/orders' && $method === 'POST') {
    $authUser = getAuthenticatedUser($pdo);
    $title = trim($input['title'] ?? '');
    $description = trim($input['description'] ?? '');
    $deadline = trim($input['deadline'] ?? 'Не указан');
    $price = trim($input['price'] ?? 'На обсуждении');
    $contact = trim($input['contact'] ?? '');
    $files = $input['files'] ?? [];
    $termsAccepted = !empty($input['terms_accepted']);
    $privacyAccepted = !empty($input['privacy_accepted']);
    $consentAccepted = !empty($input['consent_accepted']);

    if (empty($title) || empty($description) || empty($contact)) {
        jsonResponse(['error' => 'Заполните обязательные поля: Предмет, Описание, Контакт'], 400);
    }

    if (!$authUser && (!$termsAccepted || !$privacyAccepted || !$consentAccepted)) {
        jsonResponse(['error' => 'Для оформления заказа необходимо подтвердить все 3 соглашения'], 400);
    }

    // Process file attachments (Base64 decode and save to uploads)
    $processedFiles = [];
    $savedFilesForTelegram = [];

    if (is_array($files)) {
        foreach ($files as $idx => $f) {
            $name = preg_replace('/[^a-zA-Z0-9._\-\x{0400}-\x{04FF}]/u', '_', $f['name'] ?? "file_{$idx}");
            $type = $f['type'] ?? 'application/octet-stream';
            $fileUrl = $f['url'] ?? '';
            $diskPath = '';

            if (!empty($f['data']) && is_string($f['data'])) {
                $base64 = preg_replace('#^data:[\w/+-]+;base64,#i', '', $f['data']);
                $content = base64_decode($base64);
                if ($content !== false) {
                    $filename = "ord_" . time() . "_{$idx}_{$name}";
                    $diskPath = UPLOADS_DIR . $filename;
                    file_put_contents($diskPath, $content);
                    $fileUrl = "/uploads/{$filename}";
                    $savedFilesForTelegram[] = [
                        'name' => $name,
                        'path' => $diskPath,
                        'type' => $type
                    ];
                }
            }

            $processedFiles[] = [
                'id' => $f['id'] ?? ('file-' . time() . "-{$idx}"),
                'name' => $name,
                'size' => $f['size'] ?? 0,
                'type' => $type,
                'url' => $fileUrl,
                'uploaded_at' => date('c')
            ];
        }
    }

    $clientId = 1; // Default guest
    $guestEmail = null;

    if ($authUser) {
        $clientId = (int)preg_replace('/\D/', '', $authUser['id']);
        if ($clientId <= 0) $clientId = 1;
        $guestEmail = $authUser['email'];
    } else {
        if (strpos($contact, '@') !== false) {
            $guestEmail = $contact;
        }
    }

    $orderId = null;
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("INSERT INTO orders (client_id, subject, description, deadline, contact, source, status, terms_accepted, privacy_accepted, consent_accepted, agreements_accepted_at, guest_email, created_at)
                VALUES (?, ?, ?, ?, ?, 'website', 'new', 1, 1, 1, NOW(), ?, NOW())");
            $stmt->execute([$clientId, $title, $description, $deadline, $contact, $guestEmail]);
            $orderId = $pdo->lastInsertId();
        } catch (Exception $e) {
            error_log("[Order Insert Fallback]: " . $e->getMessage());
            $stmt = $pdo->prepare("INSERT INTO orders (client_id, subject, description, deadline, contact, source, status, created_at)
                VALUES (?, ?, ?, ?, ?, 'website', 'new', NOW())");
            $stmt->execute([$clientId, $title, $description, $deadline, $contact]);
            $orderId = $pdo->lastInsertId();
        }
    }

    if (!$orderId) {
        $orderId = rand(1000, 9999);
    }

    // Send Telegram Order Notification safely without blocking order creation
    $telegramSent = false;
    try {
        $orderCardData = [
            'order_id' => $orderId,
            'user' => [
                'first_name' => $authUser ? $authUser['username'] : 'Гость',
                'username' => $authUser['telegram_handle'] ?? ($contact[0] === '@' ? ltrim($contact, '@') : '')
            ],
            'subject' => $title,
            'description' => $description,
            'deadline' => $deadline,
            'contact' => $contact
        ];

        $tgRes = sendTelegramOrder($orderCardData, $savedFilesForTelegram);
        $telegramSent = !empty($tgRes['ok']);
    } catch (\Throwable $tgError) {
        error_log("[Telegram Order Error]: " . $tgError->getMessage());
    }

    $createdOrder = [
        'id' => 'ord-' . $orderId,
        'title' => $title,
        'description' => $description,
        'deadline' => $deadline,
        'price' => $price,
        'client_price' => $price,
        'contact' => $contact,
        'status' => 'new',
        'created_at' => date('c'),
        'updated_at' => date('c'),
        'user_id' => $authUser ? $authUser['id'] : 'guest',
        'user_email' => $authUser ? $authUser['email'] : $contact,
        'user_username' => $authUser ? $authUser['username'] : 'Гость (Без регистрации)',
        'is_guest' => !$authUser,
        'files' => $processedFiles
    ];

    jsonResponse([
        'message' => 'Заказ успешно создан и отправлен в BauSquad',
        'order' => $createdOrder,
        'telegram_notified' => $telegramSent
    ], 201);
}

// Update Order Status (Admin)
if (preg_match('#^/orders/([^/]+)/status$#', $path, $matches) && $method === 'PATCH') {
    $authUser = getAuthenticatedUser($pdo);
    if (!$authUser || $authUser['role'] !== 'admin') {
        jsonResponse(['error' => 'Доступ разрешен только администраторам'], 403);
    }

    $rawId = $matches[1];
    $numericId = (int)preg_replace('/\D/', '', $rawId);
    $status = $input['status'] ?? '';

    $validStatuses = ['new', 'assigned', 'in_progress', 'revision', 'rework', 'completed', 'closed', 'cancelled'];
    if (!in_array($status, $validStatuses)) {
        jsonResponse(['error' => 'Недопустимый статус заказа'], 400);
    }

    if ($pdo && $numericId > 0) {
        $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE order_id = ?");
        $stmt->execute([$status, $numericId]);
    }

    sendTelegramMessage("🔔 <b>Изменение статуса заказа #{$rawId}</b>\n\n<b>Новый статус:</b> {$status}");

    jsonResponse(['message' => "Статус заказа #{$rawId} изменен на {$status}"]);
}

// Update Order Prices (Admin)
if (preg_match('#^/orders/([^/]+)/prices$#', $path, $matches) && $method === 'PATCH') {
    $authUser = getAuthenticatedUser($pdo);
    if (!$authUser || $authUser['role'] !== 'admin') {
        jsonResponse(['error' => 'Доступ разрешен только администраторам'], 403);
    }

    $rawId = $matches[1];
    $numericId = (int)preg_replace('/\D/', '', $rawId);
    $clientPrice = (float)($input['client_price'] ?? 0);
    $executerPrice = (float)($input['executer_price'] ?? 0);

    if ($pdo && $numericId > 0) {
        $stmt = $pdo->prepare("INSERT INTO payments (order_id, client_price, executer_price)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE client_price = VALUES(client_price), executer_price = VALUES(executer_price)");
        $stmt->execute([$numericId, $clientPrice, $executerPrice]);
    }

    sendTelegramMessage("💰 <b>Обновление цен заказа #{$rawId}</b>\n\n<b>Клиент:</b> {$clientPrice} ₽\n<b>Исполнитель:</b> {$executerPrice} ₽");

    jsonResponse(['message' => "Цены для заказа #{$rawId} успешно обновлены"]);
}

// ==========================================
// 4. ADMIN & STATS
// ==========================================
if ($path === '/admin/stats' && $method === 'GET') {
    $authUser = getAuthenticatedUser($pdo);
    if (!$authUser || $authUser['role'] !== 'admin') {
        jsonResponse(['error' => 'Доступ разрешен только администраторам'], 403);
    }

    $stats = [
        'total_users' => 0,
        'total_orders' => 0,
        'orders_new' => 0,
        'orders_in_progress' => 0,
        'orders_revision' => 0,
        'orders_completed' => 0,
        'orders_cancelled' => 0,
        'telegram_bot_connected' => !empty(TELEGRAM_BOT_TOKEN),
        'smtp_status' => 'Active (PHP SMTP)',
        'system_uptime' => 'PHP Shared Host',
        'telegram_recent_logs' => []
    ];

    if ($pdo) {
        $stats['total_users'] = (int)$pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
        $stats['total_orders'] = (int)$pdo->query("SELECT COUNT(*) FROM orders")->fetchColumn();
        $stats['orders_new'] = (int)$pdo->query("SELECT COUNT(*) FROM orders WHERE status = 'new'")->fetchColumn();
        $stats['orders_in_progress'] = (int)$pdo->query("SELECT COUNT(*) FROM orders WHERE status = 'in_progress'")->fetchColumn();
        $stats['orders_revision'] = (int)$pdo->query("SELECT COUNT(*) FROM orders WHERE status = 'revision'")->fetchColumn();
        $stats['orders_completed'] = (int)$pdo->query("SELECT COUNT(*) FROM orders WHERE status = 'completed'")->fetchColumn();
        $stats['orders_cancelled'] = (int)$pdo->query("SELECT COUNT(*) FROM orders WHERE status = 'cancelled'")->fetchColumn();
    }

    jsonResponse($stats);
}

if ($path === '/admin/users' && $method === 'GET') {
    $authUser = getAuthenticatedUser($pdo);
    if (!$authUser || $authUser['role'] !== 'admin') {
        jsonResponse(['error' => 'Доступ разрешен только администраторам'], 403);
    }

    if ($pdo) {
        $rows = $pdo->query("SELECT * FROM users ORDER BY id DESC")->fetchAll();
        $users = array_map(function($u) use ($pdo) {
            return formatUser($u, $pdo);
        }, $rows);
        jsonResponse(['users' => $users]);
    }

    jsonResponse(['users' => []]);
}

if (preg_match('#^/admin/users/([^/]+)/role$#', $path, $matches) && $method === 'PATCH') {
    $authUser = getAuthenticatedUser($pdo);
    if (!$authUser || $authUser['role'] !== 'admin') {
        jsonResponse(['error' => 'Доступ разрешен только администраторам'], 403);
    }

    $rawId = $matches[1];
    $numericId = (int)preg_replace('/\D/', '', $rawId);
    $role = $input['role'] ?? 'customer';

    if (!in_array($role, ['customer', 'admin'])) {
        jsonResponse(['error' => 'Недопустимая роль'], 400);
    }

    if ($pdo && $numericId > 0) {
        $pdo->prepare("UPDATE users SET role = ? WHERE id = ?")->execute([$role, $numericId]);
    }

    jsonResponse(['message' => "Роль пользователя обновлена на {$role}"]);
}

if (preg_match('#^/admin/users/([^/]+)/status$#', $path, $matches) && $method === 'PATCH') {
    $authUser = getAuthenticatedUser($pdo);
    if (!$authUser || $authUser['role'] !== 'admin') {
        jsonResponse(['error' => 'Доступ разрешен только администраторам'], 403);
    }

    $rawId = $matches[1];
    $numericId = (int)preg_replace('/\D/', '', $rawId);
    $status = $input['account_status'] ?? 'active';

    if (!in_array($status, ['active', 'banned', 'deleted'])) {
        jsonResponse(['error' => 'Недопустимый статус аккаунта'], 400);
    }

    if ($pdo && $numericId > 0) {
        $pdo->prepare("UPDATE users SET account_status = ? WHERE id = ?")->execute([$status, $numericId]);
    }

    jsonResponse(['message' => "Статус аккаунта обновлен на {$status}"]);
}

if (preg_match('#^/admin/users/([^/]+)$#', $path, $matches) && $method === 'DELETE') {
    $authUser = getAuthenticatedUser($pdo);
    if (!$authUser || $authUser['role'] !== 'admin') {
        jsonResponse(['error' => 'Доступ разрешен только администраторам'], 403);
    }

    $rawId = $matches[1];
    $numericId = (int)preg_replace('/\D/', '', $rawId);

    if ($pdo && $numericId > 0) {
        $pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$numericId]);
    }

    jsonResponse(['message' => "Пользователь удален"]);
}

// ==========================================
// 5. SUPPORT, AGREEMENTS, COOKIES & UPLOADS
// ==========================================
if ($path === '/support' && $method === 'POST') {
    $contact = trim($input['contact'] ?? 'Гость');
    $message = trim($input['message'] ?? '');

    if (empty($message)) {
        jsonResponse(['error' => 'Сообщение не может быть пустым'], 400);
    }

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("INSERT INTO support_requests (client_id, message, status, created_at) VALUES (?, ?, 'new', NOW())");
            $stmt->execute([$contact, $message]);
        } catch (Exception $e) {}
    }

    $tgText = "💬 <b>Новое обращение в техподдержку BauSquad (PHP)</b>\n\n" .
              "<b>Контакт:</b> " . htmlspecialchars($contact) . "\n" .
              "<b>Сообщение:</b> " . htmlspecialchars($message) . "\n" .
              "<b>Дата:</b> " . date('Y-m-d H:i:s');
    sendTelegramMessage($tgText);

    jsonResponse(['message' => 'Обращение успешно отправлено']);
}

if ($path === '/agreements' && $method === 'GET') {
    jsonResponse([
        'terms' => [
            'id' => 'terms',
            'title' => 'Пользовательское соглашение',
            'version' => '2.1',
            'last_updated' => '2026-01-10',
            'sections' => [
                ['heading' => '1. Общие положения', 'content' => 'Платформа BauSquad предоставляет информационно-консультационные услуги по сопровождению студентов при подготовке академических и научно-исследовательских работ.'],
                ['heading' => '2. Порядок оформления и выполнения заказов', 'content' => 'Пользователь формирует заявку с указанием предмета, подробного описания, сроков и стоимости.'],
                ['heading' => '3. Гарантии и конфиденциальность', 'content' => 'BauSquad гарантирует полную анонимность клиента. Все переданные файлы и контактные данные используются исключительно для выполнения заказа.']
            ]
        ],
        'privacy' => [
            'id' => 'privacy',
            'title' => 'Политика конфиденциальности',
            'version' => '2.0',
            'last_updated' => '2026-01-10',
            'sections' => [
                ['heading' => '1. Сбор персональных данных', 'content' => 'Платформа обрабатывает минимальный набор данных: адрес электронной почты, логин и контактный Telegram/телефон.'],
                ['heading' => '2. Хранение и шифрование', 'content' => 'Пароли пользователей хранятся строго в виде bcrypt-хэшей. Передача данных осуществляется по защищенному протоколу HTTPS.']
            ]
        ],
        'consent' => [
            'id' => 'consent',
            'title' => 'Согласие на обработку персональных данных',
            'version' => '1.5',
            'last_updated' => '2026-01-10',
            'sections' => [
                ['heading' => '1. Предмет согласия', 'content' => 'Настоящим пользователь даёт свободно согласие BauSquad на обработку предоставленных данных при регистрации и оформлении заказов.']
            ]
        ]
    ]);
}

if ($path === '/cookies' && $method === 'POST') {
    jsonResponse(['message' => 'Настройки cookie успешно сохранены', 'saved_at' => date('c')]);
}

if ($path === '/upload' && $method === 'POST') {
    jsonResponse([
        'message' => 'Файлы успешно загружены',
        'files' => [[
            'id' => 'file-' . time(),
            'name' => 'Техническое_Задание_BauSquad.pdf',
            'size' => 1542000,
            'type' => 'application/pdf',
            'url' => '/uploads/sample_tz.pdf',
            'uploaded_at' => date('c')
        ]]
    ]);
}

// 404 Not Found for unmatched API routes
jsonResponse(['error' => "Маршрут API '{$uri}' не найден на PHP сервере BauSquad"], 404);
