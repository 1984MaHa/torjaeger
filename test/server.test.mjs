import {test,before,after} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {startServer,api} from "./helpers.mjs";
import {newProfile,newGlobal} from "../app/js/model.js";

let S;
before(async()=>{S=await startServer();});
after(async()=>{await S.close();});

const state=(id,name,v=1)=>{const s=newProfile({id,name,deviceId:"d1"});s.meta.schemaVersion=v;return s;};

test("health und entfernter Phase-0-Endpunkt",async()=>{
  assert.equal((await api(S.base,"GET","/api/health")).json.ok,true);
  assert.equal((await api(S.base,"GET","/api/state")).status,404);
});

test("Konto anlegen, listen, Stand lesen und schreiben",async()=>{
  assert.deepEqual((await api(S.base,"GET","/api/profiles")).json.profiles,[]);
  const c=await api(S.base,"POST","/api/profiles",{id:"k-emil0001",name:"Emil"});
  assert.equal(c.status,201);
  assert.equal((await api(S.base,"POST","/api/profiles",{id:"k-emil0001",name:"Doppelt"})).status,409);
  const g=await api(S.base,"GET","/api/profiles/k-emil0001/state");
  assert.equal(g.json.rev,0);assert.equal(g.json.state,null);
  const p=await api(S.base,"PUT","/api/profiles/k-emil0001/state",{baseRev:0,device:"d1",state:state("k-emil0001","Emil")});
  assert.equal(p.status,200);assert.equal(p.json.rev,1);
  const g2=await api(S.base,"GET","/api/profiles/k-emil0001/state");
  assert.equal(g2.json.rev,1);assert.equal(g2.json.state.profile.name,"Emil");assert.equal(g2.json.state.meta.rev,1);
  const list=(await api(S.base,"GET","/api/profiles")).json.profiles;
  assert.equal(list.length,1);assert.equal(list[0].name,"Emil");
});

test("Konflikt: veraltete baseRev gibt 409 mit aktuellem Stand",async()=>{
  const r=await api(S.base,"PUT","/api/profiles/k-emil0001/state",{baseRev:0,device:"d2",state:state("k-emil0001","Emil")});
  assert.equal(r.status,409);assert.equal(r.json.reason,"rev");assert.equal(r.json.current.rev,1);
  const ok=await api(S.base,"PUT","/api/profiles/k-emil0001/state",{baseRev:1,device:"d2",state:state("k-emil0001","Emil")});
  assert.equal(ok.json.rev,2);
});

test("ältere schemaVersion als gespeichert: 409 mit Grund, Stand bleibt",async()=>{
  await api(S.base,"POST","/api/profiles",{id:"k-neu00002",name:"Neu"});
  assert.equal((await api(S.base,"PUT","/api/profiles/k-neu00002/state",{baseRev:0,device:"d",state:state("k-neu00002","Neu",2)})).status,200);
  const r=await api(S.base,"PUT","/api/profiles/k-neu00002/state",{baseRev:1,device:"d",state:state("k-neu00002","Alt",1)});
  assert.equal(r.status,409);assert.equal(r.json.reason,"schema_too_old");assert.equal(r.json.storedSchemaVersion,2);
  const g=await api(S.base,"GET","/api/profiles/k-neu00002/state");
  assert.equal(g.json.rev,1);assert.equal(g.json.state.profile.name,"Neu");
});

test("Konto-ID wird streng geprüft (kein Pfadausbruch)",async()=>{
  for(const bad of ["..","a","../x","K-GROSS","k_unter","a/b","k-"+"x".repeat(60),"%2e%2e"]){
    const r=await api(S.base,"GET","/api/profiles/"+encodeURIComponent(bad)+"/state");
    assert.ok([400,404].includes(r.status),bad+" -> "+r.status);
  }
  assert.equal((await api(S.base,"GET","/api/profiles/..%2F..%2Fsettings/state")).status,400);
  assert.equal((await api(S.base,"POST","/api/profiles",{id:"../evil",name:"X"})).status,400);
  assert.equal((await api(S.base,"POST","/api/profiles",{id:"k-okok0003"})).status,400);
  assert.equal(fs.existsSync(path.join(S.dataDir,"evil.json")),false);
});

test("ungültige Eingaben",async()=>{
  assert.equal((await api(S.base,"PUT","/api/profiles/k-emil0001/state","{kaputt")).status,400);
  assert.equal((await api(S.base,"PUT","/api/profiles/k-emil0001/state",{state:state("k-emil0001","E")})).status,400);
  assert.equal((await api(S.base,"PUT","/api/profiles/k-emil0001/state",{baseRev:2,state:{meta:{}}})).status,400);
  assert.equal((await api(S.base,"GET","/api/profiles/k-gibtsnicht/state")).status,404);
  assert.equal((await api(S.base,"DELETE","/api/profiles")).status,405);
});

test("Einstellungen: lesen, schreiben, Konflikt",async()=>{
  const g=await api(S.base,"GET","/api/settings");
  assert.equal(g.json.rev,0);assert.equal(g.json.settings,null);
  const s1=newGlobal();s1.pin={algo:"sha256-salt",salt:"ab",hash:"cd",t:1};
  assert.equal((await api(S.base,"PUT","/api/settings",{baseRev:0,device:"d1",settings:s1})).json.rev,1);
  assert.equal((await api(S.base,"PUT","/api/settings",{baseRev:0,device:"d2",settings:s1})).status,409);
  const g2=await api(S.base,"GET","/api/settings");
  assert.equal(g2.json.settings.pin.hash,"cd");
});

test("Datei wird atomar geschrieben, Tagessicherung liegt da",async()=>{
  const files=fs.readdirSync(path.join(S.dataDir,"profiles"));
  assert.ok(files.includes("k-emil0001.json"));assert.ok(!files.some(f=>f.endsWith(".tmp")));
  const backups=fs.readdirSync(path.join(S.dataDir,"backups"));
  assert.ok(backups.some(f=>/^profile-k-emil0001-\d{4}-\d{2}-\d{2}\.json$/.test(f)));
  assert.ok(backups.some(f=>/^settings-\d{4}-\d{2}-\d{2}\.json$/.test(f)));
});

test("Statische Dateien: App wird ausgeliefert, kein Ausbruch aus app/",async()=>{
  const r=await fetch(S.base+"/");assert.equal(r.status,200);
  assert.match(await r.text(),/Torjäger-Liga/);
  assert.equal((await fetch(S.base+"/sw.js")).headers.get("cache-control"),"no-cache");
  const esc=await fetch(S.base+"/..%2Fserver%2Fserver.js");assert.notEqual(esc.status,200);
  assert.equal((await fetch(S.base+"/js/gibtsnicht.js")).status,404);
});
