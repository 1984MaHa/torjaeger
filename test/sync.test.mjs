// Abgleich gegen den echten Server: zwei "Browser-Profile" (eigener Speicher, eigene Geräte-ID) auf demselben Konto.
import {test,before,after} from "node:test";
import assert from "node:assert/strict";
import {startServer,api,makeDevice} from "./helpers.mjs";
import {newProfile,newGlobal,total,answersOf,SCHEMA_VERSION} from "../app/js/model.js";
import {applyAnswer,applyRoundEnd,applyReset,applyOpen} from "../app/js/rules.js";
import {makePin} from "../app/js/pin.js";

let S;
before(async()=>{S=await startServer();});
after(async()=>{await S.close();});

const answers=(dev,rec,t0,n,topic,ok=true)=>{
  for(let i=0;i<n;i++){applyAnswer(rec.state,dev.ctx(t0+i),{topic,ok,gain:10,li:0,trial:false});}
  rec.dirty=true;
};
const round=(dev,rec,t,c=6)=>{applyRoundEnd(rec.state,dev.ctx(t),{li:0,mode:"math",trial:false,c,n:8,pts:60,bonus:20});rec.dirty=true;};

test("zwei Geräte spielen offline auf demselben Konto: nichts geht verloren",async()=>{
  const A=makeDevice(S.base,"gerat-a"),B=makeDevice(S.base,"gerat-b");
  const id="k-emil-sync";
  // Gerät A legt das Konto an und gleicht ab
  const recA={id,state:newProfile({id,name:"Emil",deviceId:"gerat-a",now:1000}),baseRev:null,dirty:true,lastSync:null};
  assert.deepEqual(await A.sync.syncProfile(recA),{ok:true,pushed:true});
  assert.equal(recA.baseRev,1);assert.equal(recA.dirty,false);
  // Gerät B kennt das Konto aus der Liste und holt den Stand
  const list=await B.sync.listRemoteProfiles();
  assert.equal(list.profiles.find(p=>p.id===id).name,"Emil");
  const recB={id,name:"Emil",state:null,baseRev:null,dirty:false,lastSync:null};
  await B.sync.syncProfile(recB);
  assert.equal(recB.state.profile.name,"Emil");assert.equal(recB.baseRev,1);

  // beide gehen offline und spielen
  A.online=false;B.online=false;
  answers(A,recA,10000,6,"m_split");round(A,recA,10100);
  answers(B,recB,20000,5,"m_split",false);answers(B,recB,20100,4,"d_wortart");round(B,recB,20200,3);
  await A.store.put("profile:"+id,recA);   // wie die App: nach jeder Aufgabe lokal speichern
  const offA=await A.sync.syncProfile(recA);assert.deepEqual(offA,{ok:false,reason:"offline"});
  assert.equal(recA.dirty,true);            // bleibt lokal gespeichert und vorgemerkt
  assert.equal((await A.store.get("profile:"+id)).dirty,true);

  // wieder online: B zuerst, dann A, dann B holt die Summe
  A.online=true;B.online=true;
  assert.equal((await B.sync.syncProfile(recB)).ok,true);
  assert.equal((await A.sync.syncProfile(recA)).ok,true);
  assert.equal((await B.sync.syncProfile(recB)).ok,true);
  assert.equal((await A.sync.syncProfile(recA)).ok,true);

  const server=(await api(S.base,"GET",`/api/profiles/${id}/state`)).json.state;
  for(const s of [recA.state,recB.state,server]){
    assert.equal(total(s,"points"),6*10+20 + 9*10+20,"Punkte");
    assert.equal(total(s,"rounds"),2);
    assert.equal(answersOf(s,"m_split").a,11);assert.equal(answersOf(s,"m_split").c,6);
    assert.equal(answersOf(s,"d_wortart").a,4);
    assert.equal(s.history.length,2);
    assert.equal(s.stats.m_split.last.length,10);
  }
  assert.equal(recA.dirty,false);assert.equal(recB.dirty,false);
});

