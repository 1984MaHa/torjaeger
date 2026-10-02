# Fortschritt (Auftrag current.md vom 02.10.2026, Teil B)

Anker (Fortsetzung): Branch preview, Version 1.6.7, Schema 8, Tests 295 grün. Tags v1.6.0 bis v1.6.7 lokal. main und origin unverändert bei e0cd3e5 (nichts gepusht).

| Paket | Stand | Tests |
|---|---|---|
| A0 Rückübergabe 1.5.5 | fertig (aca0c5a) | 237 |
| B1 Sondertraining (1.6.0) | fertig (5492b1a, Tag v1.6.0) | 244 |
| B2 Themen-Zustände (1.6.1, Schema 8) | fertig, siehe git log, Tag v1.6.1 | 254 |
| B3 Frust-Bremse (1.6.2) | fertig, Tag v1.6.2 | 260 |
| B4 Mini-Spiel Torwand (1.6.3) | fertig, Tag v1.6.3 | 267 |
| B5 Mini-Spiel Memory (1.6.4) | fertig, Tag v1.6.4 | 274 |
| B6 Dribbel-Parcours (1.6.5) | fertig, Tag v1.6.5 | 282 |
| B7 Überraschungsspiel (1.6.6) | fertig, Tag v1.6.6 | 287 |
| B8 Liga-Freigaben serverseitig (1.6.7) | fertig, Tag v1.6.7 | 295 |

Alle Pakete A0 und B1 bis B8 sind fertig. Offen: Abschluss-Rückübergabe (return.md Kopf) und Marcos Schritte (Push, Vorschau, Prüfung, Live).

B2: zurueck (mit optionalem Datum topicUntil), topicSeen (neue Themen starten zurückgestellt), Migration 7 nach 8, Fixture state-v7.json.
Für B3: Zustände aus settings.topicMode, Fehlerfolge je Thema aus stats.<Thema>.last (letzte 10 Antworten) ablesbar, kein neues Datenfeld nötig für die Bremse selbst; Eltern-Markierung "schon im Unterricht dran?" braucht evtl. Feld.
Bekannte Grenzen: B1 Einheiten ohne Stufen. Datumsfeld im Eltern-Bereich nur per Test auf Struktur geprüft (kein Browsertest).
NAS-Stand laut Marco unbekannt.
