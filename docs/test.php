<?php
header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    'status' => 'ok',
    'file' => 'docs/test.php (root level)',
    'php_version' => PHP_VERSION,
    'sapi' => php_sapi_name(),
    'time' => date('Y-m-d H:i:s'),
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? '',
    'script' => $_SERVER['SCRIPT_FILENAME'] ?? ''
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
