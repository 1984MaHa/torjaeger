# Torjäger-Liga: gebauter Stand (Version 1.0.0)

Diese Datei beschreibt, was der Code heute tut. Absicht, Entscheidungen und Roadmap stehen im Vault (`Projects/Torjaeger/`).

## Überblick
Home-Bildschirm-Web-App (iPad, iPhone) mit Node-Server ohne Zusatzpakete. Der Spielstand liegt zuerst lokal (IndexedDB) und wird automatisch mit dem Server abgeglichen. Ohne Server bleibt alles spielbar.

```
Browser (Service Worker, IndexedDB)  <──HTTPS, /api──>  server/server.js  ──>  data/ (JSON-Dateien)
```

## Spiel
- Ligen: Bambini-Liga (Klasse 2), Kreisliga (Klasse 3), Bezirksliga (Klasse 4). Themen und Generatoren wie im Prototyp (`content.js`, `generators.js`).
- Ein Spiel hat 8 Aufgaben (Mathe, Deutsch oder Mix). Richtig gibt 10 Punkte, ab der dritten richtigen Antwort in Folge 15. Sieg ab 60 Prozent gibt 20 Bonuspunkte und einen Sticker, ein perfektes Spiel (mindestens 5 Aufgaben) zusätzlich 30.
- Ein Thema ist sicher, wenn von den letzten 10 Antworten mindestens 8 richtig sind. Schwache Themen kommen öfter dran.
- Aufstieg: Sind alle Themen einer Liga sicher, beginnt in der nächsten Liga das Probetraining mit 20 Aufgaben. Danach geben die Eltern per PIN ganz frei. Sie können auch früher freigeben oder wieder sperren.
- Schnuppern: 3 Aufgaben, einmal pro Tag, in gesperrten Ligen bis 2 Ligen über der höchsten freien.
- Tiefere Ligen sind immer spielbar.
- Konten: schlichte Auswahl „Wer spielt?“. Neues Konto nur mit Eltern-PIN (beim allerersten Konto wird die PIN festgelegt). Die PIN (4 Ziffern) gilt für alle Konten und Geräte.

## Datenmodell (schemaVersion 1)
Konto-Stand (`data/profiles/<id>.json`, Feld `state`):
| Bereich | Inhalt |
|---|---|
| `meta` | `schemaVersion`, `deviceId` (letzter Schreiber), `rev` (Server-Revision), `updatedAt`, `createdAt`, `resetAt` |
| `profile` | `id`, `name`, `t` |
| `progress` | `dev` (je Gerät `points`, `rounds`, `wins`, `stickers`), `days` (Trainingstage), `lg` (je Liga `probe`, `spent`, `open`, `trial`, `t`), `sel` |
| `stats` | je Thema `tot` (je Gerät `a`, `c`) und `last` (letzte 10 Antworten `{t, ok, d}`) |
| `history` | je Spiel `{id, t, d, liga, mode, trial, c, n, pts}`, höchstens 200 |
| `settings` | `sound`, `t` |

Anzeigewerte (Punkte, Spiele, Siege, Sticker) sind die Summe über `progress.dev`. Jedes Gerät schreibt nur seinen eigenen Zähler.

Global (`data/settings.json`, Feld `settings`): `schemaVersion`, `pin` (`algo`, `salt`, `hash`, `t`), `updatedAt`. Die Kontenliste ergibt sich aus den Dateien in `data/profiles/`.

Dateiformat auf dem Server: `{id, name, rev, savedAt, device, schemaVersion, state}` (Konto) und `{rev, savedAt, device, schemaVersion, settings}` (global).

### Migration
`model.js`: `migrateProfile` hebt Stände auf `SCHEMA_VERSION`. Stufe 0 ist das Prototypformat (localStorage-Schlüssel `torjaeger`, Struktur ohne `meta`): `migratePrototype` überführt es ohne Verlust (Punkte, Spiele, Siege, Sticker, Antworten je Thema, Trainingstage, Verlauf, Ligen-Freigaben, Ton, Alt-PIN) und erhält unbekannte Felder. Die App importiert keine Prototyp-Stände (Start bei null), die Funktion ist für Tests und spätere Werkzeuge da. Neue Stufen: Eintrag in `PROFILE_MIGRATIONS` und `SCHEMA_VERSION` erhöhen. Ein Stand mit neuerer Schemaversion als die App kennt wird nie verändert, die App lädt sich neu.

## Abgleich (`sync.js`)
1. Jede Änderung wird sofort in IndexedDB gespeichert (nach jeder beantworteten Aufgabe, nach Spielende, bei Freigaben).
2. Danach (nach 0,6 Sekunden, beim Spielende sofort), beim Start, bei `online`, beim Wiederkehren der App und jede Minute: Server-Stand holen. Ist die Revision eine andere als `baseRev`, wird zusammengeführt. Ist danach etwas zu senden, folgt `PUT` mit `baseRev`. Bei 409 beginnt der Ablauf von vorn (höchstens 6 Versuche).
3. Fehlt das Konto auf dem Server, wird es angelegt (`POST /api/profiles`). Unbekannte Konten des Servers erscheinen lokal und werden geladen.
4. Kein Netz: der Stand bleibt als „vorgemerkt“ lokal, es gibt keinen Fehler. Die Trainerbank zeigt „Zuletzt abgeglichen“ und den Zustand.
5. `409` mit `reason: "schema_too_old"` oder ein Stand mit neuerer Schemaversion: die App aktiviert die neue Version (Service Worker) und lädt sich neu, höchstens einmal pro Minute automatisch.

