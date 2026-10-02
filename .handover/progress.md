# Fortschritt (Auftrag current.md vom 02.10.2026, Teil B)

Anker (Fortsetzung): Branch preview, Version 1.6.2, Schema 8, Tests 260 grün. Tags v1.6.0, v1.6.1, v1.6.2 lokal. main und origin unverändert bei e0cd3e5 (nichts gepusht).

| Paket | Stand | Tests |
|---|---|---|
| A0 Rückübergabe 1.5.5 | fertig (aca0c5a) | 237 |
| B1 Sondertraining (1.6.0) | fertig (5492b1a, Tag v1.6.0) | 244 |
| B2 Themen-Zustände (1.6.1, Schema 8) | fertig, siehe git log, Tag v1.6.1 | 254 |
| B3 Frust-Bremse (1.6.2) | fertig, Tag v1.6.2 | 260 |
| B4 Mini-Spiel Torwand (1.6.3) | offen, als Nächstes | - |
| B5 bis B8 | offen | - |

B2: zurueck (mit optionalem Datum topicUntil), topicSeen (neue Themen starten zurückgestellt), Migration 7 nach 8, Fixture state-v7.json.
Für B3: Zustände aus settings.topicMode, Fehlerfolge je Thema aus stats.<Thema>.last (letzte 10 Antworten) ablesbar, kein neues Datenfeld nötig für die Bremse selbst; Eltern-Markierung "schon im Unterricht dran?" braucht evtl. Feld.
Bekannte Grenzen: B1 Einheiten ohne Stufen. Datumsfeld im Eltern-Bereich nur per Test auf Struktur geprüft (kein Browsertest).
NAS-Stand laut Marco unbekannt.
