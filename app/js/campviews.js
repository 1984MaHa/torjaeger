// Darstellung des Trainingslagers (ab 1.5.4): Kachel auf der Startseite, Halbzeitpause, Ergebnisse, Abschnitt im Eltern-Bereich.
// Reine Darstellung, kennt weder Speicher noch Netz. Texte ohne Gedankenstriche.
import {CAMPS,SPECIAL_CAMP,halftimeSay,finalSay,penaltyScore,unitOf} from "./camp.js";
import {BONUS_NAMES} from "./custom.js";
import {campOf} from "./model.js";
import {campOn,campDone,campNext,campBadge,unitDone,unitOpen} from "./rules.js";
import {trainerSVG} from "./avatardraw.js";
import {esc} from "./util.js";

// Ergebnis einer abgeschlossenen Einheit als Text: "1. Halbzeit 7 von 10, 2. Halbzeit 8 von 10, Elfmeterschießen 4 : 1"
export function unitResultText(rec){
  if(!rec||!rec.h1||!rec.h2)return "";
  return `1. Halbzeit ${rec.h1.c} von ${rec.h1.n}, 2. Halbzeit ${rec.h2.c} von ${rec.h2.n}`+(rec.pen?`, Elfmeterschießen ${penaltyScore(rec.pen.c,rec.pen.n)}`:"");
}

// Nachspielzeit des Lagers (eigene Lager: aus dem Baukasten, sonst Elfmeterschießen)
export const bonusOf=C=>(C&&C.bonus)||"penalty";
const endText=C=>{const b=bonusOf(C);return b==="none"?"":b==="penalty"?" und eine Nachspielzeit":` und als Nachspielzeit ${BONUS_NAMES[b]}`;};

// ----- Startseite: die Kachel je eingeschaltetem Trainingslager -----
export function campTilesHTML(s){
  return Object.keys(CAMPS).filter(t=>campOn(s,t)).map(t=>campTileHTML(s,t)).join("");
}
function campTileHTML(s,t){
  const C=CAMPS[t],nU=C.units.length,done=campDone(s,t),next=campNext(s,t),badge=campBadge(s,t),cm=campOf(s,t),pct=Math.round(done/nU*100);
  const head=badge?`<span class="badge done">${esc(C.badge)}</span>`:`<span class="badge cur">Einheit ${next} von ${nU}</span>`;
  const units=C.units.map(u=>{
    const open=unitOpen(s,t,u.n),d=unitDone(s,t,u.n),rec=cm.units[String(u.n)];
    const sub=d?unitResultText(rec):open?u.text:`Erst Einheit ${u.n-1} zu Ende spielen.`;
    return `<button class="unitbtn ${d?"done":""} ${open&&!d?"next":""}" data-camp="${t}:${u.n}" ${open?"":"disabled"}><span class="un" aria-hidden="true">${d?"✓":u.n}</span><span class="ut"><b>${esc(u.title)}</b><span>${esc(sub)}</span></span><span class="uact">${d?"Nochmal":open?"Los":"Gesperrt"}</span></button>`;
  }).join("");
  const cheer=badge?`<p class="note campbadge">Geschafft! Du bist ${esc(C.badge)}. Du darfst jede Einheit trotzdem wiederholen.</p>`:"";
  return `<section class="panel camp" aria-label="${esc(C.title)}"><div class="lg-head"><div><b>${esc(C.title)}</b><span class="k">${done} von ${nU} Einheiten geschafft. Jede Einheit hat 2 Halbzeiten${endText(C)}.</span></div>${head}</div>
    <div class="lgbar" aria-hidden="true"><i style="width:${pct}%"></i></div>${cheer}<div class="units">${units}</div></section>`;
}
// Hinweis, wenn ein Spiel gesichert ist: Weiterspielen oder neu anfangen. info: {topic, unit, half, brk, pen, c, m}
export function campResumeHTML(info){
  if(!info)return "";
  const U=unitOf(info.topic,info.unit),where=info.pen?"Elfmeterschießen":info.brk?"Halbzeitpause":`${info.half}. Halbzeit`;
  return `<section class="panel packresume" role="status"><h3>${info.pen?"Elfmeterschießen":"Trainingslager"} weiterspielen?</h3><p class="note">Du hast angefangen: <b>${esc((CAMPS[info.topic]||{}).name||"Trainingslager")}</b>, Einheit ${info.unit}${U?` (${esc(U.title)})`:""}, ${where}. Stand ${info.c} : ${info.m}.</p>
    <div class="row"><button class="btn" id="campResume">Weiterspielen</button><button class="btn ghost" id="campDrop">Neu anfangen</button></div></section>`;
}

