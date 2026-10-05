// Darstellung des Baukastens "Eigenes Trainingslager" im Eltern-Bereich (ab 1.7.3): Liste der Vorlagen mit Schalter je Konto und der Editor.
// Reine Darstellung, kennt weder Speicher noch Netz. Alle Namen laufen durch esc().
import {esc} from "./util.js";
import {HALF_CHOICES as HALVES,ITEM_LIST,FACH_ORDER,usesRows,deletedTemplates,BONUS_KINDS,BONUS_NAMES,HALF_CHOICES,UNIT_MIN,UNIT_MAX,NAME_MAX,entriesOf} from "./custom.js";
import {campOn,campDone,campBadge} from "./rules.js";
import {CAMPS} from "./camp.js";

const toggle=(attr,val,label,on)=>`<button class="segb ${on?"on":""}" ${attr}="${esc(val)}" aria-pressed="${on}">${esc(label)}</button>`;
const choice=(key,list,cur,label=x=>String(x))=>`<span class="seg">${list.map(v=>toggle("data-atplset",key+":"+v,label(v),String(v)===String(cur))).join("")}</span>`;

// Editor für einen Entwurf d (siehe custom.js: newDraft, draftOf). Von oben nach unten: 1 Anzahl, 2 Fächer, 3 Themen und Aufgaben je Fach, 4 Reihen (nur wenn nötig), 5 Nachspielzeit, 6 Name.
export function tplEditorHTML(d){
  const fachs=d.fachs||FACH_ORDER.filter(f=>ITEM_LIST.some(x=>x.fach===f&&d.items.includes(x.id)));
  const total=d.units*2*d.half;
  const topics=fachs.length?fachs.map(f=>{const list=ITEM_LIST.filter(x=>x.fach===f),n=list.filter(x=>d.items.includes(x.id)).length;
    return `<div class="tplfach"><div class="setrow"><b>${esc(f)}</b><span class="k">${n} von ${list.length} gewählt</span><span><button class="btn ghost sm" data-atplall="${esc(f)}|on">Alle</button> <button class="btn ghost sm" data-atplall="${esc(f)}|off">Keine</button></span></div>
      <div class="seg wrapseg">${list.map(x=>toggle("data-atplitem",x.id,x.name,d.items.includes(x.id))).join("")}</div></div>`;}).join(""):`<p class="note">Wähle oben mindestens ein Fach.</p>`;
  return `<section class="panel tpleditor"><h3>${d.id?"Vorlage bearbeiten":"Neue Vorlage"}</h3>
    <h4 class="tplstep">1. Wie viele Aufgaben?</h4>
    <div class="setrow"><span>Aufgaben je Halbzeit</span>${choice("half",HALF_CHOICES,d.half)}</div>
    <div class="setrow"><span>Einheiten</span>${choice("units",[1,2,3,4,5].filter(n=>n>=UNIT_MIN&&n<=UNIT_MAX),d.units)}</div>
    <p class="note">Eine Einheit hat 2 Halbzeiten, also ${d.half*2} Aufgaben. Bei ${d.units} ${d.units===1?"Einheit":"Einheiten"} sind das ${total} Aufgaben.</p>
    <h4 class="tplstep">2. Welche Fächer?</h4>
    <div class="seg wrapseg">${FACH_ORDER.map(f=>toggle("data-atplfach",f,f,fachs.includes(f))).join("")}</div>
    <h4 class="tplstep">3. Welche Themen und Aufgaben?</h4>
    <p class="note">Jede Einheit mischt die gewählten Themen. Mindestens eins muss gewählt sein.</p>${topics}
    ${d.plan?`<p class="note">Diese Vorlage hat einen festen Ablauf je Einheit. Ändert ihr die Auswahl oder die Zahl der Einheiten, mischt jede Einheit wieder alles.</p>`:""}
    ${usesRows(d.items)?`<h4 class="tplstep">4. Welche Reihen?</h4>
    <p class="note">Für Aufgaben mit Mal und Geteilt. Nichts gewählt heißt: alle Reihen, die für das Konto eingestellt sind. Die Einstellung des Kontos gilt immer, hier lässt sich nur weiter einengen.</p>
    <div class="seg wrapseg">${[1,2,3,4,5,6,7,8,9,10].map(r=>toggle("data-atplrow",String(r),String(r),d.rows.includes(r))).join("")}</div>
    <div class="setrow"><span>Auch mal 0</span>${choice("zero",["inherit","off"],d.zero,v=>v==="off"?"Ohne 0":"Wie im Konto")}</div>`:""}
    <h4 class="tplstep">${usesRows(d.items)?"5":"4"}. Nachspielzeit</h4>
    <div class="seg wrapseg">${BONUS_KINDS.map(v=>toggle("data-atplset","bonus:"+v,BONUS_NAMES[v],d.bonus===v)).join("")}</div>
    <h4 class="tplstep">${usesRows(d.items)?"6":"5"}. Name</h4>
    <div class="setrow"><input id="tplName" type="text" maxlength="${NAME_MAX}" autocomplete="off" value="${esc(d.name)}" aria-label="Name des Trainingslagers" placeholder="zum Beispiel 9er Reihe" style="letter-spacing:0;width:260px"></div>
    <div class="row"><button class="btn" data-atplsave>Speichern</button><button class="btn ghost" data-atplcancel>Abbrechen</button></div></section>`;
}

