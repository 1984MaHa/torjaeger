# Änderungen

## 1.7.5 (Korrekturen aus der ersten Prüfung)
- **Passkette eindeutig:** Der erste Kreis oben (Anpfiff, gelb) ist jetzt immer vorgegeben, das ist die 0 oder die erste Zahl der Reihe. Dazu kommt höchstens ein weiterer vorgegebener Wert. Vorher konnte man bei einem Wert wie 18 nicht wissen, wo die Kette anfängt, und eine richtige Antwort galt als falsch.
- **Weniger Aufgaben:** Die mitgelieferte Vorlage 9er Reihe hat 5 Aufgaben je Halbzeit. Ein Päckchen in einem eigenen Lager hat so viele Aufgaben, wie bei „Aufgaben je Halbzeit“ (5, 10 oder 15) eingestellt ist, nicht mehr fest 12 bis 16. Das lässt sich in jeder eigenen Vorlage ändern (die mitgelieferte erst kopieren). Im normalen Einmaleins-Päckchen bleibt es bei 12 bis 16.
- **Verständlicher:** Die Taste „Für andere Reihe kopieren“ heißt jetzt „Dieselbe Vorlage für eine andere Reihe anlegen“, mit Erklärung darunter (Reihe antippen, es entsteht sofort eine eigene Vorlage in der Liste).
- Kein Schemawechsel. Version 1.7.5 an allen vier Stellen.

## 1.7.4 (Mitgelieferte Vorlage: 9er Reihe)
- **Neue mitgelieferte Vorlage „9er Reihe“** nach Emils Hausaufgabe, im Eltern-Bereich (Einstellungen, Eigene Trainingslager) in der Liste, **ausgeschaltet** (die Eltern schalten sie je Konto ein). Fünf Einheiten, jede mit einer Aufgabenart: **1 Ballsäcke, 2 Passkette, 3 Rechenkreis vorwärts, 4 Rechenkreis rückwärts, 5 Päckchen Reihe** (je Halbzeit ein Päckchen mit 12 bis 16 Aufgaben und Kontroll-Pfiff). 10 Aufgaben je Halbzeit in den Einheiten 1 bis 4, Nachspielzeit Elfmeterschießen (fünf Schüsse mit Aufgaben der Einheit). Das Abzeichen heißt „Profi: 9er Reihe“.
- **Für andere Reihe kopieren:** Bei der 9er Reihe (und bei jeder eigenen Vorlage mit genau einer Reihe) stehen in der Liste die Tasten der anderen Reihen. Ein Tipp legt sofort eine eigene Vorlage für diese Reihe an (Name passt sich an: „7er Reihe“, bei einem Namen ohne Reihe „Name (7er Reihe)“), mit demselben Ablauf. Die Kopie lässt sich wie jede eigene Vorlage ändern und einschalten.
- Die mitgelieferte Vorlage ist schreibgeschützt (nur kopieren). Die Grenze des Kontos gilt weiter: übt ein Konto die 9er Reihe nicht, nehmen die Aufgaben die Reihen des Kontos (nie eine, die das Konto ausgeschaltet hat).
- Ein Päckchen in einem eigenen Lager hat immer 12 bis 16 Aufgaben, unabhängig von „Aufgaben je Halbzeit“.
- Kein Schemawechsel (Konto 10, global 5). Version 1.7.4 an allen vier Stellen. Tests: `test/v174.test.mjs`, Ende zu Ende `test/v174-e2e.test.mjs` (Kopie für die 7er Reihe, alle fünf Einheiten über die Oberfläche inklusive Zahlenfelder, Päckchen mit Kontroll-Pfiff, Elfmeterschießen). Die älteren Ende-zu-Ende-Tests warten jetzt auch auf die Eltern-PIN am Server.

## 1.7.3 (Baukasten: Eigenes Trainingslager)
- **Eltern-Bereich, Einstellungen, neuer Abschnitt „Eigene Trainingslager“:** Die Eltern stellen ein Lager zusammen: **Name** (zum Beispiel „9er Reihe“), **Themen und Aufgabenarten** aus allen Fächern (Mathe, Deutsch, Englisch, Sachkunde, dazu die neuen Aufgaben zur Reihe aus 1.7.2), **Reihen** (engt die Einmaleins-Grenze des Kontos nur weiter ein, nie auf), „Auch mal 0“ (nur ausschalten), **Einheiten** (1 bis 5), **Aufgaben je Halbzeit** (5, 10 oder 15) und **Nachspielzeit** (Elfmeterschießen, Torwand, Memory, Dribbel-Parcours, Überraschung oder keine).
- **Vorlagen:** speichern, kopieren (öffnet die Kopie zum Umbenennen), bearbeiten, löschen mit Rückfrage. Die Vorlagen gelten für **alle Konten** (global, werden zwischen den Geräten abgeglichen), der **Schalter (An und Aus) und der Fortschritt gelten je Konto**. Mehrere Lager je Konto sind möglich, jedes eingeschaltete Lager hat seine eigene Kachel auf der Startseite. Neu starten (Eltern, je Konto) wie bisher. „Teilen mit Rest“ steht als mitgelieferte Vorlage in der Liste (Fortschritt und Schalter unverändert, es bleibt das fest eingebaute Lager), lässt sich kopieren.
- **Ablauf je Einheit** wie das bisherige Trainingslager (2 Halbzeiten, Halbzeitpause, Abpfiff, Sichern und Fortsetzen, Abzeichen am Ende des Lagers „Profi: <Name>“). Jede Halbzeit mischt alle gewählten Arten (jede kommt vor, soweit die Aufgaben reichen), jede Einheit setzt einen leichten Schwerpunkt auf eine andere Auswahl, Englisch steigt über die Einheiten in der Stufe. Keine Aufgabe kommt in einer Einheit doppelt vor; ist der Vorrat einer kleinen Auswahl erschöpft (zum Beispiel 16 Wörter bei i oder ie), kommt eine andere Auswahl dran. **Nachspielzeit:** Elfmeterschießen wie bisher; Torwand, Memory, Dribbel-Parcours und Überraschung starten als Mini-Spiel mit Aufgaben aus dem Lager (Memory braucht Rechenaufgaben, sonst gilt der Mix); ohne Nachspielzeit geht es gleich mit der nächsten Einheit weiter. Eine Einheit nur aus „Päckchen Reihe“ spielt je Halbzeit ein Päckchen mit Kontroll-Pfiff (so die mitgelieferte Vorlage in 1.7.4).
- **Ändern während ein Kind mitten im Lager ist:** Beim ersten Abschluss einer Einheit friert das Konto die Vorlage ein (`camps["c:<Nr>"].def`). Ändern oder löschen die Eltern die Vorlage danach, läuft das begonnene Lager unverändert weiter (auch eine gelöschte Vorlage bleibt dort, bis das Lager ausgeschaltet wird). Neu starten löscht den Fortschritt und die eingefrorene Vorlage, danach gilt wieder die aktuelle. Vor der ersten Einheit gilt immer die aktuelle Vorlage.
- **Technik:** neues Modul `custom.js` (Vorlagen, Aufgaben je Einheit, Lager-Beschreibung), `tplviews.js` (Liste und Editor), `camp.js` führt die Liste der Lager dynamisch (`CAMPS["c:..."]`, `syncCustomCamps`, wird bei jedem Zugriff auf den Konto-Stand und im Eltern-Bereich aufgefrischt). Mini-Spiele nehmen optional eine Aufgaben-Quelle (`src`).
- **Schema:** Konto **10** (Migration 9 nach 10: `camps` als Objekt, sonst unverändert; `camps[...].def` ist neu, der Server lehnt ein `def`, das kein Objekt ist, ab), global **5** (Migration 4 nach 5: `templates: []`, eine vorhandene Liste bleibt; der Server lehnt `templates`, das keine Liste mit Nummern ist, ab). Abgleich der Vorlagen: je Nummer gewinnt der neuere Eintrag (`t`), auch eine Löschmarke; `def` im Lager: nur Stände vom letzten Neustart bringen sie mit, die neuere gewinnt. Fixtures `state-v9.json`, `global-v4.json`. Version 1.7.3 an allen vier Stellen, neue Dateien in `FILES`. Tests: `test/v173.test.mjs`, Ende zu Ende `test/v173-e2e.test.mjs`.
- **Wichtig beim Einspielen:** Der Server lehnt Stände mit älterem Schema ab (409 `schema_too_old`): Geräte mit App bis 1.7.2 müssen neu laden („Jetzt laden“).

