// Avatare: Baukasten-Daten (Paletten, Vorlagen, Prüfung). Gezeichnet wird in avatardraw.js.
// Der Baukasten beginnt mit der Wahl Junge oder Mädchen (Feld body). Die Frisuren richten sich danach,
// alle Farben, Nummer, Name und Mannschaft sind frei wählbar.
export const BODIES=[["j","Junge"],["m","Mädchen"]];
export const HAIR_STYLES={
  j:["Kurz","Wuschel","Igel","Locken","Tolle","Stoppel","Seitenscheitel","Surfer","Fransen","Ohne Haare"],
  m:["Pferdeschwanz","Zöpfe","Lang","Dutt","Bob","Lockenmähne","Halbzopf","Pony","Fransen","Ohne Haare"]
};
// Kopfbedeckung (eigene Farbe): 0 keine, 1 Cap, 2 Cap verkehrt herum, 3 Mütze, 4 Stirnband, 5 Bandana
// Augenfarben, Trikotmuster, Kragen und Mund
export const EYE_COLORS=["#4a3426","#7a5a2a","#6a95c4","#5f9b6a","#8a97a3"];
export const PATTERNS=["Einfarbig","Schulterstreifen","Querstreifen","Brustband"];
export const COLLARS=["V-Ausschnitt","Rundkragen"];
export const MOUTHS=["Lächeln","Breites Grinsen"];
export const FACES=["Oval","Rund","Eckig","Herz","Lang"];
export const NOSES=["Klein","Mittel","Groß"];
export const BROWS=["Dünn","Normal","Dick"];
export const EYESHAPES=["Rund","Mandel","Schmal"];
export const GLASSES=["Ohne","Rund","Eckig"];
export const BUILDS=["Schlank","Normal","Kräftig"];
export const HATS=["Keine","Cap","Cap verkehrt","Mütze","Stirnband","Bandana"];
export const HAIR_COLORS=["#2b1d14","#5a3825","#8a5a2b","#c48b3c","#e6c15a","#d9c58a","#b8341f","#22252b","#e75a9c","#2f6fde"];
export const SKIN_TONES=["#ffe0c7","#f6c9a0","#e3a877","#c68642","#8d5524","#5c3a21"];
export const SHIRT_COLORS=["#e5484d","#2f6fde","#ffc83d","#34a853","#ff8a00","#8e44ad","#22252b","#f4f4f4","#17b3b3","#f27fb1"];
export const SHORTS_COLORS=["#f4f4f4","#22252b","#1f3f8f","#e5484d","#34a853","#ffc83d","#8a8f98","#ff8a00"];
export const BOOT_COLORS=["#22252b","#f4f4f4","#e5484d","#2f6fde","#d7f000","#ff8a00","#e75a9c"];
export const COLOR_NAMES={"#2b1d14":"dunkelbraun","#5a3825":"braun","#8a5a2b":"hellbraun","#c48b3c":"dunkelblond","#e6c15a":"blond","#d9c58a":"aschblond","#b8341f":"kupferrot","#22252b":"schwarz","#e75a9c":"pink","#2f6fde":"blau",
  "#ffe0c7":"sehr hell","#f6c9a0":"hell","#e3a877":"mittel","#c68642":"gebräunt","#8d5524":"dunkel","#5c3a21":"sehr dunkel",
  "#e5484d":"rot","#ffc83d":"gelb","#34a853":"grün","#ff8a00":"orange","#8e44ad":"lila","#f4f4f4":"weiß","#17b3b3":"türkis","#f27fb1":"rosa","#1f3f8f":"dunkelblau","#8a8f98":"grau","#d7f000":"neongelb","#4a3426":"braun","#7a5a2a":"haselnuss","#6a95c4":"blau","#5f9b6a":"grün","#8a97a3":"grau"};

const HEX=/^#[0-9a-fA-F]{6}$/;
const hex=(v,d)=>typeof v==="string"&&HEX.test(v)?v.toLowerCase():d;
const int=(v,lo,hi,d)=>Number.isInteger(v)&&v>=lo&&v<=hi?v:d;

