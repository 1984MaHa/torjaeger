# Torjäger-Liga

Lernspiel für Emil (Mathe und Deutsch als Fußballspiele, Klasse 2 bis 4). Home-Bildschirm-Web-App für iPad und iPhone, offline spielbar, gleicht sich automatisch mit dem Server auf der Synology **energizer** ab. Erreichbar nur über Tailscale per HTTPS.

Plan und Entscheidungen: Vault, `Projects/Torjaeger/specs/Torjaeger-Plan.md` (Index `Projects/Torjaeger/Torjaeger.md`). Beschreibung des gebauten Stands: [SPEC.md](SPEC.md). Änderungen: [CHANGELOG.md](CHANGELOG.md). Repo: https://github.com/1984MaHa/torjaeger

## Aufbau
- `app/` die Web-App (ES-Module ohne Build-Schritt, keine externen Ressourcen)
  - `index.html`, `manifest.webmanifest`, `sw.js` (Service Worker), `css/`, `fonts/` (Andika, Lilita One, OFL), `icons/`
  - `js/` Module: `app.js` (Steuerung), `views.js` (Darstellung), `rules.js` (Spielregeln), `generators.js` (Aufgaben), `model.js` (Datenmodell, Migration), `merge.js` (Zusammenführen), `sync.js` (Abgleich), `store.js` (IndexedDB), `pin.js`, `content.js`, `svg.js`, `audio.js`, `util.js`, `version.js`
- `server/server.js` liefert die App aus und speichert die Stände (Node 20, keine Zusatzpakete)
- `test/` Tests mit `node --test`, `test/fixtures/` Stand im Prototyp-Format für die Migration
- `tools/` einmalige Hilfsskripte (Icons erzeugen, Schriften laden)
- `prototype/` der ursprüngliche Prototyp (Claude-Artifact), nur zur Referenz
- `data/` Spielstände und Sicherungen, **nicht im Repo, nicht im Image**

## Lokal testen
```
node server/server.js
```
Dann http://localhost:8080 öffnen. Daten liegen lokal in `data/` (mit `DATA_DIR=...` und `PORT=...` änderbar).

Tests (Server-API, Konflikte, Zusammenführen, Migration, zwei Geräte, deploy.sh):
```
node --test
```

## Datenablage
- `data/profiles/<id>.json` ein Stand je Konto
- `data/settings.json` globale Einstellungen (Eltern-PIN als Hash)
- `data/backups/` Tageskopien der letzten 30 Tage (`profile-<id>-<Datum>.json`, `settings-<Datum>.json`) und die Sicherungen vor jedem Update (`pre-deploy-<JJJJMMTT-HHMM>/`, die letzten 20)
- Auf dem Gerät: IndexedDB `torjaeger` im Browser (Stand, Kontenliste, Geräte-ID)

Ein Update ersetzt nur Code. Spielstände liegen nie im Repo und nie im Container-Image. Jeder Stand trägt eine Schemaversion, alte Stände werden beim Laden migriert und nie verworfen.

### Sicherung zurückspielen
Container stoppen, Datei aus `data/backups/` nach `data/profiles/<id>.json` bzw. `data/settings.json` kopieren, Container starten. Die App holt sich beim nächsten Abgleich den Stand vom Server. Hinweis: Ein Gerät mit neueren Änderungen führt diese wieder mit dem zurückgespielten Stand zusammen (Zähler steigen nie zurück). Soll wirklich zurückgesetzt werden, in der Trainerbank „Spielstand zurücksetzen“ nutzen.

## Einrichtung Synology (einmalig, erledigt)
Stand: energizer, DS918+, DSM 7.1.1, Paket **Docker** (docker-compose v1, kein Container Manager), Git Server, Tailscale.
1. Paketzentrum: **Docker**, **Tailscale**, **Git Server** (liefert den `git`-Befehl).
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
6. Starten: `cd /volume1/docker/torjaeger && sudo sh deploy.sh`
7. HTTPS: `sudo /var/packages/Tailscale/target/bin/tailscale serve --bg http://127.0.0.1:8080`
   Adresse anzeigen: `sudo /var/packages/Tailscale/target/bin/tailscale serve status`
8. Hyper Backup auf `/volume1/docker/torjaeger/data` ist bewusst noch nicht eingerichtet (Entscheidung Marco). Es gibt nur die Kopien in `data/backups` auf derselben Platte.

## Vorschau (zweiter Klon, Branch preview)
Neues wird zuerst in der Vorschau getestet, dann erst live. Beide laufen aus demselben Repo, je in einem eigenen Ordner mit eigenem Container, eigenem Port und eigenen Daten:

| | Live | Vorschau |
|---|---|---|
| Ordner auf energizer | `/volume1/docker/torjaeger` | `/volume1/docker/torjaeger-preview` |
| Branch | `main` | `preview` |
| Container | `torjaeger-liga` | `torjaeger-liga-preview` |
| Port lokal | `127.0.0.1:8080` | `127.0.0.1:8081` |
| Adresse (Tailscale) | https://energizer.tailfc5923.ts.net | https://energizer.tailfc5923.ts.net:8443 |
| Daten | `torjaeger/data/` | `torjaeger-preview/data/` (leer, eigene PIN, eigene Konten) |

