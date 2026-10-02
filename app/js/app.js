// Steuerung: Start, Konten, Spielablauf, lokales Speichern und automatischer Abgleich.
import {LIGEN,RIVALS,BONUS_FIX,allTopicsOf,poolOf,isEng,ALL_TOPICS} from "./content.js";
import {GEN} from "./generators.js";
import {packOf,gradePack,isRight,termResults,keyOf,packSnapshot,packResumable,packResume} from "./check.js";
import {CAMPS,campUnit,isPackUnit,penaltyTasks,wrongNote,campSnapshot,campResumable,campResume} from "./camp.js";
import {speak,canSpeak} from "./speech.js";
import {shuffle,pick,todayKey,esc,randomId,canon} from "./util.js";
import {newProfile,newGlobal,migrateProfile,migrateGlobal,UnsupportedSchema,SCHEMA_VERSION,GLOBAL_SCHEMA_VERSION,lvOf} from "./model.js";
import {leagueState,budgetOf,nextTopic,applyAnswer,applyTrial,applyRoundEnd,applyOpen,applyLock,applySound,applySel,applyRename,applySettings,applyHelp,applyAvatar,applyAvatarAsked,applyProfilePin,validKidPin,applyTrainer,applyCurrent,applyControl,applyTopicMode,applyTopicUntil,strikeStep,activeTopics,topicOn,settingsOf,roundLen,trialLen,playable,applyFach,applyCampOn,applyCampUnit,applyCampPen,applyCampReset,campOn,unitOpen,unitDone} from "./rules.js";
import {makePin,checkPin,validPin} from "./pin.js";
import {openStore,withRetry} from "./store.js";
import {createSync} from "./sync.js";
import {createAdminApi,adminError} from "./adminapi.js";
import {adminHTML} from "./admin.js";
import {avatarBuilderHTML} from "./avatarui.js";
import {pickShot} from "./avatardraw.js";
import {cleanLook,cleanTrainer,lookOf,withKit,withPreset,defaultTrainer,defaultTrainer2} from "./avatar.js";
import {loadFigures} from "./figures.js";
import {similarExample,exampleHTML} from "./coach.js";
import {tone} from "./audio.js";
import {boardHTML,homeHTML,accountsHTML,playHTML,resultHTML,rightText,bandHTML,saveWarnHTML,updateBannerHTML} from "./views.js";
import {newMini,miniAnswer,miniNext,miniOver} from "./mini.js";
import {miniHTML} from "./miniviews.js";
import {APP_VERSION} from "./version.js";

const root=document.getElementById("app");
let store,deviceId,sync,adminApi;
let globalRec;                 // {state:{pin,...}, baseRev, dirty, lastSync}
let accounts=[];               // [{id,name}]
let cur=null;                  // {rec:{id,state,baseRev,dirty,lastSync}}
let view="accounts",G=null,MG=null; // MG: laufendes Mini-Spiel
const UI={saveFail:false,savedPack:null,savedCamp:null,fach:null,lgOpen:{},av:null,preview:"",parent:false,pinMsg:"",celebrate:"",newAcct:false,acctMsg:"",adminAsk:false,admin:null,sync:"",updateReady:false,fatal:""};
const ctx=()=>({deviceId,now:Date.now()});
const S=()=>cur.rec.state;

