// Darstellung: baut das HTML für jede Ansicht. Kennt weder Speicher noch Netz.
import {LIGEN,TOPICS,STICKERS,PROBE,MASTER_N,MASTER_K,BONUS_FIX,FACHER,EN_LEVELS,topicsOf,allTopicsOf,isEng} from "./content.js";
import {newInputHTML,NEW_TYPES} from "./inputs.js";
import {tileHTML} from "./tasks.js";
import {ICONS} from "./icons.js";
import {speakBtn} from "./speech.js";
import {stickerHTML} from "./stickers.js";
import {probeHTML,givenText,packLen} from "./check.js";
import {avatarSVG,sceneSVG,SHOT_TEXT} from "./avatardraw.js";
import {lookOf,defaultTrainer,defaultTrainer2} from "./avatar.js";
import {rightText,coachHTML} from "./coach.js";
import {total,lvOf} from "./model.js";
import {esc} from "./util.js";
import {adminAskHTML} from "./admin.js";
import {topicSafe,topicDone,topicOn,activeTopics,gateTopics,fachProgress,safeCount,mastered,leagueState,playable,currentLeague,canTrial,budgetOf,streakDays,stickerCount,settingsOf,roundLen,trialLen,winNeed} from "./rules.js";

// Band oben in der Vorschau (label kommt vom Server, leer bei Live).
export function bandHTML(label){return label?`<div class="preview-band" role="status">${esc(label)}</div>`:"";}

export {rightText,stickerHTML};

export function boardHTML(s){
  const top=currentLeague(s),L=LIGEN[top],sc=safeCount(s,top),tot=gateTopics(s,top).length,pct=tot?Math.round(sc/tot*100):0;
  return `<header class="board"><div><div class="league">${L.name} · ${L.klasse}</div><div class="sub">${sc} von ${tot} Themen sicher${top<LIGEN.length-1?` · dann geht es in die ${LIGEN[top+1].name}`:""}</div></div>
  <div class="pts">${total(s,"points")}<small>Punkte</small></div><div class="bar"><i style="width:${pct}%"></i></div>
  <div class="icons"><span class="pill">${streakDays(s)} Trainingstage in Folge</span><span class="pill">${total(s,"wins")} Siege · ${total(s,"rounds")} Spiele</span><button class="snd" id="snd">${s.settings.sound?"Ton an":"Ton aus"}</button></div></header>`;
}
// ----- Ligen: die aktuelle groß, die anderen als schmale Zeile -----
function statusOf(s,i){
  const st=leagueState(s,i);
  if(st==="open")return mastered(s,i)?["done","Durchgespielt"]:["free","Frei"];
  if(st==="probe")return ["probe",`Probetraining: noch ${budgetOf(s,i)} Aufgaben`];
  if(st==="wait")return ["wait","Wartet auf Freigabe"];
  return canTrial(s,i)?["trial","Schnuppern möglich"]:["lock","Gesperrt"];
}
const stufe=(s,t)=>isEng(t)?` (Stufe ${lvOf(s,t)})`:"";
const chipsOf=(s,i)=>`<div class="chipsT">${activeTopics(s,allTopicsOf(i)).map(t=>`<span class="${topicDone(s,t)?"ok":""}">${topicDone(s,t)?"✓ ":""}${TOPICS[t]}${stufe(s,t)}</span>`).join("")}</div>`;

