#!/bin/sh
# Update auf der Synology: erst sichern, dann neuesten Stand holen und Container neu bauen.
# Aufruf: sudo sh deploy.sh   (git pull läuft als dein Benutzer, damit dein Deploy Key greift)
# Nur sichern, sonst nichts: sh deploy.sh --backup-only
# Ein Update ersetzt nur Code. Spielstände liegen in data/ (nicht im Repo, nicht im Image).
set -e
cd "$(dirname "$0")"

# 1. Sicherung vor dem Update: data/backups/pre-deploy-JJJJMMTT-HHMM/
mkdir -p data
STAMP=$(date +%Y%m%d-%H%M)
DEST="data/backups/pre-deploy-$STAMP"
mkdir -p "$DEST"
[ -d data/profiles ] && cp -R data/profiles "$DEST/profiles"
[ -f data/settings.json ] && cp data/settings.json "$DEST/settings.json"
[ -f data/state.json ] && cp data/state.json "$DEST/state.json"
echo "Sicherung angelegt: $DEST"
# Nur die 20 neuesten Sicherungen vor Updates behalten.
ls -d data/backups/pre-deploy-* 2>/dev/null | sort -r | tail -n +21 | while read -r old; do rm -rf "$old"; done
[ "$1" = "--backup-only" ] && exit 0

# 2. Neuen Code holen
if [ -n "$SUDO_USER" ]; then sudo -u "$SUDO_USER" git pull --ff-only; else git pull --ff-only; fi

# 3. Container neu bauen und starten
if docker compose version >/dev/null 2>&1; then DC="docker compose"; else DC="docker-compose"; fi
$DC up -d --build
sleep 2
echo "Test:"; wget -qO- http://127.0.0.1:8080/api/health || curl -s http://127.0.0.1:8080/api/health; echo
