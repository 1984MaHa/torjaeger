# Torjäger-Liga: gebauter Stand (Version 1.2.1)

Diese Datei beschreibt, was der Code heute tut. Absicht, Entscheidungen und Roadmap stehen im Vault (`Projects/Torjaeger/`).

## Überblick
Home-Bildschirm-Web-App (iPad, iPhone) mit Node-Server ohne Zusatzpakete. Der Spielstand liegt zuerst lokal (IndexedDB) und wird automatisch mit dem Server abgeglichen. Ohne Server bleibt alles spielbar (nur der Eltern-Bereich braucht für Sicherungen, Zurücksetzen und Löschen den Server).

```
Browser (Service Worker, IndexedDB)  <──HTTPS, /api──>  server/server.js  ──>  data/ (JSON-Dateien)
```

Es gibt zwei Betriebsarten aus demselben Repo: **Live** (Branch `main`, Port 8080) und **Vorschau** (Branch `preview`, Port 8081, eigene Daten, Band VORSCHAU), siehe Abschnitt Vorschau.

## Spiel
- Ligen: **Trainingscamp** (Klasse 2, früher „Bambini-Liga“, interne ID `L1` unverändert), Kreisliga (Klasse 3), Bezirksliga (Klasse 4). Themen und Generatoren wie im Prototyp (`content.js`, `generators.js`).
- **Aktuelle Liga:** Die Startseite stellt nur die aktuelle Liga groß dar (Themen mit Häkchen, Fortschrittsbalken, Spielauswahl). Jede andere Liga ist eine schmale Zeile mit Name, Klasse und Status (Gesperrt, Schnuppern möglich, Probetraining: noch n Aufgaben, Wartet auf Freigabe, Frei, Durchgespielt). Antippen klappt sie auf (Zustand nur in der Ansicht, `UI.lgOpen`): frei oder Probetraining zeigt „Hier spielen“ (macht sie zur aktuellen Liga), gesperrt zeigt den Freispiel-Hinweis und Schnuppern. Vorgabe für „aktuell“ ist die höchste ganz freie Liga (`defaultLeague`). Das Kind kann jede spielbare Liga wählen (`applyCurrent`, gespeichert als `progress.cur`). Eine gewählte Liga, die nicht mehr spielbar ist (zum Beispiel wieder gesperrt), gilt nicht, dann greift die Vorgabe (`currentLeague`).
- Ein Spiel hat je Konto 6, 8 (Vorgabe) oder 10 Aufgaben. Richtig gibt 10 Punkte, ab der dritten richtigen Antwort in Folge 15. Sieg ab 60 Prozent gibt 20 Bonuspunkte und einen Sticker, ein perfektes Spiel (mindestens 5 Aufgaben) zusätzlich 30.
- **Spielauswahl:** „Mathe“ und „Deutsch“ öffnen darunter „Mix: alles aus Mathe“ (bzw. Deutsch, adaptiv, Sofort-Rückmeldung wie bisher) und je einen **Themenblock** pro Thema der Liga (Name, Häkchen bei „sicher“, kleiner Balken der letzten 10 Antworten). Das fachübergreifende **Mix-Spiel** und das Schnuppern bleiben wie bisher mit Sofort-Rückmeldung. Themenblöcke zählen für Punkte, Sticker, Statistik (`stats`, `history`) und Aufstieg wie jedes Spiel.
- Ein Thema ist sicher, wenn von den letzten 10 Antworten mindestens 8 richtig sind. Schwache Themen kommen öfter dran.
- Aufstieg: Sind alle Themen einer Liga sicher, beginnt in der nächsten Liga das Probetraining mit 20 Aufgaben. Danach geben die Eltern per PIN ganz frei. Sie können auch früher freigeben oder wieder sperren.
- Schnuppern: je Konto 2, 3 (Vorgabe), 5 oder 8 Aufgaben, einmal pro Tag (abschaltbar), in gesperrten Ligen bis 2 Ligen über der höchsten freien.
- Tiefere Ligen sind immer spielbar.
- Konten: schlichte Auswahl „Wer spielt?“ mit Avatar-Kacheln. Neues Konto nur mit Eltern-PIN (beim allerersten Konto wird die PIN festgelegt). Die PIN (4 Ziffern) gilt für alle Konten und Geräte.

