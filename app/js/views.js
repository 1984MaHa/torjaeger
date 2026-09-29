// Darstellung: baut das HTML für jede Ansicht. Kennt weder Speicher noch Netz.
import {LIGEN,TOPICS,STICKERS,ROUND,TRIAL,PROBE,MASTER_N,MASTER_K,topicsOf} from "./content.js";
import {ballSVG,goalSVG} from "./svg.js";
import {total} from "./model.js";
import {esc} from "./util.js";
import {topicSafe,safeCount,mastered,leagueState,playable,topLeague,canTrial,budgetOf,streakDays,stickerCount} from "./rules.js";

export function rightText(T){return T.type==="tap"?T.words[T.a]:T.type==="pair"?`${T.a[0]} Rest ${T.a[1]}`:String(T.a);}

export function boardHTML(s){
  const top=topLeague(s),L=LIGEN[top],sc=safeCount(s,top),tot=topicsOf(top).length,pct=Math.round(sc/tot*100);
  return `<header class="board"><div><div class="league">${L.name} · ${L.klasse}</div><div class="sub">${sc} von ${tot} Themen sicher${top<LIGEN.length-1?` · dann geht es in die ${LIGEN[top+1].name}`:""}</div></div>
  <div class="pts">${total(s,"points")}<small>Punkte</small></div><div class="bar"><i style="width:${pct}%"></i></div>
  <div class="icons"><span class="pill">${streakDays(s)} Trainingstage in Folge</span><span class="pill">${total(s,"wins")} Siege · ${total(s,"rounds")} Spiele</span><button class="snd" id="snd">${s.settings.sound?"Ton an":"Ton aus"}</button></div></header>`;
}
export function stickerHTML(i,on){return `<div class="st ${on?"on":""}">${on?ballSVG(34,false):""}<span class="n">${i+1}</span><span>${on?STICKERS[i]:"?"}</span></div>`;}
function modeBtns(li,small){return `<div class="modes ${small?"sm":""}">
  <button class="mode" data-play="${li}:math"><span class="ic" style="background:var(--sky)">+</span><span><b>Mathe-Spiel</b></span></button>
  <button class="mode" data-play="${li}:deu"><span class="ic" style="background:var(--miss)">Aa</span><span><b>Deutsch-Spiel</b></span></button>
  <button class="mode" data-play="${li}:mix"><span class="ic" style="background:var(--ink)">★</span><span><b>Mix-Spiel</b></span></button></div>`;}

function leagueCard(s,i){
  const L=LIGEN[i],st=leagueState(s,i),top=topLeague(s),ms=mastered(s,i);
  let badge,body="";
  if(st==="open"){badge=ms?`<span class="badge done">Durchgespielt</span>`:i===top?`<span class="badge cur">Deine Liga</span>`:`<span class="badge done">Frei</span>`;}
  else if(st==="probe")badge=`<span class="badge probe">Probetraining: noch ${budgetOf(s,i)} Aufgaben</span>`;
  else if(st==="wait")badge=`<span class="badge wait">Wartet auf Freigabe</span>`;
  else badge=`<span class="badge lock">Gesperrt</span>`;
  const chips=`<div class="chipsT">${topicsOf(i).map(t=>`<span class="${topicSafe(s,t)?"ok":""}">${topicSafe(s,t)?"✓ ":""}${TOPICS[t]}</span>`).join("")}</div>`;
  if(playable(s,i)){body=chips+modeBtns(i,true);if(st==="probe")body+=`<p class="note">Wenn die ${PROBE} Probe-Aufgaben gespielt sind, können Mama oder Papa die Liga ganz freigeben.</p>`;}
  else if(st==="wait"){body=chips+`<p class="note">Das Probetraining ist geschafft. Jetzt müssen Mama oder Papa die ${L.name} in der Trainerbank freigeben.</p>`;}
  else{const prev=LIGEN[i-1];
    body=`<p class="note">Freispielen: In der ${prev.name} alle Themen sicher schaffen (je ${MASTER_K} von den letzten ${MASTER_N} Aufgaben richtig). Stand: ${safeCount(s,i-1)} von ${topicsOf(i-1).length}.</p>`+
      (canTrial(s,i)?`<div class="row"><button class="btn sm" data-trial="${i}">Schnuppern: ${TRIAL} Aufgaben</button><span class="note">Einmal am Tag</span></div>`:i<=top+2?`<p class="note">Heute schon geschnuppert. Morgen geht es wieder.</p>`:"");}
  return `<section class="lg ${playable(s,i)?"":"locked"}"><div class="lg-head"><div><b>${L.name}</b><span class="k">${L.klasse}</span></div>${badge}</div>${body}</section>`;
}

