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
- Schemaversion 7 (Konto, global 4; ab 1.5.4 mit `camps`): Migration in `PROFILE_MIGRATIONS` (`model.js`), Merge-Regeln in `merge.js` und SPEC.md. Der Server prüft die Eltern-PIN bei jeder Admin-Aktion selbst (`server/admin.js`). Die Eltern-PIN ändert sich nur über `/api/admin/pin` (alte PIN nötig), der Abgleich kann sie nicht ersetzen. Der Server lehnt unvollständige Stände ab (`checkProfileState`, `checkGlobalState` in `model.js`, Pflichtfelder in SPEC.md) und liest den Stand beim PUT erst nach dem Einlesen der Anfrage, ohne `await` zwischen Prüfen und Schreiben.
- Figuren (Kind, Trainer) sind feste Bild-Vorlagen in `app/img/` (Quelle `assets-src/`, aufbereitet mit `tools/prepare-figures.mjs`, Ablauf im README). Neue Bilder in `FILES` von `app/sw.js`, Maße in `app/js/figdata.js` (erzeugt, nicht von Hand ändern).
- Hilfe des Trainers verrät nie die Lösung: Tipps (`hint`) und Beispiele bleiben ohne Lösungswörter, Tests prüfen es.
- `data/` nie committen.

## Rückübergabe an Cowork (Pflicht am Ende jeder Sitzung)
Cowork sieht diese Sitzung nicht. Alles, was hier passiert ist, muss in die Rückübergabe, sonst wird doppelt gearbeitet.
- Schreibe sie nach `.handover/return.md` (überschreiben, committen) und gib sie zusätzlich als einen kopierfertigen Block im Chat aus.
- Inhalt vollständig:
  - **Was Marco in dieser Sitzung schon selbst ausgeführt hat**, mit Ergebnis: Push, Merge, Branch-Wechsel, Befehle auf der NAS (Klon, `.env`, `deploy.sh`, `tailscale serve`), Tests auf iPad/iPhone. Ausdrücklich auch, was noch **nicht** ausgeführt ist.
  - Stand je Umgebung: welcher Commit liegt auf `main`, `preview`, `origin/*`, welche Version läuft live und in der Vorschau (soweit bekannt).
  - Rückmeldungen und Wünsche von Marco aus der Sitzung und wie sie umgesetzt wurden.
  - Entscheidungen mit Grund, verworfene Wege, Abweichungen vom Auftrag (Annahmekorrekturen).
  - Restposten kategorisiert: echter Blocker, bewusst offen, kosmetisch.
  - Anker: Commit, Branch, Arbeitsbaum.
  - Nächste Schritte für Marco, einzeln, Befehle unverschachtelt, ohne Heredocs.

