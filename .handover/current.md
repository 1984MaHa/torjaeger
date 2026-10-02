Cross-Handover cowork nach claude-code, 2026-10-02.
Modus: bauen. Stufe: voll.
Projekt: Torjäger-Liga (Fußball-Lernspiel für Emil). Repo: C:\AI\_MBrain Data\Projects\Torjaeger-Liga (GitHub 1984MaHa/torjaeger). Stand: 1.5.4 (Trainingslager mit Elfmeterschießen) und 1.5.5 (Fächer je Konto ausschalten) sind gebaut, auf main und preview und gepusht. Was auf der NAS läuft, bei Marco erfragen.

BUDGET-MODUS (wichtig, gilt für die ganze Sitzung)
Marcos Wochenkontingent ist fast aufgebraucht und kann jederzeit mitten in der Arbeit enden. Ziel: so viel wie möglich schaffen, ohne dass etwas verloren geht.
- Arbeite die PAKETE unten strikt der Reihe nach ab. Jedes Paket: kurz prüfen, bauen, Tests dazu, node --test grün, committen auf preview.
- Nach JEDEM Paket sofort: .handover\progress.md aktualisieren (Paket, Commit, Teststand, was offen ist, nächstes Paket) und mit committen. return.md wird laufend mitgeführt, nicht erst am Ende.
- Jeder Commit ist ein lauffähiger Stand: Tests grün, keine halbfertigen Funktionen sichtbar. Unfertiges hinter einem Schalter verstecken oder nicht committen.
- Sparsam lesen: nur die Dateien, die das Paket braucht. Keine langen Zusammenfassungen im Chat, keine Screenshots, kein Browser.
- Keine Rückfragen an Marco innerhalb eines Pakets, außer bei echten Blockern. Offene Punkte entscheiden und in progress.md festhalten.
- Wenn ein Paket zu groß wird: in sinnvolle Teilschritte teilen, jeden Teilschritt einzeln committen.
- Eine neue Sitzung (nach Abbruch) liest zuerst progress.md und macht beim nächsten offenen Paket weiter.

ANKER, zuerst gegenprüfen, nicht arbeiten:
Diese Sitzung gehört NUR zum Repo C:\AI\_MBrain Data\Projects\Torjaeger-Liga. Steht die Sitzung in einem anderen Ordner (z. B. TopDesk-SLA-Dashboard): sofort stoppen, nichts ändern, Marco Bescheid geben.
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" branch --show-current   -> erwartet preview
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" log --oneline -1         -> erwartet e0cd3e5
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" log --oneline -1 main    -> erwartet e0cd3e5
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" status --short           -> erwartet genau: ?? .handover/next.md
grep APP_VERSION app/js/version.js -> erwartet 1.5.5
Wenn .handover\progress.md existiert: Es ist eine Fortsetzung. Dann gelten die Anker aus progress.md, nicht die obigen.
Erster Commit: next.md nach current.md verschieben (überschreiben), progress.md anlegen, committen.
Bei Abweichung: nicht anfangen, Marco fragen.

LIES ZUERST (knapp):
1. C:\AI\_MBrain Data\Projects\Torjaeger-Liga\CLAUDE.md (Pflichtregel Rückübergabe)
2. SPEC.md (Datenmodell schemaVersion 6, Abgleich, Kontroll-Pfiff, Päckchen sichern), Kopf von CHANGELOG.md
3. Den Code nur paketweise, wenn er gebraucht wird.

LEITBILD (Marco, 01.10.2026)
Freude am Lernen und Wiederholen vor Perfektion. Lehrplannah, aber kein didaktischer Umbau. Spielfluss bleibt.

GRUNDREGELN
Updates setzen nie einen Stand zurück (jede Datenänderung: nächste schemaVersion mit Migration ohne Verlust und Fixture-Test, Mindeststruktur checkProfileState mitziehen, Unbekanntes erhalten). Fragen müssen eindeutig sein. Texte ohne Gedankenstriche. Version an allen vier Stellen (app/js/version.js, VERSION in app/sw.js, SERVER_VERSION, package.json), neue Dateien in FILES von sw.js. Jede auslieferbare Version bekommt eine neue Nummer (Service-Worker-Cache).

=====================================================================
TEIL A: ERLEDIGT, nur Rückübergabe nachtragen
=====================================================================
1.5.4 (Trainingslager Teilen mit Rest, Elfmeterschießen, Schema 7) ist fertig (bd83083 bis 7574e94). Danach kamen ohne Rückübergabe: 750e247 "1.5.5: Fächer je Konto ganz ausschalten" und e0cd3e5 "Hinweis Jetzt laden auch in Wer spielt und im Eltern-Bereich".
PAKET A0: return.md um 1.5.5 und e0cd3e5 ergänzen (was, warum, Tests, Stand main/preview/origin, NAS-Stand laut Marco), progress.md anlegen, committen. Keine Codeänderung.

PAKET A1 (klein, Version 1.5.6): Info-Grafik hinter einem Fragezeichen.
- Quelle: C:\Users\marco.haufe\Downloads\TorjägerLiga.jpg (Erklär-Grafik 16:9, 2,2 MB, von Marco erstellt). Original nach assets-src\ kopieren, für die App verkleinert ablegen (z. B. app\img\info.webp oder .jpg, Breite etwa 1600 px, Ziel unter 400 KB), in FILES von sw.js, damit sie offline da ist.
- Auf der Startseite "Wer spielt?" eine kleine runde Taste "?" (mindestens 44 px, oben rechts, unauffällig). Antippen öffnet die Grafik bildschirmfüllend mit Schließen-Taste, auf dem iPad zoombar (Pinch), Querformat passend. Alternativtext: "Überblick: Was die Torjäger-Liga ist und wie sie aufgebaut ist".
- Keine PIN nötig (reine Info). Test: Datei in FILES, Taste vorhanden, Öffnen und Schließen.
- Committen, progress.md und return.md aktualisieren.