function parentHTML(s,UI,hasPin){
  const msg=UI.pinMsg?`<p class="note">${UI.pinMsg}</p>`:"";
  if(!hasPin)return `<div class="parent"><p class="note">Legt eine Eltern-PIN fest (4 Ziffern). Sie gilt für alle Konten und alle Geräte. Damit gebt ihr Ligen frei, legt neue Konten an oder setzt den Spielstand zurück.</p>
    <div class="pin"><input id="pinNew" type="password" inputmode="numeric" maxlength="4" autocomplete="off" aria-label="Neue PIN"><button class="btn sm" id="pinSet">PIN speichern</button></div>${msg}</div>`;
  if(!UI.parent)return `<div class="parent"><div class="pin"><input id="pinIn" type="password" inputmode="numeric" maxlength="4" autocomplete="off" aria-label="Eltern-PIN"><button class="btn sm" id="pinOk">Eltern-Bereich öffnen</button></div>${msg}</div>`;
  const rows=LIGEN.slice(1).map((L,k)=>{const i=k+1,st=leagueState(s,i);
    const txt=st==="open"?"ganz frei":st==="probe"?`Probetraining (noch ${budgetOf(s,i)})`:st==="wait"?"Probetraining fertig, wartet auf euch":"gesperrt";
    return `<div class="prow"><span><b>${L.name}</b> (${L.klasse}): ${txt}</span><span class="row">${st!=="open"?`<button class="btn sm" data-open="${i}">Ganz freigeben</button>`:""}${st!=="locked"?`<button class="btn ghost sm" data-lock="${i}">Wieder sperren</button>`:""}</span></div>`;}).join("");
  return `<div class="parent">${rows}<div class="row">${UI.confirmReset?`<span>Wirklich alles löschen?</span><button class="btn warn" id="resetYes">Ja, löschen</button><button class="btn ghost sm" id="resetNo">Abbrechen</button>`:`<button class="btn warn" id="reset">Spielstand zurücksetzen</button>`}<button class="btn ghost sm" id="pinClose">Eltern-Bereich schließen</button></div></div>`;
}

export function homeHTML(s,UI,env){
  const stats=LIGEN.map((L,i)=>`<h4 class="gl">${L.name} (${L.klasse})</h4>`+topicsOf(i).map(t=>{
    const st=s.stats[t],l=st&&st.last?st.last.slice(-MASTER_N):[],k=l.reduce((a,x)=>a+x.ok,0),p=l.length?Math.round(k/l.length*100):0,
      col=!l.length?"#c9d3cb":topicSafe(s,t)?"var(--goal)":p>=60?"var(--gold)":"var(--miss)";
    return `<div class="stat"><span>${TOPICS[t]}</span><span class="b"><i style="width:${l.length?p:0}%;background:${col}"></i></span><span class="v">${l.length?`${k}/${l.length}`:"-"}</span></div>`;}).join("")).join("");
  const name=esc(s.profile.name);
  return (env.updateReady?`<div class="banner"><span>Es gibt eine neue Version der App.</span><button class="btn sm" id="upd">Jetzt laden</button></div>`:"")+boardHTML(s)+`
  <div><h1 class="title">Torjäger-Liga</h1><p class="lead">Hallo ${name}! Jedes Spiel hat ${ROUND} Aufgaben. Richtig heißt Tor! Spiel eine Liga durch, dann darfst du in die nächste aufsteigen. In die leichteren Ligen kannst du immer zurück.</p>
    <div class="row" style="margin-top:8px"><button class="snd" id="switch">Spieler wechseln (${name})</button></div></div>
  <div class="leagues">${LIGEN.map((_,i)=>leagueCard(s,i)).join("")}</div>
  <section class="panel"><h3>Sammelalbum · ${stickerCount(s)} von ${STICKERS.length}</h3><div class="album">${STICKERS.map((_,i)=>stickerHTML(i,i<stickerCount(s))).join("")}</div>
  <p class="small">Für jedes gewonnene Spiel gibt es einen Sticker. Gewonnen hast du ab 5 von 8 Toren.</p></section>
  <section class="panel"><details ${UI.parent||UI.pinMsg?"open":""}><summary>Trainerbank (für Mama und Papa)</summary>
    <p class="small">Zahlen zeigen, wie viele der letzten ${MASTER_N} Aufgaben je Thema richtig waren. Ein Thema ist sicher ab ${MASTER_K} von ${MASTER_N}. Schwache Themen kommen öfter dran.</p>${stats}
    <p class="small"><b>Zuletzt abgeglichen:</b> ${env.syncText}</p>
    ${env.persistent?"":`<p class="small">Achtung: Dieser Browser kann nichts dauerhaft speichern. Der Stand bleibt nur, bis die Seite geschlossen wird.</p>`}
    <p class="small">Version ${esc(env.version)}</p>${parentHTML(s,UI,env.hasPin)}
  </details></section>`;
}

