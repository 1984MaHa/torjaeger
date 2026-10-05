// Trainingslager (ab 1.5.4): ein Thema, 5 Einheiten, je 2 Halbzeiten, danach Nachspielzeit (Elfmeterschießen).
// Vorgezogener erster Baustein des Sondertrainings (1.6.0): Die Beschreibung steht in CAMPS und ist je Thema aufgebaut (camps: {m3_rest: ...}),
// die Aufgaben kommen aus den vorhandenen Generatoren (generators.js, check.js) nur mit Parametern je Einheit. Reine Funktionen, kein DOM.
import {GEN,mk} from "./generators.js";
import {packOf,keyOf} from "./check.js";
import {R,pick,shuffle} from "./util.js";
import {pickRow} from "./mul.js";
import {LIGEN,TOPICS} from "./content.js";
import {buildCamp,customHalf,customPen,customTask,allTemplates,defOf,normTemplate,campIdOf,isCustomId,tplIdOfCamp} from "./custom.js";

export const HALF_LEN=10;   // Aufgaben je Halbzeit
export const PEN_LEN=5;     // Schüsse im Elfmeterschießen
export const CAMP_IDS=["m3_rest"];
export const SPECIAL_CAMP="m3_rest"; // hat fünf besondere Einheiten und einen eigenen Schalter der Eltern

// Beschreibung je Camp. units: 5 Einheiten, jede mit Titel, Kurztext und der Art ihrer Halbzeiten.
export const CAMPS={
  m3_rest:{
    id:"m3_rest",name:"Teilen mit Rest",title:"Trainingslager: Teilen mit Rest",li:1,badge:"Rest-Profi",
    units:[
      {n:1,title:"Aufwärmen",text:"Einmaleins rückwärts und Teilen ohne Rest."},
      {n:2,title:"Erste Reste",text:"Teilen mit Rest mit 2 bis 5, ohne Bilder, die Rechnung muss im Kopf klappen."},
      {n:3,title:"Alle Reihen",text:"Teilen mit Rest mit 2 bis 9. Achte auf den Rest."},
      {n:4,title:"Kontroll-Pfiff",text:"Zwei Päckchen. Kontrolliere jedes mit der Probe."},
      {n:5,title:"Spieltag",text:"Sachaufgaben mit Rest: Busse, Netze, Kabinen, Mannschaften."}
    ]
  }
};
// Sondertraining (ab 1.6.0): Jedes Mathe- und Deutsch-Thema hat ein Trainingslager aus drei Einheiten mit Aufgaben aus dem eigenen Generator.
// Es erscheint, sobald die Eltern das Thema als Schwerpunkt markieren (settings.topicMode.<Thema> = "schwerpunkt").
const GENERIC_UNITS=[
  {n:1,title:"Aufwärmen",text:"Aufgaben zum Einspielen. Nimm dir Zeit."},
  {n:2,title:"Training",text:"Noch einmal Aufgaben zu diesem Thema."},
  {n:3,title:"Spieltag",text:"Das große Spiel: zeig, was du kannst."}
];
LIGEN.forEach((L,li)=>L.math.concat(L.deu).forEach(t=>{
  if(!CAMPS[t])CAMPS[t]={id:t,name:TOPICS[t],title:"Sondertraining: "+TOPICS[t],li,badge:"Trainings-Profi",units:GENERIC_UNITS.map(u=>Object.assign({},u)),generic:true};
}));
export const GENERIC_CAMP_IDS=Object.keys(CAMPS).filter(t=>CAMPS[t].generic);
export const campOfTopic=t=>CAMPS[t]||null;
export const unitOf=(topic,n)=>{const c=CAMPS[topic];return c&&c.units.find(u=>u.n===n)||null;};
export const UNIT_COUNT=topic=>CAMPS[topic]?CAMPS[topic].units.length:0;
// Einheit 4 besteht aus Päckchen mit Kontroll-Pfiff (Halbzeit = ein Päckchen mit 6 Aufgaben), alle anderen aus 10 einzelnen Aufgaben.
export const isPackUnit=(topic,n)=>(topic==="m3_rest"&&n===4)||!!(CAMPS[topic]&&CAMPS[topic].custom&&CAMPS[topic].packUnits.includes(n));
export const halfLenOf=(topic,n)=>isPackUnit(topic,n)?6:HALF_LEN;

