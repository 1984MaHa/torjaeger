// Avatare: Baukasten-Daten (Paletten, Vorlagen, Prüfung, Würfel). Gezeichnet wird in avatardraw.js.
// Der Baukasten ist ein geführter Ablauf in 6 Schritten. Junge oder Mädchen (Feld body) ist nur eine Vorauswahl:
// sie bestimmt die Reihenfolge der Frisuren und die Würfel-Vorschläge, schränkt aber nichts ein.
// Schemaversion 4 (App 1.3.0): hair ist ein Schlüssel (vorher ein Index je Junge/Mädchen), neue Felder
// browColor, cheeks, outfit, outfitColor, bg. Alte Aussehen-Sätze (v 2) werden beim Lesen umgerechnet.
export const BODIES=[["j","Junge"],["m","Mädchen"]];
// Alle Frisuren, für jedes Kind wählbar. Reihenfolge der Anzeige: siehe hairList.
export const HAIRS=[["kurz","Kurz"],["wuschel","Wuschel"],["igel","Igel"],["locken","Locken"],["tolle","Tolle"],["stoppel","Stoppel"],["scheitel","Seitenscheitel"],["surfer","Surfer"],["fransen","Fransen"],
  ["bob","Bob"],["halblang","Halblang"],["lang","Lang"],["lockenmaehne","Lockenmähne"],["zoepfe","Zöpfe"],["pferdeschwanz","Pferdeschwanz"],["dutt","Dutt"],["halbzopf","Halbzopf"],["pony","Pony"],["ohne","Ohne Haare"]];