export function accountsHTML(accounts,UI,env){
  const list=accounts.map(a=>`<button class="mode" data-acct="${esc(a.id)}"><span class="ic" style="background:var(--sky)">${esc((a.name||"?").trim().charAt(0).toUpperCase())}</span><span><b>${esc(a.name)}</b></span></button>`).join("");
  const form=UI.newAcct?`<section class="panel"><h3>Neues Konto</h3>
    <p class="note">${env.hasPin?"Die Eltern-PIN wird gebraucht, um ein Konto anzulegen.":"Legt zuerst eine Eltern-PIN fest (4 Ziffern). Sie gilt für alle Konten und alle Geräte."}</p>
    <div class="pin" style="margin:8px 0"><input id="acctName" type="text" maxlength="20" autocomplete="off" placeholder="Name" aria-label="Name" style="letter-spacing:0;width:190px"></div>
    <div class="pin"><input id="acctPin" type="password" inputmode="numeric" maxlength="4" autocomplete="off" aria-label="${env.hasPin?"Eltern-PIN":"Neue Eltern-PIN"}" placeholder="PIN"><button class="btn sm" id="acctCreate">Konto anlegen</button><button class="btn ghost sm" id="acctCancel">Abbrechen</button></div>
    ${UI.acctMsg?`<p class="note">${UI.acctMsg}</p>`:""}</section>`
    :`<div class="row"><button class="btn" id="acctNew">Neues Konto</button></div>`;
  return `<div><h1 class="title">Torjäger-Liga</h1><p class="lead">${accounts.length?"Wer spielt?":"Willkommen! Legt das erste Konto an."}</p></div>
  ${accounts.length?`<div class="modes">${list}</div>`:""}${!UI.newAcct&&UI.acctMsg?`<p class="lead">${UI.acctMsg}</p>`:""}${form}
  ${env.persistent?"":`<p class="lead small">Achtung: Dieser Browser kann nichts dauerhaft speichern.</p>`}`;
}

function padHTML(){return `<div class="pad">${[1,2,3,"del",4,5,6,0,7,8,9,"ok"].map(k=>k==="del"?`<button data-k="del" aria-label="Löschen">⌫</button>`:k==="ok"?`<button class="ok" data-k="ok">Schuss!</button>`:`<button data-k="${k}">${k}</button>`).join("")}</div>`;}
function inputHTML(T,G){
  if(T.type==="num"){let h=`<div class="ans" aria-live="polite">${G.done?G.given:(G.input||"&nbsp;")}</div>`;if(!G.done)h+=padHTML();return h;}
  if(T.type==="pair"){const v=G.done?G.given:G.inp;let h=`<div class="pairrow"><span class="ans ${!G.done&&G.act===0?"act":""}" data-slot="0" role="button" aria-label="${T.labels[0]}">${v[0]||"&nbsp;"}</span><span>Rest</span><span class="ans ${!G.done&&G.act===1?"act":""}" data-slot="1" role="button" aria-label="${T.labels[1]}">${v[1]||"&nbsp;"}</span></div>`;
    if(!G.done)h+=padHTML();return h;}
  if(T.type==="choice")return `<div class="choices">${T.choices.map(ch=>{let cl="";if(G.done){if(ch===T.a)cl="right";else if(ch===G.given)cl="wrong";}return `<button class="${cl}" data-c="${ch.replace(/"/g,"&quot;")}" ${G.done?"disabled":""} ${T.small?'style="font-size:1.15rem;font-weight:400"':""}>${ch}</button>`;}).join("")}</div>`;
  let h=`<div class="chips">${T.words.map((w,i)=>{let cl="";if(G.done){if(i===T.a)cl="right"+(T.mark?" pick":"");else if(i===G.given)cl="wrong";}else if(i===G.pickIdx)cl="pick";return `<button class="${cl}" data-w="${i}" ${G.done?"disabled":""}>${w}</button>`;}).join("")}</div>`;
  if(!G.done)h+=`<button class="btn" id="tapok" ${G.pickIdx<0?'disabled style="opacity:.5"':""}>${T.tapLabel}</button>`;return h;
}

