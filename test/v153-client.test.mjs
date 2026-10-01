// Version 1.5.3: App-Seite (lokales Speichern mit Wiederholung, Päckchen sichern und fortsetzen, kleine Verbesserungen).
import {test} from "node:test";
import assert from "node:assert/strict";
import {memoryStore,withRetry} from "../app/js/store.js";

// Speicher, der auf Zuruf Fehler wirft (simulierter IndexedDB-Fehler)
function flaky(){
  const inner=memoryStore(),box={fail:0,always:false,puts:0};
  return Object.assign(box,{
    persistent:true,
    async get(k){return inner.get(k);},
    async put(k,v){box.puts++;if(box.always||box.fail>0){if(box.fail>0)box.fail--;throw new Error("QuotaExceededError");}return inner.put(k,v);},
    async del(k){return inner.del(k);},
    async keys(p){return inner.keys(p);}
  });
}
// Zeitgeber von Hand: sofort fällige Wartezeiten, wiederkehrende Versuche nur auf Zuruf
function timers(){const q=[];return{q,set:(fn,ms)=>{if(ms<1000){setImmediate(fn);return null;}q.push(fn);return null;}};}

test("Lokales Speichern: ein kurzer Fehler wird wiederholt, ohne dass das Kind etwas merkt",async()=>{
  const raw=flaky(),events=[],tm=timers();
  const st=withRetry(raw,{delays:[1,1,1],onState:ok=>events.push(ok),setTimer:tm.set});
  raw.fail=2;
  assert.equal(await st.put("profile:a",{x:1}),true);
  assert.deepEqual(await st.get("profile:a"),{x:1},"gespeichert");
  assert.deepEqual(events,[],"kein Hinweis nötig");
  assert.equal(raw.puts,3);
});

test("Lokales Speichern: bei dauerhaftem Fehler gibt es einen Hinweis, nichts geht still verloren, bei Besserung ist alles gespeichert",async()=>{
  const raw=flaky(),events=[],tm=timers();
  const st=withRetry(raw,{delays:[1,1,1],onState:ok=>events.push(ok),setTimer:tm.set});
  raw.always=true;
  const rec={x:1};
  assert.equal(await st.put("profile:a",rec),false,"put wirft nicht, meldet aber den Fehler");
  assert.deepEqual(events,[false],"Hinweis wird angezeigt");
  assert.equal(st.pendingCount,1);
  assert.equal(await raw.get("profile:a"),undefined);
  // das Kind spielt weiter: der Stand ändert sich im Arbeitsspeicher
  rec.x=2;
  assert.equal(await st.put("profile:b",{y:1}),false);
  assert.equal(st.pendingCount,2,"beide Schlüssel sind vorgemerkt");
  // das Gerät erholt sich, der nächste Versuch schreibt den NEUESTEN Stand
  raw.always=false;
  assert.equal(tm.q.length>0,true,"ein weiterer Versuch ist eingeplant");
  await tm.q.shift()();
  assert.deepEqual(await raw.get("profile:a"),{x:2},"neuester Stand gespeichert");
  assert.deepEqual(await raw.get("profile:b"),{y:1});
  assert.equal(st.pendingCount,0);
  assert.deepEqual(events,[false,true],"Hinweis verschwindet wieder");
});

test("Lokales Speichern: ein späteres erfolgreiches Speichern desselben Schlüssels räumt den Fehler auf",async()=>{
  const raw=flaky(),events=[],tm=timers();
  const st=withRetry(raw,{delays:[1,1,1],onState:ok=>events.push(ok),setTimer:tm.set});
  raw.always=true;await st.put("k",{v:1});
  raw.always=false;
  assert.equal(await st.put("k",{v:2}),true);
  assert.deepEqual(await raw.get("k"),{v:2});
  assert.deepEqual(events,[false,true]);
  assert.equal(st.pendingCount,0);
});

test("Lokales Speichern: get, keys und del laufen unverändert durch",async()=>{
  const raw=flaky(),st=withRetry(raw,{delays:[1,1,1],setTimer:timers().set});
  await st.put("profile:a",{a:1});await st.put("profile:b",{b:1});await st.put("device","g-1");
  assert.deepEqual((await st.keys("profile:")).sort(),["profile:a","profile:b"]);
  await st.del("profile:a");assert.equal(await st.get("profile:a"),undefined);
  assert.equal(st.persistent,true);
});

