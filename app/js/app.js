// Steuerung: Start, Konten, Spielablauf, lokales Speichern und automatischer Abgleich.
import {LIGEN,RIVALS} from "./content.js";
import {GEN} from "./generators.js";
import {shuffle,pick,todayKey,esc,randomId,canon} from "./util.js";
import {newProfile,newGlobal,migrateProfile,migrateGlobal,UnsupportedSchema,SCHEMA_VERSION,GLOBAL_SCHEMA_VERSION} from "./model.js";
import {leagueState,budgetOf,nextTopic,applyAnswer,applyTrial,applyRoundEnd,applyOpen,applyLock,applySound,applySel,applyRename,applySettings,applyHelp,applyAvatar,applyAvatarAsked,applyTrainer,settingsOf,roundLen,trialLen} from "./rules.js";
import {makePin,checkPin,validPin} from "./pin.js";
import {openStore} from "./store.js";
import {createSync} from "./sync.js";
import {createAdminApi,adminError} from "./adminapi.js";
import {adminHTML} from "./admin.js";
import {avatarBuilderHTML} from "./avatarui.js";
import {pickShot} from "./avatardraw.js";
import {cleanLook,cleanTrainer,lookOf,templateLook,startLook,withBody,defaultTrainer,defaultTrainer2} from "./avatar.js";
import {similarExample,exampleHTML} from "./coach.js";
import {tone} from "./audio.js";
import {boardHTML,homeHTML,accountsHTML,playHTML,resultHTML,rightText,bandHTML} from "./views.js";
import {APP_VERSION} from "./version.js";

const root=document.getElementById("app");
let store,deviceId,sync,adminApi;
let globalRec;                 // {state:{pin,...}, baseRev, dirty, lastSync}
let accounts=[];               // [{id,name}]
let cur=null;                  // {rec:{id,state,baseRev,dirty,lastSync}}
let view="accounts",G=null;
const UI={av:null,preview:"",parent:false,pinMsg:"",celebrate:"",newAcct:false,acctMsg:"",adminAsk:false,admin:null,sync:"",updateReady:false,fatal:""};
const ctx=()=>({deviceId,now:Date.now()});
const S=()=>cur.rec.state;

// ================= Speicher =================
async function loadAll(){
  store=await openStore();
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
  const found=accounts.find(a=>a.id===curId)||(accounts.length===1?accounts[0]:null);
  if(found){cur={rec:found.rec};view="home";}
}
const persist=()=>store.put("profile:"+cur.rec.id,cur.rec);
// Änderung auf einem Konto (Standard: dem aktuellen) lokal speichern, dann Abgleich anstoßen.
function commitOn(rec,fn){
  const r=fn(rec.state,ctx());
  rec.dirty=true;store.put("profile:"+rec.id,rec);scheduleSync(600);
  return r;
}
const commit=fn=>commitOn(cur.rec,fn);
async function useAccount(id){
  const a=accounts.find(x=>x.id===id);if(!a)return;
  if(!a.rec.state){ // Konto von einem anderen Gerät: Stand erst vom Server holen
    await sync.syncProfile(a.rec);
    if(!a.rec.state){UI.acctMsg="Dieses Konto wird vom Server geladen. Bitte kurz warten und noch einmal tippen.";render();return;}
    a.name=a.rec.state.profile.name;
  }
  cur={rec:a.rec};await store.put("current",id);
  view="home";UI.parent=false;UI.pinMsg="";UI.celebrate="";
  if(!maybeOfferAvatar())render();
  scheduleSync(0);
}
// Ein Konto ohne Avatar bekommt beim ersten Öffnen den Baukasten angeboten (überspringbar, wird nur einmal angeboten).
function maybeOfferAvatar(){
  if(!cur||!S().profile||S().profile.avatar||S().profile.avatarAsked)return false;
  openAvatar(true);return true;
}
function openAvatar(first){
  const s=S();
  UI.av={first,step:first?"gender":"build",name:s.profile.name,look:cleanLook(lookOf(s.profile))};
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
  UI.sync=!bad?"":bad.reason==="offline"?"offline":bad.reason==="reload"?"reload":"busy";
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
  await store.del("profile:"+id);
  if(cur&&cur.rec.id===id){cur=null;G=null;await store.del("current");if(view!=="admin")view="accounts";}
}
function syncText(){
  const t=cur&&cur.rec.lastSync;
  const when=t?(todayKey(t)===todayKey()?"heute ":new Date(t).toLocaleDateString("de-DE",{day:"numeric",month:"numeric"})+". ")+new Date(t).toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"})+" Uhr":"noch nie";
  const dirty=cur&&cur.rec.dirty;
  if(UI.sync==="offline")return `${when}. Der Server ist gerade nicht erreichbar. Der Stand liegt sicher auf diesem Gerät und wird später nachgeholt.`;
  if(UI.sync==="reload")return `${when}. Die App ist veraltet und wird neu geladen.`;
  return when+(dirty?" (Änderungen werden gleich gesendet)":"");
}
window.addEventListener("online",()=>scheduleSync(300));
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")scheduleSync(300);});
setInterval(()=>{if(document.visibilityState==="visible")syncNow();},60000);

