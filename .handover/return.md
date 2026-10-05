# Rückübergabe Claude Code nach Cowork, 02.10.2026 (Versionen 1.6.0 bis 1.6.7)

## Rückübergabe Auftrag C0 bis C4 (05.10.2026, Versionen 1.7.0 bis 1.7.4)

**Nachtrag 1.7.5:** Nach Marcos erster Prüfung nachgebessert (Passkette mit festem Anpfiff, 9er Reihe 5 je Halbzeit, Päckchen im Lager folgt der Einstellung, klarere Beschriftung beim Kopieren). Siehe CHANGELOG 1.7.5.

Alle Pakete sind fertig, je Paket ein Commit und ein lokaler Tag (v1.7.0 bis v1.7.4) auf `preview`. Tests: 351 grün. Details je Paket in CHANGELOG.md, SPEC.md und `.handover/progress.md`.

| Paket | Version | Inhalt | Schema (Konto/global) |
|---|---|---|---|
| C0 | 1.7.0 | Taste "?" auf "Wer spielt?", Überblicks-Grafik bildschirmfüllend mit Zoom (Original in assets-src) | 8 / 4 |
| C1 | 1.7.1 | Einmaleins-Grenze je Konto (Reihen 1 bis 10, auch mal 0, Ergebnis höchstens 100) in allen kleinen Mal- und Geteilt-Aufgaben | 9 / 4 |
| C2 | 1.7.2 | Ballsäcke, Passkette, Rechenkreis vor- und rückwärts (neue Aufgabenart slots), Päckchen Reihe; in Einmaleins eingemischt | 9 / 4 |
| C3 | 1.7.3 | Baukasten Eigenes Trainingslager (globale Vorlagen, Schalter und Fortschritt je Konto, eingefrorene Vorlage) | 10 / 5 |
| C4 | 1.7.4 | Mitgelieferte Vorlage 9er Reihe (aus), Kopie für andere Reihe mit einem Klick | 10 / 5 |

### Was Marco in dieser Sitzung ausgeführt hat
Nur Start und Freigabe ("los gehts"). **Nicht ausgeführt:** Push nach origin, Merge nach main, deploy.sh auf der NAS (Vorschau und Live), Test auf iPad oder iPhone, Browser-Vorschau. Nichts im Vault geschrieben.

### Stand je Umgebung
`preview` lokal auf dem Commit mit dieser Datei, Version 1.7.4. `main`, `origin/main` und `origin/preview` unverändert bei e0cd3e5 (1.5.5). Lokale Tags v1.6.0 bis v1.7.4, nichts gepusht. Was auf der NAS läuft, ist hier unbekannt.

### Entscheidungen und Abweichungen
- **C1:** Grenze als Modulzustand (mul.js, von S() in app.js gesetzt). Regel: eine Zahl der Aufgabe liegt in den Reihen, die andere ist 1 bis 10. **Ausgenommen:** Rechnen bis 1000 und die Bezirksliga-Themen "Malnehmen groß" und "Teilen groß" (Ergebnis über 100 nicht vereinbar mit der Grenze). Nur Reihe 1 gewählt: Aufgaben mit Rest brauchen einen Teiler ab 2, dann gilt der übliche Teiler-Bereich. Trainingslager-Ergebnisse bei Rest jetzt höchstens 10.
- **C2:** Erweiterung von Einmaleins statt neues Thema (kein Eingriff in Aufstieg und Themenliste). Jede vierte Einmaleins-Aufgabe, jeder vierte Themenblock; Mini-Spiele und Lager nur über Option.
- **C3:** Lager sind dynamische CAMPS-Einträge "c:<Nr>". "Teilen mit Rest" bleibt das fest eingebaute Lager (Fortschritt unverändert, Migration ohne Datenänderung), steht in der Liste und ist kopierbar. Vorlage wird beim ersten Abschluss einer Einheit im Konto eingefroren, Neustart löscht sie. Gelöschte Vorlage: Löschmarke, Lager mit Fortschritt bleiben. Mini-Spiele als Nachspielzeit nehmen Aufgaben aus dem Lager (Memory ohne Rechenaufgaben fällt auf den Mix zurück). Schwierigkeit über Einheiten: wechselnder Schwerpunkt und Englisch-Stufe.
- **C4:** Vorlage als feste Konstante (nicht löschbar, keine Migration). Päckchen-Einheit immer 12 bis 16 Aufgaben. Übt ein Konto die 9er Reihe nicht, nimmt die Vorlage dessen Reihen (nie erweitern), der Name bleibt "9er Reihe".

### Restposten
- **Echter Blocker:** keiner.
- **Bewusst offen:** Prüfung auf iPad/iPhone (Größe der Tipp-Felder in Passkette und Rechenkreis, Zoom der Überblicks-Grafik, Baukasten-Editor), Texte der Vorlage, Testrunde in Emils Konto. Der Ende-zu-Ende-Test "Ende zu Ende 1.4.0" ist im Gesamtlauf unter Last gelegentlich rot (Zeitüberschreitung "Kreisliga zeigt Englisch", etwa jeder dritte bis fünfte Lauf), einzeln immer grün; Ursache nicht gefunden (Verdacht: Wettlauf beim Abgleich mit dem Server, seit schwerere Tests parallel laufen). Die übrigen Ende-zu-Ende-Tests warten jetzt auf den Abgleich.
- **Kosmetisch:** Die Rechenkreis-Zeichnung ist nur im Fake-DOM geprüft, nicht visuell.

