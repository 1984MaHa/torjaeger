// Eltern-Bereich: baut das HTML für Konten, Lernstand, Einstellungen sowie Sicherungen und System.
// Reine Darstellung, kennt weder Speicher noch Netz. Alle Namen laufen durch esc().
import {LIGEN,TOPICS,PROBE,MASTER_N,topicsOf} from "./content.js";
import {total,answersOf,helpOf} from "./model.js";
import {leagueState,budgetOf,topicSafe,safeCount,streakDays,settingsOf,stickerCount} from "./rules.js";
import {esc} from "./util.js";
import {avatarSVG} from "./avatardraw.js";
import {lookOf} from "./avatar.js";
import {trainerPanelHTML} from "./avatarui.js";

export const ADMIN_TABS=[["accounts","Konten"],["stand","Lernstand"],["settings","Einstellungen"],["system","Sicherungen und System"]];
export const ROUND_CHOICES=[6,8,10];
export const TRIAL_CHOICES=[2,3,5,8];
export const HINT_CHOICES=[[0,"Aus"],[20,"20 s"],[30,"30 s"],[45,"45 s"],[60,"60 s"],[90,"90 s"]];
const MODE={math:"Mathe",deu:"Deutsch",mix:"Mix"};

const pad=n=>String(n).padStart(2,"0");
export const fmtDateTime=iso=>{const d=new Date(iso);return isNaN(d)?"unbekannt":`${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())} Uhr`;};
export const fmtDay=key=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(key||"");return m?`${m[3]}.${m[2]}.${m[1]}`:esc(key||"");};
export const fmtSize=n=>n<1024?`${n} B`:n<1048576?`${(n/1024).toFixed(1).replace(".",",")} KB`:`${(n/1048576).toFixed(1).replace(".",",")} MB`;
export const fmtDur=s=>Number.isFinite(s)?`${Math.floor(s/60)}:${pad(s%60)} min`:"-";

const seg=(attr,options,current)=>`<span class="seg">${options.map(([v,l])=>`<button class="segb ${String(v)===String(current)?"on":""}" ${attr}="${esc(v)}" aria-pressed="${String(v)===String(current)}">${esc(l)}</button>`).join("")}</span>`;
const chips=(A)=>`<div class="achips" role="group" aria-label="Konto wählen">${A.accounts.filter(a=>a.state).map(a=>`<button class="achip ${a.id===A.sel?"on":""}" data-asel="${esc(a.id)}">${esc(a.name)}</button>`).join("")}</div>`;
const selAccount=A=>A.accounts.find(a=>a.id===A.sel&&a.state)||A.accounts.find(a=>a.state)||null;