Container-Name, Port und Kennung stehen in der Datei `.env` des jeweiligen Klons (nicht im Repo, Vorlagen `.env.example` für Live und `.env.preview.example` für die Vorschau). Der Live-Klon braucht keine `.env`: ohne sie gelten die Live-Werte. Ist `PREVIEW_LABEL` gesetzt, zeigt die App oben das Band **VORSCHAU** (der Server meldet die Kennung in `/api/config` und `/api/health`). Der Port 8443 hat einen eigenen Browser-Speicher, nichts vermischt sich mit Live.

`deploy.sh` prüft zuerst den Branch: Live nur `main`, Vorschau nur `preview`. Passt er nicht, bricht das Skript ab, bevor etwas gesichert oder geändert wird (`sh deploy.sh --check` prüft nur das).

### Vorschau einrichten (einmalig, Schritt für Schritt)
Voraussetzung: Der Branch `preview` ist auf GitHub (am PC: `git push -u origin preview`).
1. Per SSH auf energizer anmelden.
2. In den Docker-Ordner wechseln:
```
cd /volume1/docker
```
3. Den Branch preview in einen neuen Ordner klonen:
```
git clone -b preview git@github-torjaeger:1984MaHa/torjaeger.git torjaeger-preview
```
4. In den neuen Ordner wechseln:
```
cd /volume1/docker/torjaeger-preview
```
5. Die Vorlage für die Vorschau als `.env` kopieren:
```
cp .env.preview.example .env
```
6. Kontrollieren, dass dort Port 8081 und `PREVIEW_LABEL=VORSCHAU` stehen:
```
cat .env
```
7. Branch prüfen (erwartet: `Branch preview passt zu diesem Klon (Vorschau).`):
```
sudo sh deploy.sh --check
```
8. Bauen und starten:
```
sudo sh deploy.sh
```
9. Testen (erwartet: `"preview":"VORSCHAU"` in der Antwort):
```
wget -qO- http://127.0.0.1:8081/api/health
```
10. HTTPS über Tailscale auf Port 8443 freigeben:
```
sudo /var/packages/Tailscale/target/bin/tailscale serve --bg --https=8443 http://127.0.0.1:8081
```
11. Kontrollieren, dass Live (443) und Vorschau (8443) beide aufgeführt sind:
```
sudo /var/packages/Tailscale/target/bin/tailscale serve status
```
12. Am iPad in Safari https://energizer.tailfc5923.ts.net:8443 öffnen. Oben steht das orange Band **VORSCHAU**. Die Vorschau ist leer: eigenes Konto und eigene PIN anlegen, Emils Live-Konto bleibt unberührt.

Später Vorschau aktualisieren (nach neuen Commits auf `preview`):
```
cd /volume1/docker/torjaeger-preview && sudo sh deploy.sh
```
Live wird erst aktualisiert, wenn `preview` nach `main` gemerged und gepusht ist: dann im Live-Ordner `sudo sh deploy.sh` (Abschnitt Update).

## Update
Per SSH auf energizer:
```
cd /volume1/docker/torjaeger && sudo sh deploy.sh
```
Das Skript sichert zuerst `data/` nach `data/backups/pre-deploy-<JJJJMMTT-HHMM>/`, holt dann den neuen Code (`git pull`) und baut den Container neu. Nur sichern (ohne Update): `sh deploy.sh --backup-only`.

Beim Auslieferen einer neuen App-Version die Version in **beiden** Dateien erhöhen: `app/js/version.js` und `VERSION` in `app/sw.js` (ein Test prüft, dass sie gleich sind). Geräte laden die neue Version beim nächsten Start. Die Trainerbank zeigt zusätzlich einen Hinweis „Jetzt laden“. Der Spielstand bleibt dabei erhalten.

## Auf dem iPad und iPhone
1. Tailscale-App an, im selben Tailnet angemeldet.
2. Safari: https://energizer.tailfc5923.ts.net öffnen, Teilen, „Zum Home-Bildschirm“.
3. Beim ersten Start ein Konto anlegen (Eltern-PIN festlegen). Weitere Geräte zeigen die Konten nach dem ersten Abgleich an.

## Hilfsskripte
- `node tools/make-icons.js` erzeugt die Icons in `app/icons/` neu.
- `node tools/fetch-fonts.js` lädt die Schriften und OFL-Texte nach `app/fonts/` (nur nötig, wenn der Ordner leer ist).

## Abnahme Phase 1
- `node --test` grün.
- `node server/server.js`, http://localhost:8080: Konto anlegen, eine Runde spielen, Seite neu laden: Punkte und Stand unverändert.
- Server stoppen: App lädt weiter und ist spielbar. Server starten: Abgleich ohne Zutun (Trainerbank, „Zuletzt abgeglichen“).
- Zwei Browser-Profile mit demselben Konto, beide offline spielen, dann online: nichts geht verloren (Test `test/sync.test.mjs`).
- `deploy.sh` legt vor dem Pull `data/backups/pre-deploy-...` an (Test `test/app.test.mjs`).
