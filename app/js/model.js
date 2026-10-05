// Datenmodell, Schemaversion und Migrationen.
//
// Konto (profile-Stand, schemaVersion 9):
//   meta      schemaVersion, deviceId, rev (letzte bekannte Server-Revision), updatedAt, createdAt, resetAt
//   profile   id, name, t (Zeitstempel der letzten Änderung), avatar (Aussehen samt eigenem t oder null), avatarAsked
//   progress  dev (Zähler je Gerät: points, rounds, wins, stickers), days, lg (Ligen-Freigaben), sel, cur ({li, t}: gewählte aktuelle Liga, li null = Vorgabe)
//   stats     je Thema: tot (Antworten je Gerät: a, c), last (letzte 10 Antworten {t, ok, d, h?, lv?}), help (je Gerät: n, t1, t2), ctl (Kontrolle je Gerät: n Kontroll-Pfiffe, p benutzte Proben, f selbst korrigierte Fehler),
//             lv (Stufe 1 bis 3, nur Englisch, steigt nie zurück) und terms (Statistik je Begriff: je Gerät {"a:Begriff": Antworten, "c:Begriff": richtige})
//   history   abgeschlossene Spiele {id, t, d, liga, mode, trial, c, n, pts, dur?, topic?, pk?} (pk = Päckchen, topic = Themenblock; mode auch eng und su)
//   settings  sound, t, perRound, trialN, trialDaily, hintAfter, topicMode (je Thema "wiederholen", "aus", "schwerpunkt" oder "zurueck", fehlt = aktuell),
//             topicUntil (ab Schema 8: je zurückgestelltem Thema optional das Datum "JJJJ-MM-TT", an dem es wieder aktuell wird), topicSeen (ab Schema 8: Themen, die das Konto schon kennt; ein Thema, das fehlt und nicht in topicMode steht, ist neu und startet zurückgestellt)
//   settings.mul (ab Schema 9, App 1.7.1) Einmaleins-Grenze: {rows: Reihen 1 bis 10, zero: auch mal 0}; fehlt sie, gelten alle Reihen und 0 an
//   camps     (ab Schema 7, App 1.5.4) Trainingslager je Thema: {m3_rest: {on, t (Schalter), rs (Neustart), units: {"1": {h1, h2, pen?, t, runs}}, badge (Zeitpunkt oder 0)}}
// Global (kontenübergreifend): schemaVersion, pin, updatedAt, trainer und trainer2 (Trainer und Trainerin: name, look, t).
// Schemaversion 1 (Phase 1) hatte weder avatar noch die neuen Einstellungen, help, dur und trainer.
// Schemaversion 2 (bis App 1.1.5) hatte weder progress.cur noch stats.ctl noch topic und pk im Verlauf.
// Schemaversion 3 (App 1.2.x) hatte das alte Aussehen (Frisur als Zahl je Junge/Mädchen, Trainer mit v 2). Ab 4 (App 1.3.0): Frisur als Schlüssel,
// neue Felder browColor, cheeks, outfit, outfitColor, bg; Trainer mit v 3 (Bart in Formen, Kopfbedeckung, Merkmal). Global: Schemaversion 3.
// Schemaversion 4 (App 1.3.x) hatte weder settings.topicMode noch stats.lv und stats.terms noch die Spielarten eng und su. Ab 5 (App 1.4.0): Themensteuerung, Englisch-Stufen, Begriffsstatistik.
//
// Zähler stehen je Gerät getrennt. Jedes Gerät schreibt nur seinen eigenen Zähler, die
// Anzeige ist die Summe. So geht beim Zusammenführen nichts verloren und doppeltes
// Zusammenführen zählt nichts doppelt.
import {PROBE} from "./content.js";
import {clone} from "./util.js";
import {defaultTrainer,defaultTrainer2,cleanLook,cleanTrainer,upgradeOldHair} from "./avatar.js";

export const SCHEMA_VERSION=9;        // Konto-Stand
export const GLOBAL_SCHEMA_VERSION=4; // globale Einstellungen

