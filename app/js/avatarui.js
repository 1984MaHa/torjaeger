// Oberfläche für Aussehen: geführter Baukasten für den Spieler (6 Schritte) und Einstellung für Trainer und Trainerin.
// Reine Darstellung. Farbwerte kommen nur aus den Paletten in avatar.js, Texte laufen durch esc().
// Jede Auswahl ist ein Knopf mit data-av="Feld:Wert" (Spieler) bzw. data-atr="Nr:Feld:Wert" (Trainerteam).
import {FACES,NOSES,BROWS,EYESHAPES,GLASSES,BUILDS,BODIES,EYE_COLORS,PATTERNS,COLLARS,MOUTHS,HATS,OUTFITS,BEARDS,GEARS,HAIR_COLORS,SKIN_TONES,SHIRT_COLORS,SHORTS_COLORS,BOOT_COLORS,BG_COLORS,JACKET_COLORS,COLOR_NAMES,TEMPLATES,STEPS,hairList,hairName,cleanLook,cleanTrainerLook,templateLook,startLook} from "./avatar.js";
import {avatarSVG,crestSVG,trainerSVG} from "./avatardraw.js";
import {esc} from "./util.js";

// Felder, deren Wert eine Zahl ist (alles andere ist Text: Farbe oder Frisur)
export const NUM_KEYS=["face","eyeShape","brows","nose","mouth","freckles","cheeks","glasses","hat","build","outfit","pattern","collar","beard","earrings","gear"];

const swatches=(A,key,colors,cur,label,auto)=>`<div class="sws" role="group" aria-label="${label}">${auto?`<button class="sw auto ${cur===""?"on":""}" ${A(key,"")} aria-label="${auto}" aria-pressed="${cur===""}">${esc(auto)}</button>`:""}${colors.map(c=>`<button class="sw ${c===cur?"on":""}" ${A(key,c)} style="background:${c}" aria-label="${COLOR_NAMES[c]||c}" aria-pressed="${c===cur}"></button>`).join("")}</div>`;
const opts=(A,key,names,cur)=>`<span class="seg">${names.map((n,i)=>`<button class="segb ${i===cur?"on":""}" ${A(key,i)} aria-pressed="${i===cur}">${n}</button>`).join("")}</span>`;
const field=(label,inner)=>`<div class="avfield"><span class="avlabel">${label}</span>${inner}</div>`;
const tiles=(A,key,items,cur,prev,what)=>`<div class="hairs">${items.map(([v,n])=>`<button class="hairb ${v===cur?"on":""}" ${A(key,v)} aria-pressed="${v===cur}" aria-label="${what} ${esc(n)}">${prev({[key]:v},what+" "+n)}<span>${esc(n)}</span></button>`).join("")}</div>`;
const nameList=a=>a.map((n,i)=>[i,n]);

