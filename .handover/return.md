# Rückübergabe Claude Code nach Cowork, 02.10.2026 (Version 1.5.4)

Auftrag: `.handover/current.md` (Cross-Handover Cowork nach Claude Code, Modus bauen). Version 1.5.4 auf `preview`: Trainingslager „Teilen mit Rest“ mit Elfmeterschießen. Leitbild: Freude vor Perfektion, kein didaktischer Umbau, Spielfluss bleibt.

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