### Päckchen und Kontroll-Pfiff (Themenblock)
Anlass war ein Hausaufgabenblatt mit Päckchen zu je 3 Aufgaben (gleicher Teiler, wachsender Dividend) und dem Feld „Ich habe kontrolliert!“. Ein Themenblock wird deshalb als **Päckchen** gespielt (`check.js`, Steuerung in `app.js`):
1. **Schreiben:** 3 bis 6 zusammenhängende Aufgaben (`packLen`: Teilen mit Rest 6, Einmaleins 5, Rechnen bis 1000 und Malnehmen und Teilen groß 4, sonst 5). Keine Rückmeldung richtig oder falsch, kein Spielstand im Kopf der Ansicht, die Taste heißt „Eintragen“. Die Trainer-Hilfe ist wie sonst da.
2. **Kontroll-Pfiff:** Übersicht aller Aufgaben mit der eigenen Antwort. Je Aufgabe **Probe** (klappt die Probe auf) und „Antwort ändern“ (Aufgabe mit Zahlenblock, die eigene Eingabe ist vorher leer). Noch keine Rückmeldung.
3. **Abgabe:** „Ich habe kontrolliert ✓“ (mit Kontrolle) oder „Ohne Kontrolle abgeben“ (kein Kontroll-Bonus, keine Kontroll-Statistik). Erst jetzt zählen alle Endantworten (`applyAnswer` je Aufgabe, Punkte 10, ab der dritten richtigen in Folge 15).
4. **Auswertung:** je Aufgabe die Torszene wie im normalen Spiel (richtig: Overlay und automatisch weiter, falsch: Fehlschuss, Erklärung, Weiter). Eine selbst gefundene Korrektur zeigt „Selbst gefunden, stark!“.
5. **Bonus:** Jede Aufgabe, die zuerst falsch war und nach der Kontrolle richtig ist, gibt `BONUS_FIX` = 8 Bonuspunkte (weniger als ein Tor, zusätzlich zu den 10 Punkten für die richtige Endantwort). Unverändert falsche Antworten und richtig-nach-falsch zählen normal, dafür gibt es keinen Bonus (`gradePack`).
6. **Statistik:** je Konto und Thema `stats.<Thema>.ctl` je Gerät `{n: Kontroll-Pfiffe, p: benutzte Proben (je Aufgabe einmal), f: selbst korrigierte Fehler}`. Der Eltern-Bereich zeigt sie unter Lernstand („Kontrollieren“). Im Verlauf tragen Päckchen `mode: "topic"`, `topic` und `pk: true`.

**Generatoren:** Teilen mit Rest (gleicher Teiler, Dividend steigt in Schritten von 1 bis 3, der Rest wächst oder springt zurück), Einmaleins (gleiche Reihe, die andere Zahl steigt, Malnehmen oder Teilen), Rechnen bis 1000 (gleiche Zahl dazu oder weg, die andere steigt in Zehner- oder Hunderterschritten), Malnehmen groß (gleicher Faktor, Zehnerschritte), Teilen groß (gleicher Teiler, Ergebnis steigt um 1). Alle anderen Themen bekommen verschiedene Aufgaben desselben Generators. Päckchen kommen nicht im Mix vor.

**Probe** (`probeOf`): rechnet mit der Antwort des Kindes und nennt nie die Lösung. Teilen mit Rest: „Teiler · Ergebnis + Rest = ?“, Mal: „Antwort : Zahl = ?“ (Umkehraufgabe), Geteilt: „Antwort · Zahl = ?“, Plus: „Antwort − Zahl = ?“, Minus: „Antwort + Zahl = ?“ (Gegenaufgabe), Punktefeld: Tauschaufgabe. Deutsch: Strategie ohne Lösungswörter (Verlängern, Ableiten, Artikelprobe, Satzmelodie, Frageprobe, Laut sprechen). Ein Test prüft, dass die Lösung im Probetext nie vorkommt (außer als Zahl aus der Aufgabe selbst).

### Sammelalbum (`stickers.js`)
24 Sticker, jeder mit eigener Form (24 verschiedene, zum Beispiel rund, Stern, Schild, Wimpel, Sechseck, Banner), eigenem Farbverlauf und eigenem Motiv (eigene SVG-Zeichnungen, keine Vereinslogos). Groß steht ein Jubelruf („Tooor!“, „Volltreffer!“, „Wahnsinn!“, „Ballzauber!“, „Kracher!“, „Knaller-Kicker!“, „Hammer!“, „Weltklasse!“, „Jaaa!“, „Supertor!“ und 14 weitere), klein darunter der bisherige Fußballbegriff (`STICKERS` in `content.js`). Die Nummer eines Stickers ist weiter der Index, gesammelte Sticker behalten also ihren Platz (nur das Aussehen ist neu). Ein Test prüft, dass Jubelruf, Form, Verlauf, Motiv und SVG je 24 verschieden sind.

