# Torjäger-Liga

Lernspiel für Emil (Mathe und Deutsch als Fußballspiele). Läuft auf der Synology **energizer**, erreichbar nur über Tailscale per HTTPS.

Plan und Entscheidungen: Vault, `Projects/Torjaeger/specs/Torjaeger-Plan.md` (Index `Projects/Torjaeger/Torjaeger.md`). Repo: https://github.com/1984MaHa/torjaeger

## Aufbau
- `app/` Web-App (später: Home-Bildschirm-App mit Offline-Betrieb)
- `server/server.js` liefert die App aus und speichert den Spielstand (`/api/state`), keine Zusatzpakete
- `data/` Spielstand und Tagessicherungen, **nicht im Repo**

## Lokal testen
```
node server/server.js
# http://localhost:8080
```

## Einrichtung Synology (einmalig)
1. Paketzentrum: **Container Manager**, **Tailscale**, **Git Server** (liefert den `git`-Befehl).
2. Tailscale-Admin-Konsole: **MagicDNS** und **HTTPS Certificates** aktivieren.
3. DSM: SSH aktivieren. Per SSH anmelden.
4. Deploy Key: `ssh-keygen -t ed25519 -f ~/.ssh/torjaeger -N ""`, den Inhalt von `~/.ssh/torjaeger.pub` bei GitHub unter Repo → Settings → Deploy keys eintragen (nur Lesen). In `~/.ssh/config`:
   ```
   Host github-torjaeger
     HostName github.com
     User git
     IdentityFile ~/.ssh/torjaeger
   ```
5. Klonen: `cd /volume1/docker && git clone git@github-torjaeger:1984MaHa/torjaeger.git torjaeger`
6. Starten: `cd /volume1/docker/torjaeger && sudo sh deploy.sh` (oder im Container Manager als Projekt mit diesem Ordner)
7. HTTPS: `sudo /var/packages/Tailscale/target/bin/tailscale serve --bg http://127.0.0.1:8080`
   Adresse anzeigen: `sudo /var/packages/Tailscale/target/bin/tailscale serve status`
8. Hyper Backup: Ordner `/volume1/docker/torjaeger/data` täglich sichern.

## Update
Per SSH: `cd /volume1/docker/torjaeger && sudo sh deploy.sh`

## Abnahme Phase 0
- `https://energizer.<tailnet>.ts.net` öffnet die Testseite auf iPad und iPhone, ohne Zertifikatswarnung.
- „Zähler +1 speichern“ auf dem iPad, dann auf dem iPhone neu laden: gleicher Wert.
