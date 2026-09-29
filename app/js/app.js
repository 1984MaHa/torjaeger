// Steuerung: Start, Konten, Spielablauf, lokales Speichern und automatischer Abgleich.
import {LIGEN,ROUND,TRIAL,RIVALS} from "./content.js";
import {GEN} from "./generators.js";
import {shuffle,pick,todayKey,esc,randomId,canon} from "./util.js";
import {newProfile,newGlobal,migrateProfile,migrateGlobal,UnsupportedSchema} from "./model.js";
import {leagueState,budgetOf,nextTopic,applyAnswer,applyTrial,applyRoundEnd,applyOpen,applyLock,applySound,applySel,applyReset} from "./rules.js";
import {makePin,checkPin,validPin} from "./pin.js";
import {openStore} from "./store.js";
import {createSync} from "./sync.js";
import {tone} from "./audio.js";
import {boardHTML,homeHTML,accountsHTML,playHTML,resultHTML,rightText,bandHTML} from "./views.js";
import {APP_VERSION} from "./version.js";

const root=document.getElementById("app");
let store,deviceId,sync;
let globalRec;                 // {state:{pin,...}, baseRev, dirty, lastSync}
let accounts=[];               // [{id,name}]
let cur=null;                  // {rec:{id,state,baseRev,dirty,lastSync}}
let view="accounts",G=null;
const UI={preview:"",confirmReset:false,parent:false,pinMsg:"",celebrate:"",newAcct:false,acctMsg:"",sync:"",updateReady:false,fatal:""};
const ctx=()=>({deviceId,now:Date.now()});
const S=()=>cur.rec.state;