### Anker
Branch preview, HEAD siehe git log (Commit "Rückübergabe 1.7.4"), Tag v1.7.4, Arbeitsbaum sauber.

### Prüfliste für Marco (kurz)
1. Startseite "Wer spielt?": runde Taste "?" oben rechts, Grafik öffnet, + und − zoomen, Schließen.
2. Eltern, Einstellungen: "Einmaleins" Reihen und "Auch mal 0" schalten, danach Einmaleins und Teilen mit Rest üben: nur gewählte Reihen.
3. Eltern, Eigene Trainingslager: 9er Reihe für Emil einschalten, Einheit 1 (Ballsäcke) bis 4 spielen: Felder antippen, Zahlenblock, "Weiter".
4. Bei der 9er Reihe eine andere Reihe antippen ("Für andere Reihe kopieren"), Kopie bearbeiten, einschalten.
5. Eigene Vorlage anlegen, ändern während Emil mitten im Lager ist: Lager bleibt gleich bis Neustart.
6. Alle Geräte vor dem Einspielen auf neue Version bringen (Schema 10, "Jetzt laden").

### Nächste Schritte für Marco (Befehle einzeln)
```bash
git -C "C:/AI/_MBrain Data/Projects/Torjaeger-Liga" push origin preview --tags
```
Danach auf der NAS die Vorschau ausrollen (wie bisher, deploy.sh im Vorschau-Klon). Live (merge nach main und deploy) erst nach deiner Prüfung und nur auf dein Wort.


Auftrag: `.handover/current.md` (Cross-Handover Cowork nach Claude Code, Modus bauen, Budget-Modus). Pakete A0 und B1 bis B8 sind **alle fertig**, je Paket ein Commit und ein lokaler Tag. Darunter stehen die Nachträge je Paket (neueste zuerst) und danach die Rückübergabe der früheren 1.5.4-Sitzung.

## Zusammenfassung dieser Sitzung
| Paket | Version | Commit | Inhalt | Schema | Tests |
|---|---|---|---|---|---|
| A0 | (1.5.5) | aca0c5a | Rückübergabe 1.5.5 nachgetragen | 7 | 237 |
| B1 | 1.6.0 | 5492b1a | Schwerpunkt, Sondertraining für alle Mathe/Deutsch-Themen, Mix 1/3 | 7 | 244 |
| B2 | 1.6.1 | 91b1877 | Zurückgestellt mit Datum, neue Themen starten zurückgestellt | 8 | 254 |
| B3 | 1.6.2 | e993d25 | Frust-Bremse (drei Fehler in Folge) | 8 | 260 |
| B4 | 1.6.3 | 2976330 | Mini-Spiel Torwand | 8 | 267 |
| B5 | 1.6.4 | a0262eb | Mini-Spiel Memory | 8 | 274 |
| B6 | 1.6.5 | ffdc0b7 | Mini-Spiel Dribbel-Parcours | 8 | 282 |
| B7 | 1.6.6 | 66cbe8d | Überraschungsspiel | 8 | 287 |
| B8 | 1.6.7 | fa29e69 | Liga-Freigaben serverseitig mit Eltern-PIN | 8 | 295 |

## Was Marco in dieser Sitzung ausgeführt oder angewiesen hat
- Marco hat die Sitzung gestartet, die Anker prüfen lassen und mit "los" die Arbeit freigegeben. Sonst keine Eingriffe.
- **Nicht ausgeführt:** Push nach `origin`, Merge nach `main`, `deploy.sh` auf der NAS (Vorschau und Live), Test auf iPad oder iPhone, Browser-Vorschau (Marco prüft visuell selbst). Nichts im Vault geschrieben.

## Stand je Umgebung
- `preview` liegt lokal auf dem Commit mit dieser Datei (direkt nach `fa29e69`), Version **1.6.7**, Schema 8. `origin/preview`, `main` und `origin/main` stehen unverändert auf **e0cd3e5** (Version 1.5.5). Lokale Tags: v1.6.0, v1.6.1, v1.6.2, v1.6.3, v1.6.4, v1.6.5, v1.6.6, v1.6.7 (keine früheren Tags vorhanden, nichts gepusht).
- Was auf der NAS läuft, ist hier unbekannt (bei Marco erfragen). Die Angabe "Live läuft mit 1.5.3" weiter unten ist überholt.