=====================================================================
TEIL B: VERSION 1.6.x (Plan Abschnitt K), nur wenn Budget übrig ist
=====================================================================
Jedes Paket ist eine eigene auslieferbare Version (1.6.0, 1.6.1, ...), mit Tag. Aufbauen auf camps aus Schema 7 (camp.js, campviews.js) und dem wiederverwendbaren startPenalty. Datenänderungen jeweils mit eigener Schemaversion und Migration.

PAKET B1: Sondertraining verallgemeinern. Eltern markieren ein oder mehrere Themen als Schwerpunkt; das Trainingslager funktioniert für jedes Mathe- und Deutsch-Thema (Einheiten aus dem jeweiligen Generator, 2 Halbzeiten). Im Mix kommen Schwerpunkt-Aufgaben etwa jede dritte Aufgabe. Teilen mit Rest behält seine 5 besonderen Einheiten.
PAKET B2: Themen-Zustände je Konto: Schwerpunkt, aktuell, wiederholen, zurückgestellt bis Datum (Datum optional, wird am Datum automatisch aktuell), aus. Neue Themen starten als "zurückgestellt" (Entscheidung Marco). Zurückgestellte und ausgeschaltete Themen blockieren den Aufstieg nicht. Bestehende Zustände aus 1.4.0 verlustfrei übernehmen.
PAKET B3: Frust-Bremse (Entscheidung Marco): drei Fehler in Folge im selben Thema, dann kommt es für die Runde seltener, der Trainer bietet einen Tipp an, im Eltern-Bereich wird das Thema markiert ("Ist das schon im Unterricht dran?").
PAKET B4: Mini-Spiel Torwand: Antworten auf den Löchern, Schuss aufs richtige Loch.
PAKET B5: Mini-Spiel Memory: Aufgabe und Ergebnis als Kartenpaare.
PAKET B6: Mini-Spiel Dribbel-Parcours: jede richtige Antwort bringt den Spieler an einem Hütchen oder Gegner vorbei, bei Fehler Ball verloren, neuer Versuch.
PAKET B7: "Überraschungsspiel" lost ein Mini-Spiel aus, oder Emil wählt selbst (Auswahl in der Kabine).
PAKET B8: Liga-Freigaben serverseitig schützen (aus der Bewertung 01.10.2026): Freischaltung einer Liga nur über einen Weg mit Eltern-PIN, nicht über den normalen Konto-Abgleich; der Server behält eine gesetzte Freigabe.

NICHT-ZIELE
- Keine Änderungen an Avatar-Vorlagen, Englisch- und Sachkunde-Inhalten, Ligen-Aufbau.
- Kein Merge nach main, kein Live-Deploy, außer Marco weist es in der Sitzung ausdrücklich an (dann festhalten). Kein Push ohne Marcos Wort.
- Nichts im Vault schreiben.

ENTSCHIEDEN, nicht mehr zur Debatte
- So viel von 1.6 wie das Budget hergibt, Pakete in der Reihenfolge B1 bis B8 (Marco, 02.10.2026).
- Längere Runden im Trainingslager: 2 Halbzeiten zu je 10 Aufgaben mit Halbzeitpause (Marco, 02.10.2026).
- Name "Sondertraining" (nicht "Trainingscamp", das ist die Liga für Klasse 2). Für Teilen mit Rest heißt die Kachel "Trainingslager".
- Neue Themen starten als zurückgestellt. Frust-Bremse wie beschrieben. Alle vier Mini-Spiele gewollt.

OFFEN, darf die annehmende Seite entscheiden
- Texte, Abzeichen-Namen, Gestaltung von Pause und Mini-Spielen, Zahlenbereiche innerhalb der Vorgaben.
- Ob das Elfmeterschießen auch nach einzelnen Halbzeiten kommt.

ABNAHME (je Paket)
- node --test grün, neue Tests zum Paket, Fixture-Migration bei Datenänderung.
- progress.md und return.md aktuell, Arbeitsbaum sauber nach jedem Commit.
- Bei jeder fertigen Version: CHANGELOG, SPEC, ggf. README, Tag, Prüfliste für Marco in return.md.

RESTPOSTEN, kategorisiert
- Echter Blocker: keiner bekannt.
- Bewusst offen: Prüfung docs/Inhalte-Englisch-Sachkunde.md durch Marco, Testrunden in Emils Konto, Hyper Backup.

DOKU-ZUSTÄNDIGKEIT
Repo trägt die Wahrheit über den Code. Vault pflegt Cowork. Rückweg: vollständige Rückübergabe in .handover\return.md (laufend gepflegt) und als Block laut CLAUDE.md, mit allem, was Marco in der Sitzung selbst ausgeführt oder angewiesen hat, dem Stand von main/preview/origin, den gesetzten Tags sowie Vorschau und Live auf der NAS. Bei Abbruch durch das Budget genügen progress.md und return.md als Rückübergabe.

ERSTER SCHRITT
Anker prüfen, nicht arbeiten. Danach ohne weitere Rückfrage mit Paket A0, dann A1, dann B1 beginnen, sobald Marco "los" sagt.
