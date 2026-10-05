Cross-Handover cowork nach claude-code, 2026-10-05.
Modus: bauen. Stufe: voll.
Projekt: Torjäger-Liga (Fußball-Lernspiel für Emil). Repo: C:\AI\_MBrain Data\Projects\Torjaeger-Liga (GitHub 1984MaHa/torjaeger).
Stand: preview hat 1.6.0 bis 1.6.7 (Tags lokal), Schema 8, 295 Tests. main/origin standen zuletzt bei e0cd3e5 (1.5.5), Push und Deploy von 1.6.7 macht Marco.

BUDGET-MODUS (gilt für die ganze Sitzung, wie beim letzten Auftrag)
- PAKETE strikt der Reihe nach. Jedes Paket: kurz prüfen, bauen, Tests, node --test grün, committen auf preview, Tag setzen.
- Nach JEDEM Paket .handover\progress.md und return.md aktualisieren und mit committen. Jeder Commit lauffähig, Unfertiges hinter Schalter oder nicht committen.
- Sparsam lesen, keine langen Chat-Zusammenfassungen, kein Browser, keine Screenshots. Keine Rückfragen außer bei echten Blockern; Entscheidungen in progress.md festhalten.
- Neue Sitzung nach Abbruch: progress.md lesen, beim nächsten offenen Paket weitermachen.

ANKER, zuerst gegenprüfen, nicht arbeiten:
Diese Sitzung gehört NUR zum Repo C:\AI\_MBrain Data\Projects\Torjaeger-Liga. Steht die Sitzung woanders (z. B. TopDesk-SLA-Dashboard): sofort stoppen, nichts ändern, Marco Bescheid geben.
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" branch --show-current   -> erwartet preview
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" log --oneline -1         -> erwartet 441c8e9
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" log --oneline -1 main    -> erwartet e0cd3e5, oder 441c8e9 falls Marco 1.6.7 inzwischen freigegeben hat (dann in return.md festhalten)
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" status --short           -> erwartet genau: ?? .handover/next.md
grep APP_VERSION app/js/version.js -> erwartet 1.6.7
Erster Commit: next.md nach current.md verschieben (überschreiben), progress.md für diesen Auftrag neu beginnen (alte Tabelle als Abschnitt "Vorheriger Auftrag" behalten), committen.
Bei Abweichung: nicht anfangen, Marco fragen.

LIES ZUERST (knapp): CLAUDE.md, SPEC.md (Datenmodell, Trainingslager camps, Sondertraining, Themen-Zustände, Mini-Spiele), Kopf von CHANGELOG.md und return.md. Code nur paketweise.

LEITBILD: Freude am Lernen und Wiederholen vor Perfektion, lehrplannah, kein didaktischer Umbau. Grundregeln: Updates setzen nie einen Stand zurück (Schemaversion plus Migration plus Fixture-Test, Mindeststruktur mitziehen, Unbekanntes erhalten), Fragen eindeutig, Texte ohne Gedankenstriche, Version an allen vier Stellen, neue Dateien in FILES von sw.js. Name "Trainingslager" für Lager, nie "Trainingscamp" (das ist die Liga für Klasse 2).

PAKET C0 (Version 1.7.0): Info-Grafik hinter einem Fragezeichen (war im letzten Auftrag Paket A1 und wurde übersprungen).
- Quelle: C:\Users\marco.haufe\Downloads\TorjägerLiga.jpg (16:9, 2,2 MB). Original nach assets-src\, für die App verkleinert (Breite etwa 1600 px, unter 400 KB), in FILES.
- Startseite "Wer spielt?": runde Taste "?" oben rechts (mindestens 44 px). Öffnet die Grafik bildschirmfüllend, zoombar, Schließen-Taste, Alternativtext "Überblick: Was die Torjäger-Liga ist und wie sie aufgebaut ist". Keine PIN. Test: Datei in FILES, Taste, Öffnen und Schließen.