// ---------- Aufgaben je Einheit ----------
// Rechenweg in der Erklärung: Teiler · Ergebnis = Produkt, Zahl − Produkt = Rest (zum Beispiel 5 · 3 = 15, 17 − 15 = 2).
const restTask=(a,b,pic)=>{
  const T=mk.rest(a,b),q=Math.floor(a/b),r=a%b;
  T.ex=r?`${b} · ${q} = ${b*q}, ${a} − ${b*q} = ${r}. Also ${a} : ${b} = ${q} Rest ${r}.`:`${b} · ${q} = ${a}, es bleibt nichts übrig. Also ${a} : ${b} = ${q} Rest 0.`;
  return T;
};
// Päckchen-Aufgabe mit dem Rechenweg in der Erklärung (die Aufgabe selbst bleibt, wie sie ist)
const withWay=T=>{const b=T.inv.y,q=T.a[0],r=T.a[1],a=b*q+r;
  return Object.assign(T,{ex:r?`${b} · ${q} = ${b*q}, ${a} − ${b*q} = ${r}. Also ${a} : ${b} = ${q} Rest ${r}.`:`${b} · ${q} = ${a}, es bleibt nichts übrig. Also ${a} : ${b} = ${q} Rest 0.`});};
// Einheit 1: Einmaleins rückwärts, Teilen ohne Rest, Teiler 2 bis 5
function warmTask(){
  const b=pickRow(2,5,2),q=R(2,10),a=b*q;
  if(Math.random()<.5){const T=mk.einmaleins(q,b,true);T.sig="w|"+a+"|"+b;
    T.hint="Denk an das Einmaleins rückwärts: Welche Zahl mal dem Teiler ergibt die große Zahl?";return T;}
  return{type:"num",q:`Wie oft passt die <mark>${b}</mark> in die <mark>${a}</mark>?`,a:q,inv:{op:"/",y:b},sig:"w|"+a+"|"+b,
    ex:`${b} · ${q} = ${a}, also passt die ${b} genau ${q} Mal in die ${a}.`,hint:"Zähle in Schritten der kleinen Zahl, bis du die große Zahl erreichst. Wie viele Schritte waren es?"};
}
// Einheit 2 und 3: Teilen mit Rest. maxB = größter Teiler, top = größter Dividend, pic = mit Ballbildern. Der Rest ist meist größer als 0.
function restUnitTask(maxB,top,pic){
  for(;;){
    const b=pickRow(2,maxB,2),q=R(1,Math.min(10,Math.floor(top/b))),r=Math.random()<.85?R(1,b-1):0,a=b*q+r;
    if(a>=b+1&&a<=top)return restTask(a,b,pic);
  }
}
// Einheit 5: Sachaufgaben mit Rest. Immer genau eine Frage, der Rest ist nie 0. Aufrunden oder Abrunden steht im Text.
const SACH=[
  // [Text, Frage, Antwort ist q+1 (Rest braucht Extra), Erklärung]
  (a,b)=>({q:`${a} Kinder fahren zum Spiel. In einen Bus passen ${b} Kinder. Wie viele Busse braucht man, damit alle mitfahren?`,up:true,unit:"Busse"}),
  (a,b)=>({q:`In einer Kabine ist Platz für ${b} Kinder. Es kommen ${a} Kinder. Wie viele Kabinen braucht man, damit alle eine haben?`,up:true,unit:"Kabinen"}),
  (a,b)=>({q:`Der Trainer packt ${a} Bälle in Netze. In ein Netz passen ${b} Bälle. Wie viele Netze werden ganz voll?`,up:false,unit:"Netze"}),
  (a,b)=>({q:`${a} Kinder bilden Mannschaften mit je ${b} Kindern. Wie viele volle Mannschaften gibt es?`,up:false,unit:"Mannschaften"}),
  (a,b)=>({q:`Es gibt ${a} Trinkflaschen für Kästen zu je ${b} Flaschen. Wie viele Kästen braucht man, damit keine Flasche stehen bleibt?`,up:true,unit:"Kästen"})
];
function sachTask(){
  const b=pickRow(3,9,2),q=R(2,Math.min(10,Math.floor(90/b)-1)),r=R(1,b-1),a=b*q+r,S=pick(SACH)(a,b),right=S.up?q+1:q;
  const way=`${a} : ${b} = ${q} Rest ${r}.`;
  return{type:"num",topic:"m3_sach",q:S.q,a:right,sig:"s|"+S.q,
    ex:S.up?`${b} · ${q} = ${b*q}, ${a} − ${b*q} = ${r}. ${way} Die ${r} übrigen brauchen auch einen Platz, also ${q+1}.`
      :`${b} · ${q} = ${b*q}, ${a} − ${b*q} = ${r}. ${way} Nur ${q} sind ganz voll, der Rest von ${r} zählt nicht mit.`,
    hint:"Rechne erst mit Rest. Überlege dann: Zählt der Rest noch mit, oder bleibt er übrig?"};
}
// Eine Aufgabe der Einheit n in Halbzeit half (1 oder 2).
export function campTask(topic,n,half){
  if(!CAMPS[topic])throw new Error("Unbekanntes Trainingslager: "+topic);
  if(CAMPS[topic].custom)return customTask(CAMPS[topic].def,n);
  if(CAMPS[topic].generic)return Object.assign({topic},GEN[topic]());
  let T;
  if(n===1)T=warmTask();
  else if(n===2)T=restUnitTask(5,50,half===1);
  else if(n===3)T=restUnitTask(9,90,false);
  else if(n===5)T=sachTask();
  else T=restUnitTask(9,60,false); // Einheit 4 nutzt Päckchen (campHalf), diese Zeile dient nur der Nachspielzeit
  return Object.assign({topic:"m3_rest"},T);
}
// Eine Halbzeit: 10 Aufgaben (Einheit 4: ein Päckchen mit 6 Aufgaben). seen enthält die schon benutzten Aufgaben der Einheit (keine Frage doppelt).
export function campHalf(topic,n,half,seen=new Set()){
  if(CAMPS[topic]&&CAMPS[topic].custom)return customHalf(CAMPS[topic].def,n,seen);
  if(isPackUnit(topic,n)){
    for(let tries=0;tries<30;tries++){
      const tasks=packOf("m3_rest",6).map(withWay);
      if(!tasks.some(T=>seen.has(keyOf(T)))){tasks.forEach(T=>seen.add(keyOf(T)));return tasks;}
    }
    const tasks=packOf("m3_rest",6).map(withWay);tasks.forEach(T=>seen.add(keyOf(T)));return tasks;
  }
  const out=[];
  for(let tries=0;out.length<HALF_LEN&&tries<400;tries++){
    const T=campTask(topic,n,half),k=keyOf(T);
    if(seen.has(k))continue;seen.add(k);out.push(T);
  }
  while(out.length<HALF_LEN)out.push(campTask(topic,n,half)); // sehr unwahrscheinlich: Fülltext, damit immer genug da sind
  return out;
}
// Nachspielzeit: 5 neue Aufgaben derselben Einheit (nie dieselben wie in den Halbzeiten).
export function penaltyTasks(topic,n,seen=new Set()){
  if(CAMPS[topic]&&CAMPS[topic].custom)return customPen(CAMPS[topic].def,n,seen);
  const out=[];
  for(let tries=0;out.length<PEN_LEN&&tries<400;tries++){
    const T=campTask(topic,n,2),k=keyOf(T);
    if(seen.has(k))continue;seen.add(k);out.push(T);
  }
  while(out.length<PEN_LEN)out.push(campTask(topic,n,2));
  return out;
}
// Eigene Trainingslager (Baukasten, ab 1.7.3) stehen als "c:<Vorlagen-Nr>" in CAMPS. Die Liste wird neu gebaut, wenn sich Vorlagen, eingefrorene Beschreibungen
// oder die Liga ändern. Hat das Konto schon eine Einheit gespielt, gilt seine eingefrorene Beschreibung (camps[...].def), sonst die aktuelle Vorlage.
let CUSTOM_SIG="";
export function syncCustomCamps(g,camps,li){
  const cur=new Map(allTemplates(g).map(t=>[campIdOf(t),defOf(t)])),ids=new Set(cur.keys()),cm=camps&&typeof camps==="object"?camps:{};
  for(const id of Object.keys(cm))if(isCustomId(id)&&cm[id]&&typeof cm[id].def==="object"&&cm[id].def)ids.add(id);
  const entries=[];
  for(const id of ids){
    const played=!!(cm[id]&&cm[id].units&&typeof cm[id].units==="object"&&Object.keys(cm[id].units).length);
    const def=played&&cm[id].def?normTemplate(cm[id].def):cur.get(id)||(cm[id]&&cm[id].def?normTemplate(cm[id].def):null);
    if(!def)continue;
    def.id=tplIdOfCamp(id);entries.push([id,def]);
  }
  const sig=JSON.stringify([li,entries]);
  if(sig===CUSTOM_SIG)return false;
  CUSTOM_SIG=sig;
  for(const k of Object.keys(CAMPS))if(CAMPS[k].custom)delete CAMPS[k];
  for(const [id,def] of entries)CAMPS[id]=buildCamp(def,li,id);
  return true;
}
// Alle Aufgaben einer Einheit auf einmal (zum Testen): zwei Halbzeiten und die Nachspielzeit, ohne Doppelte.
export function campUnit(topic,n){
  const seen=new Set(),h1=campHalf(topic,n,1,seen),h2=campHalf(topic,n,2,seen),pen=penaltyTasks(topic,n,seen);
  return{h1,h2,pen};
}

