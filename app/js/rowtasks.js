// Neue Aufgabenarten zu einer Reihe des Einmaleins (ab 1.7.2), nach Emils Hausaufgabe "Die 9er Reihe", für jede Reihe 1 bis 10 nutzbar.
// Ballsäcke, Passkette, Rechenkreis vorwärts, Rechenkreis rückwärts (Aufgabenart "slots": mehrere Zahlenfelder, nur Antippen und Zahlenblock)
// und das Päckchen der Reihe (gemischte Zahlenaufgaben mit Tauschaufgaben, mal 0, mal 1, mal 10).
// Reine Funktionen, kein DOM. Die Zeichnung steht in slots.js. Alle Aufgaben halten die Einmaleins-Grenze (mul.js): Faktor höchstens 10, Ergebnis höchstens 100, 0 nur mit Schalter.
import {R,pick,shuffle} from "./util.js";
import {pickRow,getMul} from "./mul.js";
import {mk} from "./generators.js";

export const ROW_KINDS=["sacks","chain","wheel","wheelback","pack"];
export const ROW_KIND_NAMES={sacks:"Ballsäcke",chain:"Passkette",wheel:"Rechenkreis vorwärts",wheelback:"Rechenkreis rückwärts",pack:"Päckchen Reihe"};
export const SLOT_KINDS=["sacks","chain","wheel","wheelback"]; // Einzelaufgaben mit mehreren Feldern
export const WHEEL_N=8;      // Zahlen im Rechenkreis
export const CHAIN_N=10;     // Kreise in der Passkette
export const ROWPACK_MIN=12,ROWPACK_MAX=16;

// ---------- a) Ballsäcke: n Säcke zu je k Bällen, Kind schreibt n · k = Ergebnis ----------
export function sacksTask(row=pickRow(2,10,1)){
  const n=R(1,10),k=row;
  return{type:"slots",kind:"sacks",row,sacks:{n,k},
    q:"Wie viele Säcke sind es? Schreibe die Malaufgabe und das Ergebnis.",
    cells:[{slot:0},{txt:"·"},{fix:k},{txt:"="},{slot:1}],labels:["Anzahl der Säcke","Ergebnis"],a:[n,n*k],sig:`sk|${n}|${k}`,
    ex:`${n} Säcke mit je ${k} Bällen: ${n} · ${k} = ${n*k}.`,
    hint:"Zähle die Säcke. Auf jedem Sack steht, wie viele Bälle darin sind. Wie oft kommt diese Zahl vor? Das ist eine Malaufgabe.",
    probe:{name:"Nachzählen",html:"Zähle die Säcke noch einmal. Steht die richtige Zahl vor dem Mal? Rechne dann die Aufgabe aus: Passt das Ergebnis dazu?"}};
}

// ---------- b) Passkette: 10 Kreise mit der Reihe, ein oder zwei Werte stehen schon da ----------
export function chainTask(row=pickRow(2,10,1),zeroStart=getMul().zero&&Math.random()<.3){
  const start=zeroStart?0:1,vals=[...Array(CHAIN_N).keys()].map(i=>(start+i)*row);
  const givenN=Math.random()<.5?1:2,givenAt=new Set();
  while(givenAt.size<givenN)givenAt.add(R(0,CHAIN_N-1));
  let j=0;const cells=vals.map((v,i)=>givenAt.has(i)?{fix:v}:{slot:j++});
  const a=vals.filter((_,i)=>!givenAt.has(i));
  return{type:"slots",kind:"chain",row,chain:{row,start},
    q:`Die Spieler passen sich den Ball zu. In jeden Kreis kommt die nächste Zahl der ${row}er-Reihe.${zeroStart?" Die Kette beginnt mit der 0.":""}`,
    cells,labels:cells.map((c,i)=>`Kreis ${i+1}`),a,sig:`ch|${row}|${start}|${[...givenAt].sort((x,y)=>x-y).join(",")}`,
    ex:`Die ${row}er-Reihe: ${vals.join(", ")}.`,
    hint:"Geh die Kette der Reihe nach. Von einem Kreis zum nächsten kommt immer dieselbe Zahl dazu. Dann findest du auch die Zahlen dazwischen.",
    probe:{name:"Kette prüfen",html:"Lies die Kette noch einmal von vorn. Kommt von Kreis zu Kreis immer dasselbe dazu?"}};
}