## 1.7.2 (Aufgaben zur Reihe: Ballsäcke, Passkette, Rechenkreis, Päckchen)
- **Anlass:** Emils Hausaufgabe „Die 9er Reihe“. Die Aufgabenarten des Arbeitsblatts gibt es jetzt als Spiel, für jede Reihe von 1 bis 10 (die Reihe kommt aus der Einmaleins-Grenze des Kontos, `rowtasks.js`):
  - **Ballsäcke:** Bild mit 1 bis 10 Säcken, auf jedem Sack steht gut sichtbar die Zahl der Bälle. Das Kind schreibt die Malaufgabe: Anzahl der Säcke und Ergebnis (zwei Felder, die Zahl auf dem Sack steht schon da).
  - **Passkette:** zehn Spieler im Kreis, in jeden Kreis kommt die nächste Zahl der Reihe, ein oder zwei Werte sind vorgegeben. Hin und wieder beginnt die Kette mit der 0 (nur mit „Auch mal 0“).
  - **Rechenkreis vorwärts:** Zielscheibe mit „· k“ in der Mitte, acht Zahlen im inneren Ring, die Ergebnisse kommen in den äußeren Ring.
  - **Rechenkreis rückwärts:** die Ergebnisse stehen außen, der Faktor im inneren Ring wird gesucht (Vorstufe zum Teilen).
  - **Päckchen Reihe:** 12 bis 16 gemischte Aufgaben der Reihe, mit Tauschaufgaben, mal 1, mal 10, mal 0 (nur mit Schalter) und einigen Geteilt-Aufgaben, jede nur einmal; im Päckchen-Ablauf mit Kontroll-Pfiff.
- **Neue Aufgabenart `slots`** (mehrere Zahlenfelder): jedes Feld ist antippbar (Kreis in der Zeichnung, `data-slot`), der Zahlenblock gilt für das aktive Feld, die Taste heißt „Weiter“, bis alle Felder gefüllt sind. Ein schon gefülltes Feld wird beim Antippen neu geschrieben. Nach der Antwort zeigen die Felder richtig oder falsch. Prüfung, Lösungstext, Kontroll-Pfiff und Ändern gehen wie bei den anderen Arten (`isRight`, `givenText`, `rightText`). Tipp und Probe enthalten keine Zahlen, verraten also nie die Lösung.
- **Im normalen Üben:** Das Thema Einmaleins (`m3_1x1`) wechselt ab (jede vierte Aufgabe eine der vier Einzelaufgaben mit einer Reihe aus der Grenze des Kontos, jeder vierte Themenblock ein Reihen-Päckchen). Mini-Spiele, Trainingslager und Mix-Torwand nehmen weiter nur die klassischen Zahlenaufgaben (`GEN.m3_1x1()` ohne Option). Kein neues Thema (kein Eingriff in Aufstieg und Themenliste). Im Baukasten (1.7.3) sind alle Arten wählbar.
- Kein Schemawechsel (bleibt 9). Version 1.7.2 an allen vier Stellen, neue Dateien `rowtasks.js` und `slots.js` in `FILES`. Tests: `test/v172.test.mjs`. Die Ende-zu-Ende-Tests warten jetzt auf den ersten Abgleich mit dem Server (liefen unter Last gelegentlich zu früh).

## 1.7.1 (Einmaleins-Grenze je Konto)
- **Eltern-Bereich, Einstellungen, je Konto:** „Einmaleins“ mit den Reihen 1 bis 10 zum An- und Ausschalten (Standard alle, mindestens eine bleibt) und dem Schalter „Auch mal 0“ (Standard an). Das Ergebnis ist immer höchstens 100, jeder Faktor höchstens 10 (fest).
- **Gilt für alle Aufgaben mit Mal und Geteilt im kleinen Einmaleins:** Einmaleins (die Reihe ist ein Faktor, die andere Zahl 1 bis 10, hin und wieder 0 und 1), Teilen mit Rest (Teiler aus den Reihen, Ergebnis höchstens 10, Rest kleiner als der Teiler), Sachaufgaben mit Rest, Malaufgaben zum Bild (Klasse 2), Päckchen und Kontroll-Pfiff, Trainingslager (alle fünf Einheiten und die Nachspielzeit), Sondertraining, Mini-Spiele und Mix (sie ziehen aus denselben Generatoren). Ein Lager kann nur noch enger machen, nie erweitern. Die Antwortvorschläge der Malaufgaben zum Bild bleiben ebenfalls bei Faktor 10 oder kleiner.
- **Bewusst nicht betroffen:** Rechnen bis 1000 (Plus, Minus) und die Bezirksliga-Themen „Malnehmen groß“ und „Teilen groß“ (zweistellige Zahlen, Ergebnis über 100). **Sonderfall:** Ist nur die 1er-Reihe gewählt, gibt es keinen Teiler für Aufgaben mit Rest (der Rest muss kleiner als der Teiler sein). Dann nehmen diese Aufgaben ersatzweise ihren üblichen Teiler-Bereich, die Grenze für Ergebnis und Faktor gilt weiter.
- **Neu: `mul.js`** (`setMul`, `pickRow`, `otherFactor`, `mulOk`). `app.js` setzt die Grenze bei jedem Zugriff auf den Konto-Stand (`S()`), die Generatoren lesen sie ohne zusätzliche Argumente. Die Ergebnisse im Trainingslager sind jetzt höchstens 10 (vorher bei kleinen Teilern bis 45).
- **Schema 9 (Konto):** `settings.mul = {rows, zero}`. Migration 8 nach 9 setzt die Vorgabe und lässt alles andere (auch Unbekanntes) unverändert; die Einstellung folgt den Regeln von `settings` (neuerer Stand gewinnt). Der Server lehnt ein `settings.mul`, das kein Objekt ist, ab. Fixture `state-v8.json`. Version 1.7.1 an allen vier Stellen. Tests: `test/v171.test.mjs` (Migration, Eltern-Bereich, je Generator viele Zufallsläufe mit einzelnen und mehreren Reihen, mit und ohne 0).
- **Wichtig beim Einspielen:** Der Server lehnt Stände mit älterem Schema ab (409 `schema_too_old`), Geräte mit App bis 1.7.0 müssen neu laden („Jetzt laden“).

## 1.7.0 (Überblick hinter dem Fragezeichen)
- **Info-Grafik:** Auf „Wer spielt?“ gibt es oben rechts eine runde Taste „?“ (48 px). Sie öffnet die Überblicks-Grafik „Was die Torjäger-Liga ist und wie sie aufgebaut ist“ bildschirmfüllend, mit Tasten zum Vergrößern und Verkleinern (bis dreifach, verschieben durch Wischen) und „Schließen“. Keine PIN. Die Grafik ist ein Bild (`app/img/ueberblick.jpg`, 1600 px, unter 400 KB, in `FILES` von `sw.js`, also offline da), das Original liegt in `assets-src/TorjaegerLiga-Ueberblick.jpg`.
- Kein Schemawechsel (bleibt 8). Version 1.7.0 an allen vier Stellen. Tests: `test/v170.test.mjs`.

## 1.6.7 (Liga-Freigaben gehören dem Server)
- **Freigeben und Sperren nur mit Eltern-PIN, über den Server:** Neuer Aufruf `POST /api/admin/profiles/<id>/league` (`{pin, li, open}`). Die Trainerbank in der Kabine und der Eltern-Bereich („Ganz freigeben“, „Wieder sperren“) rufen ihn auf; erst wenn der Server ja sagt, gilt die Änderung auch auf dem Gerät. Ohne Verbindung zum Server gibt es eine freundliche Meldung („geht nur mit Verbindung“).
- **Der normale Abgleich ändert keine Freigabe mehr:** Beim Speichern eines Kontos (`PUT .../state`) behält der Server den gespeicherten Wert von `progress.lg.<Liga>.open` (`guardLeagues` in `rules.js`). Ein älterer oder veränderter Stand kann also weder eine Liga freigeben noch eine Freigabe aufheben. Die Antwort nennt, was der Server festgehalten hat (`lg`), und die App gleicht sich an. Wird ein Konto neu angelegt (noch kein Stand auf dem Server), gilt der erste Stand, damit alte lokale Konten ihre Freigaben mitbringen.
- Probetraining (`probe`, `spent`) ist davon nicht betroffen: Es entsteht weiter durch das Spielen. Kein Schemawechsel (bleibt 8). Version 1.6.7 an allen vier Stellen. Tests: `test/v167.test.mjs` (der Test „Freigabe am einen Gerät“ in `sync.test.mjs` geht jetzt über den Eltern-Weg).
- **Wichtig beim Einspielen:** Ältere App-Versionen (bis 1.6.6) geben lokal frei und gleichen ab; der Server ignoriert das für die Freigabe. Bitte alle Geräte auf 1.6.7 bringen (Hinweis „Jetzt laden“).

## 1.6.6 (Überraschungsspiel)
- **Überraschungsspiel** in den Mini-Spielen der Kabine: Ein Tipp, und die App lost eines der Mini-Spiele (Torwand, Memory, Dribbel-Parcours) aus. Die zuletzt gespielte Art kommt nicht gleich wieder, solange es eine andere gibt. Nach dem Spiel gibt es „Noch eine Überraschung“. Wer lieber selbst wählt, tippt weiterhin auf das Mini-Spiel seiner Wahl.
- Arten ohne passende Aufgaben (zum Beispiel Memory, wenn alle Rechenthemen aus sind) werden nicht gelost. Gibt es gar kein spielbares Mini-Spiel, steht in der Kabine ein freundlicher Hinweis statt eines Fehlers. Das gilt auch für die einzelnen Mini-Spiele.
- Kein Schemawechsel (bleibt 8). Version 1.6.6 an allen vier Stellen. Tests: `test/v166.test.mjs`.

