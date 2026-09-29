// Avatare: Baukasten-Daten (Paletten, Vorlagen, Prüfung). Gezeichnet wird in avatardraw.js.
// Eigene, schlichte Figuren. Es gibt keinen festen Jungen- oder Mädchen-Modus: alles ist frei wählbar.
export const HAIR_STYLES=["Kurz","Wuschel","Locken","Pferdeschwanz","Zöpfe","Lang","Dutt","Stoppel"];
export const HAIR_COLORS=["#2b1d14","#5a3825","#8a5a2b","#c48b3c","#e6c15a","#b8341f","#22252b","#e75a9c","#2f6fde"];
export const SKIN_TONES=["#ffe0c7","#f6c9a0","#e3a877","#c68642","#8d5524","#5c3a21"];
export const SHIRT_COLORS=["#e5484d","#2f6fde","#ffc83d","#34a853","#ff8a00","#8e44ad","#22252b","#f4f4f4","#17b3b3","#f27fb1"];
export const SHORTS_COLORS=["#f4f4f4","#22252b","#1f3f8f","#e5484d","#34a853","#ffc83d","#8a8f98","#ff8a00"];
export const BOOT_COLORS=["#22252b","#f4f4f4","#e5484d","#2f6fde","#d7f000","#ff8a00","#e75a9c"];
export const COLOR_NAMES={"#2b1d14":"dunkelbraun","#5a3825":"braun","#8a5a2b":"hellbraun","#c48b3c":"dunkelblond","#e6c15a":"blond","#b8341f":"kupferrot","#22252b":"schwarz","#e75a9c":"pink","#2f6fde":"blau",
  "#ffe0c7":"sehr hell","#f6c9a0":"hell","#e3a877":"mittel","#c68642":"gebräunt","#8d5524":"dunkel","#5c3a21":"sehr dunkel",
  "#e5484d":"rot","#ffc83d":"gelb","#34a853":"grün","#ff8a00":"orange","#8e44ad":"lila","#f4f4f4":"weiß","#17b3b3":"türkis","#f27fb1":"rosa","#1f3f8f":"dunkelblau","#8a8f98":"grau","#d7f000":"neongelb"};

const HEX=/^#[0-9a-fA-F]{6}$/;
const hex=(v,d)=>typeof v==="string"&&HEX.test(v)?v.toLowerCase():d;
const int=(v,lo,hi,d)=>Number.isInteger(v)&&v>=lo&&v<=hi?v:d;

// Vorlagen zum schnellen Start (bewusst gemischt, nichts ist Jungen oder Mädchen zugeordnet).
export const TEMPLATES=[
  {name:"Blitz",   look:{hair:0,hairColor:"#2b1d14",skin:"#f6c9a0",shirt:"#e5484d",shorts:"#f4f4f4",boots:"#22252b",number:"9", team:"Rote Blitze",  c1:"#e5484d",c2:"#f4f4f4"}},
  {name:"Wirbel",  look:{hair:2,hairColor:"#5a3825",skin:"#c68642",shirt:"#2f6fde",shorts:"#1f3f8f",boots:"#f4f4f4",number:"7", team:"Blaue Wirbel", c1:"#2f6fde",c2:"#ffc83d"}},
  {name:"Sonne",   look:{hair:3,hairColor:"#e6c15a",skin:"#ffe0c7",shirt:"#ffc83d",shorts:"#22252b",boots:"#22252b",number:"10",team:"Gelbe Sonnen", c1:"#ffc83d",c2:"#22252b"}},
  {name:"Wald",    look:{hair:4,hairColor:"#22252b",skin:"#8d5524",shirt:"#34a853",shorts:"#f4f4f4",boots:"#e5484d",number:"11",team:"Grüne Wälder", c1:"#34a853",c2:"#f4f4f4"}},
  {name:"Nacht",   look:{hair:7,hairColor:"#2b1d14",skin:"#e3a877",shirt:"#22252b",shorts:"#22252b",boots:"#d7f000",number:"1", team:"Nachtfalken",  c1:"#22252b",c2:"#d7f000"}},
  {name:"Rakete",  look:{hair:1,hairColor:"#b8341f",skin:"#ffe0c7",shirt:"#ff8a00",shorts:"#1f3f8f",boots:"#f4f4f4",number:"8", team:"Raketen",      c1:"#ff8a00",c2:"#1f3f8f"}},
  {name:"Eis",     look:{hair:5,hairColor:"#c48b3c",skin:"#f6c9a0",shirt:"#17b3b3",shorts:"#f4f4f4",boots:"#22252b",number:"5", team:"Eiskristalle", c1:"#17b3b3",c2:"#f4f4f4"}},
  {name:"Beere",   look:{hair:6,hairColor:"#e75a9c",skin:"#c68642",shirt:"#8e44ad",shorts:"#f4f4f4",boots:"#ff8a00",number:"3", team:"Beerenstark",  c1:"#8e44ad",c2:"#f27fb1"}}
];

export function cleanText(v,max,d){
  const t=typeof v==="string"?v.replace(/[^\p{L}\p{N} .'\-]/gu,"").replace(/\s+/g," ").trim().slice(0,max):"";
  return t||d;
}
export function cleanNumber(v,d="10"){const t=String(v===undefined||v===null?"":v).replace(/\D/g,"").slice(0,2);return t===""?d:String(Number(t));}

// Macht aus beliebigen Daten einen gültigen Aussehen-Satz (fehlende oder falsche Werte werden ersetzt).
export function cleanLook(look,fallback){
  const b=fallback||TEMPLATES[0].look,l=look&&typeof look==="object"?look:{};
  return{
    v:1,
    hair:int(l.hair,0,HAIR_STYLES.length-1,b.hair),hairColor:hex(l.hairColor,b.hairColor),skin:hex(l.skin,b.skin),
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

// ---------- Trainer ----------
export const TRAINER_NAME="Trainer Papa";
export const CAP_COLORS=["#e5484d","#2f6fde","#22252b","#34a853","#ffc83d","#ff8a00","#f4f4f4"];
export const JACKET_COLORS=["#2f6fde","#e5484d","#22252b","#34a853","#8e44ad","#ff8a00","#17b3b3"];
export const defaultTrainerLook=()=>({v:1,cap:"#e5484d",skin:"#f6c9a0",jacket:"#2f6fde",hairColor:"#5a3825",beard:0});
export const defaultTrainer=()=>({name:TRAINER_NAME,look:defaultTrainerLook(),t:0});
export function cleanTrainerLook(look){
  const d=defaultTrainerLook(),l=look&&typeof look==="object"?look:{};
  return{v:1,cap:hex(l.cap,d.cap),skin:hex(l.skin,d.skin),jacket:hex(l.jacket,d.jacket),hairColor:hex(l.hairColor,d.hairColor),beard:l.beard?1:0};
}
export function cleanTrainer(tr){
  const t=tr&&typeof tr==="object"?tr:{};
  return{name:cleanText(t.name,16,TRAINER_NAME),look:cleanTrainerLook(t.look),t:Number.isFinite(t.t)?t.t:0};
}
