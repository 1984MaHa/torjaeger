// Datenmodell, Schemaversion und Migrationen.
//
// Konto (profile-Stand, schemaVersion 4):
//   meta      schemaVersion, deviceId, rev (letzte bekannte Server-Revision), updatedAt, createdAt, resetAt
//   profile   id, name, t (Zeitstempel der letzten Änderung), avatar (Aussehen samt eigenem t oder null), avatarAsked
//   progress  dev (Zähler je Gerät: points, rounds, wins, stickers), days, lg (Ligen-Freigaben), sel, cur ({li, t}: gewählte aktuelle Liga, li null = Vorgabe)
//   stats     je Thema: tot (Antworten je Gerät: a, c), last (letzte 10 Antworten {t, ok, d, h?}), help (je Gerät: n, t1, t2) und ctl (Kontrolle je Gerät: n Kontroll-Pfiffe, p benutzte Proben, f selbst korrigierte Fehler)
//   history   abgeschlossene Spiele {id, t, d, liga, mode, trial, c, n, pts, dur?, topic?, pk?} (pk = Päckchen, topic = Themenblock)
//   settings  sound, t, perRound, trialN, trialDaily, hintAfter
// Global (kontenübergreifend): schemaVersion, pin, updatedAt, trainer und trainer2 (Trainer und Trainerin: name, look, t).
// Schemaversion 1 (Phase 1) hatte weder avatar noch die neuen Einstellungen, help, dur und trainer.
// Schemaversion 2 (bis App 1.1.5) hatte weder progress.cur noch stats.ctl noch topic und pk im Verlauf.
// Schemaversion 3 (App 1.2.x) hatte das alte Aussehen (Frisur als Zahl je Junge/Mädchen, Trainer mit v 2). Ab 4 (App 1.3.0): Frisur als Schlüssel,
// neue Felder browColor, cheeks, outfit, outfitColor, bg; Trainer mit v 3 (Bart in Formen, Kopfbedeckung, Merkmal). Global: Schemaversion 3.
//
// Zähler stehen je Gerät getrennt. Jedes Gerät schreibt nur seinen eigenen Zähler, die
// Anzeige ist die Summe. So geht beim Zusammenführen nichts verloren und doppeltes
// Zusammenführen zählt nichts doppelt.
import {PROBE} from "./content.js";
import {clone} from "./util.js";
import {defaultTrainer,defaultTrainer2,cleanLook,cleanTrainer} from "./avatar.js";

export const SCHEMA_VERSION=4;        // Konto-Stand
export const GLOBAL_SCHEMA_VERSION=3; // globale Einstellungen

export class UnsupportedSchema extends Error{constructor(v){super("Stand hat neuere Schemaversion "+v);this.schemaVersion=v;}}

// Einstellungen je Konto (Eltern im Admin): Ton, Aufgaben pro Runde (6, 8, 10), Schnupper-Aufgaben, Schnuppern nur einmal pro Tag,
// Tipp-Zeit in Sekunden (0 = der Trainer meldet sich nicht von selbst).
export const defaultSettings=()=>({sound:true,t:0,perRound:8,trialN:3,trialDaily:true,hintAfter:45});

export function newProfile({id,name,deviceId,now=Date.now()}){
  return{
    meta:{schemaVersion:SCHEMA_VERSION,deviceId,rev:0,updatedAt:now,createdAt:now,resetAt:0},
    profile:{id,name,t:now,avatar:null,avatarAsked:false},
    progress:{dev:{},days:[],lg:{},sel:0,cur:{li:null,t:0}},
    stats:{},history:[],
    settings:defaultSettings()
  };
}
export function newGlobal(now=Date.now()){return{schemaVersion:GLOBAL_SCHEMA_VERSION,pin:null,updatedAt:now,trainer:defaultTrainer(),trainer2:defaultTrainer2()};}

export const defaultLg=()=>({probe:false,spent:0,open:false,trial:"",t:0});
export function lgOf(s,id){return s.progress.lg[id]||(s.progress.lg[id]=defaultLg());}
export const devOf=(s,deviceId)=>s.progress.dev[deviceId]||(s.progress.dev[deviceId]={points:0,rounds:0,wins:0,stickers:0});
export function total(s,field){let n=0;for(const k in s.progress.dev)n+=s.progress.dev[k][field]||0;return n;}
export function helpOf(s,topic){const st=s.stats[topic];let n=0,t1=0,t2=0;if(st&&st.help)for(const k in st.help){n+=st.help[k].n||0;t1+=st.help[k].t1||0;t2+=st.help[k].t2||0;}return{n,t1,t2};}
export function ctlOf(s,topic){const st=s.stats[topic];let n=0,p=0,f=0;if(st&&st.ctl)for(const k in st.ctl){n+=st.ctl[k].n||0;p+=st.ctl[k].p||0;f+=st.ctl[k].f||0;}return{n,p,f};}
export function statOf(s,topic){return s.stats[topic]||(s.stats[topic]={tot:{},last:[]});}
export function answersOf(s,topic){const st=s.stats[topic];let a=0,c=0;if(st)for(const k in st.tot){a+=st.tot[k].a||0;c+=st.tot[k].c||0;}return{a,c};}