### Avatar (Spieler)
- `avatar.js` (Daten, Paletten, Vorlagen, Prüfung `cleanLook`), `avatardraw.js` (SVG), `avatarui.js` (Baukasten), keine externen Ressourcen, keine bekannten Figuren oder Vereinslogos. Stil: Comic mit dunkler Kontur, Schattierung und Glanzlichtern, natürlichere Proportionen: eiförmiger Kopf mit Wangen und Kinn (kein Kreis), Kopf im Verhältnis kleiner, mandelförmige Augen, Nase, Lippen, Ohren, Hände mit Daumen.
- Der Baukasten beginnt mit der Wahl **Junge oder Mädchen** (`look.body`, `j` oder `m`). Danach gibt es je 8 passende Frisuren (Junge: Kurz, Wuschel, Igel, Locken, Tolle, Stoppel, Seitenscheitel, Surfer; Mädchen: Pferdeschwanz, Zöpfe, Lang, Dutt, Bob, Lockenmähne, Halbzopf, Pony) und 4 Vorlagen. Ein Umschalter wechselt später zwischen Junge und Mädchen (Farben, Nummer, Name und Mannschaft bleiben, die Frisur wird die erste der neuen Liste).
- Nach Vorbild eines Fotos (Junge mit blonden Fransen, blauem Trikot mit Schulterstreifen, schwarzer Hose und Stutzen) gibt es zusätzlich: Frisur **Fransen** (kurze wuschelige Stirnfransen), **Augenfarbe** (5), **Trikotmuster** (Einfarbig, Schulterstreifen, Querstreifen, Brustband, in der zweiten Vereinsfarbe), **Kragen** (V-Ausschnitt, Rundkragen), **Stutzenfarbe** (einzeln, alte Avatare behalten die Trikotfarbe) und **Gesicht** (Lächeln, Breites Grinsen). Die Vorlage „Torjäger“ zeigt diese Kombination, es gibt je 5 Vorlagen für Junge und Mädchen.
- Mehr Vielfalt im Gesicht und am Körper: **Kopfform** (Oval, Rund, Eckig, Herz, Lang), **Augenform** (Rund, Mandel, Schmal), **Augenbrauen** (Dünn, Normal, Dick), **Nase** (Klein, Mittel, Groß), **Sommersprossen**, **Brille** (Ohne, Rund, Eckig) und **Statur** (Schlank, Normal, Kräftig: Breite des Körpers). Die Vorgaben (Oval, Mandel, Mittel, Normal, ohne Sommersprossen, ohne Brille, Normal) entsprechen dem Aussehen vor Version 1.1.4, gespeicherte Avatare bleiben also unverändert. Frisuren tragen mehr Haarsträhnen.
- Frisuren gibt es auch **ohne Haare** (letzter Eintrag). **Kopfbedeckung** (`look.hat` 0 bis 5, eigene Farbe `look.hatColor`): Keine, Cap, Cap verkehrt herum, Mütze, Stirnband, Bandana. Sie liegt über der Frisur und sieht von vorn und hinten passend aus (verkehrte Cap: Schirm im Nacken).
- Weiter: Haarfarbe (10), Hautton (6), Trikotfarbe (10), Hosenfarbe (8), Schuhfarbe (7), Rückennummer (0 bis 99), Name auf dem Trikot (bis 10 Zeichen), Mannschaftsname (bis 20), Vereinsfarben 1 und 2 (Wappen, Ärmelbündchen, Hosenstreifen, Stutzenrand). Alle Farben frei wählbar.
- Erscheint auf der Kachel in „Wer spielt?“, in der Kabine und in der Torszene. Konten ohne Avatar bekommen eine feste Vorgabe aus dem Namen. Beim ersten Öffnen eines Kontos ohne Avatar wird der Baukasten einmal angeboten (überspringbar, `profile.avatarAsked`). „Mein Spieler“ in der Kabine öffnet ihn jederzeit.
- Torszene (Stadion mit Publikum, Tor mit Netz und Perspektive, der Spieler von hinten; das Vereinsschild steht nicht in der Szene): **richtig** = kurzes Overlay „Tor!“ mit der Szene und den Punkten, danach geht es nach 1,8 Sekunden von allein zur nächsten Aufgabe (Tippen aufs Overlay oder Eingabetaste geht schneller, keine Erklärung, keine Weiter-Taste). **Falsch** = zufällig Pfosten („PLING!“), Latte („BONG!“) oder knapp vorbei („Uups!“) mit lustiger Sprechblase (Seite zufällig), darunter die Erklärung der Trainer und die Weiter-Taste. Der Ausgang wird beim Antworten gewürfelt (`G.shot`). Mit `prefers-reduced-motion` gibt es keine Bewegung, der Ball liegt sofort am Endpunkt, die Sprechblase ist sofort da und der Text nennt den Ausgang.

