<?php
require __DIR__ . '/db.php';

session_bootstrap();

session_unset();
session_destroy();

json_response(['ok' => true]);
