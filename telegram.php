<?php
/**
 * BauSquad — Telegram Bot API Service (Root Level)
 * Отправка структурированных карточек заказов, фото и документов
 * Полная защита от зависаний и 502 Bad Gateway таймаутов на хостинге
 */
require_once __DIR__ . '/config.php';

function formatTelegramOrderCard(array $data): string {
    $orderHeader = !empty($data['order_id'])
        ? "📋 <b>Заказ №{$data['order_id']}</b>\n\n"
        : "📋 <b>Новый заказ</b>\n\n";

    $user = $data['user'] ?? [];
    $firstName = $user['first_name'] ?? 'Клиент';
    $lastName = !empty($user['last_name']) ? " {$user['last_name']}" : '';
    $username = !empty($user['username']) ? " (@" . ltrim($user['username'], '@') . ")" : '';

    $userBlock = "👤 <b>Заказчик:</b>\n{$firstName}{$lastName}{$username}\n\n";
    $subject = htmlspecialchars($data['subject'] ?? 'Без темы', ENT_QUOTES, 'UTF-8');
    $description = htmlspecialchars($data['description'] ?? '', ENT_QUOTES, 'UTF-8');
    $deadline = htmlspecialchars($data['deadline'] ?? 'Не указан', ENT_QUOTES, 'UTF-8');
    $contact = htmlspecialchars($data['contact'] ?? 'Не указан', ENT_QUOTES, 'UTF-8');

    return $orderHeader .
        $userBlock .
        "📘 <b>Предмет:</b>\n{$subject}\n\n" .
        "📝 <b>Описание:</b>\n{$description}\n\n" .
        "⏰ <b>Срок:</b>\n{$deadline}\n\n" .
        "📞 <b>Контакты:</b>\n{$contact}";
}

function getMimeTypeSafely($filePath, $default = 'application/octet-stream'): string {
    if (function_exists('mime_content_type') && file_exists($filePath)) {
        $m = @mime_content_type($filePath);
        if ($m) return $m;
    }
    $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
    $map = [
        'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png',
        'gif' => 'image/gif', 'webp' => 'image/webp', 'bmp' => 'image/bmp',
        'pdf' => 'application/pdf', 'txt' => 'text/plain',
        'doc' => 'application/msword', 'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls' => 'application/vnd.ms-excel', 'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'zip' => 'application/zip', 'rar' => 'application/x-rar-compressed', '7z' => 'application/x-7z-compressed'
    ];
    return $map[$ext] ?? $default;
}

function sendTelegramRequest($endpoint, $postData, $isMultipart = false, $timeoutSeconds = 4): array {
    $token = TELEGRAM_BOT_TOKEN;
    if (empty($token)) {
        return ['ok' => false, 'error' => 'Bot token is empty'];
    }

    $endpoints = [];
    if (!empty(TELEGRAM_API_PROXY)) {
        $endpoints[] = rtrim(TELEGRAM_API_PROXY, '/') . "/bot{$token}/{$endpoint}";
    }
    $endpoints[] = "https://api.telegram.org/bot{$token}/{$endpoint}";

    $lastError = 'Unknown error';

    foreach ($endpoints as $url) {
        if (function_exists('curl_init')) {
            $ch = @curl_init();
            if ($ch) {
                try {
                    @curl_setopt($ch, CURLOPT_URL, $url);
                    @curl_setopt($ch, CURLOPT_POST, true);
                    @curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    @curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, (int)$timeoutSeconds);
                    @curl_setopt($ch, CURLOPT_TIMEOUT, (int)$timeoutSeconds + 2);
                    @curl_setopt($ch, CURLOPT_NOSIGNAL, 1);
                    @curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                    @curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

                    if ($isMultipart) {
                        @curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
                    } else {
                        @curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
                        @curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData, JSON_UNESCAPED_UNICODE));
                    }

                    $response = @curl_exec($ch);
                    $error = @curl_error($ch);
                    @curl_close($ch);

                    if ($response) {
                        $json = @json_decode($response, true);
                        if (!empty($json['ok'])) {
                            return ['ok' => true, 'data' => $json];
                        }
                        if (!empty($json['description'])) {
                            $lastError = $json['description'];
                        }
                    } else {
                        $lastError = $error ?: 'No response / network timeout';
                    }
                } catch (\Throwable $e) {
                    @curl_close($ch);
                    $lastError = $e->getMessage();
                }
            }
        }

        // Fallback to file_get_contents if curl didn't succeed and not multipart
        if (!$isMultipart && ini_get('allow_url_fopen')) {
            try {
                $opts = [
                    'http' => [
                        'method' => 'POST',
                        'header' => "Content-Type: application/json\r\n",
                        'content' => json_encode($postData, JSON_UNESCAPED_UNICODE),
                        'timeout' => $timeoutSeconds,
                        'ignore_errors' => true
                    ],
                    'ssl' => [
                        'verify_peer' => false,
                        'verify_peer_name' => false
                    ]
                ];
                $context = @stream_context_create($opts);
                $res = @file_get_contents($url, false, $context);
                if ($res) {
                    $json = @json_decode($res, true);
                    if (!empty($json['ok'])) {
                        return ['ok' => true, 'data' => $json];
                    }
                }
            } catch (\Throwable $e) {}
        }
    }

    return ['ok' => false, 'error' => $lastError];
}