// ================= Speicher =================
async function loadAll(){
  // Schreibfehler werden wiederholt; klappt es dauerhaft nicht, zeigt die App einen deutlichen Hinweis (UI.saveFail).
  store=withRetry(await openStore(),{onState:ok=>{UI.saveFail=!ok;const typing=document.activeElement&&document.activeElement.tagName==="INPUT";if(!UI.fatal&&!typing)render();}});
  deviceId=await store.get("device");
  if(!deviceId){deviceId=randomId("g-",10);await store.put("device",deviceId);}
  sync=createSync({store,deviceId});
  adminApi=createAdminApi({deviceId});
  globalRec=await store.get("global");
  if(!globalRec){globalRec={id:"global",state:newGlobal(),baseRev:null,dirty:true,lastSync:null};}
  const gBefore=globalRec.state.schemaVersion;
  globalRec.state=migrateGlobal(globalRec.state);
  if(globalRec.state.schemaVersion!==gBefore)globalRec.dirty=true;
  await store.put("global",globalRec);
  accounts=[];
  for(const key of await store.keys("profile:")){
    const rec=await store.get(key);if(!rec)continue;
    if(rec.state){
      const before=rec.state.meta&&rec.state.meta.schemaVersion;
      rec.state=migrateProfile(rec.state,{id:rec.id});
      if(rec.state.meta.schemaVersion!==before){rec.dirty=true;await store.put(key,rec);}
    }
    accounts.push({id:rec.id,name:rec.state?rec.state.profile.name:rec.name||rec.id,rec});
  }
  const cfg=await store.get("config");
  applyConfig(cfg);
  const curId=await store.get("current");
  // Der Start zeigt immer zuerst „Wer spielt?“ (mit den Bildern der Konten). Ein Konto mit PIN fragt sie beim Antippen.
}
const persist=()=>store.put("profile:"+cur.rec.id,cur.rec);
// Änderung auf einem Konto (Standard: dem aktuellen) lokal speichern, dann Abgleich anstoßen.
function commitOn(rec,fn){
  const r=fn(rec.state,ctx());
  rec.dirty=true;store.put("profile:"+rec.id,rec);scheduleSync(600);
  return r;
}
const commit=fn=>commitOn(cur.rec,fn);
async function useAccount(id,unlocked=false){
  const a=accounts.find(x=>x.id===id);if(!a)return;
  if(!a.rec.state){ // Konto von einem anderen Gerät: Stand erst vom Server holen
    await sync.syncProfile(a.rec);
    if(!a.rec.state){UI.acctMsg="Dieses Konto wird vom Server geladen. Bitte kurz warten und noch einmal tippen.";render();return;}
    a.name=a.rec.state.profile.name;
  }
  const kp=a.rec.state.profile.pin;
  // Einmal am Tag reicht: gemerkt wird der Tag und die PIN (eine geänderte PIN fragt wieder)
  const ok=kp&&kp.code?await store.get("pinok:"+id):null;
  if(ok&&ok.day===todayKey()&&ok.code===kp.code)unlocked=true;
  if(!unlocked&&kp&&kp.code){UI.pinAsk={id,msg:""};render();const i=document.getElementById("kidPin");if(i)i.focus();return;}
  UI.pinAsk=null;
  cur={rec:a.rec};await store.put("current",id);
  await loadSavedPack();
  await loadSavedCamp();
  view="home";UI.parent=false;UI.pinMsg="";UI.celebrate="";
  if(!maybeOfferAvatar())render();
  scheduleSync(0);
}
// ----- Päckchen sichern und fortsetzen (nur auf diesem Gerät, nicht im Spielstand) -----
const packKey=id=>"pack:"+id;
// Gesichertes Päckchen des aktuellen Kontos laden. Was nicht mehr spielbar ist (Thema aus, Liga gesperrt, kaputt), wird verworfen.
async function loadSavedPack(){
  UI.savedPack=null;if(!cur)return;
  let snap=null;try{snap=await store.get(packKey(cur.rec.id));}catch(e){}
  if(!snap)return;
  if(packResumable(snap)&&allTopicsOf(snap.li).includes(snap.topic)&&topicOn(S(),snap.topic)&&playable(S(),snap.li))UI.savedPack=snap;
  else await store.del(packKey(cur.rec.id));
}
function savePack(){
  if(!cur||!G||!G.pack)return;
  const snap=packSnapshot(G);
  if(snap){UI.savedPack=snap;store.put(packKey(cur.rec.id),snap);}
  else if(G.phase==="eval"){UI.savedPack=null;store.del(packKey(cur.rec.id));}
}
function dropPack(){UI.savedPack=null;if(cur)store.del(packKey(cur.rec.id));}
function resumePack(){
  const snap=UI.savedPack;if(!snap||!packResumable(snap)){dropPack();render();return;}
  G=Object.assign(packResume(snap),{rival:pick(RIVALS),t0:Date.now()});
  setTask(G.tasks[G.phase==="solve"?G.i:0]);
  view="play";UI.fach=null;render();window.scrollTo(0,0);
  if(G.phase==="solve")armIdle();
}
// ----- Trainingslager (ab 1.5.4): Spiel starten, sichern, fortsetzen -----
// Eine Einheit: 1. Halbzeit, Halbzeitpause, 2. Halbzeit, Abpfiff, danach als Belohnung das Elfmeterschießen. Ein laufendes Spiel liegt nur auf dem Gerät.
const campKey=id=>"camp:"+id;
async function loadSavedCamp(){
  UI.savedCamp=null;if(!cur)return;
  let snap=null;try{snap=await store.get(campKey(cur.rec.id));}catch(e){}
  if(!snap)return;
  const live=campResumable(snap)&&campOn(S(),snap.topic)&&(snap.pen?unitDone(S(),snap.topic,snap.unit):unitOpen(S(),snap.topic,snap.unit));
  if(live)UI.savedCamp=snap;else await store.del(campKey(cur.rec.id));
}
function saveCamp(){
  if(!cur||!G||!G.camp)return;
  const snap=campSnapshot(G);
  if(snap){UI.savedCamp=snap;store.put(campKey(cur.rec.id),snap);}
}
function dropCamp(){UI.savedCamp=null;if(cur)store.del(campKey(cur.rec.id));}
const saveGame=()=>{if(G&&G.camp)saveCamp();else savePack();};
// Aufgaben und Zähler einer Halbzeit (Einheit 4 spielt ein Päckchen mit Kontroll-Pfiff, sonst einzelne Aufgaben mit Sofort-Rückmeldung)
function segFields(tasks,pack){
  const base={tasks,len:tasks.length,i:0,res:[],hist:[],pts:0,streak:0,pack};
  return pack?Object.assign(base,{phase:"solve",ans:[],finals:[],helps:[],probeOpen:{},probed:{},ei:0,grade:null,checked:false}):base;
}
function startCamp(topic,unit){
  if(!CAMPS[topic]||!campOn(S(),topic)||!unitOpen(S(),topic,unit))return;
  dropCamp();
  const sets=campUnit(topic,unit),pack=isPackUnit(topic,unit);
  G=Object.assign({li:CAMPS[topic].li,mode:"camp",trial:false,topic,pool:[topic],last:null,seen:null,rival:pick(RIVALS),t0:Date.now(),
    camp:{topic,unit,half:1,halves:[],rec:false,brk:false,sets}},segFields(sets.h1,pack));
  setTask(G.tasks[0]);view="play";UI.fach=null;render();window.scrollTo(0,0);armIdle();
}
// Nachspielzeit: 5 Schüsse gegen den Torwart, jede Aufgabe ein Schuss. Wiederverwendbar: tasks ist eine Liste von Aufgaben.
function startPenalty(topic,unit,tasks,sets){
  dropCamp();
  G={li:CAMPS[topic].li,mode:"pen",pen:true,trial:false,topic,pool:[topic],last:null,seen:null,rival:"Torwart",t0:Date.now(),pack:false,
    camp:{topic,unit,half:2,halves:[],rec:false,brk:false,sets:sets||{h1:[],h2:[],pen:tasks}},tasks,len:tasks.length,i:0,res:[],hist:[],pts:0,streak:0};
  setTask(tasks[0]);view="play";UI.fach=null;render();window.scrollTo(0,0);armIdle();
}
// Letzte Antwort einer Halbzeit (oder Kontroll-Pfiff ausgewertet): Ergebnis festhalten. Nach der 2. Halbzeit wird die Einheit sofort gezählt.
function campRecord(c,n,pts,res){
  const C=G.camp;C.halves[C.half-1]={c,n,pts,res:res.map(Boolean)};
  if(C.half===2){campFinalCommit();return;}
  C.rec=true;saveCamp();
}
function campFinalCommit(){
  const C=G.camp,hs=C.halves,c=hs.reduce((a,h)=>a+h.c,0),n=hs.reduce((a,h)=>a+h.n,0),pts=hs.reduce((a,h)=>a+h.pts,0);
  const bonus=(c/n>=.6?20:0)+(c===n&&n>=5?30:0);
  const r=commit((s,cx)=>applyRoundEnd(s,cx,{li:G.li,mode:"camp",trial:false,c,n,pts:pts+bonus,bonus,dur:(Date.now()-G.t0)/1000,topic:C.topic}));
  const u=commit((s,cx)=>applyCampUnit(s,cx,{topic:C.topic,unit:C.unit,h1:hs[0],h2:hs[1]}));
  C.final={c,n,pts:pts+bonus,bonus,res:[].concat(...hs.map(h=>h.res)),newSticker:r.newSticker,celebrate:r.celebrate,badgeNew:u.badgeNew,badgeSticker:u.sticker};
  dropCamp();
}
// Nach der letzten Aufgabe einer Halbzeit: 1. Halbzeit gibt die Halbzeitpause, die 2. das Ergebnis der Einheit.
function campAfterHalf(){
  const C=G.camp;
  if(C.half===1){C.brk=true;saveCamp();render();window.scrollTo(0,0);return;}
  const f=C.final;
  G.res=f.res;G.len=f.n;G.pts=f.pts;G.bonus=f.bonus;G.newSticker=f.newSticker;G.badgeNew=f.badgeNew;G.badgeSticker=f.badgeSticker;UI.celebrate=f.celebrate;
  view="result";render();window.scrollTo(0,0);scheduleSync(0);
}
function halfGo(){
  const C=G.camp;C.half=2;C.brk=false;C.rec=false;
  Object.assign(G,segFields(C.sets.h2,isPackUnit(C.topic,C.unit)));
  setTask(G.tasks[0]);saveCamp();render();window.scrollTo(0,0);armIdle();
}
function penCommit(){
  const C=G.camp,c=G.res.filter(Boolean).length;
  commit((s,cx)=>applyCampPen(s,cx,{topic:C.topic,unit:C.unit,c,n:G.len}));
  G.penDone=true;dropCamp();
}
function resumeCamp(){
  const snap=UI.savedCamp;if(!snap||!campResumable(snap)){dropCamp();render();return;}
  G=Object.assign(campResume(snap),{rival:snap.rival||(snap.pen?"Torwart":pick(RIVALS))});
  UI.fach=null;view="play";const C=G.camp;
  if(C.brk){render();window.scrollTo(0,0);return;}
  if(C.rec){campAfterHalf();return;}
  setTask(G.tasks[Math.min(G.pack?(G.phase==="solve"?G.i:0):G.i,G.tasks.length-1)]);
  render();window.scrollTo(0,0);
  if(!G.pack||G.phase==="solve")armIdle();
}
// Ein Konto ohne Avatar bekommt beim ersten Öffnen den Baukasten angeboten (überspringbar, wird nur einmal angeboten).
function maybeOfferAvatar(){
  if(!cur||!S().profile||S().profile.avatar||S().profile.avatarAsked)return false;
  openAvatar(true);return true;
}
function openAvatar(first){
  const s=S();
  UI.av={first,view:"front",name:s.profile.name,pin:(s.profile.pin&&s.profile.pin.code)||"",msg:"",look:cleanLook(lookOf(s.profile))};
  view="avatar";render();window.scrollTo(0,0);
}

// Kennung vom Server (Vorschau-Band). Die letzte bekannte Kennung bleibt lokal gespeichert, auch offline.
function applyConfig(cfg){
  UI.preview=cfg&&typeof cfg.preview==="string"?cfg.preview:"";
  document.title=(UI.preview?UI.preview+" · ":"")+"Torjäger-Liga";
}
async function refreshConfig(){
  const r=await sync.getConfig();
  if(r.ok&&r.config.preview!==UI.preview){applyConfig(r.config);await store.put("config",{preview:UI.preview});return true;}
  if(r.ok&&!(await store.get("config")))await store.put("config",{preview:UI.preview});
  return false;
}

