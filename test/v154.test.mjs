// Version 1.5.4: Trainingslager "Teilen mit Rest" (Schema 7, Generatoren je Einheit, Regeln, Zusammenführen, Sichern, Ansichten, Abgleich).
import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {startServer,api,makeDevice} from "./helpers.mjs";
import {migrateProfile,newProfile,checkProfileState,SCHEMA_VERSION,UnsupportedSchema,campOf,total} from "../app/js/model.js";
import {CAMPS,campUnit,campHalf,penaltyTasks,wrongNote,halftimeSay,finalSay,penaltyScore,campSnapshot,campResumable,campResume,isPackUnit,HALF_LEN,PEN_LEN} from "../app/js/camp.js";
import {keyOf,probeHTML} from "../app/js/check.js";
import {leaks,rightText} from "../app/js/coach.js";
import {applyCampOn,applyCampUnit,applyCampPen,applyCampReset,applyReset,campOn,unitDone,unitOpen,campNext,campDone,campBadge} from "../app/js/rules.js";
import {mergeProfile,mergeCamps} from "../app/js/merge.js";
import {canon} from "../app/js/util.js";
import {STICKERS} from "../app/js/content.js";
import {sceneSVG,SHOT_TEXT} from "../app/js/avatardraw.js";
import {homeHTML} from "../app/js/views.js";
import {breakHTML,campAdminHTML,campTilesHTML} from "../app/js/campviews.js";
import {defaultTrainer,defaultTrainer2} from "../app/js/avatar.js";

const ROOT=fileURLToPath(new URL("..",import.meta.url));
const fx=n=>JSON.parse(fs.readFileSync(new URL("./fixtures/"+n,import.meta.url),"utf8"));
const ctx=(t,d="d1")=>({deviceId:d,now:t});
const TOP="m3_rest";

// ---------- Datenmodell ----------
test("Schema 7: Migration von 6 nach 7 aus dem Format 1.5.3 verliert nichts",()=>{
  const old=fx("state-v6.json"),copy=JSON.parse(JSON.stringify(old));
  assert.equal(old.meta.schemaVersion,6);assert.equal(checkProfileState(old),null);
  const s=migrateProfile(old);
  assert.deepEqual(old,copy,"die Eingabe bleibt unverändert");
  assert.equal(SCHEMA_VERSION,8);assert.equal(s.meta.schemaVersion,8);assert.deepEqual(s.camps,{});
  const a=JSON.parse(JSON.stringify(s)),b=JSON.parse(JSON.stringify(old));
  delete a.camps;a.meta.schemaVersion=6;
  delete a.settings.topicSeen;assert.deepEqual(a,b,"alles andere ist gleich");
  assert.equal(s.zusatzfeld.bleibt,true);assert.equal(s.profile.pin.code,"4711");
  assert.equal(checkProfileState(s),null);
  for(const f of ["state-v1.json","state-v2.json","state-v3.json","state-v4.json","state-v5.json"]){
    const m=migrateProfile(fx(f));assert.equal(m.meta.schemaVersion,8,f);assert.equal(checkProfileState(m),null,f);
  }
  const neu=newProfile({id:"k-abc12345",name:"X",deviceId:"d"});neu.meta.schemaVersion=9;
  assert.throws(()=>migrateProfile(neu),UnsupportedSchema);
});
test("Mindeststruktur: mit und ohne Trainingslager, unbekannte Felder erlaubt",()=>{
  const s=migrateProfile(fx("state-v6.json"));
  assert.equal(checkProfileState(s),null,"mit leerem camps");
  delete s.camps;assert.equal(checkProfileState(s),null,"ohne camps (alte App, Schema 6)");
  s.camps={m3_rest:{on:true,t:1,rs:0,units:{"1":{h1:{c:1,n:2},h2:{c:1,n:2},t:2,runs:1}},badge:0,neu:"ok"},m3_andere:{on:false}};
  assert.equal(checkProfileState(s),null,"mit Fortschritt und Zusatzfeldern");
  for(const bad of [5,[],"x"]){s.camps=bad;assert.ok(checkProfileState(s),"camps="+JSON.stringify(bad));}
  s.camps={m3_rest:7};assert.ok(checkProfileState(s));
  s.camps={m3_rest:{units:[]}};assert.ok(checkProfileState(s));
  s.camps={m3_rest:{units:{}}};assert.equal(checkProfileState(s),null);
});
test("campOf liefert Vorgaben und verändert den Stand nicht",()=>{
  const s=newProfile({id:"k-abc12345",name:"X",deviceId:"d"}),before=canon(s);
  assert.deepEqual(campOf(s,TOP),{on:false,t:0,rs:0,units:{},badge:0});assert.equal(canon(s),before);
  delete s.camps;assert.equal(campOf(s,TOP).on,false);
});
test("Der Server nimmt Schema 7 mit Trainingslager an und lehnt kaputtes camps ab",async()=>{
  const S=await startServer();
  try{
    await api(S.base,"POST","/api/profiles",{id:"k-camp0001",name:"Emil"});
    const st=migrateProfile(fx("state-v6.json"));st.profile.id="k-camp0001";
    st.camps={m3_rest:{on:true,t:5,rs:0,units:{},badge:0}};
    const ok=await api(S.base,"PUT","/api/profiles/k-camp0001/state",{baseRev:0,device:"d1",state:st});
    assert.equal(ok.status,200);
    const back=(await api(S.base,"GET","/api/profiles/k-camp0001/state")).json;
    assert.equal(back.schemaVersion,8);assert.equal(back.state.camps.m3_rest.on,true);
    const bad=JSON.parse(JSON.stringify(st));bad.camps=5;
    const r=await api(S.base,"PUT","/api/profiles/k-camp0001/state",{baseRev:ok.json.rev,device:"d1",state:bad});
    assert.equal(r.status,400);assert.equal(r.json.error,"bad_state");
  }finally{await S.close();}
});

