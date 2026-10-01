# Rückübergabe Claude Code nach Cowork, 01.10.2026 (Version 1.5.3)

Auftrag: `.handover/current.md` (Cross-Handover Cowork nach Claude Code, Modus bauen). Version 1.5.3 auf `preview`: sieben Sofort-Korrekturen aus der Bewertung vom 01.10.2026 plus sieben leichte Übernahmen. Leitbild: Freude vor Perfektion, kein didaktischer Umbau, Spielfluss bleibt.

## Was Marco in dieser Sitzung selbst ausgeführt oder angewiesen hat
- Marco hat die Sitzung gestartet, den Anker prüfen lassen und mit „ja“ den Start der Arbeit freigegeben.
- **Nicht ausgeführt** (weder von Marco noch von mir): Push nach `origin`, Merge nach `main`, `deploy.sh preview` auf der NAS, Test auf iPad oder iPhone. Kein Live-Deploy. Nichts im Vault geschrieben.

## Stand je Umgebung
- Lokal: `preview` bei dem Commit mit dieser Rückübergabe (davor `725466b` für den Code, `e60678a` für die Übernahme der Bewertung). `main` unverändert bei `4f872de` (Live, Version 1.5.2).
- `origin/main` und `origin/preview` standen laut Anker bei `4f872de`. **Es wurde nichts gepusht**, `origin/preview` hängt also hinter dem lokalen `preview`.
- NAS: Live läuft 1.5.2 (laut früherer Rückübergabe). Die Vorschau auf der NAS zeigt noch den alten Stand, bis Marco pusht und `deploy.sh` ausführt. Version 1.5.3 ist nirgends ausgeliefert.

## Anker-Prüfung am Anfang
Alle Erwartungen aus dem Auftrag stimmten: Branch `preview`, `HEAD` und `main` bei `4f872de`, Status genau die drei erwarteten Dateien, `APP_VERSION` 1.5.2. `.git/index.lock` gab es nicht mehr. Erster Commit (`e60678a`): Bewertungs-Rückübergabe und Review so wie sie waren, `next.md` nach `current.md` verschoben.

## Umgesetzt (Teil 1, jeweils mit Regressionstest)
1. **i/ie:** Die Lücke wird aus dem Zielwort abgeleitet (`ieGap`), „Lieed“ und Co. sind weg. „Lied“ ist raus (mit i wäre „Lid“ auch ein Wort, die Frage wäre nicht eindeutig), dafür „Fliege“. Test über alle Rechtschreib-Listen (i/ie, Verlängern, doppelt oder einfach) gegen eine eigene Liste richtiger Wörter, auch dass die falsche Wahl kein richtiges Wort ergibt. Listen sind als `SPELL_LISTS` exportiert.
2. **Netze:** Erklärung nennt den echten Rest („Im letzten Netz liegen nur 3 Bälle“), Test über 4000 Zufallsaufgaben.
3. **Gleichzeitiges Speichern:** `server.js` liest den Stand jetzt nach dem Einlesen der Anfrage und prüft und schreibt ohne `await` dazwischen (kein eigenes Sperr-Objekt nötig). Verlierer bekommt 409. Gilt für Konten und Einstellungen. Tests mit parallelen und mit gestückelten Anfragen (letztere schlagen auf dem alten Server nachweislich fehl). Zusätzlich: der Verlierer führt zusammen, beide Zuwächse bleiben.
4. **Mindeststruktur:** `checkProfileState` und `checkGlobalState` in `model.js` (Pflichtfelder in SPEC.md), Server antwortet 400 `bad_state` mit `detail`. Unbekannte Zusatzfelder bleiben erlaubt. Die App prüft vor dem Senden mit derselben Funktion (Grund `invalid`, eigener Text in der Trainerbank). Fixtures Schema 1 bis 5 werden angenommen.
5. **Päckchen sichern:** Auf dem Gerät unter `pack:<Konto>` (kein Schemawechsel, nicht im Abgleich). Gesichert bei jeder Antwort, Probe, „Kabine“ und beim Wechsel in den Hintergrund. Kabine zeigt „Päckchen weiterspielen?“ mit Weiterspielen und Neu anfangen (dasselbe Thema, frisch). Gelöscht bei Abgabe. Verworfen, wenn Thema aus oder Liga gesperrt. Reguläre Runden werden nicht gesichert (beantwortete Aufgaben zählen schon).
6. **Lokales Speichern:** `withRetry` in `store.js`: 3 Wiederholungen, dann alle 8 Sekunden mit dem neuesten Stand; roter Hinweis oben („Das Speichern klappt gerade nicht …“), verschwindet nach Erfolg. Test mit simuliertem Fehler.
7. **PIN-Schutz:** `PUT /api/settings` behält eine gesetzte PIN immer (auch bei `pin: null`), erste Einrichtung bleibt über den Abgleich möglich. Ändern nur über `/api/admin/pin`. Die App übernimmt in `syncGlobal` immer die PIN des Servers, damit kein Dauer-Abgleich entsteht. Alt-Hash des Prototyps wird vom Server bei der ersten richtigen Admin-Eingabe aufgewertet (`upgradeLegacyPin`). Die neue PIN kommt auf allen Geräten an (Test mit zwei Geräten). „PIN merken“ der Kinder-PIN unberührt.