PAKET C1 (Version 1.7.1): Einmaleins-Grenze je Konto (Entscheidung Marco: je Konto, ein Lager kann weiter einengen, nie erweitern).
- Eltern-Bereich je Konto: "Einmaleins" mit Reihen-Auswahl 1 bis 10 (Standard alle), Schalter "auch mal 0" (Standard an), Ergebnis höchstens 100 (fest), Faktor höchstens 10.
- ALLE Aufgaben mit Mal und Geteilt halten sich daran: Einmaleins, Teilen mit Rest (Teiler aus den gewählten Reihen, Ergebnis höchstens 10, Rest kleiner als Teiler), Sachaufgaben mit Mal/Geteilt, Kontroll-Pfiff, Trainingslager, Sondertraining, Mini-Spiele, Mix. Plus/Minus (Rechnen bis 1000) bleibt unberührt.
- Datenmodell: nächste Konto-Schemaversion mit Migration (Standard: alle Reihen, 0 an). Tests: über viele Zufallsläufe je Generator keine Aufgabe außerhalb der Grenze, auch mit nur einer gewählten Reihe (z. B. nur 9).

PAKET C2 (Version 1.7.2): Neue Aufgabenarten nach Emils Hausaufgabe "Die 9er Reihe" (Arbeitsblatt), für JEDE Reihe nutzbar, Fußball-Optik.
Vorbild auf dem Blatt: (1) Bilder mit 1 bis 10 Säcken zu je 9 Orangen, Kind schreibt die Malaufgabe (1 · 9 = 9). (2) Zahlen der 9er Reihe in eine Kette von Kreisen schreiben, ein Wert (18) ist vorgegeben. (3) Rechenkreise: Mitte "· 9", innerer Ring Zahlen 0 bis 10, äußerer Ring leer zum Ausrechnen; zwei Kreise umgekehrt: äußerer Ring zeigt Ergebnisse (27, 90, 0, 18, 81, 45, 63, 72), innen fehlt der Faktor. (4) 16 gemischte Aufgaben mit Tauschaufgaben, 0 und 10 (1 · 9, 9 · 2, 0 · 9, 9 · 0, 10 · 9, 9 · 10 ...).
Umsetzen als:
- a) "Ballsäcke": Bild mit n Ballsäcken (bzw. Netzen) zu je k Bällen, die Zahl k steht gut sichtbar auf dem Sack; Kind baut die Malaufgabe n · k und das Ergebnis (zwei Eingaben). Säcke klar zählbar.
- b) "Passkette": Kette von 10 Kreisen (Spieler, die sich den Ball zupassen) mit der Reihe k bis 10 · k, ein oder zwei Werte vorgegeben, Lücken ausfüllen. Variante mit 0 am Anfang.
- c) "Rechenkreis vorwärts": Kreis mit "· k" in der Mitte, 8 Zahlen innen, Ergebnisse außen eintragen. d) "Rechenkreis rückwärts": Ergebnisse außen gegeben, Faktor innen finden (Vorstufe zum Teilen). Als Zielscheibe oder Torwand-Rund gestalten, auf dem iPad gut tippbar.
- e) "Päckchen Reihe": 12 bis 16 gemischte Aufgaben der Reihe inklusive Tauschaufgabe, mal 0, mal 1, mal 10, als Päckchen mit Kontroll-Pfiff-Option.
- Neues Mathe-Thema "Einmaleins-Reihen" (Kreisliga) bzw. Erweiterung von m3_1x1, je nach Code-Lage; die Reihen kommen aus der Einmaleins-Grenze (C1). Alle Arten auch im Baukasten (C3) wählbar. Tests: Eindeutigkeit, Grenzen, jede Art für jede Reihe 1 bis 10 lösbar.

