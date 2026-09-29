#!/bin/sh
# Update auf der Synology: erst sichern, dann neuesten Stand holen und Container neu bauen.
# Aufruf: sudo sh deploy.sh   (git pull läuft als dein Benutzer, damit dein Deploy Key greift)
# Nur sichern, sonst nichts: sh deploy.sh --backup-only
# Nur Branch prüfen, sonst nichts: sh deploy.sh --check
# Ein Update ersetzt nur Code. Spielstände liegen in data/ (nicht im Repo, nicht im Image).
# Live und Vorschau sind zwei Klone desselben Repos. Welcher Klon das ist, steht in .env
# (PREVIEW_LABEL leer = Live, nur Branch main; PREVIEW_LABEL gesetzt = Vorschau, nur Branch preview).
set -e
cd "$(dirname "$0")"

# 0. Einstellungen dieses Klons lesen (ohne .env: Live, Port 8080)
if [ -f .env ]; then set -a; . ./.env; set +a; fi
PORT_HOST="${HOST_PORT:-8080}"
if [ -n "$PREVIEW_LABEL" ]; then WANT=preview; else WANT=main; fi

# 1. Branch prüfen: Live nur main, Vorschau nur preview. Sonst Abbruch, bevor irgendetwas passiert.
if [ "$1" != "--backup-only" ]; then
  HAVE=$(git symbolic-ref --short -q HEAD || echo "(kein Branch)")
  if [ "$HAVE" != "$WANT" ]; then
    echo "ABBRUCH: Dieser Klon ist für den Branch $WANT, ausgecheckt ist aber $HAVE." >&2
    echo "Nichts wurde geändert. Prüfe den Ordner und die Datei .env." >&2
    exit 1
  fi
  echo "Branch $HAVE passt zu diesem Klon ($([ "$WANT" = preview ] && echo Vorschau || echo Live))."
  [ "$1" = "--check" ] && exit 0
fi

# 2. Sicherung vor dem Update: data/backups/pre-deploy-JJJJMMTT-HHMM/
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

# 3. Neuen Code holen
if [ -n "$SUDO_USER" ]; then sudo -u "$SUDO_USER" git pull --ff-only; else git pull --ff-only; fi

# 4. Container neu bauen und starten
if docker compose version >/dev/null 2>&1; then DC="docker compose"; else DC="docker-compose"; fi
$DC up -d --build
sleep 2
echo "Test:"; wget -qO- "http://127.0.0.1:$PORT_HOST/api/health" || curl -s "http://127.0.0.1:$PORT_HOST/api/health"; echo
