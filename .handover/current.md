# Cross-Handover

**Stand:** 2026-09-30 (ergänzt: Ganzkörper hat Vorrang)
**Von:** cowork
**An:** claude-code
**Stufe:** voll
**Modus:** bauen

Inhalt identisch mit dem kopierfertigen Block. Anker: f320e81 auf preview, main adb3c07.

```
Cross-Handover cowork nach claude-code, 2026-09-30.
Modus: bauen. Stufe: voll.
Projekt: Torjäger-Liga (Fußball-Lernspiel für Emil, 3. Klasse). Repo: C:\AI\_MBrain Data\Projects\Torjaeger-Liga (GitHub 1984MaHa/torjaeger). Live und Vorschau laufen 1.2.1.

ANKER, zuerst gegenprüfen, nicht arbeiten:
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" branch --show-current   -> erwartet preview
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" log --oneline -1          -> erwartet f320e81 "Rückübergabe: main gepusht und Live-Deploy 1.2.1 eingetragen"
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" log --oneline -1 main     -> erwartet adb3c07
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" status --short            -> erwartet genau: M .handover/current.md (dieser Auftrag)
Bei anderer Abweichung: zurückweisen und als Prüfauftrag an Cowork zurückspielen.

LIES ZUERST, in dieser Reihenfolge:
1. C:\AI\_MBrain Data\Projects\Torjaeger-Liga\CLAUDE.md (Pflichtregel Rückübergabe)
2. C:\AI\_MBrain Data\Projects\Torjaeger-Liga\.handover\return.md (letzte Rückübergabe 1.2.1) und SPEC.md (Abschnitt Avatar)
3. C:\AI\_MBrain Data\Projects\Torjaeger-Liga\.handover\current.md (dieser Auftrag als Zettel)
4. C:\AI\_MBrain OS\MyBrain\Projects\Torjaeger\specs\Torjaeger-Plan.md (Abschnitt "H. Avatare neu, Brainstorming 30.09.2026")
5. Avatar-Code in app\js\ (Baukasten, Zeichnung vorn/hinten, Torszene, Trainer)

AUFTRAG
Avatare neu als Version 1.3.0 auf Branch preview: neuer flacher Zeichenstil nach Marcos Vorlage, Baukasten als geführter Ablauf in 6 Schritten, korrigierte Kopfbedeckungen, echte Rückansicht mit passendem Trikotrücken, Trainerteam im selben Stil. Lokal testen, auf preview committen, vollständige Rückübergabe schreiben.

0. KLARSTELLUNG VON MARCO (wichtig)
- Die Vorlagebilder zeigen nur den gewünschten ZEICHENSTIL (flach, freundlich, Gesichtsart). Sie sind kein Vorbild für den Bildausschnitt.
- Hauptdarstellung ist die GANZKÖRPERFIGUR: Sie schießt die Tore in der Torszene und muss dort vorn und hinten sauber aussehen (Proportionen, Beine, Schuhe, Ball, Schussbewegung).
- Das Trikot muss ordentlich aussehen: vorn (Farben, Muster, Kragen, optional kleine Nummer auf der Brust) und hinten (Name und Nummer im Rückenfeld, siehe Punkt 4), Hose, Stutzen, Schuhe passend.
- Das Brustbild ist nur ein Ausschnitt derselben Figur für kleine Flächen (Kachel, Sprechblase). Es darf keine eigene, abweichende Figur sein.
- Der Baukasten zeigt als Vorschau die Ganzkörperfigur, mit Umschalter Vorderansicht / Rückansicht; bei Gesichtsschritten zusätzlich eine vergrößerte Kopfansicht.

1. ZIELSTIL (Marcos Vorlagen, beschrieben; Bilder liegen nicht im Repo)
- Flache Vektorgrafik ohne Konturlinien, große weiche Farbflächen, höchstens eine hellere Glanzfläche (Haarsträhne, Wange). Kein Comic-Stil mit Kontur und Schattierung mehr.
- Für kleine Flächen ein Brustbild-Ausschnitt der Ganzkörperfigur (Kopf, Hals, Schultern) im runden Pastellkreis; Hintergrundfarbe wählbar oder aus Vereinsfarbe abgeleitet.
- Großer, runder Kopf, wenige Details: Augen als dunkle Punkte mit weißem Lichtpunkt, Brauen als einfache Bögen, Nase als kleiner Strich oder Haken, rosa Bäckchen-Kreise, Mund als Lächel-Linie oder offenes Lachen (weiße Zähne, rosa Zunge). Ohren in Hautfarbe mit hellerem Innenbereich.
- Keine Lippen, keine dunkle Fläche oder Kontur um Mund und Kinn. Untere Gesichtshälfte ist glatte Haut. Schatten nur als Fläche am Hals unter dem Kinn. Ziel: nichts darf nach Bart aussehen.
- Ganzkörperfigur im selben flachen Stil ist die Hauptfigur: kindgerechte Proportionen (großer Kopf, kurzer Körper), Arme, Hände, Beine, Schuhe, vorn und hinten, mit Schusspose für die Torszene.

2. BAUKASTEN ALS GEFÜHRTER ABLAUF (Reihenfolge von Marco)
Jeder Schritt mit großer Live-Vorschau der Ganzkörperfigur (Umschalter vorn/hinten, bei Gesichtsschritten zusätzlich Kopf vergrößert), Zurück, Weiter, Würfel-Taste (Zufallsvorschlag für diesen Schritt), Fertig. Später jeder Schritt einzeln wieder aufrufbar.
- Schritt 1: Junge oder Mädchen. Nur Vorauswahl: bestimmt Vorschläge und Reihenfolge, schränkt nichts ein. Alle Frisuren, Farben und Kleidungsstücke bleiben für jedes Kind wählbar (Entscheidung Marco).
- Schritt 2: Kopfform (zuerst) und Hautton (Farbpalette, mehrere Töne).
- Schritt 3: Frisur und Haarfarbe. Haartypen z. B. kurz, halblang, lang, lockig, Zöpfe, Pferdeschwanz, wuschelig, Fransen, Ohne Haare. Augenbrauen übernehmen automatisch die Haarfarbe, eigene Brauenfarbe optional.
- Schritt 4: Gesicht. Augenform und Augenfarbe, Mund (lächelnd, breites Lachen, ernst, überrascht), Extras: Nasenform, Sommersprossen, Bäckchen an/aus. Kein Bart bei Kindern (Entscheidung Marco).
- Schritt 5: Kleidung und Zubehör fürs Porträt: T-Shirt, Sportjacke oder Trikot; Brille; Kopfbedeckung (Cap, Cap verkehrt, Mütze, Stirnband, Bandana, Hut).
- Schritt 6: Trikot und Verein: Trikot- und Hosenfarbe, Muster, Kragen, Stutzen, Schuhe, Rückennummer, Name auf dem Trikot, Mannschaftsname, Vereinsfarben. In der Torszene trägt der Spieler immer sein Trikot.
- Bestehende Avatare werden in die neuen Merkmale überführt (nächstliegende Werte), nichts geht verloren.

3. KOPFBEDECKUNGEN
- Sitzen immer oberhalb der Augenbrauen: Cap-Schirm endet auf Stirnhöhe über den Brauen, Mütze-Rand über den Brauen, Stirnband und Bandana über den Brauen. Augen und Brauen bleiben immer vollständig sichtbar.
- Test: Für jede Kopfform und Kopfbedeckung reicht keine Kopfbedeckung unter die Brauenlinie.

4. RÜCKANSICHT
- Jede Frisur hat eine eigene Hinterkopf-Zeichnung (z. B. Zöpfe hängen, Pferdeschwanz, Wirbel, Haaransatz im Nacken). Kein Gesicht, keine Vorderfrisur über das Gesicht gelegt. Ohren seitlich sichtbar, Kopfbedeckungen mit eigener Rückansicht.
- Trikotrücken: Name leicht gebogen über der Nummer, beides vollständig im Rückenfeld des Trikots. Nummer und Name werden automatisch skaliert (lange Namen, zweistellige Zahlen), nie über die Hose hinaus. Test mit langen Namen und 88.

5. TRAINERTEAM
- Trainer und Trainerin im selben flachen Stil (Ganzkörper und Brustbild-Ausschnitt), mit demselben Baukasten (Schritte 2 bis 5) im Eltern-Bereich, dazu Extras nur für Erwachsene: Bart (mehrere Formen, Farbe), Brille, Kopfbedeckung, Pfeife oder Klemmbrett als Merkmal. Namen einstellbar (Vorgaben bleiben).
- Keine Fotos ins Repo; die Eltern bauen sich im Baukasten nach.

DATENMODELL
- Neue und geänderte Avatar-Felder mit schemaVersion 4 (Konto) und Migration 3 nach 4 ohne Verlust, Test mit Fixture im Format 1.2.1. Global (Trainer) falls nötig ebenfalls migrieren. Merge: Aussehen neuester gewinnt.
- Version 1.3.0 an allen vier Stellen. Neue Dateien in FILES von sw.js.

NICHT-ZIELE
- Keine Änderungen an Aufgaben, Ligen, Kontroll-Pfiff, Stickern (außer falls ein Avatar darin erscheint).
- Keine neuen Spielmodi, keine Einführungstour, kein Lehrplan-Katalog.
- Keine externen Ressourcen, keine Bibliotheken, keine Fotos oder Vorlagenbilder im Repo.
- Kein Merge nach main und kein Live-Deploy, außer Marco weist es in der Sitzung ausdrücklich an (dann in der Rückübergabe festhalten).

ENTSCHIEDEN, nicht mehr zur Debatte
- Flacher Stil nach Marcos Vorlage; Vorlagen nur für den Zeichenstil. Hauptfigur ist der Ganzkörper mit ordentlichem Trikot vorn und hinten, Brustbild nur als Ausschnitt (Marco, 30.09.2026).
- Reihenfolge des Baukastens wie oben, Kopfform vor Frisur.
- Junge/Mädchen nur als Vorauswahl.
- Bart nur beim Trainerteam.
- Kopfbedeckungen verdecken nie Augen oder Brauen.
- Rückansicht mit eigener Hinterkopf-Zeichnung, Name und Nummer passen ins Rückenfeld.
- Trainerteam im selben Stil.

OFFEN, darf die annehmende Seite entscheiden
- Genaue Zahl und Formen der Kopfformen, Frisuren, Farbpaletten (mindestens so viel Vielfalt wie in 1.1.4).
- Ob Porträt-Outfit und Torszenen-Trikot im Code getrennte Felder sind.
- Körperproportionen der Ganzkörperfigur, solange der Kopf zum Porträt passt.

ABNAHME
- node --test grün, neue Tests: Migration 3 nach 4, Kopfbedeckung nie unter Brauenlinie (alle Kombinationen), Name und Nummer im Rückenfeld (lange Namen, zweistellig), Rückansicht nutzt Hinterkopf-Zeichnung je Frisur, kein Bart-Merkmal bei Kinderkonten, keine Mund-/Kinnkontur-Elemente im Kindergesicht.
- Baukasten läuft in 6 Schritten mit Vorschau, Zurück, Weiter, Würfel; Junge/Mädchen schränkt keine Auswahl ein.
- Ganzkörperfigur in der Torszene vorn und hinten im neuen Stil, mit Schusspose, sauberem Trikot vorn und hinten, passender Hose, Stutzen, Schuhen. Brustbild auf Kachel, Trainerbank und Sprechblasen ist ein Ausschnitt derselben Figur.
- Baukasten-Vorschau zeigt die Ganzkörperfigur mit Umschalter vorn/hinten.
- Trainer und Trainerin im neuen Stil, im Eltern-Bereich baubar.
- SPEC.md, CHANGELOG.md (1.3.0), README.md aktuell. Arbeitsbaum sauber, alles auf preview.
Tests Pflicht: ja

RESTPOSTEN, kategorisiert
- Echter Blocker: keiner bekannt.
- Bewusst offen: iPad-Abnahme von 1.2.1 und Kontrolle von Emils migriertem Stand (Marco); Hyper Backup; Testrunden in Emils Konto; Zwischenspeichern laufender Päckchen.
- Kosmetischer Rest: Sticker-Motive einfach; Tailscale auf der NAS 1.58.2.

DOKU-ZUSTÄNDIGKEIT
Repo trägt die Wahrheit über den Code (SPEC.md, CHANGELOG.md, README.md). Vault pflegt Cowork, dort nichts schreiben. Rückweg: vollständige Rückübergabe nach .handover\return.md und als Block laut CLAUDE.md, ausdrücklich mit allem, was Marco in der Sitzung selbst ausgeführt oder angewiesen hat.

ERSTER SCHRITT
Anker prüfen, nicht arbeiten.
```