// Vorlagen zum schnellen Start, je vier für Jungen und Mädchen.
export const TEMPLATES=[
  {name:"Blitz",  look:{body:"j",hair:0,hairColor:"#2b1d14",skin:"#f6c9a0",shirt:"#e5484d",shorts:"#f4f4f4",boots:"#22252b",number:"9", team:"Rote Blitze",  c1:"#e5484d",c2:"#f4f4f4"}},
  {name:"Wirbel", look:{body:"j",hair:3,hairColor:"#5a3825",skin:"#c68642",shirt:"#2f6fde",shorts:"#1f3f8f",boots:"#f4f4f4",number:"7", team:"Blaue Wirbel", c1:"#2f6fde",c2:"#ffc83d"}},
  {name:"Rakete", look:{body:"j",hair:4,hairColor:"#b8341f",skin:"#ffe0c7",shirt:"#ff8a00",shorts:"#1f3f8f",boots:"#f4f4f4",number:"8", team:"Raketen",      c1:"#ff8a00",c2:"#1f3f8f"}},
  {name:"Nacht",  look:{body:"j",hair:5,hairColor:"#2b1d14",skin:"#e3a877",shirt:"#22252b",shorts:"#22252b",boots:"#d7f000",number:"1", team:"Nachtfalken",  c1:"#22252b",c2:"#d7f000"}},
  {name:"Torjäger",look:{body:"j",hair:8,hairColor:"#e6c15a",skin:"#ffe0c7",eyes:"#6a95c4",shirt:"#2f6fde",shorts:"#22252b",socks:"#22252b",boots:"#f4f4f4",pattern:1,collar:1,mouth:1,number:"10",team:"Blau Weiß",c1:"#2f6fde",c2:"#f4f4f4"}},
  {name:"Sonne",  look:{body:"m",hair:0,hairColor:"#e6c15a",skin:"#ffe0c7",shirt:"#ffc83d",shorts:"#22252b",boots:"#22252b",number:"10",team:"Gelbe Sonnen", c1:"#ffc83d",c2:"#22252b"}},
  {name:"Wald",   look:{body:"m",hair:1,hairColor:"#22252b",skin:"#8d5524",shirt:"#34a853",shorts:"#f4f4f4",boots:"#e5484d",number:"11",team:"Grüne Wälder", c1:"#34a853",c2:"#f4f4f4"}},
  {name:"Eis",    look:{body:"m",hair:2,hairColor:"#c48b3c",skin:"#f6c9a0",shirt:"#17b3b3",shorts:"#f4f4f4",boots:"#22252b",number:"5", team:"Eiskristalle", c1:"#17b3b3",c2:"#f4f4f4"}},
  {name:"Funke",  look:{body:"m",hair:6,hairColor:"#8a5a2b",skin:"#f6c9a0",eyes:"#5f9b6a",shirt:"#e5484d",shorts:"#f4f4f4",socks:"#f4f4f4",boots:"#22252b",pattern:2,collar:1,mouth:1,number:"6",team:"Rote Funken",c1:"#e5484d",c2:"#f4f4f4"}},
  {name:"Beere",  look:{body:"m",hair:3,hairColor:"#e75a9c",skin:"#c68642",shirt:"#8e44ad",shorts:"#f4f4f4",boots:"#ff8a00",number:"3", team:"Beerenstark",  c1:"#8e44ad",c2:"#f27fb1"}}
];

