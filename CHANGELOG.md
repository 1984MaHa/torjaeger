# Änderungen

## 1.1.4
- Mehr Vielfalt bei den Avataren: **Kopfform** (5), **Augenform** (3), **Augenbrauen** (3), **Nase** (3), **Sommersprossen**, **Brille** (Rund, Eckig) und **Statur** (Schlank, Normal, Kräftig). Frisuren mit mehr Haarsträhnen. Gespeicherte Avatare sehen unverändert aus.
- Server: Das atomare Schreiben wiederholt das Umbenennen kurz bei EPERM, EBUSY oder EACCES (kann unter Windows an Virenscannern scheitern, ein Test war dadurch gelegentlich rot).
- Test: Jede Taste im Baukasten und im Eltern-Bereich braucht eine Verdrahtung in app.js (jetzt auch für Attribute, die nur als Name übergeben werden).
- Version 1.1.4.

## 1.1.3
- Baukasten so erweitert, dass der Junge mindestens wie auf dem Foto aussehen kann: Frisur **Fransen** (Junge und Mädchen), **Augenfarbe** (Braun, Haselnuss, Blau, Grün, Grau), **Trikotmuster** (Einfarbig, Schulterstreifen, Querstreifen, Brustband), **Kragen** (V-Ausschnitt, Rundkragen), eigene **Stutzenfarbe** (schwarze Stutzen zu blauem Trikot), **Gesicht** (Lächeln, Breites Grinsen).
- Neue Vorlagen „Torjäger“ (Junge, nach dem Foto) und „Funke“ (Mädchen). Alte Avatare bleiben unverändert (Stutzen wie das Trikot, braune Augen, kein Muster).
- Version 1.1.3.

## 1.1.2
- Figuren realistischer: eiförmiger Kopf mit Wangen und Kinn statt Kreis, Kopf im Verhältnis kleiner, mandelförmige Augen, Nase, Lippen, Ohren, Hände mit Daumen, leichte Taille. Gilt auch für Trainer und Trainerin.
- Frisuren: neu **Ohne Haare** (Junge und Mädchen).
- Kopfbedeckungen mit eigener Farbe: Cap, Cap verkehrt herum, Mütze, Stirnband, Bandana (Vorder- und Rückansicht).
- Version 1.1.2.

## 1.1.1
Nur die Versionsnummer ist angehoben (App, Service Worker, Server, package.json). Ohne neue Nummer übernehmen Geräte geänderte Dateien nicht sicher aus dem Cache. Regel: Jede Auslieferung bekommt eine neue Nummer, auch für die Vorschau.

## 1.1.0 (Vorschau, Eltern-Bereich, Avatar)
Schemaversion 2. Ein bestehender Stand im Format 1.0.0 wird beim ersten Start ohne Verlust migriert.

### Vorschau
- Zweiter Klon auf der NAS aus demselben Repo (Branch `preview`, Port 8081, eigener Container und eigene Daten), erreichbar über Tailscale auf Port 8443. Orange Band **VORSCHAU** oben in der App (Kennung vom Server).
- `docker-compose.yml` liest Container-Name, Port und Kennung aus `.env` (Vorlagen `.env.example`, `.env.preview.example`), läuft mit docker-compose v1. Ohne `.env` bleibt alles wie in 1.0.0.
- `deploy.sh` prüft den Branch (Live nur `main`, Vorschau nur `preview`) und bricht sonst vor jeder Änderung ab. Neu: `--check`.
- Server: `/api/config`, Kennung und Serverversion in `/api/health`.

### Eltern-Bereich
- Taste **Eltern** auf „Wer spielt?“ (mit Eltern-PIN). Vier Bereiche:
  - Konten: anlegen, umbenennen, zurücksetzen, löschen (Papierkorb, nie hart gelöscht), Ligen freigeben und sperren, Probe-Kontingent.
  - Lernstand: Trefferquote je Thema (letzte 10 und gesamt), letzte Spiele mit Datum, Liga, Modus, Ergebnis und Dauer, Trainingstage, genutzte Tipps.
  - Einstellungen: Eltern-PIN ändern (alte PIN nötig), je Konto Ton, Aufgaben pro Runde (6, 8, 10), Schnupper-Regeln, Tipp-Zeit; Trainer (Name, Aussehen).
  - Sicherungen und System: Liste der Sicherungen auf der NAS mit Datum und Größe, Wiederherstellen je Konto (vorher Sicherung des aktuellen Stands), Geräteliste mit änderbarem Namen, App-, Server- und Schemaversion.