## Umgesetzt (Teil 2)
8. **Warum stimmt das?** Taste im Tor-Overlay (nur wenn die Aufgabe `ex` hat). Antippen hält das Auto-Weiter an und zeigt die Erklärung bis „Weiter“. Ohne Antippen läuft es unverändert nach 1,8 s weiter.
9. Taste heißt „Mix: Mathe & Deutsch“. 10. Hilfetaste mindestens 44 px, `cardtop` und mini-Coach dürfen umbrechen. 11. Zuordnen: Nummer an beiden Partnern zusätzlich zur Farbe. 12. Kontoanlage: Name bleibt stehen, fehlerhaftes Feld bekommt den Fokus. 13. Trainerbank und Eltern-Lernstand: „zuletzt sicher geübt“; Emils Häkchen und „x von y Themen sicher“ für das Kind bleiben.
14. **Englisch-Bilder:** `CONFUSE` in `content-en.js` (Mund/Zunge/Zahn, Fuß/Bein, Hand/Arm, Schuhe/Stiefel, Hose/kurze Hose, Mutter/Oma, Vater/Opa, Freund/Schwester/Bruder, Stift/Bleistift, Schule/Lehrer, Vogel/Ente, Musik/Gitarre, Sonne/heiß/Sommer, Schnee/kalt/Winter, Regen/Gewitter/Wolke) kommen nie zusammen in eine Bildauswahl oder Hör-Aufgabe. Neue Motive: Mutter und Vater mit Baby-Fläschchen (Unicode 13), Frühling mit Kirschblüte statt Tulpe. `docs/Inhalte-Englisch-Sachkunde.md` neu erzeugt.

## Entscheidungen und Abweichungen
- **Keine Sperre je Konto im Server:** Reicht, weil Node die Abschnitte nacheinander ausführt und zwischen Lesen und Schreiben kein `await` liegt. Technik war dem Auftrag freigestellt.
- **Keine Rückfrage vor dem Verlassen eines Päckchens:** Durch das Sichern geht nichts verloren, die Rückfrage hätte genervt. Der Auftrag ließ beides offen.
- **Päckchen nur auf dem Gerät, nicht im Spielstand:** vermeidet einen Schemawechsel (Auftrag: „falls ein Feld dazukommt“). Folge: Ein Päckchen lässt sich nicht auf einem anderen Gerät fortsetzen.
- **Server ist bei der PIN maßgeblich** (Abgleich übernimmt immer dessen PIN). Das ist strenger als „neuere PIN gewinnt“ im reinen Zusammenführen (`mergeGlobal` ist unverändert, damit die bestehenden Merge-Tests gelten). Dadurch gibt es keine Dauer-Revisionen, wenn ein Gerät eine abweichende PIN hat.
- **Alt-Hash-Aufwertung** zog vom Client zum Server um (sonst wäre sie am PIN-Schutz gescheitert).
- **„Lied“ aus der i/ie-Liste genommen** (Lid wäre ebenfalls ein Wort). Grundregel „Fragen müssen eindeutig sein“.
- **Nicht umgesetzt, weil nicht beauftragt:** serverseitiger Schutz der Liga-Freigaben (laut Bericht „geschützte Elternfreigaben ebenfalls serverseitig kontrollieren“). Sie liegen im Konto-Stand und gleichen sich wie dieser ab. In SPEC.md als Grenze vermerkt. Ebenso nicht: Tastatur-/Fokusbedienung, Lernstandanzeige mit Hilfe-/Erstversuchsangaben, Mini-Spiele (1.6.0).
- Keine Vorschau im Browser geöffnet und kein Screenshot gemacht (Marco prüft visuell selbst).