## 1.6.5 (Mini-Spiel Dribbel-Parcours)
- **Dribbel-Parcours** in den Mini-Spielen der Kabine: Eine Strecke mit fünf Hindernissen (Hütchen und Gegner im Wechsel) und dem Tor am Ende. Jede **richtige Antwort** (vier Antworten zum Antippen) bringt den Spieler an einem Hindernis vorbei (10 Punkte, 15 ab der dritten in Folge). Bei einer **falschen Antwort ist der Ball verloren**: Erklärung, dann eine neue Aufgabe am selben Hindernis. Nach dem fünften Hindernis fällt das Tor: Bonus 20 Punkte ohne verlorenen Ball, sonst 10.
- Es gibt höchstens zwölf Aufgaben je Spiel. Wer bis dahin nicht durch ist, bekommt das Ergebnis „bis Hindernis x von 5“ (kein Bonus). Aufgaben wie bei der Torwand aus dem Mix der aktiven Themen, die Antworten zählen im Lernstand (ohne Spiel, Sticker und Probetraining-Verbrauch).
- Kein Schemawechsel (bleibt 8). Version 1.6.5 an allen vier Stellen. Tests: `test/v165.test.mjs`.

## 1.6.4 (Mini-Spiel Memory)
- **Memory** in den Mini-Spielen der Kabine: Zehn Karten, fünf Aufgaben (kurze Rechenaufgaben wie „7 · 8“) und fünf Ergebnisse (56). Zwei Karten antippen: Passen sie zusammen, bleiben sie offen (+10 Punkte), sonst bleiben beide liegen, bis die nächste Karte angetippt wird (dann werden sie wieder verdeckt). Am Ende steht, wie viele Versuche es waren.
- Die Karten kommen aus den aktiven Rechenthemen des Mixes (Aufgaben, deren Frage mit „= ?“ endet). Jede Aufgabe und jedes Ergebnis kommt nur einmal vor. Ist kein Rechenthema an, gibt es kein Memory.
- **Memory zählt nicht im Lernstand** (beim Raten wären fast alle ersten Versuche falsch und würden den Stand verfälschen und die Frust-Bremse auslösen). Es gibt nur die Punkte (`applyMiniPoints`), kein Spiel, keinen Sticker.
- Kein Schemawechsel (bleibt 8). Version 1.6.4 an allen vier Stellen. Tests: `test/v164.test.mjs`.

## 1.6.3 (Mini-Spiel Torwand)
- **Mini-Spiele in der Kabine:** Neuer Bereich „Mini-Spiele“ auf der Startseite des Kontos. Den Anfang macht die **Torwand**: Fünf Aufgaben aus dem Mix der aktuellen Liga (nur aktive Themen), die Antworten stehen als Zahlen oder Wörter auf vier Löchern einer Torwand. Ein Tipp auf das richtige Loch ist ein Tor, ein falsches Loch ein Fehlschuss mit Rückmeldung und Erklärung. Ergebnis wie „4 : 1“, Punkte wie im Elfmeterschießen (10 je Tor, 15 ab dem dritten in Folge).
- Die Antworten zählen im Lernstand des Themas. Es gibt kein Spiel, keinen Sieg, keinen Sticker und keinen Verbrauch vom Probetraining (wie das Elfmeterschießen). Nicht jede Aufgabe taugt für die Löcher (Zuordnen, Sortieren und Paare fehlen), es werden nur passende Aufgaben gezogen.
- Wiederverwendbar gebaut für die weiteren Mini-Spiele: `mini.js` (Regeln: `newMini`, `miniAnswer`, `miniNext`, Aufgabenwahl) und `miniviews.js` (Darstellung, Auswahl in der Kabine). Beide Dateien stehen in `FILES` des Service Workers.
- Kein Schemawechsel (bleibt 8). Version 1.6.3 an allen vier Stellen. Tests: `test/v163.test.mjs`.

## 1.6.2 (Frust-Bremse)
- **Drei Fehler in Folge im selben Thema** (in einer Runde, Spiel mit einzelnen Aufgaben): Das Thema kommt für den Rest der Runde seltener dran (Gewicht mal 0,15, es verschwindet nicht ganz), und bei der nächsten Aufgabe bietet der Trainer von selbst einen Tipp an („Soll ich dir einen Tipp geben?“). Im Trainingslager und im Päckchen greift die Bremse nicht (die Aufgaben stehen dort fest).
- **Eltern-Bereich, Reiter Stand:** Beim Thema steht „Drei Fehler in Folge. Ist das schon im Unterricht dran?“, solange die letzten drei gezählten Antworten falsch waren. Die Markierung wird aus den letzten Antworten abgelesen und verschwindet nach der ersten richtigen. Zurückgestellte und ausgeschaltete Themen werden nicht markiert.
- Kein Schemawechsel (bleibt 8), kein neues Datenfeld. Version 1.6.2 an allen vier Stellen. Tests: `test/v162.test.mjs`.

## 1.6.1 (Themen-Zustände, Schema 8)
- **Neuer Zustand „Zurückgestellt“** je Thema (Eltern-Bereich, Einstellungen, Themen), freiwillig mit **Datum**: Ab diesem Tag ist das Thema von selbst wieder aktuell. Zurückgestellte Themen kommen nicht ins Spiel und blockieren den Aufstieg nicht (wie ausgeschaltete). Die Zustände sind jetzt: Aktuell, Wiederholen, Zurückgestellt, Aus, Schwerpunkt.
- **Neue Themen starten zurückgestellt** (spätere App-Versionen): Das Konto merkt sich in `settings.topicSeen`, welche Themen es kennt. Fehlt ein Thema dort, ist es neu. Die Eltern geben es mit Aktuell oder einem anderen Zustand frei. Bestehende Konten und neue Konten kennen alle heutigen Themen, bei ihnen ändert sich nichts.
- **Schema 8** (global bleibt 4): Migration 7 nach 8 trägt `topicSeen` ein und ändert sonst nichts (Fixture `test/fixtures/state-v7.json`, Format 1.6.0). Schwerpunkt, Aus und Wiederholen aus 1.4.0 und 1.6.0 bleiben verlustfrei. Tests: `test/v161.test.mjs`. Version 1.6.1 an allen vier Stellen.

## 1.6.0 (Sondertraining für jedes Thema, Schwerpunkt)
- **Schwerpunkt:** Im Eltern-Bereich (Reiter Einstellungen, Themen) gibt es je Mathe- und Deutsch-Thema neben Aktuell, Wiederholen und Aus den Zustand **Schwerpunkt**. Mehrere Themen können Schwerpunkt sein. Für Englisch und Sachkunde gibt es ihn nicht.
- **Sondertraining:** Für jedes Schwerpunkt-Thema erscheint auf der Startseite eine Kachel „Sondertraining: <Thema>“ mit drei Einheiten (Aufwärmen, Training, Spieltag). Jede Einheit hat zwei Halbzeiten zu je 10 Aufgaben mit Halbzeitpause, Abpfiff, Elfmeterschießen als Nachspielzeit, Sichern und Fortsetzen, Abzeichen „Trainings-Profi“ nach Einheit 3. Die Aufgaben kommen aus dem Generator des Themas, die Antworten zählen im Lernstand des Themas. Teilen mit Rest behält seine fünf besonderen Einheiten und seinen eigenen Schalter (die Kachel erscheint dort auch, wenn das Thema Schwerpunkt ist).
- **Mix:** Schwerpunkt-Themen kommen im Mix und in den Fächern etwa bei jeder dritten Aufgabe dran (Zufall mit Wahrscheinlichkeit 1/3, danach normale Gewichtung unter den Schwerpunkt-Themen).
- Kein Schemawechsel (bleibt 7): Der Wert liegt in `settings.topicMode.<Thema> = "schwerpunkt"`, der Fortschritt in `camps.<Thema>` wie bei Teilen mit Rest. Ältere App-Versionen behandeln „schwerpunkt“ wie „aktuell“. Version 1.6.0 an allen vier Stellen. Tests: `test/v160.test.mjs`.

## 1.5.5 (Fächer ganz ausschalten)
- **Fächer-Schalter im Eltern-Bereich:** Reiter Einstellungen, Abschnitt „Fächer“ (je Konto): Mathe, Deutsch, Englisch und Sachkunde lassen sich einzeln auf Aus stellen. Ein ausgeschaltetes Fach verschwindet aus der Spielauswahl, dem Mix, den Themenlisten, der Trainerbank und dem Aufstieg (es blockiert ihn nicht). Ist kein Fach mehr an, steht ein freundlicher Hinweis da. Die Einstellungen der einzelnen Themen bleiben erhalten und gelten wieder, sobald das Fach auf An steht.
- Kein Schemawechsel: Der Schalter liegt in `settings.fachOff` (`{deu: true}`), Zusammenführen wie die übrigen Einstellungen (neuerer Stand gewinnt). Version 1.5.5 an allen vier Stellen (neue Nummer, damit das iPad die neue Fassung sicher lädt).
- **Hinweis „Jetzt laden“** erscheint jetzt auch in „Wer spielt?“ und im Eltern-Bereich, nicht nur auf der Startseite eines Kontos. Die App fragt beim Zurückkehren nach einer neuen Version (`swReg.update()`) und zeichnet den Hinweis sofort, wenn gerade nichts getippt wird.
- Tests: 5 neue in `test/v154.test.mjs`.