export const HAIR_KEYS=HAIRS.map(h=>h[0]);
export const hairName=k=>(HAIRS.find(h=>h[0]===k)||HAIRS[0])[1];
const FIRST={j:["kurz","wuschel","igel","locken","tolle","stoppel","scheitel","surfer","fransen"],m:["pferdeschwanz","zoepfe","halblang","lang","dutt","bob","lockenmaehne","halbzopf","pony"]};
// Vorschläge zuerst, danach alle übrigen (nichts fehlt)
export function hairList(body){const f=FIRST[body]||FIRST.j;return[...f,...HAIR_KEYS.filter(k=>!f.includes(k))];}
// Umrechnung alter Frisuren-Indizes (bis 1.2.1)
const OLD_HAIR={j:["kurz","wuschel","igel","locken","tolle","stoppel","scheitel","surfer","fransen","ohne"],m:["pferdeschwanz","zoepfe","lang","dutt","bob","lockenmaehne","halbzopf","pony","fransen","ohne"]};
// Kopfbedeckung (eigene Farbe): 0 keine, 1 Cap, 2 Cap verkehrt herum, 3 Mütze, 4 Stirnband, 5 Bandana, 6 Hut
export const HATS=["Keine","Cap","Cap verkehrt","Mütze","Stirnband","Bandana","Hut"];
export const EYE_COLORS=["#4a3426","#7a5a2a","#6a95c4","#5f9b6a","#8a97a3"];
export const PATTERNS=["Einfarbig","Schulterstreifen","Querstreifen","Brustband"];
export const COLLARS=["V-Ausschnitt","Rundkragen","Rund, dunkler"];
export const MOUTHS=["Lächeln","Breites Lachen","Ernst","Überrascht"];
export const FACES=["Oval","Rund","Eckig","Herz","Lang"];
export const NOSES=["Klein","Mittel","Groß"];
export const BROWS=["Dünn","Normal","Dick"];
export const EYESHAPES=["Rund","Mandel","Schmal"];
export const GLASSES=["Ohne","Rund","Eckig"];
export const BUILDS=["Schlank","Normal","Kräftig"];
export const OUTFITS=["Trikot","T-Shirt","Sportjacke"];
export const BEARDS=["Ohne","Vollbart","Kinnbart","Schnurrbart","Dreitagebart"];
export const GEARS=["Keins","Pfeife","Klemmbrett"];
export const HAIR_COLORS=["#2b1d14","#5a3825","#8a5a2b","#c48b3c","#e6c15a","#d9c58a","#b8341f","#22252b","#e75a9c","#2f6fde","#9aa0a8","#cfa457"];
export const SKIN_TONES=["#ffe0c7","#f6c9a0","#e9b98a","#e3a877","#c68642","#a86b3c","#8d5524","#5c3a21"];
export const SHIRT_COLORS=["#e5484d","#2f6fde","#ffc83d","#34a853","#ff8a00","#8e44ad","#22252b","#f4f4f4","#17b3b3","#f27fb1"];
export const SHORTS_COLORS=["#f4f4f4","#22252b","#1f3f8f","#e5484d","#34a853","#ffc83d","#8a8f98","#ff8a00"];
export const BOOT_COLORS=["#22252b","#f4f4f4","#e5484d","#2f6fde","#d7f000","#ff8a00","#e75a9c"];
export const BG_COLORS=["#ffd9e0","#ffe3c2","#fff1b0","#d6f0d2","#cdeef0","#d3e2ff","#e3d8ff","#e6e9ec"];
export const JACKET_COLORS=["#1f2a44","#22252b","#2f6fde","#e5484d","#34a853","#8e44ad","#ff8a00","#17b3b3"];
export const COLOR_NAMES={"#2b1d14":"dunkelbraun","#5a3825":"braun","#8a5a2b":"hellbraun","#c48b3c":"dunkelblond","#e6c15a":"blond","#d9c58a":"aschblond","#b8341f":"kupferrot","#22252b":"schwarz","#e75a9c":"pink","#2f6fde":"blau","#9aa0a8":"grau","#cfa457":"sandblond",
  "#ffe0c7":"sehr hell","#f6c9a0":"hell","#e9b98a":"hell gebräunt","#e3a877":"mittel","#c68642":"gebräunt","#a86b3c":"braun gebräunt","#8d5524":"dunkel","#5c3a21":"sehr dunkel",
  "#e5484d":"rot","#ffc83d":"gelb","#34a853":"grün","#ff8a00":"orange","#8e44ad":"lila","#f4f4f4":"weiß","#17b3b3":"türkis","#f27fb1":"rosa","#1f3f8f":"dunkelblau","#8a8f98":"grau","#d7f000":"neongelb","#4a3426":"braun","#7a5a2a":"haselnuss","#6a95c4":"blau","#5f9b6a":"grün","#8a97a3":"grau","#1f2a44":"nachtblau",
  "#ffd9e0":"zartrosa","#ffe3c2":"pfirsich","#fff1b0":"zartgelb","#d6f0d2":"zartgrün","#cdeef0":"zarttürkis","#d3e2ff":"zartblau","#e3d8ff":"zartlila","#e6e9ec":"hellgrau"};

const HEX=/^#[0-9a-fA-F]{6}$/;
const hex=(v,d)=>typeof v==="string"&&HEX.test(v)?v.toLowerCase():d;
const hexOrEmpty=(v,d)=>v===""?"":hex(v,d);
const int=(v,lo,hi,d)=>Number.isInteger(v)&&v>=lo&&v<=hi?v:d;
const bool=(v,d)=>v===undefined||v===null?(d?1:0):(v?1:0);

