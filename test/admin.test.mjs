// Admin-API: heikle Aktionen prüft der Server selbst gegen die Eltern-PIN (falsch abgelehnt, richtig ausgeführt),
// Papierkorb, Wiederherstellen aus Sicherung, Zurücksetzen, PIN ändern, Geräteliste.
import {test,before,after} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {startServer,api,makeDevice} from "./helpers.mjs";
import {newProfile,newGlobal,total} from "../app/js/model.js";
import {applyAnswer,applyRoundEnd,applyAvatar,applySettings} from "../app/js/rules.js";
import {makePin,checkPin} from "../app/js/pin.js";

let S;
const PIN="1234";
const adm=(url,body={},pin=PIN,headers)=>api(S.base,"POST","/api/admin"+url,{pin,...body},headers);
const readJson=f=>JSON.parse(fs.readFileSync(f,"utf8"));
const pfile=id=>path.join(S.dataDir,"profiles",id+".json");

async function putGlobalPin(base,pin){
  const g=newGlobal();g.pin=await makePin(pin);
  return api(base,"PUT","/api/settings",{baseRev:0,device:"d0",settings:g});
}
// Konto mit einem Stand auf dem Server anlegen: Punkte durch eine beantwortete Aufgabe
async function makeProfile(base,id,name,points,extra){
  await api(base,"POST","/api/profiles",{id,name});
  const s=newProfile({id,name,deviceId:"d1",now:1000});
  applyAnswer(s,{deviceId:"d1",now:2000},{topic:"m_read",ok:true,gain:points,li:0,trial:false});
  if(extra)extra(s);
  const r=await api(base,"PUT",`/api/profiles/${id}/state`,{baseRev:0,device:"d1",state:s});
  assert.equal(r.status,200);return s;
}

before(async()=>{S=await startServer();});
after(async()=>{await S.close();});

test("Ohne gesetzte PIN lehnt der Server jede Admin-Aktion ab",async()=>{
  assert.equal((await adm("/verify")).status,403);
  assert.equal((await adm("/verify")).json.error,"no_pin");
  assert.equal((await putGlobalPin(S.base,PIN)).status,200);
});

test("Falsche PIN: jede Admin-Route wird abgelehnt, nichts verändert sich",async()=>{
  await makeProfile(S.base,"k-emil0001","Emil",50);
  const before=fs.readFileSync(pfile("k-emil0001"),"utf8");
  const settingsBefore=fs.readFileSync(path.join(S.dataDir,"settings.json"),"utf8");
  for(const [url,body] of [["/verify",{}],["/backups",{}],["/devices",{}],["/profiles/k-emil0001/delete",{}],["/profiles/k-emil0001/reset",{}],
    ["/restore",{key:"trash:k-emil0001-20260101-000000.json"}],["/pin",{newPin:"9999"}],["/devices/g-abc12345/rename",{name:"x"}]]){
    for(const bad of ["0000",null,1234]){
      const r=await adm(url,body,bad);
      assert.equal(r.status,403,url+" mit PIN "+bad);assert.equal(r.json.error,"bad_pin");
    }
    assert.equal((await api(S.base,"POST","/api/admin"+url,body)).status,403,url+" ohne PIN"); // fehlt ganz
    assert.equal((await adm("/verify")).status,200); // Erfolg setzt den Zähler der Fehlversuche zurück
  }
  assert.equal(fs.readFileSync(pfile("k-emil0001"),"utf8"),before);
  assert.equal(fs.readFileSync(path.join(S.dataDir,"settings.json"),"utf8"),settingsBefore);
  assert.equal(fs.existsSync(path.join(S.dataDir,"trash"))?fs.readdirSync(path.join(S.dataDir,"trash")).length:0,0);
  // richtige PIN danach weiterhin möglich (Zähler wird durch Erfolg zurückgesetzt)
  assert.equal((await adm("/verify")).status,200);
});

test("Nur GET/andere Methoden und unbekannte Admin-Routen",async()=>{
  assert.equal((await api(S.base,"GET","/api/admin/backups")).status,405);
  assert.equal((await adm("/gibtsnicht")).status,404);
  assert.equal((await adm("/profiles/..%2Fx/delete")).status,400);
  assert.equal((await adm("/profiles/k-nichtda01/delete")).status,404);
});

