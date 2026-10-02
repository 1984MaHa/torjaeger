// Darstellung der Mini-Spiele (ab 1.6.3). Reine Darstellung. Texte ohne Gedankenstriche.
import {MINI,MINI_IDS,MINI_LEN,miniGoals,miniScore,miniOver} from "./mini.js";
import {TOPICS} from "./content.js";
import {sceneSVG,SHOT_TEXT} from "./avatardraw.js";
import {lookOf} from "./avatar.js";
import {esc} from "./util.js";

// Kabine: Auswahl der Mini-Spiele
export function miniPanelHTML(s){
  return `<section class="panel minipanel"><h3>Mini-Spiele</h3><p class="note">Kurze Spiele zwischendurch. Fünf Aufgaben, die Antworten zählen für dein Training.</p>
    <div class="row">${MINI_IDS.map(k=>`<button class="btn" data-mini="${k}">${esc(MINI[k].name)}</button>`).join("")}</div></section>`;
}
const hud=(s,M)=>`<div class="hud"><button class="btn ghost" id="home" style="font-size:1rem;padding:8px 14px">Kabine</button><div class="score">${esc(MINI[M.kind].name)} <em>${miniGoals(M)}</em> : <em>${M.res.length-miniGoals(M)}</em></div>
  <div class="dots">${Array.from({length:MINI_LEN},(_,i)=>`<i class="${i<M.res.length?(M.res[i]?"ok":"no"):i===M.i?"now":""}"></i>`).join("")}</div></div>`;