- Der Server prüft die PIN bei jeder heiklen Aktion (Löschen, Wiederherstellen, Zurücksetzen, PIN ändern) selbst, nach 5 falschen Versuchen eine Minute Pause. Neue Routen `/api/admin/*`, siehe SPEC.md.
- Gelöschte Konten liegen in `data/trash/`, Zurücksetzen und Wiederherstellen sichern vorher nach `data/backups/manual/`. Andere Geräte entfernen ein gelöschtes Konto (Antwort 410).
- Geräteliste im Server (`data/devices.json`, Header `X-Device`).
- Spiele speichern ihre Dauer.

### Avatar und Trainer
- Avatar je Konto: Der Baukasten beginnt mit der Wahl **Junge oder Mädchen**, danach je 8 passende Frisuren, 4 Vorlagen, Haar-, Haut-, Trikot-, Hosen- und Schuhfarbe, Rückennummer, Name auf dem Trikot, Mannschaftsname und Vereinsfarben. Figuren im Comic-Stil mit Kontur, Schattierung und Glanzlichtern (Gesicht mit Augen, Brauen, Mund). Erscheint auf der Kachel, in der Kabine und in der Torszene. Beim ersten Öffnen eines Kontos ohne Avatar wird der Baukasten angeboten (überspringbar).
- Torszene neu: Stadion mit Publikum, Tor mit Netz, der Spieler von hinten. Richtig: kurzes Overlay „Tor!“, danach geht es nach 1,8 Sekunden von allein zur nächsten Aufgabe (ohne Erklärung, ohne Weiter-Taste). Falsch: zufällig Pfosten, Latte oder knapp vorbei, jeweils mit lustiger Sprechblase (PLING!, BONG!, Uups!). Das Vereinsschild steht nicht mehr in der Szene. `prefers-reduced-motion` wird beachtet.
- Trainer und Trainerin (Vorgaben „Trainer“ und „Trainerin“, nach Fotos gezeichnet, Name und Aussehen im Eltern-Bereich, gilt für alle Konten): Hilfe-Taste in jeder Aufgabe mit zwei Stufen (1. Tipp vom Trainer, 2. Erklärung an einem ähnlichen Beispiel von der Trainerin, nie die Lösung), Erklärung nach einer falschen Antwort in einer Sprechblase (abwechselnd), freundliches Angebot nach der Tipp-Zeit (Vorgabe 45 Sekunden, je Konto einstellbar oder aus). Hilfe kostet keine Punkte, die Nutzung steht je Thema im Lernstand.
- Behoben: Das Angebot des Trainers nach der Tipp-Zeit kam bei der ersten Aufgabe einer Runde nie (der Timer wurde gestartet, bevor die Ansicht umgeschaltet war).
- Neue Tipp-Texte für alle Aufgabenarten, die keinen hatten. Einige alte Tipps nannten Beispielwörter, die als Lösung vorkommen konnten (Doppelte Mitlaute, i oder ie, Adjektive steigern), sie sind ersetzt.

### Datenmodell (Schemaversion 2)
- Neu im Konto: `profile.avatar` (mit `body`), `profile.avatarAsked`, `settings.perRound`, `trialN`, `trialDaily`, `hintAfter`, `stats.<Thema>.help`, `stats.<Thema>.last[].h`, `history[].dur`. Global: `trainer` und `trainer2`.
- Migration 1 nach 2 ohne Verlust (Unbekanntes bleibt, Eingabe unverändert), migrierter Stand geht zurück auf den Server.
- Zusammenführen: Aussehen und Trainer neuester gewinnt, Tipp-Zähler je Gerät summieren. Regeln in SPEC.md.