// ---------- Generatoren je Einheit ----------
const nums=q=>[...String(q).replace(/<[^>]+>/g," ").matchAll(/\d+/g)].map(m=>+m[0]);
const noLeak=(T,label)=>{
  assert.ok(typeof T.hint==="string"&&T.hint.length>10,"kein Tipp: "+label);
  assert.ok(!leaks(T.hint,rightText(T)),`Tipp verrät Lösung: ${label} ${T.hint} -> ${rightText(T)}`);
  assert.ok(!/—|–/.test(T.hint+T.ex+T.q),"Gedankenstrich: "+label);
};
test("Einheit 1: Einmaleins rückwärts und Teilen ohne Rest, Teiler 2 bis 5",()=>{
  const seenB=new Set();
  for(let n=0;n<150;n++)for(const half of [1,2])for(const T of campHalf(TOP,1,half)){
    const [a,b]=nums(T.q).length===2?(T.q.includes("Wie oft")?[nums(T.q)[1],nums(T.q)[0]]:nums(T.q)):[0,0];
    assert.ok(b>=2&&b<=5&&a%b===0&&a<=50,T.q);seenB.add(b);
    assert.equal(T.type,"num");assert.equal(T.a,a/b);assert.ok(T.ex.includes(`${T.a} · ${b} = ${a}`)||T.ex.includes(`${b} · ${T.a} = ${a}`),T.ex);
    noLeak(T,T.q);
  }
  assert.deepEqual([...seenB].sort(),[2,3,4,5]);
});
test("Einheit 2: Rest kleiner als Teiler, Teiler 2 bis 5, bis 50, keine Punktebilder",()=>{
  for(let n=0;n<150;n++)for(const half of [1,2])for(const T of campHalf(TOP,2,half)){
    const [a,b]=nums(T.q),q=Math.floor(a/b),r=a%b;
    assert.ok(b>=2&&b<=5&&a<=50&&a>b,T.q);assert.deepEqual(T.a,[q,r]);assert.ok(r<b);
    assert.ok(!T.vis,"Punktebilder verraten die Lösung");
    assert.ok(T.ex.includes(`${b} · ${q} = ${b*q}`)&&T.ex.includes(`${a} − ${b*q} = ${r}`)||r===0,T.ex);
    assert.ok(probeHTML(T,T.a).includes(`${b} · ${q} + ${r} = ?`),"Probe stimmt");
    noLeak(T,T.q);
  }
});
test("Einheit 3: Teiler 2 bis 9, bis 90, ohne Bilder",()=>{
  const bs=new Set();let maxA=0;
  for(let n=0;n<200;n++)for(const half of [1,2])for(const T of campHalf(TOP,3,half)){
    const [a,b]=nums(T.q);bs.add(b);maxA=Math.max(maxA,a);
    assert.ok(b>=2&&b<=9&&a<=90&&a>b&&!T.vis,T.q);assert.deepEqual(T.a,[Math.floor(a/b),a%b]);assert.ok(T.a[1]<b);noLeak(T,T.q);
  }
  assert.deepEqual([...bs].sort(),[2,3,4,5,6,7,8,9]);assert.ok(maxA>60);
});
test("Einheit 4: zwei Päckchen mit 6 Aufgaben, gleicher Teiler, Probe stimmt",()=>{
  assert.ok(isPackUnit(TOP,4)&&!isPackUnit(TOP,3));
  for(let n=0;n<100;n++)for(const half of [1,2]){
    const P=campHalf(TOP,4,half);assert.equal(P.length,6);
    const bs=new Set(P.map(T=>nums(T.q)[1]));assert.equal(bs.size,1,"gleicher Teiler");
    for(const T of P){
      const [a,b]=nums(T.q);assert.deepEqual(T.a,[Math.floor(a/b),a%b]);assert.ok(T.a[1]<b);
      assert.ok(probeHTML(T,T.a).includes(`${b} · ${T.a[0]} + ${T.a[1]} = ?`));
      assert.ok(T.ex.includes(`${a} − ${b*T.a[0]}`)||T.a[1]===0);
    }
  }
});
test("Einheit 5: Sachaufgaben mit Rest, genau eine Frage, Antwort und Rechenweg stimmen",()=>{
  const kinds=new Set();
  for(let n=0;n<200;n++)for(const half of [1,2])for(const T of campHalf(TOP,5,half)){
    assert.equal(T.topic,"m3_sach");assert.equal(T.type,"num");
    const [x,y]=nums(T.q),a=Math.max(x,y),b=Math.min(x,y),q=Math.floor(a/b),r=a%b;
    assert.equal(nums(T.q).length,2,"genau zwei Zahlen: "+T.q);assert.equal((T.q.match(/\?/g)||[]).length,1,"genau eine Frage");
    assert.ok(r>0&&b>=3&&b<=9&&a<=90);
    const up=/braucht man/.test(T.q),down=/ganz voll|volle/.test(T.q);
    assert.ok(up!==down,"Aufrunden oder Abrunden steht eindeutig im Text: "+T.q);
    assert.equal(T.a,up?q+1:q,T.q);kinds.add(T.q.replace(/\d+/g,"#").split(".")[0]);
    assert.ok(T.ex.includes(`${b} · ${q} = ${b*q}, ${a} − ${b*q} = ${r}`),T.ex);noLeak(T,T.q);
  }
  assert.ok(kinds.size>=5,"Busse, Kabinen, Netze, Mannschaften, Kästen");
});
test("Je Einheit: 10 plus 10 plus 5 Aufgaben, nie dieselbe Frage zweimal",()=>{
  for(const u of [1,2,3,4,5])for(let n=0;n<60;n++){
    const U=campUnit(TOP,u),all=[...U.h1,...U.h2,...U.pen];
    assert.equal(U.h1.length,u===4?6:HALF_LEN);assert.equal(U.h2.length,u===4?6:HALF_LEN);assert.equal(U.pen.length,PEN_LEN);
    assert.equal(new Set(all.map(keyOf)).size,all.length,"Doppelte in Einheit "+u);
    assert.equal(penaltyTasks(TOP,u).length,5);
  }
});
test("Freundliche Rückmeldung, wenn der Rest zu groß ist",()=>{
  const T=campHalf(TOP,3,1)[0],b=T.inv.y;
  assert.ok(wrongNote(T,[T.a[0],b]).includes("Da passt noch einer rein"));
  assert.ok(wrongNote(T,[1,b+2]).includes("Da passt noch einer rein"));
  assert.equal(wrongNote(T,[T.a[0]+1,0]),"");assert.equal(wrongNote({type:"num"},5),"");
  assert.ok(!/—|–/.test(wrongNote(T,[0,b])));
  for(const [c,n] of [[10,10],[7,10],[5,10],[2,10]]){assert.ok(halftimeSay(c,n).length>10&&finalSay(c,n).length>10&&!/—|–/.test(halftimeSay(c,n)+finalSay(c,n)));}
  assert.equal(penaltyScore(4,5),"4 : 1");
});

