# Torjäger-Liga

Lernspiel für Emil (Mathe und Deutsch als Fußballspiele, Klasse 2 bis 4: Trainingscamp, Kreisliga, Bezirksliga; in der Kreisliga zusätzlich Englisch und Sachkunde). Aktuelle Version 1.5.1. Home-Bildschirm-Web-App für iPad und iPhone, offline spielbar, gleicht sich automatisch mit dem Server auf der Synology **energizer** ab. Erreichbar nur über Tailscale per HTTPS.

Plan und Entscheidungen: Vault, `Projects/Torjaeger/specs/Torjaeger-Plan.md` (Index `Projects/Torjaeger/Torjaeger.md`). Beschreibung des gebauten Stands: [SPEC.md](SPEC.md). Änderungen: [CHANGELOG.md](CHANGELOG.md). Repo: https://github.com/1984MaHa/torjaeger

## Aufbau
- `app/` die Web-App (ES-Module ohne Build-Schritt, keine externen Ressourcen)
  - `index.html`, `manifest.webmanifest`, `sw.js` (Service Worker), `css/`, `fonts/` (Andika, Lilita One, OFL), `icons/`
  - `js/` Module: `app.js` (Steuerung), `views.js` (Darstellung), `rules.js` (Spielregeln), `generators.js` (Aufgaben), `model.js` (Datenmodell, Migration), `merge.js` (Zusammenführen), `sync.js` (Abgleich), `store.js` (IndexedDB), `pin.js`, `content.js`, `svg.js`, `audio.js`, `util.js`, `version.js`, `check.js` (Päckchen, Kontroll-Pfiff, Probe), `stickers.js` (24 Sticker mit Jubelruf), `content-en.js` und `content-su.js` (Wörter und Aufgaben Englisch und Sachkunde), `tasks.js` (Aufgaben daraus), `inputs.js` (Zuordnen, Bild wählen, Sortieren, Reihenfolge), `speech.js` (Vorlesen mit Gerätestimme), `icons.js` (Fach-Symbole)
  - Eltern-Bereich: `admin.js` (Ansichten), `adminapi.js` (Aufrufe an den Server)
  - Spieler und Trainerteam: `avatar.js` (Vorlagen, Farbpaletten, Vereinsfarben-Vorschläge, Prüfung), `figures.js` (Umfärben der Bild-Vorlagen, Rückenfeld), `figdata.js` (Maße der Bilder, erzeugt von `tools/prepare-figures.mjs`), `avatardraw.js` (Figuren und Torszene als SVG mit eingebettetem Bild), `avatarui.js` („Mein Spieler“ und Trainerfarben), `coach.js` (Trainer-Hilfe)
  - `img/` die freigestellten Figuren-Bilder (je Figur ein Grundbild und eine Umfärb-Ebene)
- `server/server.js` liefert die App aus und speichert die Stände (Node 20, keine Zusatzpakete), `server/admin.js` die Admin-Aktionen der Eltern (PIN-Prüfung, Papierkorb, Zurücksetzen, Wiederherstellen, Geräteliste)
- `test/` Tests mit `node --test`, `test/fixtures/` Stände für die Migrationen (Prototyp-Format, Format 1.0.0 und 1.1.5)
- `tools/` Hilfsskripte (Icons erzeugen, Schriften laden, `inhalte-liste.mjs` erzeugt `docs/Inhalte-Englisch-Sachkunde.md`, `prepare-figures.mjs` bereitet die Figuren-Bilder auf, siehe Abschnitt „Figuren-Vorlagen“)
- `assets-src/` die Original-Bilder der Figuren (Quelle für `tools/prepare-figures.mjs`, nicht im Docker-Image)
- `docs/Inhalte-Englisch-Sachkunde.md` lesbare Liste aller Wörter, Bilder und Sachkunde-Aufgaben zum Prüfen (nach Änderungen an `content-en.js` oder `content-su.js` mit `node tools/inhalte-liste.mjs` neu erzeugen)
- `prototype/` der ursprüngliche Prototyp (Claude-Artifact), nur zur Referenz
- `data/` Spielstände und Sicherungen, **nicht im Repo, nicht im Image**

## Lokal testen
```
node server/server.js
```
Dann http://localhost:8080 öffnen. Daten liegen lokal in `data/` (mit `DATA_DIR=...` und `PORT=...` änderbar).

