// Päckchen und Kontroll-Pfiff: zusammenhängende Aufgaben im Stil eines Arbeitsblatts (gleicher Teiler, wachsender Dividend)
// und die Probe zu jeder Aufgabe (Umkehraufgabe, Tauschaufgabe oder Rechtschreibstrategie). Reine Funktionen, kein DOM.
// Die Probe verrät die Lösung nie: Sie rechnet mit der Antwort des Kindes oder nennt nur die Strategie.
import {GEN,mk} from "./generators.js";
import {R,pick,esc} from "./util.js";
import {BONUS_FIX,ENG_IDS,SU_IDS} from "./content.js";

export const PACK_MIN=3,PACK_MAX=6,DEFAULT_PACK=5;
// Länge des Päckchens je Thema (3 bis 6). Teilen mit Rest ist das längste, wie auf dem Blatt wächst der Dividend.
export const PACK_N=Object.assign({m3_rest:6,m3_1x1:5,m3_plus:4,m4_mult:4,m4_div:4},
  Object.fromEntries([...ENG_IDS,...SU_IDS].map(t=>[t,4]))); // Englisch und Sachkunde: Zuordnen und Sortieren brauchen mehr Zeit
export const packLen=t=>PACK_N[t]||DEFAULT_PACK;

// ---------- Päckchen ----------
const PACKS={
  // gleicher Teiler, der Dividend steigt, der Rest wächst oder springt auf 0 (32:8, 33:8, 35:8 ...)
  m3_rest(n){const b=R(3,9);let a=b*R(2,4)+R(0,b-1);const out=[];
    for(let i=0;i<n;i++){out.push(mk.rest(a,b));a+=pick([1,1,2,2,3]);}
    return out;},
  // gleiche Reihe, die andere Zahl steigt (3·6, 4·6, 5·6 oder 18:6, 24:6, 30:6)
  m3_1x1(n){const b=R(2,10),div=Math.random()<.4,a0=R(2,11-n),out=[];
    for(let i=0;i<n;i++)out.push(mk.einmaleins(a0+i,b,div));
    return out;},
  // gleiche Zahl dazu oder weg, die erste Zahl steigt in Zehner- oder Hunderterschritten
  m3_plus(n){const minus=Math.random()<.5,step=pick([10,100]),b=step===10?R(2,8)*10:R(1,3)*100,out=[];
    let a=minus?b+R(0,5)*10:R(1,3)*100+R(0,9)*10;
    for(let i=0;i<n;i++){out.push(mk.plus(a,b,minus));a+=step;}
    return out;},
  // gleicher Faktor, die andere Zahl steigt in Zehnerschritten
  m4_mult(n){const b=R(3,9),a0=R(12,99-10*(n-1)),out=[];
    for(let i=0;i<n;i++)out.push(mk.mult(a0+10*i,b));
    return out;},
  // gleicher Teiler, das Ergebnis steigt um 1
  m4_div(n){const b=R(2,9),q0=R(11,40-(n-1)),out=[];
    for(let i=0;i<n;i++)out.push(mk.div(b,q0+i));
    return out;}
};
// Doppelte Aufgaben: mit sig (Englisch, Sachkunde) zählt der Inhalt, nicht die Reihenfolge der Anzeige.
export const keyOf=T=>T.sig?(T.topic||"")+"|"+T.sig:[T.q,T.choices?[...T.choices].sort().join(","):"",T.words?T.words.join(" "):"",String(T.a)].join("|");
// Standard: n verschiedene Aufgaben desselben Themas hintereinander. opts: {level} (Englisch-Stufe).
function independent(t,n,opts){
  const seen=new Set(),out=[];
  for(let tries=0;out.length<n&&tries<200;tries++){const T=GEN[t](opts),k=keyOf(T);if(seen.has(k))continue;seen.add(k);out.push(T);}
  while(out.length<n)out.push(GEN[t](opts));
  return out;
}
export function packOf(topic,n=packLen(topic),opts){
  n=Math.max(PACK_MIN,Math.min(PACK_MAX,n|0));
  const make=PACKS[topic];
  return (make?make(n):independent(topic,n,opts)).map(T=>Object.assign({topic},T));
}