PAKET C3 (Version 1.7.3): Baukasten "Eigenes Trainingslager" im Eltern-Bereich (Entscheidung Marco: mittlere Flexibilität).
- Eltern stellen ein Lager zusammen: Name (z. B. "9er Reihe"), Themen und Aufgabenarten (aus allen Fächern, inklusive der neuen aus C2), Reihen bzw. Zahlenraum (engt die Konto-Grenze nur ein), Anzahl Einheiten 1 bis 5, Aufgaben je Halbzeit 5, 10 oder 15, Nachspielzeit-Mini-Spiel (Elfmeterschießen, Torwand, Memory, Dribbel-Parcours, Überraschung, keins).
- Speichern als Vorlage, kopieren, umbenennen, löschen (mit Rückfrage), je Konto einschalten und ausschalten. Mehrere Lager je Konto möglich, jedes aktive Lager bekommt eine eigene Kachel. Neustart eines Lagers wie bisher.
- Vorlagen gelten für alle Konten (global, abgeglichen), Fortschritt je Konto. Das bestehende Lager "Teilen mit Rest" wird zur mitgelieferten Vorlage (Fortschritt bleibt erhalten, Migration).
- Ablauf je Einheit wie das bisherige Trainingslager (2 Halbzeiten, Pause, Abpfiff, Sichern und Fortsetzen, Abzeichen am Ende des Lagers). Einheiten mischen die gewählten Arten; bei mehreren Einheiten steigt die Schwierigkeit leicht oder die Arten wechseln, das darf Code entscheiden.
- Datenmodell: globale und Konto-Schemaversion hoch, Migration, Merge-Regeln wie bei camps, Tests (Migration, Abgleich zweier Geräte, Vorlage ändern während ein Kind mitten im Lager ist: laufendes Lager bleibt unverändert bis Neustart).

PAKET C4 (Version 1.7.4): Mitgelieferte Vorlage "9er Reihe" (ausgeschaltet), 5 Einheiten: 1 Ballsäcke, 2 Passkette, 3 Rechenkreis vorwärts, 4 Rechenkreis rückwärts, 5 Päckchen Reihe mit Kontroll-Pfiff; Nachspielzeit Elfmeterschießen. Dieselbe Vorlage mit einem Klick "für andere Reihe kopieren" (Reihe wählen, Name passt sich an).

NICHT-ZIELE
- Keine Änderungen an Deutsch-, Englisch-, Sachkunde-Inhalten, Avatar, Ligen-Aufbau.
- Kein Merge nach main, kein Push, kein Deploy ohne Marcos ausdrückliches Wort (dann festhalten). Nichts im Vault schreiben.

ENTSCHIEDEN
- Einmaleins-Grenze je Konto plus je Lager (nur einengen), Ergebnis höchstens 100 (Marco, 05.10.2026).
- Baukasten mittlere Flexibilität wie beschrieben (Marco, 05.10.2026).
- Hausaufgabe "Die 9er Reihe" als Spiel umsetzen (Marco, 05.10.2026).

OFFEN, darf Code entscheiden
- Gestaltung der neuen Aufgabenarten, Bildmotive (Säcke, Netze), Steigerung über Einheiten, Texte, Abzeichen-Namen.

ABNAHME (je Paket)
- node --test grün, neue Tests zum Paket, Fixture-Migration bei Datenänderung, progress.md und return.md aktuell, Tag gesetzt, Arbeitsbaum sauber.
- Am Ende (oder beim Abbruch) Prüfliste für Marco in return.md, mit den Befehlen für Push, Vorschau und Live (Live nur auf seinen Wunsch).

DOKU-ZUSTÄNDIGKEIT
Repo trägt die Wahrheit über den Code. Vault pflegt Cowork. Rückübergabe laufend in .handover\return.md und als Block laut CLAUDE.md, mit allem, was Marco selbst ausgeführt oder angewiesen hat, Stand main/preview/origin, Tags, Vorschau und Live auf der NAS.

ERSTER SCHRITT
Anker prüfen, nicht arbeiten. Danach ohne weitere Rückfrage mit C0 beginnen, sobald Marco "los" sagt.
