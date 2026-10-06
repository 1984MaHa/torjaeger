# Fortschritt (Auftrag current.md vom 06.10.2026, Pakete D1 und D2: Tor-Animation)

Anker: Branch preview, Version 1.7.7, HEAD ebd0a0e. main und origin bei ebd0a0e.

| Paket | Stand | Tests |
|---|---|---|
| D1 Trefferpunkte und Flugbahn (1.7.8) | offen | |
| D2 Genau ins Eck (1.7.9) | offen | |

## Vorheriger Auftrag (C0 bis C4, 1.7.0 bis 1.7.7)

Anker: Branch preview, Version 1.6.7, Schema 8, 295 Tests, HEAD 441c8e9. main/origin bei e0cd3e5.

| Paket | Stand | Tests |
|---|---|---|
| C0 Info-Grafik (1.7.0) | fertig, Tag v1.7.0 | 299 |
| C1 Einmaleins-Grenze (1.7.1, Schema 9) | fertig, Tag v1.7.1 | 322 |
| C2 Neue Aufgabenarten (1.7.2) | fertig, Tag v1.7.2 | 331 |
| C3 Baukasten (1.7.3, Konto 10, global 5) | fertig, Tag v1.7.3 | 345 |
| C4 Vorlage 9er Reihe (1.7.4) | fertig, Tag v1.7.4 | 351 |

Entscheidungen:
- C0: Zoom über Tasten + und − (3 Stufen, Bild in einem scrollbaren Rahmen), weil Seitenzoom im Vollbild-Overlay auf dem iPad unzuverlässig ist. Quelle war 1672 px breit, verkleinert auf 1600 px (Qualität 80, 364 KB). Alte Versionstests auf 1.7.0 gezogen, Bildlisten-Tests kennen die JPG.
- C1: Grenze als Modulzustand in mul.js (setMul in S()), damit kein Generator-Aufruf umgebaut werden muss. Regel: eine der beiden Zahlen liegt in den Reihen, die andere ist 1 bis 10 (0 nur mit Schalter). Bezirksliga-Themen und Rechnen bis 1000 bleiben ausgenommen (Ergebnis über 100 nicht vereinbar). Nur Reihe 1: Teiler für Aufgaben mit Rest fällt auf den üblichen Bereich zurück (Rest muss kleiner als Teiler sein). Trainingslager-Ergebnisse jetzt höchstens 10. Die Ende-zu-Ende-Tests (v14e2e, v154-e2e) sind unter Last gelegentlich zeitlich knapp (4 s), einzeln laufen sie.
- C2: Erweiterung von m3_1x1 statt neues Thema (kein Eingriff in TOPICS_AT_8, Aufstieg, Themenliste). Neue Aufgabenart `slots` (n Zahlenfelder) statt Erweiterung von pair. Abwechslung nur über Option (variety, rowPack), damit Mini-Spiele und Trainingslager unberührt bleiben. Flakige Ende-zu-Ende-Tests (liefen unter Last zu früh, seit schwerere Tests parallel laufen) warten jetzt auf den Server-Abgleich; v171 leichter gemacht.
- C3: Lager aus Vorlagen als dynamische Einträge in CAMPS ("c:<Nr>"), damit der gesamte bestehende Ablauf (Halbzeiten, Sichern, Abzeichen, Neustart) unverändert trägt. Mitgelieferte Vorlage "Teilen mit Rest" bleibt das fest eingebaute Lager (Fortschritt unter m3_rest, keine Datenmigration nötig), erscheint in der Liste und ist kopierbar. Vorlage wird beim ersten Abschluss einer Einheit im Konto eingefroren (def), Neustart löscht sie. Nachspielzeit Mini-Spiele bekommen Aufgaben aus dem Lager (src), Memory fällt ohne Rechenaufgaben auf den Mix zurück. Vorlage löschen: Löschmarke, Lager mit Fortschritt bleiben beim Konto. Kein Wechsel zwischen den Einheiten im Schwierigkeitsgrad außer Englisch-Stufe und wechselndem Schwerpunkt. Lager-Nummern enthalten einen Doppelpunkt: Handler für data-camp und campreset angepasst (lastIndexOf, indexOf).
- C4: Vorlage als fester Eintrag in BUILTIN_TEMPLATES (kein Datensatz im globalen Stand, daher keine Migration, nicht löschbar). Päckchen-Einheit 12 bis 16 Aufgaben unabhängig von half. Kopie für andere Reihe sofort angelegt (ohne Editor) und über die Liste änderbar. Ende-zu-Ende über die Oberfläche spielt alle fünf Einheiten, damit auch die Zahlenfelder (slots) im echten Ablauf getestet sind. Bekannte Eigenheit: Übt ein Konto die 9er Reihe nicht, nimmt die 9er-Vorlage dessen Reihen (nie erweitern), der Name bleibt dann "9er Reihe".
- 1.7.5 (Nachbesserung nach Marcos erster Prüfung): Passkette mit festem Anpfiff, 9er Reihe 5 je Halbzeit, Päckchen im Lager folgt der Einstellung, Beschriftung Kopieren für andere Reihe.
- 1.7.6: Aufgaben je Halbzeit (3 bis 20) direkt in der Vorlagenliste einstellbar.
- 1.7.7: Editor des Baukastens in Schritten (Anzahl, Fächer, Themen je Fach, Reihen nur bei Bedarf, Nachspielzeit, Name), Vorlagen zurückholen, Alle Reihen anschalten.

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
