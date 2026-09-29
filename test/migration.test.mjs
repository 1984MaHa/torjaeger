import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {migratePrototype,migrateProfile,migrateGlobal,newProfile,total,answersOf,UnsupportedSchema,SCHEMA_VERSION} from "../app/js/model.js";
import {topicSafe,leagueState,budgetOf,stickerCount} from "../app/js/rules.js";
import {checkPin} from "../app/js/pin.js";

const fixture=()=>JSON.parse(fs.readFileSync(new URL("./fixtures/prototype-state.json",import.meta.url),"utf8"));
const opts={id:"k-emil0001",name:"Emil",deviceId:"g-alt",now:1790000000000};

test("Prototypstand wird ohne Verlust ins neue Schema migriert",()=>{
  const old=fixture();
  const {state:s,pin}=migratePrototype(old,opts);
  assert.equal(s.meta.schemaVersion,SCHEMA_VERSION);
  assert.equal(s.profile.name,"Emil");
  assert.equal(total(s,"points"),1234);assert.equal(total(s,"rounds"),17);assert.equal(total(s,"wins"),11);assert.equal(total(s,"stickers"),11);
  assert.equal(stickerCount(s),11);
  assert.deepEqual(s.progress.days,old.days);
  assert.equal(s.progress.sel,1);
  // Antworten je Thema: Zähler und letzte 10 (bei längerem Verlauf die letzten 10)
  for(const t of Object.keys(old.stats)){
    assert.deepEqual(answersOf(s,t),{a:old.stats[t].a,c:old.stats[t].c},t);
    assert.deepEqual(s.stats[t].last.map(x=>x.ok),old.stats[t].last.slice(-10),t);
  }
  assert.ok(topicSafe(s,"m_read"));assert.ok(!topicSafe(s,"m_split"));assert.ok(!topicSafe(s,"m_plaet"));
  // Ligen: Budget 12 von 20 heißt 8 gespielt
  assert.equal(leagueState(s,1),"probe");assert.equal(budgetOf(s,1),12);
  assert.equal(s.progress.lg.L2.trial,"2026-09-29");
  assert.equal(leagueState(s,2),"locked");
  // Verlauf, Einstellungen, Unbekanntes
  assert.equal(s.history.length,2);assert.equal(s.history[0].pts,90);assert.equal(s.history[1].trial,true);
  assert.ok(new Set(s.history.map(h=>h.id)).size===2);
  assert.equal(s.settings.sound,false);
  assert.deepEqual(s.zusatz,{unbekannt:"muss erhalten bleiben"});
  assert.deepEqual(pin,{algo:"legacy-djb2",hash:"h1k2j3",t:0});
});

test("Die Migration ändert die Eingabe nicht",()=>{
  const old=fixture();migratePrototype(old,opts);
  assert.deepEqual(old,fixture());
});

test("migrateProfile erkennt das Prototypformat und lässt neue Stände unangetastet",()=>{
  const viaProfile=migrateProfile(fixture(),opts);
  assert.equal(total(viaProfile,"points"),1234);
  const neu=newProfile({id:"k-abc12345",name:"X",deviceId:"d"});
  assert.deepEqual(migrateProfile(JSON.parse(JSON.stringify(neu))),neu);
});

test("Stand mit neuerer Schemaversion wird nie überschrieben oder gekürzt",()=>{
  const neu=newProfile({id:"k-abc12345",name:"X",deviceId:"d"});neu.meta.schemaVersion=SCHEMA_VERSION+1;
  assert.throws(()=>migrateProfile(neu),UnsupportedSchema);
  assert.throws(()=>migrateGlobal({schemaVersion:99,pin:null}),UnsupportedSchema);
});

test("Alt-PIN aus dem Prototyp funktioniert und wird aufgewertet",async()=>{
  // djb2("torjaeger:1234") wie im Prototyp
  let h=5381;for(const ch of "torjaeger:1234")h=((h<<5)+h+ch.charCodeAt(0))>>>0;
  const rec={algo:"legacy-djb2",hash:"h"+h.toString(36),t:0};
  const bad=await checkPin("0000",rec);assert.equal(bad.ok,false);
  const good=await checkPin("1234",rec);assert.equal(good.ok,true);assert.equal(good.upgrade.algo,"sha256-salt");
  assert.equal((await checkPin("1234",good.upgrade)).ok,true);
  assert.equal((await checkPin("1235",good.upgrade)).ok,false);
});
