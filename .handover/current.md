# Cross-Handover

**Stand:** 2026-09-29 21:15
**Von:** cowork
**An:** claude-code
**Stufe:** voll
**Modus:** bauen

Inhalt identisch mit dem kopierfertigen Block (unten vollständig). Anker: Commit 7760159b6ab155b03eb09c9aeb1f61b3268c6b4f auf main, Arbeitsbaum sauber bis auf die von Cowork abgelegten Ordner .handover/ und prototype/ (untracked, gewollt).

```
Cross-Handover cowork nach claude-code, 2026-09-29.
Modus: bauen. Stufe: voll.
Projekt: Torjäger-Liga (Fußball-Lernspiel Mathe/Deutsch für Emil, Grundschule). Repo: C:\AI\_MBrain Data\Projects\Torjaeger-Liga (GitHub 1984MaHa/torjaeger, Branch main).

ANKER, zuerst gegenprüfen, nicht arbeiten:
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" log --oneline -2   -> erwartet oben 7760159 "Doku: Repo-Name und Vault-Pfad", darunter 8eff9b4
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" status --short     -> erwartet genau: ?? .handover/  und  ?? prototype/
Beide untracked Ordner sind gewollt (von Cowork abgelegt). Bei anderer Abweichung: zurückweisen und als Prüfauftrag an Cowork zurückspielen.

LIES ZUERST, in dieser Reihenfolge:
1. C:\AI\_MBrain Data\Projects\Torjaeger-Liga\CLAUDE.md
2. C:\AI\_MBrain Data\Projects\Torjaeger-Liga\.handover\current.md (dieser Auftrag als Zettel)
3. C:\AI\_MBrain OS\MyBrain\Projects\Torjaeger\Torjaeger.md (Index, Stand, Grundregeln)
4. C:\AI\_MBrain OS\MyBrain\Projects\Torjaeger\specs\Torjaeger-Plan.md (Architektur, Spielkonzept, Datenmodell, "Neue Anforderungen A bis D", "Phase 0 abgeschlossen")
5. C:\AI\_MBrain Data\Projects\Torjaeger-Liga\prototype\torjaeger-prototyp-v2.html (funktionierender Prototyp, lief als Claude-Artifact; enthält die komplette Spiellogik)
6. C:\AI\_MBrain Data\Projects\Torjaeger-Liga\server\server.js, deploy.sh, docker-compose.yml, Dockerfile, README.md (Phase-0-Stand, läuft produktiv auf der Synology)

AUFTRAG
Phase 1 "Umzug": Den Prototyp als offline-fähige Home-Bildschirm-Web-App nach app/ überführen, mit mehrkontenfähigem Datenmodell (schemaVersion + Migrationen), lokaler Speicherung (IndexedDB) und automatischem Abgleich mit dem Server. Server und deploy.sh so erweitern, dass kein Update je einen Spielstand zurücksetzt. Ergebnis: lokal getestet und committet, bereit für Marcos Push und Deploy.

Inhaltlich im Einzelnen (Verdacht, nicht Vorschrift, eigene Analyse erwünscht):
- App: Spiellogik aus dem Prototyp übernehmen (3 Ligen Klasse 2 bis 4, alle Themen und Generatoren, Schnuppern, Aufstieg 8 von 10, 20 Probe-Aufgaben, Eltern-PIN-Freigabe, Punkte, Sticker, Trainerbank). Aufteilen in einfache ES-Module ohne Build-Schritt. window.claude / db-Capability komplett entfernen.
- Keine externen Ressourcen: Schriften Andika und Lilita One (beide OFL) als woff2 nach app/fonts/, Lizenzdatei dazu. Kein CDN, kein Google-Fonts-Link.
- PWA: manifest.webmanifest, Icons (192, 512, apple-touch-icon 180), iOS-Meta-Tags für Standalone, Service Worker mit versionierter Cache-Nummer (App-Dateien cache-first, /api network-only). Service Worker leert nie IndexedDB.
- Datenmodell je Konto: meta (schemaVersion, deviceId, rev, updatedAt), profile (Name), progress, stats (je Thema letzte 10 Antworten mit Zeitstempel), history, settings. Global (kontenübergreifend, geräteübergreifend abgeglichen): Eltern-PIN (gehasht), Kontenliste.
- Abgleich: lokal zuerst speichern (nach jeder Aufgabe), dann PUT mit baseRev. Bei 409 zusammenführen nach Plan-Regel (Punkte/Spiele/Siege als Summe der Zuwächse je Gerät, je Thema letzte 10 nach Zeitstempel, Sticker/Freigaben/Avatar: neuester gewinnt) und erneut senden. Anzeige in der Trainerbank "Zuletzt abgeglichen".
- Server: /api/health bleibt; neu /api/profiles (Liste, Anlegen), /api/profiles/<id>/state (GET/PUT mit baseRev), /api/settings (GET/PUT). Dateien data/profiles/<id>.json, data/settings.json, atomar schreiben, Tagessicherungen wie bisher. Konto-ID streng validieren. PUT mit älterer schemaVersion als gespeichert: 409 mit Grund, App lädt sich dann neu. Weiterhin keine npm-Pakete.
- deploy.sh: vor git pull eine Sicherung data/backups/pre-deploy-<JJJJMMTT-HHMM>/ anlegen.
- Tests mit node --test (Bordmittel): Server-API, Konfliktfall, Merge-Regel, Migration. Fixture test/fixtures/ mit einem Stand im Prototyp-Format (localStorage-Schlüssel "torjaeger", Struktur siehe Prototyp) und Migration auf das neue Schema ohne Verlust.
- Phase-0-Testseite (Zähler) ersetzen; /api/state darf entfallen.

NICHT-ZIELE
- Keine Einführung, kein Avatar, keine gestaltete Startseite "Wer spielt?" (Phase 2). Höchstens eine schlichte Kontoauswahl, siehe OFFEN.
- Keine neuen Spielmodi (Spiel auf Zeit, Klassenarbeit, Turnier) und keine neuen Aufgabenarten (Phasen 3 und 4).
- Keine Liga für Klasse 1 (Phase 6).
- Kein Preview-Container, kein Branch preview (Phase 1b, eigener Auftrag).
- Keine Änderungen auf der Synology, kein git push, kein Deploy. Das macht Marco.
- Keine npm-Abhängigkeiten, kein Build-Tool, kein Framework.
- Kein Import alter Spielstände aus dem Claude-Artifact (es gibt keinen echten Stand; Start bei null).

ENTSCHIEDEN, nicht mehr zur Debatte
- Betrieb: Synology "energizer" (DS918+, DSM 7.1.1, Paket Docker mit docker-compose v1, NICHT Container Manager). docker-compose.yml muss mit docker-compose v1 kompatibel bleiben.
- Zugriff nur über Tailscale: https://energizer.tailfc5923.ts.net (tailscale serve auf 127.0.0.1:8080). Kein DDNS, keine Portfreigabe.
- Home-Bildschirm-Web-App auf iPad und iPhone, Spielstand lokal zuerst, automatischer Abgleich. Kein manueller Export/Import (verworfen, zu fehleranfällig). "Datei lokal öffnen und in iCloud speichern" geht unter iOS nicht (verworfen). Keine eigene iOS-App.
- Eltern-PIN gilt auf allen Geräten und für alle Konten.
- Updates dürfen nie einen Spielstand zurücksetzen: Daten nur in data/ (nie im Repo, nie im Image), Sicherung vor Deploy, schemaVersion + Migration, Unbekanntes erhalten.
- Mehrere Konten (Emil, später Nichte in Klasse 1). Aussehen je Konto frei wählbar, kein fester Mädchen-Modus (kommt in Phase 2).
- Texte Deutsch, kindgerecht, keine Gedankenstriche.
- Server ohne Zusatzpakete (Node 20, Bordmittel).

OFFEN, darf die annehmende Seite entscheiden
- Ob Phase 1 schon eine schlichte Kontoauswahl (nur Namen, Anlegen mit Eltern-PIN) zeigt. Pflicht ist nur, dass Datenmodell und API mehrere Konten tragen. Empfehlung: schlicht ja, damit sich der Abgleich mit zwei Konten testen lässt.
- Modulaufteilung von app/js/, Name und Aufbau der Migrationsfunktionen.
- Hash-Verfahren der PIN (Web Crypto SHA-256 mit Salz reicht; es geht um Kinderschutz, nicht um Hochsicherheit).
- Ob Schriften per Skript geladen oder manuell abgelegt werden (Marco kann Dateien liefern, falls kein Netz).

ABNAHME
- node --test läuft grün.
- Lokal: node server/server.js, http://localhost:8080 zeigt das Spiel; eine Runde spielen; Seite neu laden: Punkte und Stand unverändert.
- Server stoppen: App lädt aus dem Service Worker weiter und ist spielbar; nach Serverstart gleicht sie sich ohne Zutun ab.
- Zwei Browser-Profile auf dasselbe Konto: beide offline spielen, dann online: kein Punkt und keine Antwort geht verloren (Test deckt das ab).
- Fixture im Prototyp-Format wird ohne Datenverlust migriert.
- deploy.sh legt vor dem Pull data/backups/pre-deploy-... an (Trockentest oder Test dokumentiert).
- Keine externen Requests: grep nach http(s):// in app/ findet nur Kommentare/Lizenztexte.
- README (Einrichtung, Update, Datenablage), CHANGELOG.md (neu) und SPEC.md (neu, beschreibt den gebauten Stand) aktuell.
- Commits sauber und sprechend, Arbeitsbaum am Ende sauber (prototype/ und .handover/ committet oder bewusst begründet).
Tests Pflicht: ja

RESTPOSTEN, kategorisiert
- Echter Blocker: keiner bekannt.
- Bewusst offen: Hyper Backup auf der NAS vorerst nicht eingerichtet (Entscheidung Marco); Halbzeitlänge, Klassenarbeit-Umfang, Turnier-Takt (Phase 3).
- Kosmetischer Rest: Tailscale auf der NAS 1.58.2, Update irgendwann.

DOKU-ZUSTÄNDIGKEIT
Repo trägt die Wahrheit über den Code (SPEC.md, CHANGELOG.md, README.md). Vault (C:\AI\_MBrain OS\MyBrain\Projects\Torjaeger\) trägt Absicht, Entscheidungen und Verlauf und wird von Cowork gepflegt; dort nichts schreiben. Rückweg: nach Abschluss einen kurzen Cross-Handover zurück an Cowork mit Annahmekorrekturen, verworfenen Wegen, kategorisierten Restposten, Anker (Commit, Arbeitsbaum) und den Schritten, die Marco für Push, Deploy und iPad-Test ausführen muss (einzeln, unverschachtelt, ohne Heredocs).

ERSTER SCHRITT
Anker prüfen, nicht arbeiten.
```
