// Erzeugt docs/Inhalte-Englisch-Sachkunde.md aus app/js/content-en.js und content-su.js (zum Prüfen durch Marco).
// Aufruf: node tools/inhalte-liste.mjs
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {EN_TOPICS,UNSURE} from "../app/js/content-en.js";
import {SU_TOPICS} from "../app/js/content-su.js";

const ROOT=path.join(path.dirname(fileURLToPath(import.meta.url)),"..");
const bild=p=>/^#\d+$/.test(p)?`Ziffer ${p.slice(1)}`:p[0]==="#"?`Farbkasten ${p}`:p;
const cell=t=>String(t).replace(/\|/g,"/");
let o=`# Inhalte Englisch und Sachkunde (zur Prüfung)

Diese Liste wird aus den Datendateien erzeugt (\`node tools/inhalte-liste.mjs\`): \`app/js/content-en.js\` und \`app/js/content-su.js\`. Änderungen immer dort machen, dann die Liste neu erzeugen.
Mit **unsicher** sind Stellen markiert, die Marco besonders prüfen soll (Bild nicht ganz eindeutig oder fachliche Vereinfachung).
Alle Bilder sind Emoji (Unicode bis 13, auf iOS 15 vorhanden), Farben sind Farbkästen, Zahlen große Ziffern.

## Englisch

Je Thema drei Stufen. Die Stufe steigt je Thema mit dem Lernstand: Stufe 2 ab 8 von 10 richtig in Stufe 1, Stufe 3 ab 8 von 10 richtig in Stufe 2.
Das Häkchen für das Thema gibt es ab 8 von 10 richtig in Stufe 3.
- **Stufe 1, Bild wählen:** „Welches Bild passt zu <Wort>?“ mit 3 oder 4 Bildern desselben Themas. Richtig ist das Bild zum Wort, falsch sind 2 oder 3 andere Bilder des Themas.
- **Stufe 2, Zuordnen:** 4 oder 5 englische Wörter (mit 🔊) den deutschen Wörtern zuordnen. Alle Paare müssen stimmen.
- **Stufe 3, Schreibweise:** Bild zeigen, drei Schreibweisen zur Wahl: eine richtige, zwei falsche (keine echten englischen Wörter).
- **Hör-Aufgabe (nur mit englischer Stimme):** Das Wort wird nach Antippen vorgelesen, das passende Bild wird angetippt. Kommt in allen Stufen vor.
- **Vorlesen:** Taste 🔊 an englischen Wörtern, nur nach Antippen, Gerätestimme (en-GB bevorzugt, sonst en-US). Ohne englische Stimme sind Taste und Hör-Aufgaben weg.

`;
for(const [id,t] of Object.entries(EN_TOPICS)){
  o+=`### ${t.name} (\`${id}\`, ${t.words.length} Wörter)\n\n| Wort | Deutsch | Bild | Stufe 3: richtig | Stufe 3: falsch | Hinweis |\n|---|---|---|---|---|---|\n`;
  for(const w of t.words)o+=`| ${cell(w[0])} | ${cell(w[1])} | ${cell(bild(w[2]))} | ${cell(w[0])} | ${cell(w[3])}, ${cell(w[4])} | ${UNSURE[w[0]]?"**unsicher:** "+UNSURE[w[0]]:""} |\n`;
  o+=`\nStufe 1: richtig ist das Bild des Wortes, falsche Auswahl sind Bilder anderer Wörter dieses Themas. Stufe 2: alle Paare „Wort = Deutsch“ aus der Tabelle.\n\n`;
}
o+=`## Sachkunde (Kreisliga, Lehrplan Sachsen Sachunterricht Klasse 3)

Aufgabenarten: **Zuordnen** (zwei Spalten), **Sortieren** (in Körbe), **Reihenfolge**, **Bild wählen**, **Auswahl** (eine richtige, mehrere falsche). Bei Zuordnen, Sortieren und Reihenfolge wird je Aufgabe eine zufällige Auswahl der Paare, Karten oder Schritte gezeigt.
Keine Fragen nach persönlichen Erfahrungen, keine Schockbilder. „Tipp“ verrät die Lösung nie, „Erklärung“ kommt nach der Antwort.

`;
const ART={match:"Zuordnen",sort:"Sortieren",order:"Reihenfolge",choice:"Auswahl",pic:"Bild wählen",rose:"Kompassrose lesen",compass:"Kompassrose antippen"};
for(const [id,t] of Object.entries(SU_TOPICS)){
  o+=`### ${t.name} (\`${id}\`)\n\n`;
  if(t.late)o+="**Stoff vielleicht noch nicht in der Schule dran** (Marco, 30.09.2026): Das Thema kommt seltener dran, die Aufgaben zeigen den Hinweis „Raten ist okay“, eine falsche Antwort zählt nicht für die Wertung.\n\n";
  let n=0;
  for(const d of t.tasks){
    n++;o+=`**${n}. ${ART[d.k]}**${d.q?`: ${d.q}`:""}\n\n`;
    if(d.k==="match")o+=`- Paare (links = rechts): ${d.pairs.map(p=>`${/^#[0-9a-f]{6}$/i.test(p[0])?"Farbkasten "+p[0]:p[0]} = ${p[1]}`).join("; ")}\n- Gezeigt werden ${d.n[0]} bis ${d.n[1]} Paare. Falsche Auswahl: die Partner der anderen Paare.\n`;
    if(d.k==="sort")o+=`- Körbe: ${d.baskets.join(" / ")}\n- Karten (Korb): ${d.cards.map(c=>`${c[0]} (${d.baskets[c[1]]})`).join("; ")}\n- Gezeigt werden ${d.n[0]} bis ${d.n[1]} Karten.\n`;
    if(d.k==="order")o+=`- Richtige Reihenfolge: ${d.steps.map((s,i)=>`${i+1}. ${s}`).join(" ")}\n- Gezeigt werden ${d.win[0]} bis ${d.win[1]} aufeinanderfolgende Schritte, gemischt.\n`;
    if(d.k==="choice")o+=`- Richtig: **${d.right}**\n- Falsch: ${d.wrong.join("; ")}\n`;
    if(d.k==="pic")o+=`- Richtig: **${d.tiles[d.right][1]}** ${d.tiles[d.right][0]}\n- Falsch: ${d.tiles.filter((_,i)=>i!==d.right).map(x=>`${x[1]} ${x[0]}`).join("; ")}\n`;
    if(d.k==="rose")o+=`- Kompassrose mit rotem Pfeil, N O S W beschriftet. Richtig ist die Richtung des Pfeils, falsch sind die anderen drei Richtungen.\n`;
    if(d.k==="compass")o+=`- Norden ist mit N beschriftet. Gefragt wird nach Osten, Süden oder Westen, angetippt wird an der Rose. Richtig ist die gefragte Richtung.\n`;
    if(d.hint)o+=`- Tipp: ${d.hint}\n`;
    if(d.ex)o+=`- Erklärung: ${d.ex}\n`;
    if(d.unsure)o+=`- **unsicher:** ${d.unsure}\n`;
    o+="\n";
  }
}
fs.writeFileSync(path.join(ROOT,"docs","Inhalte-Englisch-Sachkunde.md"),o);
console.log("geschrieben:",o.length,"Zeichen");
