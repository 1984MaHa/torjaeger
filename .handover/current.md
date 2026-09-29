# Cross-Handover

**Stand:** 2026-09-29 22:10
**Von:** cowork
**An:** claude-code
**Stufe:** voll
**Modus:** bauen

Inhalt identisch mit dem kopierfertigen Block. Anker: Commit 67a0bed auf main, Arbeitsbaum sauber bis auf diese Datei.

```
Cross-Handover cowork nach claude-code, 2026-09-29.
Modus: bauen. Stufe: voll.
Projekt: Torjäger-Liga (Fußball-Lernspiel Mathe/Deutsch für Emil, Grundschule). Repo: C:\AI\_MBrain Data\Projects\Torjaeger-Liga (GitHub 1984MaHa/torjaeger). Phase 1 ist live und von Marco auf iPad/iPhone abgenommen.

ANKER, zuerst gegenprüfen, nicht arbeiten:
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" log --oneline -1   -> erwartet 67a0bed "Doku: README, CHANGELOG, SPEC für Phase 1"
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" status --short     -> erwartet genau: M .handover/current.md (dieser Auftrag, von Cowork überschrieben)
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" branch -a          -> erwartet nur main und remotes/origin/main, noch kein preview
Bei anderer Abweichung: zurückweisen und als Prüfauftrag an Cowork zurückspielen.

LIES ZUERST, in dieser Reihenfolge:
1. C:\AI\_MBrain Data\Projects\Torjaeger-Liga\CLAUDE.md
2. C:\AI\_MBrain Data\Projects\Torjaeger-Liga\SPEC.md und CHANGELOG.md (gebauter Stand 1.0.0)
3. C:\AI\_MBrain Data\Projects\Torjaeger-Liga\.handover\current.md (dieser Auftrag als Zettel)
4. C:\AI\_MBrain OS\MyBrain\Projects\Torjaeger\Torjaeger.md (Index, Stand, Grundregeln)
5. C:\AI\_MBrain OS\MyBrain\Projects\Torjaeger\specs\Torjaeger-Plan.md (Abschnitte "Neue Anforderungen A bis F", "Spielkonzept > Avatar")
6. C:\AI\_MBrain Data\Projects\Torjaeger-Liga\app\js\ (model.js, store.js, sync.js, merge.js, views.js), server\server.js, deploy.sh, docker-compose.yml

AUFTRAG
Drei Pakete in dieser Reihenfolge, alles auf einem neuen Branch preview (von main abzweigen), jeweils eigene Commits:
1. Vorschau-Betrieb, 2. Admin-Bereich, 3. Avatar für jedes Kind plus Trainer-Avatar mit Hilfe.
Ergebnis: lokal getestet, auf preview committet, bereit für Marcos Push und die Einrichtung der Vorschau auf der NAS. Nichts nach main mergen.

PAKET 1: VORSCHAU (Verdacht, nicht Vorschrift)
- Auf der NAS wird es einen zweiten Klon geben: /volume1/docker/torjaeger-preview (Branch preview), eigener Container, Port 127.0.0.1:8081, eigener Datenordner data/ in diesem Klon. Live bleibt /volume1/docker/torjaeger (Branch main, Port 8080).
- Tailscale: Vorschau unter https://energizer.tailfc5923.ts.net:8443 (tailscale serve --bg --https=8443 http://127.0.0.1:8081). Eigener Port = eigener Browser-Speicher, keine Vermischung mit Live.
- docker-compose.yml und deploy.sh so, dass beide Klone aus demselben Repo laufen: Containername, Port und Vorschau-Kennung je Klon über eine nicht versionierte .env (Beispiel .env.example im Repo) oder gleichwertig. Muss mit docker-compose v1 funktionieren (DSM 7.1.1, Paket Docker).
- deploy.sh prüft, dass der ausgecheckte Branch zum Klon passt (Live nur main, Vorschau nur preview) und bricht sonst ab.
- In der Vorschau oben ein deutliches Band "VORSCHAU" (Kennung vom Server, z. B. über /api/health oder /api/config).
- README: Einrichtung der Vorschau als nummerierte Einzelschritte für Marco, Befehle unverschachtelt, ohne Heredocs.

PAKET 2: ADMIN-BEREICH (Eltern)
- Zugang: Taste "Eltern" auf der Startseite "Wer spielt?", Eltern-PIN. Kindgerechte Oberfläche bleibt davon unberührt.
- Konten: anlegen, umbenennen, zurücksetzen (vorher Sicherung), löschen (Server verschiebt nach data/trash/, Wiederherstellen aus dem Papierkorb möglich, nie hart löschen), Ligen je Konto freigeben/sperren, Probe-Kontingent sehen.
- Lernstand je Konto: Trefferquote je Thema (letzte 10 und gesamt), letzte Spiele (Datum, Liga, Modus, Ergebnis, Dauer), Trainingstage, genutzte Tipps (siehe Paket 3).
- Einstellungen: PIN ändern (alte PIN nötig), pro Konto: Ton, Aufgaben pro Runde (6/8/10), Schnupper-Regeln (Aufgabenzahl, 1x pro Tag an/aus), Tipp-Zeit (siehe Paket 3).
- Sicherungen und System: Liste der Sicherungen auf der NAS (Tagessicherungen, pre-deploy, Papierkorb) mit Datum und Größe; Wiederherstellen je Konto (legt vorher Sicherung des aktuellen Stands an); App-, Server- und Schemaversion; letzter Abgleich je Gerät mit änderbarem Gerätenamen (Server führt eine Geräteliste: deviceId, Name, zuletzt gesehen).
- Heikle Admin-Aktionen (löschen, wiederherstellen, zurücksetzen, PIN ändern) prüft der Server selbst gegen die PIN (Hash und Salz liegen in data/settings.json); Client-Prüfung allein reicht dafür nicht.

PAKET 3: AVATARE
a) Spieler-Avatar je Konto:
- Baukasten: Frisur (mindestens 6), Haarfarbe, Hautton (mehrere Töne), Trikotfarbe, Hosenfarbe, Rückennummer, Name auf dem Trikot, Schuhfarbe, Mannschaftsname und Vereinsfarben. Eigene, schlichte SVG-Figur (keine bekannten Figuren oder Vereinslogos nachbilden). Fertige Vorlagen zum schnellen Start. Kein fester Jungen/Mädchen-Modus, alles frei wählbar.
- Der Avatar schießt die Tore: richtig = Schuss ins Netz, falsch = zufällig Pfosten, Latte oder knapp vorbei. prefers-reduced-motion beachten.
- Avatar auf der Kachel in "Wer spielt?" und in der Torszene. Beim ersten Öffnen eines Kontos ohne Avatar: Baukasten anbieten (überspringbar).
b) Trainer-Avatar (Marco, der Vater):
- Eigene kleine Figur (Trainer mit z. B. Kappe/Pfeife), Aussehen und Name im Admin einstellbar (Vorgabe "Trainer Papa"), gilt für alle Konten.
- Ist in jeder Aufgabe mit einer Hilfe-Taste präsent. Tippen gibt gestufte Hilfe: 1. Tipp (Denkanstoß, z. B. die vorhandenen hint-Texte), 2. Erklärung des Lösungswegs an einem ähnlichen Beispiel. Die Hilfe verrät nie die Lösung vor dem Antworten.
- Nach der Antwort erklärt der Trainer (bestehende ex-Texte) in einer Sprechblase.
- Ist eine Aufgabe zu lange offen (Vorgabe 45 Sekunden ohne Eingabe, je Konto im Admin einstellbar oder aus), meldet sich der Trainer von selbst freundlich mit einem Tipp-Angebot.
- Hilfe kostet keine Punkte; Nutzung je Aufgabe und Thema wird in den stats vermerkt und im Lernstand angezeigt.
- Kurze Sätze, kindgerecht, Deutsch, keine Gedankenstriche.

DATENMODELL
- Neue Felder (Avatar, Trainer, Konto-Einstellungen, Tipp-Nutzung, Geräteliste) mit schemaVersion 2 und Migration 1 nach 2 ohne Verlust, inklusive Test mit einem Stand im Format 1.0.0 (Emils echter Stand hat Format 1). Unbekanntes bleibt erhalten. Merge-Regeln für die neuen Felder in SPEC.md festhalten (Aussehen: neuester gewinnt; Tipp-Zähler: je Gerät summieren).
- APP_VERSION und SW-VERSION auf 1.1.0 erhöhen.

NICHT-ZIELE
- Keine Einführungstour und keine gestaltete Startseite über die Avatar-Kacheln hinaus (Phase 2b).
- Keine neuen Spielmodi, keine neuen Aufgabenarten, keine Liga Klasse 1.
- Kein Merge nach main, kein git push, keine Änderungen auf der NAS. Das macht Marco mit Cowork Schritt für Schritt.
- Keine npm-Abhängigkeiten, kein Build-Tool, kein Framework, keine externen Ressourcen.
- Keine Sprachausgabe/Audio-Stimme für den Trainer.

ENTSCHIEDEN, nicht mehr zur Debatte
- Reihenfolge heute: Vorschau, Admin, Avatar (Marco, 29.09.2026). Admin und Avatar werden zuerst in der Vorschau getestet.
- Admin-Umfang: alle vier Bereiche (Konten, Lernstand, Einstellungen, Sicherungen und System).
- Vorschau als zweiter Klon auf der NAS mit Port 8081/8443 und eigenem Datenordner; Branch preview = Vorschau, main = Live.
- Trainer-Avatar für Marco mit Hilfe-Taste, gestuften Tipps, Erklärungen und Meldung nach zu langer Pause (Marco, 29.09.2026).
- Aussehen je Konto frei wählbar, kein fester Mädchen-Modus.
- Updates setzen nie einen Spielstand zurück (Sicherung vor Deploy, Migration, Unbekanntes erhalten).
- Betrieb: energizer DS918+, DSM 7.1.1, Docker-Paket mit docker-compose v1; Zugriff nur über Tailscale.

OFFEN, darf die annehmende Seite entscheiden
- Technik der Vorschau-Konfiguration (.env, Umgebungsvariablen, zwei Compose-Dateien), solange docker-compose v1 läuft und die Einrichtung für Marco einfach bleibt.
- Genaue Frisuren, Farbpaletten, Figurstil und Animationsablauf (kindgerecht, klar, flott).
- Aufbau der Admin-Oberfläche (Reiter oder Kacheln), solange auf iPad gut bedienbar.
- Wie der Trainer bei Aufgabentypen ohne hint-Text einen sinnvollen ersten Tipp bekommt (je Generator ergänzen).

ABNAHME
- node --test grün, inklusive neuer Tests: Migration 1 nach 2 mit Fixture, Admin-API mit falscher und richtiger PIN, Papierkorb löschen und wiederherstellen, Wiederherstellen aus Sicherung, Merge der neuen Felder, deploy.sh Branch-Prüfung.
- Lokal zwei Instanzen parallel startbar (Live 8080, Vorschau 8081 mit Band "VORSCHAU"), getrennte Daten.
- Admin: alle vier Bereiche funktionieren lokal; heikle Aktionen ohne gültige PIN werden vom Server abgelehnt.
- Avatar: Baukasten speichert je Konto, erscheint auf der Kachel und schießt in der Torszene (Treffer und drei Fehlschuss-Varianten).
- Trainer: Hilfe-Taste mit zwei Stufen, Erklärung nach Antwort, Meldung nach eingestellter Zeit, abschaltbar.
- Keine externen Requests in app/. Texte ohne Gedankenstriche.
- SPEC.md, CHANGELOG.md (1.1.0), README.md (inkl. Vorschau-Einrichtung) aktuell. Arbeitsbaum am Ende sauber, alles auf preview.
Tests Pflicht: ja

RESTPOSTEN, kategorisiert
- Echter Blocker: keiner bekannt.
- Bewusst offen: Hyper Backup nicht eingerichtet (Entscheidung Marco); Emils Konto enthält Testrunden von Marco (entscheidet Marco selbst im Admin).
- Kosmetischer Rest: Tailscale auf der NAS 1.58.2.

DOKU-ZUSTÄNDIGKEIT
Repo trägt die Wahrheit über den Code (SPEC.md, CHANGELOG.md, README.md). Vault (C:\AI\_MBrain OS\MyBrain\Projects\Torjaeger\) trägt Absicht, Entscheidungen, Verlauf und wird von Cowork gepflegt; dort nichts schreiben. Rückweg: kurzer Cross-Handover zurück an Cowork (Annahmekorrekturen, verworfene Wege, kategorisierte Restposten, Anker mit Commit auf preview und Arbeitsbaum) plus die Schritte für Marco: Push von preview, Vorschau auf der NAS einrichten, Test, später Merge nach main und Live-Deploy. Schritte einzeln, Befehle unverschachtelt, ohne Heredocs.

ERSTER SCHRITT
Anker prüfen, nicht arbeiten.
```