// ---------- 5. Päckchen sichern: reine Funktionen ----------
import fs from "node:fs";
import {packSnapshot,packResumable,packResume,packOf} from "../app/js/check.js";
import {matchHTML} from "../app/js/inputs.js";
import {GEN} from "../app/js/generators.js";
import {EN_TOPICS,CONFUSE} from "../app/js/content-en.js";
import {saveWarnHTML,homeHTML} from "../app/js/views.js";
import {newProfile} from "../app/js/model.js";

const packG=(phase,extra)=>{const tasks=packOf("m3_rest");return Object.assign({li:1,topic:"m3_rest",pack:true,phase,tasks,len:tasks.length,i:0,ans:[],finals:[],helps:[],probeOpen:{},probed:{}},extra);};

test("Päckchen sichern: ohne eingetragene Antwort gibt es nichts zu sichern, mit Antworten ein vollständiger Schnappschuss",()=>{
  assert.equal(packSnapshot(packG("solve")),null);
  assert.equal(packSnapshot(null),null);assert.equal(packSnapshot({pack:false}),null);
  const g=packG("solve",{i:2,ans:[[1,0],[2,1]],finals:[[1,0],[2,1]],helps:[0,1]});
  const snap=packSnapshot(g,1234);
  assert.equal(snap.t,1234);assert.equal(snap.phase,"solve");assert.equal(snap.i,2);assert.equal(snap.tasks.length,g.tasks.length);
  assert.equal(packResumable(snap),true);
  const back=packResume(snap);
  assert.equal(back.pack,true);assert.equal(back.i,2);assert.deepEqual(back.ans,g.ans);assert.deepEqual(back.helps,[0,1]);assert.equal(back.len,g.tasks.length);
  assert.notEqual(snap.tasks,g.tasks,"unabhängige Kopie");
  // Auswertung nach der Abgabe wird nicht gesichert; Antwort ändern gilt als Kontroll-Pfiff
  assert.equal(packSnapshot(packG("eval",{ans:[1],finals:[1]})),null);
  const n=g.tasks.length,fin=g.tasks.map((_,k)=>k);
  const chk=packSnapshot(packG("edit",{i:n,ans:fin,finals:fin}));
  assert.equal(chk.phase,"check");assert.equal(packResumable(chk),true);assert.equal(packResume(chk).phase,"check");
});

test("Päckchen fortsetzen: kaputte oder unvollständige Sicherungen werden abgelehnt",()=>{
  const ok=packSnapshot(packG("solve",{i:1,ans:[[1,0]],finals:[[1,0]]}));
  assert.equal(packResumable(ok),true);
  for(const [what,bad] of Object.entries({
    "null":null,"kein Objekt":"x","andere Version":{...ok,v:2},"ohne Aufgaben":{...ok,tasks:[]},"Aufgabe ohne Text":{...ok,tasks:[{type:"num"}]},
    "Position hinter dem Ende":{...ok,i:99},"unbekannte Phase":{...ok,phase:"eval"},"ohne Antworten":{...ok,ans:null},
    "Kontrolle mit fehlender Antwort":{...ok,phase:"check"}
  }))assert.equal(packResumable(bad),false,what);
});

// ---------- 6. Hinweis bei Speicherproblemen ----------
test("Speichern klappt nicht: deutlicher, kindgerechter Hinweis für die Eltern, sonst nichts",()=>{
  assert.equal(saveWarnHTML(false),"");
  const h=saveWarnHTML(true);
  assert.ok(h.includes('role="alert"')&&h.includes("Speichern klappt gerade nicht")&&h.includes("Mama oder Papa"));
  assert.ok(!/—/.test(h),"keine Gedankenstriche");
});

