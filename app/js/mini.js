// Mini-Spiele (ab 1.6.3): kurze Spiele zwischendurch mit je 5 Aufgaben aus dem Mix. Reine Funktionen, kein DOM.
// Ein Mini-Spiel zählt wie das Elfmeterschießen: die Antworten gehen in den Lernstand, es gibt Punkte, aber kein Spiel, keinen Sieg, keinen Sticker
// und kein Probetraining-Budget. Die Aufgaben kommen aus den vorhandenen Generatoren.
import {GEN} from "./generators.js";
import {isRight,keyOf} from "./check.js";
import {poolOf} from "./content.js";
import {activeTopics,nextTopic,currentLeague} from "./rules.js";

export const MINI_LEN=5;
export const MINI={
  wall:{id:"wall",name:"Torwand",text:"Schieße auf das Loch mit der richtigen Antwort."},
  memory:{id:"memory",name:"Memory",text:"Finde zu jeder Aufgabe das passende Ergebnis."},
  dribble:{id:"dribble",name:"Dribbel-Parcours",text:"Jede richtige Antwort bringt dich an einem Hindernis vorbei."}
};
export const DRIBBLE_STATIONS=5; // Hindernisse im Parcours
export const DRIBBLE_TRIES=12;   // so viele Aufgaben gibt es höchstens, dann ist Schluss
export const MEM_PAIRS=5; // Kartenpaare im Memory
export const MINI_IDS=Object.keys(MINI);

const mixed=(a,rnd)=>a.map(x=>[rnd(),x]).sort((p,q)=>p[0]-q[0]).map(p=>p[1]);

