// Version 1.6.3 (B4): Mini-Spiel Torwand. Antworten auf den Löchern, Schuss aufs richtige Loch.
import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {fileURLToPath} from "node:url";
import {newProfile} from "../app/js/model.js";
import {ALL_TOPICS,LIGEN} from "../app/js/content.js";
import {GEN} from "../app/js/generators.js";
import {isRight} from "../app/js/check.js";
import {applyFach,applyTopicMode} from "../app/js/rules.js";
import {MINI,MINI_LEN,wallOptions,miniTasks,newMini,miniAnswer,miniNext,miniOver,miniGoals,miniScore} from "../app/js/mini.js";
import {miniHTML,miniPanelHTML} from "../app/js/miniviews.js";
import {homeHTML} from "../app/js/views.js";

const ROOT=fileURLToPath(new URL("..",import.meta.url));
const ctx=t=>({deviceId:"d1",now:t});
const prof=()=>newProfile({id:"k-emil0001",name:"Emil",deviceId:"d1",now:1000,topics:ALL_TOPICS});
const MD=LIGEN.flatMap(L=>L.math.concat(L.deu));

test("Löcher: die richtige Antwort ist genau einmal dabei, höchstens vier Löcher, keine doppelte Beschriftung",()=>{
  let got=0;
  for(const t of MD)for(let i=0;i<30;i++){
    const T=Object.assign({topic:t},GEN[t]()),w=wallOptions(T);
    if(!w)continue;got++;
    assert.ok(w.opts.length>=2&&w.opts.length<=4,t);
    assert.equal(isRight(T,w.opts[w.right].val),true,t);
    assert.equal(w.opts.filter((o,k)=>isRight(T,o.val)).length,1,t+": nur eine richtige Antwort");
    assert.equal(new Set(w.opts.map(o=>o.label)).size,w.opts.length,t+": keine doppelten Löcher");
  }
  assert.ok(got>200,"genug Aufgaben taugen für die Torwand: "+got);
});
test("Zahlenaufgabe bekommt vier Löcher mit ähnlichen Zahlen, Aufgaben anderer Art werden abgelehnt",()=>{
  const w=wallOptions({type:"num",a:7,q:"?"});
  assert.equal(w.opts.length,4);assert.equal(w.opts[w.right].val,7);assert.ok(w.opts.every(o=>o.val>=0));
  assert.equal(wallOptions({type:"pair",a:[1,2]}),null);assert.equal(wallOptions({type:"match"}),null);assert.equal(wallOptions(null),null);
  const c=wallOptions({type:"choice",choices:["a","b","c"],a:"b"});assert.equal(c.opts.length,3);assert.equal(c.opts[c.right].val,"b");
});
test("Ein Spiel hat fünf verschiedene Aufgaben aus den aktiven Themen des Mixes",()=>{
  const s=prof();applyTopicMode(s,ctx(2),"m3_rest","aus");
  for(let r=0;r<20;r++){
    const items=miniTasks(s,1,MINI_LEN);
    assert.equal(items.length,MINI_LEN);
    assert.equal(new Set(items.map(x=>x.T.q.replace(/<[^>]+>/g,""))).size,MINI_LEN);
    for(const x of items){assert.notEqual(x.T.topic,"m3_rest");assert.ok(LIGEN[1].math.concat(LIGEN[1].deu).includes(x.T.topic));}
  }
});
test("Kein Thema an: kein Spiel",()=>{
  const s=prof();for(const f of ["math","deu"])applyFach(s,ctx(2),f,false);
  assert.equal(newMini("wall",s),null);assert.equal(newMini("gibtsnicht",prof()),null);
});
test("Ablauf: Schuss aufs richtige Loch gibt Punkte und Serie, falsches Loch nicht, am Ende ist das Spiel vorbei",()=>{
  const s=prof(),M=newMini("wall",s);
  assert.ok(M&&M.items.length===MINI_LEN&&M.kind==="wall");
  const wrongIdx=it=>it.opts.findIndex((_,k)=>k!==it.right);
  const gains=[];
  for(let k=0;k<MINI_LEN;k++){
    const it=M.items[M.i],idx=k===3?wrongIdx(it):it.right;
    const r=miniAnswer(M,idx);
    assert.equal(r.ok,k!==3);assert.equal(r.topic,it.T.topic);gains.push(r.gain);
    assert.equal(miniAnswer(M,it.right),null,"zweiter Schuss zählt nicht");
    assert.equal(miniNext(M),k===MINI_LEN-1);
  }
  assert.deepEqual(gains,[10,10,15,0,10]);
  assert.equal(M.pts,45);assert.equal(miniGoals(M),4);assert.equal(miniScore(M),"4 : 1");assert.equal(miniOver(M),true);
});
test("Ansichten: Auswahl in der Kabine, Torwand mit vier Löchern, Rückmeldung, Ergebnis",()=>{
  const s=prof();
  assert.match(miniPanelHTML(s),/data-mini="wall"/);
  const env={camp:null,pack:null,hasPin:true,syncText:"",updateReady:false,persistent:true};
  assert.match(homeHTML(s,{},env),/data-mini="wall"/);
  const M=newMini("wall",s),h=miniHTML(s,M);
  assert.equal((h.match(/data-hole="/g)||[]).length,M.items[0].opts.length);
  assert.match(h,/Torwand · Aufgabe 1 von 5/);assert.ok(!h.includes("miniNext"));
  miniAnswer(M,M.items[0].right,{kind:"goal",side:1});
  const d=miniHTML(s,M);assert.match(d,/Tor ins richtige Loch! \+10/);assert.match(d,/id="miniNext"/);assert.ok(d.includes('class="hole right"'));
  const M2=newMini("wall",s),w=M2.items[0].opts.findIndex((_,k)=>k!==M2.items[0].right);
  miniAnswer(M2,w,{kind:"wide",side:1});
  const d2=miniHTML(s,M2);assert.match(d2,/Richtig war:/);assert.ok(d2.includes('class="hole wrong"')&&d2.includes('class="hole right"'));
  for(let k=0;k<MINI_LEN;k++){if(!M.done)miniAnswer(M,M.items[M.i].right);miniNext(M);}
  assert.match(miniHTML(s,M),/Treffern/);assert.match(miniHTML(s,M),/miniAgain/);
});
test("Verdrahtung: neue Dateien im Service Worker, app.js zählt Antworten im Lernstand ohne Probetraining-Budget, Texte ohne Gedankenstriche",()=>{
  const sw=fs.readFileSync(ROOT+"app/sw.js","utf8");
  for(const f of ["mini.js","miniviews.js"]){assert.ok(sw.includes(`"js/${f}"`),f);assert.ok(!/[—–]/.test(fs.readFileSync(ROOT+"app/js/"+f,"utf8")),f);}
  const src=fs.readFileSync(ROOT+"app/js/app.js","utf8");
  assert.match(src,/function miniShoot/);assert.match(src,/applyAnswer\(s,c,\{topic:r\.topic,ok:r\.ok,gain:r\.gain,li:MG\.li,trial:true/);
  assert.match(src,/view==="mini"\?miniHTML/);
  assert.ok(MINI.wall.name==="Torwand");
});