// ================= Abgleich =================
let timer=null;
function scheduleSync(ms){clearTimeout(timer);timer=setTimeout(syncNow,ms);}
async function syncNow(){
  if(!store)return;
  try{await syncOnce();}catch(e){console.warn("Abgleich:",e);UI.sync="busy";}
}
async function syncOnce(){
  const before=cur?canon(S()):"",beforeG=canon(globalRec.state),listSig=accountsSig();
  const results=[];
  const bandChanged=await refreshConfig();
  results.push(await sync.syncGlobal(globalRec));
  const list=await sync.listRemoteProfiles();
  if(list.ok)for(const p of list.profiles){
    if(!accounts.find(a=>a.id===p.id)){
      const rec={id:p.id,name:p.name,state:null,baseRev:null,dirty:false,lastSync:null};
      accounts.push({id:p.id,name:p.name,rec});
    }
  }else results.push(list);
  for(const a of [...accounts]){
    const r=await sync.syncProfile(a.rec);
    if(r.reason==="deleted"){await removeAccountLocal(a.id);continue;} // von den Eltern gelöscht (liegt im Papierkorb des Servers)
    results.push(r);if(a.rec.state)a.name=a.rec.state.profile.name;
  }
  const bad=results.find(r=>!r.ok);
  UI.sync=!bad?"":bad.reason==="offline"?"offline":bad.reason==="reload"?"reload":bad.reason==="invalid"?"invalid":"busy";
  if(UI.sync==="reload")updateApp(true);
  const changed=(cur&&canon(S())!==before)||canon(globalRec.state)!==beforeG;
  const typing=document.activeElement&&document.activeElement.tagName==="INPUT";
  if((view==="home"||view==="accounts")&&!typing&&(changed||bandChanged||view==="accounts"))render();
  else if(view==="admin"&&!typing&&(changed||listSig!==accountsSig()))render();
}
const accountsSig=()=>accounts.map(a=>a.id+":"+(a.rec.state?a.rec.state.meta.updatedAt+":"+a.rec.state.profile.name:0)).join(",");
// Konto lokal entfernen (nach Löschen im Eltern-Bereich, auch auf anderen Geräten).
async function removeAccountLocal(id){
  accounts=accounts.filter(a=>a.id!==id);
  await store.del("profile:"+id);await store.del(packKey(id));await store.del(campKey(id));
  if(cur&&cur.rec.id===id){cur=null;G=null;await store.del("current");if(view!=="admin")view="accounts";}
}
function syncText(){
  const t=cur&&cur.rec.lastSync;
  const when=t?(todayKey(t)===todayKey()?"heute ":new Date(t).toLocaleDateString("de-DE",{day:"numeric",month:"numeric"})+". ")+new Date(t).toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"})+" Uhr":"noch nie";
  const dirty=cur&&cur.rec.dirty;
  if(UI.sync==="offline")return `${when}. Der Server ist gerade nicht erreichbar. Der Stand liegt sicher auf diesem Gerät und wird später nachgeholt.`;
  if(UI.sync==="reload")return `${when}. Die App ist veraltet und wird neu geladen.`;
  if(UI.sync==="invalid")return `${when}. Der Stand auf diesem Gerät ist unvollständig und wird nicht gesendet. Bitte die App schließen und neu öffnen. Bleibt es so, bitte melden.`;
  return when+(dirty?" (Änderungen werden gleich gesendet)":"");
}
window.addEventListener("online",()=>scheduleSync(300));
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"){scheduleSync(300);if(swReg)swReg.update().catch(()=>{});}else if(view==="play")saveGame();});
window.addEventListener("pagehide",()=>{if(view==="play")saveGame();});
setInterval(()=>{if(document.visibilityState==="visible")syncNow();},60000);

// ================= Service Worker und Updates =================
let swReg=null;
// Neu zeichnen, wenn gerade keine Eingabe läuft und keine Aufgabe offen ist (Startseite, Wer spielt?, Eltern-Bereich)
function renderIfIdle(){const typing=document.activeElement&&document.activeElement.tagName==="INPUT";if(!typing&&!UI.fatal&&["home","accounts","admin"].includes(view))render();}
async function initSW(){
  if(!("serviceWorker" in navigator))return;
  try{
    swReg=await navigator.serviceWorker.register("/sw.js");
    const watch=w=>w&&w.addEventListener("statechange",()=>{if(w.state==="installed"&&navigator.serviceWorker.controller){UI.updateReady=true;renderIfIdle();}});
    if(swReg.waiting&&navigator.serviceWorker.controller){UI.updateReady=true;renderIfIdle();}
    swReg.addEventListener("updatefound",()=>watch(swReg.installing));
    watch(swReg.installing);
  }catch(e){console.warn("Service Worker:",e);}
}
// Neue Version aktivieren und neu laden. Der Spielstand bleibt in IndexedDB.
async function updateApp(fromSync){
  try{
    if(fromSync){ // gegen Schleifen: höchstens einmal pro Minute automatisch
      const last=Number(sessionStorage.getItem("tj-reload")||0);if(Date.now()-last<60000)return;
      sessionStorage.setItem("tj-reload",String(Date.now()));
    }
    if(swReg){await swReg.update();}
    if(swReg&&swReg.waiting){
      navigator.serviceWorker.addEventListener("controllerchange",()=>location.reload(),{once:true});
      swReg.waiting.postMessage({type:"SKIP_WAITING"});return;
    }
    if(fromSync)location.reload();
  }catch(e){}
}

// ================= Spielablauf =================
// mode: math, deu, eng, su, mix (nur Mathe und Deutsch) oder topic (Themenblock als Päckchen mit Kontroll-Pfiff, topic = Thema)
// Ausgeschaltete Themen (Eltern) kommen nie dran.
function startRound(li,mode,trial,topic){
  let len=trial?trialLen(S()):roundLen(S());
  if(mode==="topic"&&allTopicsOf(li).includes(topic)&&topicOn(S(),topic))return startPack(li,topic);
  if(mode==="topic")mode="mix";
  const pool=activeTopics(S(),poolOf(li,mode));
  if(!pool.length)return;
  if(!trial&&leagueState(S(),li)==="probe")len=Math.min(roundLen(S()),budgetOf(S(),li));
  if(trial)commit((s,c)=>applyTrial(s,c,li));
  commit((s,c)=>applySel(s,c,li));
  G={li,mode,trial,pool,len,i:0,res:[],hist:[],pts:0,streak:0,rival:pick(RIVALS),last:null,t0:Date.now(),seen:new Set()};
  nextTask();view="play";render();window.scrollTo(0,0);
  armIdle(); // erst jetzt ist die Ansicht "play": sonst bekäme die erste Aufgabe einer Runde nie ein Angebot
}
function setTask(T){
  G.task=T;G.input="";G.inp=["",""];G.act=0;G.done=false;G.helpLevel=0;G.helpEx="";G.offer=false;G.offerDone=false;G.shot=null;G.pickIdx=-1;G.given=null;G.fixedNow=false;G.why=false;G.note="";
  G.pairs=T.type==="match"?T.left.map(()=>-1):null;G.msel=-1;G.sortA=T.type==="sort"?T.cards.map(()=>-1):null;G.ssel=-1;G.ord=[];
  if(T.type==="choice"&&!T.fixed)T.choices=shuffle(T.choices);
  if(G.offerNext){G.offerNext=false;G.offer=true;G.offerDone=true;} // Frust-Bremse: der Trainer bietet einen Tipp an
  armIdle();
}
// Keine Aufgabe zweimal in einem Spiel (auch wenn sie zufällig gezogen wird): bis zu 40 neue Versuche, danach gilt die letzte.
function nextTask(){
  if(G.camp){setTask(G.tasks[G.i]);return;} // Trainingslager: die Aufgaben stehen fest
  let T,t;
  for(let tries=0;tries<40;tries++){
    t=nextTopic(S(),G.pool,G.last,Math.random,G.cool);T=Object.assign({topic:t},GEN[t](levelOpts(t)));
    if(!G.seen||!G.seen.has(keyOf(T)))break;
  }
  G.last=t;if(G.seen)G.seen.add(keyOf(T));
  setTask(T);
}
// Englisch: die Aufgaben folgen der Stufe des Kindes in diesem Thema.
const levelOpts=t=>isEng(t)?{level:lvOf(S(),t)}:undefined;
// Themenblock: ein Päckchen zusammenhängender Aufgaben. Keine Rückmeldung, bis der Kontroll-Pfiff vorbei ist.
function startPack(li,topic){
  let tasks=packOf(topic,undefined,levelOpts(topic));
  if(leagueState(S(),li)==="probe")tasks=tasks.slice(0,Math.max(1,Math.min(tasks.length,budgetOf(S(),li))));
  commit((s,c)=>applySel(s,c,li));
  G={li,mode:"topic",topic,trial:false,pack:true,phase:"solve",tasks,len:tasks.length,i:0,ans:[],finals:[],helps:[],probeOpen:{},probed:{},ei:0,res:[],hist:[],pts:0,streak:0,rival:pick(RIVALS),last:null,t0:Date.now(),pool:[topic]};
  setTask(tasks[0]);view="play";render();window.scrollTo(0,0);armIdle();
}
// ----- Mini-Spiele (Torwand): fünf Aufgaben, die Antworten zählen im Lernstand, kein Spiel, kein Sticker, kein Probetraining-Budget -----
function startMini(kind){
  const M=newMini(kind,S());
  if(!M){UI.celebrate="";return;}
  MG=M;view="mini";render();window.scrollTo(0,0);
}
function miniShoot(idx){
  if(!MG||MG.done)return;
  const ok0=MG.items[MG.i].right===idx;
  const r=miniAnswer(MG,idx,pickShot(ok0));
  if(!r)return;
  commit((s,c)=>applyAnswer(s,c,{topic:r.topic,ok:r.ok,gain:r.gain,li:MG.li,trial:true,lv:r.T.level||0,terms:termResults(r.T,r.val),soft:!!r.T.late}));
  tone(r.ok?[523,659,784]:[220,180],r.ok?.12:.18,S().settings.sound);
  render();
}
// ----- Trainer: Angebot nach langer Pause, gestufte Hilfe -----
let idleT=null,autoT=null;
const AUTO_MS=1800; // so lange bleibt das Overlay nach einer richtigen Antwort
function armIdle(){
  clearTimeout(idleT);
  if(view!=="play"||!G||G.done||G.offerDone||G.helpLevel>0||(G.pack&&G.phase!=="solve"))return;
  const secs=settingsOf(S()).hintAfter;if(!secs)return; // 0 = der Trainer meldet sich nicht von selbst
  idleT=setTimeout(()=>{
    if(view==="play"&&G&&!G.done&&!G.offerDone&&!G.helpLevel&&document.visibilityState==="visible"){G.offer=true;G.offerDone=true;render();}
  },secs*1000);
}
function helpStep(){
  if(!G||G.done||G.helpLevel>=2)return;
  G.offer=false;G.helpLevel++;
  if(G.helpLevel===2)G.helpEx=exampleHTML(similarExample(GEN,G.task));
  const level=G.helpLevel,topic=G.task.topic;
  commit((s,c)=>applyHelp(s,c,{topic,level})); // Hilfe kostet keine Punkte, wird nur vermerkt
  render();
}
const trainers=()=>[cleanTrainer(globalRec.state.trainer,1),cleanTrainer(globalRec.state.trainer2,2)];
function answer(val){
  if(G.done)return;const T=G.task;
  if(G.pack){packAnswer(val);return;}
  const ok=isRight(T,val);
  clearTimeout(idleT);
  G.done=true;G.ok=ok;G.given=val;G.res.push(ok);G.shot=G.pen?{kind:ok?"goal":"saved",side:Math.random()<.5?-1:1}:pickShot(ok);G.note=G.camp&&!ok?wrongNote(T,val):"";G.offer=false;
  if(ok){G.streak++;G.gain=10+(G.streak>=3?5:0);G.pts+=G.gain;}else{G.streak=0;G.gain=0;}
  if(!G.camp&&strikeStep(G.strikes||(G.strikes={}),T.topic,ok)){(G.cool||(G.cool={}))[T.topic]=true;G.offerNext=true;} // Frust-Bremse: Thema seltener, nächste Aufgabe mit Tipp-Angebot
  // Lokal zuerst: Antwort, Budget und Punkte sofort speichern, dann Abgleich anstoßen.
  commit((s,c)=>applyAnswer(s,c,{topic:T.topic,ok,gain:G.gain,li:G.li,trial:G.trial||!!G.camp,help:G.helpLevel,lv:T.level||0,terms:termResults(T,val),soft:!!T.late}));
  G.hist.push({topic:T.topic,ok,q:T.q.replace(/<[^>]+>/g,""),given:String(val),right:rightText(T)});
  tone(ok?[523,659,784]:[220,180],ok?.12:.18,S().settings.sound);
  if(G.camp){ // Trainingslager: Stand sichern, nach der letzten Aufgabe zählen
    const last=G.i+1>=G.len;
    if(G.pen){if(last)penCommit();else saveCamp();}
    else if(last)campRecord(G.res.filter(Boolean).length,G.len,G.pts,G.res);
    else saveCamp();
  }
  render();
  if(ok)autoNext();
}
// richtig: kurzes Overlay, dann geht es von allein weiter (Tippen aufs Overlay ist schneller)
function autoNext(){const g=G;clearTimeout(autoT);autoT=setTimeout(()=>{if(view==="play"&&G===g&&G.done&&G.ok)next();},AUTO_MS);}
function next(){
  clearTimeout(autoT);G.i++;
  if(G.i>=G.len){finish();return;}
  if(G.pack)evalShow(G.i);else{nextTask();render();}
}

