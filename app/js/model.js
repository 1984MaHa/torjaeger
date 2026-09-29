// Datenmodell, Schemaversion und Migrationen.
//
// Konto (profile-Stand, schemaVersion 1):
//   meta      schemaVersion, deviceId, rev (letzte bekannte Server-Revision), updatedAt, createdAt, resetAt
//   profile   id, name, t (Zeitstempel der letzten Änderung)
//   progress  dev (Zähler je Gerät: points, rounds, wins, stickers), days, lg (Ligen-Freigaben), sel
//   stats     je Thema: tot (Antworten je Gerät: a, c) und last (letzte 10 Antworten {t, ok, d})
//   history   abgeschlossene Spiele
//   settings  sound, t
// Global (kontenübergreifend): schemaVersion, pin, updatedAt.
//
// Zähler stehen je Gerät getrennt. Jedes Gerät schreibt nur seinen eigenen Zähler, die
// Anzeige ist die Summe. So geht beim Zusammenführen nichts verloren und doppeltes
// Zusammenführen zählt nichts doppelt.
import {PROBE} from "./content.js";
import {clone} from "./util.js";

export const SCHEMA_VERSION=1;        // Konto-Stand
export const GLOBAL_SCHEMA_VERSION=1; // globale Einstellungen

export class UnsupportedSchema extends Error{constructor(v){super("Stand hat neuere Schemaversion "+v);this.schemaVersion=v;}}

export function newProfile({id,name,deviceId,now=Date.now()}){
  return{
    meta:{schemaVersion:SCHEMA_VERSION,deviceId,rev:0,updatedAt:now,createdAt:now,resetAt:0},
    profile:{id,name,t:now},
    progress:{dev:{},days:[],lg:{},sel:0},
    stats:{},history:[],
    settings:{sound:true,t:0}
  };
}
export function newGlobal(now=Date.now()){return{schemaVersion:GLOBAL_SCHEMA_VERSION,pin:null,updatedAt:now};}

export const defaultLg=()=>({probe:false,spent:0,open:false,trial:"",t:0});
export function lgOf(s,id){return s.progress.lg[id]||(s.progress.lg[id]=defaultLg());}
export const devOf=(s,deviceId)=>s.progress.dev[deviceId]||(s.progress.dev[deviceId]={points:0,rounds:0,wins:0,stickers:0});
export function total(s,field){let n=0;for(const k in s.progress.dev)n+=s.progress.dev[k][field]||0;return n;}
export function statOf(s,topic){return s.stats[topic]||(s.stats[topic]={tot:{},last:[]});}
export function answersOf(s,topic){const st=s.stats[topic];let a=0,c=0;if(st)for(const k in st.tot){a+=st.tot[k].a||0;c+=st.tot[k].c||0;}return{a,c};}

// ---------- Migrationen ----------
// Stufe 0 (Prototyp) ist migratePrototype. Ab Version 1 kommt jede neue Stufe hier hinein:
// {from:1,to:2,run:s=>{...; s.meta.schemaVersion=2; return s;}}. Sie hebt einen Stand von
// `from` auf `to` und muss unbekannte Felder erhalten. Zusätzlich SCHEMA_VERSION erhöhen.
const PROFILE_MIGRATIONS=[];
export function migrateProfile(state,opts={}){
  let v=state&&state.meta&&state.meta.schemaVersion;
  if(v===undefined||v===null)return migratePrototype(state,opts).state; // Prototypformat ohne meta
  if(v>SCHEMA_VERSION)throw new UnsupportedSchema(v);
  while(v<SCHEMA_VERSION){
    const m=PROFILE_MIGRATIONS.find(x=>x.from===v);
    if(!m)throw new Error("Keine Migration von Schemaversion "+v);
    state=m.run(state);v=state.meta.schemaVersion;
  }
  return state;
}
export function migrateGlobal(g){
  if(!g||typeof g!=="object")return newGlobal();
  const v=g.schemaVersion===undefined?1:g.schemaVersion;
  if(v>GLOBAL_SCHEMA_VERSION)throw new UnsupportedSchema(v);
  g.schemaVersion=GLOBAL_SCHEMA_VERSION;
  if(g.pin===undefined)g.pin=null;
  return g;
}

// Prototypformat (Version 0, localStorage-Schlüssel "torjaeger"):
//   {points,rounds,wins,stickers,stats:{topic:{a,c,last:[0|1]}},days:[],history:[{d,liga,mode,trial,c,n,pts}],
//    sound,pin:"h…",lg:{L2:{budget,open,trial},L3:{…}},sel}
// Ergebnis: neuer Konto-Stand plus die PIN für die globalen Einstellungen (alter, nicht umrechenbarer Hash).
export function migratePrototype(old,{id="konto",name="Spieler",deviceId="migration",now=Date.now()}={}){
  old=old||{};
  const KNOWN=["points","rounds","wins","stickers","stats","days","history","sound","pin","lg","sel"];
  const s=newProfile({id,name,deviceId,now});
  s.progress.dev[deviceId]={points:num(old.points),rounds:num(old.rounds),wins:num(old.wins),stickers:num(old.stickers)};
  s.progress.days=Array.isArray(old.days)?old.days.slice():[];
  s.progress.sel=num(old.sel);
  for(const id2 in (old.lg||{})){
    const l=old.lg[id2]||{};
    const budget=(l.budget===null||l.budget===undefined)?null:num(l.budget);
    s.progress.lg[id2]={probe:budget!==null,spent:budget===null?0:Math.max(0,Math.min(PROBE,PROBE-budget)),open:!!l.open,trial:l.trial||"",t:0};
  }
  for(const topic in (old.stats||{})){
    const o=old.stats[topic]||{},last=Array.isArray(o.last)?o.last:[];
    // Zeitstempel sind unbekannt: kleine, geordnete Werte, älter als jede echte Antwort.
    s.stats[topic]={tot:{[deviceId]:{a:num(o.a),c:num(o.c)}},last:last.slice(-10).map((x,i)=>({t:i+1,ok:x?1:0,d:"mig"}))};
  }
  s.history=(Array.isArray(old.history)?old.history:[]).map((h,i)=>{
    const t=Date.parse(h.d)||0;
    return Object.assign({},h,{id:"mig-"+i,t});
  });
  s.settings={sound:old.sound!==false,t:0};
  for(const k in old)if(!KNOWN.includes(k))s[k]=clone(old[k]); // Unbekanntes bleibt erhalten
  const pin=old.pin?{algo:"legacy-djb2",hash:String(old.pin),t:0}:null;
  return{state:s,pin};
}
const num=v=>Number.isFinite(Number(v))?Number(v):0;
