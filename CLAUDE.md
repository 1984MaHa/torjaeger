# Torjäger-Liga: Hinweise für Claude

- Sprache in App, Texten und Doku: Deutsch. Kindgerecht, kurze Sätze. Keine Gedankenstriche (—) in Texten.
- Zielgeräte: iPad und iPhone (Safari, Home-Bildschirm-App). Große Tippflächen, keine Systemtastatur für Zahlen.
- Server bleibt ohne Zusatzpakete (nur Node.js-Bordmittel). Keine externen CDNs, alles liegt lokal (Offline-Betrieb).
- Spielstand: lokal zuerst (IndexedDB), Abgleich über `/api/profiles/<id>/state` und `/api/settings` mit `baseRev` (409 = Konflikt, dann zusammenführen, Regeln in SPEC.md).
- Datenformat hat eine Schemaversion; alte Stände immer migrieren, nie verwerfen.
- Plan und Roadmap: Vault `Projects/Torjaeger/specs/Torjaeger-Plan.md`, Index `Projects/Torjaeger/Torjaeger.md`. Prototyp: Claude-Artifact (siehe Plan).
- Repo trägt die Wahrheit über den Code (SPEC.md, CHANGELOG.md, README.md). Der Vault wird von Cowork gepflegt, dort nichts schreiben.
- Neue App-Version: `app/js/version.js`, `VERSION` in `app/sw.js`, `SERVER_VERSION` in `server/server.js` und `version` in `package.json` gemeinsam erhöhen (Tests prüfen es). Tests: `node --test`.
- Neue Datei in `app/`: in die Liste `FILES` in `app/sw.js` eintragen (ein Test prüft es).
- Branches: `main` ist Live, `preview` ist die Vorschau (zweiter Klon auf der NAS). Neues zuerst auf `preview`, erst nach Abnahme nach `main`. `.env` (Container, Port, `PREVIEW_LABEL`) nie committen.
- Schemaversion 2: Migration in `PROFILE_MIGRATIONS` (`model.js`), Merge-Regeln in `merge.js` und SPEC.md. Der Server prüft die Eltern-PIN bei jeder Admin-Aktion selbst (`server/admin.js`).
- Hilfe des Trainers verrät nie die Lösung: Tipps (`hint`) und Beispiele bleiben ohne Lösungswörter, Tests prüfen es.
- `data/` nie committen.