// Fach-Auswahl: Mathe und Deutsch öffnen darunter "Mix" und je einen Themenblock (Päckchen mit Kontroll-Pfiff).
function topicBlock(s,li,t){
  const st=s.stats[t],l=st&&st.last?st.last.slice(-MASTER_N):[],k=l.reduce((a,x)=>a+x.ok,0),p=l.length?Math.round(k/l.length*100):0,safe=topicDone(s,t),rep=s.settings&&s.settings.topicMode&&s.settings.topicMode[t]==="wiederholen";
  return `<button class="topicbtn ${safe?"safe":""}" data-play="${li}:topic:${t}"><span class="tn">${safe?"✓ ":""}${TOPICS[t]}${rep?" · wiederholen":""}</span><span class="tb" aria-hidden="true"><i style="width:${p}%"></i></span><span class="tv">${safe?"sicher · ":""}${isEng(t)?`Stufe ${lvOf(s,t)} von ${EN_LEVELS} · `:""}${l.length?`${k} von ${l.length} richtig · `:""}Päckchen mit ${packLen(t)} Aufgaben</span></button>`;
}
function fachPanel(s,li,fach){
  const L=LIGEN[li],name=FACHER[fach],list=activeTopics(s,L[fach]||[]);
  if(!list.length)return `<div class="fach" role="group" aria-label="${name}"><p class="note">Zurzeit ist hier kein Thema angeschaltet. Mama und Papa stellen das in der Trainerbank ein.</p></div>`;
  return `<div class="fach" role="group" aria-label="${name} spielen"><button class="topicbtn mixbtn" data-play="${li}:${fach}"><span class="tn">Mix: alles aus ${name}</span><span class="tv">Schwache Themen kommen öfter dran. Jede Antwort zählt sofort.</span></button>
    <p class="note">Oder ein Thema üben. Du schreibst erst alle Aufgaben des Päckchens und kontrollierst dann selbst.</p>${list.map(t=>topicBlock(s,li,t)).join("")}</div>`;
}
function modeBtns(s,li,UI,small){
  const open=UI&&UI.fach;
  const fb=(fach,label,ic,col)=>`<button class="mode ${open===li+":"+fach?"on":""}" data-fach="${li}:${fach}" aria-expanded="${open===li+":"+fach}"><span class="ic" style="background:${col}">${ic}</span><span><b>${label}</b></span></button>`;
  const panel=open&&open.startsWith(li+":")?fachPanel(s,li,open.split(":")[1]):"";
  const L=LIGEN[li];
  return `<div class="modes ${small?"sm":""}">${fb("math","Mathe",ICONS.math,"var(--sky)")}${fb("deu","Deutsch",ICONS.deu,"var(--miss)")}${L.eng?fb("eng","Englisch",ICONS.eng,"#d9480f"):""}${L.su?fb("su","Sachkunde",ICONS.su,"#0f8b6d"):""}
    <button class="mode" data-play="${li}:mix"><span class="ic" style="background:var(--ink)">${ICONS.mix}</span><span><b>Mix-Spiel</b></span></button></div>${panel}`;
}

// Eigener Fortschritt in Englisch und Sachkunde (zählt nicht für den Aufstieg).
function fachLines(s,i){
  const parts=["eng","su"].filter(f=>LIGEN[i][f]).map(f=>{const p=fachProgress(s,i,f);return p.total?`${FACHER[f]}: ${p.done} von ${p.total} Themen sicher`:"";}).filter(Boolean);
  return parts.length?`<p class="note">${parts.join(" · ")} (zählt nicht für den Aufstieg)</p>`:"";
}
// Die aktuelle Liga: Themen mit Status, Fortschritt und Spielauswahl.
function currentCard(s,UI,i){
  const L=LIGEN[i],st=leagueState(s,i),ms=mastered(s,i),sc=safeCount(s,i),tot=gateTopics(s,i).length;
  const badge=st==="probe"?`<span class="badge probe">Probetraining: noch ${budgetOf(s,i)} Aufgaben</span>`:ms?`<span class="badge done">Durchgespielt</span>`:`<span class="badge cur">Deine Liga</span>`;
  const note=st==="probe"?`<p class="note">Wenn die ${PROBE} Probe-Aufgaben gespielt sind, können Mama oder Papa die Liga ganz freigeben.</p>`:"";
  return `<section class="lg current"><div class="lg-head"><div><b>${L.name}</b><span class="k">${L.klasse} · ${sc} von ${tot} Themen sicher</span></div>${badge}</div>
    <div class="lgbar" aria-hidden="true"><i style="width:${tot?Math.round(sc/tot*100):0}%"></i></div>${fachLines(s,i)}${modeBtns(s,i,UI,true)}${note}</section>`;
}
// Jede andere Liga: eine schmale Zeile mit Name, Klasse und Status. Antippen klappt sie auf.
function miniRow(s,UI,i){
  const L=LIGEN[i],st=leagueState(s,i),top=currentLeague(s),[cls,txt]=statusOf(s,i),open=!!(UI&&UI.lgOpen&&UI.lgOpen[i]);
  let body="";
  if(open){
    if(playable(s,i)){
      body=(st==="probe"?`<p class="note">Probetraining: noch ${budgetOf(s,i)} von ${PROBE} Aufgaben. Danach können Mama oder Papa die Liga ganz freigeben.</p>`:"")+
        `<div class="row"><button class="btn sm" data-cur="${i}">Hier spielen</button><span class="note">Dann ist die ${L.name} deine Liga.</span></div>`;
    }else if(st==="wait"){
      body=`<p class="note">Das Probetraining ist geschafft. Jetzt müssen Mama oder Papa die ${L.name} in der Trainerbank freigeben.</p>`;
    }else{const prev=LIGEN[i-1];
      body=`<p class="note">Freispielen: In der ${prev.name} alle Themen in Mathe und Deutsch sicher schaffen (je ${MASTER_K} von den letzten ${MASTER_N} Aufgaben richtig). Stand: ${safeCount(s,i-1)} von ${gateTopics(s,i-1).length}.</p>`+
        (canTrial(s,i)?`<div class="row"><button class="btn sm" data-trial="${i}">Schnuppern: ${trialLen(s)} Aufgaben</button>${settingsOf(s).trialDaily?`<span class="note">Einmal am Tag</span>`:""}</div>`:i<=top+2?`<p class="note">Heute schon geschnuppert. Morgen geht es wieder.</p>`:"");
    }
  }
  return `<section class="lgmini ${playable(s,i)?"":"locked"} ${open?"open":""}"><button class="lgtoggle" data-lgtoggle="${i}" aria-expanded="${open}"><span class="nm"><b>${L.name}</b><span class="k">${L.klasse}</span></span><span class="badge ${cls}">${txt}</span><span class="chev" aria-hidden="true">${open?"▾":"▸"}</span></button>${body?`<div class="lgbody">${body}</div>`:""}</section>`;
}