### Regeln beim Zusammenführen (`merge.js`, reine Funktion)
- Zähler: je Gerät der größere Wert, angezeigt wird die Summe. Das entspricht der Summe der Zuwächse je Gerät, ist unabhängig von der Reihenfolge und zählt bei wiederholtem Zusammenführen nichts doppelt.
- Je Thema: Antwortzähler je Gerät wie oben. Die letzten 10 Antworten sind die 10 mit den neuesten Zeitstempeln aus der Vereinigung beider Stände.
- Trainingstage und Verlauf: Vereinigung.
- Ligen-Freigaben: je Liga der neuere Stand (`t`). Sind Freigabezustand gleich, zählt der größere Probetraining-Verbrauch, `trial` ist das spätere Datum. Name und Einstellungen: der neuere Stand.
- Zurücksetzen (`meta.resetAt`): der Stand mit dem späteren Zurücksetzen gewinnt vollständig, auch gegen ältere ungesendete Spiele auf anderen Geräten.
- Sticker sind ein Zähler je Gerät (nicht „neuester gewinnt“), damit bei parallelem Spielen kein Sticker verloren geht. Angezeigt wird höchstens die Zahl der vorhandenen Sticker.
- Unbekannte Felder bleiben erhalten. Global: neuere PIN (`pin.t`) gewinnt.

## Server (`server/server.js`)
Node 20, nur Bordmittel. `createServer({appDir, dataDir})` ist testbar, Start mit `node server/server.js` (`PORT`, `DATA_DIR`).

| Aufruf | Bedeutung |
|---|---|
| `GET /api/health` | `{ok, time}` |
| `GET /api/profiles` | `{profiles:[{id,name,rev,savedAt,schemaVersion}]}` |
| `POST /api/profiles` | `{name, id?}` legt ein leeres Konto an (201), `409 exists` wenn die ID vergeben ist |
| `GET /api/profiles/<id>/state` | `{rev, savedAt, schemaVersion, state}` (`state` ist `null` bei Revision 0), 404 wenn unbekannt |
| `PUT /api/profiles/<id>/state` | `{baseRev, device, state}` → `{rev, savedAt}` |
| `GET /api/settings`, `PUT /api/settings` | `{rev, ..., settings}` bzw. `{baseRev, device, settings}` |

Fehler: `400` (`bad_json`, `bad_base_rev`, `bad_state`, `bad_id`, `bad_name`), `404`, `405`, `413` (über 2 MB), `409 conflict` mit `reason: "rev"` (und `current`) oder `reason: "schema_too_old"` (und `storedSchemaVersion`).

Konto-ID: `^[a-z0-9][a-z0-9-]{2,39}$` (die App vergibt `k-` plus 8 Zeichen). Schreiben ist atomar (`.tmp`, dann umbenennen). Nach jedem Schreiben wird die Tagessicherung `data/backups/profile-<id>-<Datum>.json` bzw. `settings-<Datum>.json` aufgefrischt, je 30 Tage. Der Server vergibt die Revision und schreibt sie in `state.meta.rev`. Statische Dateien: Code (`.html`, `.js`, `.css`, `sw.js`, Manifest) mit `no-cache`, Schriften und Icons mit einem Tag Cache.

Es gibt keine Anmeldung am Server. Der Zugriff ist nur über Tailscale möglich, die Eltern-PIN schützt Freigaben und Konten in der App, nicht die Daten.

## App-Auslieferung (PWA)
- `sw.js`: Cache `torjaeger-app-<VERSION>`, alle App-Dateien werden beim Installieren geladen (ohne HTTP-Cache). Fetch: `/api` nie über den Service Worker, alles andere cache-first, Navigation fällt auf `index.html` zurück. Beim Aktivieren werden nur alte `torjaeger-app-*`-Caches gelöscht. Der Service Worker berührt IndexedDB nie.
- Eine neue Version wartet, bis die App neu gestartet wird. Die Trainerbank zeigt „Jetzt laden“ (Nachricht `SKIP_WAITING`, dann Neuladen).
- Ein Test prüft, dass `sw.js` jede Datei in `app/` auflistet, dass Versionsnummern übereinstimmen und dass es keine externen Adressen gibt.

## Update ohne Verlust
Daten nur in `data/` (nicht im Repo, nicht im Image). `deploy.sh` sichert vor dem `git pull` nach `data/backups/pre-deploy-<JJJJMMTT-HHMM>/` (Konten, Einstellungen, alte Phase-0-Datei). Schemaversion plus Migration, Server lehnt veraltete Schreiber ab, IndexedDB wird nie geleert.

## Bekannte Grenzen
- Eine laufende Spielrunde wird nicht gespeichert. Beendet man die App mittendrin, bleiben beantwortete Aufgaben (Antworten, Punkte, Probetraining-Verbrauch) erhalten, das Spiel selbst (Spielzähler, Sticker, Verlauf) nicht.
- Kein Löschen oder Umbenennen von Konten in der Oberfläche (Name ist im Datenmodell änderbar).
- Kein Server-Login, keine Verschlüsselung der Daten auf der Platte.
- Hyper Backup ist nicht eingerichtet: Sicherungen liegen auf derselben Platte.