// ----- Halbzeitpause -----
export function breakHTML(s,G,trainers,teamName){
  const C=G.camp,h=C.halves[C.half-1],U=unitOf(C.topic,C.unit),t=trainers[0];
  return `<div class="hud"><button class="btn ghost" id="home" style="font-size:1rem;padding:8px 14px">Kabine</button><div class="score">${esc(teamName)} · Halbzeitpause</div><div class="dots">${h.res.map(x=>`<i class="${x?"ok":"no"}"></i>`).join("")}</div></div>
    <section class="card camp-break"><div class="tag">${esc(CAMPS[C.topic].title)} · Einheit ${C.unit}${U?`: ${esc(U.title)}`:""}</div>
    <h2 class="cheer2">Halbzeitpause!</h2>
    <div class="final"><span class="team">${esc(teamName)}<small>Heim</small></span><span>${h.c} : ${h.n-h.c}</span><span class="team">${esc(G.rival)}<small>Gast</small></span></div>
    <p class="q" style="font-size:1.3rem">${h.c} Tore und ${h.n-h.c} Fehlschüsse. +${h.pts} Punkte</p>
    <div class="coach done"><div class="coachfigs"><div class="coachfig talk">${trainerSVG(t.look,{px:54,label:t.name,which:1})}<span class="coachname">${esc(t.name)}</span></div></div><div class="coachside"><div class="bubble" role="status"><span class="who">${esc(t.name)}</span><p>${esc(halftimeSay(h.c,h.n))}</p></div></div></div>
    <div class="row" style="justify-content:center"><button class="btn" id="halfGo">2. Halbzeit anpfeifen</button></div></section>`;
}

// ----- Ergebnis nach dem Abpfiff einer Einheit -----
export function campResultHTML(s,G){
  const C=G.camp,hs=C.halves,U=unitOf(C.topic,C.unit),T=CAMPS[C.topic];
  const c=hs.reduce((a,h)=>a+h.c,0),n=hs.reduce((a,h)=>a+h.n,0);
  const lines=hs.map((h,i)=>`<div class="hzrow"><span>${i+1}. Halbzeit</span><b>${h.c} von ${h.n}</b></div>`).join("");
  const badge=G.badgeNew?`<div class="celebrate">Abzeichen: <b>${esc(T.badge)}</b>! Alle ${T.units.length} Einheiten sind geschafft.${G.badgeSticker!==null&&G.badgeSticker!==undefined?" Dazu gibt es einen Jubel-Sticker.":""}</div>`:"";
  return `<p class="note">${esc(T.title)} · Einheit ${C.unit}${U?`: ${esc(U.title)}`:""}</p><div class="hz">${lines}</div><p>${esc(finalSay(c,n))}</p>${badge}`;
}
export function campButtonsHTML(s,G){
  const C=G.camp,T=CAMPS[C.topic],nextOpen=C.unit<T.units.length&&unitOpen(s,C.topic,C.unit+1);
  const b=bonusOf(T),after=G.pen||b==="none"; // nach der Nachspielzeit (oder ohne) geht es mit der nächsten Einheit weiter
  const go=G.pen?"":b==="penalty"?`<button class="btn" id="penGo">Nachspielzeit: Elfmeterschießen</button>`:b==="none"?"":`<button class="btn" data-campmini="${b}">Nachspielzeit: ${esc(BONUS_NAMES[b])}</button>`;
  return `<div class="row" style="justify-content:center">${go}${after&&nextOpen?`<button class="btn" data-camp="${C.topic}:${C.unit+1}">Nächste Einheit</button>`:""}<button class="btn ghost" id="home">Zur Kabine</button></div>`;
}
// Ergebnis des Elfmeterschießens
export function penaltyResultHTML(s,G,teamName){
  const c=G.res.filter(Boolean).length,n=G.len,C=G.camp,T=CAMPS[C.topic];
  const head=c===n?"Alle fünf drin!":c>=3?"Gewonnen!":"Der Torwart war stark";
  return `<section class="card result"><h2>${head}</h2>
    <div class="final"><span class="team">${esc(teamName)}<small>Heim</small></span><span>${penaltyScore(c,n)}</span><span class="team">${esc(G.rival)}<small>Gast</small></span></div>
    <p class="q" style="font-size:1.4rem">Elfmeterschießen: ${penaltyScore(c,n)} · +${G.pts} Punkte</p>
    <p class="note">${esc(T.title)} · Einheit ${C.unit}</p>${campButtonsHTML(s,G)}</section>`;
}