function parentHTML(s,UI,hasPin){
  const msg=UI.pinMsg?`<p class="note">${UI.pinMsg}</p>`:"";
  if(!hasPin)return `<div class="parent"><p class="note">Legt eine Eltern-PIN fest (4 Ziffern). Sie gilt für alle Konten und alle Geräte. Damit gebt ihr Ligen frei und legt neue Konten an.</p>
    <div class="pin"><input id="pinNew" type="password" inputmode="numeric" maxlength="4" autocomplete="off" aria-label="Neue PIN"><button class="btn sm" id="pinSet">PIN speichern</button></div>${msg}</div>`;
  if(!UI.parent)return `<div class="parent"><div class="pin"><input id="pinIn" type="password" inputmode="numeric" maxlength="4" autocomplete="off" aria-label="Eltern-PIN"><button class="btn sm" id="pinOk">Eltern-Bereich öffnen</button></div>${msg}</div>`;
  const rows=LIGEN.slice(1).map((L,k)=>{const i=k+1,st=leagueState(s,i);
    const txt=st==="open"?"ganz frei":st==="probe"?`Probetraining (noch ${budgetOf(s,i)})`:st==="wait"?"Probetraining fertig, wartet auf euch":"gesperrt";
    return `<div class="prow"><span><b>${L.name}</b> (${L.klasse}): ${txt}</span><span class="row">${st!=="open"?`<button class="btn sm" data-open="${i}">Ganz freigeben</button>`:""}${st!=="locked"?`<button class="btn ghost sm" data-lock="${i}">Wieder sperren</button>`:""}</span></div>`;}).join("");
  return `<div class="parent">${rows}<p class="small">Zurücksetzen, Umbenennen, Löschen, Sicherungen und alle Einstellungen gibt es im Eltern-Bereich auf der Seite „Wer spielt?“.</p><div class="row"><button class="btn ghost sm" id="pinClose">Schließen</button></div></div>`;
}

