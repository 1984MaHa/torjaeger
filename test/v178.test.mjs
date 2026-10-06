import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {pickShot,shotPath,sceneSVG,SPOTS,SPOT_IDS} from "../app/js/avatardraw.js";
const ROOT=path.join(path.dirname(fileURLToPath(import.meta.url)),"..");
const CSS=fs.readFileSync(path.join(ROOT,"app/css/style.css"),"utf8");

test("Trefferpunkte: alle kommen vor, nie zweimal hintereinander derselbe",()=>{
  assert.equal(SPOT_IDS.length,8);
  const seen=new Set();let prev=null;
  for(let i=0;i<400;i++){const s=pickShot(true);assert.equal(s.kind,"goal");assert.ok(SPOTS[s.spot]);assert.notEqual(s.spot,prev);prev=s.spot;seen.add(s.spot);assert.ok(s.side===-1||s.side===1);}
  assert.equal(seen.size,SPOT_IDS.length);
  // Seite gehört zum Punkt
  for(let i=0;i<100;i++){const s=pickShot(true);if(SPOTS[s.spot].side)assert.equal(s.side,SPOTS[s.spot].side);}
  // ausdrücklicher Vorgänger wird ausgeschlossen
  for(let i=0;i<50;i++)assert.notEqual(pickShot(true,Math.random,{prev:"ul"}).spot,"ul");
});
test("Elfmeterschießen: richtig Tor, falsch gehalten",()=>{
  assert.equal(pickShot(true,Math.random,{pen:true}).kind,"goal");
  assert.equal(pickShot(false,Math.random,{pen:true}).kind,"saved");
});
test("Flugbahn: Punkte liegen im Tor, Bahn ist gebogen, Ball wird kleiner",()=>{
  for(const id of SPOT_IDS){
    const sp=SPOTS[id],p=shotPath("goal",sp.side||1,id);
    assert.ok(p.end.x>114&&p.end.x<226&&p.end.y>40&&p.end.y<88,id);
    assert.deepEqual([p.end.x,p.end.y],[sp.x,sp.y]);
    // Zwischenpunkt weicht von der Geraden ab
    const ly=(p.start.y+p.end.y)/2,lx=(p.start.x+p.end.x)/2;
    assert.ok(Math.abs(p.c.y-ly)>3||Math.abs(p.c.x-lx)>3,id+" gebogen");
    assert.ok(p.end.s<p.start.s&&p.c.s<p.start.s&&p.c.s>p.end.s);
  }
  for(const kind of ["post","bar","wide","saved"]){const p=shotPath(kind,1);assert.ok(p.c&&p.c.s>0,kind);}
});
test("Szene: Trefferpunkt landet in den Variablen, Netz sitzt am Endpunkt, alle Ausgänge haben Zwischenpunkt",()=>{
  const a=sceneSVG({},{kind:"goal",side:-1,spot:"ul"}),b=sceneSVG({},{kind:"goal",side:1,spot:"lr"});
  assert.ok(a.includes("--ex:127px;--ey:48px")&&b.includes("--ex:213px;--ey:80px"));
  assert.ok(a.includes("--bx:127px")&&a.includes("--cx:"));
  assert.notEqual(a,b);
  for(const kind of ["post","bar","wide"])assert.ok(sceneSVG({},{kind,side:1}).includes("--cx:"));
  assert.ok(sceneSVG({},{kind:"goal",side:1}).includes("--ex:213px"),"ohne Punkt: Standard je Seite");
});
test("CSS: Bogenbahn, Netzbeule, Dauer passt in 1,8 Sekunden, reduzierte Bewegung",()=>{
  for(const k of ["goal","post","bar","wide"])assert.ok(new RegExp(String.raw`@keyframes k-${k}\{[^@]*var\(--cx\)`).test(CSS),k);
  assert.ok(/@keyframes bump/.test(CSS)&&/\.sc-goal \.netfx\{animation:bump \.62s ease-out 1\.12s/.test(CSS));
  assert.ok(.3+.85<=1.2&&1.12+.62<=1.8,"Netz fertig vor der nächsten Aufgabe");
  assert.ok(/\.sc-goal \.ballpos\{animation:k-goal \.85s/.test(CSS));
  assert.ok(/prefers-reduced-motion:reduce\)\{[^}]*\.scene \.netfx/.test(CSS));
});
