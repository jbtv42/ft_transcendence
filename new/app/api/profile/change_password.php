<?php
require __DIR__ . '/../db.php';

session_bootstrap();

if (empty($_SESSION['user_id'])) {
    json_response(['error' => 'not authenticated'], 401);
}

$userId = (int)$_SESSION['user_id'];
$data   = read_json_body();

$current = isset($data['current_password']) ? trim($data['current_password']) : '';
$new     = isset($data['new_password'])     ? trim($data['new_password'])     : '';

if ($current === '' || $new === '') {
    json_response(['error' => 'current_password and new_password are required'], 400);
}

if (strlen($new) < 6) {
    json_response(['error' => 'new password too short (min 6 chars)'], 400);
}

$db = get_db();

$stmt = $db->prepare('SELECT password_hash FROM users WHERE id = :id');
$stmt->execute([':id' => $userId]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row || !password_verify($current, $row['password_hash'])) {
    json_response(['error' => 'current password is incorrect'], 401);
}

$newHash = password_hash($new, PASSWORD_DEFAULT);
$now     = (new DateTimeImmutable())->format(DateTime::ATOM);

$stmt = $db->prepare('UPDATE users SET password_hash = :hash, updated_at = :updated_at WHERE id = :id');
$stmt->execute([
    ':hash'       => $newHash,
    ':updated_at' => $now,
    ':id'         => $userId,
]);

json_response(['ok' => true]);
