# Torjäger-Liga: Hinweise für Claude

- Sprache in App, Texten und Doku: Deutsch. Kindgerecht, kurze Sätze. Keine Gedankenstriche (—) in Texten.
- Zielgeräte: iPad und iPhone (Safari, Home-Bildschirm-App). Große Tippflächen, keine Systemtastatur für Zahlen.
- Server bleibt ohne Zusatzpakete (nur Node.js-Bordmittel). Keine externen CDNs, alles liegt lokal (Offline-Betrieb).
- Spielstand: lokal zuerst (IndexedDB), Abgleich über `/api/profiles/<id>/state` und `/api/settings` mit `baseRev` (409 = Konflikt, dann zusammenführen, Regeln in SPEC.md).
- Datenformat hat eine Schemaversion; alte Stände immer migrieren, nie verwerfen.
- Plan und Roadmap: Vault `Projects/Torjaeger/specs/Torjaeger-Plan.md`, Index `Projects/Torjaeger/Torjaeger.md`. Prototyp: Claude-Artifact (siehe Plan).
- Repo trägt die Wahrheit über den Code (SPEC.md, CHANGELOG.md, README.md). Der Vault wird von Cowork gepflegt, dort nichts schreiben.
- Neue App-Version: `app/js/version.js` und `VERSION` in `app/sw.js` gemeinsam erhöhen. Tests: `node --test`.
- `data/` nie committen.
