#!/bin/sh
set -e

DB_PATH="${DB_PATH:-/var/www/sqlite/transcendence.sqlite}"
DB_DIR="$(dirname "$DB_PATH")"

echo "[entrypoint] Using DB path: $DB_PATH"

mkdir -p "$DB_DIR"
chown -R www-data:www-data "$DB_DIR"

if [ ! -f "$DB_PATH" ]; then
  echo "[entrypoint] DB does not exist, running db_init.php..."
  php /var/www/html/db_init.php || {
    echo "[entrypoint] db_init.php failed"
    exit 1
  }
else
  echo "[entrypoint] DB already exists, skipping init."
fi

exec php-fpm
