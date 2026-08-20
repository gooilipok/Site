<?php
/**
 * BauSquad — Email Sender via Direct Socket SMTP & Native mail() fallback
 * Полная защита от зависаний сокетов и 502 Bad Gateway таймаутов
 * Не требует composer/внешних пакетов, работает на любом PHP 7.4+ хостинге
 */
require_once __DIR__ . '/config.php';

function sendEmail($to, $subject, $htmlContent, $textContent = ''): array {
    $host = SMTP_HOST;
    $port = (int)SMTP_PORT;
    $user = SMTP_USER;
    $pass = SMTP_PASS;
    $from = SMTP_FROM;

    if (empty($user) || empty($pass)) {
        $headers  = "MIME-Version: 1.0\r\n";
        $headers .= "Content-type: text/html; charset=utf-8\r\n";
        $headers .= "From: {$from}\r\n";
        $headers .= "Reply-To: {$user}\r\n";
        $ok = @mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $htmlContent, $headers);
        return ['success' => $ok, 'method' => 'mail()'];
    }

    try {
        $scheme = ($port === 465) ? 'ssl://' : '';
        // 3 seconds timeout to guarantee no 502 gateway timeouts
        $socket = @fsockopen($scheme . $host, $port, $errno, $errstr, 3);
        if (!$socket) {
            error_log("[SMTP Socket Error]: {$host}:{$port} - {$errstr} ({$errno})");
            return ['success' => false, 'error' => "SMTP connect timeout: {$errstr}"];
        }

        @stream_set_timeout($socket, 3);

        $getResponse = function($sock) {
            $data = '';
            while ($str = fgets($sock, 515)) {
                $data .= $str;
                if (substr($str, 3, 1) === ' ') break;
            }
            return $data;
        };

        $sendCommand = function($sock, $cmd) use ($getResponse) {
            fputs($sock, $cmd . "\r\n");
            return $getResponse($sock);
        };

        $getResponse($socket); // banner
        $sendCommand($socket, "EHLO " . ($_SERVER['SERVER_NAME'] ?? 'bausquad.org'));

        // Auth
        $sendCommand($socket, "AUTH LOGIN");
        $sendCommand($socket, base64_encode($user));
        $res = $sendCommand($socket, base64_encode($pass));
        if (strpos($res, '235') === false) {
            @fclose($socket);
            return ['success' => false, 'error' => "SMTP auth rejected: {$res}"];
        }

        // Envelope
        $sendCommand($socket, "MAIL FROM: <{$user}>");
        $sendCommand($socket, "RCPT TO: <{$to}>");
        $sendCommand($socket, "DATA");

        // Message
        $msg  = "From: {$from}\r\n";
        $msg .= "To: {$to}\r\n";
        $msg .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
        $msg .= "MIME-Version: 1.0\r\n";
        $msg .= "Content-Type: text/html; charset=UTF-8\r\n";
        $msg .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
        $msg .= $htmlContent . "\r\n.\r\n";

        $res = $sendCommand($socket, $msg);
        $sendCommand($socket, "QUIT");
        @fclose($socket);

        return ['success' => true, 'response' => $res];
    } catch (\Throwable $e) {
        error_log("[SMTP Exception]: " . $e->getMessage());
        return ['success' => false, 'error' => $e->getMessage()];
    }
}