// ----- Päckchen: Schreiben, Kontroll-Pfiff, Auswertung -----
function packAnswer(val){
  clearTimeout(idleT);
  if(G.phase==="edit"){G.finals[G.ei]=val;G.phase="check";saveGame();render();window.scrollTo(0,0);return;}
  if(G.phase!=="solve")return;
  const i=G.i;G.ans[i]=val;G.finals[i]=val;G.helps[i]=G.helpLevel;
  tone([440],.06,S().settings.sound);
  if(i+1>=G.len){G.phase="check";saveGame();render();window.scrollTo(0,0);return;}
  G.i++;saveGame();setTask(G.tasks[G.i]);render();window.scrollTo(0,0);
}
function probeToggle(i){G.probeOpen[i]=!G.probeOpen[i];G.probed[i]=true;saveGame();render();}
function editAnswer(i){
  G.phase="edit";G.ei=i;setTask(G.tasks[i]);clearTimeout(idleT);prefill(G.tasks[i],G.finals[i]);render();window.scrollTo(0,0);
}
// Beim Ändern steht die bisherige Antwort schon da (Zuordnen, Sortieren, Reihenfolge).
function prefill(T,val){
  if(!Array.isArray(val))return;
  if(T.type==="match"&&val.length===T.left.length)G.pairs=val.slice();
  else if(T.type==="sort"&&val.length===T.cards.length)G.sortA=val.slice();
  else if(T.type==="order")G.ord=val.slice();
}
// Abgeben: alle Antworten zählen jetzt (Endantworten). Mit Kontrolle gibt es Bonus für selbst gefundene Fehler.
function finishCheck(checked){
  clearTimeout(idleT);
  if(!G.camp)dropPack(); // ab jetzt zählt alles, das gesicherte Päckchen wird nicht mehr gebraucht
  const grade=gradePack({tasks:G.tasks,answers:G.ans,finals:G.finals,checked});
  G.grade=grade;G.checked=checked;G.gains=[];let streak=0;
  G.tasks.forEach((T,i)=>{
    const ok=grade.items[i].ok;let gain=0;
    if(ok){streak++;gain=10+(streak>=3?5:0);}else streak=0;
    G.gains[i]=gain;
    commit((s,c)=>applyAnswer(s,c,{topic:T.topic,ok,gain,li:G.li,trial:!!G.camp,help:G.helps[i]||0,lv:T.level||0,terms:termResults(T,G.finals[i]),soft:!!T.late}));
  });
  if(checked){
    const probes=Object.keys(G.probed).length;
    commit((s,c)=>applyControl(s,c,{topic:G.topic,probes,fixed:grade.fixed,bonus:grade.bonus}));
  }
  G.pts=G.gains.reduce((a,x)=>a+x,0)+(checked?grade.bonus:0);
  G.phase="eval";G.i=0;G.res=[];G.streak=0;
  if(G.camp)campRecord(grade.items.filter(x=>x.ok).length,G.len,G.pts,grade.items.map(x=>x.ok));
  evalShow(0);
}
// Auswertung: eine Torszene je Aufgabe mit der Antwort nach der Kontrolle
function evalShow(i){
  const T=G.tasks[i],it=G.grade.items[i];
  G.task=T;G.done=true;G.why=false;G.given=G.finals[i];G.ok=it.ok;G.fixedNow=it.fixed;G.gain=G.gains[i]+(it.fixed?BONUS_FIX:0);G.offer=false;
  G.shot=pickShot(it.ok);G.note=G.camp&&!it.ok?wrongNote(T,G.finals[i]):"";G.res.push(it.ok);
  G.hist.push({topic:T.topic,ok:it.ok,q:T.q.replace(/<[^>]+>/g,""),given:String(G.given),right:rightText(T)});
  tone(it.ok?[523,659,784]:[220,180],it.ok?.12:.18,S().settings.sound);
  render();window.scrollTo(0,0);
  if(it.ok)autoNext();
}
function finish(){
  if(G.pen){view="result";render();window.scrollTo(0,0);scheduleSync(0);return;}
  if(G.camp){campAfterHalf();return;}
  const c=G.res.filter(Boolean).length,n=G.len,win=!G.trial&&c/n>=.6,perfect=!G.trial&&c===n&&n>=5;
  G.bonus=(win?20:0)+(perfect?30:0);G.pts+=G.bonus;
  const r=commit((s,cx)=>applyRoundEnd(s,cx,{li:G.li,mode:G.mode,trial:G.trial,c,n,pts:G.pts,bonus:G.bonus,dur:(Date.now()-G.t0)/1000,topic:G.pack?G.topic:undefined,pk:G.pack}));
  G.newSticker=r.newSticker;UI.celebrate=r.celebrate;
  view="result";render();window.scrollTo(0,0);scheduleSync(0);
}

