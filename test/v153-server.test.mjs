// Version 1.5.3: Server und Abgleich (gleichzeitiges Speichern, Mindeststruktur, PIN-Schutz).
import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import {startServer,api,makeDevice} from "./helpers.mjs";
import {newProfile,newGlobal,migrateProfile,migrateGlobal,checkProfileState,checkGlobalState} from "../app/js/model.js";
import {makePin,checkPin} from "../app/js/pin.js";

const fixture=n=>JSON.parse(fs.readFileSync(new URL("./fixtures/"+n,import.meta.url),"utf8"));
const full=(id,name,pts=0)=>{const s=newProfile({id,name,deviceId:"d1"});s.progress.dev.d1={points:pts,rounds:0,wins:0,stickers:0};return s;};
const without=(id,fn)=>{const s=full(id,"X");fn(s);return s;};

// ---------- 3. Gleichzeitiges Speichern ----------
// Ein langsamer Schreiber: Kopf und erste Hälfte des Inhalts gehen sofort raus, der Rest erst auf Zuruf.
// Genau so entsteht der Wettlauf (der Server hat den Stand schon gelesen, während der Inhalt noch unterwegs ist).
function slowPut(base,url,payload){
  const data=Buffer.from(JSON.stringify(payload)),u=new URL(base+url);
  let finish;const done=new Promise((resolve,reject)=>{
    const req=http.request({host:u.hostname,port:u.port,path:u.pathname,method:"PUT",headers:{"Content-Type":"application/json","Content-Length":data.length}},res=>{
      const ch=[];res.on("data",c=>ch.push(c));res.on("end",()=>resolve({status:res.statusCode,json:JSON.parse(Buffer.concat(ch).toString("utf8"))}));});
    req.on("error",reject);
    req.write(data.subarray(0,Math.floor(data.length/2)));
    finish=()=>req.end(data.subarray(Math.floor(data.length/2)));
  });
  return{done,finish};
}
const pause=ms=>new Promise(r=>setTimeout(r,ms));

test("Gleichzeitiges Speichern: Schreiber A liegt vor B, aber A schließt zuletzt ab, A bekommt 409 statt zweitem Erfolg",async()=>{
  const S=await startServer();
  try{
    await api(S.base,"POST","/api/profiles",{id:"k-slow0001",name:"Emil"});
    const a=slowPut(S.base,"/api/profiles/k-slow0001/state",{baseRev:0,device:"d1",state:full("k-slow0001","Emil",10)});
    await pause(80); // der Server hat A begonnen
    const b=await api(S.base,"PUT","/api/profiles/k-slow0001/state",{baseRev:0,device:"d2",state:full("k-slow0001","Emil",20)});
    assert.equal(b.status,200,"B ist fertig");
    a.finish();const ra=await a.done;
    assert.equal(ra.status,409,"A hat dieselbe baseRev wie B und darf nicht auch gewinnen");assert.equal(ra.json.reason,"rev");
    const stored=(await api(S.base,"GET","/api/profiles/k-slow0001/state")).json;
    assert.equal(stored.rev,1);assert.equal(stored.state.progress.dev.d1.points,20,"der Stand von B bleibt erhalten");
  }finally{await S.close();}
});

test("Gleichzeitiges Speichern der Einstellungen: langsamer Schreiber bekommt 409",async()=>{
  const S=await startServer();
  try{
    const g1=newGlobal(),g2=newGlobal();g1.updatedAt=1;g2.updatedAt=2;
    const a=slowPut(S.base,"/api/settings",{baseRev:0,device:"d1",settings:g1});
    await pause(80);
    assert.equal((await api(S.base,"PUT","/api/settings",{baseRev:0,device:"d2",settings:g2})).status,200);
    a.finish();assert.equal((await a.done).status,409);
    assert.equal((await api(S.base,"GET","/api/settings")).json.settings.updatedAt,2);
  }finally{await S.close();}
});