export function miniHTML(s,M){
  if(miniOver(M))return miniResultHTML(s,M);
  if(M.kind==="wall")return wallHTML(s,M);
  if(M.kind==="memory")return memoryHTML(s,M);
  if(M.kind==="dribble")return dribbleHTML(s,M);
  return "";
}
// Torwand: vier Löcher, auf jedem steht eine Antwort. Antippen = Schuss auf dieses Loch.
function wallHTML(s,M){
  const it=M.items[M.i],T=it.T,right=it.right;
  const holes=it.opts.map((o,k)=>{
    const st=M.done?(k===right?"right":k===M.pick?"wrong":""):"";
    return `<button class="hole ${st}" data-hole="${k}" ${M.done?"disabled":""} aria-label="Antwort ${esc(o.label)}"><span class="holein">${o.label}</span></button>`;
  }).join("");
  let fb="";
  if(M.done){
    const shot=M.shot||{kind:M.ok?"goal":"wide",side:1};
    fb=`<div class="fb ${M.ok?"ok":"no"}">${sceneSVG(lookOf(s.profile),shot)}<div class="fbtxt"><span class="big">${M.ok?`Tor ins richtige Loch! +${M.gain}`:(SHOT_TEXT[shot.kind]||"Knapp vorbei")}</span></div></div>`
      +(M.ok?"":`<div class="bubble" role="status"><p><b>Richtig war: ${esc(String(T.a))}.</b> ${T.ex||""}</p></div>`)
      +`<button class="btn" id="miniNext">${M.i+1>=M.items.length?"Abpfiff":"Weiter"}</button>`;
  }
  return hud(s,M)+`<section class="card"><div class="tag">Torwand · Aufgabe ${M.i+1} von ${M.items.length} · ${esc(TOPICS[T.topic]||"")}</div>
    <p class="q">${T.q}</p>${T.vis?`<div class="vis">${T.vis}</div>`:""}
    <div class="wall" role="group" aria-label="Torwand mit vier Löchern">${holes}</div>${fb}</section>
    <p class="lead small" style="color:#fff">Tippe auf das Loch mit der richtigen Antwort.</p>`;
}
// Dribbel-Parcours: Strecke mit fünf Hindernissen (Hütchen und Gegner im Wechsel), der Ball steht vor dem nächsten Hindernis.
function trackSVG(M){
  const n=M.stations,w=120+n*110,x=i=>90+i*110;
  const obst=Array.from({length:n},(_,i)=>{
    const passed=i<M.pos,cx=x(i)+55,o=i%2===0
      ?`<polygon points="${cx-16},96 ${cx+16},96 ${cx},52" fill="#ff8a1f" stroke="#16271c" stroke-width="3"/><rect x="${cx-12}" y="76" width="24" height="6" fill="#fff"/>`
      :`<circle cx="${cx}" cy="52" r="13" fill="#e5484d" stroke="#16271c" stroke-width="3"/><rect x="${cx-12}" y="64" width="24" height="32" rx="8" fill="#e5484d" stroke="#16271c" stroke-width="3"/>`;
    return `<g opacity="${passed?.35:1}">${o}</g>`;
  }).join("");
  const bx=Math.min(x(M.pos)+10,w-60);
  return `<svg class="track" viewBox="0 0 ${w} 120" role="img" aria-label="Parcours: ${M.pos} von ${n} Hindernissen geschafft"><rect x="0" y="100" width="${w}" height="8" rx="4" fill="#c9d3cb"/>${obst}<rect x="${w-40}" y="40" width="30" height="60" fill="none" stroke="#16271c" stroke-width="4"/><circle cx="${bx}" cy="88" r="12" fill="#fff" stroke="#16271c" stroke-width="3"/></svg>`;
}
function dribbleHTML(s,M){
  const it=M.items[M.i],T=it.T,right=it.right,n=M.stations;
  const opts=it.opts.map((o,k)=>{
    const st=M.done?(k===right?"right":k===M.pick?"wrong":""):"";
    return `<button class="dopt ${st}" data-hole="${k}" ${M.done?"disabled":""}>${o.label}</button>`;
  }).join("");
  let fb="";
  if(M.done){
    fb=`<div class="fb ${M.ok?"ok":"no"}"><div class="fbtxt"><span class="big">${M.ok?(M.pos>=n?"Tor! Alle Hindernisse geschafft!":`Vorbei! +${M.gain}`):"Ball verloren! Neuer Versuch"}</span></div></div>`
      +(M.ok?"":`<div class="bubble" role="status"><p><b>Richtig war: ${esc(String(T.a))}.</b> ${T.ex||""}</p></div>`)
      +`<button class="btn" id="miniNext">${M.ok&&M.pos>=n?"Abpfiff":M.i+1>=M.items.length?"Abpfiff":"Weiter"}</button>`;
  }
  return `<div class="hud"><button class="btn ghost" id="home" style="font-size:1rem;padding:8px 14px">Kabine</button><div class="score">Parcours <em>${M.pos}</em> von ${n}</div><div class="dots">${Array.from({length:n},(_,i)=>`<i class="${i<M.pos?"ok":i===M.pos?"now":""}"></i>`).join("")}</div></div>
    <section class="card"><div class="tag">Dribbel-Parcours · Versuch ${M.i+1} · Ball verloren: ${M.lost} · ${esc(TOPICS[T.topic]||"")}</div>
    ${trackSVG(M)}<p class="q">${T.q}</p>${T.vis?`<div class="vis">${T.vis}</div>`:""}
    <div class="dopts" role="group" aria-label="Antworten">${opts}</div>${fb}</section>
    <p class="lead small" style="color:#fff">Richtig: du dribbelst am Hindernis vorbei. Falsch: der Ball ist weg, du bekommst eine neue Aufgabe.</p>`;
}
// Memory: zehn Karten, Aufgabe und Ergebnis gehören zusammen. Zwei Karten, die nicht passen, bleiben offen, bis die nächste angetippt wird.
function memoryHTML(s,M){
  const n=M.items.length,miss=M.open.length===2&&M.cards[M.open[0]].k!==M.cards[M.open[1]].k;
  const cards=M.cards.map((c,i)=>{
    const found=M.found.includes(c.k),open=found||M.open.includes(i);
    return `<button class="mcard ${found?"found":open?"open":""} ${c.side==="a"?"res":"task"}" data-card="${i}" ${found?"disabled":""} aria-label="${open?esc(c.text):"Verdeckte Karte"}"><span>${open?esc(c.text):"⚽"}</span></button>`;
  }).join("");
  return `<div class="hud"><button class="btn ghost" id="home" style="font-size:1rem;padding:8px 14px">Kabine</button><div class="score">Memory <em>${M.found.length}</em> von ${n} Paaren</div><div class="dots">${M.items.map((it,k)=>`<i class="${M.found.includes(k)?"ok":""}"></i>`).join("")}</div></div>
    <section class="card"><div class="tag">Memory · Versuche: ${M.tries}</div>
    <p class="q">Finde zu jeder Aufgabe das passende Ergebnis. Tippe zwei Karten an.</p>
    <div class="memory" role="group" aria-label="Memory mit ${n*2} Karten">${cards}</div>
    ${miss?`<div class="bubble" role="status"><p>Das passt nicht zusammen. Tippe eine Karte an, dann werden beide wieder verdeckt.</p></div>`:""}</section>`;
}
export function miniResultHTML(s,M){
  if(M.kind==="dribble"){const goal=M.pos>=M.stations;return `<section class="card result"><h2>${goal?"Tor!":"Der Parcours war schwer"}</h2>
    <p class="q" style="font-size:1.4rem">${goal?`Alle ${M.stations} Hindernisse geschafft${M.lost?`, ${M.lost}× Ball verloren`:" ohne Ballverlust"}`:`Du kamst bis Hindernis ${M.pos} von ${M.stations}`} · +${M.pts} Punkte</p>
    <div class="row" style="justify-content:center"><button class="btn" id="miniAgain" data-mini="dribble">Nochmal spielen</button><button class="btn ghost" id="home">Zur Kabine</button></div></section>`;}
  if(M.kind==="memory")return `<section class="card result"><h2>Alle Paare gefunden!</h2>
    <p class="q" style="font-size:1.4rem">${M.items.length} Paare in ${M.tries} Versuchen · +${M.pts} Punkte</p>
    <div class="row" style="justify-content:center"><button class="btn" id="miniAgain" data-mini="memory">Nochmal spielen</button><button class="btn ghost" id="home">Zur Kabine</button></div></section>`;
  const c=miniGoals(M),n=M.res.length,head=c===n?"Alle Löcher getroffen!":c>=3?"Stark geschossen!":"Das üben wir noch";
  return `<section class="card result"><h2>${head}</h2>
    <div class="final"><span class="team">${esc(s.profile.name)}<small>Heim</small></span><span>${miniScore(M)}</span><span class="team">${esc(MINI[M.kind].name)}<small>Mini-Spiel</small></span></div>
    <p class="q" style="font-size:1.4rem">${c} von ${n} Treffern · +${M.pts} Punkte</p>
    <div class="row" style="justify-content:center"><button class="btn" id="miniAgain" data-mini="${M.kind}">Nochmal spielen</button><button class="btn ghost" id="home">Zur Kabine</button></div></section>`;
}
