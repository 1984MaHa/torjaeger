Cross-Handover cowork nach claude-code, 2026-10-02.
Modus: bauen. Stufe: voll.
Projekt: Torjäger-Liga (Fußball-Lernspiel für Emil). Repo: C:\AI\_MBrain Data\Projects\Torjaeger-Liga (GitHub 1984MaHa/torjaeger). Live und Vorschau laufen mit 1.5.3.
Termin: Marco möchte am Wochenende (ab Samstag, 03.10.2026) mit Emil üben. Fertig auf preview bis Freitagabend wäre ideal.

ANKER, zuerst gegenprüfen, nicht arbeiten:
Diese Sitzung gehört NUR zum Repo C:\AI\_MBrain Data\Projects\Torjaeger-Liga. Steht die Sitzung in einem anderen Ordner (z. B. TopDesk-SLA-Dashboard): sofort stoppen, nichts ändern, Marco Bescheid geben.
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" branch --show-current   -> erwartet preview
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" log --oneline -1         -> erwartet 5e51b26
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" log --oneline -1 main    -> erwartet 5e51b26
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" status --short           -> erwartet genau: ?? .handover/next.md
grep APP_VERSION app/js/version.js -> erwartet 1.5.3
Dann als ersten Commit: next.md nach current.md verschieben (überschreiben) und committen.
Bei Abweichung: nicht anfangen, Marco fragen.

LIES ZUERST, in dieser Reihenfolge:
1. C:\AI\_MBrain Data\Projects\Torjaeger-Liga\CLAUDE.md (Pflichtregel Rückübergabe)
2. SPEC.md (Datenmodell schemaVersion 6, Abgleich, Kontroll-Pfiff, Päckchen sichern aus 1.5.3), CHANGELOG.md, .handover\return.md
3. C:\AI\_MBrain OS\MyBrain\Projects\Torjaeger\specs\Torjaeger-Plan.md, Abschnitt "K. Sondertraining, Mini-Spiele" (nur lesen)
4. Generatoren zu m3_rest (Teilen mit Rest) und m3_sach (Sachaufgaben mit Rest), Kontroll-Pfiff (check.js)

LEITBILD (Marco, 01.10.2026)
Freude am Lernen und Wiederholen vor Perfektion. Lehrplannah, aber kein didaktischer Umbau. Spielfluss bleibt.

AUFTRAG
Version 1.5.4 auf Branch preview: ein "Trainingslager Teilen mit Rest" für Emil. Das ist der vorgezogene erste Baustein des Sondertrainings aus 1.6.0 (Plan K), zugeschnitten auf ein Thema, aber so gebaut, dass 1.6.0 es später für beliebige Themen verallgemeinern kann. Dazu das Mini-Spiel Elfmeterschießen. Lokal testen, auf preview committen, vollständige Rückübergabe schreiben.

1. KACHEL UND ABLAUF
- Startseite des Kontos: oben eine eigene Kachel "Trainingslager: Teilen mit Rest" mit Fortschrittsbalken (Einheit x von 5) und Abzeichen am Ende. Nur sichtbar, wenn im Eltern-Bereich eingeschaltet.
- 5 Einheiten, nacheinander freigeschaltet (die nächste nach Abschluss der vorigen, keine Mindestquote, Freude vor Perfektion). Abgeschlossene Einheiten lassen sich wiederholen.
- Jede Einheit ist ein längeres Spiel aus 2 HALBZEITEN zu je 10 Aufgaben (Entscheidung Marco). Dazwischen eine Halbzeitpause: Zwischenstand (Tore, Fehlschüsse), kurzer Trainer-Satz, Taste "2. Halbzeit anpfeifen". Am Ende Abpfiff mit Ergebnis und Bonus wie bei normalen Runden.
- Danach als Belohnung NACHSPIELZEIT: Elfmeterschießen mit 5 Aufgaben derselben Einheit (siehe 3).
- Unterbrechung: Ein laufendes Spiel wird wie das Päckchen in 1.5.3 auf dem Gerät gesichert (bei jeder Antwort, Kabine, Hintergrund) und beim nächsten Öffnen "Weiterspielen oder neu anfangen?" angeboten, inklusive Halbzeit und Stand.

2. INHALT DER 5 EINHEITEN
1. Aufwärmen: Einmaleins rückwärts und Teilen ohne Rest ("Wie oft passt die 4 in die 20?"), Divisoren 2 bis 5.
2. Erste Reste: Teilen mit Rest, Divisoren 2 bis 5, Dividend bis 50, mit Ballbildern (z. B. 17 Bälle in 5er-Netze, Rest bleibt liegen) in der 1. Halbzeit, ohne Bilder in der 2. Halbzeit.
3. Alle Reihen: Divisoren 2 bis 9, Dividend bis 90. Typischer Fehler "Rest gleich oder größer als der Teiler": eigene, freundliche Trainer-Rückmeldung ("Da passt noch einer rein!").
4. Kontroll-Pfiff: Päckchen im Stil von Emils Arbeitsblatt "Dividieren mit Rest", Ergebnis per Probe prüfen (4 · 4 + 2 = 18). Vorhandenen Kontroll-Pfiff wiederverwenden; Umfang so wählen, dass es 2 Halbzeiten ergibt.
5. Spieltag: Sachaufgaben mit Rest (Mannschaften, Netze, Busse, Kabinen), auch die Frage, ob der Rest weg fällt oder einen zusätzlichen Bus braucht. Fragen müssen eindeutig sein.
- Aufgaben kommen aus den vorhandenen Generatoren (m3_rest, m3_sach, Kontroll-Pfiff), nur mit Parametern je Einheit. Erklärung nach "Warum stimmt das?" nennt den Rechenweg (5 · 3 = 15, 17 - 15 = 2).
- Am Ende von Einheit 5: Abzeichen "Rest-Profi" (bzw. passender Name) plus ein Jubel-Sticker, falls noch einer fehlt.
- Ergebnisse zählen wie normales Üben in den Lernstand von m3_rest und m3_sach.