### Geändert
- „Spielstand zurücksetzen“ ist aus der Trainerbank in den Eltern-Bereich gewandert (nur dort prüft der Server die PIN und sichert vorher).
- Rundenlänge, Schnupper-Aufgaben und die Sieg-Schwelle (60 Prozent, aufgerundet) kommen aus den Einstellungen des Kontos.
- Versionen: App 1.1.0 (`app/js/version.js`, `sw.js`), Server 1.1.0, `package.json` 1.1.0.

### Tests
102 Tests (vorher 41), neu unter anderem: Migration 1 nach 2 mit Fixture, Admin-API mit falscher und richtiger PIN, Papierkorb, Wiederherstellen, Zurücksetzen, PIN ändern, Merge der neuen Felder, Branch-Prüfung in `deploy.sh`, Tipps und Beispiele nennen nie die Lösung, Ende-zu-Ende-Test mit der echten `app.js`.

## 1.0.0 (Phase 1, Umzug)
Erste spielbare Fassung im Repo. Der Prototyp läuft jetzt als Home-Bildschirm-Web-App.

### Neu
- Spiel aus dem Prototyp übernommen: 3 Ligen (Klasse 2 bis 4), alle Themen und Generatoren, Schnuppern, Aufstieg (8 von 10, 20 Probe-Aufgaben), Freigabe per Eltern-PIN, Punkte, Sticker, Trainerbank. Aufgeteilt in ES-Module unter `app/js/`, ohne Build-Schritt.
- Offline-fähig: Service Worker mit versionierter Cache-Nummer (App-Dateien cache-first, `/api` nie über den Cache), Manifest, Icons (192, 512, maskierbar, Apple Touch 180), iOS-Meta-Tags für Standalone.
- Keine externen Ressourcen: Schriften Andika und Lilita One (OFL) liegen als woff2 in `app/fonts/`.
- Lokal zuerst: Speicherung in IndexedDB nach jeder beantworteten Aufgabe. Automatischer Abgleich mit dem Server nach jeder Änderung, beim Start, beim Wiederkehren der App und bei Netz (Trainerbank zeigt „Zuletzt abgeglichen“).
- Mehrkontenfähiges Datenmodell mit `schemaVersion` und Migrationen. Schlichte Kontoauswahl („Wer spielt?“), neues Konto nur mit Eltern-PIN.
- Eltern-PIN gilt für alle Konten und Geräte (SHA-256 mit Salz, wird mit abgeglichen). Der alte Prototyp-Hash wird noch erkannt und beim ersten Eingeben aufgewertet.
- Zusammenführen bei Konflikten (Zähler je Gerät, letzte 10 Antworten je Thema nach Zeitstempel, Freigaben neuester Stand, Zurücksetzen gewinnt), siehe SPEC.md.
- Server: `/api/profiles` (Liste, Anlegen), `/api/profiles/<id>/state` (GET, PUT mit `baseRev`), `/api/settings` (GET, PUT). Konto-ID streng geprüft, atomares Schreiben, Tagessicherungen je Konto, 409 bei Konflikt und bei älterer Schemaversion.
- `deploy.sh` sichert vor dem `git pull` nach `data/backups/pre-deploy-<JJJJMMTT-HHMM>/` (die letzten 20 bleiben), `--backup-only` sichert nur.
- Tests mit `node --test` (Server-API, Konfliktfall, Merge-Regel, Migration mit Fixture im Prototyp-Format, zwei Geräte offline, Auslieferung, deploy.sh).

### Entfernt
- Phase-0-Testseite (Zähler) und `/api/state`.
- `window.claude` und die db-Capability des Prototyps.

### Bewusst nicht enthalten
Einführung, Avatar, gestaltete Startseite (Phase 2), neue Modi und Aufgabenarten (Phasen 3 und 4), Klasse-1-Liga (Phase 6), Preview-Container (Phase 1b). Kein Import alter Artifact-Stände.

## 0.1.0 (Phase 0)
Grundgerüst: Server ohne Zusatzpakete, Testseite mit Zähler, Dockerfile, docker-compose.yml, deploy.sh.
