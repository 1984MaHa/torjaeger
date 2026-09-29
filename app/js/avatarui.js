// Oberfläche für Aussehen: Baukasten für den Spieler und Einstellung für den Trainer.
// Reine Darstellung. Farbwerte kommen nur aus den Paletten in avatar.js, Texte laufen durch esc().
import {HAIR_STYLES,HAIR_COLORS,SKIN_TONES,SHIRT_COLORS,SHORTS_COLORS,BOOT_COLORS,CAP_COLORS,JACKET_COLORS,COLOR_NAMES,TEMPLATES,cleanLook,cleanTrainerLook,templateLook} from "./avatar.js";
import {avatarSVG,crestSVG,trainerSVG} from "./avatardraw.js";
import {esc} from "./util.js";

const swatches=(attr,colors,cur,label)=>`<div class="sws" role="group" aria-label="${label}">${colors.map(c=>`<button class="sw ${c===cur?"on":""}" ${attr}="${c}" style="background:${c}" aria-label="${COLOR_NAMES[c]||c}" aria-pressed="${c===cur}"></button>`).join("")}</div>`;
const field=(label,inner)=>`<div class="avfield"><span class="avlabel">${label}</span>${inner}</div>`;

// D = {look, name, first}. look ist der Entwurf, gespeichert wird erst mit „Fertig“.
export function avatarBuilderHTML(D){
  const l=cleanLook(D.look);
  const tpls=TEMPLATES.map((t,i)=>`<button class="tpl" data-avtpl="${i}" aria-label="Vorlage ${esc(t.name)}">${avatarSVG(templateLook(i,D.name),{crop:"bust",px:58,label:"Vorlage "+t.name})}<span>${esc(t.name)}</span></button>`).join("");
  const hair=HAIR_STYLES.map((n,i)=>`<button class="hairb ${i===l.hair?"on":""}" data-avhair="${i}" aria-pressed="${i===l.hair}" aria-label="Frisur ${esc(n)}">${avatarSVG({...l,hair:i},{crop:"head",px:54,label:"Frisur "+n})}<span>${esc(n)}</span></button>`).join("");
  return `<div><h1 class="title">${D.first?"Dein Spieler":"Spieler ändern"}</h1><p class="lead">${D.first?"Bau dir deinen Spieler. Er schießt deine Tore. Du kannst das auch später machen.":"Ändere deinen Spieler, wie du magst."}</p></div>
  <section class="panel"><div class="avprev">${avatarSVG(l,{px:200,view:"front"})}${avatarSVG(l,{px:200,view:"back"})}<div class="avcrest">${crestSVG(l,64)}<span>${esc(l.team)}</span></div></div></section>
  <section class="panel"><h3>Schneller Start</h3><p class="note">Tippe auf eine Vorlage. Danach kannst du alles ändern.</p><div class="tpls">${tpls}</div></section>
  <section class="panel"><h3>Aussehen</h3>
    ${field("Frisur",`<div class="hairs">${hair}</div>`)}
    ${field("Haarfarbe",swatches("data-avhc",HAIR_COLORS,l.hairColor,"Haarfarbe"))}
    ${field("Hautton",swatches("data-avskin",SKIN_TONES,l.skin,"Hautton"))}
  </section>
  <section class="panel"><h3>Trikot</h3>
    ${field("Trikotfarbe",swatches("data-avshirt",SHIRT_COLORS,l.shirt,"Trikotfarbe"))}
    ${field("Hosenfarbe",swatches("data-avshorts",SHORTS_COLORS,l.shorts,"Hosenfarbe"))}
    ${field("Schuhfarbe",swatches("data-avboots",BOOT_COLORS,l.boots,"Schuhfarbe"))}
    ${field("Rückennummer",`<div class="numpick"><button class="segb" data-avnum="-1" aria-label="Nummer kleiner">−</button><b class="numv" aria-live="polite">${esc(l.number)}</b><button class="segb" data-avnum="1" aria-label="Nummer größer">+</button></div>`)}
    ${field("Name auf dem Trikot",`<input id="avShirtName" type="text" maxlength="10" autocomplete="off" value="${esc(l.shirtName)}" aria-label="Name auf dem Trikot" class="avinput">`)}
  </section>
  <section class="panel"><h3>Mannschaft</h3>
    ${field("Name der Mannschaft",`<input id="avTeam" type="text" maxlength="20" autocomplete="off" value="${esc(l.team)}" aria-label="Name der Mannschaft" class="avinput">`)}
    ${field("Vereinsfarbe 1",swatches("data-avc1",SHIRT_COLORS,l.c1,"Vereinsfarbe 1"))}
    ${field("Vereinsfarbe 2",swatches("data-avc2",SHIRT_COLORS,l.c2,"Vereinsfarbe 2"))}
  </section>
  <div class="row"><button class="btn" id="avSave">Fertig</button><button class="btn ghost" id="${D.first?"avSkip":"avCancel"}">${D.first?"Später":"Abbrechen"}</button></div>`;
}

// T = {name, look}. Wird im Eltern-Bereich (Einstellungen) angezeigt.
export function trainerPanelHTML(T){
  const l=cleanTrainerLook(T&&T.look),name=T&&typeof T.name==="string"?T.name:"Trainer Papa";
  return `<section class="panel"><h3>Trainer</h3>
    <p class="note">Der Trainer ist in jeder Aufgabe da und hilft. Er sieht bei allen Konten gleich aus.</p>
    <div class="avprev">${trainerSVG(l,{px:130})}</div>
    ${field("Name",`<input id="trName" type="text" maxlength="16" autocomplete="off" value="${esc(name)}" aria-label="Name des Trainers" class="avinput">`)}
    ${field("Kappe",swatches("data-atrcap",CAP_COLORS,l.cap,"Farbe der Kappe"))}
    ${field("Jacke",swatches("data-atrjacket",JACKET_COLORS,l.jacket,"Farbe der Jacke"))}
    ${field("Hautton",swatches("data-atrskin",SKIN_TONES,l.skin,"Hautton"))}
    ${field("Haarfarbe",swatches("data-atrhair",HAIR_COLORS,l.hairColor,"Haarfarbe"))}
    ${field("Bart",`<span class="seg"><button class="segb ${l.beard?"":"on"}" data-atrbeard="0" aria-pressed="${!l.beard}">Ohne</button><button class="segb ${l.beard?"on":""}" data-atrbeard="1" aria-pressed="${!!l.beard}">Mit Bart</button></span>`)}
    <div class="row"><button class="btn sm" data-atrsave>Trainer speichern</button><button class="btn ghost sm" data-atrdefault>Zurück zur Vorgabe</button></div></section>`;
}
