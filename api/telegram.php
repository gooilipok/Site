<?php
/**
 * BauSquad — Telegram Bot API Service
 * Отправка структурированных карточек заказов, коллажей фото и документов
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

function sendTelegramRequest($endpoint, $postData, $isMultipart = false): array {
    $token = TELEGRAM_BOT_TOKEN;
    if (empty($token)) {
        return ['ok' => false, 'error' => 'Bot token is empty'];
    }

    $endpoints = [
        "https://api.telegram.org/bot{$token}/{$endpoint}"
    ];
    if (!empty(TELEGRAM_API_PROXY)) {
        $endpoints[] = rtrim(TELEGRAM_API_PROXY, '/') . "/bot{$token}/{$endpoint}";
    }

    foreach ($endpoints as $url) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 20);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        if ($isMultipart) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
        } else {
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($response) {
            $json = json_decode($response, true);
            if (!empty($json['ok'])) {
                return ['ok' => true, 'data' => $json];
            }
        }
    }

    return ['ok' => false, 'error' => $error ?? 'Failed to send to Telegram'];
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
 * Отправка заказа с фото-коллажем и документами
 */
function sendTelegramOrder(array $orderData, array $files = []): array {
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
        // Одно фото
        $photo = $photos[0];
        $postData = [
            'chat_id' => $chatId,
            'caption' => mb_strlen($text) <= 1024 ? $text : "📸 <b>Фото к заказу #{$orderId}</b>",
            'parse_mode' => 'HTML',
            'photo' => new CURLFile($photo['path'], mime_content_type($photo['path']), $photo['name'])
        ];
        if (mb_strlen($text) > 1024) {
            sendTelegramMessage($text, $chatId);
        }
        sendTelegramRequest('sendPhoto', $postData, true);
    } else {
        // Несколько фото (коллаж sendMediaGroup)
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
                $item['caption'] = mb_strlen($text) <= 1024 ? $text : "📸 <b>Фотографии к заказу #{$orderId}</b> (" . count($photos) . " шт.)";
                $item['parse_mode'] = 'HTML';
            }
            $mediaGroup[] = $item;
            $postData[$attachKey] = new CURLFile($photo['path'], mime_content_type($photo['path']), $photo['name']);
        }

        $postData['media'] = json_encode($mediaGroup);
        sendTelegramRequest('sendMediaGroup', $postData, true);
    }

    // 2. Отправка документов следом вторым сообщением
    if (!empty($documents)) {
        foreach ($documents as $doc) {
            $postData = [
                'chat_id' => $chatId,
                'caption' => "📎 <b>Документ к заказу #{$orderId}:</b>\n" . htmlspecialchars($doc['name']),
                'parse_mode' => 'HTML',
                'document' => new CURLFile($doc['path'], mime_content_type($doc['path']), $doc['name'])
            ];
            sendTelegramRequest('sendDocument', $postData, true);
        }
    }

    return ['ok' => true];
}