test("Löschen verschiebt in den Papierkorb, Wiederherstellen bringt das Konto zurück",async()=>{
  await makeProfile(S.base,"k-kind0002","Mia",70);
  const before=readJson(pfile("k-kind0002"));
  const del=await adm("/profiles/k-kind0002/delete");
  assert.equal(del.status,200);assert.match(del.json.trash,/^trash:k-kind0002-\d{8}-\d{6}\.json$/);
  assert.equal(fs.existsSync(pfile("k-kind0002")),false);
  const tfile=path.join(S.dataDir,"trash",del.json.trash.slice(6));
  assert.deepEqual(readJson(tfile),before);                           // nie hart gelöscht: Inhalt liegt vollständig im Papierkorb
  assert.equal((await api(S.base,"GET","/api/profiles")).json.profiles.some(p=>p.id==="k-kind0002"),false);
  // Geräte erfahren es: 410 statt 404, und das Konto kann nicht stillschweigend neu entstehen
  assert.equal((await api(S.base,"GET","/api/profiles/k-kind0002/state")).status,410);
  assert.equal((await api(S.base,"PUT","/api/profiles/k-kind0002/state",{baseRev:1,device:"x",state:before.state})).status,410);
  assert.equal((await api(S.base,"POST","/api/profiles",{id:"k-kind0002",name:"Mia"})).status,409);
  assert.equal((await adm("/profiles/k-kind0002/delete")).status,404);
  // Liste zeigt den Papierkorb
  const list=(await adm("/backups")).json.backups;
  const t=list.find(b=>b.kind==="trash"&&b.profileId==="k-kind0002");
  assert.ok(t&&t.size>0&&t.profileName==="Mia"&&t.key===del.json.trash&&/^\d{4}-\d{2}-\d{2}T/.test(t.date));
  // Wiederherstellen
  const back=await adm("/restore",{key:del.json.trash});
  assert.equal(back.status,200);assert.deepEqual(readJson(pfile("k-kind0002")),before);
  assert.equal((await api(S.base,"GET","/api/profiles/k-kind0002/state")).status,200);
  assert.equal((await adm("/restore",{key:del.json.trash})).status,404);   // Eintrag ist verbraucht
  assert.equal((await adm("/backups")).json.backups.some(b=>b.kind==="trash"),false);
});

test("Wiederherstellen aus dem Papierkorb überschreibt nie ein vorhandenes Konto",async()=>{
  await makeProfile(S.base,"k-dopp0003","Doppelt",5);
  const del=await adm("/profiles/k-dopp0003/delete");
  await api(S.base,"POST","/api/profiles",{id:"k-dopp0003",name:"Neu"}).then(r=>assert.equal(r.status,409));
  // von Hand ein Konto mit derselben ID (wie durch eine Sicherung) anlegen
  fs.writeFileSync(pfile("k-dopp0003"),JSON.stringify({id:"k-dopp0003",name:"Andere",rev:1,state:null}));
  const r=await adm("/restore",{key:del.json.trash});
  assert.equal(r.status,409);assert.equal(readJson(pfile("k-dopp0003")).name,"Andere");
  fs.unlinkSync(pfile("k-dopp0003"));
  assert.equal((await adm("/restore",{key:del.json.trash})).status,200);
});

test("Wiederherstellen aus Sicherung: vorher Sicherung des aktuellen Stands, alle Geräte übernehmen den Stand",async()=>{
  const id="k-back0004";
  const old=await makeProfile(S.base,id,"Ben",10);
  // späterer Stand
  const cur=readJson(pfile(id));
  const s2=JSON.parse(JSON.stringify(cur.state));applyAnswer(s2,{deviceId:"d1",now:3000},{topic:"m_read",ok:true,gain:500,li:0,trial:false});s2.meta.deviceId="d1";
  assert.equal((await api(S.base,"PUT",`/api/profiles/${id}/state`,{baseRev:1,device:"d1",state:s2})).status,200);
  const newer=readJson(pfile(id));assert.equal(total(newer.state,"points"),510);
  // Sicherung vor einem Update mit dem alten Stand (10 Punkte), von Hand abgelegt wie deploy.sh es tut
  const dir=path.join(S.dataDir,"backups","pre-deploy-20260101-1200","profiles");fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,id+".json"),JSON.stringify({id,name:"Ben",rev:1,schemaVersion:2,state:old}));
  const list=(await adm("/backups")).json.backups;
  const dep=list.find(b=>b.kind==="pre-deploy"&&b.name==="pre-deploy-20260101-1200");
  assert.ok(dep&&dep.size>0&&dep.date.startsWith("2026-01-01")&&dep.items.some(i=>i.profileId===id&&i.profileName==="Ben"));
  const daily=list.find(b=>b.kind==="daily"&&b.profileId===id);assert.ok(daily&&daily.size>0);
  const key=dep.items.find(i=>i.profileId===id).key;
  // Falsche PIN: nichts passiert
  assert.equal((await adm("/restore",{key},"0000")).status,403);assert.equal(total(readJson(pfile(id)).state,"points"),510);
  const r=await adm("/restore",{key});
  assert.equal(r.status,200);assert.match(r.json.safety,/^profile-k-back0004-\d{8}-\d{6}-vor-wiederherstellen\.json$/);
  // Stand ist der alte, Revision steigt, resetAt gesetzt (alle Geräte übernehmen ihn vollständig)
  const now=readJson(pfile(id));
  assert.equal(total(now.state,"points"),10);assert.equal(now.rev,newer.rev+1);assert.equal(now.state.meta.rev,now.rev);
  assert.ok(now.state.meta.resetAt>0&&now.state.meta.resetAt===now.state.meta.updatedAt);
  // Sicherung des aktuellen Stands (510 Punkte) liegt bereit und ist selbst wiederherstellbar
  const safety=readJson(path.join(S.dataDir,"backups","manual",r.json.safety));
  assert.equal(total(safety.state,"points"),510);
  const man=(await adm("/backups")).json.backups.find(b=>b.kind==="manual");
  assert.ok(man&&man.note==="vor-wiederherstellen"&&man.profileName==="Ben");
  assert.equal((await adm("/restore",{key:man.key})).status,200);
  assert.equal(total(readJson(pfile(id)).state,"points"),510);
  // Ein Gerät mit dem neueren, lokal noch ungesendeten Stand übernimmt die Wiederherstellung
  const dev=makeDevice(S.base,"g-geraet001");
  const rec={id,state:JSON.parse(JSON.stringify(newer.state)),baseRev:newer.rev,dirty:true};
  rec.state.meta.deviceId="g-geraet001";
  const res=await dev.sync.syncProfile(rec);
  assert.equal(res.ok,true);assert.equal(total(rec.state,"points"),510);
});

