import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {pickShot,shotPath,sceneSVG,SPOTS,SPOT_IDS,CORNER_IDS,isCorner,goalText,SHOT_TEXT,CORNER_CHANCE,CORNER_MAX_GAP} from "../app/js/avatardraw.js";
const ROOT=path.join(path.dirname(fileURLToPath(import.meta.url)),"..");
const CSS=fs.readFileSync(path.join(ROOT,"app/css/style.css"),"utf8");

test("Trefferpunkte: alle kommen vor, nie zweimal hintereinander derselbe",()=>{
  assert.equal(SPOT_IDS.length,8);
  const seen=new Set();let prev=null;
  for(let i=0;i<600;i++){const s=pickShot(true);assert.equal(s.kind,"goal");assert.ok(SPOTS[s.spot]);assert.notEqual(s.spot,prev);prev=s.spot;seen.add(s.spot);assert.ok(s.side===-1||s.side===1);}
  assert.equal(seen.size,SPOT_IDS.length+CORNER_IDS.length);
  // Seite gehört zum Punkt
  for(let i=0;i<100;i++){const s=pickShot(true,Math.random,{prev:"x",since:0});if(SPOTS[s.spot].side)assert.equal(s.side,SPOTS[s.spot].side);}
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

// ---------- D2: Genau ins Eck (1.7.9) ----------
const seq=(...v)=>()=>v.length>1?v.shift():v[0];
test("Eck-Regel: jede 3. richtige Antwort in Folge sicher, sonst Zufall, spätestens nach 5 normalen Treffern",()=>{
  for(const streak of [3,6,9,12]){const s=pickShot(true,()=>.99,{prev:"x",streak});assert.ok(isCorner(s),"Serie "+streak);}
  for(const streak of [1,2,4,5,7,8])assert.ok(!isCorner(pickShot(true,()=>.99,{prev:"x",streak})),"keine Serie "+streak);
  // Zufallsanteil: rnd unter 0,1 gibt ein Eck, darüber nicht
  assert.ok(isCorner(pickShot(true,seq(.05,.5),{prev:"x",streak:1})));
  assert.ok(!isCorner(pickShot(true,seq(.2,.5),{prev:"x",streak:1})));
  // Lücke: nach 5 normalen Treffern kommt sicher ein Eck
  assert.ok(!isCorner(pickShot(true,()=>.99,{prev:"x",since:CORNER_MAX_GAP-1})));
  assert.ok(isCorner(pickShot(true,()=>.99,{prev:"x",since:CORNER_MAX_GAP})));
  // Verteilung über viele Treffer ohne Serie: etwa jeder 6. und höchstens 5 normale am Stück
  let n=0,c=0,gap=0,maxGap=0;
  for(let i=0;i<6000;i++){const s=pickShot(true);n++;if(isCorner(s)){c++;gap=0;}else{gap++;maxGap=Math.max(gap,maxGap);}}
  assert.ok(c/n>.13&&c/n<.22,"Anteil "+c/n);assert.ok(maxGap<=CORNER_MAX_GAP,"Lücke "+maxGap);
  // Fehlschüsse sind nie ein Eck, Elfmeter-Fehlschuss ist gehalten
  for(let i=0;i<50;i++){assert.ok(!isCorner(pickShot(false,Math.random,{streak:3})));assert.ok(!isCorner(pickShot(false,Math.random,{pen:true,streak:3})));}
  // Eine Runde mit 8 richtigen Antworten in Folge hat mindestens ein Eck
  for(let r=0;r<50;r++){let hit=0;for(let i=1;i<=8;i++)if(isCorner(pickShot(true,Math.random,{streak:i})))hit++;assert.ok(hit>=2);}
});
test("Eck-Treffer: Punkt im oberen Winkel, nie zweimal derselbe Punkt, Zeitlupe, Funken, Text",()=>{
  assert.deepEqual(CORNER_IDS.sort(),["wl","wr"]);
  for(const id of CORNER_IDS){
    const sp=SPOTS[id],p=shotPath("goal",sp.side,id);
    assert.ok(sp.y<=46&&(sp.x<=122||sp.x>=218),"oberer Winkel");assert.ok(p.end.x>114&&p.end.x<226&&p.end.y>40&&p.end.y<88);
    // Zeitlupe: Punkt n liegt ganz nah am Ende
    assert.ok(Math.hypot(p.n.x-p.end.x,p.n.y-p.end.y)<.15*Math.hypot(p.start.x-p.end.x,p.start.y-p.end.y));
    const svg=sceneSVG({},{kind:"goal",side:sp.side,spot:id});
    assert.ok(svg.includes("sc-goal sc-corner")&&svg.includes("--nx:")&&svg.includes('class="sparks"')&&svg.includes("Der Ball schlägt genau im Torwinkel ein."));
  }
  assert.ok(!sceneSVG({},{kind:"goal",side:1,spot:"ur"}).includes("sc-corner"));
  let prev=null;for(let i=0;i<300;i++){const s=pickShot(true,Math.random,{streak:3,prev});assert.notEqual(s.spot,prev);prev=s.spot;}
  assert.ok(SHOT_TEXT.corner.includes("Genau ins Eck!")&&SHOT_TEXT.corner.startsWith("Tor!"));
  assert.equal(goalText({kind:"goal",spot:"wl"}),SHOT_TEXT.corner);assert.equal(goalText({kind:"goal",spot:"ul"}),SHOT_TEXT.goal);
  assert.ok(new Set(Object.values(SHOT_TEXT)).size===Object.keys(SHOT_TEXT).length);
});
test("Elfmeterschießen: Torwart springt nie in die Ecke des Eck-Treffers",()=>{
  for(const id of CORNER_IDS){
    const sp=SPOTS[id],svg=sceneSVG({},{kind:"goal",side:sp.side,spot:id},{keeper:true});
    assert.ok(svg.includes(sp.side>0?"kp-l":"kp-r")&&!svg.includes(sp.side>0?"kp-r":"kp-l")&&!svg.includes("kp-save"));
  }
  for(let i=0;i<200;i++){const s=pickShot(true,Math.random,{pen:true,streak:3}),svg=sceneSVG({},s,{keeper:true});assert.ok(svg.includes(s.side>0?"kp-l":"kp-r"));}
});
test("CSS Eck-Treffer: Zeitlupe, Netz zappelt, Funken, Dauer, reduzierte Bewegung",()=>{
  assert.ok(/@keyframes k-corner\{[^@]*var\(--nx\)/.test(CSS)&&/@keyframes bumpc/.test(CSS)&&/@keyframes spark/.test(CSS));
  assert.ok(/\.sc-corner \.ballpos\{animation:k-corner 1s linear \.25s/.test(CSS)&&/\.sc-corner \.netfx\{animation:bumpc \.6s ease-out 1\.2s/.test(CSS));
  assert.ok(.25+1<=1.25&&1.2+.6<=1.8&&1.22+.55<=1.8,"alles fertig vor der nächsten Aufgabe");
  assert.ok(/prefers-reduced-motion:reduce\)\{[^}]*\.scene \.sparks \.sp/.test(CSS));
  assert.ok(/\.scene \.sparks \.sp\{opacity:0/.test(CSS));
});
test("Ecktore im Spielstand: Zähler in Auswertung und Elfmeter-Ergebnis, Torszene-Text im Overlay",async()=>{
  const {resultHTML,playHTML}=await import("../app/js/views.js");
  assert.ok(resultHTML.length>0&&typeof playHTML==="function");
  const src=fs.readFileSync(path.join(ROOT,"app/js/views.js"),"utf8")+fs.readFileSync(path.join(ROOT,"app/js/campviews.js"),"utf8");
  assert.ok(src.includes("G.corners===1?\"1 Ecktor\":G.corners+\" Ecktore\""));
  const app=fs.readFileSync(path.join(ROOT,"app/js/app.js"),"utf8");
  assert.ok((app.match(/G\.corners=\(G\.corners\|\|0\)\+1/g)||[]).length===2,"beide Antwortwege zählen");
});
