# Cross-Handover

**Stand:** 2026-09-30
**Von:** cowork
**An:** claude-code
**Stufe:** voll
**Modus:** bauen

Inhalt identisch mit dem kopierfertigen Block. Anker: 81eb864 auf preview, main adb3c07.

```
Cross-Handover cowork nach claude-code, 2026-09-30.
Modus: bauen. Stufe: voll.
Projekt: Torjäger-Liga (Fußball-Lernspiel für Emil, 3. Klasse, Sachsen). Repo: C:\AI\_MBrain Data\Projects\Torjaeger-Liga (GitHub 1984MaHa/torjaeger). Live läuft 1.2.1 (main), preview enthält 1.3.0 plus Nachbesserung.

ANKER, zuerst gegenprüfen, nicht arbeiten:
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" branch --show-current   -> erwartet preview
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" log --oneline -1          -> erwartet 81eb864 "1.3.0 Nachbesserung: Bäckchen, Zöpfe, ..."
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" log --oneline -1 origin/preview -> erwartet 81eb864
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" log --oneline -1 main     -> erwartet adb3c07 (Live 1.2.1)
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" status --short            -> erwartet genau: M .handover/current.md (dieser Auftrag)
Bei anderer Abweichung: zurückweisen und als Prüfauftrag an Cowork zurückspielen.
Hinweis: .handover/return.md beschreibt nur 2dc3c1b (1.3.0), nicht die Nachbesserung 81eb864. Als ersten Arbeitsschritt CHANGELOG und SPEC prüfen, ob 81eb864 dort steht, und fehlende Punkte nachtragen.

LIES ZUERST, in dieser Reihenfolge:
1. C:\AI\_MBrain Data\Projects\Torjaeger-Liga\CLAUDE.md (Pflichtregel Rückübergabe)
2. C:\AI\_MBrain Data\Projects\Torjaeger-Liga\SPEC.md, CHANGELOG.md, .handover\return.md
3. C:\AI\_MBrain Data\Projects\Torjaeger-Liga\.handover\current.md (dieser Auftrag als Zettel)
4. C:\AI\_MBrain OS\MyBrain\Projects\Torjaeger\specs\Torjaeger-Plan.md (Abschnitt "I. Englisch und Sachkunde")
5. C:\AI\_MBrain OS\MyBrain\Projects\Torjaeger\specs\Lehrplan-und-Aufgabenkonzept-Klasse-3.md (Abschnitte 6 Sachunterricht, 7 Englisch, 8.3, 8.4, 9.1, 11 Qualitätsregeln)
6. app\js\content.js, generators.js, views.js, app.js, check.js

AUFTRAG
Version 1.4.0 auf Branch preview: zwei neue Fächer Englisch und Sachkunde für die Kreisliga (Klasse 3), dafür vier neue Aufgabenarten (Zuordnen in zwei Spalten, Bild wählen, Sortieren in Körbe, Reihenfolge), Vorlesen englischer Wörter mit der Gerätestimme, und im Eltern-Bereich die Steuerung, welche Themen gerade im Unterricht dran sind. Lokal testen, auf preview committen, vollständige Rückübergabe schreiben.

1. NEUE AUFGABENARTEN (für alle Fächer nutzbar)
- Zuordnen: links 3 bis 5 Begriffe, rechts die Partner (Wort, deutsches Wort, Bild oder Farbkasten), gemischt. Links antippen, dann rechts: beide bekommen dieselbe Farbe. Nochmal antippen löst das Paar. "Fertig" wertet aus. Tor nur, wenn alle Paare stimmen; falsche Paare werden danach gezeigt. Statistik je Begriff.
- Bild wählen: Frage oder Wort, 3 oder 4 Bildkacheln (Emoji oder Farbkasten).
- Sortieren: 4 bis 8 Karten in 2 oder 3 Körbe (antippen, dann Korb antippen).
- Reihenfolge: 3 bis 5 Karten der Reihe nach antippen (Nummern erscheinen), Zurücksetzen möglich.
- Große Tippflächen fürs iPad, keine Drag-and-drop-Pflicht.

2. ENGLISCH (nur Kreisliga, Klasse 3)
- Themen: Farben, Zahlen 0 bis 12, Körper, Kleidung, Familie, Schulsachen, Essen und Trinken, Tiere, Hobbys, Wetter und Jahreszeiten. Je Thema mindestens 10 Wörter.
- Drei Stufen je Thema: Stufe 1 englisches Wort zu Bild (Farben als farbige Kästen, sonst Emoji); Stufe 2 englisches Wort zu deutschem Wort (Zuordnen in zwei Spalten); Stufe 3 Bild zu richtiger Schreibweise (eine richtige, zwei falsche Schreibweisen, die sicher keine echten englischen Wörter sind). Stufe steigt je Thema mit dem Lernstand (z. B. Stufe 2 ab 8 von 10 in Stufe 1).
- Vorlesen: Taste 🔊 an jedem englischen Wort, speechSynthesis mit englischer Stimme (en-GB bevorzugt, sonst en-US), nur nach Antippen. Zusätzliche Hör-Aufgabe: Wort wird vorgelesen, passendes Bild antippen. Ist keine englische Stimme vorhanden, Taste und Hör-Aufgaben ausblenden (App bleibt voll nutzbar).
- Natürliches, altersgerechtes Englisch, britische Schreibweise (colour-Wörter nicht nötig, einfache Wörter). Rechtschreibung nur bei vorgegebenen Wörtern.

3. SACHKUNDE (nur Kreisliga, Klasse 3, Themen nach sächsischem Lehrplan laut Konzept Abschnitt 6)
- Sinne und Sinnesorgane (Zuordnen, Schutz der Sinne)
- Pflanzen, Tiere und Lebensräume (Zuordnen Tier zu Lebensraum, Sortieren Pflanze/Tier)
- Getreide (Merkmale Ähre, Rispe, Kolben; Reihenfolge vom Korn zum Brot)
- Kartoffel (Pflanzenteile, Reihenfolge Anbau bis Ernte)
- Wasser (Sortieren fest/flüssig/gasförmig, Reihenfolge Wasserkreislauf, Wasser sparen)
- Himmelsrichtungen und Karte (Kompassrose antippen, Kartenzeichen)
- Sicher im Straßenverkehr als Fußgänger und Radfahrer (Sortieren sicher/gefährlich)
- Fakten müssen stimmen und kindgerecht sein; keine Fragen nach persönlichen Erfahrungen; keine Schockbilder.

4. BILDER
- Emoji von iPad/iPhone als Bildquelle (Entscheidung Marco). Nur Emoji, die eindeutig das Gemeinte zeigen und auf iOS 15 oder neuer sicher vorhanden sind (höchstens Unicode 13). Test: jede Bildkachel einer Aufgabe ist eindeutig verschieden, kein Emoji steht für zwei Wörter derselben Aufgabe.
- Farben als farbige Kästen, keine Emoji.

5. APP-ANSICHT
- In der Liga-Karte der Kreisliga neben Mathe und Deutsch die Tasten Englisch und Sachkunde, jeweils mit Mix und Themenblöcken wie bei Mathe/Deutsch (Themenblöcke als Päckchen mit Kontroll-Pfiff, Probe-Taste zeigt bei Zuordnen/Sortieren "Schau dir jedes Paar noch einmal an" statt Lösung).
- Fachübergreifendes Mix-Spiel nimmt nur Mathe und Deutsch (Englisch/Sachkunde nicht im Gesamt-Mix, eigene Mixe).
- Eigener Fortschritt: Häkchen je Thema, Punkte und Sticker zählen normal. Für den Aufstieg zählen weiterhin nur Mathe und Deutsch (Entscheidung Marco).

6. THEMENSTEUERUNG IM ELTERN-BEREICH
- Je Konto und Thema (alle Fächer): "aktuell", "wiederholen" oder "aus". Vorgabe für alle Themen: aktuell. Mixe und Themenlisten zeigen nur "aktuell" und "wiederholen"; "wiederholen" kommt seltener dran. "Aus" ausgeblendet.
- Für Aufstieg zählen nur Mathe-/Deutsch-Themen, die nicht "aus" sind (ist ein Thema aus, blockiert es den Aufstieg nicht).

7. INHALTE ZUR PRÜFUNG
- Alle Wörter, Emoji-Zuordnungen und Sachkunde-Aufgaben als Datendateien (z. B. app/js/content-en.js, app/js/content-su.js).
- Zusätzlich eine lesbare Liste docs/Inhalte-Englisch-Sachkunde.md (Thema, Wort, Übersetzung, Emoji, Aufgabe, richtige Lösung, falsche Auswahl), damit Marco alles prüfen kann. Wo unsicher, markieren.

DATENMODELL
- Neue Felder (Themensteuerung, Stufe je Englisch-Thema, Statistik je Begriff, neue history-Arten) mit schemaVersion 5 (Konto) und Migration 4 nach 5 ohne Verlust, Test mit Fixture im aktuellen Format. Merge: Einstellungen neuester gewinnt, Zähler je Gerät summieren.
- Version 1.4.0 an allen vier Stellen, neue Dateien in FILES von sw.js.

NICHT-ZIELE
- Keine Avatar-Arbeiten (Thema pausiert; Marco plant fertige Vorlagen, nur in Farben anpassbar; das ist ein späterer eigener Auftrag).
- Englisch und Sachkunde nicht im Trainingscamp und nicht in der Bezirksliga (später).
- Keine Aufnahme eigener Audiodateien, keine externe Sprachausgabe, keine Bibliotheken, keine externen Ressourcen.
- Keine neuen Spielmodi (Zeit, Klassenarbeit, Turnier).
- Kein Merge nach main, kein Live-Deploy, außer Marco weist es in der Sitzung ausdrücklich an (dann in der Rückübergabe festhalten).

ENTSCHIEDEN, nicht mehr zur Debatte
- Englisch und Sachkunde als neue Fächer, methodisch über Zuordnen, Bild wählen, Sortieren, Reihenfolge (Marco, 30.09.2026).
- Englisch in Stufen: Bild, deutsches Wort, Schreibweise.
- Bilder als Emoji; Farben als Farbkästen.
- Vorlesen mit Gerätestimme und Hör-Aufgabe.
- Englisch/Sachkunde zählen nicht für den Aufstieg, eigener Fortschritt.
- Themensteuerung je Konto und Thema: aktuell, wiederholen, aus.
- Grundregeln: Aufgaben immer eindeutig, Hilfe und Probe verraten nie die Lösung, Texte ohne Gedankenstriche, Updates setzen nie einen Stand zurück.

OFFEN, darf die annehmende Seite entscheiden
- Genaue Wortlisten, Emoji und Sachkunde-Aufgaben (nach Qualitätsregeln im Konzept Abschnitt 11).
- Schwelle für Stufenwechsel in Englisch.
- Anzahl Paare/Karten je Aufgabe innerhalb der Grenzen.
- Päckchengröße für die neuen Themen.

ABNAHME
- node --test grün, neue Tests: Migration 4 nach 5, jede neue Aufgabenart (richtig, falsch, Paar lösen), Eindeutigkeit (keine doppelten Emoji oder Partner je Aufgabe, falsche Schreibweisen sind keine echten Wörter der Liste), Themensteuerung (aus = nicht im Mix, blockiert Aufstieg nicht), Aufstieg ignoriert Englisch/Sachkunde, Vorlesen-Taste versteckt ohne Stimme.
- Kreisliga zeigt Englisch und Sachkunde mit Mix und Themenblöcken; Trainingscamp und Bezirksliga nicht.
- Eltern-Bereich: Themensteuerung je Konto funktioniert und wird abgeglichen.
- docs/Inhalte-Englisch-Sachkunde.md vollständig.
- SPEC.md, CHANGELOG.md (1.4.0, inkl. Nachtrag zu 81eb864 falls fehlend), README.md aktuell. Arbeitsbaum sauber, alles auf preview.
Tests Pflicht: ja

RESTPOSTEN, kategorisiert
- Echter Blocker: keiner bekannt.
- Bewusst offen: Avatare auf Vorlagen umstellen (pausiert); iPad-Abnahme 1.2.1/1.3.0; Kontrolle von Emils migriertem Stand; Hyper Backup; Testrunden in Emils Konto; Zwischenspeichern laufender Päckchen.
- Kosmetischer Rest: Sticker-Motive einfach; Tailscale auf der NAS 1.58.2.

DOKU-ZUSTÄNDIGKEIT
Repo trägt die Wahrheit über den Code (SPEC.md, CHANGELOG.md, README.md, docs/). Vault pflegt Cowork, dort nichts schreiben. Rückweg: vollständige Rückübergabe nach .handover\return.md und als Block laut CLAUDE.md, ausdrücklich mit allem, was Marco in der Sitzung selbst ausgeführt oder angewiesen hat, und mit Stand von main/preview/origin.

ERSTER SCHRITT
Anker prüfen, nicht arbeiten.
```
