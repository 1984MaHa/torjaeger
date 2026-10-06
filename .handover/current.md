Cross-Handover cowork nach claude-code, 2026-10-06.
Modus: bauen. Stufe: leicht.
Projekt: Torjäger-Liga (Fußball-Lernspiel für Emil). Repo: C:\AI\_MBrain Data\Projects\Torjaeger-Liga (GitHub 1984MaHa/torjaeger).
Stand: 1.7.7 auf main = preview = origin (ebd0a0e).

ARBEITSWEISE (wie zuletzt): in Paketen, nach jedem Paket node --test grün, commit auf preview, Tag, progress.md und return.md aktualisieren. Sparsam lesen, kein Browser. Bei Abbruch macht eine neue Sitzung laut progress.md weiter.

ANKER, zuerst gegenprüfen, nicht arbeiten:
Diese Sitzung gehört NUR zum Repo C:\AI\_MBrain Data\Projects\Torjaeger-Liga. Steht die Sitzung woanders: sofort stoppen, nichts ändern, Marco Bescheid geben.
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" branch --show-current   -> erwartet preview
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" log --oneline -1         -> erwartet ebd0a0e
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" log --oneline -1 main    -> erwartet ebd0a0e
git -C "C:\AI\_MBrain Data\Projects\Torjaeger-Liga" status --short           -> erwartet genau: ?? .handover/next.md
grep APP_VERSION app/js/version.js -> erwartet 1.7.7
Erster Commit: next.md nach current.md verschieben, progress.md für diesen Auftrag neu beginnen (alten Inhalt als "Vorheriger Auftrag" behalten), committen. Bei Abweichung: nicht anfangen, Marco fragen.

LIES ZUERST: CLAUDE.md, SPEC.md Abschnitt Torszene (sceneSVG, G.shot, SHOT_TEXT, kick, prefers-reduced-motion), den Szenen-Code.

WUNSCH (Emil, über Marco, 06.10.2026)
Schönere Tor-Animation mit wechselnden Trefferpunkten im Tor. Emil wünscht sich ausdrücklich Treffer "genau ins Eck".

PAKET D1 (Version 1.7.8): Trefferpunkte und Flugbahn
- Bei richtiger Antwort wird ein Zielpunkt im Tor gewürfelt, sichtbar verschieden: unten links, unten rechts, oben links, oben rechts, halbhoch, Mitte flach, unter die Latte. Nicht zweimal hintereinander derselbe Punkt.
- Ball fliegt auf einer leicht gebogenen Bahn (Bogen oder Effet je nach Ziel), wird kleiner Richtung Tor (Perspektive), das Netz beult an der Trefferstelle sichtbar aus und federt zurück.
- Dauer der Animation passt in die bestehenden 1,8 Sekunden bis zur nächsten Aufgabe; nichts darf den Spielfluss verlängern.
- Fehlschüsse (Pfosten, Latte, knapp vorbei) nutzen dieselbe Bahn-Technik, damit es aus einem Guss wirkt.

PAKET D2 (Version 1.7.9): "Genau ins Eck" (Torwinkel) als besonderer Treffer
- Eigener Treffer in den oberen Torwinkel (links oder rechts): Ball schlägt genau im Eck ein, kurze Zeitlupe kurz vor dem Einschlag, Netz zappelt im Eck, Text zum Beispiel "Genau ins Eck!" oder "Torwinkel!", Jubel-Funken.
- Häufigkeit: regelmäßig, aber besonders: zum Beispiel bei jeder 3. richtigen Antwort in Folge (Serie) sicher, sonst ab und zu zufällig (etwa jeder 6. Treffer). Code darf die Regel feinjustieren, Hauptsache Emil sieht es in jeder Runde mindestens einmal, wenn er gut spielt.
- Im Elfmeterschießen mit Torwart: Torwart springt sichtbar in die andere Ecke; beim Ecktreffer kommt er nicht ran.
- Optional, wenn leicht: Zähler "Ecktore" im Spielstand der Runde bzw. im Abpfiff ("2 Ecktore!"). Kein neuer Sticker, keine Datenänderung nötig; falls doch ein Feld nötig ist, dann mit Schemaversion und Migration.

FÜR BEIDE PAKETE
- prefers-reduced-motion: keine Bewegung, Ball liegt sofort am Zielpunkt, Text nennt den Treffer (auch "Genau ins Eck!").
- Leicht auf dem iPad (SVG oder CSS, keine Bibliotheken, keine externen Ressourcen), gilt überall, wo die Torszene vorkommt (Runden, Trainingslager, Sondertraining, Mini-Spiele mit Torszene).
- Tests: Zielpunkte verteilt und nie zweimal gleich hintereinander, Ecktreffer-Regel (Serie, Zufallsanteil), Torwart springt nie in die Ecke des Ecktreffers, reduced-motion-Zweig, SHOT_TEXT kennt die neuen Texte.
- Version an allen vier Stellen, CHANGELOG, SPEC (Torszene) aktuell.

NICHT-ZIELE
- Keine Änderung an Aufgaben, Punkten, Ligen, Lagern, Avatar-Vorlagen. Keine Schusspose (nur der bisherige Satz nach vorn).
- Kein Merge nach main, kein Push, kein Deploy ohne Marcos ausdrückliches Wort (dann festhalten). Nichts im Vault schreiben.

ABNAHME
- node --test grün, Prüfliste für Marco in return.md (iPad Vorschau: verschiedene Trefferpunkte, Eck-Treffer bei Serie, Elfmeterschießen mit Torwart, Animation flüssig, reduced-motion).

RÜCKWEG
Rückübergabe in .handover\return.md und als Block laut CLAUDE.md, mit allem, was Marco selbst ausgeführt oder angewiesen hat, Stand main/preview/origin, Tags, Vorschau und Live auf der NAS.

ERSTER SCHRITT
Anker prüfen, nicht arbeiten. Danach ohne weitere Rückfrage mit D1 beginnen, sobald Marco "los" sagt.
