<?php
/**
 * BauSquad — Email Sender via Direct Socket SMTP & Native mail() fallback
 * Полная защита от зависаний сокетов и 502 Bad Gateway таймаутов
 * Не требует composer/внешних пакетов, работает на любом PHP 7.4+ хостинге
 */
require_once __DIR__ . '/config.php';

function sendEmail($to, $subject, $htmlContent, $textContent = ''): array {
    $host = defined('SMTP_HOST') ? SMTP_HOST : 'mail.nic.ru';
    $port = defined('SMTP_PORT') ? (int)SMTP_PORT : 465;
    $user = defined('SMTP_USER') ? SMTP_USER : 'bausquadresponse@bausquad.org';
    $pass = defined('SMTP_PASS') ? SMTP_PASS : 'W%9_P2y8%i9/';
    $from = defined('SMTP_FROM') ? SMTP_FROM : 'BauSquad <bausquadresponse@bausquad.org>';

    // Native mail() fallback helper
    $sendNativeMail = function() use ($to, $subject, $htmlContent, $from, $user) {
        $headers  = "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $headers .= "From: {$from}\r\n";
        $headers .= "Reply-To: {$user}\r\n";
        $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";

        $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
        $ok = @mail($to, $encodedSubject, $htmlContent, $headers);
        return [
            'success' => (bool)$ok,
            'method' => 'native_mail',
            'detail' => $ok ? 'Письмо успешно отправлено через PHP mail()' : 'Функция mail() вернула false'
        ];
    };

    // If credentials not set, use native mail() immediately
    if (empty($user) || empty($pass)) {
        return $sendNativeMail();
    }

    // Try SMTP Socket connection
    // We try ports: configured port (465/587) then alternate if needed
    $attempts = [
        ['scheme' => ($port === 465 ? 'ssl://' : ''), 'port' => $port],
        ['scheme' => 'ssl://', 'port' => 465],
        ['scheme' => '', 'port' => 587],
        ['scheme' => '', 'port' => 25]
    ];

    // Remove duplicates
    $uniqueAttempts = [];
    $seen = [];
    foreach ($attempts as $att) {
        $k = $att['scheme'] . $att['port'];
        if (!isset($seen[$k])) {
            $seen[$k] = true;
            $uniqueAttempts[] = $att;
        }
    }

    $lastError = '';

    foreach ($uniqueAttempts as $att) {
        $scheme = $att['scheme'];
        $tryPort = $att['port'];
        $remote = $scheme . $host . ':' . $tryPort;

        $ctx = stream_context_create([
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            ]
        ]);

        $errno = 0;
        $errstr = '';
        // 3 second connect timeout
        $socket = @stream_socket_client($remote, $errno, $errstr, 3, STREAM_CLIENT_CONNECT, $ctx);

        if (!$socket) {
            $lastError = "Connect to {$remote} failed: {$errstr} ({$errno})";
            continue;
        }

        try {
            stream_set_timeout($socket, 3);

            $getResponse = function($sock) {
                $data = '';
                while (!feof($sock) && ($str = fgets($sock, 515))) {
                    $data .= $str;
                    if (strlen($str) >= 4 && substr($str, 3, 1) === ' ') {
                        break;
                    }
                }
                return $data;
            };

            $sendCommand = function($sock, $cmd) use ($getResponse) {
                fputs($sock, $cmd . "\r\n");
                return $getResponse($sock);
            };

            $banner = $getResponse($socket);
            if (empty($banner)) {
                @fclose($socket);
                $lastError = "Empty banner from {$remote}";
                continue;
            }

            $serverName = $_SERVER['SERVER_NAME'] ?? 'bausquad.org';
            $ehloRes = $sendCommand($socket, "EHLO " . $serverName);

            // If STARTTLS on port 587
            if ($tryPort === 587 && strpos($ehloRes, 'STARTTLS') !== false) {
                $tlsRes = $sendCommand($socket, "STARTTLS");
                if (strpos($tlsRes, '220') !== false) {
                    if (@stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT | STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                        $ehloRes = $sendCommand($socket, "EHLO " . $serverName);
                    }
                }
            }

            // Auth Login
            $authRes = $sendCommand($socket, "AUTH LOGIN");
            if (strpos($authRes, '334') === false) {
                @fclose($socket);
                $lastError = "AUTH LOGIN not accepted on {$remote}: {$authRes}";
                continue;
            }

            $sendCommand($socket, base64_encode($user));
            $passRes = $sendCommand($socket, base64_encode($pass));

            if (strpos($passRes, '235') === false) {
                @fclose($socket);
                $lastError = "SMTP Auth failed for {$user} on {$remote}: {$passRes}";
                continue;
            }

            // Envelope
            $mailFromRes = $sendCommand($socket, "MAIL FROM: <{$user}>");
            $rcptToRes = $sendCommand($socket, "RCPT TO: <{$to}>");
            $dataRes = $sendCommand($socket, "DATA");

            if (strpos($dataRes, '354') === false) {
                @fclose($socket);
                $lastError = "DATA command rejected on {$remote}: {$dataRes}";
                continue;
            }

            // Message Body
            $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
            $msg  = "From: {$from}\r\n";
            $msg .= "To: {$to}\r\n";
            $msg .= "Reply-To: {$user}\r\n";
            $msg .= "Subject: {$encodedSubject}\r\n";
            $msg .= "MIME-Version: 1.0\r\n";
            $msg .= "Content-Type: text/html; charset=UTF-8\r\n";
            $msg .= "Content-Transfer-Encoding: 8bit\r\n";
            $msg .= "X-Mailer: BauSquad-SMTP/1.0\r\n\r\n";
            $msg .= $htmlContent . "\r\n.\r\n";

            $sendRes = $sendCommand($socket, $msg);
            $sendCommand($socket, "QUIT");
            @fclose($socket);

            if (strpos($sendRes, '250') !== false) {
                return [
                    'success' => true,
                    'method' => "smtp ({$remote})",
                    'detail' => trim($sendRes)
                ];
            } else {
                $lastError = "Message send rejected: {$sendRes}";
            }
        } catch (\Throwable $e) {
            @fclose($socket);
            $lastError = $e->getMessage();
        }
    }

    // If all SMTP direct socket attempts failed, try native mail() as final fallback
    error_log("[SMTP Fallback to mail()]: {$lastError}");
    $fallbackRes = $sendNativeMail();
    if ($fallbackRes['success']) {
        return [
            'success' => true,
            'method' => 'native_mail_fallback',
            'detail' => 'Отправлено через функцию mail() сервера (SMTP сокет выдал: ' . $lastError . ')'
        ];
    }

    return [
        'success' => false,
        'method' => 'failed',
        'error' => $lastError ?: 'Не удалось отправить письмо ни через SMTP, ни через mail()'
    ];
}
