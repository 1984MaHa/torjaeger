// Spieler und Trainerteam (ab 1.5.0): feste Bild-Vorlagen statt Baukasten. Anpassbar sind nur Farben, Rückennummer,
// eigener Name, Vereinsname (Kind) und Farben, Name (Trainerteam). Gezeichnet wird in avatardraw.js, Bilder und Umfärben in figures.js.
// Aussehen eines Kindes: {v:4, tpl, kit:{trikot,streifen,hose,stutzen}, number, shirtName, team, t, ...}.
// Felder aus früheren Versionen (hair, shirt, c1, ...) bleiben im Stand erhalten, werden aber nicht mehr benutzt.
export const TEMPLATE_IDS=["emil"];
// Vorlagen fürs Kind: Bilder (vorn, hinten), Umfärb-Bereiche (die Namen stehen auch in figdata.js) und Vorgabefarben = Farben des Bildes.
export const KID_TEMPLATES=[
  {id:"emil",name:"Emil",front:"emil-front",back:"emil-back",regions:["streifen","trikot","hose","stutzen"],
   kit:{trikot:"#26589d",streifen:"#f4f4f4",hose:"#2b2e33",stutzen:"#2b2e33"}}
];
export const KIT_LABELS={trikot:"Trikot",streifen:"Streifen",hose:"Hose",stutzen:"Stutzen"};
export const KIT_KEYS=["trikot","streifen","hose","stutzen"];
// Feste, gut unterscheidbare Farben (Name steht für Vorlesen und Beschriftung)
export const KIT_COLORS=["#26589d","#4aa3e8","#1d3a78","#d23b3b","#f5c431","#f08a1c","#2f9e55","#19a7a7","#7b3fa0","#ee7fae","#f4f4f4","#8a8f98","#2b2e33"];
export const COLOR_NAMES={"#26589d":"blau","#4aa3e8":"hellblau","#1d3a78":"dunkelblau","#d23b3b":"rot","#f5c431":"gelb","#f08a1c":"orange","#2f9e55":"grün","#19a7a7":"türkis","#7b3fa0":"lila","#ee7fae":"rosa","#f4f4f4":"weiß","#8a8f98":"grau","#2b2e33":"schwarz","#2c3240":"nachtblau"};
// Vereinsfarben-Vorschläge: Trikot, Streifen, Hose, Stutzen auf einen Tipp
export const KIT_PRESETS=[
  {name:"Blau Weiß",team:"Blau Weiß",kit:{trikot:"#26589d",streifen:"#f4f4f4",hose:"#2b2e33",stutzen:"#2b2e33"}},
  {name:"Rot Weiß",team:"Rote Blitze",kit:{trikot:"#d23b3b",streifen:"#f4f4f4",hose:"#f4f4f4",stutzen:"#d23b3b"}},
  {name:"Gelb Schwarz",team:"Gelbe Sonnen",kit:{trikot:"#f5c431",streifen:"#2b2e33",hose:"#2b2e33",stutzen:"#f5c431"}},
  {name:"Grün Weiß",team:"Grüne Wälder",kit:{trikot:"#2f9e55",streifen:"#f4f4f4",hose:"#f4f4f4",stutzen:"#2f9e55"}},
  {name:"Schwarz Gelb",team:"Nachtfalken",kit:{trikot:"#2b2e33",streifen:"#f5c431",hose:"#2b2e33",stutzen:"#f5c431"}},
  {name:"Orange Blau",team:"Raketen",kit:{trikot:"#f08a1c",streifen:"#1d3a78",hose:"#1d3a78",stutzen:"#f08a1c"}},
  {name:"Lila Weiß",team:"Beerenstark",kit:{trikot:"#7b3fa0",streifen:"#f4f4f4",hose:"#f4f4f4",stutzen:"#7b3fa0"}},
  {name:"Türkis Weiß",team:"Eiskristalle",kit:{trikot:"#19a7a7",streifen:"#f4f4f4",hose:"#2b2e33",stutzen:"#19a7a7"}},
  {name:"Hellblau Weiß",team:"Blaue Wirbel",kit:{trikot:"#4aa3e8",streifen:"#f4f4f4",hose:"#f4f4f4",stutzen:"#4aa3e8"}},
  {name:"Weiß Blau",team:"Weiße Wellen",kit:{trikot:"#f4f4f4",streifen:"#26589d",hose:"#26589d",stutzen:"#f4f4f4"}}
];

const HEX=/^#[0-9a-fA-F]{6}$/;
const hex=(v,d)=>typeof v==="string"&&HEX.test(v)?v.toLowerCase():d;

