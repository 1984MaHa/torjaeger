# Rückübergabe claude-code nach Cowork

**Stand:** 2026-09-30
**Von:** claude-code
**An:** cowork
**Auftrag:** Version 1.4.0 (Englisch und Sachkunde). Modus bauen, Stufe voll

```
Rückübergabe claude-code nach cowork, 2026-09-30.
Projekt: Torjäger-Liga. Auftrag 1.4.0 (Englisch und Sachkunde, vier neue Aufgabenarten, Vorlesen, Themensteuerung) ist gebaut, getestet und lokal auf preview committed. NICHT gepusht, NICHT deployed, NICHT im Browser angesehen (siehe 1 und 6).

1. WAS MARCO IN DIESER SITZUNG SELBST AUSGEFÜHRT HAT
- Nichts. Marco hat nur den Start freigegeben ("ja los" nach der Ankerprüfung). Kein Push, kein Merge, kein Branch-Wechsel, keine Befehle auf der NAS, keine Tests auf iPad oder iPhone, keine Anweisung zu main oder Live.
- Ausdrücklich NOCH NICHT ausgeführt: Push von preview, Vorschau-Deploy auf der NAS, Abnahme auf dem iPad (auch die von 1.2.1 und 1.3.0), Kontrolle von Emils migriertem Stand, Prüfung von docs/Inhalte-Englisch-Sachkunde.md durch Marco. main und Live sind unberührt (Live läuft weiter 1.2.1).
- Ich habe die Seite bewusst nicht im Browser oder in der Vorschau geöffnet und keine Screenshots gemacht (Wunsch von Marco, er prüft visuell selbst). Die neuen Ansichten sind nur per Test geprüft: HTML-Ausgabe und eine Ende-zu-Ende-Prüfung der echten app.js mit Fake-DOM. Das Aussehen (CSS, Emoji-Darstellung auf iOS, Kompassrose) ist nicht mit dem Auge gesehen.

2. STAND JE UMGEBUNG
- Anker am Start stimmten alle: preview 81eb864, origin/preview 81eb864, main adb3c07, Arbeitsbaum nur M .handover/current.md.
- preview (lokal): Commit mit Version 1.4.0 (siehe Anker unten) auf 81eb864. origin/preview steht noch auf 81eb864 (nicht gepusht).
- main und origin/main: adb3c07, unverändert. Live läuft 1.2.1, die Vorschau läuft (soweit bekannt) 1.3.0 mit Nachbesserung.
- Version 1.4.0 steht an allen vier Stellen (app/js/version.js, VERSION in app/sw.js, SERVER_VERSION in server/server.js, version in package.json). Neue Dateien in FILES von sw.js: content-en.js, content-su.js, inputs.js, speech.js, tasks.js (Test prüft es).
- Zu 81eb864: CHANGELOG (Abschnitt 1.3.0, Absatz "Nachbesserung") und SPEC (Avatar, Baukasten, Migration) enthalten die Nachbesserung bereits. Es war nichts nachzutragen, ich habe es im CHANGELOG 1.4.0 nur erwähnt. return.md hatte sie nicht erwähnt, das ist mit dieser Datei erledigt (Bäckchen, Zöpfe, Haarkappe, Halbzopf, Cap, Kleidungs-Vorschau, weniger Scrollen, Emil nachbaubar).

3. WAS UMGESETZT IST (Auftragspunkte)
- Neue Aufgabenarten für alle Fächer (inputs.js, tasks.js, check.js): Zuordnen (match), Bild wählen (pic, auch als Kompassrose zum Antippen), Sortieren (sort), Reihenfolge (order). Nur Antippen. Zuordnen: Paare bekommen dieselbe Farbe, nochmal antippen löst das Paar, Fertig wertet aus, Tor nur wenn alle Paare stimmen, falsche Paare werden danach gezeigt. Statistik je Begriff. Probe bei Zuordnen und Sortieren: "Schau dir jedes Paar noch einmal an". Beim Ändern im Päckchen ist die Antwort vorbelegt.
- Englisch (Kreisliga): 10 Themen, 10 bis 14 Wörter je Thema (content-en.js), drei Stufen (Bild wählen, Zuordnen englisch zu deutsch, Bild zur Schreibweise mit zwei falschen Schreibweisen, die keine Wörter der Liste sind). Farben als Farbkästen, Zahlen als große Ziffern, sonst Emoji.
- Sachkunde (Kreisliga): 7 Themen, je 5 bis 7 Aufgabenvorlagen (content-su.js), zufällige Auswahl von Paaren, Karten und Schritten je Aufgabe.
- Vorlesen (speech.js): 🔊 nur nach Antippen, en-GB bevorzugt, sonst en-US, sonst jede englische Stimme. Hör-Aufgabe (20 Prozent der Englisch-Aufgaben). Ohne englische Stimme sind Taste und Hör-Aufgaben weg. Stimmen, die das iPad verspätet lädt, lösen über voiceschanged ein Neuzeichnen aus.
- Kreisliga-Karte: Tasten Englisch und Sachkunde mit Mix und Themenblöcken (Päckchen mit 4 Aufgaben, Kontroll-Pfiff, Probe). Mix-Spiel nur Mathe und Deutsch. Trainingscamp und Bezirksliga ohne die neuen Fächer. Häkchen, Punkte, Sticker zählen normal, Aufstieg nur Mathe und Deutsch.
- Themensteuerung (Eltern-Bereich, Reiter Einstellungen): je Konto und Thema aller Ligen und Fächer aktuell, wiederholen, aus. Wiederholen: Gewicht mal 0,35. Aus: nicht im Mix, nicht in Listen, Chips, Trainerbank. Ausgeschaltete Mathe/Deutsch-Themen blockieren den Aufstieg nicht.
- Eltern-Lernstand: auch Englisch (mit Stufe) und Sachkunde, Markierung (aus), (wiederholen), Liste der schwächsten Begriffe.
- Datenmodell: Schemaversion 5 (Konto), global 3. Migration 4 nach 5 ergänzt settings.topicMode ({}). Neue Felder: stats.<Thema>.lv, stats.<Thema>.terms (je Gerät, Schlüssel "a:Begriff" und "c:Begriff"), last[].lv, Spielarten eng und su im Verlauf. Merge: Einstellungen neuester gewinnt, lv höherer Wert, terms je Gerät Maximum, angezeigt die Summe.
- docs/Inhalte-Englisch-Sachkunde.md: vollständig, erzeugt mit node tools/inhalte-liste.mjs aus den Datendateien, unsichere Stellen markiert ("unsicher").
- SPEC.md, CHANGELOG.md (1.4.0), README.md, CLAUDE.md (Schemaversion 5) aktualisiert.

4. ENTSCHEIDUNGEN, ABWEICHUNGEN
- Stufenschwelle Englisch: 8 von 10 richtig in der aktuellen Stufe (wie MASTER_K von MASTER_N). Stufe steigt pro Thema, sinkt nie (Merge nimmt den höheren Wert). Das Häkchen je Englisch-Thema verlangt Stufe 3 und "sicher".
- Stufe steht als stats.<Thema>.lv, nicht in progress. Dadurch keine eigene Merge-Regel außer Maximum.
- Themensteuerung liegt in settings.topicMode (ein Schlüssel je Thema, fehlt = aktuell). Sie gehört damit zu den Einstellungen und wird als Ganzes vom neueren Stand gewonnen, nicht je Thema. Bei zwei Geräten, die gleichzeitig verschiedene Themen umstellen, gewinnt das spätere. Das ist dieselbe Regel wie für Tipp-Zeit und Co.
- Päckchengröße Englisch und Sachkunde: 4 (Zuordnen und Sortieren dauern länger). Paare je Zuordnen 3 bis 5 (Englisch 4 bis 5), Karten je Sortieren 4 bis 8 (Sachkunde 5 bis 8, je nach Vorlage), Körbe 2 oder 3.
- Alle Ausgaben, die nach "Ligen" fragen (topicsOf, safeCount, mastered), bleiben bei Mathe und Deutsch. Neu: allTopicsOf (alle Themen), gateTopics (Aufstieg, ohne "aus"), poolOf (Mix = nur Mathe und Deutsch).
- Sind alle Mathe/Deutsch-Themen einer Liga "aus", gilt die Liga NICHT als durchgespielt (mastered verlangt mindestens ein aktives Thema), sonst gäbe es einen Aufstieg ohne Leistung. Marco bitte bestätigen.
- Bilder unsicher (Marco prüft, siehe Liste): Familie (Mutter, Vater, Schwester, Bruder als Frau, Mann, Mädchen, Junge), friend, home, arm, Jahreszeiten und Wetter (spring Tulpe, summer Strand, autumn Laub, winter Schneemann, hot, cold, storm), teacher, game, painting, music. Kein Emoji über Unicode 13 (Test mit Bereichsliste der Versionen 14 und 15).
- Wo ein Emoji nicht eindeutig ist, steht es nicht in der Liste (zum Beispiel kein eigenes Bild für head, man, woman, hair).
- Kartenzeichen in Sachkunde (Kirche, Bahnhof, Schule, Krankenhaus, Schwimmbad, Stopp, Kinder, Ampel, Fahrrad) sind Emoji, keine echten Karten- oder Verkehrszeichen. Kartenfarben (Blau, Grün, Braun, Gelb) sind vereinfacht. Beides in der Liste als unsicher markiert. Igel/Reh/Fuchs/Hase als Lebensraum sind vereinfacht.
- Fehler im Test aufgedeckt und behoben: ein Farbkasten "#222222" wurde als Ziffer gelesen (Schwarz). Ein Tipp hatte die Lösung genannt (Sonne geht im Osten auf). Tipps prüft jetzt ein Test für alle neuen Aufgabenarten gegen alle Lösungsteile.
- Verworfen: Drag-and-drop (Auftrag), echte Verkehrszeichen-Grafiken (Emoji laut Auftrag), Englisch im Gesamt-Mix (Auftrag).

5. RESTPOSTEN
- Echter Blocker: keiner.
- Bewusst offen: Avatare auf Vorlagen (pausiert); iPad-Abnahme 1.2.1, 1.3.0, 1.4.0; Emojis und Layout der neuen Ansichten auf dem iPad sehen; Prüfung der Inhalte durch Marco und eine englischkundige Person (Konzept Abschnitt 11: natürliches, altersgerechtes Englisch, hier nur Einzelwörter); Kontrolle von Emils migriertem Stand; Hyper Backup; Testrunden in Emils Konto; Zwischenspeichern laufender Päckchen; Push und Deploy der Vorschau.
- Kosmetisch: Sticker-Motive einfach; Tailscale auf der NAS 1.58.2. Neu: Tippflächen der neuen Aufgabenarten und die Kompassrose sind nur per CSS geplant, nicht am Gerät geprüft. Englisch hat keine Mehrwort-Begriffe und keine Sprechen-Aufgaben (Konzept 7.1 E3-SP). Hör-Aufgabe nur als Bildauswahl.

6. TESTS
- node --test: 160 Tests grün (vorher 135). Neu: test/v14.test.mjs (24 Tests: Migration 4 nach 5 mit Fixture test/fixtures/state-v4.json, Inhalte und Eindeutigkeit der Emoji, Partner und Schreibweisen, alle Themen und Stufen mit je 120 bis 400 Stichproben, Zuordnen richtig und falsch und Paar lösen, Sortieren, Reihenfolge, Bild wählen, Kompassrose, Vorlesen mit und ohne Stimme, Themensteuerung, Aufstieg ohne Englisch und Sachkunde, Stufenwechsel, Begriffsstatistik, Merge, Ansichten, Eltern-Bereich, Dateien) und test/v14e2e.test.mjs (echte app.js mit Fake-DOM gegen echten Server: Kreisliga freigeben, Englisch ohne Stimme, Stimme kommt später, 🔊 antippen, Päckchen mit allen vier neuen Aufgabenarten, Probe, Antwort ändern, Kontroll-Bonus, Eltern-Themensteuerung und Abgleich mit dem Server). Bestehende Tests nur auf Schema 5 angepasst (Erwartungswerte 4 nach 5, settings mit topicMode).
- Zwei Zeitprobleme in den Tests gefunden und behoben: (1) v14e2e erzwang eine Zuordnung, die mit Stimme in 1 von 5 Fällen eine Hör-Aufgabe wurde (Test, nicht App); (2) der alte e2e.test.mjs wartete nicht auf das Spielende beim Server und scheiterte unter Last im parallelen Lauf (Wartestelle jetzt mit Abfrage). Danach 10 Gesamtläufe hintereinander grün (160 von 160).

7. ANKER
- Branch: preview. Commit: siehe git log -1 (Version 1.4.0 a9f8e50, darauf ein Korrektur-Commit für die Tests, baut auf 81eb864 auf). Arbeitsbaum: sauber nach dem Commit. origin/preview: 81eb864 (nicht gepusht). main: adb3c07.

8. NÄCHSTE SCHRITTE FÜR MARCO
1. Die Liste docs/Inhalte-Englisch-Sachkunde.md lesen, besonders die mit "unsicher" markierten Stellen, und Korrekturen an Cowork oder hierher zurückgeben.
2. Push von preview (nur auf deine ausdrückliche Anweisung, ich habe nicht gepusht):
   git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" push origin preview
3. Vorschau auf der NAS aktualisieren (Ordner torjaeger-preview):
   sudo sh deploy.sh
4. Auf dem iPad in der Vorschau prüfen: Kreisliga freigeben, Englisch und Sachkunde spielen, 🔊 (Stimme vorhanden?), Zuordnen, Sortieren, Reihenfolge, Kompassrose, Eltern-Bereich Einstellungen Themensteuerung, und ob Emils Stand unverändert ist.
5. Entscheiden: bei "alle Mathe/Deutsch-Themen aus" kein Aufstieg von selbst (so gebaut), und ob Sachkunde/Englisch später doch in Mix und Probe-Liga einfließen sollen.
```
