# Rückübergabe claude-code an cowork, 2026-09-30

**Auftrag:** Version 1.5.0, feste Bild-Vorlagen statt Avatar-Baukasten (Modus bauen, Stufe voll).
**Stand:** gebaut und lokal getestet (`node --test`: 167 von 167 grün). Committet auf `preview`, **nicht gepusht, nicht nach main gemerged, nicht deployed**.

## Was Marco in dieser Sitzung selbst ausgeführt oder angewiesen hat
- Angewiesen: "ja so starten", also 1.5.0 auf `preview` von `b19e72d` aus bauen (nicht von `adb3c07`).
- Nichts selbst ausgeführt gemeldet: kein Push, kein Merge, kein Branch-Wechsel, keine Befehle auf der NAS, keine Tests auf iPad oder iPhone.
- **Noch nicht ausgeführt:** Push von `preview`, `deploy.sh` für die Vorschau auf der NAS, Sichtprüfung auf dem iPad, Merge nach `main`, Live-Deploy.

## Stand je Umgebung
- Anker-Abweichung bei der Annahme (mit Marco geklärt): `main` stand nicht auf `adb3c07`, sondern auf `b19e72d`. 1.4.1 war inzwischen abgenommen, nach `main` gemerged und live deployt (Commits `fe7f31b`, `94294c0`, `b19e72d`). `.handover/next.md` war bereits committet (nicht `??`).
- Vor dieser Arbeit: `main`, `preview`, `origin/main`, `origin/preview` alle `b19e72d`. Live läuft 1.4.1.
- Jetzt: `preview` hat einen neuen lokalen Commit mit 1.5.0. `main` und `origin/*` unverändert.
- Vorschau auf der NAS: Stand unbekannt (Marco hat die Frage nicht beantwortet). Bitte bei Marco erfragen.

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
- Branch `preview`, Basis `b19e72d`, darauf der Commit "1.5.0: feste Bild-Vorlagen statt Avatar-Baukasten" plus dieser Rückübergabe-Commit.
- Arbeitsbaum sauber nach dem Commit (`.work/` ist ignoriert).

## Nächste Schritte für Marco
1. Push der Vorschau:
   `git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" push origin preview`
2. Auf der NAS die Vorschau aktualisieren (wie bei 1.4.0 und 1.4.1, `deploy.sh` im Vorschau-Klon).
3. Auf dem iPad prüfen:
   - Kabine, "Wer spielt?" und Sprechblasen zeigen das Brustbild.
   - "Mein Spieler": Farben, Vereinsfarben, Nummer, Name, Mannschaft, Vorne und Hinten.
   - Torszene: Rückansicht mit Name und Nummer, Satz nach vorn.
   - Eltern-Bereich, Einstellungen: Trainerfarben und Namen.
   - Emils migrierter Stand: Farben, Nummer, Name, Mannschaft unverändert.
4. Nach Abnahme: Merge nach `main` und Live-Deploy nur auf Marcos Anweisung.