export function cleanText(v,max,d){
  const t=typeof v==="string"?v.replace(/[^\p{L}\p{N} .'\-]/gu,"").replace(/\s+/g," ").trim().slice(0,max):"";
  return t||d;
}
export function cleanNumber(v,d="10"){const t=String(v===undefined||v===null?"":v).replace(/\D/g,"").slice(0,2);return t===""?d:String(Number(t));}

// Alte Frisuren-Indizes (bis 1.2.1) werden beim Überführen in Schlüssel umgerechnet, damit im Stand nichts Unlesbares bleibt.
const OLD_HAIR={j:["kurz","wuschel","igel","locken","tolle","stoppel","scheitel","surfer","fransen","ohne"],m:["pferdeschwanz","zoepfe","lang","dutt","bob","lockenmaehne","halbzopf","pony","fransen","ohne"]};
export function upgradeOldHair(av){
  if(!av||typeof av!=="object"||!Number.isInteger(av.hair))return av;
  const a=OLD_HAIR[av.body==="m"?"m":"j"];
  return av.hair>=0&&av.hair<a.length?{...av,hair:a[av.hair]}:av;
}

const tplOf=id=>KID_TEMPLATES.find(t=>t.id===id)||KID_TEMPLATES[0];
// Farben des Trikots aus einem Aussehen: kit, sonst aus den alten Feldern (shirt, c2, shorts, socks), sonst Vorgabe der Vorlage
function kitOf(l,tpl,fb){
  const k=l.kit&&typeof l.kit==="object"?l.kit:{},d=fb&&fb.kit?fb.kit:tpl.kit;
  const old={trikot:l.shirt,streifen:l.c2,hose:l.shorts,stutzen:l.socks};
  const out={};
  for(const key of KIT_KEYS)out[key]=hex(k[key],hex(old[key],d[key]));
  return out;
}
// Macht aus beliebigen Daten (auch aus Ständen bis 1.4.1) ein gültiges Aussehen. Unbekannte Felder bleiben erhalten.
export function cleanLook(look,fallback){
  const l=look&&typeof look==="object"?upgradeOldHair(look):{},b=fallback&&typeof fallback==="object"?fallback:{};
  const tpl=tplOf(l.tpl||b.tpl);
  return{
    ...l,
    v:4,tpl:tpl.id,kit:kitOf(l,tpl,b),
    number:cleanNumber(l.number,b.number||"10"),
    shirtName:cleanText(l.shirtName,10,b.shirtName||"").toUpperCase(),
    team:cleanText(l.team,20,b.team||"Die Torjäger")
  };
}
const hashOf=t=>{let h=7;for(const c of String(t))h=(h*31+c.codePointAt(0))>>>0;return h;};
// Aussehen für Konten ohne eigenen Avatar: feste Vorgabe aus dem Namen (Emil-Vorlage, Vereinsfarben und Mannschaft aus den Vorschlägen)
export function defaultLook(name){
  const p=KIT_PRESETS[hashOf(name)%KIT_PRESETS.length];
  return cleanLook({tpl:KID_TEMPLATES[0].id,kit:p.kit,team:p.team,shirtName:String(name||"").slice(0,10),number:String(1+hashOf(name+"#")%20)});
}
// Aussehen eines Kontos (eigener Avatar oder Vorgabe aus dem Namen)
export const lookOf=profile=>profile&&profile.avatar?cleanLook(profile.avatar):defaultLook(profile&&profile.name);
// Vereinsfarben-Vorschlag anwenden (Mannschaftsname bleibt, wie er ist)
export const withPreset=(look,i)=>cleanLook({...look,kit:(KIT_PRESETS[i]||KIT_PRESETS[0]).kit});
export const withKit=(look,key,color)=>cleanLook({...look,kit:{...cleanLook(look).kit,[key]:color}});
// Gleiche Farben wie ein Vorschlag? (für die Anzeige „gewählt“)
export const presetIndex=look=>{const k=cleanLook(look).kit;return KIT_PRESETS.findIndex(p=>KIT_KEYS.every(x=>p.kit[x]===k[x]));};

// ---------- Trainer (zwei: Trainer und Trainerin, gelten für alle Konten) ----------
export const TRAINER_NAME="Trainer",TRAINER2_NAME="Trainerin";
export const TRAINER_KEYS=["polo","hose","stutzen"];
export const TRAINER_LABELS={polo:"Polo",hose:"Hose",stutzen:"Stutzen"};
export const POLO_COLORS=["#2c3240",...KIT_COLORS];
// Vorgaben = Farben des Bildes (dunkelblaues Polo, schwarze Hose und Stutzen)
export const defaultTrainerLook=()=>({v:4,polo:"#2c3240",hose:"#2b2e33",stutzen:"#2b2e33"});
export const defaultTrainer2Look=()=>({v:4,polo:"#2c3240",hose:"#2b2e33",stutzen:"#2b2e33"});
export const defaultTrainer=()=>({name:TRAINER_NAME,look:defaultTrainerLook(),t:0});
export const defaultTrainer2=()=>({name:TRAINER2_NAME,look:defaultTrainer2Look(),t:0});
export function cleanTrainerLook(look,which=1){
  const d=which===2?defaultTrainer2Look():defaultTrainerLook(),l=look&&typeof look==="object"?look:{};
  // frühere Jacke (bis 1.4.1) wird zur Polo-Farbe
  return{...l,v:4,polo:hex(l.polo,hex(l.jacket,d.polo)),hose:hex(l.hose,d.hose),stutzen:hex(l.stutzen,d.stutzen)};
}
export function cleanTrainer(tr,which=1){
  const t=tr&&typeof tr==="object"?tr:{},dn=which===2?TRAINER2_NAME:TRAINER_NAME;
  return{...t,name:cleanText(t.name,16,dn),look:cleanTrainerLook(t.look,which),t:Number.isFinite(t.t)?t.t:0};
}
