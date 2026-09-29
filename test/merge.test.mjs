import {test} from "node:test";
import assert from "node:assert/strict";
import {newProfile,newGlobal,total,answersOf} from "../app/js/model.js";
import {mergeProfile,mergeGlobal} from "../app/js/merge.js";
import {applyAnswer,applyRoundEnd,applyOpen,applyLock,applyReset,applyTrial,leagueState,budgetOf} from "../app/js/rules.js";
import {canon,clone} from "../app/js/util.js";

const base=()=>newProfile({id:"k-emil0001",name:"Emil",deviceId:"A",now:1000});
const as=(s,dev)=>({...s,meta:{...s.meta,deviceId:dev}});
const play=(s,dev,t,n,topic="m_read",ok=true)=>{for(let i=0;i<n;i++)applyAnswer(s,{deviceId:dev,now:t+i},{topic,ok,gain:10,li:0,trial:false});};

test("Punkte, Spiele und Siege: Summe der Zuwächse beider Geräte",()=>{
  const a=base(),b=as(clone(a),"B");
  play(a,"A",2000,3);applyRoundEnd(a,{deviceId:"A",now:2500},{li:0,mode:"math",trial:false,c:6,n:8,pts:50,bonus:20});
  play(b,"B",3000,4);applyRoundEnd(b,{deviceId:"B",now:3500},{li:0,mode:"deu",trial:false,c:8,n:8,pts:80,bonus:50});
  const m=mergeProfile(a,b);
  assert.equal(total(m,"points"),30+20+40+50);
  assert.equal(total(m,"rounds"),2);assert.equal(total(m,"wins"),2);assert.equal(total(m,"stickers"),2);
  assert.equal(m.history.length,2);
  assert.equal(answersOf(m,"m_read").a,7);
});

test("Zusammenführen ist unabhängig von der Reihenfolge und zählt nichts doppelt",()=>{
  const a=base(),b=as(clone(a),"B");
  play(a,"A",2000,4,"m_split",false);play(b,"B",3000,5,"m_split",true);
  applyOpen(a,{deviceId:"A",now:2100},1);
  const ab=mergeProfile(a,b),ba=mergeProfile(b,a);
  const strip=s=>{const x=clone(s);delete x.meta.deviceId;return canon(x);};
  assert.equal(strip(ab),strip(ba));
  const again=mergeProfile(ab,b);
  assert.equal(strip(again),strip(ab));
  assert.equal(total(again,"points"),total(ab,"points"));
  assert.equal(answersOf(again,"m_split").a,9);
});

test("Je Thema die letzten 10 Antworten nach Zeitstempel",()=>{
  const a=base(),b=as(clone(a),"B");
  play(a,"A",1000,8,"m_mal",true);       // t 1000..1007
  play(b,"B",1004,8,"m_mal",false);      // t 1004..1011
  const m=mergeProfile(a,b);
  const l=m.stats.m_mal.last;
  assert.equal(l.length,10);
  assert.deepEqual(l.map(x=>x.t),[...l.map(x=>x.t)].sort((x,y)=>x-y));
  assert.equal(Math.max(...l.map(x=>x.t)),1011);
  assert.equal(Math.min(...l.map(x=>x.t)),1005);
  assert.equal(answersOf(m,"m_mal").a,16);   // Zähler verlieren nichts, auch wenn das Fenster nur 10 zeigt
});

test("Ligen-Freigabe: der neuere Stand gewinnt, Probetraining-Verbrauch bleibt",()=>{
  const a=base(),b=as(clone(a),"B");
  applyOpen(a,{deviceId:"A",now:2000},1);           // Eltern geben am Gerät A frei
  applyLock(b,{deviceId:"B",now:3000},1);           // später sperrt Gerät B wieder
  assert.equal(leagueState(mergeProfile(a,b),1),"locked");
  applyOpen(b,{deviceId:"B",now:4000},1);
  assert.equal(leagueState(mergeProfile(a,b),1),"open");
  // Probetraining: gleiche Zustände, beide verbrauchen Aufgaben, der größere Verbrauch zählt
  const c=base(),d=as(clone(c),"B");
  for(const s of [c,d])s.progress.lg.L2={probe:true,spent:0,open:false,trial:"",t:1500};
  c.progress.lg.L2.spent=5;c.progress.lg.L2.t=2000;d.progress.lg.L2.spent=8;d.progress.lg.L2.t=2100;
  assert.equal(budgetOf(mergeProfile(c,d),1),12);
});

test("Schnuppern: das spätere Datum gilt",()=>{
  const a=base(),b=as(clone(a),"B");
  applyTrial(a,{deviceId:"A",now:Date.UTC(2026,8,28,12)},2);
  applyTrial(b,{deviceId:"B",now:Date.UTC(2026,8,29,12)},2);
  assert.equal(mergeProfile(a,b).progress.lg.L3.trial,"2026-09-29");
});

test("Zurücksetzen gewinnt auf allen Geräten, auch gegen ältere Spiele",()=>{
  const a=base(),b=as(clone(a),"B");
  play(a,"A",2000,3);play(b,"B",2500,3);
  const reset=applyReset(a,{deviceId:"A",now:3000});
  const m=mergeProfile(b,reset);
  assert.equal(total(m,"points"),0);assert.deepEqual(m.stats,{});
  assert.equal(m.profile.name,"Emil");assert.equal(m.meta.deviceId,"B");
  // B spielt danach weiter, das bleibt erhalten
  play(m,"B",4000,2);
  assert.equal(total(mergeProfile(m,reset),"points"),20);
});

test("Name und Einstellungen: neuester gewinnt",()=>{
  const a=base(),b=as(clone(a),"B");
  a.profile={...a.profile,name:"Emil G.",t:2000};b.profile={...b.profile,name:"Emil",t:1500};
  a.settings={sound:false,t:2500};b.settings={sound:true,t:2000};
  const m=mergeProfile(a,b);
  assert.equal(m.profile.name,"Emil G.");assert.equal(m.settings.sound,false);
});

test("Unbekannte Felder bleiben erhalten (aus beiden Ständen)",()=>{
  const a=base(),b=as(clone(a),"B");
  a.zukunft={x:1};b.andere={y:2};a.progress.neu=7;b.meta.notiz="b";
  const m=mergeProfile(a,b);
  assert.deepEqual(m.zukunft,{x:1});assert.deepEqual(m.andere,{y:2});assert.equal(m.progress.neu,7);assert.equal(m.meta.notiz,"b");
});

test("Globale Einstellungen: neuere PIN gewinnt, Unbekanntes bleibt",()=>{
  const a=newGlobal(1000),b=newGlobal(1000);
  a.pin={algo:"sha256-salt",salt:"s",hash:"alt",t:1500};b.pin={algo:"sha256-salt",salt:"s",hash:"neu",t:2500};b.extra=1;
  const m=mergeGlobal(a,b);
  assert.equal(m.pin.hash,"neu");assert.equal(m.extra,1);
  assert.equal(mergeGlobal({...a,pin:null},{...b,pin:null}).pin,null);
});