// ================= Darstellung und Ereignisse =================
function env(){return{camp:campInfo(),pack:UI.savedPack&&{topic:UI.savedPack.topic,done:UI.savedPack.ans.filter(a=>a!==undefined&&a!==null).length,len:UI.savedPack.tasks.length,phase:UI.savedPack.phase},hasPin:!!globalRec.state.pin,syncText:syncText(),updateReady:UI.updateReady,persistent:store.persistent,version:APP_VERSION};}
// Zusammenfassung des gesicherten Trainingslager-Spiels für den Hinweis in der Kabine
function campInfo(){
  const k=UI.savedCamp;if(!k)return null;
  const done=k.pen?[]:k.halves,okc=a=>a.filter(Boolean).length;
  let c=done.reduce((a,h)=>a+h.c,0),n=done.reduce((a,h)=>a+h.n,0);
  if(k.pen||!(k.rec||k.brk)){c+=okc(k.res);n+=k.res.length;}
  return{topic:k.topic,unit:k.unit,half:k.half,brk:!!(k.brk||(k.rec&&k.half===1)),pen:!!k.pen,c,m:n-c};
}
function render(){
  if(UI.fatal){root.innerHTML=`<section class="panel"><h3>Bitte App neu öffnen</h3><p>${UI.fatal}</p></section>`;return;}
  root.innerHTML=bandHTML(UI.preview)+saveWarnHTML(UI.saveFail)+(view==="accounts"||view==="admin"?updateBannerHTML(UI.updateReady):"")+(view==="accounts"?accountsHTML(accounts.filter(a=>a.rec.state||a.name).map(a=>({id:a.id,name:a.name,avatar:a.rec.state?a.rec.state.profile.avatar:null,locked:!!(a.rec.state&&a.rec.state.profile.pin&&a.rec.state.profile.pin.code)})),UI,env())
    :view==="home"?homeHTML(S(),UI,env()):view==="admin"?adminHTML(adminModel()):view==="avatar"?avatarBuilderHTML(UI.av):view==="play"?playHTML(S(),G,trainers()):view==="mini"?miniHTML(S(),MG):resultHTML(S(),G,UI));
  bind();
}
function typeDigit(k){const T=G.task;if(T.type==="pair"){const v=G.inp[G.act];if(v.length<3)G.inp[G.act]=(v==="0"?"":v)+k;}else if(G.input.length<6)G.input=(G.input==="0"?"":G.input)+k;render();}
// ----- neue Aufgabenarten: Zuordnen, Bild wählen, Sortieren, Reihenfolge (nur Antippen) -----
function tapMatchLeft(i){if(G.done)return;if(G.pairs[i]>=0){G.pairs[i]=-1;G.msel=-1;}else G.msel=G.msel===i?-1:i;render();}
function tapMatchRight(j){if(G.done)return;const owner=G.pairs.indexOf(j);
  if(owner>=0){G.pairs[owner]=-1;G.msel=-1;}else if(G.msel>=0){G.pairs[G.msel]=j;G.msel=-1;}render();}
function tapCard(i){if(G.done)return;G.ssel=G.ssel===i?-1:i;render();}
function tapBasket(j){if(G.done||G.ssel<0)return;G.sortA[G.ssel]=j;G.ssel=-1;render();}
function tapPlaced(i){if(G.done)return;G.sortA[i]=-1;G.ssel=-1;render();}
function tapOrder(i){if(G.done)return;const p=G.ord.indexOf(i);if(p>=0)G.ord=G.ord.slice(0,p);else G.ord=G.ord.concat(i);render();}
function finishNew(){
  const T=G.task;if(G.done&&!G.pack)return;
  if(T.type==="match"&&G.pairs.every(x=>x>=0))answer(G.pairs.slice());
  else if(T.type==="sort"&&G.sortA.every(x=>x>=0))answer(G.sortA.slice());
  else if(T.type==="order"&&G.ord.length===T.cards.length)answer(G.ord.slice());
}
// Nach dem Laden der Stimmen (iPad lädt sie verzögert): Ansicht neu zeichnen, wenn sich die Vorlese-Taste ändert.
let hadVoice=false;
function watchVoices(){
  const ss=globalThis.speechSynthesis;if(!ss||!ss.addEventListener)return;
  const check=()=>{const now=canSpeak();if(now===hadVoice)return;hadVoice=now;
    const typing=document.activeElement&&document.activeElement.tagName==="INPUT";
    if(!typing&&(view==="home"||(view==="play"&&G&&!G.done)))render();};
  hadVoice=canSpeak();ss.addEventListener("voiceschanged",check);
}
function del(){if(G.task.type==="pair")G.inp[G.act]=G.inp[G.act].slice(0,-1);else G.input=G.input.slice(0,-1);render();}
function ok(){const T=G.task;if(T.type==="pair"){if(G.act===0&&G.inp[0]!==""&&G.inp[1]===""){G.act=1;render();return;}if(G.inp[0]!==""&&G.inp[1]!=="")answer(G.inp.slice());return;}if(G.input!=="")answer(G.input);}

async function setGlobalPin(pin){
  globalRec.state.pin=pin;globalRec.state.updatedAt=Date.now();globalRec.dirty=true;
  await store.put("global",globalRec);scheduleSync(300);
}
async function createAccount(){
  const name=document.getElementById("acctName").value.trim(),pin=document.getElementById("acctPin").value.trim();
  // Bei einem Fehler bleibt der eingegebene Name stehen und das fehlerhafte Feld bekommt den Fokus.
  const fail=(msg,field)=>{UI.acctName=name;UI.acctMsg=msg;render();const i=document.getElementById(field);if(i)i.focus();};
  if(!name){fail("Bitte einen Namen eingeben.","acctName");return;}
  if(!validPin(pin)){fail("Bitte genau 4 Ziffern als PIN eingeben.","acctPin");return;}
  if(globalRec.state.pin){
    const r=await checkPin(pin,globalRec.state.pin);
    if(!r.ok){fail("Die PIN stimmt nicht.","acctPin");return;}
    if(r.upgrade)await setGlobalPin(r.upgrade);
  }else await setGlobalPin(await makePin(pin));
  const id=await makeAccount(name);
  UI.newAcct=false;UI.acctMsg="";UI.acctName="";
  await useAccount(id,true);
}
async function makeAccount(name){
  const id="k-"+randomId("",8),now=Date.now();
  const rec={id,name,state:newProfile({id,name,deviceId,now,topics:ALL_TOPICS}),baseRev:null,dirty:true,lastSync:null};
  await store.put("profile:"+id,rec);
  accounts.push({id,name,rec});scheduleSync(300);
  return id;
}

