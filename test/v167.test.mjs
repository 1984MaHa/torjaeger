// Version 1.6.7 (B8): Liga-Freigaben gehören dem Server. Freigeben und Sperren nur mit Eltern-PIN, der normale Abgleich ändert sie nicht.
import {test,before,after} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {fileURLToPath} from "node:url";
import {startServer,api,makeDevice} from "./helpers.mjs";
import {newProfile,newGlobal} from "../app/js/model.js";
import {applyOpen,applyLock,guardLeagues,leagueState,LEAGUE_COUNT} from "../app/js/rules.js";
import {makePin} from "../app/js/pin.js";
import {createAdminApi,adminError} from "../app/js/adminapi.js";

const ROOT=fileURLToPath(new URL("..",import.meta.url));
let S;
before(async()=>{S=await startServer();});
after(async()=>{await S.close();});
const mk=(id,dev="gerat-a")=>({id,state:newProfile({id,name:"Tom",deviceId:dev,now:1000}),baseRev:null,dirty:true,lastSync:null});
const league=(id,body)=>api(S.base,"POST",`/api/admin/profiles/${id}/league`,body);
const serverState=async id=>(await api(S.base,"GET",`/api/profiles/${id}/state`)).json.state;
const putState=async(id,st,device="x")=>{const cur=(await api(S.base,"GET",`/api/profiles/${id}/state`)).json;return api(S.base,"PUT",`/api/profiles/${id}/state`,{baseRev:cur.rev,device,state:st});};
async function setupPin(A){
  const g={id:"global",state:newGlobal(1000),baseRev:null,dirty:true,lastSync:null};g.state.pin=await makePin("4711",2000);g.state.updatedAt=2000;
  assert.equal((await A.sync.syncGlobal(g)).ok,true);
}