### Trainer (Hilfe)
- `coach.js`. Zwei Figuren sind in jeder Aufgabe da: **Trainer** (Vorgabe nach dem Foto: Glatze, schwarze Brille, dunkle Jacke, Pfeife) und **Trainerin** (blond, schulterlang, Creolen, Pfeife). Namen und Aussehen (Frisur, Haarfarbe, Hautton, Jacke, Brille, Bart, Ohrringe) sind global und im Eltern-Bereich änderbar (Vorgaben „Trainer“ und „Trainerin“).
- Hilfe-Taste, zwei Stufen: 1. Tipp vom Trainer (`hint` der Aufgabe, jede Aufgabenart hat einen), 2. Erklärung an einem ähnlichen Beispiel von der Trainerin (eine zweite Aufgabe desselben Generators mit anderer Lösung, samt Bild und `ex`). Die Lösung der echten Aufgabe kommt nie im Text vor (`leaks()`, Beispiel wird sonst neu gewürfelt, zuletzt allgemeiner Text). Tests prüfen das für alle Aufgabenarten.
- Nach einer falschen Antwort erklären Trainer und Trainerin abwechselnd (von Aufgabe zu Aufgabe) in einer Sprechblase (`ex` mit „Richtig ist: …“).
- Ist eine Aufgabe länger als die Tipp-Zeit ohne Eingabe (Vorgabe 45 Sekunden, je Konto 20 bis 90 oder aus) offen, bietet Trainer oder Trainerin (abwechselnd) freundlich einen Tipp an (einmal je Aufgabe, auch bei der ersten Aufgabe einer Runde). Jede Eingabe schiebt die Zeit nach hinten.
- Hilfe kostet keine Punkte. Genutzt wird je Thema gezählt (`stats.<Thema>.help`) und in den letzten 10 Antworten vermerkt (`h`). Der Lernstand im Eltern-Bereich zeigt es.

## Datenmodell (schemaVersion 3)
Konto-Stand (`data/profiles/<id>.json`, Feld `state`):
| Bereich | Inhalt |
|---|---|
| `meta` | `schemaVersion`, `deviceId` (letzter Schreiber), `rev` (Server-Revision), `updatedAt`, `createdAt`, `resetAt` |
| `profile` | `id`, `name`, `t`, `avatar` (Aussehen, siehe unten, oder `null`, mit eigenem `t`), `avatarAsked` |
| `progress` | `dev` (je Gerät `points`, `rounds`, `wins`, `stickers`), `days` (Trainingstage), `lg` (je Liga `probe`, `spent`, `open`, `trial`, `t`), `sel` (zuletzt gespielte Liga), `cur` (`{li, t}`: vom Kind gewählte aktuelle Liga, `li` ist `null` bis zur ersten Wahl) |
| `stats` | je Thema `tot` (je Gerät `a`, `c`), `last` (letzte 10 Antworten `{t, ok, d, h?}`), `help` (je Gerät `n` Aufgaben mit Hilfe, `t1` Tipps, `t2` Erklärungen) und `ctl` (je Gerät `n` Kontroll-Pfiffe, `p` benutzte Proben, `f` selbst korrigierte Fehler) |
| `history` | je Spiel `{id, t, d, liga, mode, trial, c, n, pts, dur?, topic?, pk?}` (`dur` in Sekunden, `mode` ist `math`, `deu`, `mix` oder `topic`, `topic` und `pk: true` bei einem Päckchen), höchstens 200 |
| `settings` | `sound`, `t`, `perRound` (6, 8, 10), `trialN` (Schnupper-Aufgaben), `trialDaily` (nur einmal pro Tag), `hintAfter` (Tipp-Zeit in Sekunden, 0 = aus) |

`profile.avatar`: `{v, body (j oder m), hair (Index in der Liste der Auswahl, der letzte Eintrag ist Ohne Haare), hairColor, hat (0 bis 5), hatColor, eyes, pattern (0 bis 3), collar (0 oder 1), mouth (0 oder 1), socks, face (0 bis 4), nose, brows, eyeShape, glasses (je 0 bis 2), freckles (0 oder 1), build (0 bis 2), skin, shirt, shorts, boots (Hexfarben), number, shirtName, team, c1, c2, t}`. Ein Avatar ohne `body` (frühe Vorschau) gilt als Junge. Alle Werte laufen beim Lesen durch `cleanLook` (falsche Werte werden ersetzt, Texte bereinigt).

Anzeigewerte (Punkte, Spiele, Siege, Sticker) sind die Summe über `progress.dev`. Jedes Gerät schreibt nur seinen eigenen Zähler.

