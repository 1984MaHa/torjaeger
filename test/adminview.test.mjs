// Eltern-Bereich in der App: Ansichten, Verdrahtung der Tasten mit app.js, Aufrufe gegen den echten Server.
import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {fileURLToPath} from "node:url";
import {startServer} from "./helpers.mjs";
import {newProfile,newGlobal} from "../app/js/model.js";
import {applyAnswer,applyHelp,applyRoundEnd,applyOpen} from "../app/js/rules.js";
import {adminHTML,adminAskHTML,fmtSize,fmtDur,fmtDay,ADMIN_TABS} from "../app/js/admin.js";
import {accountsHTML} from "../app/js/views.js";
import {createAdminApi,adminError} from "../app/js/adminapi.js";
import {makePin} from "../app/js/pin.js";

const DIR=fileURLToPath(new URL("../app/js/",import.meta.url));
const src=f=>fs.readFileSync(DIR+f,"utf8");

function sampleState(name="Emil"){
  const s=newProfile({id:"k-emil0001",name,deviceId:"d1",now:1000});
  applyAnswer(s,{deviceId:"d1",now:2000},{topic:"m_read",ok:true,gain:10,li:0,trial:false,help:1});
  applyAnswer(s,{deviceId:"d1",now:2001},{topic:"m_read",ok:false,gain:0,li:0,trial:false});
  applyHelp(s,{deviceId:"d1",now:2002},{topic:"m_read",level:1});applyHelp(s,{deviceId:"d1",now:2003},{topic:"m_read",level:2});
  applyRoundEnd(s,{deviceId:"d1",now:Date.UTC(2026,8,29,10,5)},{li:0,mode:"mix",trial:false,c:6,n:8,pts:90,bonus:20,dur:187});
  applyRoundEnd(s,{deviceId:"d1",now:Date.UTC(2026,8,29,11,5)},{li:1,mode:"math",trial:true,c:2,n:3,pts:20,bonus:0});
  s.progress.lg.L2={probe:true,spent:8,open:false,trial:"",t:5};
  return s;
}
const model=(tab,extra={})=>({tab,msg:null,accounts:[{id:"k-emil0001",name:"Emil",state:sampleState()},{id:"k-mia00002",name:"<img src=x onerror=alert(1)>",state:sampleState("<img src=x onerror=alert(1)>")},{id:"k-neu00003",name:"Neu",state:null}],
  sel:"k-emil0001",renaming:null,renamingDevice:null,confirm:null,moreDaily:false,deviceId:"g-ipad00001",appVersion:"1.1.0",persistent:true,previewLabel:"VORSCHAU",schema:{app:2,global:2},
  server:{state:"ok",config:{serverVersion:"1.1.0",schemaVersion:2,globalSchemaVersion:2},
    backups:[{kind:"trash",key:"trash:k-x-20260929-100000.json",profileId:"k-x",profileName:"Mia",date:"2026-09-29T10:00:00Z",size:2048},
      {kind:"manual",key:"manual:profile-k-x-20260929-100000-vor-zuruecksetzen.json",profileId:"k-x",profileName:"Mia",date:"2026-09-29T10:00:00Z",size:4096,note:"vor-zuruecksetzen"},
      {kind:"pre-deploy",name:"pre-deploy-20260929-1200",date:"2026-09-29T12:00:00Z",size:8192,items:[{key:"pre:pre-deploy-20260929-1200:k-x",profileId:"k-x",profileName:"Mia",size:4096}]},
      ...Array.from({length:12},(_,i)=>({kind:"daily",key:`daily:profile-k-x-2026-09-${String(i+1).padStart(2,"0")}.json`,profileId:"k-x",profileName:"Mia",date:`2026-09-${String(i+1).padStart(2,"0")}T08:00:00Z`,size:5000})),
      {kind:"daily-settings",date:"2026-09-29T08:00:00Z",size:300}],
    devices:[{id:"g-ipad00001",name:"Emils iPad",kind:"iPad",firstSeen:"2026-09-28T10:00:00Z",lastSeen:"2026-09-29T10:00:00Z",lastPush:"2026-09-29T09:00:00Z"},{id:"g-iphone002",name:"",kind:"iPhone",firstSeen:"2026-09-28T10:00:00Z",lastSeen:"2026-09-29T09:00:00Z",lastPush:null}]},
  ...extra});