// ---------- Regeln ----------
test("Einheiten werden nacheinander frei, ohne Mindestquote, und lassen sich wiederholen",()=>{
  const s=newProfile({id:"k-abc12345",name:"X",deviceId:"d1"});
  assert.equal(campOn(s,TOP),false);assert.equal(applyCampOn(s,ctx(1),TOP,true),true);assert.equal(campOn(s,TOP),true);
  assert.equal(applyCampOn(s,ctx(1),"unbekannt",true),false);
  assert.deepEqual([1,2,3,4,5].map(n=>unitOpen(s,TOP,n)),[true,false,false,false,false]);
  applyCampUnit(s,ctx(10),{topic:TOP,unit:1,h1:{c:0,n:10},h2:{c:0,n:10}}); // 0 von 20 reicht
  assert.deepEqual([1,2,3].map(n=>unitOpen(s,TOP,n)),[true,true,false]);assert.equal(campNext(s,TOP),2);
  assert.equal(applyCampUnit(s,ctx(11),{topic:TOP,unit:9,h1:{c:1,n:1},h2:{c:1,n:1}}).badgeNew,false);
  applyCampUnit(s,ctx(12),{topic:TOP,unit:1,h1:{c:9,n:10},h2:{c:8,n:10}}); // wiederholen
  assert.equal(campOf(s,TOP).units["1"].runs,2);assert.equal(campOf(s,TOP).units["1"].h1.c,9);assert.equal(campDone(s,TOP),1);
});
test("Abzeichen und Jubel-Sticker gibt es genau einmal, auch wenn kein Sticker mehr fehlt",()=>{
  const s=newProfile({id:"k-abc12345",name:"X",deviceId:"d1"});
  const run=(n,t)=>applyCampUnit(s,ctx(t),{topic:TOP,unit:n,h1:{c:8,n:10},h2:{c:9,n:10}});
  for(let n=1;n<=4;n++){const r=run(n,n*10);assert.equal(r.badgeNew,false);}
  assert.equal(campBadge(s,TOP),false);
  const r=run(5,60);assert.equal(r.badgeNew,true);assert.equal(r.sticker,0);assert.equal(total(s,"stickers"),1);assert.equal(campBadge(s,TOP),true);
  const again=run(5,70);assert.equal(again.badgeNew,false);assert.equal(again.sticker,null);assert.equal(total(s,"stickers"),1);
  const voll=newProfile({id:"k-abc12345",name:"Y",deviceId:"d1"});voll.progress.dev.d1={points:0,rounds:0,wins:0,stickers:STICKERS.length};
  for(let n=1;n<=5;n++)applyCampUnit(voll,ctx(n),{topic:TOP,unit:n,h1:{c:1,n:2},h2:{c:1,n:2}});
  assert.equal(campBadge(voll,TOP),true);assert.equal(total(voll,"stickers"),STICKERS.length,"kein Sticker über das Album hinaus");
});
test("Elfmeterschießen wird an der Einheit vermerkt, ohne Einheit nicht",()=>{
  const s=newProfile({id:"k-abc12345",name:"X",deviceId:"d1"});
  assert.equal(applyCampPen(s,ctx(5),{topic:TOP,unit:1,c:4,n:5}),false);
  applyCampUnit(s,ctx(6),{topic:TOP,unit:1,h1:{c:5,n:10},h2:{c:6,n:10}});
  assert.equal(applyCampPen(s,ctx(7),{topic:TOP,unit:1,c:4,n:5}),true);
  assert.deepEqual(campOf(s,TOP).units["1"].pen,{c:4,n:5});
});
test("Neu starten löscht Einheiten und Abzeichen, der Schalter bleibt; Zurücksetzen des Kontos behält den Schalter",()=>{
  const s=newProfile({id:"k-abc12345",name:"X",deviceId:"d1"});
  applyCampOn(s,ctx(1),TOP,true);
  for(let n=1;n<=5;n++)applyCampUnit(s,ctx(10+n),{topic:TOP,unit:n,h1:{c:5,n:10},h2:{c:5,n:10}});
  assert.equal(applyCampReset(s,ctx(100),TOP),true);
  const c=campOf(s,TOP);assert.deepEqual(c.units,{});assert.equal(c.badge,0);assert.equal(c.on,true);assert.equal(c.rs,100);
  assert.equal(unitOpen(s,TOP,2),false);assert.equal(applyCampReset(s,ctx(100),"nix"),false);
  for(let n=1;n<=2;n++)applyCampUnit(s,ctx(200+n),{topic:TOP,unit:n,h1:{c:5,n:10},h2:{c:5,n:10}});
  const fresh=applyReset(s,ctx(300));
  assert.equal(campOf(fresh,TOP).on,true);assert.deepEqual(campOf(fresh,TOP).units,{});assert.equal(campOf(fresh,TOP).rs,300);
});

