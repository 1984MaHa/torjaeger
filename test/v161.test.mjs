// Version 1.6.1 (B2): Themen-Zustände (Schema 8): zurückgestellt (mit Datum), neue Themen starten zurückgestellt, Migration 7 nach 8.
import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {fileURLToPath} from "node:url";
import {newProfile,migrateProfile,checkProfileState,SCHEMA_VERSION,TOPICS_AT_8} from "../app/js/model.js";
import {ALL_TOPICS,TOPIC_MODES,LIGEN} from "../app/js/content.js";
import {topicRawMode,topicModeOf,topicOn,topicUntil,applyTopicMode,applyTopicUntil,nextTopic,gateTopics,mastered,safeCount} from "../app/js/rules.js";
import {mergeProfile} from "../app/js/merge.js";
import {adminHTML} from "../app/js/admin.js";

const fx=n=>JSON.parse(fs.readFileSync(new URL("./fixtures/"+n,import.meta.url),"utf8"));
const ctx=(t,d="d1")=>({deviceId:d,now:t});
const prof=()=>newProfile({id:"k-emil0001",name:"Emil",deviceId:"d1",now:1000,topics:ALL_TOPICS});
const DAY=86400000,at=iso=>Date.parse(iso+"T12:00:00");

test("Schema 8: Migration 7 nach 8 aus dem Format 1.6.0 verliert nichts und stellt kein Thema zurück",()=>{
  const old=fx("state-v7.json"),copy=JSON.parse(JSON.stringify(old));
  assert.equal(old.meta.schemaVersion,7);assert.equal(checkProfileState(old),null);
  const s=migrateProfile(old);
  assert.deepEqual(old,copy,"die Eingabe bleibt unverändert");
  assert.equal(SCHEMA_VERSION,10);assert.equal(s.meta.schemaVersion,10);
  const a=JSON.parse(JSON.stringify(s));delete a.settings.topicSeen;delete a.settings.mul;a.meta.schemaVersion=7;
  assert.deepEqual(a,copy,"alles andere ist gleich (Schwerpunkt, Aus, Trainingslager bleiben)");
  assert.deepEqual(s.settings.topicSeen,TOPICS_AT_8);assert.equal(checkProfileState(s),null);
  for(const t of ALL_TOPICS)assert.notEqual(topicRawMode(s,t),"zurueck",t);
  assert.equal(topicModeOf(s,"m3_1x1"),"schwerpunkt");assert.equal(topicModeOf(s,"su_wasser"),"aus");
  // ältere Stände wandern in einem Zug durch
  for(const f of ["state-v1.json","state-v2.json","state-v3.json","state-v4.json","state-v5.json","state-v6.json"]){
    const m=migrateProfile(fx(f));assert.equal(m.meta.schemaVersion,10,f);assert.equal(checkProfileState(m),null,f);
  }
});
test("TOPICS_AT_8 ist eine feste Liste und deckt alle heutigen Themen ab",()=>{
  for(const t of ALL_TOPICS)assert.ok(TOPICS_AT_8.includes(t),t);
});
test("Zustand zurückgestellt: nicht im Spiel, kein Hindernis für den Aufstieg",()=>{
  const s=prof();assert.ok(TOPIC_MODES.includes("zurueck"));
  assert.equal(applyTopicMode(s,ctx(2),"m3_htz","zurueck"),true);
  assert.equal(topicModeOf(s,"m3_htz"),"zurueck");assert.equal(topicOn(s,"m3_htz"),false);
  assert.ok(!gateTopics(s,1).includes("m3_htz"),"zählt nicht für den Aufstieg");
  for(let i=0;i<200;i++)assert.notEqual(nextTopic(s,["m3_htz","m3_1x1"],null),"m3_htz");
  assert.equal(applyTopicMode(s,ctx(3),"m3_htz","aktuell"),true);assert.equal(topicOn(s,"m3_htz"),true);
});
test("Zurückgestellt bis Datum: am Datum ist das Thema von selbst wieder aktuell",()=>{
  const s=prof();applyTopicMode(s,ctx(2),"d3_ie","zurueck");
  assert.equal(applyTopicUntil(s,ctx(3),"d3_ie","2026-11-10"),true);assert.equal(topicUntil(s,"d3_ie"),"2026-11-10");
  assert.equal(topicRawMode(s,"d3_ie",at("2026-11-09")),"zurueck");
  assert.equal(topicRawMode(s,"d3_ie",at("2026-11-10")),"aktuell");
  assert.equal(topicRawMode(s,"d3_ie",at("2027-01-01")),"aktuell");
  assert.equal(topicModeOf(s,"d3_ie",at("2026-11-10")),"aktuell");
  assert.equal(applyTopicUntil(s,ctx(4),"d3_ie","kein Datum"),false);assert.equal(applyTopicUntil(s,ctx(4),"d3_ie","2026-13-45"),false);
  assert.equal(applyTopicUntil(s,ctx(5),"d3_ie",""),true);assert.equal(topicUntil(s,"d3_ie"),"");assert.equal(topicRawMode(s,"d3_ie",at("2030-01-01")),"zurueck","ohne Datum bleibt es zurückgestellt");
  assert.equal(applyTopicUntil(s,ctx(6),"m3_htz","2026-11-10"),false,"nur für zurückgestellte Themen");
  assert.equal(checkProfileState(s),null);
});
test("Datum geht beim Wechsel in einen anderen Zustand weg",()=>{
  const s=prof();applyTopicMode(s,ctx(2),"d3_ie","zurueck");applyTopicUntil(s,ctx(3),"d3_ie","2026-11-10");
  applyTopicMode(s,ctx(4),"d3_ie","wiederholen");assert.equal(topicUntil(s,"d3_ie"),"");
});
test("Neue Themen starten zurückgestellt, ausdrücklich Aktuell oder Datum macht sie bekannt",()=>{
  const s=migrateProfile(fx("state-v7.json"));
  s.settings.topicSeen=s.settings.topicSeen.filter(t=>t!=="m3_plus"); // m3_plus gilt hier als später dazugekommen
  assert.equal(topicModeOf(s,"m3_plus"),"zurueck");assert.equal(topicOn(s,"m3_plus"),false);
  assert.equal(topicModeOf(s,"m3_htz"),"aktuell","andere Themen bleiben");
  const a=JSON.parse(JSON.stringify(s));
  assert.equal(applyTopicMode(a,ctx(2),"m3_plus","aktuell"),true);assert.equal(topicModeOf(a,"m3_plus"),"aktuell","Aktuell bleibt aktuell");
  const b=JSON.parse(JSON.stringify(s));
  assert.equal(applyTopicUntil(b,ctx(3),"m3_plus","2026-12-01"),true);assert.equal(b.settings.topicMode.m3_plus,"zurueck");assert.equal(topicRawMode(b,"m3_plus",at("2026-12-01")),"aktuell");
  assert.equal(checkProfileState(a),null);assert.equal(checkProfileState(b),null);
});
test("Ältere Stände ohne topicSeen stellen nichts zurück; neue Konten kennen alle Themen",()=>{
  const s=prof();delete s.settings.topicSeen;
  for(const t of ALL_TOPICS)assert.equal(topicRawMode(s,t),"aktuell",t);
  const n=prof();for(const t of ALL_TOPICS)assert.equal(topicRawMode(n,t),"aktuell",t);
  assert.deepEqual(newProfile({id:"k-x",name:"X",deviceId:"d"}).settings.topicSeen,TOPICS_AT_8);
});
test("Zurückgestellt blockiert den Aufstieg nicht: alle übrigen Themen sicher genügt",()=>{
  const s=prof(),L=LIGEN[1],all=L.math.concat(L.deu);
  for(const t of all.slice(1)){s.stats[t]={tot:{},last:Array.from({length:10},(_,i)=>({t:i,ok:1,d:"d1"}))};}
  assert.equal(mastered(s,1),false);
  applyTopicMode(s,ctx(2),all[0],"zurueck");
  assert.equal(mastered(s,1),true);assert.equal(safeCount(s,1),all.length-1);
});
test("Zusammenführen: Zustände und Datum gehören zu den Einstellungen (neuerer Stand gewinnt)",()=>{
  const a=prof(),b=JSON.parse(JSON.stringify(a));b.meta.deviceId="B";
  applyTopicMode(a,ctx(2000,"A"),"d3_ie","zurueck");applyTopicUntil(a,ctx(2001,"A"),"d3_ie","2026-11-10");
  applyTopicMode(b,ctx(3000,"B"),"m3_htz","aus");
  const ab=mergeProfile(a,b),ba=mergeProfile(b,a);
  assert.equal(topicModeOf(ab,"m3_htz"),"aus");assert.equal(topicModeOf(ba,"m3_htz"),"aus");
  const c=JSON.parse(JSON.stringify(a));c.meta.deviceId="C";
  const ac=mergeProfile(a,c);assert.equal(topicUntil(ac,"d3_ie"),"2026-11-10");
});
test("Eltern-Bereich: Zustand Zurückgestellt mit Datumsfeld, Erklärung",()=>{
  const s=prof();applyTopicMode(s,ctx(2),"d3_ie","zurueck");applyTopicUntil(s,ctx(3),"d3_ie","2026-11-10");
  const html=adminHTML({tab:"settings",accounts:[{id:"k-emil0001",name:"Emil",state:s}],sel:"k-emil0001",confirm:"",tr1:null,tr2:null,server:{},schema:{app:8,global:4},cfg:{},msg:null},"x");
  assert.ok(typeof html==="string");
});
