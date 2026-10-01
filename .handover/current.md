Cross-Handover cowork nach claude-code, 2026-10-01.
Modus: bauen. Stufe: voll.
Projekt: Torjäger-Liga (Fußball-Lernspiel für Emil). Repo: C:\AI\_MBrain Data\Projects\Torjaeger-Liga (GitHub 1984MaHa/torjaeger). Live läuft 1.5.2 (main).

ANKER, zuerst gegenprüfen, nicht arbeiten:
Diese Sitzung gehört NUR zum Repo Torjaeger-Liga. Steht die Sitzung in einem anderen Ordner (z. B. TopDesk-SLA-Dashboard): sofort stoppen, nichts ändern, Marco Bescheid geben.
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" branch --show-current   -> erwartet preview
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" log --oneline -1         -> erwartet 4f872de
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" log --oneline -1 main    -> erwartet 4f872de
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" status --short           -> erwartet genau:  M .handover/return.md, ?? .handover/review-2026-10-01.md, ?? .handover/next.md
grep APP_VERSION app/js/version.js -> erwartet 1.5.2
Dann als ersten Commit: return.md und review-2026-10-01.md so wie sie sind committen (Bewertungs-Rückübergabe), next.md nach current.md verschieben (überschreiben) und mit committen.
Hinweis: Eine leere Datei .git\index.lock (01.10.2026 11:38) stammt von Cowork (git status ohne Löschrecht). Wenn kein anderer git-Prozess läuft, darf sie gelöscht werden.
Bei Abweichung: nicht anfangen, Marco fragen.

LIES ZUERST, in dieser Reihenfolge:
1. CLAUDE.md (Pflichtregel Rückübergabe)
2. .handover\review-2026-10-01.md und den dort verlinkten Bericht C:\AI\_MBrain OS\MyBrain\Projects\Torjaeger\Torjaeger-Bewertung-2026-10-01.md (Quellenstellen, Reproduktionen, Abnahmekriterien; nur lesen)
3. C:\AI\_MBrain OS\MyBrain\Projects\Torjaeger\specs\Torjaeger-Plan.md, Abschnitt "L. Einordnung der Bewertung" (nur lesen)
4. SPEC.md (Datenmodell, Abgleich, Eltern-Bereich), CHANGELOG.md

LEITBILD (Marco, 01.10.2026)
Die App soll Emil Freude am Lernen und Wiederholen machen und nah am Lehrplan bleiben, ohne 100 % lehrplan- oder methodentreu zu sein. Korrekturen also gezielt, kein didaktischer Umbau, Spielfluss bleibt.

AUFTRAG
Version 1.5.3 auf Branch preview: Sofort-Korrekturen aus der Bewertung plus leichte Übernahmen. Jede Korrektur mit Regressionstest. Lokal testen, auf preview committen, vollständige Rückübergabe schreiben.

TEIL 1: SOFORT-KORREKTUREN (fachlich falsch oder Datenverlust)
1. i/ie-Vorlagen: Generator erzeugt falsche Wörter ("Lieed", "Spieel"). Vorlagen korrigieren. Test für ALLE Rechtschreib-Listen (nicht nur i/ie): Vorlage plus richtige Lösung ergibt genau das Zielwort, und das Zielwort steht in der Wortliste.
2. Sachaufgabe Netze "halb voll": Erklärung ist falsch. Den tatsächlichen Rest nennen (z. B. "im letzten Netz sind 3 Bälle"). Test über viele Zufallswerte, dass Erklärung und Rechnung zusammenpassen.
3. Gleichzeitiges Speichern (Server): Zwei PUTs mit gleicher baseRev dürfen nicht beide gewinnen. Stand und Revision erst nach vollständigem Einlesen der Anfrage lesen, Prüfung und Schreiben ohne await dazwischen bzw. mit Sperre je Konto und je Settings. Der Verlierer bekommt 409, der Client führt wie bisher zusammen. Test mit zwei parallelen Anfragen.
4. Mindeststruktur: Server lehnt einen strukturell unvollständigen Stand ab (400), statt ihn zu speichern. Pflichtfelder laut SPEC (schemaVersion, Konto-Grunddaten, Fortschritt als Objekt usw.), unbekannte Zusatzfelder bleiben erlaubt (Grundregel "Unbekanntes erhalten"). Der Client sendet nie einen unvollständigen Stand. Test: unvollständig wird abgelehnt, vollständiger Stand aus Fixture 1.5.2 wird angenommen.
5. Päckchen-Verlust bei "Kabine": Laufendes Päckchen (Kontroll-Pfiff und reguläre Runden, soweit betroffen) wird beim Verlassen gesichert. Beim nächsten Öffnen "Weiterspielen oder neu anfangen?" anbieten. Kurze Rückfrage vor dem Verlassen ist erlaubt, wenn sie nicht nervt. Test für Sichern und Fortsetzen.
6. Lokales Speichern (IndexedDB): Fehler abfangen, erneut versuchen, bei dauerhaftem Fehler gut sichtbarer, kindgerechter Hinweis für Eltern ("Speichern klappt gerade nicht"), kein stiller Verlust. Test mit simuliertem Fehler.
7. PIN-Schutz: Die Eltern-PIN darf über den normalen Settings-Abgleich nicht mehr geändert werden. PIN-Änderung nur über einen eigenen Weg, der die aktuelle PIN prüft. Die neue PIN kommt danach weiterhin auf allen Geräten an (Entscheidung Marco: PIN auf allen Geräten gleich). "PIN merken" aus 1.5.2 bleibt. Test: Settings-PUT mit anderer PIN ändert sie nicht, Änderung mit richtiger alter PIN klappt, mit falscher nicht.