const isObj=v=>v!==null&&typeof v==="object"&&!Array.isArray(v);
export class UnsupportedSchema extends Error{constructor(v){super("Stand hat neuere Schemaversion "+v);this.schemaVersion=v;}}

// Einstellungen je Konto (Eltern im Admin): Ton, Aufgaben pro Runde (6, 8, 10), Schnupper-Aufgaben, Schnuppern nur einmal pro Tag,
// Tipp-Zeit in Sekunden (0 = der Trainer meldet sich nicht von selbst).
// topicMode: je Thema die Steuerung der Eltern ("wiederholen" oder "aus"), fehlt ein Thema, ist es "aktuell".
// Alle Themen, die es bei Schemaversion 8 (App 1.6.1) gab. Feste Liste: die Migration 7 nach 8 trägt sie als bekannt ein, spätere Themen sind dann neu.
export const TOPICS_AT_8=["m_read","m_split","m_plaet","m_zehner","m_mal","m_rechnen","d_wortart","d_verl","d_satz","m3_rest","m3_1x1","m3_htz","m3_plus","m3_sach","d3_praet","d3_fam","d3_ie","d3_doppel","d3_satzglied","en_farben","en_zahlen","en_koerper","en_kleidung","en_familie","en_schule","en_essen","en_tiere","en_hobbys","en_wetter","su_sinne","su_tiere","su_getreide","su_kartoffel","su_wasser","su_himmel","su_verkehr","m4_stelle","m4_mult","m4_div","m4_runden","d4_perfekt","d4_rede","d4_steigern"];
export const defaultSettings=()=>({sound:true,t:0,perRound:8,trialN:3,trialDaily:true,hintAfter:45,topicMode:{},mul:{rows:[1,2,3,4,5,6,7,8,9,10],zero:true}});

// Ein neues Konto kennt alle Themen, die es gerade gibt (topics = Liste der Themen-Kennungen aus content.js).
export function newProfile({id,name,deviceId,now=Date.now(),topics=null}){
  return{
    meta:{schemaVersion:SCHEMA_VERSION,deviceId,rev:0,updatedAt:now,createdAt:now,resetAt:0},
    profile:{id,name,t:now,avatar:null,avatarAsked:false},
    progress:{dev:{},days:[],lg:{},sel:0,cur:{li:null,t:0}},
    stats:{},history:[],
    settings:Object.assign(defaultSettings(),{topicSeen:topics?topics.slice():TOPICS_AT_8.slice()}),
    camps:{}
  };
}
export function newGlobal(now=Date.now()){return{schemaVersion:GLOBAL_SCHEMA_VERSION,pin:null,updatedAt:now,trainer:defaultTrainer(),trainer2:defaultTrainer2()};}