## 1.5.4 (Vorschau: Trainingslager „Teilen mit Rest“)
Vorgezogener erster Baustein des Sondertrainings aus 1.6.0, zugeschnitten auf ein Thema, aber je Thema aufgebaut (`camps: { m3_rest: ... }`, `CAMPS` in `camp.js`). Leitbild: Freude am Lernen und Wiederholen vor Perfektion.

### Geändert
- **Teilen mit Rest ohne Punktebilder:** Die Punktegruppen unter den Aufgaben „a : b = ? Rest ?“ sind überall weg (Spiel, Päckchen, Trainingslager), weil sie die Lösung verraten. Die Hilfe vom Trainer bleibt.

### Neu
- **Kachel „Trainingslager: Teilen mit Rest“** oben auf der Startseite (nur wenn die Eltern es einschalten, Standard aus) mit Fortschritt (x von 5 Einheiten) und Abzeichen „Rest-Profi“. Die nächste Einheit ist frei, sobald die vorige zu Ende gespielt ist (keine Mindestquote), fertige Einheiten lassen sich wiederholen.
- **Eine Einheit = zwei Halbzeiten** zu je 10 Aufgaben mit Halbzeitpause (Zwischenstand, Trainer-Satz, „2. Halbzeit anpfeifen“), Abpfiff mit Ergebnis und Bonus wie bei normalen Runden, danach **Nachspielzeit**.
- **Fünf Einheiten:** 1 Aufwärmen (Einmaleins rückwärts, Teilen ohne Rest, Teiler 2 bis 5), 2 Erste Reste (Teiler 2 bis 5, bis 50, ohne Punktebilder), 3 Alle Reihen (Teiler 2 bis 9, bis 90, freundliche Rückmeldung „Da passt noch einer rein!“, wenn der Rest zu groß ist), 4 Kontroll-Pfiff (je Halbzeit ein Päckchen mit 6 Aufgaben und Probe), 5 Spieltag (Sachaufgaben mit Rest: Busse, Kabinen, Netze, Mannschaften, Kästen; Aufrunden oder Abrunden steht eindeutig im Text). Die Erklärung nennt den Rechenweg (5 · 3 = 15, 17 − 15 = 2).
- **Elfmeterschießen** (Mini-Spiel, wiederverwendbar mit einer Liste von Aufgaben): 5 Schüsse, richtig = Tor, falsch = der Torwart hält („Gehalten!“), Ergebnis wie 4 : 1. Neue Torszene mit Torwart (`sceneSVG` mit `keeper`), mit `prefers-reduced-motion` steht die Endpose. Das Elfmeterschießen kommt nur nach dem Abpfiff der Einheit.
- **Sichern und Fortsetzen:** Ein laufendes Spiel (Halbzeit, Halbzeitpause, Kontroll-Pfiff, Elfmeterschießen) liegt auf dem Gerät (`camp:<Konto>`, nicht im Spielstand) und wird bei jeder Antwort, bei „Kabine“ und im Hintergrund gesichert. In der Kabine: „Weiterspielen“ oder „Neu anfangen“.
- **Eltern-Bereich:** Schalter je Konto (im Reiter Konten unter der Karte des Kontos), Fortschritt je Einheit (Ergebnis je Halbzeit und Elfmeterschießen), „Trainingslager neu starten“ mit Rückfrage. Im Verlauf heißt der Modus „Trainingslager“.

### Datenmodell (Schemaversion 7, global 4)
- Neu: `camps.<Thema>` = `{on, t, rs, units: {"1": {h1:{c,n}, h2:{c,n}, pen?:{c,n}, t, runs}}, badge}`. Migration 6 nach 7 ergänzt `camps: {}`, alles andere bleibt (Test mit Fixture `state-v6.json` im Format 1.5.3). Mindeststruktur: `camps` ist freiwillig, wenn vorhanden ein Objekt (je Thema ein Objekt, `units` ein Objekt), unbekannte Felder bleiben erlaubt.
- Zusammenführen: Schalter der neuere Stand (`t`), Neustart (`rs`) gewinnt vollständig, sonst je Einheit der neuere Stand, Abzeichen der frühere Zeitpunkt.
- Zurücksetzen des Kontos löscht den Fortschritt, der Schalter bleibt. Die Antworten im Trainingslager verbrauchen kein Probetraining.

### Technik
- Neue Dateien `js/camp.js` (Inhalt, Generatoren, Sichern) und `js/campviews.js` (Darstellung), beide in `FILES` des Service Workers. Version 1.5.4 an allen vier Stellen.
- Neue Tests: `test/v154.test.mjs` (28) und `test/v154-e2e.test.mjs` (Ende zu Ende mit Eltern-Bereich, Halbzeitpause, Fortsetzen, Elfmeterschießen, Einheit 4, Abzeichen, Neustart). Ältere Tests auf Schema 7 und Version 1.5.4 angepasst.

## 1.5.3 (Vorschau: Korrekturen nach der Bewertung vom 01.10.2026)
Leitbild: Freude am Lernen und Wiederholen, nah am Lehrplan, ohne didaktischen Umbau. Gezielte Korrekturen, der Spielfluss bleibt. Kein Schemawechsel (Konto 6, global 4), Updates setzen keinen Stand zurück. Jede Korrektur hat einen Regressionstest (neue Dateien `test/v153*.test.mjs`).

### Sofort-Korrekturen (fachlich falsch oder Datenverlust)
- **i/ie:** Die Vorlagen ergaben falsche Wörter („Lieed“, „Spieel“). Die Lücke wird jetzt aus dem Zielwort abgeleitet. „Lied“ entfällt (mit i wäre „Lid“ auch ein Wort), dafür „Fliege“. Test für alle Rechtschreib-Listen: Vorlage plus Lösung ergibt genau das Zielwort aus der Wortliste, die falsche Wahl ergibt kein richtiges Wort.
- **Netze:** Die Erklärung sagte immer „halb voll“. Jetzt steht der echte Rest da („Im letzten Netz liegen nur 3 Bälle, das Netz ist nicht voll“). Test über 4000 Zufallsaufgaben.
- **Gleichzeitiges Speichern:** Der Server las den Stand vor dem Einlesen der Anfrage, zwei Schreiber mit gleicher `baseRev` konnten beide gewinnen. Jetzt wird nach dem Einlesen gelesen und ohne Pause geprüft und geschrieben. Der zweite bekommt 409 und führt zusammen. Gilt für Konten und Einstellungen. Tests mit parallelen und mit gestückelten Anfragen.
- **Mindeststruktur:** Der Server lehnt einen unvollständigen Stand mit 400 ab (`checkProfileState`, `checkGlobalState` in `model.js`, Pflichtfelder in SPEC.md). Unbekannte Zusatzfelder bleiben erlaubt. Die App sendet nie einen unvollständigen Stand (Abgleich-Grund `invalid`). Fixtures aller bisherigen Formate werden angenommen.
- **Päckchen gehen nicht mehr verloren:** Ein laufendes Päckchen wird bei jeder Antwort, beim Antippen von „Kabine“ und beim Wechsel der App in den Hintergrund auf dem Gerät gesichert. In der Kabine steht „Päckchen weiterspielen?“ mit Weiterspielen und Neu anfangen. Keine Rückfrage vor dem Verlassen nötig. Reguläre Runden werden nicht gesichert (beantwortete Aufgaben zählen schon).
- **Lokales Speichern:** Schreibfehler in IndexedDB werden abgefangen und wiederholt. Klappt es nicht, erscheint oben ein roter Hinweis für die Eltern, nichts geht still verloren. Test mit simuliertem Fehler.
- **PIN-Schutz:** Die Eltern-PIN lässt sich über den normalen Abgleich nicht mehr ersetzen. Der Server behält eine gesetzte PIN, die App übernimmt immer die PIN des Servers. Ändern geht nur über „Eltern-PIN ändern“ (alte PIN nötig), die neue PIN kommt danach auf allen Geräten an. Der Alt-Hash des Prototyps wird vom Server aufgewertet. „PIN merken“ der Kinder-PIN bleibt.