// ----- Eltern-Bereich: Einstellung und Fortschritt je Konto -----
export function campAdminHTML(A,a,seg){
  const s=a.state;
  return Object.keys(CAMPS).filter(t=>t===SPECIAL_CAMP||campOn(s,t)).map(t=>{ // Teilen mit Rest immer, die übrigen nur als Schwerpunkt
    const C=CAMPS[t],cm=campOf(s,t),on=campOn(s,t),done=campDone(s,t),nU=C.units.length;
    const rows=C.units.map(u=>{
      const rec=cm.units[String(u.n)],d=unitDone(s,t,u.n);
      return `<div class="setrow"><span>Einheit ${u.n}: ${esc(u.title)}</span><span class="k">${d?esc(unitResultText(rec)):unitOpen(s,t,u.n)?"noch nicht gespielt":"noch gesperrt"}</span></div>`;
    }).join("");
    const ask=`campreset:${a.id}:${t}`;
    return `<section class="panel"><h3>${esc(C.title)}: ${esc(a.name)}</h3>
      <p class="note">${C.custom?`Eigenes Trainingslager aus dem Baukasten (Reiter Einstellungen, Eigene Trainingslager): ${nU} ${nU===1?"Einheit":"Einheiten"} mit je zwei Halbzeiten${endText(C)}. Schalter und Vorlage stehen dort. Neu starten übernimmt die aktuelle Vorlage.`:C.generic?`Dieses Thema ist als Schwerpunkt markiert (Reiter Einstellungen, Themen). Das Sondertraining hat ${nU} Einheiten mit je zwei Halbzeiten und einem Elfmeterschießen als Belohnung. Die nächste Einheit ist frei, wenn die vorige zu Ende gespielt ist. Im Mix kommt das Thema außerdem etwa bei jeder dritten Aufgabe dran.`:`Fünf Einheiten mit je zwei Halbzeiten und einem Elfmeterschießen als Belohnung. Die nächste Einheit ist frei, wenn die vorige zu Ende gespielt ist. Der Schalter gilt nur für dieses Konto. Auf der Startseite des Kontos erscheint eine eigene Kachel, solange er an ist oder das Thema als Schwerpunkt markiert ist.`}</p>
      ${C.generic||C.custom?"":`<div class="setrow"><span>Trainingslager anzeigen</span>${seg("data-acamp",[[`${t}:on:${a.id}`,"An"],[`${t}:off:${a.id}`,"Aus"]],`${t}:${on?"on":"off"}:${a.id}`)}</div>`}
      <p class="small">Fortschritt: ${done} von ${nU} Einheiten${campBadge(s,t)?`, Abzeichen ${esc(C.badge)} erreicht`:""}.</p>${rows}
      <div class="row"><button class="btn warn" data-aask="${esc(ask)}">Trainingslager neu starten</button></div>
      ${A.confirm===ask?`<div class="confirm"><p>Das Trainingslager von <b>${esc(a.name)}</b> wirklich neu starten? Alle Einheiten und das Abzeichen werden gelöscht. Schon verdiente Punkte und Sticker bleiben.</p><div class="row"><button class="btn warn" data-ado>Ja, neu starten</button><button class="btn ghost" data-acancel>Abbrechen</button></div></div>`:""}</section>`;
  }).join("");
}