export function homeHTML(s,UI,env){
  const stats=LIGEN.map((L,i)=>`<h4 class="gl">${L.name} (${L.klasse})</h4>`+activeTopics(s,allTopicsOf(i)).map(t=>{
    const st=s.stats[t],l=st&&st.last?st.last.slice(-MASTER_N):[],k=l.reduce((a,x)=>a+x.ok,0),p=l.length?Math.round(k/l.length*100):0,
      col=!l.length?"#c9d3cb":topicDone(s,t)?"var(--goal)":p>=60?"var(--gold)":"var(--miss)";
    return `<div class="stat"><span>${TOPICS[t]}${stufe(s,t)}</span><span class="b"><i style="width:${l.length?p:0}%;background:${col}"></i></span><span class="v">${l.length?`${k}/${l.length}`:"-"}</span></div>`;}).join("")).join("");
  const name=esc(s.profile.name);
  return (env.updateReady?`<div class="banner"><span>Es gibt eine neue Version der App.</span><button class="btn sm" id="upd">Jetzt laden</button></div>`:"")+boardHTML(s)+`
  <div class="hero"><span class="herofig">${avatarSVG(lookOf(s.profile),{crop:"bust",px:104})}</span><div><h1 class="title">Torjäger-Liga</h1><p class="lead">Hallo ${name}! Jedes Spiel hat ${roundLen(s)} Aufgaben. Richtig heißt Tor! Spiel deine Liga durch, dann darfst du in die nächste aufsteigen. In die leichteren Ligen kannst du immer zurück.</p>
    <div class="row" style="margin-top:8px"><button class="snd" id="switch">Spieler wechseln (${name})</button><button class="snd" id="avEdit">Mein Spieler</button></div></div></div>
  <div class="leagues">${currentCard(s,UI,currentLeague(s))}<h2 class="gl2">Andere Ligen</h2>${LIGEN.map((_,i)=>i).filter(i=>i!==currentLeague(s)).map(i=>miniRow(s,UI,i)).join("")}</div>
  <section class="panel"><h3>Sammelalbum · ${stickerCount(s)} von ${STICKERS.length}</h3><div class="album">${STICKERS.map((_,i)=>stickerHTML(i,i<stickerCount(s))).join("")}</div>
  <p class="small">Für jedes gewonnene Spiel gibt es einen Sticker. Gewonnen hast du ab ${winNeed(roundLen(s))} von ${roundLen(s)} Toren.</p></section>
  <section class="panel"><details data-bank ${UI.bankOpen||UI.parent||UI.pinMsg?"open":""}><summary>Trainerbank (für Mama und Papa)</summary>
    <p class="small">Zahlen zeigen, wie viele der letzten ${MASTER_N} Aufgaben je Thema richtig waren. Ein Thema ist sicher ab ${MASTER_K} von ${MASTER_N}. Schwache Themen kommen öfter dran.</p>${stats}
    <p class="small"><b>Zuletzt abgeglichen:</b> ${env.syncText}</p>
    ${env.persistent?"":`<p class="small">Achtung: Dieser Browser kann nichts dauerhaft speichern. Der Stand bleibt nur, bis die Seite geschlossen wird.</p>`}
    <p class="small">Version ${esc(env.version)}</p>${parentHTML(s,UI,env.hasPin)}
  </details></section>`;
}

export function accountsHTML(accounts,UI,env){
  const list=accounts.map(a=>{const look=lookOf({name:a.name,avatar:a.avatar});
    return `<button class="mode acct" data-acct="${esc(a.id)}"><span class="av">${avatarSVG(look,{crop:"bust",px:72,label:"Spieler "+(a.name||"")})}</span><span><b>${esc(a.name)}</b><span class="team">${esc(look.team)}</span></span></button>`;}).join("");
  const form=UI.newAcct?`<section class="panel"><h3>Neues Konto</h3>
    <p class="note">${env.hasPin?"Die Eltern-PIN wird gebraucht, um ein Konto anzulegen.":"Legt zuerst eine Eltern-PIN fest (4 Ziffern). Sie gilt für alle Konten und alle Geräte."}</p>
    <div class="pin" style="margin:8px 0"><input id="acctName" type="text" maxlength="20" autocomplete="off" placeholder="Name" aria-label="Name" style="letter-spacing:0;width:190px"></div>
    <div class="pin"><input id="acctPin" type="password" inputmode="numeric" maxlength="4" autocomplete="off" aria-label="${env.hasPin?"Eltern-PIN":"Neue Eltern-PIN"}" placeholder="PIN"><button class="btn sm" id="acctCreate">Konto anlegen</button><button class="btn ghost sm" id="acctCancel">Abbrechen</button></div>
    ${UI.acctMsg?`<p class="note">${UI.acctMsg}</p>`:""}</section>`
    :`<div class="row"><button class="btn" id="acctNew">Neues Konto</button>${env.hasPin?`<button class="btn ghost" id="adminOpen">Eltern</button>`:""}</div>${UI.adminAsk?adminAskHTML(UI.adminMsg):""}`;
  return `<div><h1 class="title">Torjäger-Liga</h1><p class="lead">${accounts.length?"Wer spielt?":"Willkommen! Legt das erste Konto an."}</p></div>
  ${accounts.length?`<div class="modes">${list}</div>`:""}${!UI.newAcct&&UI.acctMsg?`<p class="lead">${UI.acctMsg}</p>`:""}${form}
  ${env.persistent?"":`<p class="lead small">Achtung: Dieser Browser kann nichts dauerhaft speichern.</p>`}`;
}