export function cleanText(v,max,d){
  const t=typeof v==="string"?v.replace(/[^\p{L}\p{N} .'\-]/gu,"").replace(/\s+/g," ").trim().slice(0,max):"";
  return t||d;
}
export function cleanNumber(v,d="10"){const t=String(v===undefined||v===null?"":v).replace(/\D/g,"").slice(0,2);return t===""?d:String(Number(t));}

// Macht aus beliebigen Daten einen gültigen Aussehen-Satz (fehlende oder falsche Werte werden ersetzt).
export function cleanLook(look,fallback){
  const b=fallback||TEMPLATES[0].look,l=look&&typeof look==="object"?look:{};
  const body=l.body==="m"||l.body==="j"?l.body:(b.body||"j");
  return{
    v:2,body,
    hair:int(l.hair,0,HAIR_STYLES[body].length-1,Math.min(b.hair,HAIR_STYLES[body].length-1)),hairColor:hex(l.hairColor,b.hairColor),skin:hex(l.skin,b.skin),
    hat:int(l.hat,0,HATS.length-1,b.hat||0),hatColor:hex(l.hatColor,b.hatColor||"#e5484d"),
    eyes:hex(l.eyes,b.eyes||"#4a3426"),pattern:int(l.pattern,0,PATTERNS.length-1,b.pattern||0),collar:int(l.collar,0,COLLARS.length-1,b.collar||0),mouth:int(l.mouth,0,MOUTHS.length-1,b.mouth||0),
    socks:hex(l.socks,hex(l.shirt,b.shirt)),
    face:int(l.face,0,FACES.length-1,b.face||0),nose:int(l.nose,0,NOSES.length-1,b.nose===undefined?1:b.nose),brows:int(l.brows,0,BROWS.length-1,b.brows===undefined?1:b.brows),
    eyeShape:int(l.eyeShape,0,EYESHAPES.length-1,b.eyeShape===undefined?1:b.eyeShape),freckles:l.freckles===undefined?(b.freckles?1:0):(l.freckles?1:0),
    glasses:int(l.glasses,0,GLASSES.length-1,b.glasses||0),build:int(l.build,0,BUILDS.length-1,b.build===undefined?1:b.build),
    shirt:hex(l.shirt,b.shirt),shorts:hex(l.shorts,b.shorts),boots:hex(l.boots,b.boots),
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
// Wechsel Junge/Mädchen im laufenden Entwurf: Farben, Nummer, Name und Mannschaft bleiben, die Frisur wird die erste der neuen Liste
export function withBody(look,body){return cleanLook({...look,body,hair:0});}

// ---------- Trainer (zwei: Trainer und Trainerin, gelten für alle Konten) ----------
export const TRAINER_NAME="Trainer",TRAINER2_NAME="Trainerin";
export const TRAINER_HAIR=["Glatze","Kurz","Seitenscheitel","Schulterlang"];
export const JACKET_COLORS=["#1f2a44","#22252b","#2f6fde","#e5484d","#34a853","#8e44ad","#ff8a00","#17b3b3"];
// Vorgaben nach den Fotos: Trainer mit Glatze, Brille, dunkler Jacke. Trainerin blond, schulterlang, Creolen.
export const defaultTrainerLook=()=>({v:2,hair:0,hairColor:"#8a5a2b",skin:"#f6c9a0",jacket:"#1f2a44",eyes:"#5f87b5",glasses:1,beard:0,earrings:0,smile:1});
export const defaultTrainer2Look=()=>({v:2,hair:3,hairColor:"#d9c58a",skin:"#f6c9a0",jacket:"#22252b",eyes:"#6a95c4",glasses:0,beard:0,earrings:1,smile:0});
export const defaultTrainer=()=>({name:TRAINER_NAME,look:defaultTrainerLook(),t:0});
export const defaultTrainer2=()=>({name:TRAINER2_NAME,look:defaultTrainer2Look(),t:0});
export function cleanTrainerLook(look,which=1){
  const d=which===2?defaultTrainer2Look():defaultTrainerLook(),l=look&&typeof look==="object"?look:{};
  return{v:2,hair:int(l.hair,0,TRAINER_HAIR.length-1,d.hair),hairColor:hex(l.hairColor,d.hairColor),skin:hex(l.skin,d.skin),jacket:hex(l.jacket,d.jacket),eyes:hex(l.eyes,d.eyes),
    glasses:l.glasses===undefined?d.glasses:(l.glasses?1:0),beard:l.beard===undefined?d.beard:(l.beard?1:0),earrings:l.earrings===undefined?d.earrings:(l.earrings?1:0),smile:d.smile};
}
export function cleanTrainer(tr,which=1){
  const t=tr&&typeof tr==="object"?tr:{},dn=which===2?TRAINER2_NAME:TRAINER_NAME;
  return{name:cleanText(t.name,16,dn),look:cleanTrainerLook(t.look,which),t:Number.isFinite(t.t)?t.t:0};
}