// ================= Eltern-Bereich =================
const validName=n=>typeof n==="string"&&n.trim().length>0;
function adminModel(){
  const A=UI.admin;
  const list=accounts.map(a=>({id:a.id,name:a.rec.state?a.rec.state.profile.name:a.name,state:a.rec.state})).sort((x,y)=>String(x.name).localeCompare(String(y.name),"de"));
  return{tr1:A.tr1,tr2:A.tr2,tab:A.tab,msg:A.msg,accounts:list,sel:A.sel||(list.find(a=>a.state)||{}).id,renaming:A.renaming,renamingDevice:A.renamingDevice,confirm:A.confirm,moreDaily:A.moreDaily,
    server:A.server,deviceId,appVersion:APP_VERSION,persistent:store.persistent,previewLabel:UI.preview,schema:{app:SCHEMA_VERSION,global:GLOBAL_SCHEMA_VERSION}};
}
const adminRec=id=>{const a=accounts.find(x=>x.id===id);return a&&a.rec.state?a.rec:null;};
function adminSay(t,text){UI.admin.msg={t,text};}
function adminReset(){const A=UI.admin;A.msg=null;A.confirm=null;A.renaming=null;A.renamingDevice=null;}
async function openAdmin(pin){
  if(!globalRec.state.pin){UI.adminMsg="Es ist noch keine Eltern-PIN festgelegt. Sie wird beim ersten Konto festgelegt.";render();return;}
  if(!validPin(pin)){UI.adminMsg="Bitte genau 4 Ziffern eingeben.";render();return;}
  const local=await checkPin(pin,globalRec.state.pin);
  const srv=await adminApi.verify(pin); // der Server prüft selbst; ohne Verbindung zählt die Prüfung auf diesem Gerät
  let ok;
  UI.adminMsg="";
  if(srv.status===200)ok=true;else if(srv.status===0)ok=local.ok;
  else{ok=false;UI.adminMsg=srv.error==="bad_pin"&&local.ok?"Die PIN stimmt nicht mehr. Sie wurde geändert. Bitte mit der neuen PIN noch einmal versuchen.":adminError(srv);if(local.ok)scheduleSync(0);}
  if(!ok){if(!UI.adminMsg)UI.adminMsg="Die PIN stimmt nicht.";render();return;}
  if(local.upgrade)await setGlobalPin(local.upgrade);
  if(srv.status===200&&!local.ok)scheduleSync(0);
  UI.adminAsk=false;UI.adminMsg="";
  UI.admin={pin,tr1:cleanTrainer(globalRec.state.trainer,1),tr2:cleanTrainer(globalRec.state.trainer2,2),tab:"accounts",msg:srv.status===0?{t:"err",text:"Kein Kontakt zum Server. Sicherungen, Zurücksetzen und Löschen gehen nur mit Verbindung."}:null,sel:null,server:{state:"loading",backups:null,devices:null,config:null},moreDaily:false};
  view="admin";render();window.scrollTo(0,0);
}
async function loadServerLists(){
  const A=UI.admin;
  A.server={state:"loading",backups:null,devices:null,config:A.server?A.server.config:null};render();
  const [b,d,c]=await Promise.all([adminApi.backups(A.pin),adminApi.devices(A.pin),adminApi.config()]);
  if(UI.admin!==A)return;
  if(b.status===0||d.status===0)A.server={state:"offline",backups:null,devices:null,config:null};
  else if(!b.ok||!d.ok){A.server={state:"error",backups:null,devices:null,config:null};adminSay("err",adminError(b.ok?d:b));}
  else A.server={state:"ok",backups:b.data.backups,devices:d.data.devices,config:c.ok?c.data:null};
  if(view==="admin")render();
}
async function adminDo(){
  const A=UI.admin,parts=String(A.confirm||"").split(":"),kind=parts[0],arg=parts.slice(1).join(":");
  A.confirm=null;A.msg=null;
  if(kind==="reset"){
    const pending=accounts.find(x=>x.id===arg);
    if(pending)await sync.syncProfile(pending.rec); // offene Änderungen (Name, Aussehen) zuerst senden, sonst gehen sie beim Leeren verloren
    const r=await adminApi.reset(A.pin,arg);
    if(!r.ok){adminSay("err",adminError(r));render();return;}
    const a=accounts.find(x=>x.id===arg);if(a)await sync.syncProfile(a.rec); // holt den geleerten Stand, er gewinnt beim Zusammenführen
    adminSay("ok","Der Spielstand ist zurückgesetzt. Der alte Stand liegt als Sicherung auf dem Server.");
  }else if(kind==="campreset"){
    const [id,t]=arg.split(":"),rec=adminRec(id);
    if(rec){commitOn(rec,(s,c)=>applyCampReset(s,c,t));adminSay("ok","Das Trainingslager ist neu gestartet.");}
  }else if(kind==="delete"){
    const r=await adminApi.remove(A.pin,arg);
    if(!r.ok){adminSay("err",adminError(r));render();return;}
    await removeAccountLocal(arg);
    adminSay("ok","Das Konto liegt jetzt im Papierkorb. Zurückholen geht im Reiter „Sicherungen und System“.");
  }else if(kind==="restore"){
    const r=await adminApi.restore(A.pin,arg);
    if(!r.ok){adminSay("err",adminError(r));render();return;}
    await syncOnce().catch(()=>{});
    adminSay("ok","Zurückgeholt. Der Stand des Kontos davor wurde gesichert. Alle Geräte übernehmen den zurückgeholten Stand.");
    render();await loadServerLists();return;
  }
  render();
}
async function adminChangePin(){
  const A=UI.admin,$=id=>document.getElementById(id),oldP=$("aOldPin").value.trim(),newP=$("aNewPin").value.trim();
  if(!validPin(oldP)||!validPin(newP)){adminSay("err","Bitte beide PINs mit genau 4 Ziffern eingeben.");render();return;}
  const r=await adminApi.changePin(oldP,newP);
  if(!r.ok){adminSay("err",adminError(r));render();return;}
  A.pin=newP;
  await sync.syncGlobal(globalRec); // die neue PIN (neuerer Zeitstempel) kommt vom Server
  adminSay("ok","Die neue PIN gilt jetzt für alle Konten und Geräte.");render();
}
// ================= Mein Spieler =================
function bindAvatar($){
  const grab=()=>{const n=$("avShirtName"),t=$("avTeam"),p=$("avPin");if(n)UI.av.look.shirtName=n.value;if(t)UI.av.look.team=t.value;if(p)UI.av.pin=p.value.replace(/\D/g,"").slice(0,4);};
  const set=look=>{grab();UI.av.look=cleanLook(look);render();};
  document.querySelectorAll("[data-av]").forEach(b=>b.onclick=()=>{grab();const [k,...r]=b.dataset.av.split(":");UI.av.look=withKit(UI.av.look,k,r.join(":"));render();});
  document.querySelectorAll("[data-avpreset]").forEach(b=>b.onclick=()=>{grab();UI.av.look=withPreset(UI.av.look,Number(b.dataset.avpreset));render();});
  document.querySelectorAll("[data-avtpl]").forEach(b=>b.onclick=()=>set({...UI.av.look,tpl:b.dataset.avtpl}));
  document.querySelectorAll("[data-avnum]").forEach(b=>b.onclick=()=>set({...UI.av.look,number:String((Number(UI.av.look.number)+Number(b.dataset.avnum)+100)%100)}));
  document.querySelectorAll("[data-avview]").forEach(b=>b.onclick=()=>{grab();UI.av.view=b.dataset.avview;render();});
  const leave=()=>{UI.av=null;view="home";render();window.scrollTo(0,0);};
  if($("avSave"))$("avSave").onclick=()=>{grab();
    if(UI.av.pin!==""&&!validKidPin(UI.av.pin)){UI.av.msg="Die PIN braucht genau 4 Ziffern. Lass das Feld leer, wenn du keine PIN möchtest.";render();return;}
    const look=cleanLook(UI.av.look),pin=UI.av.pin,had=(S().profile.pin&&S().profile.pin.code)||"";
    commit((s,c)=>{applyAvatar(s,c,look);if(pin!==had)applyProfilePin(s,c,pin);});leave();};
  if($("avSkip"))$("avSkip").onclick=()=>{commit((s,c)=>applyAvatarAsked(s,c));leave();};
  if($("avCancel"))$("avCancel").onclick=leave;
}