function padHTML(label="Schuss!"){return `<div class="pad">${[1,2,3,"del",4,5,6,0,7,8,9,"ok"].map(k=>k==="del"?`<button data-k="del" aria-label="Löschen">⌫</button>`:k==="ok"?`<button class="ok" data-k="ok">${label}</button>`:`<button data-k="${k}">${k}</button>`).join("")}</div>`;}
function inputHTML(T,G){
  if(NEW_TYPES.includes(T.type))return newInputHTML(T,G);
  const label=G.pack&&G.phase==="solve"?"Eintragen":G.pack&&G.phase==="edit"?"Ändern":"Schuss!";
  if(T.type==="num"){let h=`<div class="ans" aria-live="polite">${G.done?G.given:(G.input||"&nbsp;")}</div>`;if(!G.done)h+=padHTML(label);return h;}
  if(T.type==="pair"){const v=G.done?G.given:G.inp;let h=`<div class="pairrow"><span class="ans ${!G.done&&G.act===0?"act":""}" data-slot="0" role="button" aria-label="${T.labels[0]}">${v[0]||"&nbsp;"}</span><span>Rest</span><span class="ans ${!G.done&&G.act===1?"act":""}" data-slot="1" role="button" aria-label="${T.labels[1]}">${v[1]||"&nbsp;"}</span></div>`;
    if(!G.done)h+=padHTML(label);return h;}
  if(T.type==="choice")return `<div class="choices">${T.choices.map(ch=>{let cl="";if(G.done){if(ch===T.a)cl="right";else if(ch===G.given)cl="wrong";}return `<button class="${cl}" data-c="${ch.replace(/"/g,"&quot;")}" ${G.done?"disabled":""} ${T.small?'style="font-size:1.15rem;font-weight:400"':""}>${ch}</button>`;}).join("")}</div>`;
  let h=`<div class="chips">${T.words.map((w,i)=>{let cl="";if(G.done){if(i===T.a)cl="right"+(T.mark?" pick":"");else if(i===G.given)cl="wrong";}else if(i===G.pickIdx)cl="pick";return `<button class="${cl}" data-w="${i}" ${G.done?"disabled":""}>${w}</button>`;}).join("")}</div>`;
  if(!G.done)h+=`<button class="btn" id="tapok" ${G.pickIdx<0?'disabled style="opacity:.5"':""}>${T.tapLabel}</button>`;return h;
}