## Wichtig vor dem Einspielen
- **Schema 8** (Konto): Beim ersten Start einer neuen App migrieren die Geräte lokal (`topicSeen` wird ergänzt, nichts geht verloren) und senden den neuen Stand. Der Server lehnt ältere Schemas ab (409 "schema_too_old"), Geräte mit App bis 1.6.0 müssen neu laden ("Jetzt laden").
- **Liga-Freigaben (1.6.7)** laufen über den Server mit Eltern-PIN und nur online. Geräte mit App bis 1.6.6 geben lokal frei, der Server ignoriert es. Bitte alle Geräte laden, bevor Ligen freigegeben werden.
- Beim Einspielen der Reihe nach 1.6.0 bis 1.6.7 gleichzeitig ist nichts Besonderes zu tun: ein Push von `preview` und ein Deploy reichen, die Tags sind Marken für Zwischenstände.

## Entscheidungen und Abweichungen (Überblick, Details in den Nachträgen)
- Sondertraining: 3 statt 5 Einheiten je Thema (Generatoren ohne Stufen), Schwerpunkt als Themenmodus ohne Schemawechsel.
- Neue Themen starten zurückgestellt über `settings.topicSeen` (feste Liste `TOPICS_AT_8` in der Migration).
- Frust-Bremse ohne gespeicherte Daten (liest die letzten Antworten).
- Mini-Spiele: eigener Zustand `MG` und eigene Ansicht, Memory ohne Lernstand (Raten verfälscht), Torwand und Parcours mit Lernstand, kein Probetraining-Verbrauch, kein Sticker.
- Liga-Freigaben: nur online mit PIN; Konto-Neuanlage übernimmt mitgebrachte Freigaben (bekannte Lücke, siehe B8).

## Restposten
- **Echter Blocker:** keiner.
- **Bewusst offen:** Prüfung auf iPad/iPhone (Torwand-Größen, Memory-Karten, Parcours-Strecke, Datumsfeld im Eltern-Bereich wurden nur auf Struktur getestet), Prüfung `docs/Inhalte-Englisch-Sachkunde.md`, Testrunden in Emils Konto, Hyper Backup, Neuanlage-Lücke bei Liga-Freigaben, Schwierigkeitsstufen im Sondertraining.
- **Kosmetisch:** Sondertraining-Einheiten eines Themas sind inhaltlich gleich schwer.

## Anker
- Branch `preview`, Version 1.6.7, Tests 295 grün, Arbeitsbaum sauber nach dem Commit dieser Datei.

## Nächste Schritte für Marco
1. Ansehen und pushen: `git push origin preview` und `git push origin --tags`
2. Vorschau auf der NAS aktualisieren: im Vorschau-Ordner `./deploy.sh`.
3. Geräte neu laden ("Jetzt laden"), die Prüflisten der Nachträge durchgehen (Reihenfolge B1 bis B8).
4. Erst nach Abnahme: `git checkout main`, `git merge preview` (oder `git merge v1.6.7`), `git push origin main`, im Live-Ordner `sudo sh deploy.sh`.

## Nachtrag B8: Version 1.6.7 Liga-Freigaben serverseitig (Tag v1.6.7 lokal, kein Schemawechsel)
- Neu: `POST /api/admin/profiles/<id>/league` (PIN, `li`, `open`). Freigeben/Sperren in der Trainerbank (PIN wird dafür bis zum Schließen im Speicher gehalten, `UI.parentPin`) und im Eltern-Bereich (`A.pin`) laufen zuerst über den Server, danach lokal. Offline: Meldung, kein lokales Freigeben mehr.
- `PUT .../state` behält den gespeicherten `open`-Wert (`rules.guardLeagues`), meldet festgehaltene Werte als `lg` zurück, `sync.js` übernimmt sie. Ausnahme: ist noch kein Stand gespeichert (Konto wird angelegt), gilt der erste Stand. Probetraining bleibt unberührt.
- Entscheidungen: (1) Nur online freigeben, weil die PIN serverseitig geprüft wird. (2) Konto-Neuanlage übernimmt die mitgebrachten Freigaben (sonst verlören alte lokale Konten sie). Das heißt: Ein Kind könnte mit einem **neu angelegten Konto** und verändertem Client Ligen setzen; eine geprüfte Neuanlage müsste das Konto-Anlegen selbst an die PIN binden (nicht umgesetzt, nicht im Auftrag). (3) Geräte mit App bis 1.6.6 geben lokal frei, der Server ignoriert das; die Geräte gleichen sich nach dem nächsten Abgleich an.
- Tests: 295 grün (8 neue in `test/v167.test.mjs`, `sync.test.mjs` angepasst). Nicht ausgeführt: Push, Merge, Deploy.
- Prüfliste iPad: Trainerbank (PIN eingeben), "Ganz freigeben" bei Bezirksliga/Kreisliga: Liga wird frei. Zweites Gerät nach Abgleich: ebenfalls frei. Im Flugmodus "Ganz freigeben": Meldung "nur mit Verbindung". Eltern-Bereich (Konten): Freigeben/Sperren je Konto wirkt ebenso. Alle Geräte vorher auf 1.6.7 laden.

