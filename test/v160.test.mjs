// Version 1.6.0 (B1): Sondertraining für jedes Mathe- und Deutsch-Thema, Zustand "schwerpunkt", mehr Schwerpunkt-Aufgaben im Mix.
import {test} from "node:test";
import assert from "node:assert/strict";
import {newProfile,checkProfileState} from "../app/js/model.js";
import {CAMPS,GENERIC_CAMP_IDS,campUnit,campHalf,penaltyTasks,HALF_LEN,PEN_LEN} from "../app/js/camp.js";
import {LIGEN,TOPIC_MODES} from "../app/js/content.js";
import {applyTopicMode,campOn,topicModeOf,nextTopic,applyCampUnit,unitOpen,campDone,isFocus} from "../app/js/rules.js";
import {campTilesHTML,campAdminHTML} from "../app/js/campviews.js";
import {GEN} from "../app/js/generators.js";

const ctx=(t,d="d1")=>({deviceId:d,now:t});
const prof=()=>newProfile({id:"a1",name:"Emil",deviceId:"d1",now:1});
const MD=LIGEN.flatMap(L=>L.math.concat(L.deu));

test("Jedes Mathe- und Deutsch-Thema hat ein Sondertraining, Englisch und Sachkunde nicht",()=>{
  for(const t of MD)assert.ok(CAMPS[t],t);
  assert.ok(GENERIC_CAMP_IDS.length===MD.length-1,"Teilen mit Rest behält seine fünf besonderen Einheiten");
  assert.equal(CAMPS.m3_rest.units.length,5);assert.equal(CAMPS.m3_rest.generic,undefined);
  for(const L of LIGEN)for(const t of (L.eng||[]).concat(L.su||[]))assert.equal(CAMPS[t],undefined,t);
});
test("Aufgaben je Einheit kommen aus dem Generator des Themas, zwei Halbzeiten und Nachspielzeit",()=>{
  for(const t of GENERIC_CAMP_IDS){
    for(const n of [1,2,3]){
      const u=campUnit(t,n);
      assert.equal(u.h1.length,HALF_LEN,t);assert.equal(u.h2.length,HALF_LEN,t);assert.equal(u.pen.length,PEN_LEN,t);
      for(const T of u.h1.concat(u.h2,u.pen)){assert.equal(T.topic,t);assert.ok(typeof T.q==="string"&&T.q.length>0);}
    }
  }
});
test("Zustand Schwerpunkt: wird gespeichert, gilt nur für Mathe und Deutsch, kein Schemawechsel",()=>{
  assert.ok(TOPIC_MODES.includes("schwerpunkt"));
  const s=prof();
  assert.equal(applyTopicMode(s,ctx(2),"m3_1x1","schwerpunkt"),true);
  assert.equal(topicModeOf(s,"m3_1x1"),"schwerpunkt");assert.equal(isFocus(s,"m3_1x1"),true);
  assert.equal(checkProfileState(s),null);assert.equal(s.meta.schemaVersion,8);
  assert.equal(applyTopicMode(s,ctx(3),"en_farben","schwerpunkt"),false,"Englisch hat kein Sondertraining");
  assert.equal(applyTopicMode(s,ctx(4),"m3_1x1","aktuell"),true);assert.equal(topicModeOf(s,"m3_1x1"),"aktuell");
});
test("Sondertraining erscheint nur beim Schwerpunkt, Fortschritt zählt je Thema",()=>{
  const s=prof();
  assert.equal(campOn(s,"m3_1x1"),false);assert.equal(campTilesHTML(s),"");
  applyTopicMode(s,ctx(2),"m3_1x1","schwerpunkt");
  assert.equal(campOn(s,"m3_1x1"),true);assert.match(campTilesHTML(s),/Sondertraining: Einmaleins/);assert.match(campTilesHTML(s),/data-camp="m3_1x1:1"/);
  assert.equal(unitOpen(s,"m3_1x1",2),false);
  const h={c:7,n:10};
  applyCampUnit(s,ctx(3),{topic:"m3_1x1",unit:1,h1:h,h2:h});assert.equal(unitOpen(s,"m3_1x1",2),true);
  applyCampUnit(s,ctx(4),{topic:"m3_1x1",unit:2,h1:h,h2:h});
  const r=applyCampUnit(s,ctx(5),{topic:"m3_1x1",unit:3,h1:h,h2:h});
  assert.equal(r.badgeNew,true);assert.equal(campDone(s,"m3_1x1"),3);assert.equal(checkProfileState(s),null);
  assert.match(campAdminHTML({confirm:""},{id:"a1",name:"Emil",state:s},()=>""),/Sondertraining: Einmaleins/);
  applyTopicMode(s,ctx(6),"m3_1x1","aus");assert.equal(campOn(s,"m3_1x1"),false,"ohne Schwerpunkt keine Kachel");
  assert.equal(s.camps.m3_1x1.units["1"].h1.c,7,"Fortschritt bleibt erhalten");
});
test("Teilen mit Rest behält Schalter und fünf Einheiten, Schwerpunkt zeigt es auch",()=>{
  const s=prof();assert.equal(campOn(s,"m3_rest"),false);
  applyTopicMode(s,ctx(2),"m3_rest","schwerpunkt");assert.equal(campOn(s,"m3_rest"),true);
  assert.match(campTilesHTML(s),/Trainingslager: Teilen mit Rest/);
});
test("Im Mix kommt der Schwerpunkt etwa bei jeder dritten Aufgabe dran",()=>{
  const s=prof();applyTopicMode(s,ctx(2),"m3_1x1","schwerpunkt");
  const pool=["m3_rest","m3_1x1","m3_htz","m3_plus","m3_sach"];
  let n=0,N=6000;for(let i=0;i<N;i++)if(nextTopic(s,pool,null)==="m3_1x1")n++;
  const share=n/N;assert.ok(share>.38&&share<.58,"Anteil "+share); // ein Drittel gezielt plus der normale Anteil
  const base=prof();let m=0;for(let i=0;i<N;i++)if(nextTopic(base,pool,null)==="m3_1x1")m++;
  assert.ok(share>m/N+.15,"deutlich häufiger als ohne Schwerpunkt");
  // sind alle Themen Schwerpunkt oder keins, ändert sich nichts
  const all=prof();for(const t of pool)applyTopicMode(all,ctx(2),t,"schwerpunkt");
  assert.ok(pool.includes(nextTopic(all,pool,null)));
});
test("Ausgeschaltetes Thema ist nie Schwerpunkt und blockiert nichts",()=>{
  const s=prof();applyTopicMode(s,ctx(2),"m3_htz","schwerpunkt");applyTopicMode(s,ctx(3),"m3_htz","aus");
  assert.equal(isFocus(s,"m3_htz"),false);
  for(let i=0;i<200;i++)assert.notEqual(nextTopic(s,["m3_htz","m3_1x1"],null),"m3_htz");
});
