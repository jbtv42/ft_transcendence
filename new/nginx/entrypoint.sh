#!/bin/sh
set -e

CERT_DIR=/etc/nginx/certs
KEY_FILE="$CERT_DIR/selfsigned.key"
CRT_FILE="$CERT_DIR/selfsigned.crt"

if [ ! -f "$KEY_FILE" ] || [ ! -f "$CRT_FILE" ]; then
  echo "[nginx] No TLS cert found, generating self-signed certificate..."
  mkdir -p "$CERT_DIR"
  openssl req -x509 -nodes -days 365 \
    -newkey rsa:2048 \
    -keyout "$KEY_FILE" \
    -out "$CRT_FILE" \
    -subj "/C=FR/ST=IDF/L=Paris/O=PongDev/OU=Dev/CN=localhost"
fi

echo "[nginx] Starting nginx..."
exec nginx -g 'daemon off;'
