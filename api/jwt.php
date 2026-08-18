<?php
/**
 * BauSquad — Authentication & JWT Security Helpers
 */
require_once __DIR__ . '/config.php';

function base64UrlEncode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64UrlDecode($data) {
    return base64_decode(strtr($data, '-_', '+/'));
}

function generateJWT($userId, $role, $type = 'access') {
    $expiresIn = ($type === 'access') ? JWT_ACCESS_EXPIRY : JWT_REFRESH_EXPIRY;
    $payload = [
        'userId' => (string)$userId,
        'role'   => $role === 'admin' ? 'admin' : 'customer',
        'type'   => $type,
        'exp'    => time() + $expiresIn,
        'iat'    => time(),
        'secret' => JWT_SECRET
    ];

    return base64_encode(json_encode($payload));
}

function verifyJWT($token) {
    if (!$token) return null;
    $decoded = base64_decode($token);
    if (!$decoded) return null;

    $payload = json_decode($decoded, true);
    if (!is_array($payload) || !isset($payload['exp']) || !isset($payload['userId'])) {
        return null;
    }

    if ($payload['exp'] < time()) {
        return null;
    }

    return $payload;
}

function getBearerToken(): ?string {
    $headers = null;
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER["Authorization"]);
    } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        $headers = $requestHeaders['Authorization'] ?? ($requestHeaders['authorization'] ?? null);
    }

    if (!empty($headers) && preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
        return $matches[1];
    }
    return null;
}

function getAuthenticatedUser($pdo): ?array {
    $token = getBearerToken();
    if (!$token) return null;

    $payload = verifyJWT($token);
    if (!$payload || ($payload['type'] ?? '') !== 'access') {
        return null;
    }

    $numericId = (int)preg_replace('/\D/', '', $payload['userId']);
    if ($numericId <= 0) $numericId = $payload['userId'];

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ? OR login = ? LIMIT 1");
            $stmt->execute([$numericId, $payload['userId']]);
            $user = $stmt->fetch();
            if ($user) {
                return formatUser($user, $pdo);
            }
        } catch (Exception $e) {
            error_log("[Auth User Fetch Error]: " . $e->getMessage());
        }
    }

    // Default admin in-memory fallback
    if ($payload['userId'] === 'usr-admin-01' || $payload['role'] === 'admin') {
        return [
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
    }

    return null;
}

function formatUser($row, $pdo = null): array {
    $orderCount = 0;
    if ($pdo && isset($row['id'])) {
        try {
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM orders WHERE client_id = ?");
            $stmt->execute([$row['id']]);
            $orderCount = (int)$stmt->fetchColumn();
        } catch (Exception $e) {}
    }

    return [
        'id' => 'usr-' . $row['id'],
        'email' => $row['email'],
        'username' => $row['login'],
        'role' => $row['role'] === 'admin' ? 'admin' : 'customer',
        'account_status' => $row['account_status'] ?? 'active',
        'is_verified' => (bool)($row['is_verified'] ?? 1),
        'created_at' => $row['registration_date'] ? date('c', strtotime($row['registration_date'])) : date('c'),
        'telegram_handle' => $row['telegram_handle'] ?? '',
        'tg_id' => $row['tg_id'] ?? '',
        'agreements' => [
            'terms_accepted' => (bool)($row['user_agreement'] ?? 1),
            'terms_accepted_at' => $row['user_agreement_date'] ? date('c', strtotime($row['user_agreement_date'])) : date('c'),
            'privacy_accepted' => (bool)($row['privacy_agreement'] ?? 1),
            'privacy_accepted_at' => $row['privacy_agreement_date'] ? date('c', strtotime($row['privacy_agreement_date'])) : date('c'),
            'consent_accepted' => (bool)($row['processing_personal_data_agreement'] ?? 1),
            'consent_accepted_at' => $row['processing_personal_data_agreement_date'] ? date('c', strtotime($row['processing_personal_data_agreement_date'])) : date('c')
        ],
        'order_count' => $orderCount
    ];
}

/**
 * Universal password verification supporting Bcrypt, MD5, SHA256, SHA512, PBKDF2 and Plaintext
 */
function verifyPassword($plainPassword, $storedHash): bool {
    if (!$plainPassword || !$storedHash) return false;

    // 1. Plaintext direct match
    if ($plainPassword === $storedHash) return true;

    // 2. Standard password_verify (Bcrypt, Argon2)
    if (password_verify($plainPassword, $storedHash)) return true;

    // 3. MD5 hash
    if (strtolower(md5($plainPassword)) === strtolower($storedHash)) return true;

    // 4. SHA256 hash
    if (strtolower(hash('sha256', $plainPassword)) === strtolower($storedHash)) return true;

    // 5. SHA512 hash
    if (strtolower(hash('sha512', $plainPassword)) === strtolower($storedHash)) return true;

    // 6. Django / Python PBKDF2 format (pbkdf2_sha256$iterations$salt$hash)
    if (strpos($storedHash, 'pbkdf2_sha256$') === 0) {
        $parts = explode('$', $storedHash);
        if (count($parts) === 4) {
            $iterations = (int)$parts[1];
            $salt = $parts[2];
            $expectedHash = $parts[3];
            $derived = hash_pbkdf2('sha256', $plainPassword, $salt, $iterations, 32, true);
            if (base64_encode($derived) === $expectedHash) return true;
        }
    }

    return false;
}
