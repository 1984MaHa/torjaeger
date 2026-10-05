# Fortschritt (Auftrag current.md vom 05.10.2026, Pakete C0 bis C4)

Anker: Branch preview, Version 1.6.7, Schema 8, 295 Tests, HEAD 441c8e9. main/origin bei e0cd3e5.

| Paket | Stand | Tests |
|---|---|---|
| C0 Info-Grafik (1.7.0) | fertig, Tag v1.7.0 | 299 |
| C1 Einmaleins-Grenze (1.7.1) | offen | |
| C2 Neue Aufgabenarten (1.7.2) | offen | |
| C3 Baukasten (1.7.3) | offen | |
| C4 Vorlage 9er Reihe (1.7.4) | offen | |

Entscheidungen:
- C0: Zoom über Tasten + und − (3 Stufen, Bild in einem scrollbaren Rahmen), weil Seitenzoom im Vollbild-Overlay auf dem iPad unzuverlässig ist. Quelle war 1672 px breit, verkleinert auf 1600 px (Qualität 80, 364 KB). Alte Versionstests auf 1.7.0 gezogen, Bildlisten-Tests kennen die JPG.

## Vorheriger Auftrag


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