### Leichte Übernahmen
- **Warum stimmt das?** Nach einer richtigen Antwort steht im Tor-Overlay eine Taste. Antippen hält das automatische Weiter an und zeigt die Erklärung bis „Weiter“. Ohne Antippen läuft es wie bisher nach 1,8 Sekunden weiter.
- **Mix-Taste** heißt „Mix: Mathe & Deutsch“.
- **Hilfetaste** mindestens 44 Punkte hoch, die Kopfzeile der Frage darf umbrechen.
- **Zuordnen:** Paare tragen zusätzlich zur Farbe eine Nummer, auf beiden Seiten gleich.
- **Kontoanlage:** Bei einem Fehler bleibt der Name stehen und das fehlerhafte Feld bekommt den Fokus.
- **Eltern-Bereich und Trainerbank:** „zuletzt sicher geübt“ statt „sicher“. Das Häkchen für Emil bleibt.
- **Englisch-Bilder:** Leicht verwechselbare Wörter (Mund und Zunge, Schuhe und Stiefel, Vogel und Ente, Sonne und heiß, Mutter und Oma und weitere) kommen nie zusammen in einer Bildauswahl vor (`CONFUSE`). Mutter und Vater mit Baby-Fläschchen, Frühling mit Kirschblüte statt Tulpe. `docs/Inhalte-Englisch-Sachkunde.md` neu erzeugt.

### Technik
- Version 1.5.3 an allen vier Stellen. Keine neuen Dateien in `app/`.
- Neue Tests: 30 in `test/v153.test.mjs`, `test/v153-server.test.mjs`, `test/v153-client.test.mjs`, `test/v153-e2e.test.mjs`.

## 1.5.2 (Vorschau: Nummer höher, Trainer von hinten, PIN merken)
Nachbesserung nach Marcos zweiter Sicht. Die Versionsnummer steigt, weil der Service Worker unter gleicher Nummer die alte Fassung im Cache behält. Keine Änderung am Datenmodell.
- **Rückennummer** hängt jetzt direkt unter dem Namen (vorher am unteren Rand des Feldes) und ist größer, bei einer Ziffer etwa 160 Punkte hoch.
- **Buchstabenabstand** nach Breite der Buchstaben (I schmal, M und W breit), damit "EMIL" nicht mehr "EMI L" aussieht.
- **PIN merken:** beim Eingeben der PIN des Kindes "Heute nicht noch einmal fragen" (vorbelegt). Gemerkt wird der Tag und die PIN auf dem Gerät (`pinok:<Konto>`), eine geänderte PIN fragt wieder.
- **Trainer im Eltern-Bereich** zeigen vorn und hinten die ganze Figur plus Brustbild. Neue Bilder `fig-trainer-back` und `fig-trainerin-back` (je Grundbild und Ebene).
- **Name der Trainer** steht vorn klein auf der Brust (links) und hinten gebogen auf dem Rücken, in hell oder dunkel je nach Polofarbe.

## 1.5.1 (Vorschau: feste Bild-Vorlagen statt Avatar-Baukasten)
1.5.1 ist 1.5.0 mit höherer Versionsnummer, damit der Service Worker den alten Cache verwirft (unter 1.5.0 blieb auf dem iPad die erste Fassung stehen). Der gezeichnete Avatar-Baukasten (1.3.0) ist ersetzt durch **feste Bild-Vorlagen** aus Marcos Bildern: Emil vorn und hinten, dazu Trainer und Trainerin. Schemaversion 6 (Konto) und 4 (global). Ein Stand im Format 1.4.1 wird beim ersten Start ohne Verlust migriert, Emils Trikotfarben, Nummer, Name und Mannschaftsname bleiben.

### Neu
- **Figuren aus Bildern:** Emil (blondes Haar, blaues Trikot mit weißen Streifen) als Ganzfigur von vorn und hinten, Trainer (Glatze, Brille) und Trainerin (blond, Bob, Creolen) als Brustbild. Alle freigestellt (durchsichtiger Hintergrund), Markenlogos auf Trikotbrust und Stutzen sind übermalt. Die Originale liegen in `assets-src/`, die fertigen Bilder in `app/img/` (zusammen etwa 0,9 MB, alle im Offline-Cache).
- **Umfärben zur Laufzeit** (`figures.js`): Trikot, Streifen, Hose und Stutzen des Kindes sowie Polo, Hose und Stutzen der Trainer haben eine eigene Umfärb-Ebene. Sie wird in der gewählten Farbe eingefärbt, Falten und Schatten bleiben sichtbar. Das Ergebnis wird je Farbkombination zwischengespeichert.
- **„Mein Spieler“** ist jetzt eine Seite: Vorschau vorn und hinten, 10 Vereinsfarben-Vorschläge, 13 feste Farben je Bereich, Rückennummer, eigener Name und Name der Mannschaft. Der Baukasten mit den sechs Schritten (Kopfform, Frisur, Gesicht, Kleidung) ist aus der Oberfläche und aus dem Code entfernt.
- **Rückenfeld:** der Name ist leicht gebogen über der Nummer, beides im Rückenfeld, lange Namen und zweistellige Nummern werden kleiner, nie über die Hose. Die Schriftfarbe wird automatisch hell oder dunkel gewählt (guter Kontrast zur Trikotfarbe). Vorn steht eine kleine Nummer auf der Brust, wo das Logo war.
- **Vereinsname** steht auf der Kachel in „Wer spielt?“, in der Kabine und auf der Anzeigetafel (Kopfzeile im Spiel, „Heim“ im Ergebnis).
- **Torszene** mit der Rückansicht der Vorlage. Der Spieler macht beim Schuss einen kleinen Satz nach vorn. Mit `prefers-reduced-motion` bleibt er stehen.
- **Trainerteam im Eltern-Bereich:** Name und Farben von Polo, Hose und Stutzen (vorher Baukasten mit Frisur, Bart, Brille und mehr).
- **Vorlagen-Auswahl vorbereitet:** `KID_TEMPLATES` in `avatar.js`, vorerst nur „Emil“. Weitere Vorlagen kommen als Bilddatei plus Eintrag dazu, die Auswahl erscheint von selbst.
- **Werkzeug** `tools/prepare-figures.mjs` (mit `figures.config.mjs`, `fig-lib.mjs`, `png.mjs`, `jpg2png.ps1`) bereitet Bilder auf, nur Node. Ablauf im README, Abschnitt „Figuren-Vorlagen“.

### Nachbesserung nach Marcos erster Sicht (gleiche Version 1.5.0, Vorschau)
- **Emil größer und lesbarer:** Vorschau 300 statt 230, Torszene 190 statt 150 Bildpunkte. Rückennummer rutscht höher und wird größer, der eigene Name ist größer. Die Nummer auf der Brust ist deutlich größer.
- **Mannschaftsname auf dem Trikot:** klein und gebogen oben auf dem Rücken, über dem eigenen Namen.
- **Trainer im Eltern-Bereich:** neben dem Brustbild jetzt die ganze Figur, damit man die Kleidung sieht.
- **Start immer auf „Wer spielt?“** mit den Bildern der Konten.
- **PIN des Kindes** (freiwillig, 4 Ziffern): Kachel zeigt „(PIN)“ und fragt sie ab. Gesetzt in „Mein Spieler“, für Eltern sichtbar, änderbar und entfernbar im Eltern-Bereich (`profile.pin`, der neuere Stand gewinnt, kein Schemawechsel).

### Datenmodell (Schemaversion 6, global 4)
- `profile.avatar`: `v` 4, `tpl`, `kit {trikot, streifen, hose, stutzen}`, `number`, `shirtName`, `team`, `t`. Migration 5 nach 6: Trikotfarbe, Streifenfarbe (`c2`), Hose, Stutzen, Nummer, Name und Mannschaft werden übernommen. Alle alten Felder (Frisur, Gesicht, `shirt`, `c1`, ...) bleiben im Stand erhalten, werden aber nicht mehr benutzt. Ein Stand ohne `kit` wird beim Lesen aus den alten Feldern gedeutet.
- Global: `trainer.look` und `trainer2.look` haben `polo`, `hose`, `stutzen`. Die frühere Jacke wird zur Polo-Farbe, nie geänderte Trainer bekommen die neue Vorgabe (Migration 3 nach 4).
- Zusammenführen unverändert: das Aussehen mit dem neueren `avatar.t` gewinnt vollständig, ebenso Trainer und Trainerin.
- Neue Dateien: `js/figures.js`, `js/figdata.js` und acht PNG in `img/` (alle in `FILES` des Service Workers). Version 1.5.0 an allen vier Stellen.
- Keine Änderungen an Aufgaben, Fächern, Ligen, Kontroll-Pfiff und Stickern.

## 1.4.1 (Vorschau: Rückmeldungen nach der ersten Sicht)
Nachbesserung zu 1.4.0 nach Marcos erster Prüfung. Keine Änderung am Datenmodell (Schemaversion 5).

### Behoben und geändert
- **Kontroll-Pfiff** zeigt jetzt, was gesucht war: das Bild der Frage (zum Beispiel der Farbkasten in Stufe 3), bei Hör-Aufgaben die Hörtaste, und die eigene Antwort als Bild.
- **Keine Frage doppelt:** dieselbe Aufgabe kommt in einem Spiel und in einem Päckchen nicht zweimal dran (Prüfroutine `nextTask` mit `keyOf`, bei Englisch je Wort in allen Stufen und Hör-Aufgaben).
- **Zuordnen:** Paarfarben ohne Rot und Grün (Blau, Lila, Türkis, Bernstein, Magenta), damit ein Paar nicht wie „falsch“ aussieht.
- **Stoff noch nicht gehabt:** Himmelsrichtungen und Karte sind so markiert. Sie kommen seltener dran, zeigen „Raten ist okay“, und eine falsche Antwort zählt nicht für die Wertung (Begriff `late` in `content-su.js`).
- **Ruhigere Aufgabenansicht:** Trainerteam klein oben rechts in der Fragenkachel, groß erst bei Angebot, Hilfe oder Antwort.
- **Startseite:** keine grauen Themenkästen mehr in der Liga-Karte. Fächer mit Symbolen statt Buchstaben (Taschenrechner, Buch, Sprechblase, Keimling, Würfel). Trainerbank ist immer eingeklappt und bleibt nur offen, solange man sie selbst aufgeklappt hat.
- Neue Datei `icons.js` (in `FILES`). Version 1.4.1 an allen vier Stellen.

