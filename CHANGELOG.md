# Änderungen

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
