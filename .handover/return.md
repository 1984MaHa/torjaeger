# Rückübergabe claude-code nach Cowork

**Stand:** 2026-09-30
**Von:** claude-code
**An:** cowork
**Auftrag:** Version 1.3.0 (Avatare neu). Modus bauen, Stufe voll

```
Rückübergabe claude-code nach cowork, 2026-09-30.
Projekt: Torjäger-Liga. Auftrag 1.3.0 (Avatare neu) ist gebaut, getestet und lokal auf preview committed. NICHT gepusht, NICHT deployed, NICHT im Browser angesehen (siehe 1 und 6).

1. WAS MARCO IN DIESER SITZUNG SELBST AUSGEFÜHRT HAT
- Nichts. Marco hat nur den Start freigegeben ("ja" nach der Ankerprüfung). Kein Push, kein Merge, kein Branch-Wechsel, keine Befehle auf der NAS, keine Tests auf iPad oder iPhone, keine Anweisung zu main oder Live.
- Ausdrücklich NOCH NICHT ausgeführt: Push von preview, Vorschau-Deploy auf der NAS, Abnahme auf dem iPad, Kontrolle von Emils migriertem Stand. main und Live sind unberührt (Live läuft weiter 1.2.1).
- Ich (Claude) habe die Seite bewusst nicht im Browser oder in der Vorschau geöffnet und keine Screenshots gemacht (Wunsch von Marco, er prüft visuell selbst). Die neue Zeichnung ist nur per Test geprüft (Struktur, Geometrie, Marker), nicht mit dem Auge.

2. STAND JE UMGEBUNG
- Anker am Start stimmten alle: preview f320e81, main adb3c07, Arbeitsbaum nur M .handover/current.md.
- preview (lokal): Code-Commit 2dc3c1b (Version 1.3.0), darauf ein Commit mit dieser Rückübergabe. origin/preview steht noch auf f320e81 (nicht gepusht).
- main und origin/main: adb3c07, unverändert. Live läuft 1.2.1, die Vorschau läuft 1.2.1 (so wie vor der Sitzung).
- Version 1.3.0 steht an allen vier Stellen (app/js/version.js, VERSION in app/sw.js, SERVER_VERSION in server/server.js, version in package.json). Keine neue Datei in app/ (nur drei neu geschriebene), also keine Änderung an FILES in sw.js nötig (Test prüft es).

3. WAS UMGESETZT IST (Auftragspunkte)
- Zielstil: flach, keine Konturlinien, große Farbflächen, eine hellere Glanzfläche. Großer runder Kopf, Punkt-Augen mit Lichtpunkt (Augenfarbe als Farbfläche), Bogen-Brauen, Strich-Nase, rosa Bäckchen, Mund als Lächel-Linie oder offenes Lachen (weiße Zähne, rosa Zunge). Ohren mit hellerem Innenbereich. Keine Lippen, keine Fläche oder Kontur um Mund und Kinn, Schatten nur als Fläche am Hals. Tests prüfen das an der Zeichnung (Konturfarbe fehlt, Mundgruppe nur Rosé und Mundinneres, nach der Kopfform nur Brauen, Augen, Nase, Bäckchen, Mund).
- Ganzkörperfigur ist die Hauptfigur (Kopf groß, kurzer Körper, Arme, Hände, Hose, Stutzen, Schuhe), vorn und hinten, Haltung stand oder shoot. Die Torszene zeigt die Figur von hinten in Schusspose (Schussbein nach außen gehoben, Arme ausgestreckt). Vorn: Kragen, Muster, kleine Nummer auf der Brust. Das Brustbild (Kachel, Trainerbank, Sprechblasen, Admin) ist ein Ausschnitt derselben Figur im runden Pastellkreis, der Kopf ist dieselbe Zeichnung (Test vergleicht den Kopf in Ganzkörper, Brustbild und Kopfausschnitt).
- Baukasten in 6 Schritten (Reihenfolge von Marco) mit großer Ganzkörper-Vorschau, Umschalter Vorne und Hinten, bei den Schritten 2 bis 5 zusätzlich der Kopf vergrößert, Zurück, Weiter, Würfel (ab Schritt 2, nur Felder des Schritts), Fertig (in jedem Schritt, speichert) und Schrittleiste (jeder Schritt einzeln antippbar, auch später über "Mein Spieler"). Schritt 1 Junge oder Mädchen nur Vorauswahl (Reihenfolge der Frisuren und Vorschläge, nichts eingeschränkt). Schritt 2 Kopfform zuerst, dann Hautton (8 Töne) und Körperbau. Schritt 3 Frisur (19), Haarfarbe (11), Brauenfarbe (wie Haare oder eigene). Schritt 4 Augenform, Augenfarbe, Mund (Lächeln, Breites Lachen, Ernst, Überrascht), Nase, Brauen, Sommersprossen, Bäckchen. Kein Bart bei Kindern. Schritt 5 Kleidung fürs Porträt (Trikot, T-Shirt, Sportjacke mit Farbe), Brille, Kopfbedeckung (Cap, Cap verkehrt, Mütze, Stirnband, Bandana, Hut) mit Farbe, Hintergrund. Schritt 6 Trikot und Verein (alles wie bisher, plus Name und Nummer).
- Kopfbedeckungen: alle Vorderansichten enden bei y 33, die Brauen beginnen bei y 34,9. Test für jede Kopfform mal jede Kopfbedeckung mal jede Frisur (auch mit Brille). Cap, Cap verkehrt, Mütze, Bandana und Hut verdecken die Frisur oben, nur Koteletten und hängende Haare bleiben. Das Stirnband liegt über dem Haaransatz.
- Rückansicht: jede der 19 Frisuren hat eine eigene Hinterkopf-Zeichnung (Test: alle verschieden, kein Gesicht, keine Vorderfrisur, Ohren da). Zöpfe, Pferdeschwanz und lange Haare enden über dem Namensfeld. Jede Kopfbedeckung hat eine eigene Rückansicht.
- Trikotrücken: Rückenfeld x 44 bis 76, y 92 bis 129. Name gebogen (Buchstaben einzeln auf einem Kreisbogen), über der Nummer, automatisch skaliert (Test mit leerem Namen, EMIL, MAXIMILIAN, WOLFGANGXY, AAAAAAAAAA, WWWWWWWWWW und Nummern 1, 7, 10, 88, 99, 00: alles im Feld, Grundlinie der Nummer y 127, Hose beginnt y 128).
- Trainerteam: derselbe Kopf und Stil als Brustbild, derselbe Baukasten im Eltern-Bereich (Schritte 2 bis 5 mit Schrittleiste und Würfel), Extras nur für Erwachsene: Bart (Vollbart, Kinnbart, Schnurrbart, Dreitagebart, Bartfarbe), Merkmal (Pfeife oder Klemmbrett), Ohrringe, Brille, Kopfbedeckung. Namen einstellbar, Vorgaben "Trainer" und "Trainerin" bleiben (Trainer mit Glatze, Brille, dunkler Jacke, Pfeife; Trainerin blond halblang mit Creolen).
- Datenmodell: schemaVersion 4 (Konto), global 3. Migration 3 nach 4 (Avatar über cleanLook, Zeitstempel bleibt) und global 2 nach 3 (Trainer). Fixtures im Format 1.2.1, mit dem ALTEN Code erzeugt (git archive HEAD vor den Änderungen): test/fixtures/state-v3.json (Mädchen, Zöpfe, Mütze, Nummer 88, Name WOLFGANGXY) und test/fixtures/global-v2.json (Trainer "Coach Kai" mit Vollbart). Zusammenführen: Aussehen neuester gewinnt (unverändert, auch mit neuen Feldern getestet).
- Doku: SPEC.md (Avatar, Trainer, Datenmodell 4, Migration, Merge), CHANGELOG.md (1.3.0), README.md, CLAUDE.md (Schemaversion 4 und 3).

4. ENTSCHEIDUNGEN UND ABWEICHUNGEN (Felder, die der Auftrag offen ließ, und Annahmekorrekturen)
- Frisur ist jetzt ein Schlüssel (hair: "zoepfe" statt Zahl je Junge oder Mädchen). Grund: Junge und Mädchen dürfen nichts einschränken, eine Liste je Geschlecht passte nicht mehr. 19 Frisuren in einer Liste (die alten Listen ergeben zusammen 18 verschiedene, neu ist Halblang), alte Indizes werden über eine feste Tabelle umgerechnet, nichts geht verloren (Test).
- Porträt-Kleidung und Trikot sind getrennte Felder (outfit, outfitColor). Standard ist Trikot, also sehen migrierte Avatare im Porträt aus wie vorher. Die Ganzkörperfigur trägt immer das Trikot.
- Kopfformen 5 (wie 1.1.4), Frisuren 19, Hauttöne 8, Haarfarben 11, Münder 4, Kopfbedeckungen 7 (neu Hut), Bärte 5 Werte (Ohne plus 4 Formen). Mindestens so viel Vielfalt wie 1.1.4.
- Mund "Breites Grinsen" heißt jetzt "Breites Lachen". Alter Wert 0 und 1 bleiben gleich belegt.
- Brauen: Dicke Dünn, Normal, Dick wie bisher, Farbe wie die Haare, solange browColor leer ist.
- Bart bei der Trainerin ist im Baukasten auch wählbar (Vorgabe aus, Würfel gibt ihr keinen). Auftrag nannte "Trainer und Trainerin", also nicht eingeschränkt.
- Trainerteam nur als Brustbild, keine Ganzkörperfigur (Auftrag Abschnitt 5 nennt Ganzkörper und Brustbild, die Abnahme nur "im neuen Stil, baubar"). Wenn Marco die Trainer ganz sehen will, ist das ein eigener kleiner Auftrag.
- Global wurde auf Schemaversion 3 angehoben (Auftrag: "falls nötig"). Grund: Trainer-look ist neu aufgebaut, ältere Apps sollen ihn nicht falsch lesen, sondern sich neu laden (wie bei Schema 3 im Konto).
- Würfel in Schritt 1 nimmt eine Vorlage des gewählten Geschlechts (nur 5 Möglichkeiten). Schritt 3 würfelt aus den ersten 12 der Reihenfolge, damit die Vorschläge zum Geschlecht passen.
- Querstreifen und Brustband laufen nur auf der Vorderseite, damit Name und Nummer auf dem Rücken lesbar bleiben (Schulterstreifen laufen hinten mit).
- Namensschrift: Buchstabenbreite 0,58 mal Schriftgröße angenommen (Lilita One), Grenze 32 Einheiten. Bei 10 Buchstaben entsteht eine kleine Schrift (etwa 5,5). Wenn der Name auf dem iPad zu klein wirkt, in backLayout (avatardraw.js) das Feld oder den Faktor ändern.
- SVG-Kennung avclip (Kreisausschnitt) kommt in jeder Brustbild-Grafik mehrfach vor, alle mit derselben Form. Doppelte Kennungen sind streng genommen ungültiges HTML, funktionieren aber in Safari und Chrome. Bei Problemen auf eindeutige Kennungen umstellen.
- Bestehende Tests angepasst, nichts gelockert: Schema 4 und 3 (admin, adminview, schema2, v12, e2e), Frisuren als Schlüssel (admin, schema2, e2e), Baukasten im e2e neu durchgespielt (6 Schritte, Würfel, Rückansicht, Trainer mit Bart und Klemmbrett). Die Tests der alten Zeichnung in test/avatar.test.mjs (Comic-Kontur, Zahl-Frisuren, alte Oberfläche) sind durch test/v13.test.mjs ersetzt. Die Tests zu Torszene, Sprechblase, Bewegung, Tipps und Trainerblock blieben unverändert erhalten.
- Keine Gedankenstriche in App, Doku und Tests. Keine externen Ressourcen, keine Fotos, keine Bibliotheken, keine Änderungen an Aufgaben, Ligen, Kontroll-Pfiff, Stickern.

5. RÜCKMELDUNGEN UND WÜNSCHE VON MARCO IN DIESER SITZUNG
- Keine neuen. Marco hat nur den Start freigegeben. Die Klarstellung (Ganzkörper ist Hauptfigur, Vorlagen nur für den Stil, Baukasten mit Vorschau vorn und hinten) kam vorher über den Cross-Handover und ist umgesetzt.

6. TESTS
- node --test: 134 Tests, alle grün (vorher 127). Neu: test/v13.test.mjs mit 17 Tests: Migration 3 nach 4 mit Fixture 1.2.1, alte Frisuren, globale Migration, Zusammenführen, flacher Stil ohne Mund- und Kinnkontur, kein Bart bei Kindern, Kopf im Brustbild gleich Ganzkörper, alle Frisuren vorn und hinten, Kopfbedeckungen über der Brauenlinie (alle Kombinationen), Hinterkopf je Frisur, Rückenfeld mit langen Namen und 88, Baukasten 6 Schritte, Junge oder Mädchen ohne Einschränkung, Würfel, Trainerteam, Emils Stand nach Migration.
- NICHT geprüft (Marco): wie die Figuren tatsächlich aussehen (Proportionen, Gesicht, Haare, Trikotrücken, Schusspose), Lesbarkeit von Name und Nummer auf dem iPad, Bedienung des Baukastens auf iPad und iPhone, Form und Sitz jeder Kopfbedeckung, Wirkung der 19 Hinterkopf-Zeichnungen, Trainerbank und Sprechblasen. Die Zeichnungen sind von Hand als Pfade geschrieben und nur strukturell geprüft. Mit Überarbeitungen in avatardraw.js ist zu rechnen.

7. RESTPOSTEN
- Echter Blocker: keiner.
- Bewusst offen: Abnahme von 1.3.0 auf dem iPad (Marco), Kontrolle von Emils migriertem Stand, iPad-Abnahme von 1.2.1, Hyper Backup, Testrunden in Emils Konto, Zwischenspeichern laufender Päckchen, Trainer nur als Brustbild.
- Kosmetisch: Zeichnung im Detail nachschärfen nach Marcos Sicht (Haarformen, Schusspose, Hut), Sticker-Motive einfach, Tailscale auf der NAS 1.58.2.

8. ANKER
- Branch: preview. Code-Commit 2dc3c1b (Elternteil f320e81). Danach ein Commit mit dieser Datei.
- main, origin/main: adb3c07. origin/preview: f320e81 (lokal voraus, nicht gepusht).
- Arbeitsbaum: sauber nach dem Rückübergabe-Commit.

9. NÄCHSTE SCHRITTE FÜR MARCO (einzeln, unverschachtelt)
1. Vorschau-Stand hochladen:
   git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" push origin preview
2. Vorschau auf der NAS aktualisieren (sichert vorher data/, holt den Code, baut den Container):
   cd /volume1/docker/torjaeger-preview && sudo sh deploy.sh
3. Auf dem iPad die Vorschau öffnen (https://energizer.tailfc5923.ts.net:8443), "Jetzt laden" tippen. Im Eltern-Bereich unter Sicherungen und System: Schemaversion Konten "Server 4, App 4", global "Server 3, App 3", App-Version 1.3.0.
4. Testcheckliste (Vorschau):
   - Emils Konto (Sicherung einspielen) oder ein Testkonto: Mein Spieler in der Kabine. Sieht das migrierte Kind gleich aus (Farben, Nummer, Name, Trikot)?
   - Neues Testkonto: Baukasten startet mit Schritt 1. Schritte 1 bis 6 durchgehen, Zurück, Weiter, Würfel (nicht in Schritt 1), Vorne/Hinten umschalten, Schrittleiste oben antippen, Fertig.
   - Junge wählen und trotzdem Zöpfe und Pferdeschwanz nehmen, Mädchen mit Igel: alles muss gehen.
   - Jede Kopfbedeckung (Cap, Cap verkehrt, Mütze, Stirnband, Bandana, Hut) mit mehreren Kopfformen: Augen und Brauen immer frei?
   - Gesicht: nichts sieht nach Bart oder Lippen aus, auch bei Breites Lachen und Überrascht.
   - Hinten-Ansicht: zu jeder Frisur ein passender Hinterkopf, kein Gesicht. Name gebogen über der Nummer, nichts über der Hose, Test mit langem Namen (zehn Buchstaben) und Nummer 88.
   - Torszene (eine Aufgabe falsch und richtig): Figur von hinten mit Schusspose, Trikot sauber, Ball trifft.
   - Kachel in Wer spielt?, Kabine, Trainerbank, Sprechblasen: Brustbild im Pastellkreis, gleiches Gesicht wie der Ganzkörper.
   - Eltern-Bereich, Einstellungen: Trainer und Trainerin mit Schritten 2 bis 5, Bart (nur Erwachsene), Klemmbrett oder Pfeife, Würfel, speichern. In einer Aufgabe mit Hilfe sehen beide im neuen Stil aus.
5. Wenn alles gut ist: Anweisung an Claude "zieh main nach" (lokaler Fast-Forward, danach push main und Live-Deploy wie bei 1.2.1). Nicht vorher.
6. Cowork: Plan und Index im Vault auf 1.3.0 nachziehen (Abschnitt H als umgesetzt markieren, Hinweise aus Abschnitt 4 oben, insbesondere: Frisur als Schlüssel, getrennte Felder outfit und Trikot, Trainer nur Brustbild, Global Schema 3). Dort schreibt nur Cowork.
```