test("Konflikt beim Senden (409) wird zusammengeführt und erneut gesendet",async()=>{
  const A=makeDevice(S.base,"gerat-a"),B=makeDevice(S.base,"gerat-b");
  const id="k-konflikt1";
  const recA={id,state:newProfile({id,name:"Mia",deviceId:"gerat-a",now:1000}),baseRev:null,dirty:true,lastSync:null};
  await A.sync.syncProfile(recA);
  const recB={id,state:null,baseRev:null,dirty:false,lastSync:null};await B.sync.syncProfile(recB);
  // B schreibt dazwischen, A weiß nichts davon (baseRev veraltet, dirty)
  answers(B,recB,5000,3,"m_read");await B.sync.syncProfile(recB);
  answers(A,recA,6000,2,"m_read");
  const staleRev=recA.baseRev;
  const r=await A.sync.syncProfile(recA);
  assert.equal(r.ok,true);assert.ok(recA.baseRev>staleRev);
  const server=(await api(S.base,"GET",`/api/profiles/${id}/state`)).json.state;
  assert.equal(total(server,"points"),50);assert.equal(answersOf(server,"m_read").a,5);
});

test("App mit veralteter Schemaversion: Server lehnt ab, Client meldet reload",async()=>{
  const id="k-schema001";
  const neu=makeDevice(S.base,"gerat-neu"),alt=makeDevice(S.base,"gerat-alt");
  const s2=newProfile({id,name:"Neu",deviceId:"gerat-neu"});s2.meta.schemaVersion=SCHEMA_VERSION+1;
  await api(S.base,"POST","/api/profiles",{id,name:"Neu"});
  assert.equal((await api(S.base,"PUT",`/api/profiles/${id}/state`,{baseRev:0,device:"x",state:s2})).status,200);
  const rec={id,state:newProfile({id,name:"Alt",deviceId:"gerat-alt"}),baseRev:null,dirty:true,lastSync:null};
  const r=await alt.sync.syncProfile(rec);
  assert.deepEqual(r,{ok:false,reason:"reload"});
  assert.equal((await api(S.base,"GET",`/api/profiles/${id}/state`)).json.state.profile.name,"Neu"); // nichts zurückgeschrieben
  assert.ok(neu);
});

test("Zurücksetzen auf einem Gerät gilt nach dem Abgleich auf dem anderen",async()=>{
  const A=makeDevice(S.base,"gerat-a"),B=makeDevice(S.base,"gerat-b");
  const id="k-reset0001";
  const recA={id,state:newProfile({id,name:"Lea",deviceId:"gerat-a",now:1000}),baseRev:null,dirty:true,lastSync:null};
  answers(A,recA,3000,4,"m_read");await A.sync.syncProfile(recA);
  const recB={id,state:null,baseRev:null,dirty:false,lastSync:null};await B.sync.syncProfile(recB);
  recA.state=applyReset(recA.state,A.ctx(9000));recA.dirty=true;await A.sync.syncProfile(recA);
  await B.sync.syncProfile(recB);
  assert.equal(total(recB.state,"points"),0);
});

test("Eltern-PIN wird geräteübergreifend abgeglichen",async()=>{
  const A=makeDevice(S.base,"gerat-a"),B=makeDevice(S.base,"gerat-b");
  const gA={id:"global",state:newGlobal(1000),baseRev:null,dirty:true,lastSync:null};
  gA.state.pin=await makePin("4711",2000);gA.state.updatedAt=2000;
  assert.equal((await A.sync.syncGlobal(gA)).ok,true);
  const gB={id:"global",state:newGlobal(1500),baseRev:null,dirty:true,lastSync:null};
  assert.equal((await B.sync.syncGlobal(gB)).ok,true);
  assert.equal(gB.state.pin.hash,gA.state.pin.hash);   // die ältere leere PIN von B überschreibt nichts
  assert.equal((await api(S.base,"GET","/api/settings")).json.settings.pin.hash,gA.state.pin.hash);
});

test("Freigabe am einen Gerät wirkt auf dem anderen",async()=>{
  const A=makeDevice(S.base,"gerat-a"),B=makeDevice(S.base,"gerat-b");
  const id="k-freigabe1";
  const recA={id,state:newProfile({id,name:"Tom",deviceId:"gerat-a",now:1000}),baseRev:null,dirty:true,lastSync:null};
  await A.sync.syncProfile(recA);
  const recB={id,state:null,baseRev:null,dirty:false,lastSync:null};await B.sync.syncProfile(recB);
  applyOpen(recB.state,B.ctx(5000),1);recB.dirty=true;await B.sync.syncProfile(recB);
  await A.sync.syncProfile(recA);
  assert.equal(recA.state.progress.lg.L2.open,true);
});