test("guardLeagues: der gespeicherte Wert bleibt, in beide Richtungen, ohne gespeicherten Stand gilt der erste",()=>{
  const stored=newProfile({id:"k-a",name:"A",deviceId:"d",now:1});applyOpen(stored,{deviceId:"d",now:2},1);
  const inc=JSON.parse(JSON.stringify(stored));inc.progress.lg.L2.open=false;
  assert.deepEqual(guardLeagues(stored,inc),{L2:true});assert.equal(inc.progress.lg.L2.open,true,"Freigabe bleibt");
  const inc2=newProfile({id:"k-a",name:"A",deviceId:"d",now:1});applyOpen(inc2,{deviceId:"d",now:3},2);
  assert.deepEqual(guardLeagues(stored,inc2),{L2:true,L3:false});assert.equal(inc2.progress.lg.L3.open,false,"neue Freigabe wird nicht übernommen");
  const inc3=newProfile({id:"k-a",name:"A",deviceId:"d",now:1}); // Eintrag fehlt eingehend
  assert.deepEqual(guardLeagues(stored,inc3),{L2:true});assert.equal(inc3.progress.lg.L2.open,true);
  const gleich=JSON.parse(JSON.stringify(stored));assert.deepEqual(guardLeagues(stored,gleich),{},"nichts zu halten");
  const neu=newProfile({id:"k-b",name:"B",deviceId:"d",now:1});applyOpen(neu,{deviceId:"d",now:2},1);
  assert.deepEqual(guardLeagues(null,neu),{});assert.equal(neu.progress.lg.L2.open,true,"Konto wird angelegt");
  assert.deepEqual(guardLeagues({},neu),{});
  assert.equal(LEAGUE_COUNT,3);
});
test("Normaler Abgleich kann keine Liga freigeben: der Server behält 'gesperrt'",async()=>{
  const A=makeDevice(S.base,"gerat-a"),id="k-guard-1",rec=mk(id);
  await A.sync.syncProfile(rec);                       // Konto wird angelegt
  applyOpen(rec.state,A.ctx(5000),1);rec.dirty=true;   // das Gerät behauptet, die Liga sei frei
  const r=await A.sync.syncProfile(rec);assert.equal(r.ok,true);
  assert.equal((await serverState(id)).progress.lg.L2?.open??false,false,"der Server hat es nicht übernommen");
  assert.equal(rec.state.progress.lg.L2.open,false,"die App gleicht sich an");assert.equal(leagueState(rec.state,1)==="open",false);
});
test("Mit PIN freigeben: gilt auf dem Server und auf einem anderen Gerät; ein älterer Stand hebt es nicht auf",async()=>{
  const A=makeDevice(S.base,"gerat-a"),B=makeDevice(S.base,"gerat-b"),id="k-guard-2",recA=mk(id);
  await setupPin(A);await A.sync.syncProfile(recA);
  const recB={id,state:null,baseRev:null,dirty:false,lastSync:null};await B.sync.syncProfile(recB);
  assert.equal((await league(id,{pin:"4711",li:1,open:true})).status,200);
  assert.equal((await serverState(id)).progress.lg.L2.open,true);
  // Gerät A hat den alten Stand (L2 noch zu) und spielt weiter
  recA.dirty=true;recA.state.progress.dev["gerat-a"]={points:5,rounds:0,wins:0,stickers:0};
  await A.sync.syncProfile(recA);
  assert.equal(recA.state.progress.lg.L2.open,true,"Freigabe kommt auf dem anderen Gerät an");
  assert.equal((await serverState(id)).progress.lg.L2.open,true);
  // eine Sperre auf einem Gerät ohne PIN ändert nichts
  applyLock(recB.state,B.ctx(Date.now()+5000),1);recB.dirty=true;await B.sync.syncProfile(recB);
  assert.equal((await serverState(id)).progress.lg.L2.open,true,"ohne PIN keine Sperre");
  assert.equal(recB.state.progress.lg.L2.open,true);
  // direkter PUT mit gesperrter Liga: gespeichert wird 'frei', die Antwort nennt es
  const st=await serverState(id);st.progress.lg.L2.open=false;
  const p=await putState(id,st);assert.equal(p.status,200);assert.deepEqual(p.json.lg,{L2:true});
  assert.equal((await serverState(id)).progress.lg.L2.open,true);
});
test("Mit PIN wieder sperren",async()=>{
  const A=makeDevice(S.base,"gerat-a"),id="k-guard-3",rec=mk(id);
  await setupPin(A);await A.sync.syncProfile(rec);
  await league(id,{pin:"4711",li:2,open:true});assert.equal((await serverState(id)).progress.lg.L3.open,true);
  const r=await league(id,{pin:"4711",li:2,open:false});assert.equal(r.status,200);
  const sv=await serverState(id);assert.equal(sv.progress.lg.L3.open,false);assert.equal(sv.progress.lg.L3.probe,false);
  assert.ok(sv.meta.rev>=3);
});
test("Eltern-Weg: falsche PIN, fehlende PIN, ungültige Liga, unbekanntes Konto",async()=>{
  const A=makeDevice(S.base,"gerat-a"),id="k-guard-4",rec=mk(id);
  await setupPin(A);await A.sync.syncProfile(rec);
  assert.equal((await league(id,{pin:"0000",li:1,open:true})).status,403);
  assert.equal((await league(id,{li:1,open:true})).status,403);
  assert.equal((await serverState(id)).progress.lg.L2?.open??false,false);
  for(const bad of [{li:0,open:true},{li:3,open:true},{li:1.5,open:true},{li:"1",open:true},{li:1},{li:1,open:"ja"}]){
    const r=await league(id,Object.assign({pin:"4711"},bad));assert.equal(r.status,400,JSON.stringify(bad));assert.equal(r.json.error,"bad_league");
  }
  assert.equal((await league("k-gibtsnicht",{pin:"4711",li:1,open:true})).status,404);
  const A2=makeDevice(S.base,"gerat-c");
  assert.equal((await api(S.base,"POST",`/api/profiles`,{id:"k-guard-leer",name:"Leer"})).status,201);
  assert.equal((await league("k-guard-leer",{pin:"4711",li:1,open:true})).status,409,"noch kein Spielstand");
  assert.ok(A2);
});
test("Ein Konto, das erst angelegt wird, behält seine freigegebenen Ligen (alter Stand vom Gerät)",async()=>{
  const A=makeDevice(S.base,"gerat-a"),id="k-guard-5",rec=mk(id);
  applyOpen(rec.state,A.ctx(2000),1);
  await A.sync.syncProfile(rec);
  assert.equal((await serverState(id)).progress.lg.L2.open,true);
});
test("Client: adminApi.league sendet PIN, Liga und Zustand, Fehlermeldungen",async()=>{
  const calls=[];
  const api2=createAdminApi({base:"",fetchFn:async(url,opts)=>{calls.push({url,body:JSON.parse(opts.body)});return{status:200,json:async()=>({ok:true})};},deviceId:"d"});
  const r=await api2.league("4711","k-x",2,true);assert.equal(r.ok,true);
  assert.equal(calls[0].url,"/api/admin/profiles/k-x/league");assert.deepEqual(calls[0].body,{pin:"4711",li:2,open:true});
  assert.match(adminError({status:400,error:"bad_league"}),/Liga/);
});
test("Verdrahtung: beide Eltern-Wege fragen den Server, offline gibt es eine Meldung, Version 1.6.7",()=>{
  const src=fs.readFileSync(ROOT+"app/js/app.js","utf8");
  assert.match(src,/async function setLeague/);assert.match(src,/adminApi\.league\(pin,rec\.id,li,open\)/);
  assert.ok(src.includes("UI.pinMsg=await setLeague(cur.rec,UI.parentPin,Number(b.dataset.open),true)"));
  assert.ok(src.includes("const m=await setLeague(rec,A.pin,Number(li),true)"));
  assert.match(src,/nur mit Verbindung zum Server/);
  assert.ok(!/commit\(\(s,c\)=>applyOpen\(s,c,Number\(b\.dataset\.open\)\)\)/.test(src),"kein lokales Freigeben ohne Server");
  const sync=fs.readFileSync(ROOT+"app/js/sync.js","utf8");assert.match(sync,/p\.json\.lg/);
  assert.match(fs.readFileSync(ROOT+"server/server.js","utf8"),/rules\.guardLeagues/);
});