## Nachtrag B7: Version 1.6.6 Überraschungsspiel (Tag v1.6.6 lokal, kein Schemawechsel)
- Neue Taste "Überraschungsspiel" im Bereich Mini-Spiele der Kabine: lost Torwand, Memory oder Dribbel-Parcours (`newSurprise`). Letzte Art wird vermieden, nicht spielbare Arten ausgelassen. Nach dem Spiel "Noch eine Überraschung". Auswahl durch Emil selbst bleibt (die einzelnen Tasten).
- Neu: `UI.miniMsg` für freundliche Hinweise, wenn ein Spiel nicht startet (kein Fach/Thema passend).
- Tests: 287 grün (5 neue in `test/v166.test.mjs`). Nicht ausgeführt: Push, Merge, Deploy.
- Prüfliste iPad: Kabine, Mini-Spiele: "Überraschungsspiel" mehrmals tippen, es kommen verschiedene Spiele. Ein Fach ausschalten (Eltern-Bereich): Hinweis statt Absturz.

## Nachtrag B6: Version 1.6.5 Mini-Spiel Dribbel-Parcours (Tag v1.6.5 lokal, kein Schemawechsel)
- Parcours aus 5 Hindernissen (Hütchen und Gegner im Wechsel, SVG-Strecke), Antworten als vier große Tasten. Richtig = Hindernis weiter, falsch = "Ball verloren", Erklärung, neue Aufgabe am selben Hindernis. Höchstens 12 Aufgaben, danach Ende ohne Tor. Tor: Bonus 20 (ohne Ballverlust) oder 10 über `applyMiniPoints`. Antworten zählen im Lernstand wie bei der Torwand.
- Entscheidung: Obergrenze 12 Aufgaben, damit ein Spiel nicht endlos wird; Bonus nur bei Tor. Antwortauswahl wie Torwand (nur Aufgaben mit Zahl oder Auswahl als Antwort).
- Tests: 282 grün (8 neue in `test/v165.test.mjs`). Nicht ausgeführt: Push, Merge, Deploy.
- Prüfliste iPad: Kabine, Mini-Spiele, Dribbel-Parcours: Strecke mit Ball links, vier Antworttasten. Richtig: Ball springt zum nächsten Hindernis. Falsch: "Ball verloren", neue Aufgabe. Nach 5 richtigen: "Tor!" mit Bonus.

## Nachtrag B5: Version 1.6.4 Mini-Spiel Memory (Tag v1.6.4 lokal, kein Schemawechsel)
- Memory: 10 Karten, 5 Paare aus kurzen Rechenaufgaben (a · b = ?) und Ergebnissen aus den aktiven Rechenthemen des Mixes. Zwei Karten antippen; falsche Paare bleiben offen, bis die nächste Karte angetippt wird (kein Zeitgeber). 10 Punkte je Paar, Gutschrift über `applyMiniPoints` beim letzten Paar.
- Entscheidung: **kein Eintrag in den Lernstand** (Raten würde viele falsche Erst-Versuche erzeugen und die Frust-Bremse auslösen). Das Memory ist reine Wiederholung. Wenn Marco doch Lernstand will: nur richtige Paare zählen lassen (Vorschlag), nicht umgesetzt.
- Zählt nur für Rechenthemen. Deutsch-Aufgaben taugen nicht als kurze Kartenpaare, deshalb nicht dabei.
- Tests: 274 grün (7 neue in `test/v164.test.mjs`). Nicht ausgeführt: Push, Merge, Deploy.
- Prüfliste iPad: Kabine, Mini-Spiele, Memory: Karten haben 5 + 5 Texte. Zwei falsche Karten: bleiben offen mit Hinweis, nächster Tipp deckt zu. Richtiges Paar bleibt grün. Nach 5 Paaren Ergebnis mit Versuchen und 50 Punkten.

## Nachtrag B4: Version 1.6.3 Mini-Spiel Torwand (Tag v1.6.3 lokal, kein Schemawechsel)
- Neuer Bereich "Mini-Spiele" in der Kabine (Startseite des Kontos) mit Torwand: 5 Aufgaben aus dem Mix der aktuellen Liga (nur aktive Themen, nur Aufgaben mit Zahl oder Auswahl als Antwort), Antworten auf 4 Löchern, Tipp aufs richtige Loch = Tor. Punkte 10 je Tor (15 ab dem dritten in Folge). Antworten zählen im Lernstand (`applyAnswer`, `trial: true`), kein Spiel, kein Sticker, kein Budgetverbrauch, kein Sichern des laufenden Spiels (5 Aufgaben, kurz).
- Neu: `app/js/mini.js` (Regeln, wiederverwendbar für B5 bis B7: `newMini`, `miniAnswer`, `miniNext`), `app/js/miniviews.js` (Kabinen-Auswahl `miniPanelHTML`, `miniHTML`), Stil `.wall`/`.hole` in style.css, Steuerung in app.js (`startMini`, `miniShoot`, `view="mini"`, Zustand `MG`).
- Entscheidung: Mini-Spiele sind ein eigener Ansicht-Zustand (`MG`) und nicht Teil von `G`, damit das Spiel mit Halbzeiten/Päckchen unberührt bleibt. Der Trainer-Tipp fehlt im Mini-Spiel bewusst (leichtes Spiel zwischendurch).
- Tests: 267 grün (7 neue in `test/v163.test.mjs`). Nicht ausgeführt: Push, Merge, Deploy.
- Prüfliste iPad: Kabine, "Mini-Spiele", "Torwand": Aufgabe mit 4 Löchern, Antippen. Richtig: grünes Loch, "Tor ins richtige Loch!". Falsch: rotes Loch, richtiges Loch grün, Erklärung. Nach 5 Aufgaben Ergebnis, "Nochmal spielen". Bedienung mit dem Finger auf Größe der Löcher prüfen (min. 96 px).