// Vorlagen zum schnellen Start (5 für Jungen, 5 für Mädchen)
export const TEMPLATES=[
  {name:"Blitz",  look:{body:"j",hair:"kurz",hairColor:"#2b1d14",skin:"#f6c9a0",shirt:"#e5484d",shorts:"#f4f4f4",boots:"#22252b",number:"9", team:"Rote Blitze",  c1:"#e5484d",c2:"#f4f4f4"}},
  {name:"Wirbel", look:{body:"j",hair:"locken",hairColor:"#5a3825",skin:"#c68642",shirt:"#2f6fde",shorts:"#1f3f8f",boots:"#f4f4f4",number:"7", team:"Blaue Wirbel", c1:"#2f6fde",c2:"#ffc83d"}},
  {name:"Rakete", look:{body:"j",hair:"tolle",hairColor:"#b8341f",skin:"#ffe0c7",shirt:"#ff8a00",shorts:"#1f3f8f",boots:"#f4f4f4",number:"8", team:"Raketen",      c1:"#ff8a00",c2:"#1f3f8f"}},
  {name:"Nacht",  look:{body:"j",hair:"stoppel",hairColor:"#2b1d14",skin:"#e3a877",shirt:"#22252b",shorts:"#22252b",boots:"#d7f000",number:"1", team:"Nachtfalken",  c1:"#22252b",c2:"#d7f000"}},
  {name:"Torjäger",look:{body:"j",hair:"fransen",hairColor:"#cfa457",skin:"#ffe0c7",eyes:"#6a95c4",shirt:"#2f6fde",shorts:"#22252b",socks:"#22252b",boots:"#f4f4f4",pattern:1,collar:2,mouth:1,freckles:1,number:"10",team:"Blau Weiß",c1:"#2f6fde",c2:"#f4f4f4"}},
  {name:"Sonne",  look:{body:"m",hair:"pferdeschwanz",hairColor:"#e6c15a",skin:"#ffe0c7",shirt:"#ffc83d",shorts:"#22252b",boots:"#22252b",number:"10",team:"Gelbe Sonnen", c1:"#ffc83d",c2:"#22252b"}},
  {name:"Wald",   look:{body:"m",hair:"zoepfe",hairColor:"#22252b",skin:"#8d5524",shirt:"#34a853",shorts:"#f4f4f4",boots:"#e5484d",number:"11",team:"Grüne Wälder", c1:"#34a853",c2:"#f4f4f4"}},
  {name:"Eis",    look:{body:"m",hair:"lang",hairColor:"#c48b3c",skin:"#f6c9a0",shirt:"#17b3b3",shorts:"#f4f4f4",boots:"#22252b",number:"5", team:"Eiskristalle", c1:"#17b3b3",c2:"#f4f4f4"}},
  {name:"Funke",  look:{body:"m",hair:"halbzopf",hairColor:"#8a5a2b",skin:"#f6c9a0",eyes:"#5f9b6a",shirt:"#e5484d",shorts:"#f4f4f4",socks:"#f4f4f4",boots:"#22252b",pattern:2,collar:1,mouth:1,number:"6",team:"Rote Funken",c1:"#e5484d",c2:"#f4f4f4"}},
  {name:"Beere",  look:{body:"m",hair:"wuschel",hairColor:"#e75a9c",skin:"#c68642",shirt:"#8e44ad",shorts:"#f4f4f4",boots:"#ff8a00",number:"3", team:"Beerenstark",  c1:"#8e44ad",c2:"#f27fb1"}}
];