// ---------- Rückmeldung und Trainer-Sätze ----------
// Typischer Fehler beim Teilen mit Rest: der Rest ist so groß wie der Teiler oder größer. Freundliche Rückmeldung (nur im Trainingslager).
export function wrongNote(T,val){
  if(!T||T.type!=="pair"||!T.inv||T.inv.op!=="rest"||!Array.isArray(val))return "";
  const r=Number(val[1]),b=T.inv.y;
  if(Number.isFinite(r)&&r>=b)return `Da passt noch einer rein! Dein Rest ${r} ist so groß wie die ${b} oder größer. Der Rest muss immer kleiner als ${b} sein.`;
  return "";
}
// Zwischenstand in der Halbzeitpause: ein kurzer Satz vom Trainer je nach Ergebnis (c richtig von n)
export function halftimeSay(c,n){
  const p=n?c/n:0;
  if(c===n)return "Alles drin! Genau so weiter in der zweiten Halbzeit.";
  if(p>=.6)return "Starke erste Halbzeit! Trink einen Schluck und dann geht es weiter.";
  if(p>=.4)return "Ganz ordentlich. In der zweiten Halbzeit holst du noch mehr heraus.";
  return "Das war eine Aufwärmrunde. Jetzt kommst du erst richtig ins Spiel!";
}
export function finalSay(c,n){
  const p=n?c/n:0;
  if(c===n)return "Perfekt! Kein einziger Fehlschuss.";
  if(p>=.6)return "Stark gespielt! Das war ein Sieg.";
  return "Du bist drangeblieben, das zählt. Beim nächsten Mal klappt mehr.";
}
// Nachspielzeit: Ergebnis wie "4 : 1"
export const penaltyScore=(goals,n)=>`${goals} : ${n-goals}`;