// Liste der Vorlagen. A: {tpls (Entwurf: A.tpl), g (globaler Stand)}, a: Konto {id, name, state}, seg: Schalter-Baustein aus admin.js, confirm: Rückfrage
export function tplPanelHTML(A,a,g,seg){
  if(A.tpl)return tplEditorHTML(A.tpl);
  const s=a.state,rows=entriesOf(g).map(e=>{
    const on=campOn(s,e.campId),C=CAMPS[e.campId],prog=C?`${campDone(s,e.campId)} von ${C.units.length} Einheiten${campBadge(s,e.campId)?", Abzeichen":""}`:"";
    const switchHTML=e.special?`<span class="k">Schalter unten bei „Teilen mit Rest“</span>`:seg("data-atplon",[[`${a.id}|${e.campId}|on`,"An"],[`${a.id}|${e.campId}|off`,"Aus"]],`${a.id}|${e.campId}|${on?"on":"off"}`);
    const ask=`tpldel:${e.id}`;
    return `<div class="tplrow"><div class="tplhead"><b>${esc(e.name)}</b>${e.builtin?` <span class="pill">mitgeliefert</span>`:""}<span class="k">${esc(e.summary)}</span></div>
      <div class="setrow"><span>Für ${esc(a.name)}</span>${switchHTML}</div>${on&&prog?`<p class="small">Fortschritt: ${esc(prog)}.</p>`:""}
      ${e.builtin||e.special?"":`<div class="setrow"><span>Aufgaben je Halbzeit</span>${seg("data-atplhalf",HALVES.map(n=>[`${e.id}|${n}`,String(n)]),`${e.id}|${e.half}`)}</div>`}
      ${e.rows1?`<div class="setrow"><span>Dieselbe Vorlage für eine andere Reihe anlegen</span><span class="seg wrapseg">${[1,2,3,4,5,6,7,8,9,10].filter(r=>r!==e.rows1).map(r=>`<button class="segb" data-atplcopyrow="${esc(e.id)}|${r}" aria-label="${esc(e.name)} für die ${r}er Reihe kopieren">${r}</button>`).join("")}</span></div><p class="small">Tippe die Reihe, für die du dieses Lager auch haben möchtest (zum Beispiel 7 für die 7er Reihe). Es entsteht sofort eine eigene Vorlage mit gleichem Ablauf, die weiter unten in der Liste steht. Dort kannst du sie ändern und für ein Konto einschalten.</p>`:""}
      <div class="row"><button class="btn ghost sm" data-atplcopy="${esc(e.id)}">Kopieren</button>${e.builtin?"":`<button class="btn ghost sm" data-atpledit="${esc(e.id)}">Bearbeiten</button><button class="btn warn sm" data-aask="${esc(ask)}">Löschen</button>`}</div>
      ${A.confirm===ask?`<div class="confirm"><p>Die Vorlage <b>${esc(e.name)}</b> wirklich löschen? Konten, die schon Einheiten gespielt haben, behalten ihr Lager und ihren Fortschritt, bis es dort ausgeschaltet wird.</p><div class="row"><button class="btn warn" data-ado>Ja, löschen</button><button class="btn ghost" data-acancel>Abbrechen</button></div></div>`:""}</div>`;
  }).join("");
  return `<section class="panel"><h3>Eigene Trainingslager</h3>
    <p class="note">Stellt Trainingslager aus Themen und Aufgabenarten zusammen. Die Vorlagen gelten für alle Konten, der Schalter und der Fortschritt gelten je Konto. Ändert ihr eine Vorlage, läuft ein schon begonnenes Lager unverändert weiter, bis ihr es neu startet.</p>
    ${rows}<div class="row"><button class="btn" data-atplnew>Neue Vorlage</button></div>${restoreHTML(g)}</section>`;
}

// Gelöschte Vorlagen lassen sich zurückholen
function restoreHTML(g){
  const del=deletedTemplates(g);
  if(!del.length)return "";
  return `<h4 class="tplstep">Gelöschte Vorlagen</h4><p class="note">Hier lässt sich eine gelöschte Vorlage zurückholen.</p>${del.map(t=>`<div class="setrow"><span>${esc(t.name)}</span><button class="btn ghost sm" data-atplrestore="${esc(t.id)}">Zurückholen</button></div>`).join("")}`;
}