// ---------- Zusammenführen und Abgleich ----------
const unit=(c,t,runs=1)=>({h1:{c,n:10},h2:{c,n:10},t,runs});
test("Zusammenführen: Einheiten beider Geräte, neuerer Schalter, Neustart gewinnt, unabhängig von der Reihenfolge",()=>{
  const A={m3_rest:{on:true,t:5,rs:0,units:{"1":unit(3,10)},badge:0}};
  const B={m3_rest:{on:false,t:9,rs:0,units:{"1":unit(7,20,2),"2":unit(5,21)},badge:0}};
  const m=mergeCamps(A,B);
  assert.equal(canon(m),canon(mergeCamps(B,A)),"Reihenfolge egal");assert.equal(canon(mergeCamps(m,B)),canon(m),"zweites Zusammenführen ändert nichts");
  assert.equal(m.m3_rest.on,false);assert.equal(m.m3_rest.units["1"].h1.c,7);assert.equal(m.m3_rest.units["1"].runs,2);assert.ok(m.m3_rest.units["2"]);
  const R={m3_rest:{on:true,t:9,rs:50,units:{},badge:0}}; // Neustart auf Gerät C
  const m2=mergeCamps(m,R);assert.deepEqual(m2.m3_rest.units,{});assert.equal(m2.m3_rest.rs,50);assert.equal(canon(m2),canon(mergeCamps(R,m)));
  const m3=mergeCamps(R,{m3_rest:{on:true,t:9,rs:50,units:{"1":unit(2,60)},badge:70}});
  assert.ok(m3.m3_rest.units["1"]&&m3.m3_rest.badge===70,"Spiel nach dem Neustart zählt");
  const badge=mergeCamps({m3_rest:{on:true,t:1,rs:0,units:{},badge:30}},{m3_rest:{on:true,t:1,rs:0,units:{},badge:20}});
  assert.equal(badge.m3_rest.badge,20,"früherer Zeitpunkt, wer es hat behält es");
  assert.deepEqual(mergeCamps(undefined,undefined),{});
});
test("mergeProfile: Trainingslager aus beiden Ständen, unbekannte Felder im Trainingslager bleiben",()=>{
  const a=migrateProfile(fx("state-v6.json")),b=migrateProfile(fx("state-v6.json"));
  applyCampOn(a,ctx(a.meta.updatedAt+1),TOP,true);applyCampUnit(a,ctx(a.meta.updatedAt+2),{topic:TOP,unit:1,h1:{c:5,n:10},h2:{c:6,n:10}});
  b.camps={m3_rest:{on:true,t:1,rs:0,units:{},badge:0,extra:"bleibt"}};
  const m=mergeProfile(a,b),m2=mergeProfile(b,a);
  assert.ok(unitDone(m,TOP,1));assert.equal(m.camps.m3_rest.extra,"bleibt");assert.equal(m.meta.schemaVersion,8);
  assert.equal(canon(m.camps),canon(m2.camps));
});
test("Abgleich zwischen zwei Geräten: Fortschritt kommt an, Neustart auch",async()=>{
  const S=await startServer();
  try{
    await api(S.base,"POST","/api/profiles",{id:"k-camp0002",name:"Emil"});
    const A=makeDevice(S.base,"g-aaaa1111"),B=makeDevice(S.base,"g-bbbb2222");
    const mk=dev=>{const s=migrateProfile(fx("state-v6.json"));s.profile.id="k-camp0002";s.meta.deviceId=dev.deviceId;s.meta.rev=0;return{id:"k-camp0002",state:s,baseRev:null,dirty:true,lastSync:null};};
    const ra=mk(A),rb=mk(B);
    const t0=Date.now();
    applyCampOn(ra.state,ctx(t0,A.deviceId),TOP,true);
    applyCampUnit(ra.state,ctx(t0+1,A.deviceId),{topic:TOP,unit:1,h1:{c:7,n:10},h2:{c:8,n:10}});
    applyCampPen(ra.state,ctx(t0+2,A.deviceId),{topic:TOP,unit:1,c:4,n:5});
    assert.ok((await A.sync.syncProfile(ra)).ok);
    for(let i=0;i<3;i++){await B.sync.syncProfile(rb);}
    assert.equal(campOn(rb.state,TOP),true);assert.ok(unitDone(rb.state,TOP,1),"Einheit 1 ist auf dem anderen Gerät da");
    assert.deepEqual(campOf(rb.state,TOP).units["1"].pen,{c:4,n:5});
    applyCampUnit(rb.state,ctx(t0+100,B.deviceId),{topic:TOP,unit:2,h1:{c:9,n:10},h2:{c:9,n:10}});rb.dirty=true;
    await B.sync.syncProfile(rb);await A.sync.syncProfile(ra);
    assert.ok(unitDone(ra.state,TOP,2),"Einheit 2 kommt zurück zu Gerät A");
    applyCampReset(ra.state,ctx(t0+500,A.deviceId),TOP);ra.dirty=true;
    await A.sync.syncProfile(ra);for(let i=0;i<2;i++){await B.sync.syncProfile(rb);await A.sync.syncProfile(ra);}
    assert.deepEqual(campOf(rb.state,TOP).units,{},"Neustart gewinnt auf Gerät B");assert.equal(campOn(rb.state,TOP),true);
    const srv=(await api(S.base,"GET","/api/profiles/k-camp0002/state")).json.state;
    assert.deepEqual(srv.camps.m3_rest.units,{});
  }finally{await S.close();}
});

