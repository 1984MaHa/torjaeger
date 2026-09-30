# Rückübergabe claude-code an cowork, 2026-09-30

**Auftrag:** Version 1.5.0 (ausgeliefert als 1.5.1, weil der Service Worker unter gleicher Versionsnummer die alte Fassung im Cache behielt), feste Bild-Vorlagen statt Avatar-Baukasten (Modus bauen, Stufe voll).
**Stand:** Version 1.5.2 gebaut, in der Vorschau abgenommen, nach `main` gemerged und von Marco live deployt. 173 von 173 Tests grün.

## Was Marco in dieser Sitzung selbst ausgeführt oder angewiesen hat
- Angewiesen: "ja so starten", also 1.5.0 auf `preview` von `b19e72d` aus bauen (nicht von `adb3c07`).
- Angewiesen: "push preview". Ausgeführt von mir: Push `b19e72d..71f44c0`.
- Ausgeführt von Marco: `deploy.sh` im Vorschau-Klon auf der NAS. `/api/health` meldet `"preview":"VORSCHAU"`, `serverVersion` 1.5.0 (18:05 UTC).
- Marco hat die Vorschau auf dem iPad angesehen (Screenshots Rückenansicht und Trainerin) und Wünsche gemeldet (unten). Welcher Stand vorher in der Vorschau lief, weiß Marco nicht.
- **Noch nicht ausgeführt:** Push und NAS-Update der Nachbesserung, erneute Sichtprüfung, Merge nach `main`, Live-Deploy.

## Stand je Umgebung
- Anker-Abweichung bei der Annahme (mit Marco geklärt): `main` stand nicht auf `adb3c07`, sondern auf `b19e72d`. 1.4.1 war inzwischen abgenommen, nach `main` gemerged und live deployt (Commits `fe7f31b`, `94294c0`, `b19e72d`). `.handover/next.md` war bereits committet (nicht `??`).
- Vor dieser Arbeit: `main`, `preview`, `origin/main`, `origin/preview` alle `b19e72d`. Live läuft 1.4.1.
- Jetzt: `preview` hat einen neuen lokalen Commit mit 1.5.0. `main` und `origin/*` unverändert.
- Vorschau auf der NAS: Stand unbekannt (Marco hat die Frage nicht beantwortet). Bitte bei Marco erfragen.

## Rückmeldungen von Marco und Umsetzung (Nachbesserung, gleiche Version 1.5.0)
- Emil größer und besser lesbar: Vorschau 300 statt 230, Torszene 190 statt 150 Punkte hoch.
- Rückennummer höher und größer, eigener Name größer, Nummer auf der Brust deutlich größer (88 statt 54).
- Mannschaftsname aufs Trikot: klein und gebogen oben auf dem Rücken (Annahme: Rücken, nicht Brust, weil vorn die Nummer steht). Das ändert die frühere Entscheidung, den Vereinsnamen nicht aufs Trikot zu setzen.
- Trainer im Eltern-Bereich: neben dem Brustbild jetzt die ganze Figur.
- Start zeigt immer zuerst "Wer spielt?" mit den Bildern (auch bei nur einem Konto).
- **PIN des Kindes** (neu, nicht im Auftrag): freiwillig, 4 Ziffern, `profile.pin = {code, t}`, Klartext. Kachel zeigt "(PIN)" und fragt beim Antippen. Kind setzt sie in "Mein Spieler", Eltern sehen, ändern und entfernen sie im Eltern-Bereich bei jedem Konto. Zusammenführen: neuerer Stand gewinnt, Zurücksetzen behält sie. Kein Schemawechsel (Feld optional). Sicherheit bewusst schwach: Komfort, kein Schutz vor Eltern.

## Abnahme und Merge
- Marco hat 1.5.2 in der Vorschau abgenommen ("passt so für mich") und den Merge nach main angewiesen. Ausgeführt von mir: Fast-Forward-Merge von `preview` nach `main`, Push `main`. **Live-Deploy hat Marco danach selbst ausgeführt** (`cd /volume1/docker/torjaeger && sudo sh deploy.sh`), Marco meldet: durch und live.
- Stand danach: `main`, `preview` und die `origin/*` auf demselben Commit. Live und Vorschau laufen mit 1.5.2.
- Offen: Marcos Prüfung von Emils migriertem Stand auf dem iPad (nicht bestätigt). Zu prüfen (Farben, Nummer, Name, Mannschaft). Emils Nummer und Name kommen aus dem alten Avatar.

## Zweite Sicht von Marco (Version 1.5.2)
- Ursache für "sieht aus wie vorher": Service-Worker-Cache. Die Nachbesserung trug dieselbe Nummer 1.5.0, `sw.js` war unverändert. Marco hat mit hartem Neuladen geholfen. Deshalb gab es 1.5.1 und jetzt 1.5.2. **Lehre: jede Auslieferung braucht eine neue Versionsnummer.**
- Rückennummer stand zu tief: hängt jetzt direkt unter dem Namen und ist größer (Marco hat den Bereich rot eingezeichnet).
- "EMI L": Buchstabenbreiten statt fester Breite (`charW`).
- PIN des Kindes funktioniert (Marco bestätigt). Neu: "Heute nicht noch einmal fragen", Tag plus PIN lokal gemerkt.
- Trainer im Eltern-Bereich: vorn und hinten ganze Figur plus Brustbild (neue Bilder `fig-trainer-back`, `fig-trainerin-back`).
- "Namen auf der Brust": Annahme, dass die Namen der Trainer gemeint sind. Sie stehen vorn auf der Brust (links) und hinten auf dem Rücken. Beim Kind steht vorn die Nummer. Falls auch der Kindername vorn gewünscht ist, nachfragen.

