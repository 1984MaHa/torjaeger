#!/bin/sh
# Update auf der Synology: neuesten Stand holen und Container neu bauen.
# Aufruf: sudo sh deploy.sh   (git pull läuft als dein Benutzer, damit dein Deploy Key greift)
set -e
cd "$(dirname "$0")"
if [ -n "$SUDO_USER" ]; then sudo -u "$SUDO_USER" git pull --ff-only; else git pull --ff-only; fi
mkdir -p data
if docker compose version >/dev/null 2>&1; then DC="docker compose"; else DC="docker-compose"; fi
$DC up -d --build
sleep 2
echo "Test:"; wget -qO- http://127.0.0.1:8080/api/health || curl -s http://127.0.0.1:8080/api/health; echo