function bindAdmin($){
  const A=UI.admin;
  document.querySelectorAll("[data-atab]").forEach(b=>b.onclick=()=>{A.tab=b.dataset.atab;adminReset();if(A.tab==="system")loadServerLists();else render();window.scrollTo(0,0);});
  document.querySelectorAll("[data-asel]").forEach(b=>b.onclick=()=>{A.sel=b.dataset.asel;adminReset();render();});
  document.querySelectorAll("[data-aclose]").forEach(b=>b.onclick=()=>{UI.admin=null;view="accounts";render();window.scrollTo(0,0);});
  document.querySelectorAll("[data-acancel]").forEach(b=>b.onclick=()=>{adminReset();render();});
  document.querySelectorAll("[data-aask]").forEach(b=>b.onclick=()=>{adminReset();A.confirm=b.dataset.aask;render();});
  document.querySelectorAll("[data-ado]").forEach(b=>b.onclick=adminDo);
  document.querySelectorAll("[data-arename]").forEach(b=>b.onclick=()=>{adminReset();A.renaming=b.dataset.arename;render();const i=$("renameIn");if(i)i.focus();});
  document.querySelectorAll("[data-arenameok]").forEach(b=>b.onclick=()=>{const rec=adminRec(b.dataset.arenameok),n=$("renameIn").value;
    if(!rec||!validName(n)){adminSay("err","Bitte einen Namen eingeben.");render();return;}
    commitOn(rec,(s,c)=>applyRename(s,c,n));const a=accounts.find(x=>x.id===rec.id);a.name=rec.state.profile.name;adminReset();adminSay("ok","Umbenannt.");render();});
  document.querySelectorAll("[data-aopen]").forEach(b=>b.onclick=()=>{const [id,li]=b.dataset.aopen.split(":"),rec=adminRec(id);if(rec){commitOn(rec,(s,c)=>applyOpen(s,c,Number(li)));render();}});
  document.querySelectorAll("[data-alock]").forEach(b=>b.onclick=()=>{const [id,li]=b.dataset.alock.split(":"),rec=adminRec(id);if(rec){commitOn(rec,(s,c)=>applyLock(s,c,Number(li)));render();}});
  document.querySelectorAll("[data-anew]").forEach(b=>b.onclick=async()=>{const n=$("aNewName").value.trim();
    if(!validName(n)){adminSay("err","Bitte einen Namen eingeben.");render();return;}
    await makeAccount(n);adminReset();adminSay("ok","Konto angelegt.");render();});
  document.querySelectorAll("[data-aset]").forEach(b=>b.onclick=()=>{
    const a=accounts.find(x=>x.id===A.sel&&x.rec.state)||accounts.find(x=>x.rec.state);if(!a)return;
    const kv=b.dataset.aset.split(":"),k=kv[0],v=kv[1];
    commitOn(a.rec,(s,c)=>applySettings(s,c,{[k]:v==="true"?true:v==="false"?false:Number(v)}));render();});
  document.querySelectorAll("[data-acamp]").forEach(b=>b.onclick=()=>{
    const [t,v,id]=b.dataset.acamp.split(":"),a=accounts.find(x=>x.id===id&&x.rec.state);if(!a)return; // gilt für das Konto, an dessen Karte der Schalter steht
    commitOn(a.rec,(s,c)=>applyCampOn(s,c,t,v==="on"));render();});
  document.querySelectorAll("[data-afach]").forEach(b=>b.onclick=()=>{
    const a=accounts.find(x=>x.id===A.sel&&x.rec.state)||accounts.find(x=>x.rec.state);if(!a)return;
    const [f,v]=b.dataset.afach.split(":");commitOn(a.rec,(s,c)=>applyFach(s,c,f,v==="on"));render();});
  document.querySelectorAll("[data-atopic]").forEach(b=>b.onclick=()=>{
    const a=accounts.find(x=>x.id===A.sel&&x.rec.state)||accounts.find(x=>x.rec.state);if(!a)return;
    const [t,m]=b.dataset.atopic.split(":");commitOn(a.rec,(s,c)=>applyTopicMode(s,c,t,m));render();});
  document.querySelectorAll("[data-auntil]").forEach(i=>i.onchange=()=>{
    const a=accounts.find(x=>x.id===A.sel&&x.rec.state)||accounts.find(x=>x.rec.state);if(!a)return;
    commitOn(a.rec,(s,c)=>applyTopicUntil(s,c,i.dataset.auntil,i.value));render();});
  document.querySelectorAll("[data-apin]").forEach(b=>b.onclick=adminChangePin);
  // PIN eines Kindes: Eltern sehen sie, setzen sie neu oder entfernen sie
  document.querySelectorAll("[data-akpin]").forEach(b=>b.onclick=()=>{const rec=adminRec(b.dataset.akpin),v=$("kpin-"+b.dataset.akpin).value.trim();
    if(!rec||!validKidPin(v)){adminSay("err","Bitte genau 4 Ziffern eingeben.");render();return;}
    commitOn(rec,(s,c)=>applyProfilePin(s,c,v));adminSay("ok","PIN gespeichert.");render();});
  document.querySelectorAll("[data-akpindel]").forEach(b=>b.onclick=()=>{const rec=adminRec(b.dataset.akpindel);if(!rec)return;
    commitOn(rec,(s,c)=>applyProfilePin(s,c,""));adminSay("ok","PIN entfernt.");render();});
  // Trainer (gilt für alle Konten)
  const key=w=>w===2?"tr2":"tr1";
  const grabTr=()=>{for(const w of [1,2]){const i=$("trName"+w);if(i&&A[key(w)])A[key(w)].name=i.value;}};
  document.querySelectorAll("[data-atr]").forEach(b=>b.onclick=()=>{
    const p=b.dataset.atr.split(":"),w=Number(p[0]),k=p[1],v=p.slice(2).join(":");grabTr();
    A[key(w)].look=Object.assign({},A[key(w)].look,{[k]:v});render();});
  document.querySelectorAll("[data-atrdefault]").forEach(b=>b.onclick=()=>{const w=Number(b.dataset.atrdefault);A[key(w)]=cleanTrainer(w===2?defaultTrainer2():defaultTrainer(),w);render();});
  document.querySelectorAll("[data-atrsave]").forEach(b=>b.onclick=async()=>{
    const w=Number(b.dataset.atrsave);grabTr();
    applyTrainer(globalRec.state,ctx(),A[key(w)],w);globalRec.dirty=true;await store.put("global",globalRec);scheduleSync(300);
    A[key(w)]=cleanTrainer(globalRec.state[w===2?"trainer2":"trainer"],w);adminSay("ok",(w===2?"Die Trainerin":"Der Trainer")+" ist gespeichert. Das gilt für alle Konten.");render();});
  document.querySelectorAll("[data-areload]").forEach(b=>b.onclick=loadServerLists);
  document.querySelectorAll("[data-amore]").forEach(b=>b.onclick=()=>{A.moreDaily=!A.moreDaily;render();});
  document.querySelectorAll("[data-adrename]").forEach(b=>b.onclick=()=>{adminReset();A.renamingDevice=b.dataset.adrename;render();const i=$("devIn");if(i)i.focus();});
  document.querySelectorAll("[data-adrenameok]").forEach(b=>b.onclick=async()=>{const r=await adminApi.renameDevice(A.pin,b.dataset.adrenameok,$("devIn").value);
    adminReset();if(!r.ok)adminSay("err",adminError(r));await loadServerLists();});
}