## 1.4.0 (Vorschau: Englisch und Sachkunde)
Zwei neue Fächer für die Kreisliga (Klasse 3), vier neue Aufgabenarten, Vorlesen englischer Wörter und die Steuerung der Themen im Eltern-Bereich. Schemaversion 5 (Konto), global bleibt 3. Ein Stand im Format 1.3.0 wird beim ersten Start ohne Verlust migriert. Die Nachbesserung 81eb864 zu 1.3.0 steht schon im Abschnitt 1.3.0 unten.

### Neu
- **Englisch** (10 Themen, je mindestens 10 Wörter) mit drei Stufen je Thema: Bild wählen, Zuordnen englisch zu deutsch, Bild zur richtigen Schreibweise. Die Stufe steigt je Thema ab 8 von 10 richtig. Farben als Farbkästen, Zahlen als große Ziffern, sonst Emoji.
- **Sachkunde** (7 Themen nach Lehrplan Sachsen): Sinne, Pflanzen/Tiere/Lebensräume, Getreide, Kartoffel, Wasser, Himmelsrichtungen und Karte (mit Kompassrose zum Antippen), Straßenverkehr.
- **Vier neue Aufgabenarten** für alle Fächer: Zuordnen in zwei Spalten, Bild wählen, Sortieren in Körbe, Reihenfolge. Nur Antippen, große Flächen. Zuordnen färbt Paare, zeigt falsche Paare danach, Statistik je Begriff.
- **Vorlesen:** Taste 🔊 an englischen Wörtern (Gerätestimme, en-GB bevorzugt), nur nach Antippen, dazu Hör-Aufgaben. Ohne englische Stimme sind beide weg.
- **Kreisliga-Karte:** neben Mathe und Deutsch die Tasten Englisch und Sachkunde mit Mix und Themenblöcken (Päckchen mit 4 Aufgaben, Kontroll-Pfiff, Probe „Schau dir jedes Paar noch einmal an“). Das Mix-Spiel bleibt bei Mathe und Deutsch. Eigener Fortschritt mit Häkchen je Thema, für den Aufstieg zählen weiter nur Mathe und Deutsch.
- **Themensteuerung im Eltern-Bereich** je Konto und Thema (alle Fächer): aktuell, wiederholen (seltener), aus (ausgeblendet). Ein ausgeschaltetes Thema blockiert den Aufstieg nicht. Der Lernstand zeigt Englisch mit Stufe, Sachkunde und die schwächsten Begriffe.
- `docs/Inhalte-Englisch-Sachkunde.md`: lesbare Prüfliste aller Wörter, Bilder, Aufgaben und Lösungen, unsichere Stellen markiert (erzeugt mit `tools/inhalte-liste.mjs`).

### Datenmodell (Schemaversion 5)
- `settings.topicMode` (je Thema wiederholen oder aus), `stats.<Thema>.lv` (Englisch-Stufe), `stats.<Thema>.terms` (Statistik je Begriff, je Gerät), `stats.<Thema>.last[].lv`, Spielarten `eng` und `su` im Verlauf. Migration 4 nach 5 ergänzt nur `topicMode` (`{}`).
- Zusammenführen: Einstellungen (mit `topicMode`) neuerer Stand, `lv` höherer Wert, `terms` je Gerät der größere Wert, angezeigt die Summe.
- Neue Dateien: `content-en.js`, `content-su.js`, `tasks.js`, `inputs.js`, `speech.js` (alle in der `FILES`-Liste des Service Workers). Version 1.4.0 an allen vier Stellen.

## 1.3.0 (Vorschau: neue Avatare)
Nachbesserung nach Marcos erster Sicht: Bäckchen dezent und klein, Vorgabe aus; Zöpfe hängen am Kopf; Haarkappe enger (Pony und Co. wirken nicht mehr wie ein Helm); Halbzopf mit Haargummi statt Schleife; Cap und Mütze eng am Kopf; Schritt 5 zeigt das Porträt mit der Kleidung; Vorschau oben und Weiter-Leiste unten bleiben stehen (weniger Scrollen); neuer Kragen „Rund, dunkler“ und Haarfarbe „sandblond“, damit sich Emil nachbauen lässt (Vorlage Torjäger).

Schemaversion 4 (Konto) und 3 (global). Ein Stand im Format 1.2.1 wird beim ersten Start ohne Verlust migriert.

### Neu
- **Neuer flacher Zeichenstil:** keine Konturlinien, große weiche Farbflächen, großer runder Kopf, Punkt-Augen mit Lichtpunkt, Bogen-Brauen, Strich-Nase, rosa Bäckchen, Lächel-Linie oder offenes Lachen. Keine Lippen, keine Fläche oder Kontur um Mund und Kinn: nichts sieht mehr nach Bart aus (Schatten nur am Hals).
- **Ganzkörperfigur als Hauptfigur** mit kindgerechten Proportionen, Trikot (Kragen, Muster, kleine Nummer), Hose, Stutzen und Schuhen, vorn und hinten, in der Torszene mit Schusspose. Das **Brustbild** auf Kachel, Trainerbank und Sprechblasen ist ein Ausschnitt derselben Figur im runden Pastellkreis (Hintergrund wählbar oder aus der Vereinsfarbe).
- **Baukasten als geführter Ablauf in 6 Schritten:** 1 Junge oder Mädchen, 2 Kopfform und Hautton, 3 Frisur und Haarfarbe, 4 Gesicht, 5 Kleidung und Zubehör fürs Porträt, 6 Trikot und Verein. Große Vorschau mit Umschalter vorne und hinten (Kopf vergrößert bei den Gesichtsschritten), Zurück, Weiter, Würfel, Fertig. Jeder Schritt ist später einzeln wieder aufrufbar. Junge oder Mädchen ist nur eine Vorauswahl und schränkt nichts ein.
- **19 Frisuren** für alle (neu frei wählbar auch Bob, Halblang, Lang, Halbzopf, Pony für Jungen und Wuschel, Igel und Co. für Mädchen), Brauenfarbe wie die Haare oder eigene, vier Münder (Lächeln, Breites Lachen, Ernst, Überrascht), Bäckchen an oder aus, Porträt-Kleidung (Trikot, T-Shirt, Sportjacke), Kopfbedeckung **Hut** neu (neben Cap, Cap verkehrt, Mütze, Stirnband, Bandana).
- **Trainerteam im selben Stil** und mit demselben Baukasten im Eltern-Bereich (Schritte 2 bis 5), dazu Extras nur für Erwachsene: Bart (Vollbart, Kinnbart, Schnurrbart, Dreitagebart, Bartfarbe), Brille, Kopfbedeckung, Pfeife oder Klemmbrett.

### Behoben
- **Kopfbedeckungen verdecken nie mehr Augen oder Brauen:** alle Formen enden über der Brauenlinie (Test für jede Kopfform und jede Kopfbedeckung).
- **Rückansicht:** jede Frisur hat eine eigene Hinterkopf-Zeichnung (kein Gesicht, keine Vorderfrisur), Ohren seitlich sichtbar, Kopfbedeckungen mit eigener Rückansicht.
- **Trikotrücken:** Name leicht gebogen über der Nummer, beides im Rückenfeld, lange Namen und zweistellige Zahlen werden automatisch skaliert und ragen nie über die Hose.

### Datenmodell (Schemaversion 4, global 3)
- `profile.avatar` neu: `hair` ist ein Schlüssel (vorher Zahl je Junge oder Mädchen), dazu `browColor`, `cheeks`, `outfit`, `outfitColor`, `bg`, `mouth` 0 bis 3, `hat` 0 bis 6. Trainerteam: `look` mit `v` 3 (Frisur als Schlüssel, `beard` 0 bis 4 mit `beardColor`, `hat`, `gear`, `mouth`, `glasses` 0 bis 2 und weitere Gesichtsfelder).
- Migration 3 nach 4 und global 2 nach 3 ohne Verlust (nächstliegende Werte, Zeitstempel bleiben). Tests mit Fixtures im Format 1.2.1 (`state-v3.json`, `global-v2.json`). Zusammenführen: Aussehen neuester gewinnt.

### Technik
- Keine neuen Dateien in `app/`. `avatar.js`, `avatardraw.js` und `avatarui.js` sind neu geschrieben. Neue Tests in `test/v13.test.mjs`, die Avatar-Tests der alten Zeichnung sind ersetzt.
- Version 1.3.0 an allen vier Stellen (`version.js`, `sw.js`, `server.js`, `package.json`).