// ---------- Probe ----------
// [Name der Strategie, Text]. Keine Lösungswörter: die Auswahlwörter der Aufgabe stehen nicht drin.
const STRAT={
  m_read:["Nachzählen","Zähle noch einmal: Jede Stange ist zehn wert. Schreibe erst die Zehner, dann die Einer dazu. Passt deine Zahl zum Bild?"],
  m_split:["Zahl zerlegen","Schreibe die Zahl als Zehner und Einer auf. Setze dann deine Antwort ein. Passt sie?"],
  m_plaet:["Plättchen prüfen","Schau, in welcher Spalte das Plättchen läge. Ein Plättchen bei Z ändert die Zahl um zehn, eins bei E um eins. Stimmt deine Zahl?"],
  m3_htz:["Zahl zerlegen","Zerlege die Zahl in Hunderter, Zehner und Einer. Setze deine Antwort ein. Passt sie?"],
  m3_sach:["Rückrechnen","Lies die Aufgabe noch einmal. Rechne zurück: Teiler mal Ergebnis plus Rest. Kommt die Zahl aus dem Text heraus? Passt deine Antwort zur Frage?"],
  m4_stelle:["Stellen zählen","Zähle die Stellen von rechts: Einer, Zehner, Hunderter, Tausender, Zehntausender. Schau noch einmal genau auf diese Stelle."],
  m4_runden:["Nachbarziffer","Schau auf die Ziffer rechts neben der Stelle, auf die du runden sollst. Null bis vier runden ab, fünf bis neun runden auf."],
  d_wortart:["Artikelprobe","Sage der, die oder das davor. Probiere dann ich oder er davor. Probiere zuletzt: der ___ Ball. Was passt zu deinem Wort?"],
  d_satz:["Satzmelodie","Lies beide Sätze laut. Wo geht deine Stimme nach unten? Setzt du genau dort den Punkt?"],
  d3_praet:["Laut sprechen","Sprich den Satz laut mit deiner Antwort: Gestern ... Klingt es richtig, wie man es sagt?"],
  d3_fam:["Ableiten","Suche den Wortstamm. Hat jedes Wort etwas mit derselben Sache zu tun? Welches Wort klingt nur ähnlich?"],
  d3_ie:["Laut sprechen","Sprich das Wort langsam. Ist der Laut lang oder kurz? Probiere deine Schreibweise laut."],
  d3_doppel:["Ableiten","Klatsche die Silben. Klingt der Selbstlaut vor dem Mitlaut kurz, folgen oft zwei gleiche Mitlaute. Hilft ein verwandtes Wort?"],
  d3_satzglied:["Frageprobe","Frage: Wer oder was tut etwas? Was tut jemand? Probiere die Fragen mit dem Wort, das du getippt hast."],
  d4_perfekt:["Laut sprechen","Sprich: Gestern habe ich ... oder bin ich ...? Klingt deine Form mit ge... richtig?"],
  d4_rede:["Bausteine prüfen","Hake ab: Begleitsatz, Doppelpunkt, Anführungszeichen, Großbuchstabe am Anfang, Satzzeichen am Ende. Hat dein Satz alles?"],
  d4_steigern:["Reihe sprechen","Sprich die Reihe laut, zum Beispiel warm, wärmer, am wärmsten. Klingt deine Form genauso?"]
};
const FALLBACK=["Nochmal prüfen","Rechne oder prüfe noch einmal auf einem anderen Weg. Passt deine Antwort zur Aufgabe?"];
const ask="Kommt die erste Zahl der Aufgabe heraus?";
const num=v=>{const n=Number(v);return Number.isFinite(n)?n:0;};