## Nachtrag B3: Version 1.6.2 Frust-Bremse (Tag v1.6.2 lokal, kein Schemawechsel)
- Drei Fehler in Folge im selben Thema (je Runde, einzelne Aufgaben): Thema Gewicht x0,15 bis Rundenende, bei der nächsten Aufgabe Tipp-Angebot durch den Trainer. Nicht im Trainingslager und nicht im Päckchen. Eltern-Bereich (Reiter Stand): "Drei Fehler in Folge. Ist das schon im Unterricht dran?" aus den letzten drei Antworten (`stats.<Thema>.last`), ohne neues Feld; zurückgestellte/ausgeschaltete Themen ohne Markierung.
- Entscheidung: Die Markierung wird abgelesen und nicht gespeichert (Schema bleibt 8, nichts zu migrieren). Die Bremse ist pro Runde, die Eltern-Markierung über die letzten Antworten.
- Tests: 260 grün (6 neue in `test/v162.test.mjs`). Nicht ausgeführt: Push, Merge, Deploy.
- Prüfliste iPad: in einem Mix-Spiel absichtlich dreimal in Folge im selben Thema falsch antworten: danach kommt das Thema seltener, der Trainer fragt nach einem Tipp. Eltern-Bereich, Stand: Hinweis beim Thema; nach einer richtigen Antwort weg.

## Nachtrag B2: Version 1.6.1 Themen-Zustände (Schema 8, Tag v1.6.1 lokal)
- Neuer Zustand **zurueck** ("Zurückgestellt") je Thema, optional mit Datum (`settings.topicUntil.<Thema>`, ab dem Tag von selbst wieder aktuell). Zurückgestellte und ausgeschaltete Themen sind nicht im Spiel und blockieren den Aufstieg nicht. Zustände jetzt: aktuell, wiederholen, zurueck, aus, schwerpunkt.
- **Neue Themen starten zurückgestellt** über `settings.topicSeen` (Liste bekannter Themen). Migration 7 nach 8 trägt die feste Liste `TOPICS_AT_8` ein, es wird also nichts zurückgestellt. Neue Konten tragen `ALL_TOPICS` ein. Stände ohne `topicSeen` stellen nie etwas zurück. Aktuell/Datum/anderer Zustand macht ein neues Thema bekannt.
- Schema 7 nach 8, Fixture `state-v7.json` (Format 1.6.0), Mindeststruktur (`topicUntil` Objekt, `topicSeen` Liste, beide freiwillig). Zusammenführen: Teil der Einstellungen (neuerer Stand gewinnt), keine Änderung in merge.js nötig.
- Entscheidung: Zustand heißt im Code `zurueck` (ohne Umlaut), Anzeige "Zurückgestellt". Ein Datum, das schon erreicht ist, ändert den gespeicherten Zustand nicht, es wirkt nur in der Anzeige und im Spiel (kein Schreiben ohne Eltern).
- Wichtig für den Rollout: Ein Gerät mit App 1.6.0 (Schema 7) bekommt vom Server bei Schema 8 ein 409 "schema_too_old" und muss die App neu laden ("Jetzt laden"). Die Hinweise dafür gibt es seit 1.5.5.
- Tests: 254 grün (10 neue in `test/v161.test.mjs`, die Schema-Tests auf 8 angehoben).
- **Nicht ausgeführt:** Push, Merge nach main, Deploy.
- Prüfliste iPad: Eltern-Bereich, Einstellungen, Themen: bei einem Thema "Zurückgestellt" wählen, das Datumsfeld erscheint; Thema ist weg aus Spiel und Liste; Datum auf gestern setzen: Thema ist wieder da. Alle bisherigen Themen müssen "Aktuell" (oder wie vorher) bleiben.