## 1.2.1
- Behoben: Bei „Doppelte Mitlaute“ standen „Schal“ und „Schall“ zur Wahl. Beide sind richtig geschrieben und meinen Verschiedenes, die Frage war nicht eindeutig. Das Paar ist ersetzt (Kette oder Kete). Ein Test sorgt dafür, dass bei dieser Aufgabe nie zwei echte Wörter zur Wahl stehen.
- Behoben: Beim Perfekt galten „ich habe gelaufen“, „ich habe gefahren“, „ich habe geschwommen“ und „ich habe gesprungen“ als falsch, sind aber je nach Gegend oder Bedeutung auch richtig. Bei diesen vier Verben stehen jetzt nur eindeutig falsche Formen zur Wahl (zum Beispiel „ich habe gelauft“).
- Version 1.2.1.

## 1.2.0 (Vorschau: aktuelle Liga, Trainingscamp, Spielauswahl, Sticker, Kontroll-Pfiff)
Schemaversion 3. Ein Stand im Format 1.1.5 wird beim ersten Start ohne Verlust migriert.

### Neu
- **Fokus auf die aktuelle Liga:** Nur sie ist groß dargestellt (Themen, Fortschritt, Spielauswahl). Die anderen Ligen sind schmale Zeilen mit Name, Klasse und Status (Gesperrt, Schnuppern möglich, Probetraining, Frei, Durchgespielt), Antippen klappt sie auf, Schnuppern und „Hier spielen“ bleiben möglich. Vorgabe ist die höchste ganz freie Liga, das Kind kann jede spielbare Liga wählen (wird im Konto gespeichert und abgeglichen, der neueste Stand gewinnt).
- **Spielauswahl je Fach:** „Mathe“ und „Deutsch“ öffnen „Mix: alles aus dem Fach“ und je einen Themenblock pro Thema (Häkchen bei „sicher“, kleiner Fortschrittsbalken). Das fachübergreifende Mix-Spiel bleibt.
- **Kontroll-Pfiff:** Ein Themenblock ist ein Päckchen aus 3 bis 6 zusammenhängenden Aufgaben (Teilen mit Rest: gleicher Teiler, wachsender Dividend, wie auf Emils Arbeitsblatt). Keine Rückmeldung während des Päckchens. Danach die Übersicht mit „Probe“ je Aufgabe (Umkehraufgabe, Gegenaufgabe, Tauschaufgabe, Rechtschreibstrategie, nie die Lösung) und „Antwort ändern“. Erst „Ich habe kontrolliert ✓“ beendet das Päckchen, dann folgt die Auswertung mit Torszenen. Selbst gefundene und richtig verbesserte Fehler geben 8 Bonuspunkte und den Jubelruf „Selbst gefunden, stark!“. „Ohne Kontrolle abgeben“ geht auch, dann ohne Bonus. Mix-Spiele, Schnuppern und Probetraining-Spiele bleiben mit Sofort-Rückmeldung.
- **24 verschiedene Sticker:** eigene Form, eigener Farbverlauf, eigenes Motiv (eigene SVG-Zeichnungen, keine Vereinslogos) und ein großer Jubelruf (Tooor!, Volltreffer!, Wahnsinn!, Ballzauber!, Kracher!, Knaller-Kicker!, Hammer!, Weltklasse!, Jaaa!, Supertor! und weitere). Der bisherige Fußballbegriff steht klein darunter. Gesammelte Sticker bleiben, nur das Aussehen ist neu.
- **Eltern-Bereich:** Lernstand zeigt „Kontrollieren“ (Kontroll-Pfiffe, benutzte Proben, selbst korrigierte Fehler je Thema). Der Verlauf nennt Päckchen mit Thema.

### Geändert
- **„Bambini-Liga“ heißt jetzt „Trainingscamp“** (Stoff Klasse 2). Die interne ID `L1` bleibt, es gibt keine Datenmigration wegen des Namens, die Freischaltlogik ist unverändert.
- Die Anzeigetafel oben zeigt die aktuelle Liga (vorher die höchste freie).

### Datenmodell (Schemaversion 3)
- Neu im Konto: `progress.cur` (`{li, t}`), `stats.<Thema>.ctl` (je Gerät `n`, `p`, `f`), `history[].topic` und `history[].pk`.
- Migration 2 nach 3 ohne Verlust (Unbekanntes bleibt, Eingabe unverändert), migrierter Stand geht zurück auf den Server, ältere Apps können nichts mehr überschreiben (409).
- Zusammenführen: aktuelle Liga neuester gewinnt, Kontroll-Zähler je Gerät summieren. Regeln in SPEC.md.

### Technik
- Neue Dateien: `app/js/check.js` (Päckchen, Probe, Auswertung), `app/js/stickers.js` (Sticker), beide in `FILES` von `sw.js`. Bausteine der Generatoren (`mk` in `generators.js`) und Gegenaufgaben (`inv`) für die Probe.
- Version 1.2.0 an allen vier Stellen (`version.js`, `sw.js`, `server.js`, `package.json`).

### Tests
125 Tests (vorher 103), neu in `test/v12.test.mjs` und im Ende-zu-Ende-Test: Migration 2 nach 3 mit Fixture im Format 1.1.5, aktuelle Liga und ihr Abgleich zwischen zwei Geräten, Kontroll-Zähler summieren, Päckchen-Generatoren (Teiler gleich, Werte gültig, Dividend steigt), Kontroll-Pfiff (Bonus nur für falsch nach richtig verbessert), Probe verrät die Lösung nie, 24 verschiedene Sticker, Umbenennung (kein „Bambini“ mehr in `app/`), Startseite, Fachauswahl, Päckchen-Ansichten, Kontroll-Statistik im Eltern-Bereich, ein ganzes Päckchen mit Kontroll-Pfiff durch die echte `app.js`.

## 1.1.5
- Behoben: Die Sprechblase der Trainer ragte über die weiße Fragenbox hinaus (Rand und Innenabstand wurden nicht zur Breite gerechnet). Lange Wörter brechen um, Bilder in Beispielen werden schmaler.

## 1.1.4
- Mehr Vielfalt bei den Avataren: **Kopfform** (5), **Augenform** (3), **Augenbrauen** (3), **Nase** (3), **Sommersprossen**, **Brille** (Rund, Eckig) und **Statur** (Schlank, Normal, Kräftig). Frisuren mit mehr Haarsträhnen. Gespeicherte Avatare sehen unverändert aus.
- Server: Das atomare Schreiben wiederholt das Umbenennen kurz bei EPERM, EBUSY oder EACCES (kann unter Windows an Virenscannern scheitern, ein Test war dadurch gelegentlich rot).
- Test: Jede Taste im Baukasten und im Eltern-Bereich braucht eine Verdrahtung in app.js (jetzt auch für Attribute, die nur als Name übergeben werden).
- Version 1.1.4.

## 1.1.3
- Baukasten so erweitert, dass der Junge mindestens wie auf dem Foto aussehen kann: Frisur **Fransen** (Junge und Mädchen), **Augenfarbe** (Braun, Haselnuss, Blau, Grün, Grau), **Trikotmuster** (Einfarbig, Schulterstreifen, Querstreifen, Brustband), **Kragen** (V-Ausschnitt, Rundkragen), eigene **Stutzenfarbe** (schwarze Stutzen zu blauem Trikot), **Gesicht** (Lächeln, Breites Grinsen).
- Neue Vorlagen „Torjäger“ (Junge, nach dem Foto) und „Funke“ (Mädchen). Alte Avatare bleiben unverändert (Stutzen wie das Trikot, braune Augen, kein Muster).
- Version 1.1.3.

## 1.1.2
- Figuren realistischer: eiförmiger Kopf mit Wangen und Kinn statt Kreis, Kopf im Verhältnis kleiner, mandelförmige Augen, Nase, Lippen, Ohren, Hände mit Daumen, leichte Taille. Gilt auch für Trainer und Trainerin.
- Frisuren: neu **Ohne Haare** (Junge und Mädchen).
- Kopfbedeckungen mit eigener Farbe: Cap, Cap verkehrt herum, Mütze, Stirnband, Bandana (Vorder- und Rückansicht).
- Version 1.1.2.

## 1.1.1
Nur die Versionsnummer ist angehoben (App, Service Worker, Server, package.json). Ohne neue Nummer übernehmen Geräte geänderte Dateien nicht sicher aus dem Cache. Regel: Jede Auslieferung bekommt eine neue Nummer, auch für die Vorschau.

## 1.1.0 (Vorschau, Eltern-Bereich, Avatar)
Schemaversion 2. Ein bestehender Stand im Format 1.0.0 wird beim ersten Start ohne Verlust migriert.