test("Gleichzeitiges Speichern: zwei PUTs mit gleicher baseRev, genau einer gewinnt, der andere bekommt 409",async()=>{
  const S=await startServer();
  try{
    for(let round=0;round<15;round++){
      const id="k-race"+String(round).padStart(4,"0");
      assert.equal((await api(S.base,"POST","/api/profiles",{id,name:"Emil"})).status,201);
      const put=(dev,pts)=>api(S.base,"PUT",`/api/profiles/${id}/state`,{baseRev:0,device:dev,state:full(id,"Emil",pts)});
      const [a,b]=await Promise.all([put("d1",10),put("d2",20)]);
      assert.deepEqual([a.status,b.status].sort(),[200,409],"Runde "+round+": genau ein Erfolg");
      const loser=a.status===409?a:b;
      assert.equal(loser.json.reason,"rev");
      const stored=(await api(S.base,"GET",`/api/profiles/${id}/state`)).json;
      assert.equal(stored.rev,1,"nur eine Revision vergeben");
      assert.equal(stored.state.progress.dev.d1.points,a.status===200?10:20,"der Stand des Gewinners liegt auf dem Server");
    }
  }finally{await S.close();}
});

test("Gleichzeitiges Speichern: der Verlierer führt zusammen, beide Zuwächse bleiben erhalten",async()=>{
  const S=await startServer();
  try{
    await api(S.base,"POST","/api/profiles",{id:"k-merge001",name:"Emil"});
    const A=makeDevice(S.base,"g-aaaa1111"),B=makeDevice(S.base,"g-bbbb2222");
    const mk=dev=>{const s=full("k-merge001","Emil");s.meta.deviceId=dev.deviceId;return{id:"k-merge001",state:s,baseRev:null,dirty:true,lastSync:null};};
    const ra=mk(A),rb=mk(B);
    ra.state.progress.dev={"g-aaaa1111":{points:100,rounds:1,wins:0,stickers:0}};
    rb.state.progress.dev={"g-bbbb2222":{points:50,rounds:1,wins:0,stickers:0}};
    const [x,y]=await Promise.all([A.sync.syncProfile(ra),B.sync.syncProfile(rb)]);
    assert.ok(x.ok&&y.ok);
    await A.sync.syncProfile(ra);await B.sync.syncProfile(rb);
    for(const r of [ra,rb]){
      assert.equal(r.state.progress.dev["g-aaaa1111"].points,100);
      assert.equal(r.state.progress.dev["g-bbbb2222"].points,50);
    }
    const srv=(await api(S.base,"GET","/api/profiles/k-merge001/state")).json.state;
    assert.equal(srv.progress.dev["g-aaaa1111"].points,100);assert.equal(srv.progress.dev["g-bbbb2222"].points,50);
  }finally{await S.close();}
});

test("Gleichzeitiges Speichern der Einstellungen: genau ein Erfolg",async()=>{
  const S=await startServer();
  try{
    const g1=newGlobal(),g2=newGlobal();g1.updatedAt=1;g2.updatedAt=2;
    const [a,b]=await Promise.all([api(S.base,"PUT","/api/settings",{baseRev:0,device:"d1",settings:g1}),api(S.base,"PUT","/api/settings",{baseRev:0,device:"d2",settings:g2})]);
    assert.deepEqual([a.status,b.status].sort(),[200,409]);
    assert.equal((await api(S.base,"GET","/api/settings")).json.rev,1);
  }finally{await S.close();}
});

// ---------- 4. Mindeststruktur ----------
test("Mindeststruktur: unvollständige Stände werden mit 400 abgelehnt, der gespeicherte Stand bleibt",async()=>{
  const S=await startServer();
  try{
    await api(S.base,"POST","/api/profiles",{id:"k-struct01",name:"Emil"});
    assert.equal((await api(S.base,"PUT","/api/profiles/k-struct01/state",{baseRev:0,device:"d1",state:full("k-struct01","Emil",7)})).status,200);
    const bad={
      "nur meta":{meta:{schemaVersion:6}},
      "ohne progress":without("k-struct01",s=>{delete s.progress;}),
      "progress ist Liste":without("k-struct01",s=>{s.progress=[];}),
      "ohne progress.dev":without("k-struct01",s=>{delete s.progress.dev;}),
      "ohne progress.lg":without("k-struct01",s=>{delete s.progress.lg;}),
      "ohne stats":without("k-struct01",s=>{delete s.stats;}),
      "history keine Liste":without("k-struct01",s=>{s.history={};}),
      "ohne settings":without("k-struct01",s=>{delete s.settings;}),
      "ohne profile":without("k-struct01",s=>{delete s.profile;}),
      "ohne Namen":without("k-struct01",s=>{delete s.profile.name;}),
      "ohne updatedAt":without("k-struct01",s=>{delete s.meta.updatedAt;})
    };
    for(const [what,state] of Object.entries(bad)){
      const r=await api(S.base,"PUT","/api/profiles/k-struct01/state",{baseRev:1,device:"d1",state});
      assert.equal(r.status,400,what+": abgelehnt");assert.equal(r.json.error,"bad_state");
    }
    const g=(await api(S.base,"GET","/api/profiles/k-struct01/state")).json;
    assert.equal(g.rev,1,"keine neue Revision");assert.equal(g.state.progress.dev.d1.points,7,"alter Stand erhalten");
    for(const settings of [{pin:null},{schemaVersion:4,pin:{algo:"sha256-salt",hash:"x"}},{schemaVersion:4,trainer:"x"}]){
      assert.equal((await api(S.base,"PUT","/api/settings",{baseRev:0,device:"d1",settings})).status,400);
    }
  }finally{await S.close();}
});

