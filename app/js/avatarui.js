// Oberfläche für Aussehen: Baukasten für den Spieler (beginnt mit Junge oder Mädchen) und Einstellung für Trainer und Trainerin.
// Reine Darstellung. Farbwerte kommen nur aus den Paletten in avatar.js, Texte laufen durch esc().
import {FACES,NOSES,BROWS,EYESHAPES,GLASSES,BUILDS,BODIES,EYE_COLORS,PATTERNS,COLLARS,MOUTHS,HATS,HAIR_STYLES,HAIR_COLORS,SKIN_TONES,SHIRT_COLORS,SHORTS_COLORS,BOOT_COLORS,JACKET_COLORS,TRAINER_HAIR,COLOR_NAMES,TEMPLATES,cleanLook,cleanTrainerLook,templateLook,startLook} from "./avatar.js";
import {avatarSVG,crestSVG,trainerSVG} from "./avatardraw.js";
import {esc} from "./util.js";

const swatches=(attr,colors,cur,label)=>`<div class="sws" role="group" aria-label="${label}">${colors.map(c=>`<button class="sw ${c===cur?"on":""}" ${attr}="${c}" style="background:${c}" aria-label="${COLOR_NAMES[c]||c}" aria-pressed="${c===cur}"></button>`).join("")}</div>`;
const opts=(attr,names,cur)=>`<span class="seg">${names.map((n,i)=>`<button class="segb ${i===cur?"on":""}" ${attr}="${i}" aria-pressed="${i===cur}">${n}</button>`).join("")}</span>`;
const field=(label,inner)=>`<div class="avfield"><span class="avlabel">${label}</span>${inner}</div>`;

// Erster Schritt: Junge oder Mädchen
function genderStep(D){
  const tiles=BODIES.map(([b,label])=>`<button class="gender" data-avbody="${b}" aria-label="${label}">${avatarSVG(startLook(b,D.name),{px:190,label})}<span>${label}</span></button>`).join("");
  return `<div><h1 class="title">Dein Spieler</h1><p class="lead">Wer bist du? Tippe auf dein Bild.</p></div>
  <section class="panel"><div class="genders">${tiles}</div></section>
  <div class="row"><button class="btn ghost" id="avSkip">Später</button></div>`;
}