// Antworten als Löcher (Torwand): für Zahlenaufgaben die richtige Zahl und drei ähnliche, für Auswahlaufgaben die vorhandenen Antworten (höchstens vier).
// Gibt {opts:[{val,label}], right} zurück, oder null, wenn die Aufgabe nicht dafür taugt.
export function wallOptions(T,rnd=Math.random){
  if(!T)return null;
  if(T.type==="num"&&Number.isInteger(T.a)){
    const a=T.a,near=[a+1,a-1,a+10,a-10,a+2,a-2,a+5,a-5,a+100,a-100,a*2,Math.round(a/2)];
    const cand=[...new Set(near.filter(x=>Number.isInteger(x)&&x>=0&&x!==a))];
    if(cand.length<3)return null;
    const vals=mixed([a].concat(mixed(cand,rnd).slice(0,3)),rnd);
    return{opts:vals.map(v=>({val:v,label:String(v)})),right:vals.indexOf(a)};
  }
  if(T.type==="choice"&&Array.isArray(T.choices)&&T.choices.includes(T.a)){
    const wrong=mixed(T.choices.filter(c=>c!==T.a),rnd).slice(0,3);
    if(!wrong.length)return null;
    const vals=mixed([T.a].concat(wrong),rnd);
    return{opts:vals.map(v=>({val:v,label:String(v)})),right:vals.indexOf(T.a)};
  }
  return null;
}
// Aufgaben für ein Mini-Spiel aus den aktiven Themen des Mixes der Liga. Keine Frage doppelt. Leer, wenn kein Thema an ist.
export function miniTasks(s,li,n=MINI_LEN,rnd=Math.random,make=wallOptions){
  const pool=activeTopics(s,poolOf(li,"mix"));
  const out=[],seen=new Set();let last=null;
  if(!pool.length)return out;
  for(let tries=0;out.length<n&&tries<400;tries++){
    const t=nextTopic(s,pool,last,rnd);last=t;
    const T=Object.assign({topic:t},GEN[t]()),k=keyOf(T),qk="q|"+String(T.q).replace(/<[^>]+>/g,"");
    if(seen.has(k)||seen.has(qk))continue; // weder dieselbe Aufgabe noch dieselbe Frage zweimal
    const w=make(T,rnd);if(!w)continue;
    seen.add(k);seen.add(qk);out.push(Object.assign({T},w));
  }
  return out;
}
// Memory: Aufgabe und Ergebnis als Kartenpaar. Taugt nur eine kurze Rechenaufgabe "a · b = ?" mit ganzer Zahl als Ergebnis.
const plain=q=>String(q).replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
export function memoryPair(T){
  if(!T||T.type!=="num"||!Number.isInteger(T.a)||T.vis)return null;
  const m=/^(.{1,16}?)\s*=\s*\?$/.exec(plain(T.q));
  return m?{front:m[1].trim(),back:String(T.a)}:null;
}
function newMemory(s,rnd){
  const li=currentLeague(s),found=miniTasks(s,li,16,rnd,memoryPair),items=[],fronts=new Set(),backs=new Set();
  for(const it of found){
    if(fronts.has(it.front)||backs.has(it.back))continue; // jedes Ergebnis und jede Aufgabe nur einmal, sonst wäre ein Paar nicht eindeutig
    fronts.add(it.front);backs.add(it.back);items.push(it);
    if(items.length===MEM_PAIRS)break;
  }
  if(items.length<MEM_PAIRS)return null;
  const cards=[];items.forEach((it,k)=>{cards.push({k,side:"q",text:it.front});cards.push({k,side:"a",text:it.back});});
  return{kind:"memory",li,items,cards:mixed(cards,rnd),open:[],found:[],tries:0,pts:0};
}
// Karte idx umdrehen. Zwei offene Karten, die nicht passen, bleiben liegen, bis die nächste Karte angetippt wird.
// Gibt {event: "open" | "pair" | "miss" | "done" | "none"} zurück. Memory zählt nicht im Lernstand: beim Raten wären fast alle ersten Versuche falsch.
export function memoryFlip(M,idx){
  if(!M||M.kind!=="memory"||miniOver(M))return null;
  if(M.open.length===2)M.open=[];
  const c=M.cards[idx];
  if(!c||M.found.includes(c.k)||M.open.includes(idx))return{event:"none"};
  M.open.push(idx);
  if(M.open.length<2)return{event:"open"};
  M.tries++;
  const a=M.cards[M.open[0]],b=M.cards[M.open[1]];
  if(a.k===b.k&&a.side!==b.side){M.found.push(a.k);M.pts+=10;M.open=[];return{event:miniOver(M)?"done":"pair"};}
  return{event:"miss"};
}
// Neues Mini-Spiel. null, wenn die Art unbekannt ist oder keine passenden Aufgaben da sind.
export function newMini(kind,s,rnd=Math.random){
  if(!MINI[kind])return null;
  if(kind==="memory")return newMemory(s,rnd);
  if(kind==="dribble"){
    const li=currentLeague(s),items=miniTasks(s,li,DRIBBLE_TRIES,rnd);
    if(items.length<DRIBBLE_STATIONS)return null;
    return{kind,li,items,i:0,res:[],pts:0,streak:0,done:false,pick:-1,ok:false,gain:0,shot:null,pos:0,stations:DRIBBLE_STATIONS,lost:0,fin:false,bonusPaid:false};
  }
  const li=currentLeague(s),items=miniTasks(s,li,MINI_LEN,rnd);
  if(items.length<MINI_LEN)return null;
  return{kind,li,items,i:0,res:[],pts:0,streak:0,done:false,pick:-1,ok:false,gain:0,shot:null};
}
// Antwort im Mini-Spiel: Loch idx. Verändert M und gibt {topic, ok, gain, val, T} zurück (für den Lernstand), oder null, wenn schon beantwortet.
export function miniAnswer(M,idx,shot=null){
  if(!M||M.done||idx<0)return null;
  const it=M.items[M.i];if(!it||idx>=it.opts.length)return null;
  const val=it.opts[idx].val,ok=isRight(it.T,val);
  M.done=true;M.pick=idx;M.ok=ok;M.shot=shot;M.res.push(ok);
  if(ok){M.streak++;M.gain=10+(M.streak>=3?5:0);M.pts+=M.gain;}else{M.streak=0;M.gain=0;}
  if(M.kind==="dribble"){if(ok)M.pos++;else M.lost++;} // Dribbel-Parcours: richtig = ein Hindernis weiter, falsch = Ball verloren, neue Aufgabe
  return{topic:it.T.topic,ok,gain:M.gain,val,T:it.T};
}
// Nächste Aufgabe. Gibt true zurück, wenn das Spiel zu Ende ist.
export function miniNext(M){
  if(!M||!M.done)return false;
  M.i++;M.done=false;M.pick=-1;M.ok=false;M.gain=0;M.shot=null;
  if(M.kind==="dribble"){M.fin=M.pos>=M.stations||M.i>=M.items.length;return M.fin;}
  return M.i>=M.items.length;
}
// Dribbel-Parcours: Bonus fürs Tor am Ende (10, ohne verlorenen Ball 20). Gibt die Punkte einmal zurück, danach 0.
export function miniBonus(M){
  if(!M||M.kind!=="dribble"||!M.fin||M.bonusPaid||M.pos<M.stations)return 0;
  M.bonusPaid=true;const b=M.lost===0?20:10;M.pts+=b;return b;
}
export const miniOver=M=>!!M&&(M.kind==="memory"?M.found.length>=M.items.length:M.kind==="dribble"?M.fin:M.i>=M.items.length);
export const miniGoals=M=>M.res.filter(Boolean).length;
export const miniScore=M=>`${miniGoals(M)} : ${M.res.length-miniGoals(M)}`;
