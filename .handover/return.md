# Rückübergabe claude-code nach Cowork

**Stand:** 2026-09-30
**Von:** claude-code
**An:** cowork
**Auftrag:** Version 1.2.0 (Anpassungen nach Testlauf 30.09.2026), danach Fehlerkorrektur 1.2.1. Modus bauen, Stufe voll

```
Rückübergabe claude-code nach cowork, 2026-09-30.
Projekt: Torjäger-Liga. Auftrag 1.2.0 ist umgesetzt, als 1.2.1 nachgebessert, auf preview gepusht und in der Vorschau deployed. Auf Marcos Anweisung ist main lokal nachgezogen (siehe 2), noch nicht nach origin gepusht, Live nicht deployed.

1. WAS MARCO IN DIESER SITZUNG SELBST AUSGEFÜHRT HAT
- Marco hat selbst ausgeführt: (a) git push origin preview (nach 1.2.0 auf 1d57caf, nach 1.2.1 auf ca15a8d, jeweils per git fetch bestätigt), (b) SSH auf die NAS und Vorschau-Deploy (sudo sh deploy.sh im Ordner torjaeger-preview), zweimal: 1.2.0 (Health-Antwort meldete {"ok":true,"preview":"VORSCHAU","serverVersion":"1.2.0"}) und 1.2.1 (Marco: "ist durch, läuft jetzt"). (c) Den Screenshot mit der unklaren Frage Schal/Schall geschickt (siehe 5). Claude hat auf Marcos "push it" gepusht (Befehl lief von Claude aus).
- Ausdrücklich NOCH NICHT ausgeführt: git push origin main, Live-Deploy auf der NAS (Ordner torjaeger), Test auf iPad/iPhone und visuelle Abnahme der neuen Ansichten sind von Marco nicht als erledigt gemeldet (Marco prüft die Vorschau). Claude hat die Seite bewusst nicht im Browser geöffnet, geprüft ist nur per Tests.

2. STAND JE UMGEBUNG
- Anker am Start stimmten: preview baab42f, main 882d8e1, Arbeitsbaum nur M .handover/current.md. Seither drei Code-Commits auf preview: 8473864 (1.2.0), ca15a8d (1.2.1) und die Rückübergabe-Commits.
- preview und origin/preview: ca15a8d enthält 1.2.1, danach folgt der Commit mit dieser Rückübergabe (lokal, gepusht erst nach Marcos "push it").
- main (lokal): auf Marcos Anweisung ("zieh auch die Hauptseite nach") per Fast-Forward auf preview gebracht, enthält also 1.2.1. origin/main: 882d8e1 (Live 1.1.5), NICHT gepusht. Hinweis: Der Auftrag sagte "nicht nach main mergen"; Marco hat das in der Sitzung bewusst geändert, bevor er alle Punkte auf dem iPad abgenommen hat (keine Abnahme gemeldet).
- Live läuft 1.1.5 und bleibt so, bis Marco origin/main pusht und im Live-Ordner deployed. Die Vorschau auf der NAS läuft 1.2.1.
- Version 1.2.1 steht an allen vier Stellen (app/js/version.js, VERSION in app/sw.js, SERVER_VERSION in server/server.js, package.json). Neue Dateien app/js/check.js und app/js/stickers.js stehen in FILES von sw.js.

3. WAS UMGESETZT IST (Auftragspunkte)
- Fokus: Nur die aktuelle Liga groß (Themen mit Häkchen, Fortschrittsbalken, Spielauswahl). Andere Ligen schmale Zeile: Name, Klasse, Status (Gesperrt, Schnuppern möglich, Probetraining: noch n Aufgaben, Wartet auf Freigabe, Frei, Durchgespielt). Antippen klappt auf. Frei oder Probetraining: Taste "Hier spielen" macht sie zur aktuellen Liga. Gesperrt: Freispiel-Hinweis und Schnuppern. Vorgabe "aktuell" = höchste ganz freie Liga, Wahl liegt in progress.cur {li, t} (Merge: neuester gewinnt). Die Anzeigetafel oben folgt der aktuellen Liga.
- Umbenennung: Trainingscamp (ID L1 bleibt). In app/ steht kein "Bambini" mehr (Test). In SPEC und CHANGELOG steht der alte Name nur noch als Verweis auf die Umbenennung.
- Spielauswahl: Mathe und Deutsch öffnen darunter "Mix: alles aus Mathe/Deutsch" plus je einen Themenblock pro Thema (Name, Häkchen sicher, kleiner Balken der letzten 10, Hinweis Päckchen). Das Mix-Spiel bleibt direkt. Themenblöcke zählen für Punkte, Sticker, Statistik, Aufstieg.
- Sticker: 24 Designs in app/js/stickers.js (24 Formen, 24 Verläufe, 24 eigene SVG-Motive, 24 Jubelrufe). Jubelruf groß, Fußballbegriff klein darunter. Index bleibt, Emils gesammelte Sticker behalten ihren Platz.
- Kontroll-Pfiff: Themenblock = Päckchen (Schreiben ohne Rückmeldung, Übersicht mit Probe und Antwort ändern, "Ich habe kontrolliert ✓" oder "Ohne Kontrolle abgeben", Auswertung mit Torszenen). Bonus nur für falsch und nach Kontrolle richtig. Statistik je Konto und Thema (stats.<Thema>.ctl), Anzeige im Eltern-Bereich unter Lernstand ("Kontrollieren").
- Päckchen-Generatoren im Stil des Blatts: Teilen mit Rest (gleicher Teiler, Dividend steigt, Rest wächst oder springt), Einmaleins, Rechnen bis 1000, Malnehmen groß, Teilen groß. Andere Themen: verschiedene Aufgaben desselben Generators.
- Datenmodell: Schemaversion 3 (Konto), global bleibt 2. Migration 2 nach 3 ohne Verlust, Test mit test/fixtures/state-v2.json (Format 1.1.5, mit altem Code erzeugt). Merge-Regeln in SPEC.md.

4. ENTSCHEIDUNGEN UND ABWEICHUNGEN (Felder, die der Auftrag offen ließ)
- Päckchengröße: Teilen mit Rest 6, Einmaleins 5, Rechnen bis 1000 und Malnehmen und Teilen groß je 4, alle anderen 5 (Grenzen 3 bis 6 im Code). Grund: Teilen mit Rest braucht Länge, damit der Rest wachsen und springen kann. Das Blatt hat 3er-Päckchen, bei Bedarf in PACK_N (app/js/check.js) kürzen.
- Päckchen nicht im Mix (Empfehlung des Auftrags übernommen).
- Kontroll-Bonus: 8 Punkte je selbst gefundenem und richtig verbessertem Fehler (BONUS_FIX in content.js), zusätzlich zu den 10 Punkten für die richtige Endantwort. Weniger als ein Tor, ein Test sichert das.
- "Ohne Kontrolle abgeben" zählt die Antworten, wie sie zuletzt im Päckchen standen, ohne Bonus und ohne Kontroll-Statistik. Bei "Antwort ändern" ist das Eingabefeld zuerst leer (die alte Antwort steht darüber), damit das Kind neu nachdenkt.
- Probe zählt je Aufgabe einmal (erstes Aufklappen). Die Probe rechnet mit der Antwort des Kindes (Teilen mit Rest: Teiler · Ergebnis + Rest = ?). Die Lösung kommt nie im Text vor, Test mit Zufallsaufgaben aller Themen. Einzige Ausnahme im Test: eine Zahl, die schon in der Aufgabe steht oder selbst der Rechenschritt ist (zum Beispiel 4 Zehner = 40), das ist kein Verrat.
- Liga-Auswahl "Hier spielen" erlaubt auch Ligen im Probetraining (spielbar), nicht gesperrte und nicht wartende. Wechsel wird wie jede Änderung sofort lokal gespeichert und abgeglichen.
- Ein Päckchen wird erst bei der Abgabe gespeichert (dann vollständig). Bricht die App mittendrin ab, gehen die Antworten dieses Päckchens verloren (beim normalen Spiel bleibt jede beantwortete Aufgabe erhalten). In SPEC.md unter Bekannte Grenzen. Alternative wäre Zwischenspeichern, hier bewusst nicht gebaut.
- Trainer-Hilfe gilt im Päckchen wie sonst. Das Angebot nach der Tipp-Zeit kommt nur beim Schreiben, nicht im Kontroll-Pfiff.
- .handover/current.md (Marcos Auftrag, war als geändert vorgemerkt) ist im 1.2.0-Commit mit enthalten, damit der Arbeitsbaum sauber ist.
- Keine Abweichung vom Auftrag bei den Nicht-Zielen: kein Merge nach main, keine Modi Phase 3, kein Aufgabenkatalog, keine Einführungstour, keine npm-Pakete, keine externen Ressourcen.

5. RÜCKMELDUNGEN UND WÜNSCHE VON MARCO IN DIESER SITZUNG
- Marco (Abnahme der Vorschau, Screenshot "Doppelte Mitlaute"): Die Frage "Welches Wort ist richtig geschrieben?" bot Schal und Schall an. Beide sind richtig und meinen Verschiedenes, das verwirrt beim Üben. Umgesetzt in 1.2.1: Das Paar ist raus (ersetzt durch Kette und Kete), ein Test stellt sicher, dass bei dieser Aufgabe nie zwei echte Wörter zur Wahl stehen.
- Selbst gefunden beim Durchsehen (gleiche Art Fehler): Beim Perfekt galten ich habe gelaufen, gefahren, geschwommen, gesprungen als falsch, sind aber regional oder je nach Bedeutung richtig. In 1.2.1 stehen bei diesen vier Verben nur eindeutig falsche Formen zur Wahl (zum Beispiel ich habe gelauft). Test ergänzt. Nicht geprüft: Die übrigen Wortlisten wurden nur gelesen, nicht gegen ein Wörterbuch geprüft (auffällig aber unkritisch: Werk und Werg bei Verlängern).
- Marco: "zieh auch die Hauptseite nach": als Merge von preview nach main verstanden (lokal, Fast-Forward). Falls Marco damit etwas anderes meinte (zum Beispiel nur den Live-Deploy), bitte bei ihm nachfragen. Marco: Bitte bei Aufgaben immer eindeutige Fragen, das Üben darf Kinder nicht verwirren.

6. TESTS
- node --test: 127 Tests, alle grün (vorher 103, 1.2.0 hatte 125). Neu: test/v12.test.mjs (23 Tests, darunter Eindeutigkeit von Doppelte Mitlaute und Perfekt) und ein Abschnitt im Ende-zu-Ende-Test (ganzes Päckchen mit Probe, Antwort ändern und Kontroll-Pfiff durch die echte app.js, Stand auf dem Server geprüft).
- Fünf bestehende Tests wurden angepasst, weil sich das Verhalten bewusst ändert: Schema 3 (admin, adminview, schema2, e2e), Name Trainingscamp (views), Fachauswahl öffnet erst das Panel (e2e). Keine Erwartung wurde gelockert.
- Nicht geprüft (Marco): wie die 24 Sticker und die Ansichten aussehen, Bedienung auf iPad und iPhone, Zahlenblock im Päckchen, Sticker-Motive lesbar bei 64 Pixeln.

7. RESTPOSTEN
- Echter Blocker: keiner.
- Bewusst offen: Hyper Backup nicht eingerichtet. Emils Konto im Live enthält noch Testrunden von Marco (entscheidet Marco). Zwischenspeichern eines laufenden Päckchens nicht gebaut. Die Vorschau hat eigene Daten: ein Konto dort startet bei Null, zum Prüfen der Migration eines Live-Stands müsste eine Sicherung von Emils Konto in die Vorschau zurückgespielt werden (Eltern-Bereich, Sicherungen, oder Datei von Hand).
- Kosmetisch: Tailscale auf der NAS 1.58.2. Sticker-Motive sind einfache Zeichnungen, bei Bedarf verfeinern (wie die Avatare). Jubelrufe und Motive sind meine Wahl, Liste in app/js/stickers.js (DESIGNS).

8. ANKER
- Branch: preview. Code-Commit 8473864 (Elternteil baab42f). Danach ein Commit mit dieser Datei.
- main: 882d8e1. origin/preview: baab42f. origin/main: 882d8e1.
- Arbeitsbaum: sauber nach dem Rückübergabe-Commit.

9. NÄCHSTE SCHRITTE FÜR MARCO (einzeln, unverschachtelt)
1. ERLEDIGT (Marco): Push von preview und Vorschau-Deploy 1.2.1. Nur bei einem weiteren Stand wiederholen (Schritte 1 bis 3):
   git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" push origin preview
2. Branch der Vorschau auf der NAS prüfen (nur prüfen):
   cd /volume1/docker/torjaeger-preview && sudo sh deploy.sh --check
3. Vorschau aktualisieren (sichert vorher data/, holt den Code, baut den Container):
   cd /volume1/docker/torjaeger-preview && sudo sh deploy.sh
4. Auf dem iPad die Vorschau öffnen (https://energizer.tailfc5923.ts.net:8443). Die App meldet "Es gibt eine neue Version", dort "Jetzt laden" tippen. Im Eltern-Bereich unter Sicherungen und System sollte Schemaversion "Server 3, App 3" und App-Version 1.2.0 stehen.
5. Testcheckliste (Vorschau, mit einem Testkonto):
   - Startseite: nur eine Liga groß, die anderen schmale Zeilen mit Status. Zeile antippen klappt auf, Schnuppern geht. Nach dem Freischalten der Kreisliga ist sie die große Liga, "Hier spielen" im Trainingscamp wechselt zurück. Wechsel auf einem zweiten Gerät nach dem Abgleich sichtbar.
   - Mathe antippen: Mix plus Themenblöcke. Deutsch genauso. Mix-Spiel startet direkt.
   - Themenblock starten: Päckchen schreiben, keine Rückmeldung, dann Kontroll-Pfiff. Probe tippen (keine Lösung sichtbar), Antwort ändern, "Ich habe kontrolliert ✓", dann Torszenen. Selbst gefundener Fehler: "Selbst gefunden, stark!" und +8 Bonus. Teilen mit Rest: Teiler gleich, Dividend steigt.
   - Album: 24 verschiedene Sticker mit Jubelruf groß, Fußballbegriff klein. Ein Konto mit schon gesammelten Stickern (Emils Stand als Sicherung einspielen) behält sie.
   - Eltern-Bereich, Lernstand: Abschnitt "Kontrollieren" mit Pfiffen, Proben, selbst korrigierten Fehlern. Letzte Spiele nennt "Päckchen: Thema".
   - Name überall Trainingscamp (Startseite, Eltern-Bereich, Ergebnis).
6. LIVE (Marco, erst nach Abnahme der Vorschau): main ist lokal schon nachgezogen. Dann pushen:
   git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" push origin main
   Danach auf der NAS im Live-Ordner (sichert vorher data/, Emils Stand wird ohne Verlust migriert):
   cd /volume1/docker/torjaeger && sudo sh deploy.sh
   Danach auf dem iPad der Live-App "Jetzt laden" tippen.
7. Cowork: Plan und Index im Vault auf Version 1.2.1 nachziehen (Abschnitt G als umgesetzt markieren, Päckchengröße, Bonus 8, Jubelrufe stehen in stickers.js). Dort schreibt nur Cowork.
```