// Antwort im Kontroll-Pfiff: bei Bildern das Bild selbst (Farbkasten, Emoji, Ziffer), sonst Text
function givenHTML(T,val){
  if(T.type==="pic"&&T.tiles[val]&&T.tiles[val].k!=="dir")return `${tileHTML(T.tiles[val],false)} ${esc(T.tiles[val].name||"")}`;
  return esc(givenText(T,val));
}
// Kontroll-Pfiff: Übersicht aller Antworten des Päckchens, je Aufgabe Probe und Ändern. Noch keine Rückmeldung richtig oder falsch.
function checkHTML(s,G){
  const L=LIGEN[G.li],rows=G.tasks.map((T,i)=>`<div class="crow"><div class="chead"><span class="cno">${i+1}</span><span class="cq">${T.q}${T.speak?" "+speakBtn(T.speak):""}</span><span class="cval" aria-label="Deine Antwort">${givenHTML(T,G.finals[i])}</span></div>
    ${T.vis?`<div class="vis sm">${T.vis}</div>`:""}${T.listen?`<div class="row">${speakBtn(T.say,"big")}<span class="note">Wort noch einmal anhören</span></div>`:""}
    <div class="row"><button class="helpbtn" data-probe="${i}">Probe</button><button class="btn ghost sm" data-edit="${i}">Antwort ändern</button></div>
    ${G.probeOpen[i]?`<div class="bubble probebox" role="status">${probeHTML(T,G.finals[i])}</div>`:""}</div>`).join("");
  return `<div class="hud"><button class="btn ghost" id="home" style="font-size:1rem;padding:8px 14px">Kabine</button><div class="score">${esc(s.profile.name)} · Päckchen</div><div class="dots">${G.tasks.map(()=>'<i class="set"></i>').join("")}</div></div>
    <section class="card check"><div class="tag">${L.name} · ${TOPICS[G.topic]} · Kontroll-Pfiff</div>
    <h2 class="cheer2">Kontroll-Pfiff!</h2>
    <p class="q" style="font-size:1.3rem">Schau dein Päckchen noch einmal genau an. Tippe bei jeder Aufgabe auf „Probe“ und rechne oder prüfe selbst nach. Wenn etwas nicht stimmt, darfst du die Antwort ändern.</p>
    ${rows}
    <p class="note">Jeder Fehler, den du selbst findest und richtig verbesserst, gibt ${BONUS_FIX} Bonuspunkte.</p>
    <div class="row"><button class="btn" id="ctlDone">Ich habe kontrolliert ✓</button><button class="btn ghost sm" id="ctlSkip">Ohne Kontrolle abgeben</button></div></section>`;
}

export function playHTML(s,G,trainers=[defaultTrainer(),defaultTrainer2()]){
  if(G.pack&&G.phase==="check")return checkHTML(s,G);
  const T=G.task,c=G.res.filter(Boolean).length,m=G.res.length-c,L=LIGEN[G.li];
  const blind=G.pack&&(G.phase==="solve"||G.phase==="edit"); // im Päckchen vor der Auswertung keine Rückmeldung
  const dots=blind?Array.from({length:G.len},(_,i)=>`<i class="${G.phase==="edit"||i<G.i?"set":i===G.i?"now":""}"></i>`).join("")
    :Array.from({length:G.len},(_,i)=>`<i class="${i<G.res.length?(G.res[i]?"ok":"no"):i===G.i?"now":""}"></i>`).join("");
  // Richtig: kurzes Overlay (Tor!), danach geht es von allein weiter. Falsch: witziger Fehlschuss, Erklärung, Weiter-Taste.
  let fb="",overlay="";
  if(G.done){
    const shot=G.shot||{kind:G.ok?"goal":"wide",side:1},look=lookOf(s.profile);
    if(G.ok)overlay=`<div class="ovl" id="ovl" role="status"><div class="ovlcard"><div class="ovltxt${G.fixedNow?" long":""}">${G.fixedNow?"Selbst gefunden, stark!":SHOT_TEXT.goal}</div>${sceneSVG(look,shot)}<div class="ovlplus">+${G.gain}${G.gain>10&&!G.fixedNow?" Serie!":""}${G.fixedNow?` (mit ${BONUS_FIX} Bonus)`:""}</div></div></div>`;
    else fb=`<div class="fb no">${sceneSVG(look,shot)}<div class="fbtxt"><span class="big">${SHOT_TEXT[shot.kind]}</span></div></div>`+coachHTML({T,G,trainers})+`<button class="btn" id="next">${G.i+1>=G.len?"Abpfiff":"Weiter"}</button>`;
  }
  let coach=G.done||G.phase==="edit"?"":coachHTML({T,G,trainers});
  const isMini=coach.startsWith('<div class="coach mini"'),mini=isMini?coach:"";if(isMini)coach="";
  const tag=G.pack?(G.phase==="edit"?`${L.name} · Antwort ändern · Aufgabe ${G.ei+1} von ${G.len} · ${TOPICS[T.topic]}`:G.phase==="solve"?`${L.name} · Päckchen · Aufgabe ${G.i+1} von ${G.len} · ${TOPICS[T.topic]}`:`${L.name} · Auswertung · Aufgabe ${G.i+1} von ${G.len} · ${TOPICS[T.topic]}`)
    :`${L.name}${G.trial?" · Schnuppern":""} · Aufgabe ${G.i+1} von ${G.len} · ${TOPICS[T.topic]}`;
  const edit=G.phase==="edit"?`<p class="note">Deine Antwort war: <b>${esc(givenText(T,G.finals[G.ei]))}</b></p>${G.probeOpen[G.ei]?`<div class="bubble probebox" role="status">${probeHTML(T,G.finals[G.ei])}</div>`:""}`:"";
  const foot=G.phase==="edit"?`<button class="btn ghost" id="editBack">Zurück zur Kontrolle</button>`:"";
  const tip=G.pack&&G.phase==="solve"?"Schreibe erst alle Aufgaben des Päckchens. Danach kontrollierst du sie selbst.":"Lies zuerst das gelb markierte Wort. Dann erst schießen!";
  return `<div class="hud"><button class="btn ghost" id="home" style="font-size:1rem;padding:8px 14px">Kabine</button>
    <div class="score">${blind?`${esc(s.profile.name)} · Päckchen`:`${esc(s.profile.name)} <em>${c}</em> : <em>${m}</em> ${G.rival}`}</div><div class="dots">${dots}</div></div>
    <section class="card"><div class="cardtop"><div class="tag">${tag}</div>${mini}</div>
    <p class="q">${T.q}${T.speak?" "+speakBtn(T.speak):""}</p>${T.late?`<p class="note late">Das hattest du vielleicht noch nicht in der Schule. Raten ist okay: Ein falscher Tipp zählt dann nicht.</p>`:""}${T.vis?`<div class="vis">${T.vis}</div>`:""}${edit}${coach}${inputHTML(T,G)}${fb}${foot}</section>${overlay}
    <p class="lead small" style="color:#fff">${tip}</p>`;
}