## Nachtrag B1: Version 1.6.0 Sondertraining (Commit siehe git log, Tag v1.6.0 lokal)
- **Schwerpunkt** als vierter Themenmodus (`settings.topicMode.<Thema> = "schwerpunkt"`, nur Mathe und Deutsch). **Kein Schemawechsel** (bleibt 7); ältere App-Versionen lesen den Wert als "aktuell".
- **Sondertraining:** 25 Mathe/Deutsch-Themen bekommen ein Trainingslager aus 3 Einheiten (Aufwärmen, Training, Spieltag), je 2 Halbzeiten zu 10 Aufgaben aus dem Generator des Themas, Elfmeterschießen, Sichern/Fortsetzen, Abzeichen "Trainings-Profi". Kachel nur bei Schwerpunkt. Teilen mit Rest behält 5 Einheiten und eigenen Schalter. Fortschritt in `camps.<Thema>` wie bisher.
- **Mix:** Schwerpunkt-Themen kommen mit Wahrscheinlichkeit 1/3 vorrangig dran (`nextTopic`, `FOCUS_SHARE`).
- Entscheidung: 3 statt 5 Einheiten, weil die Generatoren keine Stufen haben (Schwierigkeit steigt nicht, bekannte Grenze). Keine Pause-/Torwart-Änderungen.
- Tests: 244 grün (7 neue in `test/v160.test.mjs`).
- **Nicht ausgeführt:** Push, Merge nach main, Deploy. main und origin stehen weiter bei e0cd3e5.
- Prüfliste iPad: Eltern-Bereich, Einstellungen, bei Emil ein Mathe-Thema auf "Schwerpunkt" stellen; Startseite zeigt "Sondertraining: <Thema>"; Einheit 1 spielen (Halbzeitpause, Abpfiff, Elfmeterschießen); im Mix kommt das Thema deutlich öfter; Schwerpunkt wieder auf "Aktuell": Kachel weg, Fortschritt bleibt.

## Nachtrag 02.10.2026: Version 1.5.5 und e0cd3e5 (kamen ohne eigene Rückübergabe)
- **750e247, 1.5.5 "Fächer je Konto ganz ausschalten":** Im Eltern-Bereich (Reiter Einstellungen, Abschnitt "Fächer") lassen sich Mathe, Deutsch, Englisch und Sachkunde je Konto einzeln ausschalten. Ein ausgeschaltetes Fach verschwindet aus Spielauswahl, Mix, Themenlisten, Trainerbank und Aufstieg und blockiert den Aufstieg nicht. Ist kein Fach an, erscheint ein freundlicher Hinweis. Themeneinstellungen bleiben erhalten. **Kein Schemawechsel:** `settings.fachOff` (`{deu: true}`), Zusammenführen wie übrige Einstellungen (neuerer Stand gewinnt). Version an allen vier Stellen auf 1.5.5. Geändert: admin.js, app.js, content.js, rules.js, views.js.
- **e0cd3e5 "Hinweis Jetzt laden auch in Wer spielt und im Eltern-Bereich":** Der Hinweis auf eine neue App-Version erscheint jetzt auch in "Wer spielt?" und im Eltern-Bereich, nicht nur auf der Startseite. Die App fragt beim Zurückkehren nach einer neuen Version (`swReg.update()`) und zeichnet den Hinweis sofort, wenn gerade nichts getippt wird. Grund: das iPad lud neue Fassungen nicht zuverlässig.
- **Tests:** neue Tests in `test/v154.test.mjs` (CHANGELOG: 5 für 1.5.5, dazu Tests für den Hinweis); Stand `node --test`: **237 Tests, alle grün** (geprüft am 02.10.2026, nach e0cd3e5).
- **Stand je Umgebung:** `main`, `preview`, `origin/main` und `origin/preview` liegen alle auf `e0cd3e5`. Es sind keine Git-Tags gesetzt (auch kein `v1.5.4`). Was auf der NAS (Live, Vorschau) tatsächlich läuft, ist hier unbekannt und bei Marco zu erfragen; die Angabe "Live läuft mit 1.5.3" weiter unten stammt aus der 1.5.4-Sitzung und ist überholt, soweit Marco inzwischen deployt hat.
- **Anker jetzt:** Branch `preview`, Version 1.5.5.

## Was Marco in dieser Sitzung selbst ausgeführt oder angewiesen hat (1.5.4-Sitzung)
- Marco hat die Sitzung gestartet, den Anker prüfen lassen und mit „ja“ den Start der Arbeit freigegeben.
- **Nicht ausgeführt** (weder von Marco noch von mir): Push nach `origin`, Merge nach `main`, `deploy.sh preview` auf der NAS, Test auf iPad oder iPhone. Kein Live-Deploy. Nichts im Vault geschrieben. Keine Vorschau im Browser geöffnet, keine Screenshots (Marco prüft visuell selbst).

## Stand je Umgebung
- Marco hat nach der Vorschau-Abnahme die Freigabe nach `main` angewiesen (02.10.2026). `main` und `preview` liegen nach dem Release auf demselben Commit und wurden nach `origin` gepusht. Auf der NAS ist **noch nichts** ausgeführt: Live läuft weiter mit 1.5.3, bis Marco im Live-Ordner `sudo sh deploy.sh` ausführt (die Vorschau: im Vorschau-Ordner).
- Nachträglich auf Marcos Wunsch geändert: Punktebilder bei Teilen mit Rest entfernt (überall), Trainingslager-Schalter im Reiter Konten unter der Konto-Karte statt in den Einstellungen.

## Anker-Prüfung am Anfang
Alle fünf Erwartungen stimmten (Branch `preview`, `HEAD` und `main` bei `5e51b26`, Status genau `?? .handover/next.md`, `APP_VERSION` 1.5.3). Erster Commit (`523fa3f`): `next.md` nach `current.md`.