// D = {look, name, first, step}. look ist der Entwurf, gespeichert wird erst mit „Fertig“.
export function avatarBuilderHTML(D){
  if(D.step==="gender")return genderStep(D);
  const l=cleanLook(D.look);
  const tpls=TEMPLATES.map((t,i)=>({t,i})).filter(x=>x.t.look.body===l.body).map(({t,i})=>`<button class="tpl" data-avtpl="${i}" aria-label="Vorlage ${esc(t.name)}">${avatarSVG(templateLook(i,D.name),{crop:"bust",px:84,label:"Vorlage "+t.name})}<span>${esc(t.name)}</span></button>`).join("");
  const hair=HAIR_STYLES[l.body].map((n,i)=>`<button class="hairb ${i===l.hair?"on":""}" data-avhair="${i}" aria-pressed="${i===l.hair}" aria-label="Frisur ${esc(n)}">${avatarSVG({...l,hair:i},{crop:"head",px:74,label:"Frisur "+n})}<span>${esc(n)}</span></button>`).join("");
  const hats=HATS.map((n,i)=>`<button class="hairb ${i===l.hat?"on":""}" data-avhat="${i}" aria-pressed="${i===l.hat}" aria-label="Kopfbedeckung ${esc(n)}">${avatarSVG({...l,hat:i},{crop:"head",px:74,label:"Kopfbedeckung "+n})}<span>${esc(n)}</span></button>`).join("");
  const faces=FACES.map((n,i)=>`<button class="hairb ${i===l.face?"on":""}" data-avface="${i}" aria-pressed="${i===l.face}" aria-label="Kopfform ${esc(n)}">${avatarSVG({...l,face:i,hat:0},{crop:"head",px:74,label:"Kopfform "+n})}<span>${esc(n)}</span></button>`).join("");
  const who=`<span class="seg">${BODIES.map(([b,label])=>`<button class="segb ${b===l.body?"on":""}" data-avbody="${b}" aria-pressed="${b===l.body}">${label}</button>`).join("")}</span>`;
  return `<div><h1 class="title">${D.first?"Dein Spieler":"Spieler ändern"}</h1><p class="lead">${D.first?"Bau dir deinen Spieler. Er schießt deine Tore. Du kannst das auch später machen.":"Ändere deinen Spieler, wie du magst."}</p></div>
  <section class="panel"><div class="avprev">${avatarSVG(l,{px:230,view:"front"})}${avatarSVG(l,{px:230,view:"back"})}<div class="avcrest">${crestSVG(l,64)}<span>${esc(l.team)}</span></div></div>
    <div class="row" style="justify-content:center;margin-top:8px">${who}</div></section>
  <section class="panel"><h3>Schneller Start</h3><p class="note">Tippe auf eine Vorlage. Danach kannst du alles ändern.</p><div class="tpls">${tpls}</div></section>
  <section class="panel"><h3>Aussehen</h3>
    ${field("Frisur",`<div class="hairs">${hair}</div>`)}
    ${field("Haarfarbe",swatches("data-avhc",HAIR_COLORS,l.hairColor,"Haarfarbe"))}
    ${field("Hautton",swatches("data-avskin",SKIN_TONES,l.skin,"Hautton"))}
    ${field("Kopfform",`<div class="hairs">${faces}</div>`)}
    ${field("Augenform",opts("data-aveyeshape",EYESHAPES,l.eyeShape))}
    ${field("Augenbrauen",opts("data-avbrows",BROWS,l.brows))}
    ${field("Nase",opts("data-avnose",NOSES,l.nose))}
    ${field("Sommersprossen",opts("data-avfreckles",["Ohne","Mit"],l.freckles))}
    ${field("Brille",opts("data-avglasses",GLASSES,l.glasses))}
    ${field("Statur",opts("data-avbuild",BUILDS,l.build))}
    ${field("Augenfarbe",swatches("data-aveyes",EYE_COLORS,l.eyes,"Augenfarbe"))}
    ${field("Gesicht",opts("data-avmouth",MOUTHS,l.mouth))}
  </section>
  <section class="panel"><h3>Kopfbedeckung</h3><p class="note">Cap, Mütze und Co. sind wählbar. Ohne Kopfbedeckung siehst du die Frisur.</p>
    ${field("Kopfbedeckung",`<div class="hairs">${hats}</div>`)}
    ${l.hat?field("Farbe der Kopfbedeckung",swatches("data-avhatc",SHIRT_COLORS,l.hatColor,"Farbe der Kopfbedeckung")):""}
  </section>
  <section class="panel"><h3>Trikot</h3>
    ${field("Trikotfarbe",swatches("data-avshirt",SHIRT_COLORS,l.shirt,"Trikotfarbe"))}
    ${field("Trikotmuster",opts("data-avpattern",PATTERNS,l.pattern))}
    ${field("Kragen",opts("data-avcollar",COLLARS,l.collar))}
    ${field("Hosenfarbe",swatches("data-avshorts",SHORTS_COLORS,l.shorts,"Hosenfarbe"))}
    ${field("Stutzenfarbe",swatches("data-avsocks",SHIRT_COLORS,l.socks,"Stutzenfarbe"))}
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

// Ein- und Aus-Schalter
const toggle=(which,key,on,label)=>`<span class="seg"><button class="segb ${on?"":"on"}" data-atr="${which}:${key}:0" aria-pressed="${!on}">Ohne ${label}</button><button class="segb ${on?"on":""}" data-atr="${which}:${key}:1" aria-pressed="${!!on}">Mit ${label}</button></span>`;

// T = {name, look}, which = 1 (Trainer) oder 2 (Trainerin). Wird im Eltern-Bereich (Einstellungen) angezeigt.
export function trainerPanelHTML(T,which=1){
  const l=cleanTrainerLook(T&&T.look,which),name=T&&typeof T.name==="string"?T.name:(which===2?"Trainerin":"Trainer");
  const hairs=`<span class="seg">${TRAINER_HAIR.map((n,i)=>`<button class="segb ${i===l.hair?"on":""}" data-atr="${which}:hair:${i}" aria-pressed="${i===l.hair}">${n}</button>`).join("")}</span>`;
  return `<section class="panel"><h3>${which===2?"Trainerin":"Trainer"}</h3>
    ${which===1?`<p class="note">Trainer und Trainerin helfen in jeder Aufgabe. Sie sehen bei allen Konten gleich aus.</p>`:""}
    <div class="avprev">${trainerSVG(l,{px:150,which})}</div>
    ${field("Name",`<input id="trName${which}" type="text" maxlength="16" autocomplete="off" value="${esc(name)}" aria-label="Name" class="avinput">`)}
    ${field("Frisur",hairs)}
    ${field("Haarfarbe",swatches("data-atr-c",HAIR_COLORS.map(c=>c),l.hairColor,"Haarfarbe").replace(/data-atr-c="([^"]+)"/g,(m,c)=>`data-atr="${which}:hairColor:${c}"`))}
    ${field("Hautton",swatches("data-atr-c",SKIN_TONES,l.skin,"Hautton").replace(/data-atr-c="([^"]+)"/g,(m,c)=>`data-atr="${which}:skin:${c}"`))}
    ${field("Jacke",swatches("data-atr-c",JACKET_COLORS,l.jacket,"Farbe der Jacke").replace(/data-atr-c="([^"]+)"/g,(m,c)=>`data-atr="${which}:jacket:${c}"`))}
    ${field("Brille",toggle(which,"glasses",l.glasses,"Brille"))}
    ${field("Bart",toggle(which,"beard",l.beard,"Bart"))}
    ${field("Ohrringe",toggle(which,"earrings",l.earrings,"Ohrringen"))}
    <div class="row"><button class="btn sm" data-atrsave="${which}">${which===2?"Trainerin":"Trainer"} speichern</button><button class="btn ghost sm" data-atrdefault="${which}">Zurück zur Vorgabe</button></div></section>`;
}
