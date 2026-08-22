<?php
/**
 * BauSquad — Telegram Bot API Service (Root & Docs Level)
 * Отправка структурированных карточек заказов, фото в шапке и документов отдельным сообщением
 * Полная совместимость с Cloudflare Worker реверс-прокси и cURL SOCKS5/HTTP прокси
 */
require_once __DIR__ . '/config.php';

function formatTelegramOrderCard(array $data): string {
    $orderId = !empty($data['order_id']) ? $data['order_id'] : 'Новый';

    $user = $data['user'] ?? [];
    $customerName = 'Гость';
    if (!empty($user['username']) && $user['username'] !== 'Гость (Без регистрации)' && $user['username'] !== 'website_guest') {
        $customerName = $user['username'];
    } elseif (!empty($user['first_name']) && $user['first_name'] !== 'Гость (Без регистрации)' && $user['first_name'] !== 'Клиент') {
        $customerName = $user['first_name'];
    }

    $subject = $data['subject'] ?? ($data['title'] ?? 'Без темы');
    $description = $data['description'] ?? 'Без описания';
    $deadline = $data['deadline'] ?? 'Не указан';
    $contact = $data['contact'] ?? 'Не указан';

    return "📋 <b>Заказ №{$orderId}</b>\n\n" .
           "👤 <b>Заказчик:</b>\n" . htmlspecialchars((string)$customerName, ENT_QUOTES, 'UTF-8') . "\n\n" .
           "📘 <b>Предмет:</b>\n" . htmlspecialchars((string)$subject, ENT_QUOTES, 'UTF-8') . "\n\n" .
           "📝 <b>Описание:</b>\n" . htmlspecialchars((string)$description, ENT_QUOTES, 'UTF-8') . "\n\n" .
           "⏰ <b>Срок:</b>\n" . htmlspecialchars((string)$deadline, ENT_QUOTES, 'UTF-8') . "\n\n" .
           "📞 <b>Контакты:</b>\n" . htmlspecialchars((string)$contact, ENT_QUOTES, 'UTF-8');
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
        'zip' => 'application/zip', 'rar' => 'application/x-rar-compressed', '7z' => 'application/x-7z-compressed',
        'dwg' => 'application/acad', 'dxf' => 'application/dxf'
    ];
    return $map[$ext] ?? $default;
}