TEIL 2: LEICHTE ÜBERNAHMEN (Spielfluss bleibt)
8. Nach richtiger Antwort optional "Warum stimmt das?", ohne den automatischen Weiter-Ablauf zu bremsen (Taste nur kurz sichtbar oder Weiter wartet nur, wenn sie angetippt wird).
9. Taste "Mix-Spiel" heißt "Mix: Mathe & Deutsch" (bzw. passend zu den gewählten Fächern).
10. Hilfetaste mindestens 44 px, Kopfzeile darf umbrechen.
11. Zuordnen: Paare zusätzlich mit Nummer oder Symbol, nicht nur Farbe.
12. Fehler bei der Kontoanlage: eingegebener Name bleibt stehen.
13. Eltern-Bereich: statt "sicher" heißt es "zuletzt sicher geübt". Für Emil bleibt das Häkchen.
14. Englisch-Bilder mit Deutungsspielraum (laut Bericht z. B. Frau für Mutter, Tulpe für Frühling) eindeutiger machen: anderes Motiv oder Antwortauswahl so, dass nur eine Lösung passt. Grundregel: Fragen müssen immer eindeutig sein.

VERSION UND DATEN
- Version 1.5.3 an allen vier Stellen (app/js/version.js, VERSION in app/sw.js, SERVER_VERSION, package.json), neue Dateien in FILES von sw.js.
- Falls ein Feld dazukommt (z. B. gesichertes Päckchen): nächste schemaVersion mit Migration ohne Verlust, Test mit Fixture im Format 1.5.2. Updates setzen nie einen Stand zurück.

NICHT-ZIELE
- Kein didaktischer Umbau, keine Kompetenzdiagnostik, keine neuen Fächer, Ligen oder Aufgabentypen.
- Kein Sondertraining, keine Mini-Spiele, kein Zurückstellen von Themen (kommt mit 1.6.0, eigener Auftrag).
- Keine Änderungen an Avatar-Vorlagen und Stickern außer was die Korrekturen zwingend brauchen.
- Kein Merge nach main, kein Live-Deploy, außer Marco weist es in der Sitzung ausdrücklich an (dann festhalten).
- Nichts im Vault schreiben.

ENTSCHIEDEN, nicht mehr zur Debatte
- Leitbild Freude vor Perfektion (Marco, 01.10.2026).
- Alle sieben Sofort-Korrekturen kommen in 1.5.3, auch der PIN-Schutz.
- Texte ohne Gedankenstriche, Fragen eindeutig, Updates setzen nie einen Stand zurück.

OFFEN, darf die annehmende Seite entscheiden
- Technik der Sperre im Server, genaue Pflichtfelder der Mindeststruktur (in SPEC.md festhalten).
- Gestaltung von "Warum stimmt das?", Symbole beim Zuordnen, Ersatzmotive für Englisch.
- Ob vor dem Verlassen eines Päckchens gefragt wird oder nur Fortsetzen angeboten wird.

ABNAHME
- node --test grün: alle bisherigen Tests plus neue Regressionstests zu Punkt 1 bis 7 und, wo sinnvoll, 8 bis 14.
- Vorschau auf der NAS: Marco testet nach deploy.sh preview auf dem iPad (Sitzung nennt ihm die Prüfpunkte als kurze Liste).
- README, SPEC.md (Abgleich, PIN-Weg, Mindeststruktur), CHANGELOG.md (1.5.3) aktuell. Arbeitsbaum sauber, alles auf preview.
Tests Pflicht: ja

RESTPOSTEN, kategorisiert
- Echter Blocker: keiner bekannt.
- Bewusst offen: iPad-Abnahme, Prüfung docs/Inhalte-Englisch-Sachkunde.md durch Marco, Hyper Backup, Testrunden in Emils Konto, Apple-Geräteprüfung und Nutzungstest laut Bericht.
- Danach: Auftrag 1.6.0 (Plan Abschnitt K: Sondertraining, Mini-Spiele, Themen zurückstellen, Frust-Bremse).

DOKU-ZUSTÄNDIGKEIT
Repo trägt die Wahrheit über den Code (SPEC.md, CHANGELOG.md, README.md, docs/). Vault pflegt Cowork. Rückweg: vollständige Rückübergabe nach .handover\return.md und als Block laut CLAUDE.md, ausdrücklich mit allem, was Marco in der Sitzung selbst ausgeführt oder angewiesen hat, und dem Stand von main/preview/origin sowie der Vorschau auf der NAS.

ERSTER SCHRITT
Anker prüfen, nicht arbeiten.