Global (`data/settings.json`, Feld `settings`): `schemaVersion` (2), `pin` (`algo`, `salt`, `hash`, `t`), `trainer` und `trainer2` (Trainer und Trainerin: `name`, `look {hair, hairColor, skin, jacket, eyes, glasses, beard, earrings, smile}`, `t`), `updatedAt`. Die Kontenliste ergibt sich aus den Dateien in `data/profiles/`.

Geräteliste (`data/devices.json`, nur Server, eigenes Format `{version:1, devices:{<deviceId>:{name, kind, firstSeen, lastSeen, lastPush}}}`): siehe Server.

Dateiformat auf dem Server: `{id, name, rev, savedAt, device, schemaVersion, state}` (Konto) und `{rev, savedAt, device, schemaVersion, settings}` (global).

### Migration
`model.js`: `migrateProfile` hebt Stände auf `SCHEMA_VERSION`, immer auf einer Kopie (die Eingabe bleibt unverändert). Unbekannte Felder bleiben erhalten.
- Stufe 0 ist das Prototypformat (localStorage-Schlüssel `torjaeger`, Struktur ohne `meta`): `migratePrototype` überführt es ohne Verlust und erhält unbekannte Felder. Die App importiert keine Prototyp-Stände, die Funktion ist für Tests und Werkzeuge da.
- Stufe 1 nach 2 (App 1.1.0, Stand im Format 1.0.0 wie Emils echter Stand): ergänzt `profile.avatar` (`null`) und `profile.avatarAsked` (`false`) und füllt die neuen `settings`-Felder mit Vorgaben (vorhandene Werte wie `sound` und `t` bleiben). `stats.help` und `history.dur` entstehen erst bei Nutzung. Global: `trainer` und `trainer2` bekommen die Vorgabe (ein nie geänderter Eintrag mit `t` 0 wird immer durch die aktuelle Vorgabe ersetzt).
- Ein migrierter Stand geht beim nächsten Abgleich zurück auf den Server (Konto und global), damit dort die neue Schemaversion steht und ältere Apps nichts überschreiben.
- Stufe 2 nach 3 (App 1.2.0, Stand im Format 1.1.5): ergänzt `progress.cur` (`{li: null, t: 0}`, also die Vorgabe „höchste freie Liga“). `stats.<Thema>.ctl`, `history[].topic` und `history[].pk` entstehen erst bei Nutzung. Alles Vorhandene bleibt, Unbekanntes auch. Ein Stand im Format 1.0.0 läuft in einem Zug 1 nach 2 nach 3. Global bleibt die Schemaversion 2.
- Neue Stufen: Eintrag in `PROFILE_MIGRATIONS` und `SCHEMA_VERSION` erhöhen. Ein Stand mit neuerer Schemaversion als die App kennt wird nie verändert, die App lädt sich neu.
- Tests: `test/schema2.test.mjs` mit `test/fixtures/state-v1.json` (Format 1.0.0), `test/v12.test.mjs` mit `test/fixtures/state-v2.json` (Format 1.1.5, Schema 2).

## Abgleich (`sync.js`)
1. Jede Änderung wird sofort in IndexedDB gespeichert (nach jeder beantworteten Aufgabe, nach Hilfe, nach Spielende, bei Freigaben und Einstellungen).
2. Danach (nach 0,6 Sekunden, beim Spielende sofort), beim Start, bei `online`, beim Wiederkehren der App und jede Minute: Server-Stand holen. Ist die Revision eine andere als `baseRev`, wird zusammengeführt. Ist danach etwas zu senden, folgt `PUT` mit `baseRev`. Bei 409 beginnt der Ablauf von vorn (höchstens 6 Versuche).
3. Fehlt das Konto auf dem Server, wird es angelegt (`POST /api/profiles`). Unbekannte Konten des Servers erscheinen lokal und werden geladen.
4. Kein Netz: der Stand bleibt als „vorgemerkt“ lokal, es gibt keinen Fehler. Die Trainerbank zeigt „Zuletzt abgeglichen“ und den Zustand.
5. `409` mit `reason: "schema_too_old"` oder ein Stand mit neuerer Schemaversion: die App aktiviert die neue Version (Service Worker) und lädt sich neu, höchstens einmal pro Minute automatisch.
6. `410` (Konto wurde im Eltern-Bereich gelöscht): das Gerät entfernt das Konto lokal.
7. Jeder Aufruf trägt die Geräte-Kennung im Header `X-Device` (Geräteliste). Nach jedem Abgleich wird auch `/api/config` gelesen (Vorschau-Band).