test("Mindeststruktur: vollständige Stände aller bisherigen Formate (bis 1.5.2) werden angenommen, Zusatzfelder bleiben",async()=>{
  const S=await startServer();
  try{
    for(const [i,f] of ["state-v1.json","state-v2.json","state-v3.json","state-v4.json","state-v5.json"].entries()){
      const id="k-fixture"+i;
      await api(S.base,"POST","/api/profiles",{id,name:"Emil"});
      const st=migrateProfile(fixture(f),{id});
      st.zusatzFeld={bleibt:true};
      assert.equal(checkProfileState(st),null,f+": Mindeststruktur");
      const r=await api(S.base,"PUT",`/api/profiles/${id}/state`,{baseRev:0,device:"d1",state:st});
      assert.equal(r.status,200,f+": angenommen");
      assert.deepEqual((await api(S.base,"GET",`/api/profiles/${id}/state`)).json.state.zusatzFeld,{bleibt:true},"unbekanntes Feld bleibt");
    }
    // auch die Rohform der Fixtures (ohne Migration) erfüllt die Mindeststruktur
    for(const f of ["state-v2.json","state-v3.json","state-v4.json","state-v5.json"])assert.equal(checkProfileState(fixture(f)),null,f+" roh");
    for(const f of ["global-v2.json","global-v3.json"])assert.equal(checkGlobalState(migrateGlobal(fixture(f))),null);
  }finally{await S.close();}
});

test("App sendet nie einen unvollständigen Stand (der Abgleich bricht vor dem Senden ab)",async()=>{
  const S=await startServer();
  try{
    await api(S.base,"POST","/api/profiles",{id:"k-client01",name:"Emil"});
    const D=makeDevice(S.base,"g-cccc3333");
    const rec={id:"k-client01",state:without("k-client01",s=>{delete s.progress;}),baseRev:0,dirty:true,lastSync:null};
    const r=await D.sync.syncProfile(rec);
    assert.deepEqual([r.ok,r.reason],[false,"invalid"]);
    assert.equal((await api(S.base,"GET","/api/profiles/k-client01/state")).json.state,null,"nichts gesendet");
  }finally{await S.close();}
});

// ---------- 7. PIN-Schutz ----------
test("PIN: ein Settings-PUT mit anderer PIN ändert sie nicht, die erste PIN wird angenommen",async()=>{
  const S=await startServer();
  try{
    const g=newGlobal();g.pin=await makePin("1234",1000);
    assert.equal((await api(S.base,"PUT","/api/settings",{baseRev:0,device:"d1",settings:g})).status,200,"erste PIN");
    const evil=newGlobal();evil.pin=await makePin("9999",5000);evil.updatedAt=9000;
    assert.equal((await api(S.base,"PUT","/api/settings",{baseRev:1,device:"d2",settings:evil})).status,200,"der Abgleich selbst klappt");
    assert.deepEqual((await api(S.base,"GET","/api/settings")).json.settings.pin,g.pin,"PIN unverändert");
    assert.equal((await api(S.base,"POST","/api/admin/verify",{pin:"9999"})).status,403,"die untergeschobene PIN gilt nicht");
    assert.equal((await api(S.base,"POST","/api/admin/verify",{pin:"1234"})).status,200);
    const none=newGlobal();none.pin=null;
    await api(S.base,"PUT","/api/settings",{baseRev:2,device:"d2",settings:none});
    assert.deepEqual((await api(S.base,"GET","/api/settings")).json.settings.pin,g.pin,"auch Entfernen geht nicht");
  }finally{await S.close();}
});

