<?php
require __DIR__ . '/../db.php';

session_bootstrap();

if (empty($_SESSION['user_id'])) {
    json_response(['error' => 'not authenticated'], 401);
}

$userId = (int)$_SESSION['user_id'];

if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
    json_response(['error' => 'no file uploaded'], 400);
}

$file = $_FILES['avatar'];

$maxSize = 2 * 1024 * 1024;
if ($file['size'] > $maxSize) {
    json_response(['error' => 'file too large (max 2MB)'], 400);
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime  = $finfo->file($file['tmp_name']);

$allowed = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/gif'  => 'gif',
];

if (!isset($allowed[$mime])) {
    json_response(['error' => 'unsupported file type'], 400);
}

$ext = $allowed[$mime];

$baseDir = '/data/avatars';
if (!is_dir($baseDir)) {
    mkdir($baseDir, 0777, true);
}

$filename = 'user_' . $userId . '.' . $ext;
$targetPath = $baseDir . '/' . $filename;

if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    json_response(['error' => 'failed to save file'], 500);
}

$avatarUrl = '/avatars/' . $filename;

try {
    $db = get_db();
    $stmt = $db->prepare('UPDATE users SET avatar_path = :path, updated_at = :updated_at WHERE id = :id');
    $now = (new DateTimeImmutable())->format(DateTime::ATOM);
    $stmt->execute([
        ':path'       => $avatarUrl,
        ':updated_at' => $now,
        ':id'         => $userId,
    ]);
} catch (PDOException $e) {
    error_log('PDO ERROR in upload_avatar: ' . $e->getMessage());
    json_response(['error' => 'database error'], 500);
}

json_response([
    'ok'         => true,
    'avatar_url' => $avatarUrl,
]);
