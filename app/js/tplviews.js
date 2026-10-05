// Darstellung des Baukastens "Eigenes Trainingslager" im Eltern-Bereich (ab 1.7.3): Liste der Vorlagen mit Schalter je Konto und der Editor.
// Reine Darstellung, kennt weder Speicher noch Netz. Alle Namen laufen durch esc().
import {esc} from "./util.js";
import {ITEM_LIST,BONUS_KINDS,BONUS_NAMES,HALF_CHOICES,UNIT_MIN,UNIT_MAX,NAME_MAX,entriesOf} from "./custom.js";
import {campOn,campDone,campBadge} from "./rules.js";
import {CAMPS} from "./camp.js";

const toggle=(attr,val,label,on)=>`<button class="segb ${on?"on":""}" ${attr}="${esc(val)}" aria-pressed="${on}">${esc(label)}</button>`;
const choice=(key,list,cur,label=x=>String(x))=>`<span class="seg">${list.map(v=>toggle("data-atplset",key+":"+v,label(v),String(v)===String(cur))).join("")}</span>`;

// Editor für einen Entwurf d (siehe custom.js: newDraft, draftOf)
export function tplEditorHTML(d){
  const groups=[...new Set(ITEM_LIST.map(x=>x.fach))];
  const items=groups.map(f=>`<h5 class="gl3">${esc(f)}</h5><div class="seg wrapseg">${ITEM_LIST.filter(x=>x.fach===f).map(x=>toggle("data-atplitem",x.id,x.name,d.items.includes(x.id))).join("")}</div>`).join("");
  return `<section class="panel tpleditor"><h3>${d.id?"Vorlage bearbeiten":"Neue Vorlage"}</h3>
    <div class="setrow"><span>Name</span><input id="tplName" type="text" maxlength="${NAME_MAX}" autocomplete="off" value="${esc(d.name)}" aria-label="Name des Trainingslagers" placeholder="zum Beispiel 9er Reihe" style="letter-spacing:0;width:240px"></div>
    <p class="note">Themen und Aufgabenarten (mindestens eins). Jede Einheit mischt die gewählten Arten.</p>${items}
    ${d.plan?`<p class="note">Diese Vorlage hat einen festen Ablauf je Einheit. Ändert ihr die Auswahl oder die Zahl der Einheiten, mischt jede Einheit wieder alles.</p>`:""}
    <p class="note">Reihen für alle Aufgaben mit Mal und Geteilt. Die Einstellung des Kontos gilt immer, hier lässt sich nur weiter einengen. Keine Auswahl heißt: alle Reihen des Kontos.</p>
    <div class="seg wrapseg">${[1,2,3,4,5,6,7,8,9,10].map(r=>toggle("data-atplrow",String(r),String(r),d.rows.includes(r))).join("")}</div>
    <div class="setrow"><span>Auch mal 0</span>${choice("zero",["inherit","off"],d.zero,v=>v==="off"?"Ohne 0":"Wie im Konto")}</div>
    <div class="setrow"><span>Einheiten</span>${choice("units",[1,2,3,4,5].filter(n=>n>=UNIT_MIN&&n<=UNIT_MAX),d.units)}</div>
    <div class="setrow"><span>Aufgaben je Halbzeit</span>${choice("half",HALF_CHOICES,d.half)}</div>
    <div class="setrow"><span>Nachspielzeit</span>${choice("bonus",BONUS_KINDS,d.bonus,v=>BONUS_NAMES[v])}</div>
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
      <div class="row"><button class="btn ghost sm" data-atplcopy="${esc(e.id)}">Kopieren</button>${e.builtin?"":`<button class="btn ghost sm" data-atpledit="${esc(e.id)}">Bearbeiten</button><button class="btn warn sm" data-aask="${esc(ask)}">Löschen</button>`}</div>
      ${A.confirm===ask?`<div class="confirm"><p>Die Vorlage <b>${esc(e.name)}</b> wirklich löschen? Konten, die schon Einheiten gespielt haben, behalten ihr Lager und ihren Fortschritt, bis es dort ausgeschaltet wird.</p><div class="row"><button class="btn warn" data-ado>Ja, löschen</button><button class="btn ghost" data-acancel>Abbrechen</button></div></div>`:""}</div>`;
  }).join("");
  return `<section class="panel"><h3>Eigene Trainingslager</h3>
    <p class="note">Stellt Trainingslager aus Themen und Aufgabenarten zusammen. Die Vorlagen gelten für alle Konten, der Schalter und der Fortschritt gelten je Konto. Ändert ihr eine Vorlage, läuft ein schon begonnenes Lager unverändert weiter, bis ihr es neu startet.</p>
    ${rows}<div class="row"><button class="btn" data-atplnew>Neue Vorlage</button></div></section>`;
}