// Probe für die Antwort `given` (Zahl, Zahlenpaar oder Text). Gibt {name, html} zurück.
export function probeOf(T,given){
  const inv=T.inv;
  if(T.probe)return T.probe; // Englisch und Sachkunde: Probe je Aufgabenart, zeigt nie die Lösung
  if(T.probeText)return{name:"Tauschaufgabe",html:T.probeText};
  if(inv){
    const y=inv.y;
    if(inv.op==="rest"){const g=Array.isArray(given)?given:[0,0];
      return{name:"Umkehraufgabe",html:`Rechne zurück: ${y} · ${num(g[0])} + ${num(g[1])} = ?<br>${ask} Ist dein Rest kleiner als ${y}?`};}
    const g=num(given);
    if(inv.op==="*")return{name:"Umkehraufgabe",html:`Teile zurück: ${g} : ${y} = ?<br>${ask}`};
    if(inv.op==="/")return{name:"Umkehraufgabe",html:`Male zurück: ${g} · ${y} = ?<br>${ask}`};
    if(inv.op==="+")return{name:"Gegenaufgabe",html:`Rechne zurück: ${g} − ${y} = ?<br>${ask}`};
    if(inv.op==="-")return{name:"Gegenaufgabe",html:`Rechne zurück: ${g} + ${y} = ?<br>${ask}`};
  }
  if(T.topic==="d_verl")return{name:"Verlängern",html:`Mach das Wort länger, zum Beispiel mit der Mehrzahl. Sprich es mit deinem Buchstaben „${esc(given)}“. Klingt es richtig?`};
  const [name,text]=STRAT[T.topic]||FALLBACK;
  return{name,html:text};
}
export const probeHTML=(T,given)=>{const p=probeOf(T,given);return `<b>${esc(p.name)}:</b> ${p.html}`;};

// ---------- Auswertung des Kontroll-Pfiffs ----------
// answers: erste Antworten, finals: Antworten nach der Kontrolle, tasks: die Aufgaben, checked: Kontrolle abgeschlossen.
// Bonus nur für eine Aufgabe, die zuerst falsch war und nach der Kontrolle richtig ist. Sonst zählt die Endantwort normal.
const sameList=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((x,i)=>x===b[i]);
export function isRight(T,val){
  if(val===null||val===undefined||val==="")return false;
  if(T.type==="match"||T.type==="sort"||T.type==="order")return sameList(val,T.a);
  if(T.type==="num")return Number(val)===T.a;
  if(T.type==="pair")return Array.isArray(val)&&Number(val[0])===T.a[0]&&Number(val[1])===T.a[1];
  return val===T.a;
}
export function gradePack({tasks,answers,finals,checked}){
  const items=tasks.map((T,i)=>{
    const first=isRight(T,answers[i]),last=isRight(T,finals[i]);
    return{ok:last,fixed:!!checked&&!first&&last,changed:JSON.stringify(answers[i])!==JSON.stringify(finals[i])};
  });
  const fixed=items.filter(x=>x.fixed).length;
  return{items,fixed,bonus:fixed*BONUS_FIX};
}

// Begriffe einer beantworteten Aufgabe für die Statistik je Begriff: [{id, ok}]. Zuordnen und Sortieren je Begriff, sonst der Begriff der Aufgabe.
export function termResults(T,val){
  if(T.type==="match"||T.type==="sort"){
    const ids=T.terms||[];
    return ids.map((id,i)=>({id,ok:Array.isArray(val)&&val[i]===T.a[i]}));
  }
  if(T.term)return[{id:T.term,ok:isRight(T,val)}];
  return[];
}
// Antwort als Text für die Übersicht des Kontroll-Pfiffs
export function givenText(T,val){
  if(val===null||val===undefined||val==="")return "-";
  if(T.type==="match")return Array.isArray(val)?T.left.map((l,i)=>`${l.k==="txt"?l.t:"Bild"} = ${val[i]>=0&&T.right[val[i]]?T.right[val[i]].t:"?"}`).join("; "):"-";
  if(T.type==="sort")return Array.isArray(val)?T.cards.map((c,i)=>`${c.t}: ${val[i]>=0&&T.baskets[val[i]]?T.baskets[val[i]].t:"?"}`).join("; "):"-";
  if(T.type==="order")return Array.isArray(val)?val.map(i=>T.cards[i]?T.cards[i].t:"?").join(" → "):"-";
  if(T.type==="pic")return T.tiles[val]?(T.tiles[val].k==="dir"?T.tiles[val].name:T.tiles[val].k==="col"||T.tiles[val].k==="num"||T.tiles[val].k==="emo"?(T.tiles[val].name||T.tiles[val].t):T.tiles[val].t):"-";
  if(T.type==="pair")return Array.isArray(val)?`${val[0]} Rest ${val[1]}`:"-";
  if(T.type==="tap")return T.words[val]!==undefined?T.words[val]:"-";
  return String(val);
}
