// Aufgaben für Englisch und Sachkunde aus den Datendateien (content-en.js, content-su.js).
// Neue Aufgabenarten: match (Zuordnen in zwei Spalten), pic (Bild wählen), sort (Sortieren in Körbe), order (Reihenfolge).
// Jede Aufgabe trägt: type, q, ex, hint, sig (Kennung für Doppelte), terms (Begriffe für die Statistik) und probe (Probe ohne Lösung).
// Antworten: match = je linkem Begriff die Nummer rechts (oder -1), pic = Nummer der Kachel, sort = je Karte die Nummer des Korbs,
// order = Kartennummern in der Reihenfolge, wie sie angetippt wurden.
import {R,pick,shuffle} from "./util.js";
import {EN_TOPICS} from "./content-en.js";
import {SU_TOPICS} from "./content-su.js";
import {canSpeak} from "./speech.js";

// ---------- Bilder ----------
// Eine Kachel: {t, k}. k: emo (Emoji), col (Farbkasten), num (große Ziffer), txt (Text).
export function tileOf(pic){
  if(/^#\d{1,2}$/.test(pic))return{t:pic.slice(1),k:"num"}; // "#7" = Ziffer, "#e53935" (sechs Zeichen) = Farbkasten
  if(pic[0]==="#")return{t:pic,k:"col"};
  return{t:pic,k:"emo"};
}
export function tileHTML(it,big){
  const c=big?" big":"";
  if(it.k==="col")return `<span class="tile col${c}" style="background:${it.t}" role="img" aria-label="Farbe"></span>`;
  if(it.k==="num")return `<span class="tile num${c}">${it.t}</span>`;
  if(it.k==="emo")return `<span class="tile emo${c}" aria-hidden="true">${it.t}</span>`;
  return `<span class="tile txt${c}">${it.t}</span>`;
}

const probe=(name,html)=>({name,html});
const PROBE_PAIR=probe("Paare prüfen","Schau dir jedes Paar noch einmal an. Passt jeder Begriff wirklich zu seinem Partner?");
const PROBE_ORDER=probe("Reihenfolge prüfen","Lies deine Reihenfolge von oben nach unten. Passt jeder Schritt zum nächsten?");
const PROBE_PIC=probe("Bild prüfen","Schau das Bild noch einmal genau an. Passt es wirklich zur Aufgabe?");
const cut=t=>String(t).slice(0,40);

// ---------- Bausteine für alle Aufgabenarten ----------
// Zuordnen: left/right sind Listen von {t,k}. pairs[i] = Nummer rechts zu links i.
export function makeMatch({q,left,right,a,ex,hint,sig,terms,topic,level}){
  return{type:"match",q,left,right,a,ex,hint,sig,terms,probe:PROBE_PAIR,topic,level};
}
// Bild wählen: tiles sind {t,k,name}; a = Nummer der richtigen Kachel.
export function makePic(o){return Object.assign({type:"pic",probe:PROBE_PIC},o);}
export function makeSort({q,baskets,cards,a,ex,hint,sig,terms}){return{type:"sort",q,baskets,cards,a,ex,hint,sig,terms,probe:PROBE_PAIR};}
export function makeOrder({q,cards,a,ex,hint,sig}){return{type:"order",q,cards,a,ex,hint,sig,probe:PROBE_ORDER};}

// Mischt so, dass die Reihenfolge nicht zufällig schon stimmt (wenn es mehr als eine Möglichkeit gibt).
function mixed(n,notIdentity=true){
  const idx=[...Array(n).keys()];
  for(let t=0;t<30;t++){const m=shuffle(idx);if(!notIdentity||n<2||m.some((v,i)=>v!==i))return m;}
  return idx.slice().reverse();
}

// ---------- Englisch ----------
const ENHINT={
  1:"Schau dir jedes Bild genau an. Sprich das englische Wort leise vor dich hin. Was kennst du schon?",
  2:"Fang mit dem Paar an, das du am besten kennst. Die übrigen Wörter werden dann weniger.",
  3:"Schau auf das Bild und sprich das Wort in Silben. Achte auf jeden einzelnen Buchstaben."};
const LISTEN_HINT="Tippe auf die Taste und höre noch einmal hin. Welches Bild passt zu dem Klang?";

function picTiles(words,w,n){
  const others=shuffle(words.filter(x=>x!==w&&x[2]!==w[2])).slice(0,n-1);
  const list=shuffle([w].concat(others));
  return{tiles:list.map(x=>Object.assign(tileOf(x[2]),{name:x[0]})),a:list.indexOf(w)};
}
function engTask(topic,opts={}){
  const words=EN_TOPICS[topic].words,level=opts.level||pick([1,2,3]);
  // Hör-Aufgabe (nur mit englischer Stimme): Wort hören, Bild antippen
  if(opts.listen!==false&&canSpeak()&&Math.random()<.2){
    const w=pick(words),{tiles,a}=picTiles(words,w,pick([3,4]));
    return makePic({level,q:"Hör gut zu. Tippe auf das Bild, das zum Wort passt.",listen:true,say:w[0],tiles,a,term:cut(w[0]),terms:[cut(w[0])],
      ex:`Du hast <b>${w[0]}</b> gehört. Das heißt ${w[1]}.`,hint:LISTEN_HINT,sig:"w|"+w[0]});
  }
  if(level===2){
    const n=Math.min(words.length,pick([4,5])),ws=shuffle(words).slice(0,n),order=mixed(n),
      left=ws.map(w=>({t:w[0],k:"txt",say:w[0]})),right=order.map(i=>({t:ws[i][1],k:"txt"})),a=ws.map((_,i)=>order.indexOf(i));
    return makeMatch({q:"Ordne zu: Welches englische Wort passt zu welchem deutschen Wort?",left,right,a,topic,level,
      ex:"Richtig: "+ws.map(w=>`${w[0]} = ${w[1]}`).join(", ")+".",hint:ENHINT[2],sig:ws.map(w=>w[0]).sort().join("|"),terms:ws.map(w=>cut(w[0]))});
  }
  const w=pick(words);
  if(level===3){
    const choices=[w[0],w[3],w[4]],tile=tileOf(w[2]);
    return{type:"choice",level,q:"Wie schreibt man das Wort zum Bild richtig?",vis:tileHTML(tile,true),choices,a:w[0],term:cut(w[0]),terms:[cut(w[0])],
      ex:`Das Wort heißt <b>${w[0]}</b> (${w[1]}).`,hint:ENHINT[3],sig:"w|"+w[0],
      probe:probe("Schreibweise prüfen","Sprich das Wort langsam in Silben. Vergleiche jeden Buchstaben mit dem Bild. Stimmt die Schreibweise?")};
  }
  const {tiles,a}=picTiles(words,w,pick([3,4]));
  return makePic({level,q:`Welches Bild passt zu <b>${w[0]}</b>?`,speak:w[0],tiles,a,term:cut(w[0]),terms:[cut(w[0])],
    ex:`<b>${w[0]}</b> heißt auf Deutsch ${w[1]}.`,hint:ENHINT[1],sig:"w|"+w[0]});
}

// ---------- Sachkunde ----------
const itemOf=(t,k)=>({t,k:k==="col"||k==="emo"?k:"txt"});
function suMatch(d,topic){
  const n=Math.min(d.pairs.length,R(d.n[0],d.n[1])),ps=shuffle(d.pairs).slice(0,n),order=mixed(n,n>1);
  return makeMatch({q:d.q,left:ps.map(p=>itemOf(p[0],d.lk)),right:order.map(i=>({t:ps[i][1],k:"txt"})),a:ps.map((_,i)=>order.indexOf(i)),topic,
    ex:d.ex,hint:d.hint,sig:ps.map(p=>p[0]).sort().join("|"),terms:ps.map(p=>cut(p[0]))});
}
function suSort(d){
  const nb=d.baskets.length,count=Math.min(d.cards.length,R(d.n[0],d.n[1])),chosen=[];
  const byB=b=>shuffle(d.cards.filter(c=>c[1]===b));
  const need=d.need||[];
  for(let b=0;b<nb;b++){const l=byB(b);if(l.length)chosen.push(l[0]);}
  for(const b of need){const l=byB(b).filter(c=>!chosen.includes(c));if(!chosen.some(c=>c[1]===b)&&l.length)chosen.push(l[0]);}
  for(const c of shuffle(d.cards)){if(chosen.length>=count)break;if(!chosen.includes(c))chosen.push(c);}
  const cards=shuffle(chosen);
  return makeSort({q:d.q,baskets:d.baskets.map(t=>({t})),cards:cards.map(c=>({t:c[0],k:"txt"})),a:cards.map(c=>c[1]),ex:d.ex,hint:d.hint,
    sig:cards.map(c=>c[0]).sort().join("|"),terms:cards.map(c=>cut(c[0]))});
}
function suOrder(d){
  const len=Math.min(d.steps.length,R(d.win[0],d.win[1])),start=R(0,d.steps.length-len),sub=d.steps.slice(start,start+len),order=mixed(len);
  const cards=order.map(i=>({t:sub[i],k:"txt"}));
  return makeOrder({q:d.q,cards,a:sub.map((_,p)=>order.indexOf(p)),ex:d.ex,hint:d.hint,sig:sub.join("|")});
}
function suChoice(d){
  return{type:"choice",q:d.q,choices:[d.right].concat(d.wrong.slice(0,3)),a:d.right,ex:d.ex,hint:d.hint,sig:d.q,
    probe:probe("Nochmal prüfen","Lies die Frage noch einmal. Streiche in Gedanken die Antworten durch, die sicher nicht passen. Was bleibt?")};
}
function suPic(d){
  const order=mixed(d.tiles.length,false),tiles=order.map(i=>({t:d.tiles[i][0],k:"emo",name:d.tiles[i][1]}));
  return makePic({q:d.q,tiles,a:order.indexOf(d.right),ex:d.ex,hint:d.hint,sig:d.q+"|"+d.tiles[d.right][1]});
}
// Kompassrose: Norden ist mit N beschriftet, die Kinder tippen die gefragte Richtung an.
export const DIRS=["Norden","Osten","Süden","Westen"];
function suCompass(d){
  const ask=R(1,3);
  const tiles=DIRS.map((n,i)=>({t:i===0?"N":"",k:"dir",name:n,pos:["n","o","s","w"][i]}));
  return makePic({q:`Tippe an der Kompassrose auf <mark>${DIRS[ask]}</mark>.`,layout:"compass",tiles,a:ask,ex:`Von Norden aus im Uhrzeigersinn liegen Osten, Süden und Westen. Hier war ${DIRS[ask]} gesucht.`,
    hint:"Norden ist oben und mit N beschriftet. Gehe von dort im Uhrzeigersinn: Die Richtungen folgen der Reihe nach.",sig:"c|"+ask});
}
function compassSVG(dir){
  const pos=[[60,18],[102,60],[60,102],[18,60]],ang=[0,90,180,270][dir];
  const lab=["N","O","S","W"].map((t,i)=>`<text x="${pos[i][0]}" y="${pos[i][1]+5}" text-anchor="middle" font-size="15" font-family="sans-serif" font-weight="700" fill="#16271c">${t}</text>`).join("");
  return `<svg viewBox="0 0 120 120" width="200" height="200" role="img" aria-label="Kompassrose mit rotem Pfeil"><circle cx="60" cy="60" r="50" fill="#fff" stroke="#16271c" stroke-width="3"/>${lab}<g transform="rotate(${ang} 60 60)"><path d="M60 22 L68 58 L52 58 Z" fill="#e5484d"/><circle cx="60" cy="60" r="4" fill="#16271c"/></g></svg>`;
}
function suRose(d){
  const dir=R(0,3),names=DIRS.slice();
  return{type:"choice",q:d.q,vis:compassSVG(dir),choices:names,a:names[dir],fixed:true,ex:`Der Pfeil zeigt nach ${names[dir]}.`,hint:d.hint,sig:"r|"+dir,
    probe:probe("Kompassrose prüfen","Suche den Buchstaben N für Norden. Gehe im Uhrzeigersinn weiter und vergleiche mit dem Pfeil.")};
}
function suTask(topic){
  const d=pick(SU_TOPICS[topic].tasks);
  const f={match:()=>suMatch(d,topic),sort:()=>suSort(d),order:()=>suOrder(d),choice:()=>suChoice(d),pic:()=>suPic(d),rose:()=>suRose(d),compass:()=>suCompass(d)}[d.k];
  const T=f();
  if(SU_TOPICS[topic].late||d.late)T.late=true; // Stoff vielleicht noch nicht behandelt: kommt seltener, falsche Antwort zählt nicht
  return T;
}

// Generatoren je Thema: GEN[thema]({level}) gibt eine Aufgabe zurück (level nur bei Englisch).
export const TASKGEN={};
for(const t of Object.keys(EN_TOPICS))TASKGEN[t]=opts=>engTask(t,opts||{});
for(const t of Object.keys(SU_TOPICS))TASKGEN[t]=()=>suTask(t);
// für die Tests und die Inhaltsliste
export {compassSVG};
