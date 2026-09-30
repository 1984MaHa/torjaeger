// Schemaversion 2: Migration 1 nach 2 (Stand im Format 1.0.0), neue Felder, Zusammenführen.
import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {migrateProfile,migrateGlobal,newProfile,newGlobal,total,answersOf,helpOf,SCHEMA_VERSION,GLOBAL_SCHEMA_VERSION} from "../app/js/model.js";
import {mergeProfile,mergeGlobal} from "../app/js/merge.js";
import {applyAnswer,applyHelp,applyAvatar,applyRename,applySettings,applyRoundEnd,applyTrainer,applyReset,settingsOf,canTrial,roundLen,trialLen,winNeed,leagueState,budgetOf} from "../app/js/rules.js";
import {cleanLook,defaultTrainer,defaultTrainer2,TEMPLATES,HAIRS} from "../app/js/avatar.js";
import {todayKey} from "../app/js/util.js";

const v1=()=>JSON.parse(fs.readFileSync(new URL("./fixtures/state-v1.json",import.meta.url),"utf8"));
const clone=o=>JSON.parse(JSON.stringify(o));
const dev=(id,t)=>({deviceId:id,now:t});

test("Schema ist 5 (Konto) und 3 (global)",()=>{assert.equal(SCHEMA_VERSION,5);assert.equal(GLOBAL_SCHEMA_VERSION,3);});

test("Migration 1 nach 2: Stand im Format 1.0.0 bleibt vollständig erhalten",()=>{
  const old=v1(),s=migrateProfile(old);
  assert.equal(s.meta.schemaVersion,SCHEMA_VERSION); // 1 -> 2 -> 3 in einem Zug
  // nichts verloren
  assert.equal(total(s,"points"),1800);assert.equal(total(s,"rounds"),25);assert.equal(total(s,"wins"),17);assert.equal(total(s,"stickers"),17);
  assert.deepEqual(s.progress.days,old.progress.days);assert.equal(s.progress.sel,1);
  assert.deepEqual(s.progress.lg,old.progress.lg);
  assert.deepEqual(answersOf(s,"d_wortart"),{a:12,c:7});assert.deepEqual(answersOf(s,"m_read"),{a:14,c:13});
  assert.deepEqual(s.stats.m_read.last,old.stats.m_read.last);
  assert.deepEqual(s.history,old.history);
  assert.equal(s.profile.name,"Emil");assert.equal(s.profile.id,"k-emil0001");assert.equal(s.profile.t,old.profile.t);
  assert.equal(s.meta.rev,12);assert.equal(s.meta.updatedAt,old.meta.updatedAt);assert.equal(s.meta.createdAt,old.meta.createdAt);
  assert.equal(leagueState(s,1),"probe");assert.equal(budgetOf(s,1),12);
  // Unbekanntes bleibt
  assert.deepEqual(s.zusatz,{unbekannt:"muss erhalten bleiben"});
  // vorhandene Einstellungen bleiben, neue bekommen Vorgaben
  assert.equal(s.settings.sound,false);assert.equal(s.settings.t,1790020000000);
  assert.deepEqual([s.settings.perRound,s.settings.trialN,s.settings.trialDaily,s.settings.hintAfter],[8,3,true,45]);
  // neue Felder
  assert.equal(s.profile.avatar,null);assert.equal(s.profile.avatarAsked,false);
  assert.deepEqual(helpOf(s,"m_read"),{n:0,t1:0,t2:0});
});

test("Migration ändert die Eingabe nicht und ist wiederholbar",()=>{
  const old=v1();const once=migrateProfile(old);
  assert.deepEqual(old,v1());
  assert.deepEqual(migrateProfile(clone(once)),once);
});

test("Migration: schon vorhandene neue Felder werden nicht überschrieben",()=>{
  const old=v1();old.settings.perRound=10;old.profile.avatar={t:5,hair:2};
  const s=migrateProfile(old);
  assert.equal(s.settings.perRound,10);assert.equal(s.profile.avatar.t,5);
});

test("Globale Migration: Trainer bekommt Vorgabe, PIN bleibt",()=>{
  const g=migrateGlobal({schemaVersion:1,pin:{algo:"sha256-salt",salt:"s",hash:"h",t:5},updatedAt:9,extra:1});
  assert.equal(g.schemaVersion,3);assert.equal(g.pin.hash,"h");assert.equal(g.extra,1);
  assert.equal(g.trainer.name,"Trainer");assert.equal(g.trainer.t,0);assert.equal(g.trainer2.name,"Trainerin");
  assert.deepEqual(newGlobal().trainer,defaultTrainer());assert.deepEqual(newGlobal().trainer2,defaultTrainer2());
  // ein nie geänderter Trainer aus der ersten Vorschau (t 0, alter Name) bekommt die neue Vorgabe, ein geänderter bleibt
  const alt=migrateGlobal({schemaVersion:2,pin:null,updatedAt:1,trainer:{name:"Trainer Papa",look:{cap:"#e5484d"},t:0}});
  assert.equal(alt.trainer.name,"Trainer");assert.equal(alt.trainer2.name,"Trainerin");
  const eigen=migrateGlobal({schemaVersion:2,pin:null,updatedAt:1,trainer:{name:"Coach",look:{},t:77},trainer2:{name:"Coachin",look:{},t:88}});
  assert.equal(eigen.trainer.name,"Coach");assert.equal(eigen.trainer2.name,"Coachin");
});