Vorschau lokal daneben starten (eigene Daten, Band VORSCHAU):
```
PORT=8081 DATA_DIR=data/preview PREVIEW_LABEL=VORSCHAU node server/server.js
```
Tests (Server-API, Admin, Konflikte, Zusammenführen, Migration, Avatar und Trainer, zwei Geräte, Ende zu Ende mit der echten App, deploy.sh):
```
node --test
```

## Datenablage
- `data/profiles/<id>.json` ein Stand je Konto
- `data/settings.json` globale Einstellungen (Eltern-PIN als Hash)
- `data/backups/` Tageskopien der letzten 30 Tage (`profile-<id>-<Datum>.json`, `settings-<Datum>.json`) und die Sicherungen vor jedem Update (`pre-deploy-<JJJJMMTT-HHMM>/`, die letzten 20)
- `data/backups/manual/` Sicherungen, die der Server vor Zurücksetzen und Wiederherstellen anlegt (die letzten 100)
- `data/trash/` gelöschte Konten (Papierkorb, nie hart gelöscht, Zurückholen im Eltern-Bereich)
- `data/devices.json` Geräteliste (Kennung, Name, zuletzt gesehen)
- Auf dem Gerät: IndexedDB `torjaeger` im Browser (Stand, Kontenliste, Geräte-ID)

Ein Update ersetzt nur Code. Spielstände liegen nie im Repo und nie im Container-Image. Jeder Stand trägt eine Schemaversion, alte Stände werden beim Laden migriert und nie verworfen.

### Sicherung zurückspielen
Am einfachsten im Eltern-Bereich (Taste „Eltern“ auf „Wer spielt?“, Reiter „Sicherungen und System“): Der Server sichert den aktuellen Stand, spielt die Sicherung ein und alle Geräte übernehmen sie. Von Hand (zum Beispiel für die Einstellungen mit der PIN) geht es so: Container stoppen, Datei aus `data/backups/` nach `data/profiles/<id>.json` bzw. `data/settings.json` kopieren, Container starten. Die App holt sich beim nächsten Abgleich den Stand vom Server. Hinweis: Ein Gerät mit neueren Änderungen führt diese wieder mit dem zurückgespielten Stand zusammen (Zähler steigen nie zurück). Soll wirklich zurückgesetzt werden, in der Trainerbank „Spielstand zurücksetzen“ nutzen.

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
- `node tools/prepare-figures.mjs` bereitet die Figuren-Bilder auf (Abschnitt „Figuren-Vorlagen“).
- `node tools/fetch-fonts.js` lädt die Schriften und OFL-Texte nach `app/fonts/` (nur nötig, wenn der Ordner leer ist).

## Figuren-Vorlagen (Bilder aufbereiten)
Die Figuren sind Bilder von Marco (Emil vorn und hinten, Trainerteam). Sie liegen als Original in `assets-src/` und werden einmalig am Rechner aufbereitet. Die App selbst braucht dafür nichts (keine Bibliotheken, nur fertige PNG in `app/img/`).
1. **Aufruf:** `node tools/prepare-figures.mjs` (alle Quellen) oder `node tools/prepare-figures.mjs emil`. Mit `--debug` entstehen Prüfbilder in `.work/` (Schachbrett mit drei Farbvarianten, `dbg-bust.png` mit den runden Ausschnitten). Unter Windows wandelt das Skript das JPG selbst in ein PNG (`tools/jpg2png.ps1`, .NET), sonst das PNG als `.work/<quelle>.png` bereitstellen (zum Beispiel mit ImageMagick). Node reicht, Python ist nicht nötig.
2. **Was passiert:** `prepare-figures.mjs` findet die Figuren (Hintergrund vom Rand wegfluten, die größten Reste sind die Figuren), schneidet jede frei (weiche Kante aus der Linienfarbe), sucht die umfärbbaren Bereiche nach den Regeln in `tools/figures.config.mjs` und schreibt je Figur zwei Bilder: `fig-<id>.png` (Grundbild mit Löchern an den umfärbbaren Stellen) und `fig-<id>-layer.png` (Umfärb-Ebene: R = Schattierung, 128 = Mitte; G = Nummer des Bereichs; B = Deckung; A = 255 im Bereich). Dazu `app/js/figdata.js` (Maße, Bereiche, Fenster des Brustbildes, Rückenfeld). Hilfsfunktionen stehen in `tools/fig-lib.mjs`, PNG lesen und schreiben in `tools/png.mjs`.
3. **Neue Vorlage ergänzen** (zum Beispiel für die Nichte):
   - Original nach `assets-src/`, in `tools/figures.config.mjs` eine Quelle mit `bgTest` (welche Punkte Hintergrund sind) und den Figuren von links nach rechts eintragen. Je Bereich eine Regel (`mask`): Farbtest, Suchfenster `box`, Startpunkt `flood`, bei schwarzer Kleidung `erode`, damit die Kontur im Grundbild bleibt. `holes` gibt eingeschlossene Hintergrundstellen frei (zum Beispiel zwischen Arm und Körper). Markenlogos werden übermalt: Fläche in den Bereich aufnehmen und als `flat` markieren (Schattierung 128 = reine Farbe). `bust` (Fenster des Brustbildes), `field` (Rückenfeld) und `chest` (Brustnummer) angeben.
   - Mit `--debug` prüfen, dann ohne `--debug` laufen lassen. Die neuen Bilder stehen in `app/img/` und müssen in `FILES` von `app/sw.js` (ein Test prüft es).
   - In `app/js/avatar.js` einen Eintrag in `KID_TEMPLATES` anlegen (id, name, Bild vorn und hinten, Bereiche, Vorgabefarben). Die Auswahl erscheint in „Mein Spieler“ von selbst, sobald es mehr als eine Vorlage gibt. Trainer haben feste Bilder je Figur (`TRAINER_FIG` in `avatardraw.js`).