## Umgesetzt
1. **Kachel und Ablauf:** Kachel „Trainingslager: Teilen mit Rest“ oben auf der Startseite (nur wenn eingeschaltet), Fortschritt „x von 5 Einheiten“, Abzeichen „Rest-Profi“. Einheit n+1 frei nach Abschluss von n, keine Mindestquote, Wiederholen möglich. Je Einheit 2 Halbzeiten zu 10 Aufgaben, Halbzeitpause (Zwischenstand, Trainer-Satz, „2. Halbzeit anpfeifen“), Abpfiff mit Ergebnis und Bonus wie sonst (Sieg 20, perfekt 30, über beide Halbzeiten gerechnet), danach Nachspielzeit.
2. **Fünf Einheiten** aus vorhandenen Bausteinen (`mk.rest`, `packOf`) plus eigene Sachaufgaben: 1 Aufwärmen, 2 Erste Reste (ohne Punktebilder), 3 Alle Reihen („Da passt noch einer rein!“), 4 Kontroll-Pfiff (je Halbzeit ein Päckchen mit 6 Aufgaben), 5 Spieltag (Busse, Kabinen, Netze, Mannschaften, Kästen). Erklärung mit Rechenweg. Antworten zählen im Lernstand von `m3_rest` und `m3_sach`. Abzeichen plus Jubel-Sticker (falls einer fehlt) am Ende von Einheit 5.
3. **Elfmeterschießen:** 5 Schüsse, `startPenalty(topic, unit, tasks)` nimmt eine Aufgabenliste (für 1.6.0 wiederverwendbar). Neue Torszene mit Torwart (`sceneSVG(look, shot, {keeper:true})`, Schussart `saved`, „Gehalten!“), `prefers-reduced-motion` beachtet. Ergebnis wie „4 : 1“.
4. **Eltern-Bereich:** Schalter je Konto (Standard aus), Fortschritt je Einheit mit Ergebnis je Halbzeit und Elfmeterschießen, „Trainingslager neu starten“ mit Rückfrage.
5. **Sichern und Fortsetzen:** Gerät-lokal unter `camp:<Konto>` (kein Schemawechsel dafür). Gesichert bei jeder Antwort, „Kabine“, Hintergrund, Halbzeitpause. Kabine: „Weiterspielen oder Neu anfangen“ mit Halbzeit und Stand. Gilt für Halbzeit, Kontroll-Pfiff-Einheit und Elfmeterschießen.
6. **Datenmodell Schema 7:** `camps.<Thema> = {on, t, rs, units:{"1".."5":{h1,h2,pen?,t,runs}}, badge}`. Migration 6 nach 7 ergänzt `camps: {}`. Mindeststruktur: `camps` freiwillig, sonst Objektform, Zusatzfelder erlaubt. Zusammenführen (`mergeCamps`): Schalter neuerer Stand, Neustart (`rs`) gewinnt, sonst je Einheit der neuere Stand, Abzeichen der frühere Zeitpunkt. Struktur ist je Thema, 1.6.0 kann darauf aufbauen.
7. Version 1.5.4 an den vier Stellen, `js/camp.js` und `js/campviews.js` in `FILES`. README, SPEC.md, CHANGELOG.md, CLAUDE.md (Schema 7) aktualisiert.

## Entscheidungen und Abweichungen
- **Elfmeterschießen nur nach dem Abpfiff** (nicht nach der Halbzeit), Marco hatte das offengelassen. Es kommt direkt im Anschluss an das Ergebnis. Wer das Ergebnis über „Zur Kabine“ verlässt, bekommt es erst bei einer Wiederholung der Einheit. Ein unterbrochenes Elfmeterschießen lässt sich fortsetzen.
- **Einheit 4 hat 12 statt 20 Aufgaben:** Jede Halbzeit ist ein Päckchen mit 6 Aufgaben (Höchstlänge des bestehenden Päckchens), wie der Auftrag („Umfang so wählen, dass es 2 Halbzeiten ergibt“) es zuließ. Elfmeterschießen dort mit normalen Rest-Aufgaben.
- **Punkte im Elfmeterschießen:** 10 je Tor (Serienbonus wie sonst), kein Spielzähler, kein Sticker. Die Zahlen waren nicht vorgegeben.
- **Probetraining:** Antworten im Trainingslager verbrauchen es nicht (`applyAnswer` mit `trial: true`). Das Trainingslager ist an keine Liga-Freigabe gebunden, nur an den Schalter der Eltern.
- **Wiederholen** ersetzt das Ergebnis der Einheit (kein Bestwert). Das Elfmeterschießen-Ergebnis wird dabei gelöscht, bis neu gespielt.
- **Neustart** löscht Einheiten und Abzeichen, Punkte und Sticker bleiben. Zurücksetzen des ganzen Kontos behält den Schalter.
- **Erste Hinweise ohne Zahlen:** Die Tipps der Einheit 1 nennen keine Zahlen, damit sie nie die Lösung verraten (Regel aus CLAUDE.md).
- **Kontroll-Pfiff im Trainingslager** zählt in der Kontroll-Statistik wie sonst, die Päckchen-Sicherung `pack:<Konto>` bleibt davon unberührt.
- Nicht umgesetzt (laut Nicht-Zielen): weitere Mini-Spiele, Trainingslager für andere Themen, Zustand „zurückgestellt“, Frust-Bremse.