// ================= Speicher =================
async function loadAll(){
  store=await openStore();
  deviceId=await store.get("device");
  if(!deviceId){deviceId=randomId("g-",10);await store.put("device",deviceId);}
  sync=createSync({store,deviceId});
  globalRec=await store.get("global");
  if(!globalRec){globalRec={id:"global",state:newGlobal(),baseRev:null,dirty:true,lastSync:null};}
  globalRec.state=migrateGlobal(globalRec.state);
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
function commit(fn){
  const r=fn(S(),ctx());
  cur.rec.dirty=true;persist();scheduleSync(600);
  return r;
}
async function useAccount(id){
  const a=accounts.find(x=>x.id===id);if(!a)return;
  if(!a.rec.state){ // Konto von einem anderen Gerät: Stand erst vom Server holen
    await sync.syncProfile(a.rec);
    if(!a.rec.state){UI.acctMsg="Dieses Konto wird vom Server geladen. Bitte kurz warten und noch einmal tippen.";render();return;}
    a.name=a.rec.state.profile.name;
  }
  cur={rec:a.rec};await store.put("current",id);
  view="home";UI.parent=false;UI.confirmReset=false;UI.pinMsg="";UI.celebrate="";
  render();scheduleSync(0);
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
  const before=cur?canon(S()):"",beforeG=canon(globalRec.state);
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
  for(const a of accounts){results.push(await sync.syncProfile(a.rec));if(a.rec.state)a.name=a.rec.state.profile.name;}
  const bad=results.find(r=>!r.ok);
  UI.sync=!bad?"":bad.reason==="offline"?"offline":bad.reason==="reload"?"reload":"busy";
  if(UI.sync==="reload")updateApp(true);
  const changed=(cur&&canon(S())!==before)||canon(globalRec.state)!==beforeG;
  const typing=document.activeElement&&document.activeElement.tagName==="INPUT";
  if((view==="home"||view==="accounts")&&!typing&&(changed||bandChanged||view==="accounts"))render();
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
  let len=trial?TRIAL:ROUND;
  if(!trial&&leagueState(S(),li)==="probe")len=Math.min(ROUND,budgetOf(S(),li));
  if(trial)commit((s,c)=>applyTrial(s,c,li));
  commit((s,c)=>applySel(s,c,li));
  G={li,mode,trial,pool,len,i:0,res:[],hist:[],pts:0,streak:0,rival:pick(RIVALS),last:null};
  nextTask();view="play";render();window.scrollTo(0,0);
}
function nextTask(){
  const t=nextTopic(S(),G.pool,G.last);G.last=t;
  G.task=Object.assign({topic:t},GEN[t]());G.input="";G.inp=["",""];G.act=0;G.done=false;G.showHint=false;G.pickIdx=-1;G.given=null;
  if(G.task.type==="choice"&&!G.task.fixed)G.task.choices=shuffle(G.task.choices);
}
function answer(val){
  if(G.done)return;const T=G.task;let ok;
  if(T.type==="num")ok=Number(val)===T.a;else if(T.type==="pair")ok=Number(val[0])===T.a[0]&&Number(val[1])===T.a[1];else ok=val===T.a;
  G.done=true;G.ok=ok;G.given=val;G.res.push(ok);
  if(ok){G.streak++;G.gain=10+(G.streak>=3?5:0);G.pts+=G.gain;}else{G.streak=0;G.gain=0;}
  // Lokal zuerst: Antwort, Budget und Punkte sofort speichern, dann Abgleich anstoßen.
  commit((s,c)=>applyAnswer(s,c,{topic:T.topic,ok,gain:G.gain,li:G.li,trial:G.trial}));
  G.hist.push({topic:T.topic,ok,q:T.q.replace(/<[^>]+>/g,""),given:String(val),right:rightText(T)});
  tone(ok?[523,659,784]:[220,180],ok?.12:.18,S().settings.sound);
  render();requestAnimationFrame(()=>{const gw=document.getElementById("gw");if(gw)gw.classList.add(ok?"shoot":"miss");});
}
function next(){G.i++;if(G.i>=G.len){finish();return;}nextTask();render();}
function finish(){
  const c=G.res.filter(Boolean).length,n=G.len,win=!G.trial&&c/n>=.6,perfect=!G.trial&&c===n&&n>=5;
  G.bonus=(win?20:0)+(perfect?30:0);G.pts+=G.bonus;
  const r=commit((s,cx)=>applyRoundEnd(s,cx,{li:G.li,mode:G.mode,trial:G.trial,c,n,pts:G.pts,bonus:G.bonus}));
  G.newSticker=r.newSticker;UI.celebrate=r.celebrate;
  view="result";render();window.scrollTo(0,0);scheduleSync(0);
}

// ================= Darstellung und Ereignisse =================
function env(){return{hasPin:!!globalRec.state.pin,syncText:syncText(),updateReady:UI.updateReady,persistent:store.persistent,version:APP_VERSION};}
function render(){
  if(UI.fatal){root.innerHTML=`<section class="panel"><h3>Bitte App neu öffnen</h3><p>${UI.fatal}</p></section>`;return;}
  root.innerHTML=bandHTML(UI.preview)+(view==="accounts"?accountsHTML(accounts.filter(a=>a.rec.state||a.name),UI,env())
    :view==="home"?homeHTML(S(),UI,env()):view==="play"?playHTML(S(),G):resultHTML(S(),G,UI));
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
  const id="k-"+randomId("",8),now=Date.now();
  const rec={id,name,state:newProfile({id,name,deviceId,now}),baseRev:null,dirty:true,lastSync:null};
  await store.put("profile:"+id,rec);
  accounts.push({id,name,rec});UI.newAcct=false;UI.acctMsg="";
  await useAccount(id);
}

function bind(){
  const $=id=>document.getElementById(id);
  document.querySelectorAll("[data-play]").forEach(b=>b.onclick=()=>{const [li,m]=b.dataset.play.split(":");startRound(Number(li),m,false);});
  document.querySelectorAll("[data-trial]").forEach(b=>b.onclick=()=>startRound(Number(b.dataset.trial),"mix",true));
  if($("snd"))$("snd").onclick=()=>{commit((s,c)=>applySound(s,c,!s.settings.sound));render();};
  if($("home"))$("home").onclick=()=>{view="home";UI.confirmReset=false;UI.celebrate="";render();window.scrollTo(0,0);};
  if($("again"))$("again").onclick=()=>{UI.celebrate="";startRound(G.li,G.mode,false);};
  if($("hint"))$("hint").onclick=()=>{G.showHint=true;render();};
  if($("next"))$("next").onclick=next;
  if($("tapok"))$("tapok").onclick=()=>{if(G.pickIdx>=0)answer(G.pickIdx);};
  document.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>{const k=b.dataset.k;if(k==="del")del();else if(k==="ok")ok();else typeDigit(k);});
  document.querySelectorAll("[data-slot]").forEach(b=>b.onclick=()=>{if(!G.done){G.act=Number(b.dataset.slot);render();}});
  document.querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>answer(b.dataset.c));
  document.querySelectorAll("[data-w]").forEach(b=>b.onclick=()=>{G.pickIdx=Number(b.dataset.w);render();});
  // Konten
  document.querySelectorAll("[data-acct]").forEach(b=>b.onclick=()=>useAccount(b.dataset.acct));
  if($("acctNew"))$("acctNew").onclick=()=>{UI.newAcct=true;UI.acctMsg="";render();};
  if($("acctCancel"))$("acctCancel").onclick=()=>{UI.newAcct=false;UI.acctMsg="";render();};
  if($("acctCreate"))$("acctCreate").onclick=createAccount;
  if($("switch"))$("switch").onclick=()=>{view="accounts";UI.parent=false;UI.newAcct=false;render();};
  if($("upd"))$("upd").onclick=()=>updateApp(false);
  // Eltern
  if($("pinSet"))$("pinSet").onclick=async()=>{const v=$("pinNew").value.trim();if(!validPin(v)){UI.pinMsg="Bitte genau 4 Ziffern eingeben.";render();return;}
    await setGlobalPin(await makePin(v));UI.parent=true;UI.pinMsg="";render();};
  if($("pinOk"))$("pinOk").onclick=async()=>{const r=await checkPin($("pinIn").value.trim(),globalRec.state.pin);
    if(r.ok){if(r.upgrade)await setGlobalPin(r.upgrade);UI.parent=true;UI.pinMsg="";}else UI.pinMsg="Die PIN stimmt nicht.";render();};
  if($("pinClose"))$("pinClose").onclick=()=>{UI.parent=false;UI.confirmReset=false;render();};
  document.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>{commit((s,c)=>applyOpen(s,c,Number(b.dataset.open)));render();});
  document.querySelectorAll("[data-lock]").forEach(b=>b.onclick=()=>{commit((s,c)=>applyLock(s,c,Number(b.dataset.lock)));render();});
  if($("reset"))$("reset").onclick=()=>{UI.confirmReset=true;render();};
  if($("resetNo"))$("resetNo").onclick=()=>{UI.confirmReset=false;render();};
  if($("resetYes"))$("resetYes").onclick=()=>{cur.rec.state=applyReset(S(),ctx());cur.rec.dirty=true;persist();scheduleSync(300);UI.confirmReset=false;render();};
}
document.addEventListener("keydown",e=>{if(view!=="play"||!G)return;if(e.target&&e.target.tagName==="INPUT")return;
  if(G.done&&(e.key==="Enter"||e.key===" ")){e.preventDefault();next();return;}if(G.done)return;
  const T=G.task;if(T.type!=="num"&&T.type!=="pair")return;
  if(/^[0-9]$/.test(e.key))typeDigit(e.key);else if(e.key==="Backspace")del();else if(e.key==="Enter")ok();});

// ================= Start =================
(async function main(){
  try{
    await loadAll();
    if(!accounts.length)view="accounts";
    render();
    initSW();
    syncNow();
  }catch(e){
    console.error(e);
    UI.fatal=e instanceof UnsupportedSchema?"Der gespeicherte Spielstand ist neuer als diese App. Schließe die App ganz und öffne sie neu, damit die neue Version geladen wird. Der Spielstand geht dabei nicht verloren.":"Beim Start ist ein Fehler aufgetreten: "+esc(e.message||e);
    render();
    if(e instanceof UnsupportedSchema)initSW().then(()=>updateApp(true));
  }
})();