// ---------- Sichern und Fortsetzen ----------
function gameMid(){
  const sets=campUnit(TOP,2),h1={c:7,n:10,pts:80,res:[true,true,false,true,true,true,false,true,true,false]};
  const G={li:1,mode:"camp",trial:false,topic:TOP,pool:[TOP],rival:"FC Zahlenfuchs",t0:1000,camp:{topic:TOP,unit:2,half:2,halves:[h1],rec:false,brk:false,sets},
    tasks:sets.h2,len:10,i:5,res:[true,false,true,true,true],hist:[],pts:45,streak:0,pack:false,done:false};
  return{G,sets,h1};
}
test("Sichern mitten in der 2. Halbzeit und Fortsetzen: Halbzeit, Stand und Aufgaben sind wieder da",()=>{
  const {G,sets,h1}=gameMid();
  const snap=campSnapshot(G,5000);
  assert.ok(snap&&campResumable(snap));assert.equal(snap.half,2);assert.equal(snap.i,5,"5 beantwortet, weiter bei Aufgabe 6");
  const back=campResume(JSON.parse(JSON.stringify(snap)));
  assert.equal(back.camp.half,2);assert.deepEqual(back.camp.halves,[h1]);assert.deepEqual(back.res,G.res);assert.equal(back.pts,45);assert.equal(back.i,5);
  assert.equal(back.tasks.length,10);assert.equal(back.tasks[6].q,sets.h2[6].q);assert.equal(back.rival,"FC Zahlenfuchs");
  assert.equal(Date.now()-back.t0>=4000,true,"die gespielte Zeit läuft weiter");
  // gerade beantwortet: zählt als erledigt
  G.done=true;G.res=[...G.res,false];assert.equal(campSnapshot(G).i,6);
});
test("Sichern: nichts ohne Antwort, Halbzeitpause bleibt, Abgeschlossenes nicht, Kaputtes wird verworfen",()=>{
  const sets=campUnit(TOP,1),base={li:1,mode:"camp",topic:TOP,camp:{topic:TOP,unit:1,half:1,halves:[],rec:false,brk:false,sets},tasks:sets.h1,len:10,i:0,res:[],hist:[],pts:0,streak:0,pack:false};
  assert.equal(campSnapshot(base),null,"noch keine Antwort");
  assert.equal(campSnapshot(null),null);assert.equal(campSnapshot({pack:true}),null);
  const pause=JSON.parse(JSON.stringify(base));pause.camp.brk=true;pause.camp.halves=[{c:6,n:10,pts:70,res:Array(10).fill(true)}];pause.res=pause.camp.halves[0].res;pause.i=10;
  const sp=campSnapshot(pause);assert.ok(sp&&sp.brk&&campResumable(sp));
  const rec=JSON.parse(JSON.stringify(pause));rec.camp.brk=false;rec.camp.rec=true;assert.ok(campResumable(campSnapshot(rec)));
  const fin=JSON.parse(JSON.stringify(pause));fin.camp.final={c:1,n:2};assert.equal(campSnapshot(fin),null,"abgeschlossen");
  const bad=[null,{},{...sp,v:2},{...sp,topic:"x"},{...sp,unit:9},{...sp,half:3},{...sp,tasks:[]},{...sp,tasks:[{type:"num"}]},{...sp,sets:null},{...sp,halves:[]},{...sp,li:"a"}];
  for(const b of bad)assert.equal(campResumable(b),false,JSON.stringify(b).slice(0,80));
});
test("Sichern im Päckchen (Einheit 4): Antworten und Phase bleiben",()=>{
  const sets=campUnit(TOP,4),G={li:1,mode:"camp",topic:TOP,camp:{topic:TOP,unit:4,half:1,halves:[],rec:false,brk:false,sets},pack:true,phase:"solve",tasks:sets.h1,len:6,i:3,
    ans:[[1,1],[2,0],[3,1]],finals:[[1,1],[2,0],[3,1]],helps:[0,0,0],probeOpen:{},probed:{},res:[],hist:[],pts:0,streak:0};
  const s=campSnapshot(G);assert.ok(s&&campResumable(s));const B=campResume(JSON.parse(JSON.stringify(s)));
  assert.equal(B.phase,"solve");assert.equal(B.i,3);assert.deepEqual(B.ans,G.ans);assert.equal(B.pack,true);
  G.phase="check";G.finals=sets.h1.map((T,k)=>[k,0]);G.ans=G.finals;const c=campSnapshot(G);assert.equal(c.phase,"check");assert.ok(campResumable(c));
  G.phase="edit";assert.equal(campSnapshot(G).phase,"check");
});
test("Elfmeterschießen sichern und fortsetzen",()=>{
  const tasks=penaltyTasks(TOP,3),sets={h1:[],h2:[],pen:tasks};
  const G={li:1,mode:"pen",pen:true,topic:TOP,rival:"Torwart",camp:{topic:TOP,unit:3,half:2,halves:[],rec:false,brk:false,sets},tasks,len:5,i:2,res:[true,false],hist:[],pts:10,streak:0,pack:false,done:true};
  const s=campSnapshot(G);assert.ok(s&&s.pen&&campResumable(s));assert.equal(s.i,3);
  const B=campResume(s);assert.equal(B.pen,true);assert.equal(B.mode,"pen");assert.equal(B.rival,"Torwart");
  G.penDone=true;assert.equal(campSnapshot(G),null);
});