function sendTelegramRequest($endpoint, $postData, $isMultipart = false, $timeoutSeconds = 4, $customProxy = null): array {
    $token = defined('TELEGRAM_BOT_TOKEN') ? TELEGRAM_BOT_TOKEN : '';
    if (empty($token)) {
        return ['ok' => false, 'error' => 'Bot token is empty'];
    }

    $proxy = $customProxy !== null ? trim($customProxy) : (defined('TELEGRAM_API_PROXY') ? trim(TELEGRAM_API_PROXY) : '');
    $curlProxy = defined('TELEGRAM_CURL_PROXY') ? trim(TELEGRAM_CURL_PROXY) : '';

    // If proxy string is formatted as socks5:// or http:// with port, treat as cURL forward proxy
    if (preg_match('/^(socks5|socks5h|http|https):\/\/[^\/]+:\d+/i', $proxy)) {
        $curlProxy = $proxy;
        $proxy = '';
    }

    $endpoints = [];

    // 1. Configured Reverse Proxy (Cloudflare Worker or custom domain mirror)
    if (!empty($proxy)) {
        $cleanProxy = rtrim($proxy, '/');
        $endpoints[] = "{$cleanProxy}/bot{$token}/{$endpoint}";
        $endpoints[] = "{$cleanProxy}/{$endpoint}";
    }

    // 2. Direct Telegram API
    $endpoints[] = "https://api.telegram.org/bot{$token}/{$endpoint}";

    $endpoints = array_unique($endpoints);
    $attemptLogs = [];
    $lastError = 'Unknown Telegram error';

    foreach ($endpoints as $url) {
        if (function_exists('curl_init')) {
            $ch = @curl_init();
            if ($ch) {
                try {
                    @curl_setopt($ch, CURLOPT_URL, $url);
                    @curl_setopt($ch, CURLOPT_POST, true);
                    @curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    @curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, (int)$timeoutSeconds);
                    @curl_setopt($ch, CURLOPT_TIMEOUT, (int)$timeoutSeconds + 3);
                    @curl_setopt($ch, CURLOPT_NOSIGNAL, 1);
                    @curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                    @curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
                    @curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
                    @curl_setopt($ch, CURLOPT_MAXREDIRS, 3);
                    @curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (compatible; BauSquadBot/2.0; +https://bausquad.org)');

                    if (!empty($curlProxy)) {
                        @curl_setopt($ch, CURLOPT_PROXY, $curlProxy);
                        if (stripos($curlProxy, 'socks5h://') === 0) {
                            @curl_setopt($ch, CURLOPT_PROXYTYPE, CURLPROXY_SOCKS5_HOSTNAME);
                        } elseif (stripos($curlProxy, 'socks5://') === 0) {
                            @curl_setopt($ch, CURLOPT_PROXYTYPE, CURLPROXY_SOCKS5);
                        } elseif (stripos($curlProxy, 'http://') === 0 || stripos($curlProxy, 'https://') === 0) {
                            @curl_setopt($ch, CURLOPT_PROXYTYPE, CURLPROXY_HTTP);
                        }
                    }

                    if ($isMultipart) {
                        @curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
                    } else {
                        @curl_setopt($ch, CURLOPT_HTTPHEADER, [
                            'Content-Type: application/json',
                            'Accept: application/json'
                        ]);
                        @curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData, JSON_UNESCAPED_UNICODE));
                    }

                    $response = @curl_exec($ch);
                    $httpCode = (int)@curl_getinfo($ch, CURLINFO_HTTP_CODE);
                    $curlErrNo = @curl_errno($ch);
                    $error = @curl_error($ch);
                    @curl_close($ch);

                    if ($response) {
                        $json = @json_decode($response, true);
                        if (is_array($json) && !empty($json['ok'])) {
                            return [
                                'ok' => true,
                                'url_used' => $url,
                                'http_code' => $httpCode,
                                'data' => $json,
                                'attempts' => $attemptLogs
                            ];
                        }
                        $desc = $json['description'] ?? ($json['error'] ?? "HTTP {$httpCode}: " . substr(strip_tags((string)$response), 0, 150));
                        $attemptLogs[] = "{$url} [HTTP {$httpCode}] -> {$desc}";
                        $lastError = $desc;
                    } else {
                        $attemptLogs[] = "{$url} [cURL error {$curlErrNo}] -> " . ($error ?: 'Timeout/No response');
                        $lastError = $error ?: 'Timeout/No response';
                    }
                } catch (\Throwable $e) {
                    @curl_close($ch);
                    $attemptLogs[] = "{$url} -> Exception: " . $e->getMessage();
                    $lastError = $e->getMessage();
                }
            }
        }

        if (!$isMultipart && ini_get('allow_url_fopen')) {
            try {
                $opts = [
                    'http' => [
                        'method' => 'POST',
                        'header' => "Content-Type: application/json\r\nUser-Agent: Mozilla/5.0 (compatible; BauSquadBot/2.0)\r\n",
                        'content' => json_encode($postData, JSON_UNESCAPED_UNICODE),
                        'timeout' => $timeoutSeconds,
                        'ignore_errors' => true
                    ],
                    'ssl' => [
                        'verify_peer' => false,
                        'verify_peer_name' => false
                    ]
                ];
                if (!empty($curlProxy) && (stripos($curlProxy, 'http://') === 0 || stripos($curlProxy, 'https://') === 0)) {
                    $opts['http']['proxy'] = str_replace(['http://', 'https://'], 'tcp://', $curlProxy);
                    $opts['http']['request_fulluri'] = true;
                }
                $context = @stream_context_create($opts);
                $res = @file_get_contents($url, false, $context);
                if ($res) {
                    $json = @json_decode($res, true);
                    if (is_array($json) && !empty($json['ok'])) {
                        return [
                            'ok' => true,
                            'url_used' => $url . ' (via fopen)',
                            'data' => $json,
                            'attempts' => $attemptLogs
                        ];
                    }
                }
            } catch (\Throwable $e) {
                $attemptLogs[] = "{$url} (fopen) -> " . $e->getMessage();
            }
        }
    }

    return [
        'ok' => false,
        'error' => $lastError,
        'attempts' => $attemptLogs
    ];
}