// ---------- Konten ----------
function ligaRows(s,id){
  return LIGEN.slice(1).map((L,k)=>{const i=k+1,st=leagueState(s,i);
    const txt=st==="open"?"ganz frei":st==="probe"?`Probetraining, noch ${budgetOf(s,i)} von ${PROBE} Aufgaben`:st==="wait"?`Probetraining fertig (${PROBE} von ${PROBE}), wartet auf Freigabe`:"gesperrt";
    return `<div class="prow"><span><b>${esc(L.name)}</b> (${esc(L.klasse)}): ${txt}</span><span class="row">${st!=="open"?`<button class="btn sm" data-aopen="${id}:${i}">Ganz freigeben</button>`:""}${st!=="locked"?`<button class="btn ghost sm" data-alock="${id}:${i}">Sperren</button>`:""}</span></div>`;}).join("");
}
function accountCard(A,a){
  const id=esc(a.id),name=esc(a.name);
  if(!a.state)return `<section class="panel acard"><div class="lg-head"><b>${name}</b><span class="note">Wird vom Server geladen. Bitte kurz warten.</span></div></section>`;
  const s=a.state;
  const rename=A.renaming===a.id
    ?`<div class="pin"><input id="renameIn" type="text" maxlength="20" autocomplete="off" value="${name}" aria-label="Neuer Name" style="letter-spacing:0;width:190px"><button class="btn sm" data-arenameok="${id}">Speichern</button><button class="btn ghost sm" data-acancel>Abbrechen</button></div>`
    :`<button class="btn ghost sm" data-arename="${id}">Umbenennen</button>`;
  const ask=A.confirm===`reset:${a.id}`?`<div class="confirm"><p>Den Spielstand von <b>${name}</b> wirklich leeren? Punkte, Sticker, Ligen und Verlauf sind dann weg. Aussehen, Name und Einstellungen bleiben. Der Server legt vorher eine Sicherung an.</p><div class="row"><button class="btn warn" data-ado>Ja, zurücksetzen</button><button class="btn ghost sm" data-acancel>Abbrechen</button></div></div>`
    :A.confirm===`delete:${a.id}`?`<div class="confirm"><p>Das Konto <b>${name}</b> wirklich löschen? Es wird in den Papierkorb verschoben und ist auf allen Geräten weg. Zurückholen geht im Reiter „Sicherungen und System“.</p><div class="row"><button class="btn warn" data-ado>Ja, löschen</button><button class="btn ghost sm" data-acancel>Abbrechen</button></div></div>`:"";
  return `<section class="panel acard"><div class="lg-head"><div class="acct-id"><span class="av">${avatarSVG(lookOf(s.profile),{crop:"bust",px:48,label:"Spieler "+a.name})}</span><span><b>${name}</b><span class="k">${total(s,"points")} Punkte · ${total(s,"rounds")} Spiele · ${stickerCount(s)} Sticker</span></span></div>${rename}</div>
    <div class="parent">${ligaRows(s,a.id)}</div>
    <div class="row"><button class="btn warn" data-aask="reset:${id}">Zurücksetzen</button><button class="btn warn" data-aask="delete:${id}">Löschen</button></div>${ask}</section>`;
}
function accountsTab(A){
  const cards=A.accounts.map(a=>accountCard(A,a)).join("");
  return `${cards||`<p class="lead">Es gibt noch kein Konto.</p>`}
  <section class="panel"><h3>Neues Konto</h3><div class="pin"><input id="aNewName" type="text" maxlength="20" autocomplete="off" placeholder="Name" aria-label="Name des neuen Kontos" style="letter-spacing:0;width:190px"><button class="btn sm" data-anew>Konto anlegen</button></div>
    <p class="small">Die Eltern-PIN gilt weiter für alle Konten. Gelöschte Konten liegen im Papierkorb.</p></section>`;
}

