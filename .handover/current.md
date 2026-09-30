# Cross-Handover

**Stand:** 2026-09-30
**Von:** cowork
**An:** claude-code
**Stufe:** voll
**Modus:** bauen

Inhalt identisch mit dem kopierfertigen Block. Anker: baab42f auf preview, main 882d8e1.

```
Cross-Handover cowork nach claude-code, 2026-09-30.
Modus: bauen. Stufe: voll.
Projekt: Torjäger-Liga (Fußball-Lernspiel Mathe/Deutsch für Emil, 3. Klasse). Repo: C:\AI\_MBrain Data\Projects\Torjaeger-Liga (GitHub 1984MaHa/torjaeger). Live läuft 1.1.5 (main), Vorschau-Klon auf der NAS existiert.

ANKER, zuerst gegenprüfen, nicht arbeiten:
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" branch --show-current   -> erwartet preview
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" log --oneline -2          -> erwartet oben baab42f "CLAUDE.md: vollständige Rückübergabe an Cowork", darunter 882d8e1
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" log --oneline -1 main     -> erwartet 882d8e1 (Live 1.1.5)
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" status --short            -> erwartet genau: M .handover/current.md (dieser Auftrag)
Bei anderer Abweichung: zurückweisen und als Prüfauftrag an Cowork zurückspielen.

LIES ZUERST, in dieser Reihenfolge:
1. C:\AI\_MBrain Data\Projects\Torjaeger-Liga\CLAUDE.md (inkl. Pflichtregel "Rückübergabe an Cowork")
2. C:\AI\_MBrain Data\Projects\Torjaeger-Liga\SPEC.md und CHANGELOG.md (Stand 1.1.5)
3. C:\AI\_MBrain Data\Projects\Torjaeger-Liga\.handover\current.md (dieser Auftrag als Zettel)
4. C:\AI\_MBrain OS\MyBrain\Projects\Torjaeger\specs\Torjaeger-Plan.md (Abschnitt "G. Anpassungen nach Testlauf 30.09.2026")
5. C:\AI\_MBrain OS\MyBrain\Projects\Torjaeger\specs\Lehrplan-und-Aufgabenkonzept-Klasse-3.md (nur Abschnitte 3.4 Hilfestufen, 3.5 Aufgabenformen PRO/SCH, 10 Rückmeldungen; Hintergrund, kein Umsetzungsauftrag)
6. app\js\content.js, rules.js, views.js, app.js, generators.js

AUFTRAG
Anpassungen nach Marcos Testlauf am 30.09.2026 als Version 1.2.0 auf Branch preview: Fokus auf die aktuelle Liga, Umbenennung Bambini-Liga zu Trainingscamp, Spielauswahl je Fach (Mix oder gezielter Themenblock), unterschiedlich gestaltete Sticker mit Jubelrufen, und ein Kontroll-Schritt im Stil von Emils Arbeitsblättern. Lokal testen, auf preview committen, Rückübergabe schreiben. Nicht nach main mergen.

1. FOKUS AUF DIE AKTUELLE LIGA
- Nur die aktuelle Liga ist groß dargestellt (Themen mit Status, Spielauswahl, Fortschritt).
- Alle anderen Ligen nur als schmale, eingeklappte Zeile: Name, Klasse, Status (gesperrt, Schnuppern möglich, Probetraining, frei, durchgespielt). Antippen klappt sie auf; Schnuppern und Wechsel dorthin bleiben möglich.
- "Aktuell" = höchste freie Liga als Vorgabe; das Kind kann jede freie Liga als aktuell wählen (wird im Konto gespeichert, Merge: neuester gewinnt).

2. UMBENENNUNG
- "Bambini-Liga" heißt jetzt "Trainingscamp" (Stoff Klasse 2), überall in App, Texten, Eltern-Bereich, Doku. Kreisliga (Klasse 3) und Bezirksliga (Klasse 4) bleiben.
- Interne ID L1 bleibt, keine Datenmigration nur wegen des Namens. Freischaltlogik unverändert.

3. SPIELAUSWAHL JE FACH
- Tippen auf "Mathe" öffnet darunter: "Mix: alles aus Mathe" plus je ein Themenblock pro Mathe-Thema der Liga (Name, Häkchen bei "sicher", optional kleine Fortschrittsanzeige). Gleiches für "Deutsch". Das fachübergreifende Mix-Spiel bleibt.
- Themenblöcke zählen normal für Punkte, Sticker, Statistik und Aufstieg.
- Mix bleibt adaptiv (schwache Themen öfter).

4. STICKER MIT JUBELRUFEN
- Jeder der 24 Sticker sieht anders aus: eigene Farbe/Farbverlauf, eigene Form (z. B. rund, Stern, Schild, Wimpel, Sechseck, Banner), eigenes kleines Motiv (eigene SVG-Zeichnung, keine Vereinslogos).
- Großer Text je Sticker: ein motivierender Jubelruf oder witziges Wort (z. B. "Tooor!", "Volltreffer!", "Wahnsinn!", "Ballzauber!", "Kracher!", "Knaller-Kicker!", "Hammer!", "Weltklasse!", "Jaaa!", "Supertor!" usw., 24 verschiedene, kindgerecht, keine Gedankenstriche). Der bisherige Fußballbegriff (z. B. "Hattrick") steht klein darunter (Entscheidung Marco).
- Bereits gesammelte Sticker bleiben erhalten (nur Aussehen ändert sich).

5. KONTROLLIEREN ÜBEN (Kontroll-Pfiff)
Anlass: Emils aktuelles Hausaufgabenblatt "Dividieren mit Rest" (von Cowork ausgewertet): alle 36 bearbeiteten Aufgaben richtig, viele Überschreibungen beim Schreiben, aber kein Feld "Ich habe kontrolliert!" angekreuzt. Kontrollieren als bewusster Schritt fehlt. Das Blatt ordnet Aufgaben in Päckchen zu 3 mit gleichem Teiler und wachsendem Dividenden (32:8, 33:8, 35:8 / 45:9, 47:9, 49:9 / 20:4, 22:4, 26:4).
- Ein Themenblock (Punkt 3) wird als Päckchen gespielt: 3 bis 6 zusammenhängende Aufgaben, während des Päckchens keine Richtig/Falsch-Rückmeldung (Torszene erst nach der Kontrolle).
- Danach der "Kontroll-Pfiff": Übersicht aller eigenen Antworten des Päckchens. Je Aufgabe eine Taste "Probe": Mathe zeigt die passende Umkehraufgabe zum Selbstrechnen (z. B. Teilen mit Rest: "8 · 4 + 2 = ?", Einmaleins: Tauschaufgabe/Umkehraufgabe, Plus/Minus: Gegenaufgabe); Deutsch zeigt die passende Strategie (Verlängern, Ableiten, Artikelprobe, Satzmelodie). Die Probe verrät die Lösung nicht direkt; das Kind rechnet/prüft selbst und darf die Antwort ändern.
- Erst die Taste "Ich habe kontrolliert ✓" beendet das Päckchen; dann Auswertung mit Torszenen je Aufgabe.
- Belohnung: Jeder selbst gefundene und richtig verbesserte Fehler bringt Bonuspunkte und einen eigenen Jubelruf ("Selbst gefunden, stark!"). Unverändert falsche Antworten zählen normal als Fehlschuss. Nicht kontrollieren ist möglich, aber ohne Kontroll-Bonus.
- Statistik: je Konto und Thema "kontrolliert" (Anzahl Kontroll-Pfiffe, benutzte Proben, selbst korrigierte Fehler). Anzeige im Eltern-Bereich unter Lernstand.
- Päckchen-Generatoren im Stil des Blatts, mindestens für Teilen mit Rest (gleicher Teiler, Dividend steigt, Rest wächst oder springt auf 0) und Einmaleins; für weitere Themen sinnvoll zusammenhängende Päckchen, wo passend.
- Mix-Spiele und Freundschaftsspiel bleiben wie bisher mit Sofort-Rückmeldung.

DATENMODELL
- Neue Felder (gewählte aktuelle Liga, Kontroll-Statistik, ggf. Päckchen im history-Eintrag) mit schemaVersion 3 und Migration 2 nach 3 ohne Verlust, Test mit Fixture im Format 1.1.5. Merge-Regeln in SPEC.md (Zähler je Gerät summieren, Auswahl neuester gewinnt).
- Version 1.2.0 an allen vier Stellen (siehe CLAUDE.md). Neue Dateien in FILES von sw.js.

NICHT-ZIELE
- Keine Spielmodi Spiel auf Zeit, Klassenarbeit mit Zeitlimit, Turnier (Phase 3); der Kontroll-Pfiff ersetzt sie nicht.
- Kein Aufgabenkatalog nach Lehrplan-Konzept (Kompetenz-IDs, Status-Stufen), keine neuen Themen außer Päckchen-Varianten bestehender Themen.
- Keine Einführungstour.
- Kein Merge nach main, kein Deploy Live. Vorschau-Deploy nur, wenn Marco es in der Sitzung selbst ausführt (dann in der Rückübergabe festhalten).
- Keine npm-Abhängigkeiten, keine externen Ressourcen, keine Fotos oder Arbeitsblätter ins Repo.

ENTSCHIEDEN, nicht mehr zur Debatte
- Name "Trainingscamp" für die bisherige Bambini-Liga, ID L1 bleibt (Marco, 30.09.2026).
- Nur aktuelle Liga groß, übrige eingeklappt.
- Je Fach: Mix plus Themenblöcke.
- Sticker: 24 verschiedene Designs, Jubelruf groß, Fußballbegriff klein darunter.
- Kontroll-Pfiff mit Probe-Taste, "Ich habe kontrolliert ✓", Bonus für selbst gefundene Fehler; Päckchen-Aufbau wie auf dem Arbeitsblatt (Marco, 30.09.2026). Das Arbeitsblatt selbst wird nicht abgelegt.
- Grundregeln bleiben: Updates setzen nie einen Stand zurück, Hilfe und Probe verraten nie die Lösung, Texte ohne Gedankenstriche.

OFFEN, darf die annehmende Seite entscheiden
- Päckchengröße je Thema (3 bis 6) und ob Päckchen auch im Mix vorkommen (Empfehlung: nein, erstmal nur in Themenblöcken).
- Höhe des Kontroll-Bonus (spürbar, aber nicht höher als ein Tor).
- Gestaltung der eingeklappten Liga-Zeilen und der Fach-Auswahl.
- Konkrete Jubelrufe und Motive.

ABNAHME
- node --test grün, neue Tests: Migration 2 nach 3, Päckchen-Generatoren (Teiler gleich, Werte gültig), Kontroll-Pfiff (Bonus nur für falsch nach richtig verbessert), Probe verrät keine Lösung, Sticker 24 verschieden (Text, Form, Motiv), Umbenennung (kein "Bambini" mehr in app/).
- Startseite zeigt nur die aktuelle Liga groß, andere eingeklappt; Wechsel der aktuellen Liga funktioniert und wird abgeglichen.
- Fachauswahl Mathe/Deutsch mit Mix und Themenblöcken, Themenblock startet ein Päckchen mit Kontroll-Pfiff.
- Album zeigt unterschiedliche Sticker mit Jubelruf und kleinem Fußballbegriff; Emils bisherige Sticker bleiben.
- Eltern-Bereich zeigt Kontroll-Statistik.
- SPEC.md, CHANGELOG.md (1.2.0), README.md aktuell. Arbeitsbaum sauber, alles auf preview.
Tests Pflicht: ja

RESTPOSTEN, kategorisiert
- Echter Blocker: keiner bekannt.
- Bewusst offen: Hyper Backup nicht eingerichtet; Emils Konto im Live enthält noch Testrunden von Marco (entscheidet Marco).
- Kosmetischer Rest: Tailscale auf der NAS 1.58.2.

DOKU-ZUSTÄNDIGKEIT
Repo trägt die Wahrheit über den Code (SPEC.md, CHANGELOG.md, README.md). Vault (C:\AI\_MBrain OS\MyBrain\Projects\Torjaeger\) pflegt Cowork; dort nichts schreiben. Rückweg: Pflicht laut CLAUDE.md, vollständige Rückübergabe nach .handover\return.md und als Block, ausdrücklich mit allem, was Marco in der Sitzung selbst ausgeführt hat (Push, Vorschau-Deploy, Tests), Stand von main/preview/origin, Rückmeldungen und Abweichungen, nächste Schritte einzeln, Befehle unverschachtelt, ohne Heredocs.

ERSTER SCHRITT
Anker prüfen, nicht arbeiten.
```
