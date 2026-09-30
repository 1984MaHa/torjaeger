// Oberfläche „Mein Spieler“ (Farben, Rückennummer, Name, Vereinsname) und Einstellung für Trainer und Trainerin (Farben, Name).
// Reine Darstellung. Farbwerte kommen nur aus den Paletten in avatar.js, Texte laufen durch esc().
// Jede Farbauswahl ist ein Knopf mit data-av="Bereich:#farbe" (Spieler) bzw. data-atr="Nr:Bereich:#farbe" (Trainerteam).
import {KIT_KEYS,KIT_LABELS,KIT_COLORS,KIT_PRESETS,KID_TEMPLATES,COLOR_NAMES,POLO_COLORS,TRAINER_KEYS,TRAINER_LABELS,cleanLook,cleanTrainerLook,presetIndex} from "./avatar.js";
import {avatarSVG,trainerSVG} from "./avatardraw.js";
import {esc} from "./util.js";

const swatches=(A,key,colors,cur,label)=>`<div class="sws" role="group" aria-label="${esc(label)}">${colors.map(c=>`<button class="sw ${c===cur?"on":""}" ${A(key,c)} style="background:${c}" aria-label="${esc(label+": "+(COLOR_NAMES[c]||c))}" aria-pressed="${c===cur}"></button>`).join("")}</div>`;
const field=(label,inner)=>`<div class="avfield"><span class="avlabel">${esc(label)}</span>${inner}</div>`;

// D = {look, name, first, view (front oder back)}. look ist der Entwurf, gespeichert wird erst mit „Fertig“.
export function avatarBuilderHTML(D){
  const l=cleanLook(D.look),view=D.view==="back"?"back":"front";
  const A=(k,v)=>`data-av="${k}:${v}"`;
  const views=`<span class="seg">${[["front","Vorne"],["back","Hinten"]].map(([v,n])=>`<button class="segb ${v===view?"on":""}" data-avview="${v}" aria-pressed="${v===view}">${n}</button>`).join("")}</span>`;
  const tpls=KID_TEMPLATES.length>1?field("Figur",`<div class="tpls">${KID_TEMPLATES.map(t=>`<button class="tpl ${t.id===l.tpl?"on":""}" data-avtpl="${t.id}" aria-pressed="${t.id===l.tpl}">${avatarSVG({...l,tpl:t.id},{crop:"bust",px:72,label:"Figur "+t.name})}<span>${esc(t.name)}</span></button>`).join("")}</div>`):"";
  const pi=presetIndex(l);
  const presets=field("Vereinsfarben",`<div class="presets">${KIT_PRESETS.map((p,i)=>`<button class="preset ${i===pi?"on":""}" data-avpreset="${i}" aria-pressed="${i===pi}" aria-label="Vereinsfarben ${esc(p.name)}"><span class="pq">${KIT_KEYS.map(k=>`<i style="background:${p.kit[k]}"></i>`).join("")}</span><span>${esc(p.name)}</span></button>`).join("")}</div>`);
  const colors=KIT_KEYS.map(k=>field(KIT_LABELS[k],swatches(A,k,KIT_COLORS,l.kit[k],KIT_LABELS[k]))).join("");
  return `<div><h1 class="title">${D.first?"Dein Spieler":"Mein Spieler"}</h1><p class="lead">Wähle die Farben deiner Mannschaft. Hinten stehen dein Name und deine Nummer.</p></div>
  <section class="panel avstick"><div class="avprev">${avatarSVG(l,{px:230,view,label:view==="back"?"Spieler von hinten":"Spieler von vorn"})}</div>
    <div class="row" style="justify-content:center;margin-top:8px">${views}</div></section>
  <section class="panel"><h3>Farben</h3>${tpls}${presets}${colors}</section>
  <section class="panel"><h3>Nummer und Namen</h3>
    ${field("Rückennummer",`<div class="numpick"><button class="segb" data-avnum="-1" aria-label="Nummer kleiner">−</button><b class="numv" aria-live="polite">${esc(l.number)}</b><button class="segb" data-avnum="1" aria-label="Nummer größer">+</button></div>`)}
    ${field("Mein Name auf dem Trikot",`<input id="avShirtName" type="text" maxlength="10" autocomplete="off" value="${esc(l.shirtName)}" aria-label="Name auf dem Trikot" class="avinput">`)}
    ${field("Name der Mannschaft",`<input id="avTeam" type="text" maxlength="20" autocomplete="off" value="${esc(l.team)}" aria-label="Name der Mannschaft" class="avinput">`)}
    <p class="note">Der Name der Mannschaft steht in „Wer spielt?“, in der Kabine und auf der Anzeigetafel.</p></section>
  <div class="row"><button class="btn" id="avSave">Fertig</button><button class="btn ghost" id="${D.first?"avSkip":"avCancel"}">${D.first?"Später":"Abbrechen"}</button></div>`;
}

// Trainerteam: T = {name, look}, which = 1 (Trainer) oder 2 (Trainerin). Farben von Polo, Hose und Stutzen, dazu der Name.
export function trainerPanelHTML(T,which=1){
  const l=cleanTrainerLook(T&&T.look,which),name=T&&typeof T.name==="string"?T.name:(which===2?"Trainerin":"Trainer");
  const A=(k,v)=>`data-atr="${which}:${k}:${v}"`;
  const colors=TRAINER_KEYS.map(k=>field(TRAINER_LABELS[k],swatches(A,k,k==="polo"?POLO_COLORS:KIT_COLORS,l[k],TRAINER_LABELS[k]))).join("");
  return `<section class="panel"><h3>${which===2?"Trainerin":"Trainer"}</h3>
    ${which===1?`<p class="note">Trainer und Trainerin helfen in jeder Aufgabe. Sie sehen bei allen Konten gleich aus. Ihr könnt Namen und Farben der Kleidung ändern.</p>`:""}
    <div class="avprev">${trainerSVG(l,{px:150,which})}</div>
    ${field("Name",`<input id="trName${which}" type="text" maxlength="16" autocomplete="off" value="${esc(name)}" aria-label="Name" class="avinput">`)}
    ${colors}
    <div class="row"><button class="btn sm" data-atrsave="${which}">${which===2?"Trainerin":"Trainer"} speichern</button><button class="btn ghost sm" data-atrdefault="${which}">Zurück zur Vorgabe</button></div></section>`;
}