export const defaultLg=()=>({probe:false,spent:0,open:false,trial:"",t:0});
export function lgOf(s,id){return s.progress.lg[id]||(s.progress.lg[id]=defaultLg());}
export const devOf=(s,deviceId)=>s.progress.dev[deviceId]||(s.progress.dev[deviceId]={points:0,rounds:0,wins:0,stickers:0});
export function total(s,field){let n=0;for(const k in s.progress.dev)n+=s.progress.dev[k][field]||0;return n;}
export function helpOf(s,topic){const st=s.stats[topic];let n=0,t1=0,t2=0;if(st&&st.help)for(const k in st.help){n+=st.help[k].n||0;t1+=st.help[k].t1||0;t2+=st.help[k].t2||0;}return{n,t1,t2};}
export function ctlOf(s,topic){const st=s.stats[topic];let n=0,p=0,f=0;if(st&&st.ctl)for(const k in st.ctl){n+=st.ctl[k].n||0;p+=st.ctl[k].p||0;f+=st.ctl[k].f||0;}return{n,p,f};}
// Englisch-Stufe eines Themas (1 bis 3) und Begriffsstatistik (Summe über alle Geräte)
export const lvOf=(s,topic)=>{const v=s.stats[topic]&&s.stats[topic].lv;return Number.isInteger(v)&&v>=1&&v<=3?v:1;};
export function termsOf(s,topic){const st=s.stats[topic],out={};if(st&&st.terms)for(const d in st.terms)for(const k in st.terms[d]){const id=k.slice(2),e=out[id]||(out[id]={a:0,c:0});e[k[0]]+=st.terms[d][k]||0;}return out;}
// Trainingslager eines Themas mit Vorgaben (ältere Stände und Konten ohne Trainingslager funktionieren weiter). Verändert den Stand nicht.
export const defaultCamp=()=>({on:false,t:0,rs:0,units:{},badge:0});
export function campOf(s,topic){
  const c=s&&isObj(s.camps)&&isObj(s.camps[topic])?s.camps[topic]:null;
  return Object.assign(defaultCamp(),c,{units:c&&isObj(c.units)?c.units:{}});
}
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
    if(av&&typeof av==="object")s.profile.avatar=Object.assign(upgradeOldHair(av),{v:3,t:Number.isFinite(av.t)?av.t:0});
    s.meta.schemaVersion=4;
    return s;
  }},
  // 4 -> 5 (App 1.4.0): Themensteuerung der Eltern (alles "aktuell"). stats.lv und stats.terms entstehen erst bei Nutzung (Stufe fehlt = 1).
  {from:4,to:5,run:s=>{
    s.settings=Object.assign(defaultSettings(),s.settings);
    if(!s.settings.topicMode||typeof s.settings.topicMode!=="object"||Array.isArray(s.settings.topicMode))s.settings.topicMode={};
    s.meta.schemaVersion=5;
    return s;
  }},
  // 5 -> 6 (App 1.5.0): feste Bild-Vorlage. Trikot-, Hosen- und Stutzenfarbe, Streifenfarbe, Nummer, Name und Mannschaftsname
  // des alten Avatars werden übernommen (kit, tpl); alle alten Felder bleiben im Stand, sein Zeitstempel t bleibt.
  {from:5,to:6,run:s=>{
    const av=s.profile&&s.profile.avatar;
    if(av&&typeof av==="object")s.profile.avatar=Object.assign(cleanLook(av),{t:Number.isFinite(av.t)?av.t:0});
    s.meta.schemaVersion=6;
    return s;
  }},
  // 6 -> 7 (App 1.5.4): Trainingslager (camps). Der Fortschritt je Thema entsteht erst bei Nutzung, ein Stand ohne Trainingslager bleibt gültig. Alles Vorhandene bleibt, Unbekanntes auch.
  {from:6,to:7,run:s=>{
    if(!isObj(s.camps))s.camps={};
    s.meta.schemaVersion=7;
    return s;
  }},
  // 7 -> 8 (App 1.6.1): Themen-Zustände. topicSeen trägt alle bisherigen Themen als bekannt ein (nichts wird zurückgestellt), topicUntil entsteht bei Nutzung.
  {from:7,to:8,run:s=>{
    s.settings=Object.assign(defaultSettings(),s.settings);
    if(!isObj(s.settings.topicMode))s.settings.topicMode={};
    if(!Array.isArray(s.settings.topicSeen))s.settings.topicSeen=TOPICS_AT_8.slice();
    s.meta.schemaVersion=8;
    return s;
  }},
  // 8 -> 9 (App 1.7.1): Einmaleins-Grenze je Konto (Standard: alle Reihen, 0 an). Eine schon vorhandene Einstellung bleibt, Unbekanntes auch.
  {from:8,to:9,run:s=>{
    s.settings=Object.assign(defaultSettings(),s.settings);
    if(!isObj(s.settings.mul))s.settings.mul=defaultSettings().mul;
    s.meta.schemaVersion=9;
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
  // 3 -> 4 (App 1.5.0): Trainer tragen Farben (Polo, Hose, Stutzen) statt Baukasten-Merkmale. Die frühere Jacke wird zur Polo-Farbe, alles Alte bleibt.
  if(v<4){g.trainer=cleanTrainer(g.trainer,1);g.trainer2=cleanTrainer(g.trainer2,2);}
  return g;
}

// ---------- Mindeststruktur (Server und App prüfen vor dem Speichern bzw. Senden) ----------
// Gibt null zurück, wenn der Stand die Pflichtfelder hat, sonst einen kurzen Grund. Unbekannte Zusatzfelder sind erlaubt.
// Pflicht Konto: meta.schemaVersion (ganze Zahl ab 1), meta.updatedAt (Zahl), profile.id und profile.name (Text),
// progress als Objekt mit dev (Objekt), days (Liste), lg (Objekt), stats (Objekt), history (Liste), settings (Objekt).
export function checkProfileState(s){
  if(!isObj(s))return"Stand ist kein Objekt";
  if(!isObj(s.meta))return"meta fehlt";
  if(!Number.isInteger(s.meta.schemaVersion)||s.meta.schemaVersion<1)return"meta.schemaVersion fehlt";
  if(typeof s.meta.updatedAt!=="number"||!Number.isFinite(s.meta.updatedAt))return"meta.updatedAt fehlt";
  if(!isObj(s.profile))return"profile fehlt";
  if(typeof s.profile.id!=="string"||!s.profile.id)return"profile.id fehlt";
  if(typeof s.profile.name!=="string")return"profile.name fehlt";
  if(!isObj(s.progress))return"progress fehlt";
  if(!isObj(s.progress.dev))return"progress.dev fehlt";
  if(!Array.isArray(s.progress.days))return"progress.days fehlt";
  if(!isObj(s.progress.lg))return"progress.lg fehlt";
  if(!isObj(s.stats))return"stats fehlt";
  if(!Array.isArray(s.history))return"history fehlt";
  if(!isObj(s.settings))return"settings fehlt";
  // Themen-Zustände (ab 1.6.1) sind freiwillig: topicUntil ein Objekt, topicSeen eine Liste
  if(s.settings.topicUntil!==undefined&&!isObj(s.settings.topicUntil))return"settings.topicUntil ist kein Objekt";
  if(s.settings.topicSeen!==undefined&&!Array.isArray(s.settings.topicSeen))return"settings.topicSeen ist keine Liste";
  if(s.settings.mul!==undefined&&!isObj(s.settings.mul))return"settings.mul ist kein Objekt";
  // Trainingslager (ab 1.5.4) ist freiwillig. Ist es da, muss es ein Objekt sein, je Thema ein Objekt mit units als Objekt.
  if(s.camps!==undefined){
    if(!isObj(s.camps))return"camps ist kein Objekt";
    for(const k in s.camps){
      if(!isObj(s.camps[k]))return"camps."+k+" ist kein Objekt";
      if(s.camps[k].units!==undefined&&!isObj(s.camps[k].units))return"camps."+k+".units ist kein Objekt";
    }
  }
  return null;
}
// Pflicht global: schemaVersion (ganze Zahl ab 1), pin leer oder mit Hash (und Salz, außer beim Alt-Hash), trainer und trainer2 (falls vorhanden) als Objekte.
export function checkGlobalState(g){
  if(!isObj(g))return"Einstellungen sind kein Objekt";
  if(!Number.isInteger(g.schemaVersion)||g.schemaVersion<1)return"schemaVersion fehlt";
  if(g.pin!==undefined&&g.pin!==null){
    if(!isObj(g.pin)||typeof g.pin.hash!=="string"||!g.pin.hash)return"pin ist unvollständig";
    if(g.pin.algo!=="legacy-djb2"&&(typeof g.pin.salt!=="string"||!g.pin.salt))return"pin ist unvollständig";
  }
  for(const k of ["trainer","trainer2"])if(g[k]!==undefined&&!isObj(g[k]))return k+" ist kein Objekt";
  return null;
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