// ---------- Darstellung ----------
const clean=h=>assert.ok(!/undefined|NaN|\[object|—|–/.test(h.replace(/data-[a-z]+="[^"]*"/g,"")),"kaputter Wert oder Gedankenstrich");
const env=(extra={})=>Object.assign({pack:null,camp:null,hasPin:true,syncText:"",updateReady:false,persistent:true,version:"1.6.7"},extra);
test("Startseite: Kachel nur mit Schalter, Einheiten gesperrt oder frei, Fortschritt und Abzeichen",()=>{
  const s=migrateProfile(fx("state-v6.json"));
  assert.ok(!homeHTML(s,{},env()).includes("Trainingslager"),"standardmäßig aus");
  assert.equal(campTilesHTML(s),"");
  applyCampOn(s,ctx(1),TOP,true);
  let h=homeHTML(s,{},env());clean(h);
  assert.ok(h.includes("Trainingslager: Teilen mit Rest")&&h.includes("Einheit 1 von 5")&&h.includes("0 von 5 Einheiten"));
  assert.ok(h.includes('data-camp="m3_rest:1"')&&/data-camp="m3_rest:2" disabled/.test(h),"nur die erste ist frei");
  applyCampUnit(s,ctx(5),{topic:TOP,unit:1,h1:{c:7,n:10},h2:{c:8,n:10}});applyCampPen(s,ctx(6),{topic:TOP,unit:1,c:4,n:5});
  h=homeHTML(s,{},env());clean(h);
  assert.ok(h.includes("Einheit 2 von 5")&&h.includes("1 von 5 Einheiten")&&h.includes("1. Halbzeit 7 von 10, 2. Halbzeit 8 von 10, Elfmeterschießen 4 : 1"));
  assert.ok(!/data-camp="m3_rest:2" disabled/.test(h)&&/data-camp="m3_rest:3" disabled/.test(h));
  assert.ok(h.indexOf("Trainingslager: Teilen mit Rest")<h.indexOf('class="leagues"')||h.indexOf("Trainingslager: Teilen mit Rest")<h.indexOf("Andere Ligen"),"Kachel steht oben");
  for(let n=2;n<=5;n++)applyCampUnit(s,ctx(10+n),{topic:TOP,unit:n,h1:{c:5,n:10},h2:{c:5,n:10}});
  h=homeHTML(s,{},env());assert.ok(h.includes("Rest-Profi")&&h.includes("5 von 5 Einheiten"));assert.ok(!/data-camp="[^"]*" disabled/.test(h),"alle wiederholbar");
});
test("Startseite: Hinweis auf ein gesichertes Spiel mit Weiterspielen und Neu anfangen",()=>{
  const s=migrateProfile(fx("state-v6.json"));
  const h=homeHTML(s,{},env({camp:{topic:TOP,unit:2,half:2,brk:false,pen:false,c:9,m:3}}));clean(h);
  assert.ok(h.includes('id="campResume"')&&h.includes('id="campDrop"')&&h.includes("2. Halbzeit")&&h.includes("Einheit 2")&&h.includes("Stand 9 : 3"));
  const p=homeHTML(s,{},env({camp:{topic:TOP,unit:2,half:2,brk:false,pen:true,c:2,m:1}}));assert.ok(p.includes("Elfmeterschießen weiterspielen?"));
  const b=homeHTML(s,{},env({camp:{topic:TOP,unit:2,half:1,brk:true,pen:false,c:6,m:4}}));assert.ok(b.includes("Halbzeitpause"));
});
test("Halbzeitpause: Zwischenstand, Trainer-Satz, Taste",()=>{
  const sets=campUnit(TOP,1),G={rival:"FC Zahlenfuchs",camp:{topic:TOP,unit:1,half:1,halves:[{c:7,n:10,pts:85,res:[true,true,false,true,true,true,false,true,true,false]}],brk:true,sets}};
  const h=breakHTML({profile:{name:"Emil"}},G,[{name:"Trainer",look:defaultTrainer().look},{name:"Trainerin",look:defaultTrainer2().look}],"Blau Weiß");clean(h);
  assert.ok(h.includes("Halbzeitpause!")&&h.includes("7 : 3")&&h.includes("7 Tore und 3 Fehlschüsse")&&h.includes('id="halfGo"')&&h.includes("2. Halbzeit anpfeifen")&&h.includes("Trainer"));
});
test("Torszene mit Torwart: gehalten oder Tor, Torwart springt, ohne Bewegung steht die Endpose",()=>{
  const look={};
  const saved=sceneSVG(look,{kind:"saved",side:1},{keeper:true});
  assert.ok(saved.includes("sc-saved")&&saved.includes('data-part="torwart"')&&saved.includes("kp-r")&&saved.includes("kp-save")&&saved.includes("Gehalten!"));
  const goal=sceneSVG(look,{kind:"goal",side:1},{keeper:true});
  assert.ok(goal.includes("sc-goal")&&goal.includes("kp-l")&&!goal.includes("kp-save"),"beim Tor springt der Torwart in die andere Ecke");
  assert.ok(!sceneSVG(look,{kind:"goal",side:1}).includes("torwart"),"ohne Option kein Torwart");
  assert.ok(!sceneSVG(look,{kind:"saved",side:1}).includes("sc-saved"),"gehalten gibt es nur mit Torwart");
  assert.equal(SHOT_TEXT.saved,"Gehalten!");
  const css=fs.readFileSync(path.join(ROOT,"app/css/style.css"),"utf8");
  assert.ok(/prefers-reduced-motion:reduce\)\{\.scene \.kp,/.test(css),"reduzierte Bewegung betrifft den Torwart");
  assert.ok(css.includes(".scene .kp-l{transform")&&css.includes(".sc-saved .ballpos"));
});
test("Eltern-Bereich: Schalter, Fortschritt je Einheit, Neustart mit Rückfrage",()=>{
  const s=migrateProfile(fx("state-v6.json"));
  const seg=(attr,opts,cur)=>opts.map(([v,l])=>`<b ${attr}="${v}" ${v===cur?"on":""}>${l}</b>`).join("");
  const a={id:"k-emil0005",name:"Emil",state:s};
  let h=campAdminHTML({confirm:null},a,seg);clean(h);
  assert.ok(h.includes("Trainingslager: Teilen mit Rest")&&h.includes('data-acamp="m3_rest:on:k-emil0005"')&&h.includes('data-acamp="m3_rest:off:k-emil0005"')&&h.includes('data-aask="campreset:k-emil0005:m3_rest"'));
  assert.ok(h.includes("noch nicht gespielt")&&h.includes("noch gesperrt")&&!h.includes("data-ado"));
  applyCampOn(s,ctx(1),TOP,true);applyCampUnit(s,ctx(2),{topic:TOP,unit:1,h1:{c:7,n:10},h2:{c:8,n:10}});
  h=campAdminHTML({confirm:"campreset:k-emil0005:m3_rest"},a,seg);
  assert.ok(h.includes("1. Halbzeit 7 von 10")&&h.includes("1 von 5 Einheiten")&&h.includes("data-ado")&&h.includes("wirklich neu starten"));
});

// ---------- Dateien und Versionen ----------
test("Version 1.6.7 an allen vier Stellen, neue Dateien im Service Worker, Texte ohne Gedankenstriche",()=>{
  const sw=fs.readFileSync(path.join(ROOT,"app/sw.js"),"utf8");
  for(const f of ["camp.js","campviews.js"])assert.ok(sw.includes(`"js/${f}"`),f);
  assert.match(fs.readFileSync(path.join(ROOT,"app/js/version.js"),"utf8"),/"1.6.7"/);assert.match(sw,/VERSION = "1.6.7"/);
  assert.match(fs.readFileSync(path.join(ROOT,"server/server.js"),"utf8"),/SERVER_VERSION = "1.6.7"/);
  assert.equal(JSON.parse(fs.readFileSync(path.join(ROOT,"package.json"),"utf8")).version,"1.6.7");
  for(const f of ["camp.js","campviews.js"])assert.ok(!/[—–]/.test(fs.readFileSync(path.join(ROOT,"app/js",f),"utf8")),f);
  assert.equal(CAMPS.m3_rest.units.length,5);assert.equal(CAMPS.m3_rest.badge,"Rest-Profi");
});

// ---------- Fächer ganz ausschalten (Eltern, je Konto) ----------
import {applyFach,applyTopicMode,topicOn,topicModeOf,topicRawMode,activeTopics,gateTopics,nextTopic,mastered} from "../app/js/rules.js";
import {LIGEN,FACH_OF,allTopicsOf} from "../app/js/content.js";
import {adminHTML} from "../app/js/admin.js";
import {cleanTrainer} from "../app/js/avatar.js";
test("Fach ausschalten: alle Themen des Fachs sind aus, die Einzeleinstellung bleibt erhalten",()=>{
  const s=newProfile({id:"k-abc12345",name:"X",deviceId:"d1"});
  applyTopicMode(s,ctx(1),"d3_ie","wiederholen");
  assert.equal(topicOn(s,"d3_ie"),true);
  assert.equal(applyFach(s,ctx(2),"deu",false),true);
  for(const li of [0,1,2])for(const t of LIGEN[li].deu){assert.equal(topicOn(s,t),false,t);assert.equal(topicModeOf(s,t),"aus");}
  assert.equal(topicOn(s,"m3_rest"),true,"Mathe bleibt");
  assert.equal(topicRawMode(s,"d3_ie"),"wiederholen","Einzeleinstellung bleibt");
  assert.deepEqual(activeTopics(s,LIGEN[1].deu),[]);
  assert.ok(gateTopics(s,1).every(t=>FACH_OF[t]==="math"));
  for(let i=0;i<300;i++)assert.equal(FACH_OF[nextTopic(s,LIGEN[1].math.concat(LIGEN[1].deu),null)],"math","nie ein Deutsch-Thema");
  applyFach(s,ctx(3),"deu",true);
  assert.equal(topicOn(s,"d3_ie"),true);assert.equal(topicModeOf(s,"d3_ie"),"wiederholen");assert.deepEqual(s.settings.fachOff,{});
  assert.equal(applyFach(s,ctx(4),"quatsch",false),false);
});
test("Nur Mathe: Englisch, Sachkunde und Deutsch aus, der Aufstieg hängt nur an Mathe",()=>{
  const s=newProfile({id:"k-abc12345",name:"X",deviceId:"d1"});
  for(const f of ["deu","eng","su"])applyFach(s,ctx(1),f,false);
  assert.ok(allTopicsOf(1).filter(t=>topicOn(s,t)).every(t=>FACH_OF[t]==="math"));
  for(const t of LIGEN[1].math)s.stats[t]={tot:{d1:{a:10,c:10}},last:Array.from({length:10},(_,i)=>({t:i+1,ok:1,d:"d1"}))};
  assert.equal(mastered(s,1),true,"alle Mathe-Themen sicher reicht");
});
test("Fach aus: Startseite zeigt das Fach und den Mix nicht mehr, Eltern-Bereich hat die Schalter",()=>{
  const s=migrateProfile(fx("state-v6.json"));
  let h=homeHTML(s,{lgOpen:{}},env());
  assert.ok(h.includes('data-fach="1:deu"')&&h.includes('data-fach="1:math"')&&h.includes('data-play="1:mix"'));
  applyFach(s,ctx(1),"deu",false);
  h=homeHTML(s,{lgOpen:{}},env());clean(h);
  assert.ok(h.includes('data-fach="1:math"')&&!h.includes('data-fach="1:deu"'));
  assert.ok(h.includes('data-fach="1:eng"'),"Englisch noch an");
  assert.ok(h.includes('data-play="1:mix"'),"Mix bleibt, solange Mathe an ist");
  for(const f of ["eng","su","math"])applyFach(s,ctx(2),f,false);
  h=homeHTML(s,{lgOpen:{}},env());clean(h);
  assert.ok(h.includes("Zurzeit ist hier nichts angeschaltet")&&!h.includes('data-play="1:mix"'));
  const A={tab:"settings",accounts:[{id:"k-emil0005",name:"Emil",state:s}],sel:"k-emil0005",tr1:cleanTrainer(defaultTrainer(),1),tr2:cleanTrainer(defaultTrainer2(),2),server:{state:"loading"},schema:{app:7,global:4}};
  const a=adminHTML(A);clean(a);
  for(const f of ["math","deu","eng","su"])assert.ok(a.includes(`data-afach="${f}:on"`)&&a.includes(`data-afach="${f}:off"`),f);
  assert.ok(a.includes("Fächer: Emil")&&a.includes('aria-pressed="true"'));
});
test("Fach-Schalter wird beim Zusammenführen wie die Einstellungen behandelt (neuerer Stand gewinnt)",()=>{
  const a=migrateProfile(fx("state-v6.json")),b=migrateProfile(fx("state-v6.json"));
  applyFach(a,ctx(a.meta.updatedAt+10),"deu",false);
  const m=mergeProfile(a,b),m2=mergeProfile(b,a);
  assert.deepEqual(m.settings.fachOff,{deu:true});assert.equal(canon(m.settings),canon(m2.settings));
  assert.equal(checkProfileState(m),null);
});

test("Hinweis „Jetzt laden“: eigener Baustein, app.js zeichnet ihn auf Startseite, Wer spielt? und im Eltern-Bereich",async()=>{
  const {updateBannerHTML}=await import("../app/js/views.js");
  assert.ok(updateBannerHTML(true).includes('id="upd"')&&updateBannerHTML(true).includes("Jetzt laden"));
  assert.equal(updateBannerHTML(false),"");
  const app=fs.readFileSync(path.join(ROOT,"app/js/app.js"),"utf8");
  assert.ok(/view==="accounts"\|\|view==="admin"\?updateBannerHTML\(UI\.updateReady\)/.test(app),"Banner in Wer spielt? und Eltern-Bereich");
  assert.ok(app.includes("renderIfIdle()"),"neu zeichnen, sobald eine neue Version bereit ist");
  const home=homeHTML(newProfile({id:"k-abc12345",name:"X",deviceId:"d"}),{},env({updateReady:true}));
  assert.equal([...home.matchAll(/id="upd"/g)].length,1,"auf der Startseite genau einmal");
});