## Was gebaut ist
- **Bilder:** Originale nach `assets-src/` (emil-avatar.jpg, trainer-team.jpg). Aufbereitet mit `tools/prepare-figures.mjs` (nur Node, Regeln in `tools/figures.config.mjs`, Bibliothek `tools/fig-lib.mjs`, PNG-Leser `tools/png.mjs`, `tools/jpg2png.ps1` für die JPG-Umwandlung unter Windows). Ergebnis in `app/img/`: Emil vorn und hinten, Trainer und Trainerin vorn, je Grundbild plus Umfärb-Ebene, zusammen etwa 0,9 MB. Die Trainer-Rückansichten sind aufbereitbar (`use:false`), aber nicht ausgeliefert. Markenlogos auf Brust und Stutzen sind übermalt.
- **App:** `figures.js` (Umfärben, Zwischenspeicher, Rückenfeld, Schriftkontrast), `figdata.js` (erzeugt), `avatardraw.js` (SVG mit eingebettetem Bild, Torszene mit Rückansicht und kleinem Satz nach vorn), `avatarui.js` ("Mein Spieler" auf einer Seite, Trainerfarben), `avatar.js` (Vorlagen, Paletten, 10 Vereinsfarben-Vorschläge, Prüfung). Alter Zeichencode und Baukasten entfernt.
- **Vereinsname** auf Kachel, in der Kabine (Zeile unter dem Titel) und auf der Anzeigetafel (Kopfzeile im Spiel, Heim im Ergebnis).
- **Datenmodell:** Schemaversion Konto 6, global 4. Migration 5 nach 6 übernimmt Trikot, Streifen (`c2`), Hose, Stutzen, Nummer, Name, Mannschaft, alte Felder bleiben. Global 3 nach 4: Jacke wird Polo. Fixtures `state-v5.json`, `global-v3.json` im Format 1.4.1.
- **Doku:** README (Abschnitt "Figuren-Vorlagen"), SPEC.md, CHANGELOG.md (1.5.0), CLAUDE.md aktualisiert. Version 1.5.0 an allen vier Stellen, neue Dateien in `FILES` von `sw.js`.
- **Tests:** neu `test/v15.test.mjs`. `test/v13.test.mjs` (Zeichenstil, Baukasten) gelöscht, die Migrations- und Abgleichtests sind in v15 angepasst übernommen. Weitere Tests an das neue Modell angepasst (avatar, schema2, e2e, v12, v14, admin, adminview).

## Entscheidungen und Abweichungen
- Ausgangspunkt `b19e72d` statt `adb3c07` (siehe oben).
- Kein Python auf dem Rechner: Aufbereitung mit Node und .NET statt Pillow.
- Bilder in Originalauflösung (kein Verkleinern), damit das Brustbild auf dem iPad scharf bleibt.
- Kleine Nummer auf der Brust umgesetzt (sitzt dort, wo das Logo übermalt wurde).
- Vereinsname auf der Anzeigetafel ersetzt dort den Kindernamen (Kopfzeile und Heim). Der Name des Kindes steht weiter in der Begrüßung.
- Trainer: nur Name und Farben von Polo, Hose, Stutzen (Jacke, Bart, Brille und Weiteres entfallen).
- Schuhe nicht umfärbbar. Kein Browser-Test von mir (Marco prüft visuell selbst).
- Dockerfile unverändert: `assets-src/` kommt nicht ins Image.

## Restposten
- **Echter Blocker:** keiner.
- **Bewusst offen:** Sichtprüfung durch Marco auf dem iPad (Freistellung, Kanten, Farbsäume, Brustbild-Ausschnitt, Schrift im Rückenfeld, Satz in der Torszene, Logo wirklich weg); Abnahme 1.2.1 bis 1.4.1 auf dem iPad; Prüfung `docs/Inhalte-Englisch-Sachkunde.md`; Hyper Backup; weitere Kind-Vorlagen (Nichte); Schusspose.
- **Kosmetisch:** an den Konturen kann ein feiner Farbsaum in der alten Farbe (Blau) bleiben; Sticker-Motive einfach; Tailscale auf der NAS 1.58.2.

## Anker
- Branch `preview`. Auf origin: `71f44c0`. Lokal darüber ein Commit "1.5.0 Nachbesserung ..." (noch nicht gepusht).
- Arbeitsbaum sauber nach dem Commit (`.work/` ist ignoriert).

## Nächste Schritte für Marco
1. Push der Nachbesserung:
   `git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" push origin preview`
2. Auf der NAS: `cd /volume1/docker/torjaeger-preview && sudo sh deploy.sh`, danach `wget -qO- http://127.0.0.1:8081/api/health`.
3. Auf dem iPad prüfen:
   - Kabine, "Wer spielt?" und Sprechblasen zeigen das Brustbild.
   - "Mein Spieler": Farben, Vereinsfarben, Nummer, Name, Mannschaft, Vorne und Hinten.
   - Torszene: Rückansicht mit Name und Nummer, Satz nach vorn.
   - Eltern-Bereich, Einstellungen: Trainerfarben und Namen.
   - Emils migrierter Stand: Farben, Nummer, Name, Mannschaft unverändert.
4. Nach Abnahme: Merge nach `main` und Live-Deploy nur auf Marcos Anweisung.