### Regeln beim Zusammenführen (`merge.js`, reine Funktion)
- Zähler: je Gerät der größere Wert, angezeigt wird die Summe. Das entspricht der Summe der Zuwächse je Gerät, ist unabhängig von der Reihenfolge und zählt bei wiederholtem Zusammenführen nichts doppelt.
- Je Thema: Antwortzähler je Gerät wie oben. Die letzten 10 Antworten sind die 10 mit den neuesten Zeitstempeln aus der Vereinigung beider Stände.
- **Tipp-Zähler** (`stats.<Thema>.help`) und **Kontroll-Zähler** (`stats.<Thema>.ctl`): je Gerät der größere Wert, angezeigt wird die Summe (wie die Antwortzähler). Themen ohne Hilfe oder Kontrolle bekommen kein leeres Feld.
- **Aktuelle Liga** (`progress.cur`): der neuere Stand gewinnt (eigener Zeitstempel `cur.t`, bei Gleichstand die Textform). Hat nur ein Stand eine Wahl, bleibt sie. Die Wahl wirkt nur, solange die Liga spielbar ist.
- Trainingstage und Verlauf: Vereinigung.
- Ligen-Freigaben: je Liga der neuere Stand (`t`). Sind Freigabezustand gleich, zählt der größere Probetraining-Verbrauch, `trial` ist das spätere Datum. Name und Einstellungen: der neuere Stand.
- **Aussehen** (`profile.avatar`): der neuere Stand gewinnt, nach dem eigenen `avatar.t` (nicht nach `profile.t`, Name und Aussehen ändern sich also unabhängig). Bei Gleichstand entscheidet die Textform, unabhängig von der Reihenfolge. Hat nur ein Stand einen Avatar, bleibt er. `avatarAsked` ist wahr, sobald ein Stand es meldet.
- **Trainer und Trainerin** (global): je der neuere Stand gewinnt (`trainer.t`, `trainer2.t`), PIN, Trainer und Trainerin werden getrennt entschieden.
- Zurücksetzen (`meta.resetAt`): der Stand mit dem späteren Zurücksetzen gewinnt vollständig, auch gegen ältere ungesendete Spiele auf anderen Geräten. Wiederherstellen aus einer Sicherung setzt `resetAt` ebenfalls auf „jetzt“, damit alle Geräte den Stand übernehmen.
- Sticker sind ein Zähler je Gerät (nicht „neuester gewinnt“), damit bei parallelem Spielen kein Sticker verloren geht. Angezeigt wird höchstens die Zahl der vorhandenen Sticker.
- Unbekannte Felder bleiben erhalten. Global: neuere PIN (`pin.t`) gewinnt.

## Eltern-Bereich (`admin.js`, `adminapi.js`, `server/admin.js`)
Zugang: Taste „Eltern“ auf „Wer spielt?“ (nur wenn es eine PIN gibt), Eltern-PIN. Die App prüft die PIN lokal und beim Server (`/api/admin/verify`); ohne Verbindung zählt die lokale Prüfung. Die PIN bleibt nur im Arbeitsspeicher, solange der Bereich offen ist. Vier Bereiche:
- **Konten:** anlegen, umbenennen, zurücksetzen (vorher offene Änderungen senden, der Server sichert), löschen (Papierkorb), Ligen je Konto freigeben und sperren, Probe-Kontingent.
- **Lernstand** je Konto: Trefferquote je Thema (letzte 10 und gesamt), Hilfe je Thema, **Kontrollieren** (Kontroll-Pfiffe, benutzte Proben und selbst korrigierte Fehler je Thema), letzte 12 Spiele (Datum, Liga, Modus, bei Päckchen „Päckchen: Thema“, Ergebnis, Dauer), Trainingstage, Punkte, Sticker.
- **Einstellungen:** Eltern-PIN ändern (alte PIN nötig), Trainer (Name, Aussehen), je Konto Ton, Aufgaben pro Runde (6, 8, 10), Schnuppern (Aufgabenzahl, einmal pro Tag an oder aus), Tipp-Zeit (aus, 20, 30, 45, 60, 90 Sekunden).
- **Sicherungen und System:** Liste der Sicherungen auf der NAS (Papierkorb, Sicherungen vor Aktionen, Sicherungen vor Updates, Tagessicherungen) mit Datum und Größe, Wiederherstellen je Konto (vorher wird der aktuelle Stand gesichert), Geräteliste mit änderbarem Namen (Kennung, Art, zuletzt gesehen, zuletzt gesendet), App-, Server- und Schemaversion, Umgebung (Live oder Vorschau).
Die Trainerbank in der Kabine behält Freigeben und Sperren der Ligen für das aktuelle Konto. „Spielstand zurücksetzen“ gibt es nur noch im Eltern-Bereich (der Server prüft die PIN).