export function cleanText(v,max,d){
  const t=typeof v==="string"?v.replace(/[^\p{L}\p{N} .'\-]/gu,"").replace(/\s+/g," ").trim().slice(0,max):"";
  return t||d;
}
export function cleanNumber(v,d="10"){const t=String(v===undefined||v===null?"":v).replace(/\D/g,"").slice(0,2);return t===""?d:String(Number(t));}

// Frisur als Schlüssel. Alte Sätze (Zahl plus body) werden umgerechnet.
function hairOf(v,body,d){
  if(typeof v==="string"&&HAIR_KEYS.includes(v))return v;
  if(Number.isInteger(v)){const a=OLD_HAIR[body]||OLD_HAIR.j;if(v>=0&&v<a.length)return a[v];}
  return d;
}
const baseHair=b=>hairOf(b.hair,b.body||"j","kurz");

// Macht aus beliebigen Daten einen gültigen Aussehen-Satz (fehlende oder falsche Werte werden ersetzt).
// Es gibt bewusst kein Bart-Merkmal: Kinder haben keinen Bart.
export function cleanLook(look,fallback){
  const b=fallback||TEMPLATES[0].look,l=look&&typeof look==="object"?look:{};
  const body=l.body==="m"||l.body==="j"?l.body:(b.body||"j");
  const shirt=hex(l.shirt,b.shirt);
  return{
    v:3,body,
    hair:hairOf(l.hair,body,baseHair(b)),hairColor:hex(l.hairColor,b.hairColor),browColor:hexOrEmpty(l.browColor,b.browColor||""),skin:hex(l.skin,b.skin),
    hat:int(l.hat,0,HATS.length-1,b.hat||0),hatColor:hex(l.hatColor,b.hatColor||"#e5484d"),
    eyes:hex(l.eyes,b.eyes||"#4a3426"),pattern:int(l.pattern,0,PATTERNS.length-1,b.pattern||0),collar:int(l.collar,0,COLLARS.length-1,b.collar||0),mouth:int(l.mouth,0,MOUTHS.length-1,b.mouth||0),
    socks:hex(l.socks,shirt),
    face:int(l.face,0,FACES.length-1,b.face||0),nose:int(l.nose,0,NOSES.length-1,b.nose===undefined?1:b.nose),brows:int(l.brows,0,BROWS.length-1,b.brows===undefined?1:b.brows),
    eyeShape:int(l.eyeShape,0,EYESHAPES.length-1,b.eyeShape===undefined?1:b.eyeShape),freckles:bool(l.freckles,b.freckles),cheeks:bool(l.cheeks,b.cheeks||0),
    glasses:int(l.glasses,0,GLASSES.length-1,b.glasses||0),build:int(l.build,0,BUILDS.length-1,b.build===undefined?1:b.build),
    outfit:int(l.outfit,0,OUTFITS.length-1,b.outfit||0),outfitColor:hex(l.outfitColor,b.outfitColor||shirt),bg:hexOrEmpty(l.bg,b.bg||""),
    shirt,shorts:hex(l.shorts,b.shorts),boots:hex(l.boots,b.boots),
    number:cleanNumber(l.number,b.number),
    shirtName:cleanText(l.shirtName,10,b.shirtName||"").toUpperCase(),
    team:cleanText(l.team,20,b.team),c1:hex(l.c1,b.c1),c2:hex(l.c2,b.c2)
  };
}
const hashOf=t=>{let h=7;for(const c of String(t))h=(h*31+c.codePointAt(0))>>>0;return h;};
// Aussehen für Konten ohne eigenen Avatar: fest aus dem Namen abgeleitet.
export function defaultLook(name){
  const tpl=TEMPLATES[hashOf(name)%TEMPLATES.length].look;
  return cleanLook({...tpl,shirtName:String(name||"").slice(0,10)},TEMPLATES[0].look);
}
// Aussehen eines Kontos (eigener Avatar oder Vorgabe aus dem Namen)
export const lookOf=profile=>profile&&profile.avatar?cleanLook(profile.avatar):defaultLook(profile&&profile.name);
export function templateLook(i,name){return cleanLook({...TEMPLATES[i].look,shirtName:String(name||"").slice(0,10)},TEMPLATES[0].look);}
// Neuer Entwurf nach der Wahl Junge oder Mädchen: erste passende Vorlage, Name auf dem Trikot
export function startLook(body,name){
  const i=TEMPLATES.findIndex(t=>t.look.body===body);
  return templateLook(i<0?0:i,name);
}
// Wechsel Junge/Mädchen im laufenden Entwurf: nur eine Vorauswahl, es bleibt alles, wie es ist.
export function withBody(look,body){return cleanLook({...look,body});}

// ---------- Geführter Ablauf ----------
export const STEPS=[[1,"Junge oder Mädchen"],[2,"Kopf und Haut"],[3,"Frisur"],[4,"Gesicht"],[5,"Kleidung"],[6,"Trikot und Verein"]];
const pick=(a,rnd)=>a[Math.floor(rnd()*a.length)%a.length];
// Würfel: Zufallsvorschlag nur für diesen Schritt. Gibt die zu ändernden Felder zurück.
export function randomPatch(step,look,rnd=Math.random){
  const l=cleanLook(look),H=hairList(l.body);
  switch(step){
    case 1:{const t=TEMPLATES.filter(x=>x.look.body===l.body);const p=pick(t,rnd).look;return{hair:p.hair,hairColor:p.hairColor,skin:p.skin,shirt:p.shirt,outfitColor:p.shirt,shorts:p.shorts,boots:p.boots,c1:p.c1,c2:p.c2,team:p.team,number:p.number};}
    case 2:return{face:Math.floor(rnd()*FACES.length),skin:pick(SKIN_TONES,rnd),build:Math.floor(rnd()*BUILDS.length)};
    case 3:return{hair:pick(H.slice(0,12),rnd),hairColor:pick(HAIR_COLORS,rnd)};
    case 4:return{eyeShape:Math.floor(rnd()*EYESHAPES.length),eyes:pick(EYE_COLORS,rnd),mouth:Math.floor(rnd()*MOUTHS.length),nose:Math.floor(rnd()*NOSES.length),brows:Math.floor(rnd()*BROWS.length),freckles:rnd()<.3?1:0,cheeks:rnd()<.25?1:0};
    case 5:{const hat=rnd()<.5?0:1+Math.floor(rnd()*(HATS.length-1));return{outfit:Math.floor(rnd()*OUTFITS.length),outfitColor:pick(SHIRT_COLORS,rnd),glasses:rnd()<.3?1+Math.floor(rnd()*2):0,hat,hatColor:pick(SHIRT_COLORS,rnd),bg:pick(BG_COLORS,rnd)};}
    case 6:{const a=pick(SHIRT_COLORS,rnd);let c=pick(SHIRT_COLORS,rnd);if(c===a)c="#f4f4f4";return{shirt:a,c1:a,c2:c,socks:rnd()<.5?a:c,shorts:pick(SHORTS_COLORS,rnd),boots:pick(BOOT_COLORS,rnd),pattern:Math.floor(rnd()*PATTERNS.length),collar:Math.floor(rnd()*COLLARS.length),number:String(1+Math.floor(rnd()*99))};}
  }
  return{};
}

// ---------- Trainer (zwei: Trainer und Trainerin, gelten für alle Konten) ----------
export const TRAINER_NAME="Trainer",TRAINER2_NAME="Trainerin";
// Vorgaben nach den Fotos: Trainer mit Glatze, Brille, dunkler Jacke. Trainerin blond, schulterlang, Creolen.
export const defaultTrainerLook=()=>({v:3,hair:"ohne",hairColor:"#8a5a2b",browColor:"",skin:"#f6c9a0",face:0,eyeShape:1,eyes:"#6a95c4",brows:1,nose:1,mouth:1,cheeks:0,freckles:0,glasses:2,hat:0,hatColor:"#2f6fde",bg:"#d3e2ff",jacket:"#1f2a44",beard:0,beardColor:"#8a5a2b",earrings:0,gear:1});
export const defaultTrainer2Look=()=>({v:3,hair:"halblang",hairColor:"#d9c58a",browColor:"",skin:"#f6c9a0",face:0,eyeShape:1,eyes:"#6a95c4",brows:1,nose:1,mouth:0,cheeks:0,freckles:0,glasses:0,hat:0,hatColor:"#e5484d",bg:"#ffe3c2",jacket:"#22252b",beard:0,beardColor:"#d9c58a",earrings:1,gear:1});
export const defaultTrainer=()=>({name:TRAINER_NAME,look:defaultTrainerLook(),t:0});
export const defaultTrainer2=()=>({name:TRAINER2_NAME,look:defaultTrainer2Look(),t:0});
const OLD_TRAINER_HAIR=["ohne","kurz","scheitel","halblang"];
export function cleanTrainerLook(look,which=1){
  const d=which===2?defaultTrainer2Look():defaultTrainerLook(),l=look&&typeof look==="object"?look:{};
  const old=l.v===2||l.v===undefined&&Number.isInteger(l.hair);
  let hair=typeof l.hair==="string"&&HAIR_KEYS.includes(l.hair)?l.hair:d.hair;
  if(Number.isInteger(l.hair)&&l.hair>=0&&l.hair<OLD_TRAINER_HAIR.length)hair=OLD_TRAINER_HAIR[l.hair];
  const hairColor=hex(l.hairColor,d.hairColor);
  let glasses=int(l.glasses,0,GLASSES.length-1,d.glasses);
  if(old&&l.glasses)glasses=2;
  let mouth=int(l.mouth,0,MOUTHS.length-1,d.mouth);
  if(old&&l.smile!==undefined)mouth=l.smile?1:0;
  let beard=int(l.beard,0,BEARDS.length-1,d.beard);
  if(old&&l.beard)beard=1;
  return{v:3,hair,hairColor,browColor:hexOrEmpty(l.browColor,d.browColor),skin:hex(l.skin,d.skin),face:int(l.face,0,FACES.length-1,d.face),eyeShape:int(l.eyeShape,0,EYESHAPES.length-1,d.eyeShape),
    eyes:hex(l.eyes,d.eyes),brows:int(l.brows,0,BROWS.length-1,d.brows),nose:int(l.nose,0,NOSES.length-1,d.nose),mouth,cheeks:bool(l.cheeks,d.cheeks),freckles:bool(l.freckles,d.freckles),
    glasses,hat:int(l.hat,0,HATS.length-1,d.hat),hatColor:hex(l.hatColor,d.hatColor),bg:hexOrEmpty(l.bg,d.bg),jacket:hex(l.jacket,d.jacket),
    beard,beardColor:hex(l.beardColor,old?hairColor:d.beardColor),earrings:bool(l.earrings,d.earrings),gear:int(l.gear,0,GEARS.length-1,old?1:d.gear)};
}
export function cleanTrainer(tr,which=1){
  const t=tr&&typeof tr==="object"?tr:{},dn=which===2?TRAINER2_NAME:TRAINER_NAME;
  return{name:cleanText(t.name,16,dn),look:cleanTrainerLook(t.look,which),t:Number.isFinite(t.t)?t.t:0};
}
// Würfel für das Trainerteam (Schritte 2 bis 5, dazu Extras nur für Erwachsene)
export function randomTrainerPatch(step,look,which=1,rnd=Math.random){
  const l=cleanTrainerLook(look,which);
  switch(step){
    case 2:return{face:Math.floor(rnd()*FACES.length),skin:pick(SKIN_TONES,rnd)};
    case 3:return{hair:pick(HAIR_KEYS.filter(k=>k!=="wuschel"&&k!=="pony"),rnd),hairColor:pick(HAIR_COLORS,rnd)};
    case 4:{const beard=which===2?0:(rnd()<.45?1+Math.floor(rnd()*(BEARDS.length-1)):0);return{eyeShape:Math.floor(rnd()*EYESHAPES.length),eyes:pick(EYE_COLORS,rnd),mouth:Math.floor(rnd()*MOUTHS.length),nose:Math.floor(rnd()*NOSES.length),brows:Math.floor(rnd()*BROWS.length),beard,beardColor:l.hairColor};}
    case 5:return{jacket:pick(JACKET_COLORS,rnd),glasses:rnd()<.4?1+Math.floor(rnd()*2):0,hat:rnd()<.35?1+Math.floor(rnd()*(HATS.length-1)):0,hatColor:pick(SHIRT_COLORS,rnd),gear:1+Math.floor(rnd()*2),bg:pick(BG_COLORS,rnd)};
  }
  return{};
}