### Vorschau
- Zweiter Klon auf der NAS aus demselben Repo (Branch `preview`, Port 8081, eigener Container und eigene Daten), erreichbar über Tailscale auf Port 8443. Orange Band **VORSCHAU** oben in der App (Kennung vom Server).
- `docker-compose.yml` liest Container-Name, Port und Kennung aus `.env` (Vorlagen `.env.example`, `.env.preview.example`), läuft mit docker-compose v1. Ohne `.env` bleibt alles wie in 1.0.0.
- `deploy.sh` prüft den Branch (Live nur `main`, Vorschau nur `preview`) und bricht sonst vor jeder Änderung ab. Neu: `--check`.
- Server: `/api/config`, Kennung und Serverversion in `/api/health`.

### Eltern-Bereich
- Taste **Eltern** auf „Wer spielt?“ (mit Eltern-PIN). Vier Bereiche:
  - Konten: anlegen, umbenennen, zurücksetzen, löschen (Papierkorb, nie hart gelöscht), Ligen freigeben und sperren, Probe-Kontingent.
  - Lernstand: Trefferquote je Thema (letzte 10 und gesamt), letzte Spiele mit Datum, Liga, Modus, Ergebnis und Dauer, Trainingstage, genutzte Tipps.
  - Einstellungen: Eltern-PIN ändern (alte PIN nötig), je Konto Ton, Aufgaben pro Runde (6, 8, 10), Schnupper-Regeln, Tipp-Zeit; Trainer (Name, Aussehen).
  - Sicherungen und System: Liste der Sicherungen auf der NAS mit Datum und Größe, Wiederherstellen je Konto (vorher Sicherung des aktuellen Stands), Geräteliste mit änderbarem Namen, App-, Server- und Schemaversion.
- Der Server prüft die PIN bei jeder heiklen Aktion (Löschen, Wiederherstellen, Zurücksetzen, PIN ändern) selbst, nach 5 falschen Versuchen eine Minute Pause. Neue Routen `/api/admin/*`, siehe SPEC.md.
- Gelöschte Konten liegen in `data/trash/`, Zurücksetzen und Wiederherstellen sichern vorher nach `data/backups/manual/`. Andere Geräte entfernen ein gelöschtes Konto (Antwort 410).
- Geräteliste im Server (`data/devices.json`, Header `X-Device`).
- Spiele speichern ihre Dauer.

### Avatar und Trainer
- Avatar je Konto: Der Baukasten beginnt mit der Wahl **Junge oder Mädchen**, danach je 8 passende Frisuren, 4 Vorlagen, Haar-, Haut-, Trikot-, Hosen- und Schuhfarbe, Rückennummer, Name auf dem Trikot, Mannschaftsname und Vereinsfarben. Figuren im Comic-Stil mit Kontur, Schattierung und Glanzlichtern (Gesicht mit Augen, Brauen, Mund). Erscheint auf der Kachel, in der Kabine und in der Torszene. Beim ersten Öffnen eines Kontos ohne Avatar wird der Baukasten angeboten (überspringbar).
- Torszene neu: Stadion mit Publikum, Tor mit Netz, der Spieler von hinten. Richtig: kurzes Overlay „Tor!“, danach geht es nach 1,8 Sekunden von allein zur nächsten Aufgabe (ohne Erklärung, ohne Weiter-Taste). Falsch: zufällig Pfosten, Latte oder knapp vorbei, jeweils mit lustiger Sprechblase (PLING!, BONG!, Uups!). Das Vereinsschild steht nicht mehr in der Szene. `prefers-reduced-motion` wird beachtet.
- Trainer und Trainerin (Vorgaben „Trainer“ und „Trainerin“, nach Fotos gezeichnet, Name und Aussehen im Eltern-Bereich, gilt für alle Konten): Hilfe-Taste in jeder Aufgabe mit zwei Stufen (1. Tipp vom Trainer, 2. Erklärung an einem ähnlichen Beispiel von der Trainerin, nie die Lösung), Erklärung nach einer falschen Antwort in einer Sprechblase (abwechselnd), freundliches Angebot nach der Tipp-Zeit (Vorgabe 45 Sekunden, je Konto einstellbar oder aus). Hilfe kostet keine Punkte, die Nutzung steht je Thema im Lernstand.
- Behoben: Das Angebot des Trainers nach der Tipp-Zeit kam bei der ersten Aufgabe einer Runde nie (der Timer wurde gestartet, bevor die Ansicht umgeschaltet war).
- Neue Tipp-Texte für alle Aufgabenarten, die keinen hatten. Einige alte Tipps nannten Beispielwörter, die als Lösung vorkommen konnten (Doppelte Mitlaute, i oder ie, Adjektive steigern), sie sind ersetzt.

### Datenmodell (Schemaversion 2)
- Neu im Konto: `profile.avatar` (mit `body`), `profile.avatarAsked`, `settings.perRound`, `trialN`, `trialDaily`, `hintAfter`, `stats.<Thema>.help`, `stats.<Thema>.last[].h`, `history[].dur`. Global: `trainer` und `trainer2`.
- Migration 1 nach 2 ohne Verlust (Unbekanntes bleibt, Eingabe unverändert), migrierter Stand geht zurück auf den Server.
- Zusammenführen: Aussehen und Trainer neuester gewinnt, Tipp-Zähler je Gerät summieren. Regeln in SPEC.md.

### Geändert
- „Spielstand zurücksetzen“ ist aus der Trainerbank in den Eltern-Bereich gewandert (nur dort prüft der Server die PIN und sichert vorher).
- Rundenlänge, Schnupper-Aufgaben und die Sieg-Schwelle (60 Prozent, aufgerundet) kommen aus den Einstellungen des Kontos.
- Versionen: App 1.1.0 (`app/js/version.js`, `sw.js`), Server 1.1.0, `package.json` 1.1.0.

### Tests
103 Tests (vorher 41), neu unter anderem: Migration 1 nach 2 mit Fixture, Admin-API mit falscher und richtiger PIN, Papierkorb, Wiederherstellen, Zurücksetzen, PIN ändern, Merge der neuen Felder, Branch-Prüfung in `deploy.sh`, Tipps und Beispiele nennen nie die Lösung, Ende-zu-Ende-Test mit der echten `app.js`.

## 1.0.0 (Phase 1, Umzug)
Erste spielbare Fassung im Repo. Der Prototyp läuft jetzt als Home-Bildschirm-Web-App.

### Neu
- Spiel aus dem Prototyp übernommen: 3 Ligen (Klasse 2 bis 4), alle Themen und Generatoren, Schnuppern, Aufstieg (8 von 10, 20 Probe-Aufgaben), Freigabe per Eltern-PIN, Punkte, Sticker, Trainerbank. Aufgeteilt in ES-Module unter `app/js/`, ohne Build-Schritt.
- Offline-fähig: Service Worker mit versionierter Cache-Nummer (App-Dateien cache-first, `/api` nie über den Cache), Manifest, Icons (192, 512, maskierbar, Apple Touch 180), iOS-Meta-Tags für Standalone.
- Keine externen Ressourcen: Schriften Andika und Lilita One (OFL) liegen als woff2 in `app/fonts/`.
- Lokal zuerst: Speicherung in IndexedDB nach jeder beantworteten Aufgabe. Automatischer Abgleich mit dem Server nach jeder Änderung, beim Start, beim Wiederkehren der App und bei Netz (Trainerbank zeigt „Zuletzt abgeglichen“).
- Mehrkontenfähiges Datenmodell mit `schemaVersion` und Migrationen. Schlichte Kontoauswahl („Wer spielt?“), neues Konto nur mit Eltern-PIN.
- Eltern-PIN gilt für alle Konten und Geräte (SHA-256 mit Salz, wird mit abgeglichen). Der alte Prototyp-Hash wird noch erkannt und beim ersten Eingeben aufgewertet.
- Zusammenführen bei Konflikten (Zähler je Gerät, letzte 10 Antworten je Thema nach Zeitstempel, Freigaben neuester Stand, Zurücksetzen gewinnt), siehe SPEC.md.
- Server: `/api/profiles` (Liste, Anlegen), `/api/profiles/<id>/state` (GET, PUT mit `baseRev`), `/api/settings` (GET, PUT). Konto-ID streng geprüft, atomares Schreiben, Tagessicherungen je Konto, 409 bei Konflikt und bei älterer Schemaversion.
- `deploy.sh` sichert vor dem `git pull` nach `data/backups/pre-deploy-<JJJJMMTT-HHMM>/` (die letzten 20 bleiben), `--backup-only` sichert nur.
- Tests mit `node --test` (Server-API, Konfliktfall, Merge-Regel, Migration mit Fixture im Prototyp-Format, zwei Geräte offline, Auslieferung, deploy.sh).

### Entfernt
- Phase-0-Testseite (Zähler) und `/api/state`.
- `window.claude` und die db-Capability des Prototyps.

### Bewusst nicht enthalten
Einführung, Avatar, gestaltete Startseite (Phase 2), neue Modi und Aufgabenarten (Phasen 3 und 4), Klasse-1-Liga (Phase 6), Preview-Container (Phase 1b). Kein Import alter Artifact-Stände.

## 0.1.0 (Phase 0)
Grundgerüst: Server ohne Zusatzpakete, Testseite mit Zähler, Dockerfile, docker-compose.yml, deploy.sh.