export function resultHTML(s,G,UI){
  const c=G.res.filter(Boolean).length,n=G.len,m=n-c,L=LIGEN[G.li];
  const pk=G.pack?G.grade:null,head=G.trial?"Schnuppertraining vorbei":c===n?"Perfektes Spiel!":c/n>=.6?"Sieg!":c/n>=.5?"Unentschieden":"Heute verloren. Nächstes Mal klappt es!";
  const st=leagueState(s,G.li);let info="";
  if(G.trial)info=`<p>So fühlt sich die ${L.name} an. Freispielen kannst du sie in der ${LIGEN[G.li-1].name}.</p>`;
  else if(st==="probe")info=`<p>Probetraining in der ${L.name}: noch ${budgetOf(s,G.li)} Aufgaben.</p>`;
  else if(st==="wait")info=`<p>Probetraining geschafft! Jetzt müssen Mama oder Papa die ${L.name} freigeben.</p>`;
  return boardHTML(s)+`<section class="card result"><h2>${head}</h2>
    <div class="final"><span class="team">${esc(s.profile.name)}<small>Heim</small></span><span>${c} : ${m}</span><span class="team">${G.rival}<small>Gast</small></span></div>
    <p class="q" style="font-size:1.4rem">+${G.pts} Punkte${G.bonus?` (davon ${G.bonus} Bonus)`:""}</p>
    ${pk?(G.checked?(pk.fixed?`<div class="celebrate">Kontroll-Pfiff: Du hast ${pk.fixed} Fehler selbst gefunden und verbessert. Stark! (+${pk.bonus} Bonus)</div>`:`<p>Kontroll-Pfiff gemacht. Gutes Kontrollieren!</p>`):`<p>Nächstes Mal kontrollierst du vor dem Abgeben. Dann gibt es Kontroll-Bonus.</p>`):""}
    ${UI.celebrate?`<div class="celebrate">${UI.celebrate}</div>`:""}${info}
    ${G.newSticker!==null?`<p>Neuer Sticker für dein Album:</p><div class="newst">${stickerHTML(G.newSticker,true)}</div>`:G.trial?"":(c/n>=.6?"<p>Dein Album ist voll. Stark!</p>":"<p>Gewinne ein Spiel, dann bekommst du einen Sticker.</p>")}
    <div class="row" style="justify-content:center">${!G.trial&&playable(s,G.li)?`<button class="btn" id="again">Nächstes Spiel</button>`:""}<button class="btn ghost" id="home">Zur Kabine</button></div></section>`;
}