// Bedienelemente eines Schrittes. adult: Trainerteam (Bart, Merkmal, Ohrringe). Gibt HTML zurück.
function stepControls(step,l,A,prev,adult){
  const H=hairList(adult?"j":l.body).map(k=>[k,hairName(k)]);
  const hatColor=l.hat?field("Farbe der Kopfbedeckung",swatches(A,"hatColor",SHIRT_COLORS,l.hatColor,"Farbe der Kopfbedeckung")):"";
  if(step===2)return `${field("Kopfform",tiles(A,"face",nameList(FACES),l.face,prev,"Kopfform"))}
    ${field("Hautton",swatches(A,"skin",SKIN_TONES,l.skin,"Hautton"))}
    ${adult?"":field("Körperbau",opts(A,"build",BUILDS,l.build))}`;
  if(step===3)return `${field("Frisur",tiles(A,"hair",H,l.hair,prev,"Frisur"))}
    ${field("Haarfarbe",swatches(A,"hairColor",HAIR_COLORS,l.hairColor,"Haarfarbe"))}
    ${field("Augenbrauen: Farbe",swatches(A,"browColor",HAIR_COLORS,l.browColor,"Farbe der Augenbrauen","Wie die Haare"))}`;
  if(step===4)return `${field("Augenform",opts(A,"eyeShape",EYESHAPES,l.eyeShape))}
    ${field("Augenfarbe",swatches(A,"eyes",EYE_COLORS,l.eyes,"Augenfarbe"))}
    ${field("Mund",tiles(A,"mouth",nameList(MOUTHS),l.mouth,prev,"Mund"))}
    ${field("Nase",opts(A,"nose",NOSES,l.nose))}
    ${field("Augenbrauen",opts(A,"brows",BROWS,l.brows))}
    ${field("Sommersprossen",opts(A,"freckles",["Ohne","Mit"],l.freckles))}
    ${field("Bäckchen",opts(A,"cheeks",["Aus","An"],l.cheeks))}
    ${adult?field("Bart",tiles(A,"beard",nameList(BEARDS),l.beard,prev,"Bart"))+(l.beard?field("Bartfarbe",swatches(A,"beardColor",HAIR_COLORS,l.beardColor,"Bartfarbe")):""):""}`;
  if(step===5&&adult)return `${field("Jacke",swatches(A,"jacket",JACKET_COLORS,l.jacket,"Farbe der Jacke"))}
    ${field("Brille",opts(A,"glasses",GLASSES,l.glasses))}
    ${field("Kopfbedeckung",tiles(A,"hat",nameList(HATS),l.hat,prev,"Kopfbedeckung"))}${hatColor}
    ${field("Merkmal",opts(A,"gear",GEARS,l.gear))}
    ${field("Ohrringe",opts(A,"earrings",["Ohne","Mit"],l.earrings))}
    ${field("Hintergrund",swatches(A,"bg",BG_COLORS,l.bg,"Hintergrund","Auto"))}`;
  if(step===5)return `<p class="note">Rechts oben siehst du dein Porträt (Kachel, Sprechblase) mit der Kleidung. Im Spiel trägst du dein Trikot, das stellst du im letzten Schritt ein.</p>
    ${field("Kleidung",opts(A,"outfit",OUTFITS,l.outfit))}
    ${l.outfit?field("Farbe der Kleidung",swatches(A,"outfitColor",SHIRT_COLORS,l.outfitColor,"Farbe der Kleidung")):""}
    ${field("Brille",opts(A,"glasses",GLASSES,l.glasses))}
    ${field("Kopfbedeckung",tiles(A,"hat",nameList(HATS),l.hat,prev,"Kopfbedeckung"))}${hatColor}
    ${field("Hintergrund",swatches(A,"bg",BG_COLORS,l.bg,"Hintergrund","Aus Vereinsfarbe"))}`;
  if(step===6)return `${field("Trikotfarbe",swatches(A,"shirt",SHIRT_COLORS,l.shirt,"Trikotfarbe"))}
    ${field("Trikotmuster",opts(A,"pattern",PATTERNS,l.pattern))}
    ${field("Kragen",opts(A,"collar",COLLARS,l.collar))}
    ${field("Hosenfarbe",swatches(A,"shorts",SHORTS_COLORS,l.shorts,"Hosenfarbe"))}
    ${field("Stutzenfarbe",swatches(A,"socks",SHIRT_COLORS,l.socks,"Stutzenfarbe"))}
    ${field("Schuhfarbe",swatches(A,"boots",BOOT_COLORS,l.boots,"Schuhfarbe"))}
    ${field("Rückennummer",`<div class="numpick"><button class="segb" data-avnum="-1" aria-label="Nummer kleiner">−</button><b class="numv" aria-live="polite">${esc(l.number)}</b><button class="segb" data-avnum="1" aria-label="Nummer größer">+</button></div>`)}
    ${field("Name auf dem Trikot",`<input id="avShirtName" type="text" maxlength="10" autocomplete="off" value="${esc(l.shirtName)}" aria-label="Name auf dem Trikot" class="avinput">`)}
    ${field("Name der Mannschaft",`<input id="avTeam" type="text" maxlength="20" autocomplete="off" value="${esc(l.team)}" aria-label="Name der Mannschaft" class="avinput">`)}
    ${field("Vereinsfarbe 1",swatches(A,"c1",SHIRT_COLORS,l.c1,"Vereinsfarbe 1"))}
    ${field("Vereinsfarbe 2",swatches(A,"c2",SHIRT_COLORS,l.c2,"Vereinsfarbe 2"))}`;
  return "";
}

// Erster Schritt: Junge oder Mädchen (nur eine Vorauswahl) und Vorlagen
function genderStep(D,l){
  const A=(k,v)=>`data-av="${k}:${v}"`;
  const tiles2=BODIES.map(([b,label])=>`<button class="gender ${b===l.body?"on":""}" data-avbody="${b}" aria-pressed="${b===l.body}" aria-label="${label}">${avatarSVG(b===l.body?l:startLook(b,D.name),{crop:"bust",px:150,label})}<span>${label}</span></button>`).join("");
  const tpls=TEMPLATES.map((t,i)=>({t,i})).filter(x=>x.t.look.body===l.body).map(({t,i})=>`<button class="tpl" data-avtpl="${i}" aria-label="Vorlage ${esc(t.name)}">${avatarSVG(templateLook(i,D.name),{crop:"bust",px:84,label:"Vorlage "+t.name})}<span>${esc(t.name)}</span></button>`).join("");
  return `<p class="note">Tippe auf dein Bild. Das ist nur ein Vorschlag: Danach kannst du jede Frisur und jede Farbe frei wählen.</p>
    <div class="genders">${tiles2}</div>
    <h3>Schneller Start</h3><p class="note">Oder starte mit einer Vorlage. Danach kannst du alles ändern.</p><div class="tpls">${tpls}</div>`;
}