// ---------- 11. Zuordnen: Nummer am Paar, nicht nur Farbe ----------
test("Zuordnen: gepaarte Begriffe tragen auf beiden Seiten dieselbe Nummer",()=>{
  const T={type:"match",q:"x",left:[{t:"a",k:"txt"},{t:"b",k:"txt"},{t:"c",k:"txt"}],right:[{t:"2",k:"txt"},{t:"3",k:"txt"},{t:"1",k:"txt"}],a:[2,0,1]};
  const G={pairs:[-1,-1,-1],msel:-1,done:false};
  assert.ok(!matchHTML(T,G).includes("pnum"),"ohne Paar keine Nummer");
  G.pairs=[1,-1,2]; // links 1 mit rechts 2, links 3 mit rechts 3
  const h=matchHTML(T,G);
  const nums=[...h.matchAll(/<b class="pnum" aria-label="Paar (\d)">(\d)<\/b>/g)].map(m=>m[1]+m[2]);
  assert.deepEqual(nums.sort(),["11","11","33","33"].sort(),"Paar 1 und Paar 3 je zweimal");
  assert.ok(h.includes("dieselbe Nummer"));
});

// ---------- 10. Hilfetaste und Kopfzeile ----------
test("Hilfetaste mindestens 44 Punkte hoch, die Kopfzeile der Frage darf umbrechen",()=>{
  const css=fs.readFileSync(new URL("../app/css/style.css",import.meta.url),"utf8");
  const tail=css.slice(css.indexOf("Version 1.5.3"));
  assert.ok(/\.helpbtn\{[^}]*min-height:44px/.test(tail)&&/\.helpbtn\.sm\{[^}]*min-height:44px/.test(tail));
  assert.ok(/\.cardtop\{flex-wrap:wrap\}/.test(tail));
});

// ---------- 13. Eltern-Bereich: „zuletzt sicher geübt“ statt „sicher“ ----------
test("Trainerbank der Eltern spricht von „zuletzt sicher geübt“, das Häkchen für das Kind bleibt",()=>{
  const s=newProfile({id:"k-test0001",name:"Emil",deviceId:"d"});
  const h=homeHTML(s,{},{hasPin:true,syncText:"",persistent:true,version:"1.5.3"});
  assert.ok(h.includes("Als zuletzt sicher geübt gilt ein Thema ab"));
  assert.ok(!h.includes("Ein Thema ist sicher ab"));
  assert.ok(h.includes("Mix: Mathe &amp; Deutsch"));
});

// ---------- 14. Englisch-Bilder: nur ein Bild passt ----------
test("Englisch: leicht verwechselbare Bilder kommen nie zusammen in einer Bildauswahl vor",()=>{
  const confused=new Map();
  for(const g of CONFUSE)for(const a of g)for(const b of g)if(a!==b){confused.set(a,(confused.get(a)||new Set()).add(b));}
  const allWords=Object.values(EN_TOPICS).flatMap(t=>t.words.map(w=>w[0]));
  for(const g of CONFUSE)for(const w of g)assert.ok(allWords.includes(w),w+" gibt es in den Englisch-Wörtern");
  let pics=0;
  for(const topic of Object.keys(EN_TOPICS)){
    for(let n=0;n<400;n++){
      const T=GEN[topic]({level:1});if(T.type!=="pic")continue;pics++;
      const names=T.tiles.map(t=>t.name),right=names[T.a];
      for(const other of names)if(other!==right)assert.ok(!(confused.get(right)||new Set()).has(other),`${topic}: ${right} und ${other} gemeinsam`);
      assert.equal(new Set(T.tiles.map(t=>t.t)).size,T.tiles.length,"jedes Bild nur einmal");
    }
  }
  assert.ok(pics>1000);
});

test("Englisch: Mutter und Vater sind mit Baby-Fläschchen gezeigt, der Frühling mit Blüte statt Tulpe",()=>{
  const w=Object.fromEntries(Object.values(EN_TOPICS).flatMap(t=>t.words).map(x=>[x[0],x]));
  assert.ok(w.mother[2].includes("\u{1F37C}")&&w.father[2].includes("\u{1F37C}"));
  assert.notEqual(w.spring[2],"\u{1F337}");assert.equal(w.spring[2],"\u{1F338}");
  // jedes Bild innerhalb eines Themas gehört genau einem Wort
  for(const [id,t] of Object.entries(EN_TOPICS)){const pics=t.words.map(x=>x[2]);assert.equal(new Set(pics).size,pics.length,id+": Bilder doppelt");}
});