test("Alle vier Bereiche lassen sich rendern, ohne kaputte Werte und mit entschärften Namen",()=>{
  assert.deepEqual(ADMIN_TABS.map(t=>t[0]),["accounts","stand","settings","system"]);
  for(const tab of ["accounts","stand","settings","system"]){
    const h=adminHTML(model(tab));
    assert.ok(!/undefined|NaN|\[object|null</.test(h),tab+": "+(/(undefined|NaN|\[object|null<)/.exec(h)||[])[0]);
    assert.ok(!h.includes("<img src=x"),tab+": Name nicht entschärft");
    for(const [k,l] of ADMIN_TABS)assert.ok(h.includes(`data-atab="${k}"`)&&h.includes(l));
    assert.ok(h.includes("data-aclose"));
  }
  const acc=adminHTML(model("accounts"));
  assert.ok(acc.includes("Umbenennen")&&acc.includes("Zurücksetzen")&&acc.includes("Löschen")&&acc.includes("Ganz freigeben")&&acc.includes("noch 12 von 20"));  // Probe-Kontingent
  assert.ok(acc.includes("Wird vom Server geladen")&&acc.includes("data-anew"));
  const stand=adminHTML(model("stand"));
  for(const t of ["Letzte 10","Gesamt","Hilfe","Letzte Spiele","3:07 min","29.09.2026","Kreisliga","Mix","Schnuppern","Trainingstage","1× · 1/1"])assert.ok(stand.includes(t),t);
  const set=adminHTML(model("settings"));
  for(const t of ["Ton","Aufgaben pro Runde","Schnuppern","Tipp-Zeit","Eltern-PIN ändern","data-apin",'data-aset="perRound:6"','data-aset="perRound:8"','data-aset="perRound:10"','data-aset="hintAfter:0"','data-aset="trialDaily:false"'])assert.ok(set.includes(t),t);
  const sys=adminHTML(model("system"));
  for(const t of ["Papierkorb","Zurückholen","vor Zurücksetzen","Sicherungen vor Updates","Tagessicherungen","Alle 12 zeigen","Emils iPad","Dieses Gerät","Name ändern","App-Version","1.1.0","Server 2, App 2","Vorschau (VORSCHAU)","8,0 KB","2,0 KB"])assert.ok(sys.includes(t),t);
});

test("Bestätigungen und Zustände",()=>{
  assert.ok(adminHTML(model("accounts",{confirm:"reset:k-emil0001"})).includes("Ja, zurücksetzen"));
  assert.ok(adminHTML(model("accounts",{confirm:"delete:k-emil0001"})).includes("Papierkorb"));
  assert.ok(adminHTML(model("accounts",{renaming:"k-emil0001"})).includes('id="renameIn"'));
  assert.ok(adminHTML(model("system",{confirm:"restore:trash:k-x-20260929-100000.json"})).includes("Ja, zurückholen"));
  assert.ok(adminHTML(model("system",{moreDaily:true})).includes("Weniger zeigen"));
  assert.ok(adminHTML(model("system",{renamingDevice:"g-ipad00001"})).includes('id="devIn"'));
  assert.ok(adminHTML(model("system",{server:{state:"offline"}})).includes("nicht erreichbar"));
  assert.ok(adminHTML(model("system",{server:{state:"loading"}})).includes("Wird geladen"));
  assert.ok(adminHTML(model("accounts",{msg:{t:"err",text:"Die PIN stimmt nicht."}})).includes("amsg err"));
  assert.ok(adminHTML(model("stand",{accounts:[]})).includes("Kein Konto"));
  assert.ok(adminAskHTML("Die PIN stimmt nicht.").includes("adminGo"));
  // Eltern-Taste nur mit vorhandener PIN
  const env={hasPin:true,persistent:true};
  assert.ok(accountsHTML([{id:"k-a",name:"A"}],{newAcct:false,acctMsg:"",adminAsk:false},env).includes('id="adminOpen"'));
  assert.ok(!accountsHTML([],{newAcct:false,acctMsg:"",adminAsk:false},{...env,hasPin:false}).includes('id="adminOpen"'));
  assert.ok(accountsHTML([{id:"k-a",name:"A"}],{newAcct:false,acctMsg:"",adminAsk:true,adminMsg:""},env).includes('id="adminPin"'));
});

test("Formate",()=>{
  assert.equal(fmtSize(500),"500 B");assert.equal(fmtSize(1536),"1,5 KB");assert.equal(fmtSize(3*1048576),"3,0 MB");
  assert.equal(fmtDur(65),"1:05 min");assert.equal(fmtDur(undefined),"-");assert.equal(fmtDay("2026-09-05"),"05.09.2026");
});

test("Jede Taste im Eltern-Bereich hat einen Handler in app.js",()=>{
  const views=src("admin.js")+src("views.js")+src("avatarui.js")+src("coach.js"),app=src("app.js");
  const attrs=new Set([...views.matchAll(/data-([a-z]+)=/g)].map(m=>m[1]).concat([...views.matchAll(/\s(data-[a-z]+)(?=[\s>])/g)].map(m=>m[1].slice(5))));
  const ids=new Set([...views.matchAll(/id="([A-Za-z]+)"/g)].map(m=>m[1]));
  const missing=[];
  for(const a of attrs)if(!app.includes(`[data-${a}]`)&&!app.includes(`"data-${a}"`))missing.push("data-"+a);
  // auch Attribute, die in den Ansichten nur als Name übergeben werden ("data-avhc" und so weiter), brauchen eine Verdrahtung
  for(const m of views.matchAll(/"(data-[a-z]+)"/g))if(!app.includes("["+m[1]+"]")&&!app.includes('"'+m[1]+'"'))missing.push(m[1]);
  for(const i of ids)if(!app.includes(`$("${i}")`)&&!app.includes(`getElementById("${i}")`))missing.push("#"+i);
  // Eingabefelder ohne Handler sind in Ordnung, sie werden per id gelesen
  assert.deepEqual(missing.filter(m=>!["#renameIn","#aNewName","#aOldPin","#aNewPin","#devIn","#adminPin","#avShirtName","#avTeam","#trName","#acctName","#acctPin","#pinNew","#pinIn"].includes(m)),[]);
});

test("Aufrufe des Eltern-Bereichs gegen den echten Server",async()=>{
  const S=await startServer();
  try{
    const g=newGlobal();g.pin=await makePin("1234");
    await fetch(S.base+"/api/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({baseRev:0,device:"d",settings:g})});
    const api=createAdminApi({base:S.base,deviceId:"g-test00001"});
    await fetch(S.base+"/api/profiles",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:"k-emil0001",name:"Emil"})});
    const s=sampleState();
    await fetch(S.base+"/api/profiles/k-emil0001/state",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({baseRev:0,device:"d1",state:s})});
    let r=await api.verify("0000");assert.equal(r.ok,false);assert.equal(r.error,"bad_pin");assert.equal(adminError(r),"Die PIN stimmt nicht.");
    assert.equal((await api.verify("1234")).ok,true);
    assert.equal((await api.devices("1234")).data.devices.some(d=>d.id==="g-test00001"),true);  // meldet sich mit X-Device
    r=await api.reset("1234","k-emil0001");assert.equal(r.ok,true);
    r=await api.backups("1234");assert.ok(r.data.backups.some(b=>b.kind==="manual"));
    const key=r.data.backups.find(b=>b.kind==="manual").key;
    assert.equal((await api.restore("1234",key)).ok,true);
    r=await api.remove("1234","k-emil0001");assert.equal(r.ok,true);
    const trash=(await api.backups("1234")).data.backups.find(b=>b.kind==="trash");
    assert.equal((await api.restore("1234",trash.key)).ok,true);
    assert.equal((await api.renameDevice("1234","g-test00001","Test")).ok,true);
    assert.equal((await api.changePin("1234","5678")).ok,true);
    assert.equal((await api.verify("1234")).ok,false);assert.equal((await api.verify("5678")).ok,true);
    assert.equal((await api.config()).data.schemaVersion,10);
  }finally{await S.close();}
  // ohne Server: status 0, verständliche Meldung
  const off=createAdminApi({base:"http://127.0.0.1:1",fetchFn:()=>Promise.reject(new TypeError("offline"))});
  const r=await off.backups("1234");assert.equal(r.status,0);assert.match(adminError(r),/nicht erreichbar/);
  assert.equal((await off.config()).status,0);
  assert.match(adminError({status:429,error:"too_many",retryAfter:42}),/42 Sekunden/);
});