// D = {look, name, first, step (1 bis 6), view (front oder back)}. look ist der Entwurf, gespeichert wird erst mit „Fertig“.
export function avatarBuilderHTML(D){
  const l=cleanLook(D.look),step=Math.max(1,Math.min(6,Number(D.step)||1)),view=D.view==="back"?"back":"front";
  const A=(k,v)=>`data-av="${k}:${v}"`;
  const prev=(patch,label)=>avatarSVG({...l,hat:step===5?l.hat:0,...patch},{crop:"head",px:70,label});
  const chips=STEPS.map(([n,t])=>`<button class="stepchip ${n===step?"on":""}" data-avstep="${n}" aria-label="Schritt ${n}: ${esc(t)}" aria-current="${n===step}"><b>${n}</b><span>${esc(t)}</span></button>`).join("");
  const big=step===5?`<div class="avhead">${avatarSVG(l,{crop:"bust",px:150,view,label:"Porträt"})}</div>`:(step>=2&&step<=4?`<div class="avhead">${avatarSVG(l,{crop:"head",px:140,view,label:"Kopf vergrößert"})}</div>`:"");
  const views=`<span class="seg">${[["front","Vorne"],["back","Hinten"]].map(([v,n])=>`<button class="segb ${v===view?"on":""}" data-avview="${v}" aria-pressed="${v===view}">${n}</button>`).join("")}</span>`;
  const body=step===1?genderStep(D,l):stepControls(step,l,A,prev,false);
  const last=step===6;
  return `<div><h1 class="title">${D.first?"Dein Spieler":"Spieler ändern"}</h1><p class="lead">Schritt ${step} von 6: ${esc(STEPS[step-1][1])}</p></div>
  <nav class="stepchips" aria-label="Schritte">${chips}</nav>
  <section class="panel avstick"><div class="avprev">${avatarSVG(l,{px:190,view,pose:"stand"})}${big}${step===6?`<div class="avcrest">${crestSVG(l,64)}<span>${esc(l.team)}</span></div>`:""}</div>
    <div class="row" style="justify-content:center;margin-top:8px">${views}</div></section>
  <section class="panel"><h3>${esc(STEPS[step-1][1])}</h3>${body}</section>
  <div class="row avnav"><button class="btn ghost" id="avBack" ${step===1?"disabled":""}>Zurück</button>${step===1?"":`<button class="btn ghost" id="avDice" aria-label="Würfeln: Zufallsvorschlag für diesen Schritt">🎲 Würfeln</button>`}${last?`<button class="btn" id="avSave">Fertig</button>`:`<button class="btn" id="avNext">Weiter</button>`}</div>
  <div class="row">${last?"":`<button class="btn ghost" id="avSave">Fertig</button>`}<button class="btn ghost" id="${D.first?"avSkip":"avCancel"}">${D.first?"Später":"Abbrechen"}</button></div>`;
}

// Trainerteam: T = {name, look}, which = 1 (Trainer) oder 2 (Trainerin), step 2 bis 5 (gleicher Baukasten wie beim Spieler).
export function trainerPanelHTML(T,which=1,step=2){
  const l=cleanTrainerLook(T&&T.look,which),name=T&&typeof T.name==="string"?T.name:(which===2?"Trainerin":"Trainer");
  step=Math.max(2,Math.min(5,Number(step)||2));
  const A=(k,v)=>`data-atr="${which}:${k}:${v}"`;
  const prev=(patch,label)=>trainerSVG({...l,hat:step===5?l.hat:0,...patch},{px:66,which,label});
  const chips=STEPS.filter(s=>s[0]>=2&&s[0]<=5).map(([n,t])=>`<button class="stepchip ${n===step?"on":""}" data-atrstep="${which}:${n}" aria-label="Schritt ${n}: ${esc(t)}"><b>${n}</b><span>${n===5?"Kleidung und Merkmal":esc(t)}</span></button>`).join("");
  return `<section class="panel"><h3>${which===2?"Trainerin":"Trainer"}</h3>
    ${which===1?`<p class="note">Trainer und Trainerin helfen in jeder Aufgabe. Sie sehen bei allen Konten gleich aus. Baue sie so, wie du möchtest.</p>`:""}
    <div class="avprev">${trainerSVG(l,{px:170,which})}</div>
    ${field("Name",`<input id="trName${which}" type="text" maxlength="16" autocomplete="off" value="${esc(name)}" aria-label="Name" class="avinput">`)}
    <nav class="stepchips" aria-label="Schritte">${chips}</nav>
    ${stepControls(step,l,A,prev,true)}
    <div class="row"><button class="btn ghost sm" data-atrdice="${which}:${step}" aria-label="Würfeln für diesen Schritt">🎲 Würfeln</button><button class="btn sm" data-atrsave="${which}">${which===2?"Trainerin":"Trainer"} speichern</button><button class="btn ghost sm" data-atrdefault="${which}">Zurück zur Vorgabe</button></div></section>`;
}