4. **Umfärben in der App:** `figures.js` färbt die Ebene je Farbkombination auf einer Zeichenfläche ein (Schattierung mal Farbe, hellere Stellen mischen Weiß bei), legt das Grundbild darüber und merkt sich das Ergebnis (höchstens 80 Bilder, ältere werden freigegeben). Name und Nummer liegen als SVG-Text darüber (`backLayout`).
5. **Größe im Blick:** alle Bilder zusammen etwa 0,9 MB (ein Test begrenzt sie auf 1,6 MB, sie liegen im Offline-Cache).

## Eltern-Bereich, Avatar, Trainer
- **Eltern:** auf „Wer spielt?“ die Taste „Eltern“, PIN eingeben. Konten, Lernstand, Einstellungen, Sicherungen und System. Der Server prüft die PIN bei Löschen, Wiederherstellen, Zurücksetzen und PIN ändern selbst (falsche PIN: nichts passiert, nach 5 Fehlversuchen eine Minute Pause).
- **Mein Spieler:** Beim ersten Öffnen eines Kontos ohne eigenen Spieler erscheint die Seite „Dein Spieler“ (überspringbar), später in der Kabine die Taste „Mein Spieler“. Die Figur ist eine feste Vorlage (vorerst „Emil“). Einstellbar sind Vereinsfarben (Vorschläge) oder die Farben von Trikot, Streifen, Hose und Stutzen, die Rückennummer, der eigene Name auf dem Rücken und der Name der Mannschaft (steht in „Wer spielt?“, in der Kabine und auf der Anzeigetafel).
- **Trainer und Trainerin:** In jeder Aufgabe die Taste „Hilfe vom Trainer“ (Tipp vom Trainer, dann Erklärung von der Trainerin). Im Eltern-Bereich unter Einstellungen ändert man Name und Kleidungsfarben beider (Polo, Hose, Stutzen). Vorgaben „Trainer“ und „Trainerin“.

## Abnahme Version 1.1.0 (in der Vorschau)
1. `node --test` grün.
2. Zwei Instanzen lokal: Live `node server/server.js` (Port 8080) und Vorschau (Befehl oben, Port 8081): nur die Vorschau zeigt das orange Band, beide haben getrennte Daten.
3. Vorschau am iPad: neues Konto, Baukasten, eine Runde mit Hilfe (Tipp, Erklärung), Torszene mit Treffer und Fehlschuss, Eltern-Bereich in allen vier Reitern.
4. Emils Stand (Format 1.0.0) migriert ohne Verlust: siehe `test/schema2.test.mjs`, in der Vorschau nur mit einer Kopie von `data/` prüfen, nie mit dem Live-Ordner.

## Abnahme Phase 1
- `node --test` grün.
- `node server/server.js`, http://localhost:8080: Konto anlegen, eine Runde spielen, Seite neu laden: Punkte und Stand unverändert.
- Server stoppen: App lädt weiter und ist spielbar. Server starten: Abgleich ohne Zutun (Trainerbank, „Zuletzt abgeglichen“).
- Zwei Browser-Profile mit demselben Konto, beide offline spielen, dann online: nichts geht verloren (Test `test/sync.test.mjs`).
- `deploy.sh` legt vor dem Pull `data/backups/pre-deploy-...` an (Test `test/app.test.mjs`).