## Server (`server/server.js`, `server/admin.js`)
Node 20, nur Bordmittel. `createServer({appDir, dataDir, previewLabel})` ist testbar, Start mit `node server/server.js` (`PORT`, `DATA_DIR`, `PREVIEW_LABEL`). Modell und Regeln der App (`app/js/model.js`, `rules.js`) lädt der Server per dynamischem `import()` für Schemaversionen, Zurücksetzen und Wiederherstellen, es gibt keine zweite Kopie der Logik.

| Aufruf | Bedeutung |
|---|---|
| `GET /api/health` | `{ok, time, preview, serverVersion}` |
| `GET /api/config` | `{preview, serverVersion, schemaVersion, globalSchemaVersion}` (`preview` = Kennung der Vorschau, leer bei Live) |
| `GET /api/profiles` | `{profiles:[{id,name,rev,savedAt,schemaVersion}]}` |
| `POST /api/profiles` | `{name, id?}` legt ein leeres Konto an (201), `409 exists` bzw. `409 deleted` |
| `GET /api/profiles/<id>/state` | `{rev, savedAt, schemaVersion, state}` (`state` ist `null` bei Revision 0), 404 wenn unbekannt, **410 wenn gelöscht** |
| `PUT /api/profiles/<id>/state` | `{baseRev, device, state}` → `{rev, savedAt}` |
| `GET /api/settings`, `PUT /api/settings` | `{rev, ..., settings}` bzw. `{baseRev, device, settings}` |
| `POST /api/admin/verify` | `{pin}` prüft die PIN |
| `POST /api/admin/backups` | `{pin}` → `{backups:[…]}` (`kind`: `daily`, `daily-settings`, `pre-deploy`, `manual`, `trash`, je mit `date`, `size`, `key`) |
| `POST /api/admin/devices` | `{pin}` → `{devices:[{id,name,kind,firstSeen,lastSeen,lastPush}]}` |
| `POST /api/admin/devices/<id>/rename` | `{pin, name}` |
| `POST /api/admin/profiles/<id>/delete` | `{pin}` verschiebt nach `data/trash/<id>-<Zeit>.json` |
| `POST /api/admin/profiles/<id>/reset` | `{pin}` sichert nach `data/backups/manual/`, leert den Stand (Aussehen, Name, Einstellungen bleiben) |
| `POST /api/admin/restore` | `{pin, key}` holt einen Eintrag aus Papierkorb oder Sicherung zurück (vorher Sicherung des aktuellen Stands) |
| `POST /api/admin/pin` | `{pin, newPin}` ändert die PIN (SHA-256 mit neuem Salz, `pin.t` = jetzt) |

**PIN-Prüfung im Server:** Jede `/api/admin/*`-Route prüft `pin` gegen Hash und Salz in `data/settings.json` (SHA-256, Alt-Hash des Prototyps wird erkannt), Vergleich zeitkonstant. Falsch: `403 bad_pin`, keine PIN gesetzt: `403 no_pin`, nach 5 falschen Versuchen hintereinander `429 too_many` für eine Minute (auch die richtige PIN wird dann nicht angenommen), ein Erfolg setzt den Zähler zurück. Nichts verändert sich vor der Prüfung. Die Schlüssel für Sicherungen (`daily:…`, `pre:<Ordner>:<Konto>`, `manual:…`, `trash:…`) werden streng gegen feste Formen geprüft, es gibt keine freien Pfade.

**Nie hart löschen:** Löschen verschiebt in den Papierkorb (danach antwortet der Server für das Konto mit 410, Geräte entfernen es lokal, ein Konto mit dieser Kennung kann nicht neu entstehen). Wiederherstellen aus dem Papierkorb überschreibt nie ein vorhandenes Konto (`409 exists`). Zurücksetzen und Wiederherstellen aus einer Sicherung legen vorher `data/backups/manual/profile-<id>-<Zeit>-vor-zuruecksetzen.json` bzw. `-vor-wiederherstellen.json` an (die letzten 100 bleiben). Eine wiederhergestellte Sicherung wird auf die aktuelle Schemaversion gehoben, Revision plus 1, `resetAt` jetzt.

**Geräteliste:** Der Server liest den Header `X-Device` jedes Aufrufs (Kennung `[A-Za-z0-9_-]{3,40}`, sonst ignoriert), merkt Art (aus dem User-Agent), erstes und letztes Erscheinen und den letzten Schreibzugriff (`lastPush`). Geschrieben wird höchstens einmal pro Minute je Gerät.

Fehler: `400` (`bad_json`, `bad_base_rev`, `bad_state`, `bad_id`, `bad_name`, `bad_new_pin`), `403`, `404`, `405`, `409`, `410`, `413` (über 2 MB), `429`, `409 conflict` mit `reason: "rev"` (und `current`) oder `reason: "schema_too_old"` (und `storedSchemaVersion`).