// ---------- c) und d) Rechenkreis: Mitte "· k", innen 8 Zahlen, außen die Ergebnisse ----------
export function wheelTask(row=pickRow(2,10,1),back=false){
  const pool=getMul().zero?[0,1,2,3,4,5,6,7,8,9,10]:[1,2,3,4,5,6,7,8,9,10];
  const inner=shuffle(pool).slice(0,WHEEL_N),outer=inner.map(x=>x*row);
  const cells={inner:inner.map(v=>({fix:v})),outer:outer.map(v=>({fix:v}))};
  // die gesuchten Felder bekommen Nummern von 0 bis 7 im Uhrzeigersinn
  const hidden=back?"inner":"outer";cells[hidden]=cells[hidden].map((_,i)=>({slot:i}));
  const a=back?inner.slice():outer.slice();
  return{type:"slots",kind:back?"wheelback":"wheel",row,wheel:{row,back,inner,outer},cells,labels:a.map((_,i)=>`Feld ${i+1}`),a,sig:`wh|${back?"b":"v"}|${row}|${inner.join(",")}`,
    q:back?`Die Ergebnisse stehen außen. Welche Zahl im inneren Ring passt zu der Mitte? Schreibe sie hinein.`
          :`Rechne mit der Mitte. Jede Zahl im inneren Ring mal ${row}. Schreibe das Ergebnis in den äußeren Ring.`,
    ex:inner.map((x,i)=>`${x} · ${row} = ${outer[i]}`).join(", ")+".",
    hint:back?"Die Zahl in der Mitte mal einer gesuchten Zahl ergibt das Ergebnis außen. Wie oft passt die Mitte in das Ergebnis?"
             :"Nimm die Zahl aus dem inneren Ring mal der Zahl in der Mitte. Das Ergebnis schreibst du außen daneben.",
    probe:back?{name:"Umkehraufgabe",html:"Rechne mit deiner Zahl zurück: Deine Zahl mal der Zahl in der Mitte. Kommt das Ergebnis außen heraus?"}
              :{name:"Umkehraufgabe",html:"Teile dein Ergebnis durch die Zahl in der Mitte. Kommt die Zahl im inneren Ring heraus?"}};
}

// ---------- e) Päckchen der Reihe: 12 bis 16 gemischte Aufgaben ----------
// Mit Tauschaufgaben (o · r und r · o), mal 0 (nur mit Schalter), mal 1, mal 10 und einigen Geteilt-Aufgaben. Jede Aufgabe kommt nur einmal vor.
export function rowPackTasks(row=pickRow(2,10,1),n=R(ROWPACK_MIN,ROWPACK_MAX)){
  const zero=getMul().zero,os=[...Array(11).keys()].filter(o=>zero||o>0);
  const cand=[];
  for(const o of os){cand.push({q:`${o} · ${row}`,t:()=>mk.einmaleins(o,row,false)});if(o!==row)cand.push({q:`${row} · ${o}`,t:()=>mk.einmaleins(row,o,false)});}
  for(const o of os)cand.push({q:`${row*o} : ${row}`,t:()=>mk.einmaleins(o,row,true)});
  for(const o of os)if(o>0&&o!==row)cand.push({q:`${row*o} : ${o}`,t:()=>mk.einmaleins(row,o,true)});
  // Pflicht: eine Aufgabe mit 1, mit 10, mit 0 (falls an) und mindestens ein Tauschpaar
  const must=[`1 · ${row}`,`${row} · 1`,`10 · ${row}`,`${row} · 10`].concat(zero?[`0 · ${row}`,`${row} · 0`]:[]);
  const need=[pick(must.slice(0,2)),pick(must.slice(2,4))].concat(zero?[pick(must.slice(4))]:[]);
  const chosen=new Map();
  for(const m of need){const c=cand.find(x=>x.q===m);if(c)chosen.set(c.q,c);}
  const swaps=os.filter(o=>o>1&&o!==row),swapO=swaps.length?pick(swaps):undefined;
  if(swapO!==undefined)for(const q of [`${swapO} · ${row}`,`${row} · ${swapO}`]){const c=cand.find(x=>x.q===q);if(c)chosen.set(q,c);}
  for(const c of shuffle(cand)){if(chosen.size>=n)break;chosen.set(c.q,c);}
  return shuffle([...chosen.values()]).slice(0,n).map(c=>c.t());
}

// Eine Einzelaufgabe (Ballsäcke, Passkette, Rechenkreis) der Art kind. Das Päckchen ist keine Einzelaufgabe: siehe rowPackTasks.
export function rowTask(kind,row){
  if(kind==="sacks")return sacksTask(row);
  if(kind==="chain")return chainTask(row);
  if(kind==="wheel")return wheelTask(row,false);
  if(kind==="wheelback")return wheelTask(row,true);
  throw new Error("Unbekannte Aufgabenart: "+kind);
}
// Abwechslung im normalen Üben des Einmaleins: eine der vier Einzelaufgaben mit einer Reihe aus der Grenze des Kontos
export const varietyTask=()=>rowTask(pick(SLOT_KINDS),pickRow(2,10,1));
