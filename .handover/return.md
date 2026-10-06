# Rückübergabe an Cowork: Tor-Animation (Pakete D1 und D2), 06.10.2026

## Stand
- Repo C:\AI\_MBrain Data\Projects\Torjaeger-Liga, Branch preview, Version 1.7.9, 364 Tests grün (Ende-zu-Ende v14e2e unter Last gelegentlich knapp, einzeln grün).
- main und origin/main unverändert bei ebd0a0e (1.7.7). Nichts gepusht, nichts gemergt, nichts deployt, nichts im Vault geschrieben.
- Tags lokal: v1.7.8, v1.7.9 (auf preview).
- Vorschau und Live auf der NAS: unverändert, Marco hat in dieser Sitzung nichts ausgeführt (kein Push, Merge, Befehl auf der NAS, kein Test auf iPad).

## Umgesetzt
- 1.7.8 (D1): 8 Trefferpunkte (unten links/rechts, oben links/rechts, halbhoch links/rechts, Mitte flach, unter die Latte), nie zweimal derselbe hintereinander. Gebogene Bahn (Effet, Bogen, flach), Ball wird kleiner, Netz beult an der Trefferstelle aus und federt zurück. Fehlschüsse (Pfosten, Latte, knapp vorbei, gehalten) nutzen dieselbe Bogenbahn.
- 1.7.9 (D2): Torwinkel links/rechts mit Zeitlupe kurz vor dem Einschlag, zappelndem Netz und Jubel-Funken, Text „Tor! Genau ins Eck!“. Regel: Serie 3, 6, 9 sicher, sonst Zufall 1 zu 10, spätestens nach 5 normalen Treffern (zusammen etwa jeder 6.). Torwart springt in die andere Seite. Zähler „2 Ecktore!“ im Ergebnis (nur Laufzeit, nichts gespeichert).
- Gilt überall, wo die Torszene vorkommt (sceneSVG): Runden, Trainingslager, Sondertraining, Torwand (Zufallsanteil ohne Serie).

## Entscheidungen
- Text „Tor! Genau ins Eck!“ statt nur „Genau ins Eck!“: enthält „Tor!“, damit bestehende Tests und Erwartungen tragen. Overlay nutzt dafür die kleinere Schrift (Klasse long).
- Zufallsanteil 0,1 statt 1/6, weil die Obergrenze (höchstens 5 normale Treffer am Stück) die Rate schon auf etwa jeden 6. hebt (gemessen etwa 0,18).
- Torwinkel nicht im normalen Wurf, nur über die Eck-Regel.
- Keine Schema- oder Datenänderung, kein neuer Sticker.

## Restposten
- Echter Blocker: keiner.
- Bewusst offen: Zähler Ecktore ist nicht dauerhaft (nur laufende Runde). Auf dem iPad nicht gesehen (Marco prüft).
- Kosmetisch: Zeitlupe und Funken nur im Browser beurteilbar.

## Anker
Branch preview, HEAD siehe git log (Commit „1.7.9“), Arbeitsbaum sauber.

## Prüfliste für Marco (iPad, Vorschau)
1. Mehrere Runden richtig beantworten: Der Ball landet an verschiedenen Stellen im Tor (nicht zweimal gleich hintereinander).
2. Die Bahn ist leicht gebogen, der Ball wird kleiner, das Netz beult aus und federt zurück.
3. Drei richtige in Folge: Die dritte ist ein Eck-Treffer (Zeitlupe kurz vor dem Eck, Netz zappelt, Funken, „Tor! Genau ins Eck!“).
4. Falsche Antwort: Pfosten, Latte oder knapp vorbei fliegen ebenfalls auf gebogener Bahn.
5. Nach dem Tor geht es nach etwa 1,8 Sekunden von allein weiter, nichts ruckelt oder hängt.
6. Elfmeterschießen mit Torwart: Er springt in die andere Ecke, beim Eck-Treffer kommt er nicht ran. Im Ergebnis steht „x Ecktore!“.
7. Ende der Runde mit Eck-Treffern: „2 Ecktore!“ steht unter den Punkten.
8. Einstellungen, Bedienungshilfen, Bewegung reduzieren an: Ball liegt sofort am Zielpunkt, Text nennt den Treffer.
9. Trainingslager und Sondertraining kurz anspielen: gleiche Szene.

## Nächste Schritte für Marco
1. Auf dem iPad in der Vorschau die Prüfliste durchgehen (preview muss auf der NAS aktualisiert werden, siehe README, das ist noch nicht passiert).
2. Nach Abnahme: dein Wort für Merge nach main, Push und Deploy (bisher ausdrücklich nicht gemacht).