Konto-ID: `^[a-z0-9][a-z0-9-]{2,39}$` (die App vergibt `k-` plus 8 Zeichen). Schreiben ist atomar (`.tmp`, dann umbenennen). Nach jedem Schreiben wird die Tagessicherung `data/backups/profile-<id>-<Datum>.json` bzw. `settings-<Datum>.json` aufgefrischt, je 30 Tage. Der Server vergibt die Revision und schreibt sie in `state.meta.rev`. Statische Dateien: Code (`.html`, `.js`, `.css`, `sw.js`, Manifest) mit `no-cache`, Schriften und Icons mit einem Tag Cache.

Es gibt keine Anmeldung am Server für Spielstände. Der Zugriff ist nur über Tailscale möglich, die Eltern-PIN schützt Freigaben, Konten und die Admin-Aktionen, nicht die Daten auf der Platte.

## Vorschau (Live und Vorschau aus einem Repo)
- Zwei Klone auf der NAS: `/volume1/docker/torjaeger` (Branch `main`, Port 8080, Live) und `/volume1/docker/torjaeger-preview` (Branch `preview`, Port 8081, eigener Container und eigener Ordner `data/`). Tailscale: Live https://energizer.tailfc5923.ts.net, Vorschau Port 8443 (eigener Browser-Speicher).
- Konfiguration je Klon in der nicht versionierten Datei `.env` (Vorlagen `.env.example`, `.env.preview.example`): `CONTAINER_NAME`, `HOST_PORT`, `PREVIEW_LABEL`. `docker-compose.yml` liest sie mit `${VAR:-Vorgabe}` (docker-compose v1). Ohne `.env` gilt Live.
- Der Server meldet `PREVIEW_LABEL` in `/api/config` und `/api/health`. Die App zeigt bei nicht leerer Kennung oben das orange Band mit der Kennung (`bandHTML`), setzt sie in den Seitentitel und merkt sie lokal (auch offline sichtbar).
- `deploy.sh` prüft zuerst den Branch: mit `PREVIEW_LABEL` nur `preview`, ohne nur `main`. Sonst Abbruch vor Sicherung und Pull. `--check` prüft nur den Branch, `--backup-only` sichert nur.

## App-Auslieferung (PWA)
- `sw.js`: Cache `torjaeger-app-<VERSION>`, alle App-Dateien werden beim Installieren geladen (ohne HTTP-Cache). Fetch: `/api` nie über den Service Worker, alles andere cache-first, Navigation fällt auf `index.html` zurück. Beim Aktivieren werden nur alte `torjaeger-app-*`-Caches gelöscht. Der Service Worker berührt IndexedDB nie.
- Eine neue Version wartet, bis die App neu gestartet wird. Die Trainerbank zeigt „Jetzt laden“ (Nachricht `SKIP_WAITING`, dann Neuladen).
- Ein Test prüft, dass `sw.js` jede Datei in `app/` auflistet, dass Versionsnummern übereinstimmen (`version.js`, `sw.js`, Server, `package.json`), dass es keine externen Adressen und keine Gedankenstriche gibt.

## Update ohne Verlust
Daten nur in `data/` (nicht im Repo, nicht im Image). `deploy.sh` sichert vor dem `git pull` nach `data/backups/pre-deploy-<JJJJMMTT-HHMM>/` (Konten, Einstellungen, alte Phase-0-Datei). Schemaversion plus Migration, Server lehnt veraltete Schreiber ab, IndexedDB wird nie geleert.

## Bekannte Grenzen
- Eine laufende Spielrunde wird nicht gespeichert. Beendet man die App mittendrin, bleiben beantwortete Aufgaben (Antworten, Punkte, Probetraining-Verbrauch, Hilfe) erhalten, das Spiel selbst (Spielzähler, Sticker, Verlauf) nicht. Ein Päckchen wird erst bei der Abgabe gespeichert (dann vollständig): Beendet man die App mitten im Päckchen, gehen dessen Antworten verloren.
- Kein Server-Login für Spielstände, keine Verschlüsselung der Daten auf der Platte. Die Admin-Aktionen sind mit der PIN geschützt (4 Ziffern, Schutz vor Kindern, nicht vor Angreifern im Tailnet).
- Hyper Backup ist nicht eingerichtet: Sicherungen liegen auf derselben Platte.
- Die Geräteliste kann iPad und Mac nicht unterscheiden (Safari auf dem iPad meldet sich oft als Mac): dafür gibt es die Namen.
- Alte Spiele (vor 1.1.0) haben keine Dauer, der Lernstand zeigt „-“.
- Tastenbedienung im Baukasten und Eltern-Bereich ist auf Touch ausgelegt, es gibt keine eigenen Tastenkürzel.