function bind(){
  const $=id=>document.getElementById(id);
  document.querySelectorAll("[data-play]").forEach(b=>b.onclick=()=>{const [li,m,t]=b.dataset.play.split(":");UI.fach=null;startRound(Number(li),m,false,t);});
  document.querySelectorAll("[data-fach]").forEach(b=>b.onclick=()=>{UI.fach=UI.fach===b.dataset.fach?null:b.dataset.fach;render();});
  document.querySelectorAll("[data-lgtoggle]").forEach(b=>b.onclick=()=>{const i=b.dataset.lgtoggle;UI.lgOpen[i]=!UI.lgOpen[i];render();});
  document.querySelectorAll("[data-cur]").forEach(b=>b.onclick=()=>{const li=Number(b.dataset.cur);commit((s,c)=>applyCurrent(s,c,li));UI.fach=null;UI.lgOpen={};render();window.scrollTo(0,0);});
  document.querySelectorAll("[data-probe]").forEach(b=>b.onclick=()=>probeToggle(Number(b.dataset.probe)));
  document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editAnswer(Number(b.dataset.edit)));
  document.querySelectorAll("[data-camp]").forEach(b=>b.onclick=()=>{const [t,u]=b.dataset.camp.split(":");startCamp(t,Number(u));});
  if($("campResume"))$("campResume").onclick=resumeCamp;
  if($("campDrop"))$("campDrop").onclick=()=>{const k=UI.savedCamp;dropCamp();if(k&&k.pen)startPenalty(k.topic,k.unit,penaltyTasks(k.topic,k.unit));else if(k)startCamp(k.topic,k.unit);else render();}; // neu anfangen: dieselbe Einheit, frische Aufgaben
  if($("halfGo"))$("halfGo").onclick=halfGo;
  if($("penGo"))$("penGo").onclick=()=>startPenalty(G.camp.topic,G.camp.unit,G.camp.sets.pen,G.camp.sets);
  if($("packResume"))$("packResume").onclick=resumePack;
  if($("packDrop"))$("packDrop").onclick=()=>{const sn=UI.savedPack;dropPack();if(sn)startRound(sn.li,"topic",false,sn.topic);else render();}; // neu anfangen: dasselbe Thema, frisches Päckchen
  if($("ctlDone"))$("ctlDone").onclick=()=>finishCheck(true);
  if($("ctlSkip"))$("ctlSkip").onclick=()=>finishCheck(false);
  if($("editBack"))$("editBack").onclick=()=>{G.phase="check";render();window.scrollTo(0,0);};
  document.querySelectorAll("[data-trial]").forEach(b=>b.onclick=()=>startRound(Number(b.dataset.trial),"mix",true));
  if($("snd"))$("snd").onclick=()=>{commit((s,c)=>applySound(s,c,!s.settings.sound));render();};
  document.querySelectorAll("[data-bank]").forEach(d=>{d.ontoggle=()=>{UI.bankOpen=!!d.open;};}); // Trainerbank merkt sich nur, solange man sie selbst aufgeklappt hat
  if($("home"))$("home").onclick=()=>{clearTimeout(idleT);clearTimeout(autoT);if(view==="play")saveGame();view="home";UI.celebrate="";UI.bankOpen=false;UI.parent=false;render();window.scrollTo(0,0);};
  document.querySelectorAll("[data-mini]").forEach(b=>b.onclick=()=>startMini(b.dataset.mini));
  document.querySelectorAll("[data-hole]").forEach(b=>b.onclick=()=>miniShoot(Number(b.dataset.hole)));
  if($("miniNext"))$("miniNext").onclick=()=>{miniNext(MG);render();window.scrollTo(0,0);if(miniOver(MG))scheduleSync(0);};
  if($("again"))$("again").onclick=()=>{UI.celebrate="";startRound(G.li,G.mode,false,G.topic);};
  if($("ovl"))$("ovl").onclick=next;
  // „Warum stimmt das?“: hält das automatische Weiter an und zeigt die Erklärung, bis das Kind „Weiter“ tippt
  if($("why"))$("why").onclick=e=>{e.stopPropagation();clearTimeout(autoT);G.why=true;render();};
  if($("ovlNext"))$("ovlNext").onclick=next;
  if($("coachHelp"))$("coachHelp").onclick=helpStep;
  if($("coachYes"))$("coachYes").onclick=helpStep;
  if($("coachNo"))$("coachNo").onclick=()=>{G.offer=false;render();};
  if($("avEdit"))$("avEdit").onclick=()=>openAvatar(false);
  if(view==="avatar"&&UI.av)bindAvatar($);
  if($("next"))$("next").onclick=next;
  if($("tapok"))$("tapok").onclick=()=>{if(G.pickIdx>=0)answer(G.pickIdx);};
  document.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>{const k=b.dataset.k;if(k==="del")del();else if(k==="ok")ok();else typeDigit(k);});
  document.querySelectorAll("[data-slot]").forEach(b=>b.onclick=()=>{if(!G.done){G.act=Number(b.dataset.slot);render();}});
  document.querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>answer(b.dataset.c));
  document.querySelectorAll("[data-w]").forEach(b=>b.onclick=()=>{G.pickIdx=Number(b.dataset.w);render();});
  document.querySelectorAll("[data-ml]").forEach(b=>b.onclick=()=>tapMatchLeft(Number(b.dataset.ml)));
  document.querySelectorAll("[data-mr]").forEach(b=>b.onclick=()=>tapMatchRight(Number(b.dataset.mr)));
  document.querySelectorAll("[data-pic]").forEach(b=>b.onclick=()=>{if(!G.done)answer(Number(b.dataset.pic));});
  document.querySelectorAll("[data-sc]").forEach(b=>b.onclick=()=>tapCard(Number(b.dataset.sc)));
  document.querySelectorAll("[data-sb]").forEach(b=>b.onclick=()=>tapBasket(Number(b.dataset.sb)));
  document.querySelectorAll("[data-sp]").forEach(b=>b.onclick=()=>tapPlaced(Number(b.dataset.sp)));
  document.querySelectorAll("[data-oc]").forEach(b=>b.onclick=()=>tapOrder(Number(b.dataset.oc)));
  if($("ordReset"))$("ordReset").onclick=()=>{G.ord=[];render();};
  if($("fin"))$("fin").onclick=finishNew;
  document.querySelectorAll("[data-say]").forEach(b=>b.onclick=()=>speak(b.dataset.say)); // Vorlesen nur nach Antippen
  // Eltern-Bereich
  if($("adminOpen"))$("adminOpen").onclick=()=>{UI.adminAsk=true;UI.adminMsg="";UI.newAcct=false;render();const i=$("adminPin");if(i)i.focus();};
  if($("adminCancel"))$("adminCancel").onclick=()=>{UI.adminAsk=false;UI.adminMsg="";render();};
  if($("adminGo"))$("adminGo").onclick=()=>openAdmin($("adminPin").value.trim());
  if(view==="admin"&&UI.admin)bindAdmin($);
  // Konten
  document.querySelectorAll("[data-acct]").forEach(b=>b.onclick=()=>useAccount(b.dataset.acct));
  if($("kidPinOk"))$("kidPinOk").onclick=()=>{const a=accounts.find(x=>x.id===UI.pinAsk.id),code=a&&a.rec.state&&a.rec.state.profile.pin&&a.rec.state.profile.pin.code;
    if($("kidPin").value.trim()===code){const keep=$("kidPinKeep")&&$("kidPinKeep").checked,id=UI.pinAsk.id;
      (keep?store.put("pinok:"+id,{day:todayKey(),code}):store.del?store.del("pinok:"+id):Promise.resolve()).then(()=>useAccount(id,true));}else{UI.pinAsk.msg="Die PIN stimmt nicht.";render();const i=$("kidPin");if(i)i.focus();}};
  if($("kidPinCancel"))$("kidPinCancel").onclick=()=>{UI.pinAsk=null;render();};
  if($("acctNew"))$("acctNew").onclick=()=>{UI.newAcct=true;UI.acctMsg="";UI.acctName="";render();};
  if($("acctCancel"))$("acctCancel").onclick=()=>{UI.newAcct=false;UI.acctMsg="";UI.acctName="";render();};
  if($("acctCreate"))$("acctCreate").onclick=createAccount;
  if($("switch"))$("switch").onclick=()=>{view="accounts";UI.parent=false;UI.newAcct=false;UI.adminAsk=false;render();};
  if($("upd"))$("upd").onclick=()=>updateApp(false);
  // Eltern
  if($("pinSet"))$("pinSet").onclick=async()=>{const v=$("pinNew").value.trim();if(!validPin(v)){UI.pinMsg="Bitte genau 4 Ziffern eingeben.";render();return;}
    await setGlobalPin(await makePin(v));UI.parent=true;UI.pinMsg="";render();};
  if($("pinOk"))$("pinOk").onclick=async()=>{const r=await checkPin($("pinIn").value.trim(),globalRec.state.pin);
    if(r.ok){if(r.upgrade)await setGlobalPin(r.upgrade);UI.parent=true;UI.pinMsg="";}else UI.pinMsg="Die PIN stimmt nicht.";render();};
  if($("pinClose"))$("pinClose").onclick=()=>{UI.parent=false;render();};
  document.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>{commit((s,c)=>applyOpen(s,c,Number(b.dataset.open)));render();});
  document.querySelectorAll("[data-lock]").forEach(b=>b.onclick=()=>{commit((s,c)=>applyLock(s,c,Number(b.dataset.lock)));render();});
}
// Jede Eingabe schiebt das Angebot des Trainers nach hinten
for(const ev of ["pointerdown","keydown"])document.addEventListener(ev,()=>{if(view==="play"&&G&&!G.done&&!G.offer)armIdle();},true);
document.addEventListener("keydown",e=>{if(view!=="play"||!G)return;if(e.target&&e.target.tagName==="INPUT")return;
  if(G.pack&&G.phase==="check")return;
  if(G.camp&&G.camp.brk)return;
  if(G.done&&(e.key==="Enter"||e.key===" ")){e.preventDefault();next();return;}if(G.done)return;
  const T=G.task;if(T.type!=="num"&&T.type!=="pair")return;
  if(/^[0-9]$/.test(e.key))typeDigit(e.key);else if(e.key==="Backspace")del();else if(e.key==="Enter")ok();});

// ================= Start =================
(async function main(){
  try{
    await loadAll();
    // Figuren-Bilder vor dem ersten Bild laden (höchstens kurz warten, dann nachzeichnen)
    const figs=loadFigures().catch(()=>false);
    await Promise.race([figs,new Promise(r=>setTimeout(r,3000))]);
    figs.then(ok=>{if(ok&&["accounts","home","avatar"].includes(view)&&!UI.fatal)render();});
    if(!accounts.length)view="accounts";
    if(!maybeOfferAvatar())render();
    initSW();
    watchVoices();
    syncNow();
  }catch(e){
    console.error(e);
    UI.fatal=e instanceof UnsupportedSchema?"Der gespeicherte Spielstand ist neuer als diese App. Schließe die App ganz und öffne sie neu, damit die neue Version geladen wird. Der Spielstand geht dabei nicht verloren.":"Beim Start ist ein Fehler aufgetreten: "+esc(e.message||e);
    render();
    if(e instanceof UnsupportedSchema)initSW().then(()=>updateApp(true));
  }
})();