test("Wiederherstellen: nur bekannte Schlüssel, keine freien Pfade",async()=>{
  for(const key of ["daily:../../settings.json","pre:pre-deploy-20260101-1200:../../x","pre:../x:k-back0004","manual:../../x","trash:../x.json","daily:profile-k-nix00001-2020-01-01.json",42,undefined,"","x:y"]){
    const r=await adm("/restore",{key});assert.equal(r.status,404,String(key));
  }
});

test("Zurücksetzen: Server sichert vorher, leert den Stand, Aussehen und Einstellungen bleiben, Geräte übernehmen",async()=>{
  const id="k-rese0005";
  const st=await makeProfile(S.base,id,"Lea",40,s=>{applyAvatar(s,{deviceId:"d1",now:2500},{hair:3});applySettings(s,{deviceId:"d1",now:2600},{perRound:10});
    applyRoundEnd(s,{deviceId:"d1",now:2700},{li:0,mode:"mix",trial:false,c:8,n:8,pts:100,bonus:50});});
  const before=readJson(pfile(id));assert.ok(total(before.state,"points")>=90);
  assert.equal((await adm("/profiles/"+id+"/reset",{},"9999")).status,403);
  assert.equal(readJson(pfile(id)).rev,before.rev);
  const r=await adm("/profiles/"+id+"/reset");
  assert.equal(r.status,200);
  const after=readJson(pfile(id));
  assert.equal(total(after.state,"points"),0);assert.equal(after.state.history.length,0);assert.ok(after.state.meta.resetAt>0);
  assert.equal(after.rev,before.rev+1);assert.equal(after.state.meta.rev,after.rev);
  assert.equal(after.state.profile.name,"Lea");assert.equal(after.state.profile.avatar.hair,"locken");assert.equal(after.state.settings.perRound,10);
  assert.equal(after.name,"Lea");
  const saved=readJson(path.join(S.dataDir,"backups","manual",r.json.safety));
  assert.deepEqual(saved,before);                                          // Sicherung vor dem Zurücksetzen ist der alte Stand
  // Gerät mit dem alten Stand: der Reset gewinnt beim Zusammenführen, auch gegen ungesendete Spiele
  const dev=makeDevice(S.base,"g-geraet002");
  const rec={id,state:JSON.parse(JSON.stringify(st)),baseRev:before.rev,dirty:true};
  rec.state.meta.deviceId="g-geraet002";
  assert.equal((await dev.sync.syncProfile(rec)).ok,true);
  assert.equal(total(rec.state,"points"),0);
  // Konto ohne Stand: nichts zu tun
  await api(S.base,"POST","/api/profiles",{id:"k-leer0006",name:"Leer"});
  assert.equal((await adm("/profiles/k-leer0006/reset")).status,409);
});

test("Sicherungsliste: Tagessicherung, Update-Sicherung, Papierkorb mit Datum und Größe",async()=>{
  const list=(await adm("/backups")).json.backups;
  const kinds=new Set(list.map(b=>b.kind));
  for(const k of ["daily","daily-settings","pre-deploy","manual"])assert.ok(kinds.has(k),k);
  for(const b of list){assert.ok(b.size>0,b.kind);assert.ok(!isNaN(Date.parse(b.date)),b.kind+" "+b.date);}
  // neueste zuerst
  const dates=list.map(b=>b.date);assert.deepEqual(dates,[...dates].sort().reverse());
});