// ================= Service Worker und Updates =================
let swReg=null;
async function initSW(){
  if(!("serviceWorker" in navigator))return;
  try{
    swReg=await navigator.serviceWorker.register("/sw.js");
    const watch=w=>w&&w.addEventListener("statechange",()=>{if(w.state==="installed"&&navigator.serviceWorker.controller){UI.updateReady=true;if(view==="home")render();}});
    if(swReg.waiting&&navigator.serviceWorker.controller)UI.updateReady=true;
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
function startRound(li,mode,trial){
  const L=LIGEN[li],pool=mode==="math"?L.math:mode==="deu"?L.deu:L.math.concat(L.deu);
  let len=trial?trialLen(S()):roundLen(S());
  if(!trial&&leagueState(S(),li)==="probe")len=Math.min(roundLen(S()),budgetOf(S(),li));
  if(trial)commit((s,c)=>applyTrial(s,c,li));
  commit((s,c)=>applySel(s,c,li));
  G={li,mode,trial,pool,len,i:0,res:[],hist:[],pts:0,streak:0,rival:pick(RIVALS),last:null,t0:Date.now()};
  nextTask();view="play";render();window.scrollTo(0,0);
  armIdle(); // erst jetzt ist die Ansicht "play": sonst bekäme die erste Aufgabe einer Runde nie ein Angebot
}
function nextTask(){
  const t=nextTopic(S(),G.pool,G.last);G.last=t;
  G.task=Object.assign({topic:t},GEN[t]());G.input="";G.inp=["",""];G.act=0;G.done=false;G.helpLevel=0;G.helpEx="";G.offer=false;G.offerDone=false;G.shot=null;G.pickIdx=-1;G.given=null;
  if(G.task.type==="choice"&&!G.task.fixed)G.task.choices=shuffle(G.task.choices);
  armIdle();
}
// ----- Trainer: Angebot nach langer Pause, gestufte Hilfe -----
let idleT=null,autoT=null;
const AUTO_MS=1800; // so lange bleibt das Overlay nach einer richtigen Antwort
function armIdle(){
  clearTimeout(idleT);
  if(view!=="play"||!G||G.done||G.offerDone||G.helpLevel>0)return;
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
  if(G.done)return;const T=G.task;let ok;
  if(T.type==="num")ok=Number(val)===T.a;else if(T.type==="pair")ok=Number(val[0])===T.a[0]&&Number(val[1])===T.a[1];else ok=val===T.a;
  clearTimeout(idleT);
  G.done=true;G.ok=ok;G.given=val;G.res.push(ok);G.shot=pickShot(ok);G.offer=false;
  if(ok){G.streak++;G.gain=10+(G.streak>=3?5:0);G.pts+=G.gain;}else{G.streak=0;G.gain=0;}
  // Lokal zuerst: Antwort, Budget und Punkte sofort speichern, dann Abgleich anstoßen.
  commit((s,c)=>applyAnswer(s,c,{topic:T.topic,ok,gain:G.gain,li:G.li,trial:G.trial,help:G.helpLevel}));
  G.hist.push({topic:T.topic,ok,q:T.q.replace(/<[^>]+>/g,""),given:String(val),right:rightText(T)});
  tone(ok?[523,659,784]:[220,180],ok?.12:.18,S().settings.sound);
  render();
  if(ok){ // richtig: kurzes Overlay, dann geht es von allein weiter (Tippen aufs Overlay ist schneller)
    const g=G;clearTimeout(autoT);
    autoT=setTimeout(()=>{if(view==="play"&&G===g&&G.done&&G.ok)next();},AUTO_MS);
  }
}
function next(){clearTimeout(autoT);G.i++;if(G.i>=G.len){finish();return;}nextTask();render();}
function finish(){
  const c=G.res.filter(Boolean).length,n=G.len,win=!G.trial&&c/n>=.6,perfect=!G.trial&&c===n&&n>=5;
  G.bonus=(win?20:0)+(perfect?30:0);G.pts+=G.bonus;
  const r=commit((s,cx)=>applyRoundEnd(s,cx,{li:G.li,mode:G.mode,trial:G.trial,c,n,pts:G.pts,bonus:G.bonus,dur:(Date.now()-G.t0)/1000}));
  G.newSticker=r.newSticker;UI.celebrate=r.celebrate;
  view="result";render();window.scrollTo(0,0);scheduleSync(0);
}

// ================= Darstellung und Ereignisse =================
function env(){return{hasPin:!!globalRec.state.pin,syncText:syncText(),updateReady:UI.updateReady,persistent:store.persistent,version:APP_VERSION};}
function render(){
  if(UI.fatal){root.innerHTML=`<section class="panel"><h3>Bitte App neu öffnen</h3><p>${UI.fatal}</p></section>`;return;}
  root.innerHTML=bandHTML(UI.preview)+(view==="accounts"?accountsHTML(accounts.filter(a=>a.rec.state||a.name).map(a=>({id:a.id,name:a.name,avatar:a.rec.state?a.rec.state.profile.avatar:null})),UI,env())
    :view==="home"?homeHTML(S(),UI,env()):view==="admin"?adminHTML(adminModel()):view==="avatar"?avatarBuilderHTML(UI.av):view==="play"?playHTML(S(),G,trainers()):resultHTML(S(),G,UI));
  bind();
}
function typeDigit(k){const T=G.task;if(T.type==="pair"){const v=G.inp[G.act];if(v.length<3)G.inp[G.act]=(v==="0"?"":v)+k;}else if(G.input.length<6)G.input=(G.input==="0"?"":G.input)+k;render();}
function del(){if(G.task.type==="pair")G.inp[G.act]=G.inp[G.act].slice(0,-1);else G.input=G.input.slice(0,-1);render();}
function ok(){const T=G.task;if(T.type==="pair"){if(G.act===0&&G.inp[0]!==""&&G.inp[1]===""){G.act=1;render();return;}if(G.inp[0]!==""&&G.inp[1]!=="")answer(G.inp.slice());return;}if(G.input!=="")answer(G.input);}

async function setGlobalPin(pin){
  globalRec.state.pin=pin;globalRec.state.updatedAt=Date.now();globalRec.dirty=true;
  await store.put("global",globalRec);scheduleSync(300);
}
async function createAccount(){
  const name=document.getElementById("acctName").value.trim(),pin=document.getElementById("acctPin").value.trim();
  if(!name){UI.acctMsg="Bitte einen Namen eingeben.";render();return;}
  if(!validPin(pin)){UI.acctMsg="Bitte genau 4 Ziffern als PIN eingeben.";render();return;}
  if(globalRec.state.pin){
    const r=await checkPin(pin,globalRec.state.pin);
    if(!r.ok){UI.acctMsg="Die PIN stimmt nicht.";render();return;}
    if(r.upgrade)await setGlobalPin(r.upgrade);
  }else await setGlobalPin(await makePin(pin));
  const id=await makeAccount(name);
  UI.newAcct=false;UI.acctMsg="";
  await useAccount(id);
}
async function makeAccount(name){
  const id="k-"+randomId("",8),now=Date.now();
  const rec={id,name,state:newProfile({id,name,deviceId,now}),baseRev:null,dirty:true,lastSync:null};
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
// ================= Avatar-Baukasten =================
function bindAvatar($){
  const grab=()=>{const n=$("avShirtName"),t=$("avTeam");if(n)UI.av.look.shirtName=n.value;if(t)UI.av.look.team=t.value;};
  const set=patch=>{grab();UI.av.look=Object.assign({},UI.av.look,patch);render();};
  const pairs=[["data-avhc","hairColor"],["data-avskin","skin"],["data-avshirt","shirt"],["data-avshorts","shorts"],["data-avboots","boots"],["data-avc1","c1"],["data-avc2","c2"],["data-avhatc","hatColor"]];
  for(const [attr,key] of pairs)document.querySelectorAll("["+attr+"]").forEach(b=>b.onclick=()=>set({[key]:b.getAttribute(attr)}));
  document.querySelectorAll("[data-avbody]").forEach(b=>b.onclick=()=>{grab();const body=b.dataset.avbody;
    UI.av.look=UI.av.step==="gender"?startLook(body,UI.av.name):withBody(UI.av.look,body);UI.av.step="build";render();window.scrollTo(0,0);});
  document.querySelectorAll("[data-avhat]").forEach(b=>b.onclick=()=>set({hat:Number(b.dataset.avhat)}));
  document.querySelectorAll("[data-avhair]").forEach(b=>b.onclick=()=>set({hair:Number(b.dataset.avhair)}));
  document.querySelectorAll("[data-avtpl]").forEach(b=>b.onclick=()=>{grab();UI.av.look=templateLook(Number(b.dataset.avtpl),UI.av.name);render();});
  document.querySelectorAll("[data-avnum]").forEach(b=>b.onclick=()=>set({number:String((Number(UI.av.look.number)+Number(b.dataset.avnum)+100)%100)}));
  const leave=()=>{UI.av=null;view="home";render();window.scrollTo(0,0);};
  if($("avSave"))$("avSave").onclick=()=>{grab();const look=cleanLook(UI.av.look);commit((s,c)=>applyAvatar(s,c,look));leave();};
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
  document.querySelectorAll("[data-apin]").forEach(b=>b.onclick=adminChangePin);
  // Trainer (gilt für alle Konten)
  const key=w=>w===2?"tr2":"tr1";
  const grabTr=()=>{for(const w of [1,2]){const i=$("trName"+w);if(i&&A[key(w)])A[key(w)].name=i.value;}};
  document.querySelectorAll("[data-atr]").forEach(b=>b.onclick=()=>{
    const p=b.dataset.atr.split(":"),w=Number(p[0]),k=p[1],v=p.slice(2).join(":");grabTr();
    const num=["hair","glasses","beard","earrings"].includes(k);
    A[key(w)].look=Object.assign({},A[key(w)].look,{[k]:num?Number(v):v});render();});
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
  document.querySelectorAll("[data-play]").forEach(b=>b.onclick=()=>{const [li,m]=b.dataset.play.split(":");startRound(Number(li),m,false);});
  document.querySelectorAll("[data-trial]").forEach(b=>b.onclick=()=>startRound(Number(b.dataset.trial),"mix",true));
  if($("snd"))$("snd").onclick=()=>{commit((s,c)=>applySound(s,c,!s.settings.sound));render();};
  if($("home"))$("home").onclick=()=>{clearTimeout(idleT);clearTimeout(autoT);view="home";UI.celebrate="";render();window.scrollTo(0,0);};
  if($("again"))$("again").onclick=()=>{UI.celebrate="";startRound(G.li,G.mode,false);};
  if($("ovl"))$("ovl").onclick=next;
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
  // Eltern-Bereich
  if($("adminOpen"))$("adminOpen").onclick=()=>{UI.adminAsk=true;UI.adminMsg="";UI.newAcct=false;render();const i=$("adminPin");if(i)i.focus();};
  if($("adminCancel"))$("adminCancel").onclick=()=>{UI.adminAsk=false;UI.adminMsg="";render();};
  if($("adminGo"))$("adminGo").onclick=()=>openAdmin($("adminPin").value.trim());
  if(view==="admin"&&UI.admin)bindAdmin($);
  // Konten
  document.querySelectorAll("[data-acct]").forEach(b=>b.onclick=()=>useAccount(b.dataset.acct));
  if($("acctNew"))$("acctNew").onclick=()=>{UI.newAcct=true;UI.acctMsg="";render();};
  if($("acctCancel"))$("acctCancel").onclick=()=>{UI.newAcct=false;UI.acctMsg="";render();};
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
  if(G.done&&(e.key==="Enter"||e.key===" ")){e.preventDefault();next();return;}if(G.done)return;
  const T=G.task;if(T.type!=="num"&&T.type!=="pair")return;
  if(/^[0-9]$/.test(e.key))typeDigit(e.key);else if(e.key==="Backspace")del();else if(e.key==="Enter")ok();});

// ================= Start =================
(async function main(){
  try{
    await loadAll();
    if(!accounts.length)view="accounts";
    if(!maybeOfferAvatar())render();
    initSW();
    syncNow();
  }catch(e){
    console.error(e);
    UI.fatal=e instanceof UnsupportedSchema?"Der gespeicherte Spielstand ist neuer als diese App. Schließe die App ganz und öffne sie neu, damit die neue Version geladen wird. Der Spielstand geht dabei nicht verloren.":"Beim Start ist ein Fehler aufgetreten: "+esc(e.message||e);
    render();
    if(e instanceof UnsupportedSchema)initSW().then(()=>updateApp(true));
  }
})();