3. MINI-SPIEL ELFMETERSCHIESSEN
- 5 Schüsse gegen den Torwart, jede Aufgabe ein Schuss. Richtig: Tor. Falsch: der Torwart hält, kurze Erklärung, weiter. Ergebnis wie "4 : 1".
- Wiederverwendbar bauen (Eingabe: Liste von Aufgaben), weil 1.6.0 weitere Mini-Spiele und Themen bringt. Vorhandene Torszene und Rückansicht von Emil nutzen, prefers-reduced-motion beachten.

4. ELTERN-BEREICH
- Schalter "Trainingslager Teilen mit Rest" je Konto (an/aus), Fortschritt sichtbar (welche Einheit, Ergebnisse je Halbzeit), Taste "Trainingslager neu starten" mit Rückfrage.
- Standard: aus, Marco schaltet es für Emil ein.

DATENMODELL
- Fortschritt des Trainingslagers (an/aus, Einheiten, Ergebnisse, Abzeichen) im Konto-Stand, damit iPad und iPhone denselben Stand zeigen. Nächste schemaVersion (Konto 7) mit Migration ohne Verlust, Test mit Fixture im Format 1.5.3 (Schema 6). Mindeststruktur (checkProfileState) erweitern, unbekannte Felder bleiben erlaubt.
- Laufendes Spiel nur auf dem Gerät (wie das Päckchen in 1.5.3).
- Struktur so wählen, dass 1.6.0 daraus "Sondertraining je Thema" machen kann (z. B. camps: { m3_rest: {...} }), ohne erneuten Umbau.
- Version 1.5.4 an allen vier Stellen (app/js/version.js, VERSION in app/sw.js, SERVER_VERSION, package.json), neue Dateien in FILES von sw.js.

NICHT-ZIELE
- Keine weiteren Mini-Spiele (Torwand, Dribbel-Parcours, Memory), kein allgemeines Sondertraining für andere Themen, keine Themen-Zustände "zurückgestellt", keine Frust-Bremse. Das alles bleibt 1.6.0.
- Keine Änderungen an anderen Fächern, Ligen, Avatar-Vorlagen.
- Kein Merge nach main, kein Live-Deploy, außer Marco weist es in der Sitzung ausdrücklich an (dann festhalten). Nichts im Vault schreiben.

ENTSCHIEDEN, nicht mehr zur Debatte
- Trainingslager als vorgezogener Teil von 1.6.0, Version 1.5.4 (Marco, 02.10.2026).
- Längere Runden: 2 Halbzeiten zu je 10 Aufgaben mit Halbzeitpause (Marco, 02.10.2026).
- Elfmeterschießen als Belohnung.
- Grundregeln: Updates setzen nie einen Stand zurück, Fragen eindeutig, Texte ohne Gedankenstriche.

OFFEN, darf die annehmende Seite entscheiden
- Name des Abzeichens, Texte der Trainer, Gestaltung der Halbzeitpause.
- Genaue Zahlenbereiche innerhalb der Vorgaben, Anteil der Bildaufgaben.
- Ob das Elfmeterschießen auch nach einzelnen Halbzeiten oder nur nach dem Abpfiff kommt.

ABNAHME
- node --test grün, neue Tests: Migration Schema 6 auf 7, Mindeststruktur mit und ohne Trainingslager, Generator je Einheit (Rest immer kleiner als Teiler, Probe stimmt, Zahlenbereiche eingehalten, Sachaufgaben eindeutig), Halbzeit-Ablauf (10 plus 10, Pause, Abpfiff), Sichern und Fortsetzen mitten in der 2. Halbzeit, Elfmeterschießen-Ergebnis, Freischalten der Einheiten, Abgleich des Fortschritts zwischen zwei Geräten.
- Prüfliste für Marco in der Rückübergabe (Vorschau auf dem iPad).
- README, SPEC.md, CHANGELOG.md (1.5.4) aktuell. Arbeitsbaum sauber, alles auf preview.
Tests Pflicht: ja

RESTPOSTEN, kategorisiert
- Echter Blocker: keiner bekannt.
- Bewusst offen: serverseitiger Schutz der Liga-Freigaben (kommt mit 1.6.0), Prüfung docs/Inhalte-Englisch-Sachkunde.md durch Marco, Testrunden in Emils Konto, Hyper Backup.
- Danach: Auftrag 1.6.0 (Plan K, verallgemeinert das Trainingslager zum Sondertraining).

DOKU-ZUSTÄNDIGKEIT
Repo trägt die Wahrheit über den Code (SPEC.md, CHANGELOG.md, README.md, docs/). Vault pflegt Cowork. Rückweg: vollständige Rückübergabe nach .handover\return.md und als Block laut CLAUDE.md, ausdrücklich mit allem, was Marco in der Sitzung selbst ausgeführt oder angewiesen hat, und dem Stand von main/preview/origin sowie der Vorschau und Live auf der NAS.

ERSTER SCHRITT
Anker prüfen, nicht arbeiten.