export function playHTML(s,G){
  const T=G.task,c=G.res.filter(Boolean).length,m=G.res.length-c,L=LIGEN[G.li];
  const dots=Array.from({length:G.len},(_,i)=>`<i class="${i<G.res.length?(G.res[i]?"ok":"no"):i===G.i?"now":""}"></i>`).join("");
  let fb="";if(G.done){fb=G.ok?`<div class="fb ok">${goalSVG()}<span class="big">Tor!</span><span class="plus">+${G.gain}${G.gain>10?" Serie!":""}</span><p>${T.ex}</p></div>`
      :`<div class="fb no">${goalSVG()}<span class="big">Knapp vorbei</span><p><b>Richtig ist: ${rightText(T)}.</b> ${T.ex}</p></div>`;
    fb+=`<button class="btn" id="next">${G.i+1>=G.len?"Abpfiff":"Weiter"}</button>`;}
  const hint=T.hint&&!G.done?(G.showHint?`<div class="hint">${T.hint}</div>`:`<button class="hintbtn" id="hint">Trainer-Tipp anzeigen</button>`):"";
  return `<div class="hud"><button class="btn ghost" id="home" style="font-size:1rem;padding:8px 14px">Kabine</button>
    <div class="score">${esc(s.profile.name)} <em>${c}</em> : <em>${m}</em> ${G.rival}</div><div class="dots">${dots}</div></div>
    <section class="card"><div class="tag">${L.name}${G.trial?" · Schnuppern":""} · Aufgabe ${G.i+1} von ${G.len} · ${TOPICS[T.topic]}</div>
    <p class="q">${T.q}</p>${T.vis?`<div class="vis">${T.vis}</div>`:""}${inputHTML(T,G)}${hint}${fb}</section>
    <p class="lead small" style="color:#fff">Lies zuerst das gelb markierte Wort. Dann erst schießen!</p>`;
}

export function resultHTML(s,G,UI){
  const c=G.res.filter(Boolean).length,n=G.len,m=n-c,L=LIGEN[G.li];
  const head=G.trial?"Schnuppertraining vorbei":c===n?"Perfektes Spiel!":c/n>=.6?"Sieg!":c/n>=.5?"Unentschieden":"Heute verloren. Nächstes Mal klappt es!";
  const st=leagueState(s,G.li);let info="";
  if(G.trial)info=`<p>So fühlt sich die ${L.name} an. Freispielen kannst du sie in der ${LIGEN[G.li-1].name}.</p>`;
  else if(st==="probe")info=`<p>Probetraining in der ${L.name}: noch ${budgetOf(s,G.li)} Aufgaben.</p>`;
  else if(st==="wait")info=`<p>Probetraining geschafft! Jetzt müssen Mama oder Papa die ${L.name} freigeben.</p>`;
  return boardHTML(s)+`<section class="card result"><h2>${head}</h2>
    <div class="final"><span class="team">${esc(s.profile.name)}<small>Heim</small></span><span>${c} : ${m}</span><span class="team">${G.rival}<small>Gast</small></span></div>
    <p class="q" style="font-size:1.4rem">+${G.pts} Punkte${G.bonus?` (davon ${G.bonus} Bonus)`:""}</p>
    ${UI.celebrate?`<div class="celebrate">${UI.celebrate}</div>`:""}${info}
    ${G.newSticker!==null?`<p>Neuer Sticker für dein Album:</p><div class="newst">${stickerHTML(G.newSticker,true)}</div>`:G.trial?"":(c/n>=.6?"<p>Dein Album ist voll. Stark!</p>":"<p>Gewinne ein Spiel, dann bekommst du einen Sticker.</p>")}
    <div class="row" style="justify-content:center">${!G.trial&&playable(s,G.li)?`<button class="btn" id="again">Nächstes Spiel</button>`:""}<button class="btn ghost" id="home">Zur Kabine</button></div></section>`;
}