function sendTelegramMessage($text, $chatId = null): array {
    $targetChat = $chatId ?: (defined('TELEGRAM_CHAT_ID') ? TELEGRAM_CHAT_ID : '');
    return sendTelegramRequest('sendMessage', [
        'chat_id' => $targetChat,
        'text' => $text,
        'parse_mode' => 'HTML'
    ]);
}

function sendTelegramNotification($text, $chatId = null): array {
    return sendTelegramMessage($text, $chatId);
}

/**
 * Отправка заказа:
 * 1. Карточка заказа отправляется в шапке вместе с прикрепленными фото (sendPhoto / sendMediaGroup) или как сообщение
 * 2. Документы (не фото) отправляются следом вторым сообщением (sendDocument)
 */
function sendTelegramOrder(array $orderData, array $files = []): array {
    try {
        $chatId = defined('TELEGRAM_CHAT_ID') ? TELEGRAM_CHAT_ID : '';
        if (empty($chatId)) {
            return ['ok' => false, 'error' => 'TELEGRAM_CHAT_ID is empty'];
        }

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

        $mainResult = null;

        // 1. Отправка фото в шапке карточки заказа или обычным сообщением
        if (empty($photos)) {
            $mainResult = sendTelegramMessage($text, $chatId);
        } elseif (count($photos) === 1) {
            $photo = $photos[0];
            $mimeType = getMimeTypeSafely($photo['path'], 'image/jpeg');

            if (mb_strlen($text) <= 1024) {
                $postData = [
                    'chat_id' => $chatId,
                    'caption' => $text,
                    'parse_mode' => 'HTML',
                    'photo' => new CURLFile($photo['path'], $mimeType, $photo['name'])
                ];
                $mainResult = sendTelegramRequest('sendPhoto', $postData, true);
            } else {
                $mainResult = sendTelegramMessage($text, $chatId);
                $photoPost = [
                    'chat_id' => $chatId,
                    'photo' => new CURLFile($photo['path'], $mimeType, $photo['name'])
                ];
                sendTelegramRequest('sendPhoto', $photoPost, true);
            }
        } else {
            $isCaptionInMedia = mb_strlen($text) <= 1024;
            if (!$isCaptionInMedia) {
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
                if ($idx === 0 && $isCaptionInMedia) {
                    $item['caption'] = $text;
                    $item['parse_mode'] = 'HTML';
                }
                $mediaGroup[] = $item;
                $mimeType = getMimeTypeSafely($photo['path'], 'image/jpeg');
                $postData[$attachKey] = new CURLFile($photo['path'], $mimeType, $photo['name']);
            }

            $postData['media'] = json_encode($mediaGroup);
            $mainResult = sendTelegramRequest('sendMediaGroup', $postData, true);

            if (!$mainResult['ok']) {
                if ($isCaptionInMedia) {
                    sendTelegramMessage($text, $chatId);
                }
                foreach ($photos as $photo) {
                    $mimeType = getMimeTypeSafely($photo['path'], 'image/jpeg');
                    $singlePost = [
                        'chat_id' => $chatId,
                        'photo' => new CURLFile($photo['path'], $mimeType, $photo['name'])
                    ];
                    sendTelegramRequest('sendPhoto', $singlePost, true);
                }
            }
        }

        // 2. Отправка документов ВТОРЫМ сообщением
        if (!empty($documents)) {
            foreach ($documents as $doc) {
                $mimeType = getMimeTypeSafely($doc['path'], 'application/octet-stream');
                $docPostData = [
                    'chat_id' => $chatId,
                    'caption' => "📎 Файл к заказу №{$orderId}: " . htmlspecialchars($doc['name'], ENT_QUOTES, 'UTF-8'),
                    'parse_mode' => 'HTML',
                    'document' => new CURLFile($doc['path'], $mimeType, $doc['name'])
                ];
                sendTelegramRequest('sendDocument', $docPostData, true);
            }
        }

        return $mainResult ?: ['ok' => true];
    } catch (\Throwable $e) {
        error_log("[sendTelegramOrder Exception]: " . $e->getMessage());
        return ['ok' => false, 'error' => $e->getMessage()];
    }
}