## Tests
`node --test`: **232 Tests, alle grün** (203 bisherige, davon einige auf Schema 7 und Version 1.5.4 angepasst, `SHOT_TEXT` kennt jetzt „Gehalten!“; plus 28 neue in `test/v154.test.mjs` und 1 Ende-zu-Ende-Test in `test/v154-e2e.test.mjs`). Neue Tests decken: Migration Schema 6 auf 7 mit Fixture `state-v6.json` (Format 1.5.3), Mindeststruktur mit und ohne Trainingslager, Server nimmt Schema 7 an, Generatoren je Einheit (Rest kleiner als Teiler, Probe stimmt, Zahlenbereiche, Sachaufgaben eindeutig, keine doppelten Fragen, Tipps ohne Lösung), Halbzeit-Ablauf (10 plus 10, Pause, Abpfiff), Sichern und Fortsetzen mitten in der 2. Halbzeit, im Kontroll-Pfiff und im Elfmeterschießen, Elfmeterschießen-Ergebnis, Freischalten der Einheiten, Abzeichen und Sticker genau einmal, Abgleich zwischen zwei Geräten (auch Neustart), Eltern-Bereich. Fake-DOM-Tests ersetzen keine Prüfung auf Safari/iPad.

## Restposten
- **Echter Blocker:** keiner.
- **Bewusst offen:** serverseitiger Schutz der Liga-Freigaben (1.6.0), Prüfung `docs/Inhalte-Englisch-Sachkunde.md`, Testrunden in Emils Konto, Hyper Backup, Auftrag 1.6.0 (Plan K, verallgemeinert das Trainingslager zum Sondertraining).
- **Zu beobachten auf dem iPad:** Optik der Kachel, der Halbzeitpause und der Torwart-Szene (Emoji-freie SVG-Grafik, nur im Test auf Struktur geprüft), Länge einer Einheit (20 Aufgaben plus 5) für Emil, ob das Elfmeterschießen verloren geht, wenn man das Ergebnis verlässt (bei Bedarf in 1.6.0 anders lösen).
- **Kosmetisch:** Die Einheiten-Liste zeigt bei gesperrten Einheiten „Erst Einheit n zu Ende spielen.“

## Anker
- Branch `preview`, Version 1.5.4 (`version.js`, `sw.js`, `SERVER_VERSION`, `package.json`). Code-Commit `bd83083`, der Commit mit dieser Datei folgt direkt darauf. `main` bei `5e51b26`.
- Arbeitsbaum nach dem Commit sauber. Neue Dateien in `app/`: `js/camp.js`, `js/campviews.js` (beide in `FILES` des Service Workers).

## Prüfliste für Marco (Vorschau auf dem iPad, nach Push und `deploy.sh`)
1. Eltern-Bereich, Reiter Konten: bei Emil „Trainingslager anzeigen“ auf An. Auf der Startseite erscheint die Kachel mit Einheit 1 frei, 2 bis 5 grau.
2. Einheit 1 starten: oben steht „Trainingslager · Einheit 1 · 1. Halbzeit · Aufgabe 1 von 10“. Nach 10 Aufgaben kommt die Halbzeitpause mit Zwischenstand und „2. Halbzeit anpfeifen“.
3. In der Pause „Kabine“ antippen: Dort steht „Trainingslager weiterspielen?“. Weiterspielen bringt zurück in die Pause.
4. Mitten in der 2. Halbzeit App schließen und neu öffnen: Weiterspielen setzt an der richtigen Aufgabe mit richtigem Stand fort.
5. Nach dem Abpfiff „Nachspielzeit: Elfmeterschießen“: fünf Schüsse, bei einer falschen Antwort hält der Torwart. Ergebnis wie „4 : 1“.
6. Einheit 2 ist danach frei. Einheit 3: eine Aufgabe mit zu großem Rest absichtlich falsch beantworten, es muss „Da passt noch einer rein!“ erscheinen.
7. Einheit 4: Päckchen mit Kontroll-Pfiff, Probe zeigt „Teiler · Ergebnis + Rest“.
8. Einheit 5 abschließen: Abzeichen „Rest-Profi“ und Jubel-Sticker.
9. Eltern-Bereich: „Trainingslager neu starten“ fragt nach, danach steht die Kachel wieder auf Einheit 1.
10. Zweites Gerät (iPhone): Nach dem Abgleich zeigt die Kachel denselben Fortschritt.
11. Emils bisheriger Stand (Punkte, Sticker, Päckchen) muss unverändert sein.

## Nächste Schritte für Marco
1. Änderungen ansehen und auf Wunsch pushen: `git push origin preview`
2. Vorschau auf der NAS aktualisieren: im Vorschau-Ordner `./deploy.sh` ausführen (wie bei 1.5.3).
3. Prüfliste oben durchgehen, Auffälliges an Cowork melden.
4. Erst nach Abnahme: Merge nach `main` und Live-Deploy, auf ausdrückliche Anweisung.
5. Danach Auftrag 1.6.0 (Plan K).