test("PIN: Änderung nur mit richtiger alter PIN, danach kommt die neue PIN auf allen Geräten an",async()=>{
  const S=await startServer();
  try{
    const A=makeDevice(S.base,"g-aaaa1111"),B=makeDevice(S.base,"g-bbbb2222");
    const ra={id:"global",state:newGlobal(1000),baseRev:null,dirty:true,lastSync:null};
    ra.state.pin=await makePin("1234",1000);
    assert.ok((await A.sync.syncGlobal(ra)).ok);
    const rb={id:"global",state:newGlobal(1000),baseRev:null,dirty:true,lastSync:null};
    assert.ok((await B.sync.syncGlobal(rb)).ok);
    assert.equal(rb.state.pin.hash,ra.state.pin.hash,"Gerät B übernimmt die PIN des Servers");
    assert.equal((await api(S.base,"POST","/api/admin/pin",{pin:"0000",newPin:"5555"})).status,403);
    assert.equal((await api(S.base,"POST","/api/admin/verify",{pin:"5555"})).status,403);
    assert.equal((await api(S.base,"POST","/api/admin/pin",{pin:"1234",newPin:"5555"})).status,200);
    assert.equal((await api(S.base,"POST","/api/admin/verify",{pin:"5555"})).status,200);
    assert.equal((await api(S.base,"POST","/api/admin/verify",{pin:"1234"})).status,403);
    assert.ok((await A.sync.syncGlobal(ra)).ok);assert.ok((await B.sync.syncGlobal(rb)).ok);
    for(const r of [ra,rb]){assert.equal((await checkPin("5555",r.state.pin)).ok,true);assert.equal((await checkPin("1234",r.state.pin)).ok,false);}
  }finally{await S.close();}
});

test("PIN: ein Gerät mit eigener, neuerer PIN überschreibt die PIN des Servers nicht, der Abgleich beruhigt sich",async()=>{
  const S=await startServer();
  try{
    const A=makeDevice(S.base,"g-aaaa1111"),B=makeDevice(S.base,"g-bbbb2222");
    const ra={id:"global",state:newGlobal(1000),baseRev:null,dirty:true,lastSync:null};ra.state.pin=await makePin("1234",1000);
    await A.sync.syncGlobal(ra);
    const rb={id:"global",state:newGlobal(1000),baseRev:null,dirty:true,lastSync:null};await B.sync.syncGlobal(rb);
    rb.state.pin=await makePin("7777",99999);rb.state.updatedAt=99999;rb.dirty=true;
    assert.ok((await B.sync.syncGlobal(rb)).ok);
    assert.equal(rb.state.pin.hash,ra.state.pin.hash,"B hat wieder die PIN des Servers");
    assert.equal((await api(S.base,"POST","/api/admin/verify",{pin:"1234"})).status,200);
    await A.sync.syncGlobal(ra);await B.sync.syncGlobal(rb);
    const rev=(await api(S.base,"GET","/api/settings")).json.rev;
    await A.sync.syncGlobal(ra);await B.sync.syncGlobal(rb);
    assert.equal((await api(S.base,"GET","/api/settings")).json.rev,rev,"keine ständig neuen Revisionen");
  }finally{await S.close();}
});

test("PIN: der Alt-Hash des Prototyps wird beim ersten richtigen Eingeben vom Server aufgewertet",async()=>{
  const S=await startServer();
  try{
    const djb2=p=>{let h=5381;const s="torjaeger:"+p;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))>>>0;return "h"+h.toString(36);};
    const g=newGlobal();g.pin={algo:"legacy-djb2",hash:djb2("4321"),t:0};
    await api(S.base,"PUT","/api/settings",{baseRev:0,device:"d1",settings:g});
    assert.equal((await api(S.base,"POST","/api/admin/verify",{pin:"4321"})).status,200);
    assert.equal((await api(S.base,"GET","/api/settings")).json.settings.pin.algo,"sha256-salt");
    assert.equal((await api(S.base,"POST","/api/admin/verify",{pin:"4321"})).status,200,"gilt weiter");
    assert.equal((await api(S.base,"POST","/api/admin/verify",{pin:"1111"})).status,403);
  }finally{await S.close();}
});