test("Neue Regeln: Einstellungen prüfen, Runde, Schnuppern, Sieg-Schwelle",()=>{
  const s=newProfile({id:"k-abc12345",name:"E",deviceId:"d"});
  assert.equal(roundLen(s),8);assert.equal(trialLen(s),3);
  applySettings(s,dev("d",100),{perRound:6,trialN:5,trialDaily:false,hintAfter:0,sound:false});
  assert.deepEqual([roundLen(s),trialLen(s),settingsOf(s).trialDaily,settingsOf(s).hintAfter,s.settings.sound,s.settings.t],[6,5,false,0,false,100]);
  applySettings(s,dev("d",101),{perRound:7,trialN:0,hintAfter:5});      // ungültig: bleibt
  assert.deepEqual([roundLen(s),trialLen(s),settingsOf(s).hintAfter],[6,5,0]);
  assert.deepEqual([6,8,10].map(winNeed),[4,5,6]);
  // Schnuppern nur einmal pro Tag an/aus
  const t=Date.UTC(2026,8,29,12);
  s.progress.lg.L2={probe:false,spent:0,open:false,trial:todayKey(t),t:1};
  applySettings(s,dev("d",102),{trialDaily:true});assert.equal(canTrial(s,1,t),false);
  applySettings(s,dev("d",103),{trialDaily:false});assert.equal(canTrial(s,1,t),true);
  // Stand ohne die Felder (Format 1, nicht migriert) funktioniert mit Vorgaben
  const old=v1();assert.equal(roundLen(old),8);assert.equal(trialLen(old),3);
});

test("Tipp-Nutzung wird je Aufgabe und Thema gezählt, Punkte bleiben unberührt",()=>{
  const s=newProfile({id:"k-abc12345",name:"E",deviceId:"d1"});
  applyHelp(s,dev("d1",10),{topic:"m_read",level:1});applyHelp(s,dev("d1",11),{topic:"m_read",level:2});
  applyAnswer(s,dev("d1",12),{topic:"m_read",ok:true,gain:10,li:0,trial:false,help:2});
  applyAnswer(s,dev("d1",13),{topic:"m_read",ok:true,gain:10,li:0,trial:false});
  assert.deepEqual(helpOf(s,"m_read"),{n:1,t1:1,t2:1});
  assert.equal(total(s,"points"),20);                                   // gleicher Gewinn mit und ohne Hilfe
  assert.equal(s.stats.m_read.last[0].h,2);assert.equal("h" in s.stats.m_read.last[1],false);
  assert.deepEqual(helpOf(s,"m_split"),{n:0,t1:0,t2:0});
});

test("Spielende speichert die Dauer",()=>{
  const s=newProfile({id:"k-abc12345",name:"E",deviceId:"d1"});
  applyRoundEnd(s,dev("d1",5),{li:0,mode:"mix",trial:false,c:5,n:8,pts:60,bonus:20,dur:187.4});
  applyRoundEnd(s,dev("d1",6),{li:0,mode:"mix",trial:false,c:5,n:8,pts:60,bonus:20});
  assert.equal(s.history[0].dur,187);assert.equal("dur" in s.history[1],false);
});

test("Merge: Aussehen neuester gewinnt, in beide Richtungen gleich",()=>{
  const a=migrateProfile(v1()),b=clone(a);a.meta.deviceId="A";b.meta.deviceId="B";
  applyAvatar(a,dev("A",1790200000000),{hair:2,shirt:"#2f6fde"});
  applyAvatar(b,dev("B",1790300000000),{hair:5,shirt:"#e5484d"});
  const ab=mergeProfile(a,b),ba=mergeProfile(b,a);
  assert.equal(ab.profile.avatar.hair,"stoppel");assert.equal(ab.profile.avatar.shirt,"#e5484d");
  assert.deepEqual(ab.profile.avatar,ba.profile.avatar);
  // einer ohne Avatar: der mit Avatar bleibt, auch wenn der andere sonst neuer ist
  const c=migrateProfile(v1());c.meta.updatedAt=1790900000000;c.profile.t=1790900000000;
  const ac=mergeProfile(c,a);assert.equal(ac.profile.avatar.hair,"igel");assert.equal(ac.profile.avatarAsked,true);
  assert.equal(mergeProfile(a,c).profile.avatar.hair,"igel");
  // Gleichstand bei t: reihenfolgeunabhängig
  const d=clone(a),e=clone(a);d.profile.avatar={...d.profile.avatar,hair:1};e.profile.avatar={...e.profile.avatar,hair:3};
  assert.deepEqual(mergeProfile(d,e).profile.avatar,mergeProfile(e,d).profile.avatar);
});