// ---------- Migrationen ----------
// Stufe 0 (Prototyp) ist migratePrototype. Ab Version 1 kommt jede neue Stufe hier hinein:
// {from:1,to:2,run:s=>{...; s.meta.schemaVersion=2; return s;}}. Sie hebt einen Stand von
// `from` auf `to` und muss unbekannte Felder erhalten. Zusätzlich SCHEMA_VERSION erhöhen.
const PROFILE_MIGRATIONS=[
  // 1 -> 2 (App 1.1.0): Avatar, neue Konto-Einstellungen. Alles Vorhandene bleibt, Unbekanntes auch.
  {from:1,to:2,run:s=>{
    s.profile=Object.assign({avatar:null,avatarAsked:false},s.profile);
    s.settings=Object.assign(defaultSettings(),s.settings);
    s.meta.schemaVersion=2;
    return s;
  }},
  // 2 -> 3 (App 1.2.0): gewählte aktuelle Liga (Vorgabe: die höchste freie). stats.ctl, topic und pk entstehen erst bei Nutzung.
  {from:2,to:3,run:s=>{
    s.progress=Object.assign({cur:{li:null,t:0}},s.progress);
    s.meta.schemaVersion=3;
    return s;
  }},
  // 3 -> 4 (App 1.3.0): neues Aussehen. Der alte Avatar wird in die neuen Merkmale überführt (nächstliegende Werte), sein Zeitstempel t bleibt.
  {from:3,to:4,run:s=>{
    const av=s.profile&&s.profile.avatar;
    if(av&&typeof av==="object")s.profile.avatar=Object.assign(cleanLook(av),{t:Number.isFinite(av.t)?av.t:0});
    s.meta.schemaVersion=4;
    return s;
  }}
];
export function migrateProfile(state,opts={}){
  let v=state&&state.meta&&state.meta.schemaVersion;
  if(v===undefined||v===null)return migratePrototype(state,opts).state; // Prototypformat ohne meta
  if(v>SCHEMA_VERSION)throw new UnsupportedSchema(v);
  while(v<SCHEMA_VERSION){
    const m=PROFILE_MIGRATIONS.find(x=>x.from===v);
    if(!m)throw new Error("Keine Migration von Schemaversion "+v);
    state=m.run(clone(state));v=state.meta.schemaVersion;
  }
  return state;
}
export function migrateGlobal(g){
  if(!g||typeof g!=="object")return newGlobal();
  const v=g.schemaVersion===undefined?1:g.schemaVersion;
  if(v>GLOBAL_SCHEMA_VERSION)throw new UnsupportedSchema(v);
  g.schemaVersion=GLOBAL_SCHEMA_VERSION;
  if(g.pin===undefined)g.pin=null;
  // 1 -> 2: Trainer und Trainerin. Ein nie geänderter Eintrag (t 0) bekommt immer die aktuelle Vorgabe.
  if(!g.trainer||typeof g.trainer!=="object"||g.trainer.t===0)g.trainer=defaultTrainer();
  if(!g.trainer2||typeof g.trainer2!=="object"||g.trainer2.t===0)g.trainer2=defaultTrainer2();
  // 2 -> 3 (App 1.3.0): Trainer im neuen Aufbau (Frisur als Schlüssel, Bart in Formen). Name und Zeitstempel bleiben.
  if(v<3){g.trainer=cleanTrainer(g.trainer,1);g.trainer2=cleanTrainer(g.trainer2,2);}
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
  s.settings=Object.assign(defaultSettings(),{sound:old.sound!==false,t:0});
  for(const k in old)if(!KNOWN.includes(k))s[k]=clone(old[k]); // Unbekanntes bleibt erhalten
  const pin=old.pin?{algo:"legacy-djb2",hash:String(old.pin),t:0}:null;
  return{state:s,pin};
}
const num=v=>Number.isFinite(Number(v))?Number(v):0;