test("PIN ändern: alte PIN nötig, danach gilt nur die neue, Geräte übernehmen sie",async()=>{
  const g0=readJson(path.join(S.dataDir,"settings.json"));
  assert.equal((await adm("/pin",{newPin:"4321"},"0000")).status,403);
  assert.equal((await adm("/pin",{newPin:"12"})).status,400);
  assert.equal((await adm("/pin",{newPin:"abcd"})).status,400);
  assert.equal(readJson(path.join(S.dataDir,"settings.json")).rev,g0.rev);
  const r=await adm("/pin",{newPin:"4321"});
  assert.equal(r.status,200);
  const g1=readJson(path.join(S.dataDir,"settings.json"));
  assert.equal(g1.rev,g0.rev+1);assert.ok(g1.settings.pin.t>g0.settings.pin.t);assert.notEqual(g1.settings.pin.hash,g0.settings.pin.hash);
  assert.equal((await checkPin("4321",g1.settings.pin)).ok,true);assert.equal((await checkPin("1234",g1.settings.pin)).ok,false);  // gleiches Verfahren wie in der App
  assert.equal((await adm("/verify",{},"1234")).status,403);
  assert.equal((await adm("/verify",{},"4321")).status,200);
  // zurück auf 1234 für die weiteren Tests
  assert.equal((await adm("/pin",{newPin:"1234"},"4321")).status,200);
  assert.equal((await adm("/verify")).status,200);
});

test("Zu viele falsche PINs: kurze Sperre, auch die richtige PIN wird dann nicht angenommen",async()=>{
  const T=await startServer();
  try{
    await putGlobalPin(T.base,"1234");
    const call=(pin)=>api(T.base,"POST","/api/admin/verify",{pin});
    for(let i=0;i<4;i++)assert.equal((await call("0000")).status,403);
    assert.equal((await call("1234")).status,200);                   // Erfolg setzt den Zähler zurück
    for(let i=0;i<5;i++)assert.equal((await call("0000")).status,403);
    const locked=await call("1234");
    assert.equal(locked.status,429);assert.ok(locked.json.retryAfter>0&&locked.json.retryAfter<=60);
  }finally{await T.close();}
});

test("Geräteliste: Server führt Kennung, Art und zuletzt gesehen, Name änderbar (mit PIN)",async()=>{
  const ipad={"X-Device":"g-ipad00001","User-Agent":"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) Safari"};
  const iphone={"X-Device":"g-iphone002","User-Agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari"};
  await api(S.base,"GET","/api/profiles",undefined,ipad);
  await api(S.base,"GET","/api/settings",undefined,iphone);
  await api(S.base,"GET","/api/settings",undefined,{"X-Device":"../../etc","User-Agent":"x"});   // ungültige Kennung wird ignoriert
  const list=(await adm("/devices")).json.devices;
  const a=list.find(d=>d.id==="g-ipad00001"),b=list.find(d=>d.id==="g-iphone002");
  assert.ok(a&&b);assert.equal(a.kind,"iPad");assert.equal(b.kind,"iPhone");assert.equal(a.name,"");
  assert.ok(!isNaN(Date.parse(a.lastSeen))&&!isNaN(Date.parse(a.firstSeen)));
  assert.equal(list.some(d=>d.id.includes("..")),false);
  assert.equal((await adm("/devices/g-ipad00001/rename",{name:"Emils iPad"},"0000")).status,403);
  assert.equal((await adm("/devices/g-ipad00001/rename",{name:"Emils iPad"})).status,200);
  assert.equal((await adm("/devices/g-nichtda01/rename",{name:"x"})).status,404);
  assert.equal((await adm("/devices")).json.devices.find(d=>d.id==="g-ipad00001").name,"Emils iPad");
  // ein Schreibzugriff (PUT) vermerkt zusätzlich den letzten Abgleich mit Senden
  await api(S.base,"PUT","/api/settings",{baseRev:999,device:"x",settings:newGlobal()},ipad);
  assert.ok((await adm("/devices")).json.devices.find(d=>d.id==="g-ipad00001").lastPush);
  // Geräteliste liegt in data/devices.json und überlebt einen Neustart
  assert.ok(readJson(path.join(S.dataDir,"devices.json")).devices["g-ipad00001"]);
});

test("/api/config nennt Server- und Schemaversion",async()=>{
  const c=(await api(S.base,"GET","/api/config")).json;
  assert.equal(c.schemaVersion,4);assert.equal(c.globalSchemaVersion,3);assert.match(c.serverVersion,/^\d+\.\d+\.\d+$/);
});
