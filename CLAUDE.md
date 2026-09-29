# Torjäger-Liga: Hinweise für Claude

- Sprache in App, Texten und Doku: Deutsch. Kindgerecht, kurze Sätze. Keine Gedankenstriche (—) in Texten.
- Zielgeräte: iPad und iPhone (Safari, Home-Bildschirm-App). Große Tippflächen, keine Systemtastatur für Zahlen.
- Server bleibt ohne Zusatzpakete (nur Node.js-Bordmittel). Keine externen CDNs, alles liegt lokal (Offline-Betrieb).
- Spielstand: lokal zuerst (IndexedDB), Abgleich über `/api/state` mit `baseRev` (409 = Konflikt, dann zusammenführen).
- Datenformat hat eine Schemaversion; alte Stände immer migrieren, nie verwerfen.
- Plan und Roadmap: Vault `Personal/Themes/Torjäger-Liga Standalone-Plan.md`. Prototyp: Claude-Artifact (siehe Plan).
- `data/` nie committen.