// ---------- Lernstand ----------
function standTab(A){
  const a=selAccount(A);
  if(!a)return `<p class="lead">Kein Konto mit Spielstand.</p>`;
  const s=a.state,days=s.progress.days||[];
  const summary=`<div class="sumrow"><span class="pill">${total(s,"points")} Punkte</span><span class="pill">${total(s,"rounds")} Spiele</span><span class="pill">${total(s,"wins")} Siege</span><span class="pill">${stickerCount(s)} Sticker</span><span class="pill">${days.length} Trainingstage, ${streakDays(s)} in Folge</span></div>`;
  let helpN=0,t1=0,t2=0;
  const rows=LIGEN.map((L,i)=>{
    const head=`<h4 class="gl">${esc(L.name)} (${esc(L.klasse)}) · ${safeCount(s,i)} von ${topicsOf(i).length} Themen sicher</h4>`;
    return head+topicsOf(i).map(t=>{
      const st=s.stats[t],l=st&&st.last?st.last.slice(-MASTER_N):[],k=l.reduce((x,e)=>x+e.ok,0),an=answersOf(s,t),h=helpOf(s,t);
      helpN+=h.n;t1+=h.t1;t2+=h.t2;
      const pct=an.a?Math.round(an.c/an.a*100):0;
      return `<div class="trow ${topicSafe(s,t)?"safe":""}"><span>${topicSafe(s,t)?"✓ ":""}${esc(TOPICS[t])}</span><span>${l.length?`${k}/${l.length}`:"-"}</span><span>${an.a?`${an.c}/${an.a} (${pct}%)`:"-"}</span><span>${h.n||h.t1||h.t2?`${h.n}× · ${h.t1}/${h.t2}`:"-"}</span></div>`;
    }).join("");
  }).join("");
  const table=`<div class="trow thead"><span>Thema</span><span>Letzte ${MASTER_N}</span><span>Gesamt</span><span>Hilfe</span></div>${rows}
    <p class="small">Letzte ${MASTER_N}: richtige Antworten der letzten ${MASTER_N} Aufgaben. Gesamt: alle Antworten. Hilfe: in wie vielen Aufgaben der Trainer half, dahinter wie oft der Tipp und die Erklärung aufgerufen wurden.</p>`;
  const games=(s.history||[]).slice(-12).reverse().map(h=>{
    const L=LIGEN.find(x=>x.id===h.liga);
    return `<div class="grow"><span>${fmtDay(h.d)}</span><span>${esc(L?L.name:h.liga)}</span><span>${esc(MODE[h.mode]||h.mode)}${h.trial?" (Schnuppern)":""}</span><span>${h.c} von ${h.n}${h.pts!==undefined?`, ${h.pts} P.`:""}</span><span>${fmtDur(h.dur)}</span></div>`;}).join("");
  const probes=LIGEN.slice(1).map((L,k)=>{const i=k+1,st=leagueState(s,i);return st==="probe"||st==="wait"?`<span class="pill">${esc(L.name)}: Probetraining, noch ${budgetOf(s,i)} von ${PROBE}</span>`:"";}).join("");
  return `${chips(A)}<section class="panel"><h3>${esc(a.name)}</h3>${summary}${probes?`<div class="sumrow">${probes}</div>`:""}
    <p class="small"><b>Hilfe vom Trainer:</b> ${helpN} Aufgaben mit Hilfe (${t1}× Tipp, ${t2}× Erklärung). Hilfe kostet keine Punkte.</p></section>
    <section class="panel"><h3>Themen</h3>${table}</section>
    <section class="panel"><h3>Letzte Spiele</h3>${games?`<div class="grow thead"><span>Datum</span><span>Liga</span><span>Modus</span><span>Ergebnis</span><span>Dauer</span></div>${games}`:`<p class="note">Noch kein Spiel beendet.</p>`}</section>
    <section class="panel"><h3>Trainingstage</h3>${days.length?`<div class="chipsT">${days.slice(-14).reverse().map(d=>`<span>${fmtDay(d)}</span>`).join("")}</div><p class="small">${days.length} Tage insgesamt, die letzten 14 sind aufgeführt.</p>`:`<p class="note">Noch kein Trainingstag.</p>`}</section>`;
}

// ---------- Einstellungen ----------
function settingsTab(A){
  const a=selAccount(A),st=a?settingsOf(a.state):null;
  const acct=a?`${chips(A)}<section class="panel"><h3>Einstellungen für ${esc(a.name)}</h3>
    <div class="setrow"><span>Ton</span>${seg("data-aset",[["sound:true","An"],["sound:false","Aus"]],`sound:${!!st.sound}`)}</div>
    <div class="setrow"><span>Aufgaben pro Runde</span>${seg("data-aset",ROUND_CHOICES.map(n=>[`perRound:${n}`,String(n)]),`perRound:${st.perRound}`)}</div>
    <div class="setrow"><span>Schnuppern: Aufgaben</span>${seg("data-aset",TRIAL_CHOICES.map(n=>[`trialN:${n}`,String(n)]),`trialN:${st.trialN}`)}</div>
    <div class="setrow"><span>Schnuppern nur 1× pro Tag</span>${seg("data-aset",[["trialDaily:true","An"],["trialDaily:false","Aus"]],`trialDaily:${!!st.trialDaily}`)}</div>
    <div class="setrow"><span>Tipp-Zeit: der Trainer meldet sich nach</span>${seg("data-aset",HINT_CHOICES.map(([n,l])=>[`hintAfter:${n}`,l]),`hintAfter:${st.hintAfter}`)}</div>
    <p class="small">Die Tipp-Zeit gilt, wenn bei einer Aufgabe so lange nichts angetippt wird. „Aus“ heißt: Der Trainer meldet sich nicht von selbst. Die Hilfe-Taste bleibt immer da.</p></section>`
    :`<p class="lead">Kein Konto mit Spielstand.</p>`;
  const pin=`<section class="panel"><h3>Eltern-PIN ändern</h3><p class="note">Die PIN gilt für alle Konten und alle Geräte. Die alte PIN wird gebraucht.</p>
    <div class="pin" style="margin-top:8px"><input id="aOldPin" type="password" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="Alte PIN" aria-label="Alte PIN"><input id="aNewPin" type="password" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="Neue PIN" aria-label="Neue PIN"><button class="btn sm" data-apin>PIN ändern</button></div></section>`;
  return `${acct}${trainerPanelHTML(A.tr1,1)}${trainerPanelHTML(A.tr2,2)}${pin}`;
}