## Tests
`node --test`: **203 Tests, alle grün** (173 bisherige, davon drei an neue Texte angepasst: „Mix: Mathe & Deutsch“, „zuletzt sicher geübt“, Versionsnummer; plus 30 neue in `test/v153.test.mjs`, `v153-server.test.mjs`, `v153-client.test.mjs`, `v153-e2e.test.mjs`). Die Regressionstests zum Speicherwettlauf und zur PIN schlagen gegen den alten Server fehl, wie vorgesehen. Fake-DOM-Tests ersetzen keine Prüfung auf Safari/iPad.

## Restposten
- **Echter Blocker:** keiner.
- **Bewusst offen:** iPad-Abnahme der Vorschau, Prüfung von `docs/Inhalte-Englisch-Sachkunde.md` durch Marco (neue Motive Mutter, Vater, Frühling), Hyper Backup, Testrunden in Emils Konto, Apple-Geräteprüfung und beobachteter Nutzungstest laut Bericht. Danach Auftrag 1.6.0 (Plan Abschnitt K).
- **Kosmetisch / zu beobachten:** Rote Speicherwarnung und „Warum stimmt das?“ nur im Fake-DOM geprüft, Optik auf dem iPad offen. Das Emoji „Frau mit Fläschchen“ braucht iOS 14 oder neuer (Unicode 13). Die Zuordnungs-Nummer nutzt die Paarfarben, bei Orange ist der weiße Ziffernkontrast knapp.

## Anker
- Branch `preview`, Version 1.5.3 (`version.js`, `sw.js`, `SERVER_VERSION`, `package.json`). Code-Commit `725466b`, davor `e60678a`; der Commit mit dieser Datei folgt direkt darauf. `main` bei `4f872de`.
- Arbeitsbaum nach dem Commit sauber. Keine neuen Dateien in `app/`, `FILES` in `sw.js` unverändert.

## Nächste Schritte für Marco
Zuerst alles prüfen, dann erst pushen.

1. Code ansehen, falls gewünscht:
```
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" log --oneline main..preview
```
2. Preview-Branch pushen (nur auf Marcos Wort, ich habe nichts gepusht):
```
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" push origin preview
```
3. Auf der NAS im Klon `torjaeger-preview` ausliefern (sichert vorher die Daten):
```
./deploy.sh
```
4. Am iPad die Vorschau öffnen (https://energizer.tailfc5923.ts.net:8443, orange Band VORSCHAU), App ggf. mit „Jetzt laden“ aktualisieren. Prüfliste:
   - Version in der Trainerbank zeigt 1.5.3.
   - Deutsch Kreisliga, Thema „i oder ie“: mehrere Päckchen spielen, Wörter wie Spiel, Tier, Fliege, Kind sehen richtig aus, nie „Lieed“.
   - Mathe Kreisliga, Sachaufgabe mit Netzen: Erklärung nennt den echten Rest.
   - Päckchen: drei Aufgaben eintragen, „Kabine“ tippen. In der Kabine erscheint „Päckchen weiterspielen?“, Weiterspielen führt zur vierten Aufgabe. Ebenso im Kontroll-Pfiff.
   - Richtige Antwort im Spiel: Taste „Warum stimmt das?“ im Overlay, Erklärung bleibt bis „Weiter“. Ohne Antippen geht es von allein weiter.
   - Kabine: Taste heißt „Mix: Mathe & Deutsch“. Zuordnen (Englisch Stufe 2): gepaarte Wörter tragen eine Nummer. Hilfetaste leicht zu treffen, Kopfzeile bricht um.
   - Neues Konto mit falscher PIN anlegen: Name bleibt stehen.
   - Englisch-Bilder: Mutter (Frau mit Fläschchen), Frühling (Blüte), kein Bildpaar wie Mund/Zunge zusammen.
   - Eltern-Bereich: Lernstand sagt „zuletzt sicher geübt“. „Eltern-PIN ändern“ mit alter PIN klappt, danach gilt die neue PIN auch auf dem zweiten Gerät.
5. Erst nach der Abnahme (und nur auf Marcos Anweisung) Merge nach `main` und Live-Deploy.
