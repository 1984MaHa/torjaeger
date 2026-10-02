// Version 1.6.4 (B5): Mini-Spiel Memory. Aufgabe und Ergebnis als Kartenpaare.
import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {fileURLToPath} from "node:url";
import {newProfile} from "../app/js/model.js";
import {ALL_TOPICS} from "../app/js/content.js";
import {applyMiniPoints,applyFach,applyTopicMode} from "../app/js/rules.js";
import {total} from "../app/js/model.js";
import {MEM_PAIRS,MINI,memoryPair,memoryFlip,newMini,miniOver} from "../app/js/mini.js";
import {miniHTML,miniPanelHTML} from "../app/js/miniviews.js";

const ROOT=fileURLToPath(new URL("..",import.meta.url));
const ctx=t=>({deviceId:"d1",now:t});
const prof=()=>newProfile({id:"k-emil0001",name:"Emil",deviceId:"d1",now:1000,topics:ALL_TOPICS});
const mem=s=>{for(let i=0;i<30;i++){const M=newMini("memory",s);if(M)return M;}return null;};
const pairIdx=(M,k)=>[M.cards.findIndex(c=>c.k===k&&c.side==="q"),M.cards.findIndex(c=>c.k===k&&c.side==="a")];

test("Nur kurze Rechenaufgaben mit ganzer Zahl taugen als Kartenpaar",()=>{
  assert.deepEqual(memoryPair({type:"num",q:"7 · 8 = ?",a:56}),{front:"7 · 8",back:"56"});
  assert.deepEqual(memoryPair({type:"num",q:"56 : 8 = <mark>?</mark>".replace("<mark>?</mark>","?"),a:7}),{front:"56 : 8",back:"7"});
  assert.equal(memoryPair({type:"num",q:"Wie viele <mark>Zehner</mark> hat die Zahl <b>45</b>?",a:4}),null);
  assert.equal(memoryPair({type:"num",q:"7 · 8 = ?",a:56,vis:"<svg/>"}),null);
  assert.equal(memoryPair({type:"choice",q:"1 + 1 = ?",a:"2",choices:["2","3"]}),null);
  assert.equal(memoryPair(null),null);
});
test("Ein Spiel hat fünf Paare, Aufgaben und Ergebnisse sind alle verschieden, zehn gemischte Karten",()=>{
  const s=prof();
  for(let r=0;r<20;r++){
    const M=mem(s);assert.ok(M,"es gibt genug passende Aufgaben");
    assert.equal(M.kind,"memory");assert.equal(M.items.length,MEM_PAIRS);assert.equal(M.cards.length,MEM_PAIRS*2);
    assert.equal(new Set(M.items.map(i=>i.front)).size,MEM_PAIRS);assert.equal(new Set(M.items.map(i=>i.back)).size,MEM_PAIRS);
    for(let k=0;k<MEM_PAIRS;k++){const [q,a]=pairIdx(M,k);assert.ok(q>=0&&a>=0);assert.equal(M.cards[q].text,M.items[k].front);assert.equal(M.cards[a].text,M.items[k].back);}
  }
});
test("Kein Rechenthema an: kein Memory",()=>{
  const s=prof();for(const t of ["m3_1x1","m3_plus","m3_rest","m3_htz","m4_mult","m4_div","m4_stelle","m4_runden","m_zehner","m_rechnen","m_read","m_split","m_plaet","m_mal"])applyTopicMode(s,ctx(2),t,"aus");
  assert.equal(newMini("memory",s),null);
  const t=prof();applyFach(t,ctx(3),"math",false);assert.equal(newMini("memory",t),null);
});
test("Ablauf: passendes Paar bleibt offen und gibt 10 Punkte, falsches Paar bleibt bis zum nächsten Tipp liegen",()=>{
  const s=prof(),M=mem(s);
  // zwei Karten von verschiedenen Paaren
  const [q0]=pairIdx(M,0),[,a1]=pairIdx(M,1);
  assert.deepEqual(memoryFlip(M,q0),{event:"open"});
  assert.deepEqual(memoryFlip(M,q0),{event:"none"},"dieselbe Karte nicht zweimal");
  assert.deepEqual(memoryFlip(M,a1),{event:"miss"});assert.equal(M.tries,1);assert.equal(M.open.length,2);assert.equal(M.found.length,0);
  // nächster Tipp deckt beide wieder zu und dreht die neue Karte
  const [q2]=pairIdx(M,2);assert.deepEqual(memoryFlip(M,q2),{event:"open"});assert.deepEqual(M.open,[q2]);
  const [,a2]=pairIdx(M,2);assert.deepEqual(memoryFlip(M,a2),{event:"pair"});
  assert.deepEqual(M.found,[2]);assert.equal(M.pts,10);assert.equal(M.open.length,0);assert.equal(M.tries,2);
  // gefundene Karten reagieren nicht mehr
  assert.deepEqual(memoryFlip(M,q2),{event:"none"});
  // zwei Aufgabenkarten (oder zwei Ergebniskarten) sind nie ein Paar
  const [qa]=pairIdx(M,0),[qb]=pairIdx(M,1);memoryFlip(M,qa);assert.deepEqual(memoryFlip(M,qb),{event:"miss"});
});
test("Alle Paare gefunden: Spiel ist zu Ende, Punkte gehen auf das Gerät",()=>{
  const s=prof(),M=mem(s);let last;
  for(let k=0;k<MEM_PAIRS;k++){const [q,a]=pairIdx(M,k);memoryFlip(M,q);last=memoryFlip(M,a);}
  assert.equal(last.event,"done");assert.equal(miniOver(M),true);assert.equal(M.pts,50);assert.equal(M.tries,MEM_PAIRS);
  assert.equal(memoryFlip(M,0),null,"nach dem Ende nichts mehr");
  assert.equal(applyMiniPoints(s,ctx(5),M.pts),true);assert.equal(total(s,"points"),50);
  assert.equal(applyMiniPoints(s,ctx(6),0),false);assert.equal(applyMiniPoints(s,ctx(6),-5),false);assert.equal(applyMiniPoints(s,ctx(6),NaN),false);
  assert.equal(total(s,"points"),50);
});
test("Ansichten: Auswahl, verdeckte Karten, offene Karten, Hinweis bei falschem Paar, Ergebnis",()=>{
  const s=prof(),M=mem(s);
  assert.match(miniPanelHTML(s),/data-mini="memory"/);
  let h=miniHTML(s,M);
  assert.equal((h.match(/data-card="/g)||[]).length,MEM_PAIRS*2);assert.ok(!h.includes('class="mcard open'));assert.match(h,/Memory · Versuche: 0/);
  const [q0]=pairIdx(M,0),[,a1]=pairIdx(M,1);
  memoryFlip(M,q0);memoryFlip(M,a1);
  h=miniHTML(s,M);assert.equal((h.match(/class="mcard open/g)||[]).length,2);assert.match(h,/Das passt nicht zusammen/);
  for(let k=0;k<MEM_PAIRS;k++){const [q,a]=pairIdx(M,k);memoryFlip(M,q);memoryFlip(M,a);}
  h=miniHTML(s,M);assert.match(h,/Alle Paare gefunden/);assert.match(h,/miniAgain/);assert.match(h,/\+50 Punkte/);
});
test("Verdrahtung: app.js, Texte ohne Gedankenstriche, Memory zählt nicht im Lernstand",()=>{
  const src=fs.readFileSync(ROOT+"app/js/app.js","utf8");
  assert.match(src,/function memoryTap/);assert.match(src,/applyMiniPoints/);assert.match(src,/data-card/);
  const m=src.slice(src.indexOf("function memoryTap"),src.indexOf("function miniShoot"));
  assert.ok(!m.includes("applyAnswer"),"Memory schreibt keine Antworten in den Lernstand");
  for(const f of ["mini.js","miniviews.js"])assert.ok(!/[—–]/.test(fs.readFileSync(ROOT+"app/js/"+f,"utf8")),f);
  assert.equal(MINI.memory.name,"Memory");
});