// ---------- Sichern und Fortsetzen (nur auf dem Gerät, nicht im Spielstand) ----------
// G ist das laufende Spiel der App (Halbzeit oder Nachspielzeit). Gesichert wird so, dass das Fortsetzen an der nächsten offenen Stelle beginnt:
// Eine schon beantwortete Aufgabe zählt als erledigt (die Antwort steht im Lernstand). Ohne eine Antwort gibt es nichts zu sichern (null).
const answered=G=>G.pack?(Array.isArray(G.ans)&&G.ans.some(a=>a!==undefined&&a!==null)):(Array.isArray(G.res)&&G.res.length>0);
export function campSnapshot(G,now=Date.now()){
  if(!G||!G.camp||!Array.isArray(G.tasks))return null;
  const C=G.camp;
  if(!C.brk&&!C.rec&&!C.halves.length&&!G.penDone&&!answered(G))return null;
  if(G.penDone||C.final)return null; // abgeschlossen und gezählt: nichts mehr zu sichern
  const snap={v:1,t:now,li:G.li,topic:C.topic,unit:C.unit,half:C.half,halves:C.halves,rec:!!C.rec,brk:!!C.brk,pen:!!G.pen,pack:!!G.pack,sets:C.sets,rival:G.rival,
    tasks:G.tasks,i:G.pack?(G.phase==="solve"?G.i:0):(G.done?G.i+1:G.i),res:G.res||[],hist:G.hist||[],pts:G.pts||0,streak:G.streak||0,el:Math.max(0,now-(G.t0||now))};
  if(G.pack){Object.assign(snap,{phase:G.phase==="solve"?"solve":"check",ans:G.ans,finals:G.finals,helps:G.helps||[],probeOpen:G.probeOpen||{},probed:G.probed||{}});}
  return JSON.parse(JSON.stringify(snap));
}
// Kann dieses gesicherte Spiel noch gespielt werden? Prüft Form und Inhalt (kaputte oder fremde Sicherungen werden verworfen).
export function campResumable(snap){
  if(!snap||typeof snap!=="object"||snap.v!==1)return false;
  const c=CAMPS[snap.topic];
  if(!c||!Number.isInteger(snap.li)||!Number.isInteger(snap.unit)||snap.unit<1||snap.unit>c.units.length)return false;
  if(snap.half!==1&&snap.half!==2)return false;
  if(!Array.isArray(snap.halves))return false;
  if(!snap.pen&&snap.halves.length!==(snap.half===2?1:(snap.rec||snap.brk?1:0)))return false;
  if(!Array.isArray(snap.tasks)||snap.tasks.length<1||!snap.tasks.every(T=>T&&typeof T==="object"&&typeof T.type==="string"&&typeof T.q==="string"))return false;
  if(!snap.sets||typeof snap.sets!=="object"||!Array.isArray(snap.sets.h2)||!Array.isArray(snap.sets.pen))return false;
  if(!Array.isArray(snap.res)||!Array.isArray(snap.hist))return false;
  if(snap.pack){
    if(!Array.isArray(snap.ans)||!Array.isArray(snap.finals))return false;
    if(snap.phase==="solve"&&!(Number.isInteger(snap.i)&&snap.i>=0&&snap.i<snap.tasks.length))return false;
    if(snap.phase==="check"&&snap.tasks.some((_,k)=>snap.finals[k]===undefined||snap.finals[k]===null))return false;
    if(snap.phase!=="solve"&&snap.phase!=="check")return false;
  }else if(!snap.brk&&!snap.rec&&!(Number.isInteger(snap.i)&&snap.i>=0&&snap.i<=snap.tasks.length))return false;
  return true;
}
// Zustand G für ein fortgesetztes Spiel (die App ergänzt Gegner, Zeitpunkt und die aktuelle Aufgabe).
export function campResume(snap){
  const C={topic:snap.topic,unit:snap.unit,half:snap.half,halves:snap.halves.slice(),rec:!!snap.rec,brk:!!snap.brk,sets:snap.sets};
  const G={li:snap.li,mode:snap.pen?"pen":"camp",pen:!!snap.pen,camp:C,trial:false,pack:!!snap.pack,topic:snap.topic,pool:[snap.topic],tasks:snap.tasks,len:snap.tasks.length,
    rival:snap.rival,i:snap.i,res:snap.res.slice(),hist:snap.hist.slice(),pts:snap.pts||0,streak:snap.streak||0,last:null,seen:null,ei:0,
    t0:Date.now()-(snap.el||0)};
  if(snap.pack)Object.assign(G,{phase:snap.phase,ans:snap.ans.slice(),finals:snap.finals.slice(),helps:(snap.helps||[]).slice(),probeOpen:Object.assign({},snap.probeOpen),probed:Object.assign({},snap.probed),i:snap.phase==="solve"?snap.i:0});
  return G;
}