test("Merge: Name und Aussehen ändern sich unabhängig voneinander",()=>{
  const a=migrateProfile(v1()),b=clone(a);a.meta.deviceId="A";b.meta.deviceId="B";
  applyRename(a,dev("A",1790400000000),"Emil M.");
  applyAvatar(b,dev("B",1790300000000),{hair:4});
  const m=mergeProfile(a,b);
  assert.equal(m.profile.name,"Emil M.");assert.equal(m.profile.avatar.hair,"tolle");
});

test("Merge: Tipp-Zähler je Gerät summieren, nichts doppelt",()=>{
  const a=migrateProfile(v1()),b=clone(a);a.meta.deviceId="A";b.meta.deviceId="B";
  applyHelp(a,dev("A",10),{topic:"m_read",level:1});applyHelp(a,dev("A",11),{topic:"m_read",level:1});
  applyHelp(b,dev("B",12),{topic:"m_read",level:1});applyHelp(b,dev("B",13),{topic:"m_read",level:2});
  applyAnswer(b,dev("B",14),{topic:"m_read",ok:false,gain:0,li:0,trial:false,help:2});
  const m=mergeProfile(a,b);
  assert.deepEqual(helpOf(m,"m_read"),{n:1,t1:3,t2:1});
  assert.deepEqual(helpOf(mergeProfile(b,a),"m_read"),{n:1,t1:3,t2:1});
  assert.deepEqual(helpOf(mergeProfile(m,b),"m_read"),{n:1,t1:3,t2:1});   // erneut zusammenführen zählt nicht doppelt
  assert.deepEqual(helpOf(mergeProfile(m,a),"m_read"),{n:1,t1:3,t2:1});
  // Themen ohne Hilfe bekommen kein leeres help-Feld
  assert.equal("help" in m.stats.d_wortart,false);
});

test("Merge: Einstellungen je Konto, neuerer Stand",()=>{
  const a=migrateProfile(v1()),b=clone(a);a.meta.deviceId="A";b.meta.deviceId="B";
  applySettings(a,dev("A",1790500000000),{perRound:10});applySettings(b,dev("B",1790400000000),{perRound:6,hintAfter:0});
  assert.equal(mergeProfile(a,b).settings.perRound,10);assert.equal(mergeProfile(b,a).settings.perRound,10);
  assert.equal(mergeProfile(a,b).settings.hintAfter,45);
});

test("Merge global: Trainer neuester gewinnt, PIN und Trainer getrennt",()=>{
  const a=newGlobal(1000),b=newGlobal(1000);
  a.pin={algo:"sha256-salt",salt:"s",hash:"neu",t:500};b.pin={algo:"sha256-salt",salt:"s",hash:"alt",t:100};
  applyTrainer(b,dev("B",2000),{name:"Coach Marco",look:{jacket:"#2f6fde"}},1);
  applyTrainer(a,dev("A",3000),{name:"Coach Ina",look:{hairColor:"#e6c15a"}},2);
  const m=mergeGlobal(a,b),m2=mergeGlobal(b,a);
  assert.equal(m.pin.hash,"neu");assert.equal(m.trainer.name,"Coach Marco");assert.equal(m.trainer.look.jacket,"#2f6fde");
  assert.equal(m2.trainer.name,"Coach Marco");assert.equal(m2.pin.hash,"neu");
  assert.equal(m.trainer2.name,"Coach Ina");assert.equal(m2.trainer2.name,"Coach Ina");   // Trainer und Trainerin werden getrennt entschieden
  // alter Stand ohne Trainer
  const old={schemaVersion:1,pin:null,updatedAt:5};
  assert.equal(mergeGlobal(old,b).trainer.name,"Coach Marco");
  assert.equal(mergeGlobal(old,old).trainer.name,"Trainer");assert.equal(mergeGlobal(old,old).trainer2.name,"Trainerin");
});

test("Zurücksetzen behält Aussehen und Einstellungen",()=>{
  const s=migrateProfile(v1());applyAvatar(s,dev("d",5),{hair:3});applySettings(s,dev("d",6),{perRound:10});
  const r=applyReset(s,dev("d",7));
  assert.equal(total(r,"points"),0);assert.equal(r.profile.avatar.hair,"locken");assert.equal(r.settings.perRound,10);assert.equal(r.meta.resetAt,7);
});

test("Avatar-Prüfung: ungültige Werte werden ersetzt, mindestens 6 Frisuren",()=>{
  assert.ok(HAIRS.length>=12);assert.ok(TEMPLATES.length>=6);
  const l=cleanLook({hair:99,hairColor:"rot",skin:"#FFE0C7",shirt:"javascript:1",number:"1234",shirtName:"<b>emil</b>",team:"x".repeat(50),c1:null});
  assert.equal(l.hair,TEMPLATES[0].look.hair);assert.equal(l.hairColor,TEMPLATES[0].look.hairColor);assert.equal(l.skin,"#ffe0c7");
  assert.equal(l.shirt,TEMPLATES[0].look.shirt);assert.equal(l.number,"12");assert.ok(!/[<>]/.test(l.shirtName));assert.ok(l.team.length<=20);
});