function sendTelegramMessage($text, $chatId = null): array {
    $targetChat = $chatId ?: TELEGRAM_CHAT_ID;
    return sendTelegramRequest('sendMessage', [
        'chat_id' => $targetChat,
        'text' => $text,
        'parse_mode' => 'HTML'
    ]);
}

/**
 * Алиас для обратной совместимости с диагностикой и скриптами
 */
function sendTelegramNotification($text, $chatId = null): array {
    return sendTelegramMessage($text, $chatId);
}

/**
 * Отправка заказа с фото и документами
 */
function sendTelegramOrder(array $orderData, array $files = []): array {
    try {
        $chatId = TELEGRAM_CHAT_ID;
        $text = formatTelegramOrderCard($orderData);
        $orderId = $orderData['order_id'] ?? '';

        $photos = [];
        $documents = [];

        foreach ($files as $f) {
            $fileName = $f['name'] ?? 'file';
            $filePath = $f['path'] ?? '';
            $mime = $f['type'] ?? '';

            if (!empty($filePath) && file_exists($filePath)) {
                $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
                if (in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'bmp']) || strpos($mime, 'image/') === 0) {
                    $photos[] = ['name' => $fileName, 'path' => $filePath];
                } else {
                    $documents[] = ['name' => $fileName, 'path' => $filePath];
                }
            }
        }

        // 1. Отправка фото или текстового сообщения
        if (empty($photos)) {
            sendTelegramMessage($text, $chatId);
        } elseif (count($photos) === 1) {
            $photo = $photos[0];
            $mimeType = getMimeTypeSafely($photo['path'], 'image/jpeg');
            $postData = [
                'chat_id' => $chatId,
                'caption' => mb_strlen($text) <= 1024 ? $text : "📸 <b>Фото к заказу #{$orderId}</b>",
                'parse_mode' => 'HTML',
                'photo' => new CURLFile($photo['path'], $mimeType, $photo['name'])
            ];
            if (mb_strlen($text) > 1024) {
                sendTelegramMessage($text, $chatId);
            }
            sendTelegramRequest('sendPhoto', $postData, true);
        } else {
            if (mb_strlen($text) > 1024) {
                sendTelegramMessage($text, $chatId);
            }

            $mediaGroup = [];
            $postData = ['chat_id' => $chatId];

            foreach ($photos as $idx => $photo) {
                $attachKey = "photo_{$idx}";
                $item = [
                    'type' => 'photo',
                    'media' => "attach://{$attachKey}"
                ];
                if ($idx === 0) {
                    $item['caption'] = mb_strlen($text) <= 1024 ? $text : "📸 <b>Фото к заказу #{$orderId}</b> (" . count($photos) . " шт.)";
                    $item['parse_mode'] = 'HTML';
                }
                $mediaGroup[] = $item;
                $mimeType = getMimeTypeSafely($photo['path'], 'image/jpeg');
                $postData[$attachKey] = new CURLFile($photo['path'], $mimeType, $photo['name']);
            }

            $postData['media'] = json_encode($mediaGroup);
            sendTelegramRequest('sendMediaGroup', $postData, true);
        }

        // 2. Отправка документов
        if (!empty($documents)) {
            foreach ($documents as $doc) {
                $mimeType = getMimeTypeSafely($doc['path'], 'application/octet-stream');
                $postData = [
                    'chat_id' => $chatId,
                    'caption' => "📎 <b>Документ к заказу #{$orderId}:</b>\n" . htmlspecialchars($doc['name']),
                    'parse_mode' => 'HTML',
                    'document' => new CURLFile($doc['path'], $mimeType, $doc['name'])
                ];
                sendTelegramRequest('sendDocument', $postData, true);
            }
        }

        return ['ok' => true];
    } catch (\Throwable $e) {
        error_log("[sendTelegramOrder Exception]: " . $e->getMessage());
        return ['ok' => false, 'error' => $e->getMessage()];
    }
}
