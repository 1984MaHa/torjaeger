# Cross-Handover

**Stand:** 2026-09-30
**Von:** cowork
**An:** claude-code
**Stufe:** voll
**Modus:** bauen

Inhalt identisch mit dem kopierfertigen Block. Setzt voraus, dass 1.4.1 auf preview committet ist.

```
Cross-Handover cowork nach claude-code, 2026-09-30.
Modus: bauen. Stufe: voll.
Projekt: Torjäger-Liga (Fußball-Lernspiel für Emil). Repo: C:\AI\_MBrain Data\Projects\Torjaeger-Liga (GitHub 1984MaHa/torjaeger). Live läuft 1.2.1 (main), preview enthält 1.4.0 und (nach Abschluss der laufenden Sitzung) 1.4.1.

ANKER, zuerst gegenprüfen, nicht arbeiten:
Stand beim Schreiben (30.09.2026): Auf preview lief noch eine Code-Sitzung mit Änderungen für 1.4.1 (uncommittet: app/js/icons.js, test/v141.test.mjs u. a.). Dieser Auftrag setzt voraus, dass 1.4.1 fertig committet ist.
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" branch --show-current   -> erwartet preview
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" log --oneline -5          -> erwartet oben die Commits zu 1.4.1 (inkl. Rückübergabe 1.4.1), darunter b95703c
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" log --oneline -1 main     -> erwartet adb3c07 (Live 1.2.1), sofern Marco nichts anderes gemeldet hat
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" status --short            -> erwartet genau: ?? .handover/next.md (dieser Auftrag, von Cowork abgelegt), keine weiteren Änderungen, keine Datei test/sedQphNcj
Dann: .handover/next.md nach .handover/current.md verschieben (überschreiben) und mit dem ersten Commit festhalten.
grep APP_VERSION app/js/version.js -> erwartet 1.4.1
Test -Path "C:\Users\marco.haufe\Downloads\Emil Avatar.jpg"; Test -Path "C:\Users\marco.haufe\Downloads\Trainer Team.jpg"  -> beide True
Bei Abweichung (z. B. 1.4.1 noch nicht committet): nicht anfangen, Marco fragen bzw. als Prüfauftrag an Cowork zurückspielen.
Hinweis: Stand der Vorschau auf der NAS (1.4.0 oder 1.4.1 deployed?) bei Marco erfragen und in der Rückübergabe festhalten.

LIES ZUERST, in dieser Reihenfolge:
1. C:\AI\_MBrain Data\Projects\Torjaeger-Liga\CLAUDE.md (Pflichtregel Rückübergabe)
2. SPEC.md (Abschnitte Avatar, Trainer, Torszene, Datenmodell), CHANGELOG.md, .handover\return.md
3. .handover\next.md (dieser Auftrag als Zettel, wird zu current.md)
4. C:\AI\_MBrain OS\MyBrain\Projects\Torjaeger\specs\Torjaeger-Plan.md (Abschnitt "J. Feste Avatar-Vorlagen")
5. Die beiden Vorlagebilder (unten) und der Avatar-Code in app\js\ (avatardraw.js, Baukasten, Torszene, Trainer)

AUFTRAG
Version 1.5.0 auf Branch preview: Die gezeichneten Avatare (1.3.0) werden durch feste Bild-Vorlagen ersetzt. Emils Figur und das Trainerteam kommen aus Marcos Bildern, jeweils vorn und hinten. Anpassbar sind nur noch Farben, Rückennummer, eigener Name und Vereinsname. Lokal testen, auf preview committen, vollständige Rückübergabe schreiben.

VORLAGEN (Quelle)
- C:\Users\marco.haufe\Downloads\Emil Avatar.jpg: Junge, blonde Haare, blaues Trikot mit weißen Schulter- und Ärmelstreifen, schwarze Hose, schwarze Stutzen, weiße Schuhe; links vorn, rechts hinten, weißer Hintergrund mit senkrechtem Trennstrich.
- C:\Users\marco.haufe\Downloads\Trainer Team.jpg: von links Trainerin vorn, Trainerin hinten (blond, Bob, Creolen), Trainer vorn, Trainer hinten (Glatze, Brille); beide dunkelblaues Polo, schwarze Hose, schwarze Stutzen, graue Schuhe; grauer Hintergrund mit Bodenschatten.
- Originale als Quelle ins Repo unter assets-src/ kopieren (Entscheidung Marco: gezeichnete Avatare dürfen mit dem Spiel ausgeliefert und gespeichert werden).

1. AUFBEREITUNG (einmalig, Hilfsskript unter tools/, nur beim Entwickeln)
- Jede Figur einzeln ausschneiden (vorn und hinten), Hintergrund, Trennstrich und Bodenschatten entfernen, freigestellt als PNG oder WebP mit Transparenz, passende Größe für iPad (Retina) bei kleiner Dateigröße.
- Markenlogo auf Emils Trikotbrust und auf den Stutzen übermalen (Entscheidung Marco), sauber in Trikot- bzw. Stutzenfarbe.
- Umfärbbare Bereiche als eigene Ebenen mit erhaltener Schattierung abtrennen: Kinder: Trikot, Ärmel-/Schulterstreifen, Hose, Stutzen (Schuhe optional). Trainer: Polo, Hose, Stutzen. Rest (Haut, Haare, Gesicht, Hände, Brille, Ohrringe, Schuhe) bleibt Grundbild.
- Ein Hilfsskript darf beim Entwickeln Werkzeuge nutzen (z. B. Python mit Pillow); die App selbst bleibt ohne Bibliotheken. Skript und Ablauf in README beschreiben, damit weitere Vorlagen später genauso aufbereitet werden können.

2. UMFÄRBEN IN DER APP
- Ebenen werden zur Laufzeit in der gewählten Farbe eingefärbt, Falten und Schatten bleiben sichtbar (z. B. Canvas mit Helligkeitsebene mal Farbe, oder CSS mask plus Blend). Ergebnis zwischenspeichern, damit Torszene und Listen flüssig bleiben.
- Farbwahl je Kind: Trikot, Streifen, Hose, Stutzen (feste, gut unterscheidbare Palette, dazu Vereinsfarben-Vorschläge). Je Trainer: Polo, Hose, Stutzen (Marco: auch die Trainer bekommen neue Farben).

3. NAME, NUMMER, VEREIN
- Rückansicht Kind: Name leicht gebogen über der Nummer, beides im Rückenfeld des Trikots, automatisch skaliert (lange Namen, zweistellig), nie über die Hose, Schriftfarbe mit gutem Kontrast zur Trikotfarbe (automatisch hell/dunkel). Optional kleine Nummer vorn auf der Brust, wenn es sauber aussieht.
- Vereinsname nicht aufs Trikot, sondern auf Kachel "Wer spielt?", Kabine und Anzeigetafel.
- Trainer: Name im Eltern-Bereich einstellbar (Vorgaben "Trainer", "Trainerin" bleiben), keine Nummer.

4. EINSATZ IN DER APP
- Kachel, Kabine, Trainerbank, Sprechblasen: Brustbild als Ausschnitt aus dem Vorderbild (Kopf und Schultern) im runden Hintergrund.
- Torszene: Rückansicht des Kindes, animiert (kleiner Satz nach vorn, Ball fliegt ins Tor bzw. an Pfosten, Latte, knapp vorbei), prefers-reduced-motion beachten (Entscheidung Marco).
- Hilfe: Trainer und Trainerin als Brustbild wie bisher (Tipp Trainer, Erklärung Trainerin).
- Vorlagen-Auswahl je Konto: vorerst genau eine Kind-Vorlage ("Emil"). Datenmodell und Oberfläche so, dass später weitere Vorlagen (z. B. für Marcos Nichte) einfach als Datei plus Eintrag dazukommen.
- Einstellungs-Oberfläche "Mein Spieler": Vorschau vorn/hinten, Farben, Name, Nummer, Vereinsname. Trainer-Farben und Namen im Eltern-Bereich.
- Der alte Baukasten (Kopfform, Frisur, Gesicht usw.) verschwindet aus der Oberfläche; Zeichencode kann bleiben oder entfernt werden, gespeicherte Felder bleiben im Stand erhalten (Unbekanntes erhalten).

DATENMODELL
- Neue Felder (Vorlage, Farben je Bereich, Name, Nummer, Vereinsname; Trainerfarben) mit der nächsten schemaVersion (Konto, aktuell 5 oder in 1.4.1 höher) und passender globaler Version, Migration ohne Verlust: vorhandene Trikot-/Hosen-/Stutzenfarbe, Nummer, Name und Mannschaftsname aus dem alten Avatar übernehmen. Test mit Fixture im Format 1.4.1.
- Version 1.5.0 an allen vier Stellen, neue Dateien (Bilder, Skripte) in FILES von sw.js, damit sie offline verfügbar sind. Gesamtgröße der Bilder im Blick behalten (Offline-Cache).

NICHT-ZIELE
- Keine neuen Figuren erzeugen oder zeichnen, keine Schusspose (später eigenes Bild von Marco möglich).
- Keine Änderungen an Aufgaben, Fächern, Ligen, Kontroll-Pfiff, Stickern.
- Keine Markenlogos, keine externen Ressourcen, keine Laufzeit-Bibliotheken.
- Kein Merge nach main, kein Live-Deploy, außer Marco weist es in der Sitzung ausdrücklich an (dann festhalten).

ENTSCHIEDEN, nicht mehr zur Debatte
- Feste Bild-Vorlagen statt Avatar-Generator; anpassbar nur Farben, Rückennummer, eigener Name, Vereinsname (Marco, 30.09.2026).
- Auch die Trainer bekommen umfärbbare Kleidung.
- Bilder werden mit dem Spiel ausgeliefert und im Repo gespeichert.
- Markenlogo wird übermalt.
- Torszene mit animierter Rückansicht.
- Grundregeln: Updates setzen nie einen Stand zurück, Texte ohne Gedankenstriche.

OFFEN, darf die annehmende Seite entscheiden
- Technik des Freistellens und Einfärbens, Bildformat und Auflösung.
- Farbpalette (Umfang, Namen der Farben), ob Schuhe umfärbbar sind.
- Ob der alte Zeichencode entfernt wird.

ABNAHME
- node --test grün, neue Tests: Migration auf die neue Schemaversion (Farben, Name, Nummer, Verein übernommen), alle Bilddateien in FILES von sw.js, Name und Nummer im Rückenfeld (lange Namen, zweistellig), Kontrast der Rückenschrift, Umfärben erzeugt für jede Palettenfarbe ein Bild (Canvas-Ersatz im Test).
- Kachel, Kabine, Sprechblasen zeigen Brustbild aus der Vorlage; Torszene zeigt animierte Rückansicht.
- "Mein Spieler" ändert Farben, Name, Nummer, Verein; Trainerfarben und -namen im Eltern-Bereich; Abgleich zwischen Geräten.
- Kein Markenlogo in den ausgelieferten Bildern (Sichtprüfung durch Marco, im Test mindestens Dateiliste).
- README (Aufbereitung neuer Vorlagen), SPEC.md, CHANGELOG.md (1.5.0) aktuell. Arbeitsbaum sauber, alles auf preview.
Tests Pflicht: ja

RESTPOSTEN, kategorisiert
- Echter Blocker: keiner bekannt.
- Bewusst offen: Abnahme 1.2.1/1.3.0/1.4.0 auf dem iPad; Prüfung docs/Inhalte-Englisch-Sachkunde.md durch Marco; Kontrolle von Emils migriertem Stand; Hyper Backup; Testrunden in Emils Konto; weitere Kind-Vorlagen (Nichte) später; Schusspose später.
- Kosmetischer Rest: Sticker-Motive einfach; Tailscale auf der NAS 1.58.2.

DOKU-ZUSTÄNDIGKEIT
Repo trägt die Wahrheit über den Code (SPEC.md, CHANGELOG.md, README.md, docs/). Vault pflegt Cowork, dort nichts schreiben. Rückweg: vollständige Rückübergabe nach .handover\return.md und als Block laut CLAUDE.md, ausdrücklich mit allem, was Marco in der Sitzung selbst ausgeführt oder angewiesen hat, und dem Stand von main/preview/origin sowie der Vorschau auf der NAS.

ERSTER SCHRITT
Anker prüfen, nicht arbeiten.
```