// ---------- Sicherungen und System ----------
function backupRows(A){
  const S=A.server;
  if(S.state==="loading")return `<p class="note">Wird geladen …</p>`;
  if(S.state!=="ok")return `<p class="note">Der Server ist gerade nicht erreichbar. Die Listen gibt es nur mit Verbindung.</p><button class="btn ghost sm" data-areload>Noch einmal versuchen</button>`;
  const list=S.backups||[];
  const confirmRow=key=>A.confirm===`restore:${key}`?`<div class="confirm"><p>Diesen Stand wirklich zurückholen? Der aktuelle Stand des Kontos wird vorher gesichert. Alle Geräte übernehmen danach den zurückgeholten Stand.</p><div class="row"><button class="btn warn" data-ado>Ja, zurückholen</button><button class="btn ghost sm" data-acancel>Abbrechen</button></div></div>`:"";
  const btn=(key,label)=>`<button class="btn ghost sm" data-aask="restore:${esc(key)}">${label}</button>`;
  const row=(d,who,size,action,key)=>`<div class="brow"><span>${fmtDateTime(d)}</span><span>${who}</span><span>${fmtSize(size)}</span><span>${action}</span></div>${key?confirmRow(key):""}`;
  const trash=list.filter(b=>b.kind==="trash"),manual=list.filter(b=>b.kind==="manual"),deploy=list.filter(b=>b.kind==="pre-deploy"),
    daily=list.filter(b=>b.kind==="daily"),dsettings=list.filter(b=>b.kind==="daily-settings");
  const NOTE={"vor-wiederherstellen":"vor Wiederherstellen","vor-zuruecksetzen":"vor Zurücksetzen"};
  const dShow=A.moreDaily?daily:daily.slice(0,8);
  return `
  <h4 class="gl">Papierkorb (gelöschte Konten)</h4>${trash.length?trash.map(b=>row(b.date,esc(b.profileName),b.size,btn(b.key,"Zurückholen"),b.key)).join(""):`<p class="note">Leer.</p>`}
  <h4 class="gl">Sicherungen vor Aktionen (Zurücksetzen, Wiederherstellen)</h4>${manual.length?manual.map(b=>row(b.date,`${esc(b.profileName)} · ${esc(NOTE[b.note]||b.note)}`,b.size,btn(b.key,"Wiederherstellen"),b.key)).join(""):`<p class="note">Noch keine.</p>`}
  <h4 class="gl">Sicherungen vor Updates</h4>${deploy.length?deploy.map(b=>`<div class="brow"><span>${fmtDateTime(b.date)}</span><span>${b.items.length} Konto${b.items.length===1?"":"en"} (alles zusammen)</span><span>${fmtSize(b.size)}</span><span></span></div>`+b.items.map(it=>row(b.date,`&nbsp;&nbsp;${esc(it.profileName)}`,it.size,btn(it.key,"Wiederherstellen"),it.key)).join("")).join(""):`<p class="note">Noch keine.</p>`}
  <h4 class="gl">Tagessicherungen (30 Tage)</h4>${dShow.length?dShow.map(b=>row(b.date,esc(b.profileName),b.size,btn(b.key,"Wiederherstellen"),b.key)).join(""):`<p class="note">Noch keine.</p>`}
  ${daily.length>8?`<button class="btn ghost sm" data-amore>${A.moreDaily?"Weniger zeigen":`Alle ${daily.length} zeigen`}</button>`:""}
  ${dsettings.length?`<p class="small">Dazu gibt es ${dsettings.length} Tagessicherungen der Einstellungen (PIN). Sie werden von Hand zurückgespielt, siehe README.</p>`:""}
  <p class="small">Alles liegt auf der NAS in <code>data/</code>, auf derselben Platte. Hyper Backup ist noch nicht eingerichtet.</p>`;
}
function devicesRows(A){
  const S=A.server;
  if(S.state==="loading")return `<p class="note">Wird geladen …</p>`;
  if(S.state!=="ok")return `<p class="note">Nur mit Verbindung zum Server.</p>`;
  const list=S.devices||[];
  if(!list.length)return `<p class="note">Noch kein Gerät gemeldet.</p>`;
  return list.map(d=>{
    const me=d.id===A.deviceId,label=d.name||d.kind;
    const edit=A.renamingDevice===d.id
      ?`<div class="pin"><input id="devIn" type="text" maxlength="30" autocomplete="off" value="${esc(d.name)}" placeholder="${esc(d.kind)}" aria-label="Gerätename" style="letter-spacing:0;width:190px"><button class="btn sm" data-adrenameok="${esc(d.id)}">Speichern</button><button class="btn ghost sm" data-acancel>Abbrechen</button></div>`
      :`<button class="btn ghost sm" data-adrename="${esc(d.id)}">Name ändern</button>`;
    return `<div class="drow"><span><b>${esc(label)}</b>${d.name&&d.name!==d.kind?` <span class="small">(${esc(d.kind)})</span>`:""}${me?` <span class="badge cur">Dieses Gerät</span>`:""}<br><span class="small">Zuletzt gesehen: ${d.lastSeen?fmtDateTime(d.lastSeen):"unbekannt"}${d.lastPush?`, zuletzt Änderungen gesendet: ${fmtDateTime(d.lastPush)}`:""}</span></span>${edit}</div>`;}).join("");
}
function systemTab(A){
  const c=A.server.config||{};
  return `<section class="panel"><h3>Sicherungen</h3>${backupRows(A)}</section>
  <section class="panel"><h3>Geräte</h3><p class="note">Der Server merkt sich jedes Gerät, das sich abgleicht. Gib ihm einen Namen, dann erkennst du es wieder.</p>${devicesRows(A)}</section>
  <section class="panel"><h3>System</h3><div class="sysgrid">
    <span>App-Version</span><b>${esc(A.appVersion)}</b>
    <span>Server-Version</span><b>${c.serverVersion?esc(c.serverVersion):"unbekannt"}</b>
    <span>Schemaversion Konten</span><b>${c.schemaVersion!==undefined?`Server ${esc(c.schemaVersion)}, App ${esc(A.schema.app)}`:`App ${esc(A.schema.app)}`}</b>
    <span>Schemaversion global</span><b>${c.globalSchemaVersion!==undefined?`Server ${esc(c.globalSchemaVersion)}, App ${esc(A.schema.global)}`:`App ${esc(A.schema.global)}`}</b>
    <span>Umgebung</span><b>${A.previewLabel?`Vorschau (${esc(A.previewLabel)})`:"Live"}</b>
    <span>Speicher auf diesem Gerät</span><b>${A.persistent?"dauerhaft":"nur bis zum Schließen"}</b>
  </div></section>`;
}

export function adminHTML(A){
  const body=A.tab==="stand"?standTab(A):A.tab==="settings"?settingsTab(A):A.tab==="system"?systemTab(A):accountsTab(A);
  return `<div><h1 class="title">Eltern-Bereich</h1><p class="lead">Nur für Mama und Papa.</p></div>
  <nav class="atabs" aria-label="Bereiche">${ADMIN_TABS.map(([k,l])=>`<button class="atab ${A.tab===k?"on":""}" data-atab="${k}">${l}</button>`).join("")}</nav>
  ${A.msg?`<div class="amsg ${A.msg.t==="ok"?"ok":"err"}" role="status">${esc(A.msg.text)}</div>`:""}
  ${body}
  <div class="row"><button class="btn ghost" data-aclose>Eltern-Bereich schließen</button></div>`;
}

// Eingabe der Eltern-PIN auf der Seite „Wer spielt?“
export function adminAskHTML(msg){
  return `<section class="panel"><h3>Eltern</h3><p class="note">Bitte die Eltern-PIN eingeben.</p>
    <div class="pin" style="margin-top:8px"><input id="adminPin" type="password" inputmode="numeric" maxlength="4" autocomplete="off" aria-label="Eltern-PIN" placeholder="PIN"><button class="btn sm" id="adminGo">Öffnen</button><button class="btn ghost sm" id="adminCancel">Abbrechen</button></div>
    ${msg?`<p class="note">${esc(msg)}</p>`:""}</section>`;
}
