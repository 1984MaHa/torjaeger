// Version 1.7.3 (C3): Baukasten "Eigenes Trainingslager" (Vorlagen global, Fortschritt je Konto, eingefrorene Vorlage, Schema 10 und global 5)
import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {fileURLToPath} from "node:url";
import {SCHEMA_VERSION,GLOBAL_SCHEMA_VERSION,migrateProfile,migrateGlobal,checkProfileState,checkGlobalState,newProfile,newGlobal} from "../app/js/model.js";
import {mergeGlobal,mergeCamps,mergeTemplates,mergeProfile} from "../app/js/merge.js";
import {ALL_TOPICS} from "../app/js/content.js";
import {setMul,defaultMul} from "../app/js/mul.js";
import {CAMPS,syncCustomCamps,campUnit,isPackUnit,campHalf,penaltyTasks,campTask} from "../app/js/camp.js";
import {normTemplate,saveTemplate,copyTemplate,renameTemplate,deleteTemplate,templatesOf,liveTemplates,findTemplate,allTemplates,defOf,campIdOf,customHalf,customPen,customTask,
  buildCamp,entriesOf,newDraft,draftOf,templateOfDraft,ITEM_LIST,ITEM_IDS,BONUS_KINDS,HALF_CHOICES,narrowedMul,BUILTIN_TEMPLATES} from "../app/js/custom.js";
import {applyCampOn,applyCampUnit,applyCampReset,campOn,campDone,unitOpen} from "../app/js/rules.js";
import {keyOf} from "../app/js/check.js";
import {newMini} from "../app/js/mini.js";
import {campButtonsHTML,campTilesHTML,campResumeHTML,campAdminHTML} from "../app/js/campviews.js";
import {tplPanelHTML,tplEditorHTML} from "../app/js/tplviews.js";

const ROOT=fileURLToPath(new URL("..",import.meta.url));
const fx=f=>JSON.parse(fs.readFileSync(ROOT+"test/fixtures/"+f,"utf8"));
const clone=o=>JSON.parse(JSON.stringify(o));
const prof=()=>newProfile({id:"k-emil0001",name:"Emil",deviceId:"d1",now:1000,topics:ALL_TOPICS});
const ctx=now=>({deviceId:"d1",now});
const reset=()=>{setMul(defaultMul());syncCustomCamps({templates:[]},{},1);};
const seg=(attr,opts,cur)=>opts.map(([v,l])=>`<b ${attr}="${v}" ${v===cur?"data-cur":""}>${l}</b>`).join("");

test("Migration: Konto 9 nach 10 und global 4 nach 5 verlieren nichts, Eingaben bleiben unverändert",()=>{
  assert.equal(SCHEMA_VERSION,10);assert.equal(GLOBAL_SCHEMA_VERSION,5);
  const old=fx("state-v9.json"),copy=clone(old),s=migrateProfile(old);
  assert.deepEqual(old,copy);assert.equal(s.meta.schemaVersion,10);assert.equal(checkProfileState(s),null);
  const a=clone(s);a.meta.schemaVersion=9;assert.deepEqual(a,copy,"alles bleibt");
  assert.deepEqual(migrateProfile(s),s);
  const og=fx("global-v4.json"),gc=clone(og),g=migrateGlobal(clone(og));
  assert.deepEqual(og,gc);assert.equal(g.schemaVersion,5);assert.deepEqual(g.templates,[]);assert.equal(g.extra,"bleibt");assert.deepEqual(g.trainer,og.trainer);assert.deepEqual(g.pin,og.pin);
  assert.equal(checkGlobalState(g),null);assert.deepEqual(migrateGlobal(clone(g)),g);
  const withT=clone(g);withT.templates=[{id:"t-abc123",name:"X",t:5}];assert.deepEqual(migrateGlobal(clone(withT)).templates,withT.templates,"vorhandene Liste bleibt");
  for(const f of ["state-v1.json","state-v2.json","state-v3.json","state-v4.json","state-v5.json","state-v6.json","state-v7.json","state-v8.json","state-v9.json"])assert.equal(migrateProfile(fx(f)).meta.schemaVersion,10,f);
  for(const f of ["global-v2.json","global-v3.json","global-v4.json"])assert.equal(migrateGlobal(fx(f)).schemaVersion,5,f);
  assert.deepEqual(newGlobal().templates,[]);
});
test("Der Server-Check prüft templates und camps.def",()=>{
  const g=newGlobal();g.templates="x";assert.match(checkGlobalState(g),/templates/);g.templates=[{name:"ohne Nummer"}];assert.match(checkGlobalState(g),/templates/);
  const s=prof();s.camps={"c:t-abc123":{units:{},def:5}};assert.match(checkProfileState(s),/def/);s.camps={"c:t-abc123":{units:{},def:{name:"X"}}};assert.equal(checkProfileState(s),null);
});
test("Vorlage bereinigen: Name, Themen, Reihen, Einheiten 1 bis 5, Aufgaben je Halbzeit 5/10/15, Nachspielzeit",()=>{
  const t=normTemplate({id:"t-abc123",name:"  <b>9er</b> Reihe mit einem ganz langen Namen über dreißig Zeichen  ",items:["m3_1x1","kind:sacks","gibt_es_nicht","m3_1x1","d3_ie"],rows:[9,9,0,11,3],zero:false,units:9,half:7,bonus:"quatsch",plan:[["m3_1x1"]]},77);
  assert.ok(t.name.length<=30&&!/[<>]/.test(t.name));assert.deepEqual(t.items,["m3_1x1","kind:sacks","d3_ie"]);assert.deepEqual(t.rows,[3,9]);assert.equal(t.zero,false);
  assert.equal(t.units,5);assert.equal(t.half,10);assert.equal(t.bonus,"penalty");assert.equal(t.plan,null,"Ablauf passt nicht zur Zahl der Einheiten");assert.equal(t.t,77);
  const e=normTemplate({});assert.deepEqual(e.items,["m3_1x1"]);assert.equal(e.units,3);assert.equal(e.rows,null);assert.equal(e.zero,null);assert.equal(e.id,"");
  assert.equal(normTemplate({units:0}).units,1);assert.equal(normTemplate({id:"zz"}).id,"");
  const p=normTemplate({units:2,items:["m3_1x1"],plan:[["kind:sacks"],["kind:pack","x"]]});assert.deepEqual(p.plan,[["kind:sacks"],["kind:pack"]]);
  assert.ok(ITEM_LIST.length>40&&ITEM_IDS.has("kind:wheel")&&ITEM_IDS.has("m3_rest")&&ITEM_LIST.some(x=>x.fach==="Englisch")&&ITEM_LIST.some(x=>x.fach==="Sachkunde"),"alle Fächer und die neuen Arten");
});
test("Vorlagen speichern, kopieren, umbenennen, löschen (Löschmarke)",()=>{
  const g=newGlobal();
  const a=saveTemplate(g,ctx(100),{name:"9er Reihe",items:["m3_1x1","kind:sacks"],rows:[9],units:2});
  assert.match(a.id,/^t-[a-z0-9]{8}$/);assert.equal(a.t,100);assert.equal(g.updatedAt,100);assert.equal(liveTemplates(g).length,1);
  const b=copyTemplate(g,ctx(200),a.id);assert.notEqual(b.id,a.id);assert.match(b.name,/Kopie/);assert.deepEqual(b.items,a.items);assert.deepEqual(b.rows,[9]);
  assert.equal(renameTemplate(g,ctx(300),b.id,"8er Reihe").name,"8er Reihe");assert.equal(findTemplate(g,b.id).t,300);
  const upd=saveTemplate(g,ctx(400),Object.assign({},a,{name:"9er neu"}));assert.equal(upd.id,a.id);assert.equal(liveTemplates(g).length,2);
  assert.ok(deleteTemplate(g,ctx(500),a.id));assert.equal(liveTemplates(g).length,1);assert.equal(templatesOf(g).length,2,"Löschmarke bleibt");assert.equal(templatesOf(g).find(t=>t.id===a.id).del,true);
  assert.equal(findTemplate(g,a.id),null);assert.equal(deleteTemplate(g,ctx(600),"t-unbekannt"),false);
  assert.equal(copyTemplate(g,ctx(700),"t-unbekannt"),null);
  assert.equal(checkGlobalState(g),null);
  assert.ok(entriesOf(g).some(e=>e.special&&e.campId==="m3_rest")&&entriesOf(g).some(e=>e.campId===campIdOf(b)));
  const d=draftOf(findTemplate(g,b.id)),t2=templateOfDraft(Object.assign(d,{rows:[],zero:"off"}));assert.equal(t2.rows,null);assert.equal(t2.zero,false);
  assert.deepEqual(templateOfDraft(newDraft()).items,["m3_1x1"]);
});
test("Abgleich der Vorlagen: zwei Geräte, neuerer Stand gewinnt, Löschmarke geht durch, Reihenfolge egal",()=>{
  const base=newGlobal(1);
  const A=clone(base),B=clone(base);
  const t1=saveTemplate(A,ctx(10),{name:"Nur A",items:["m3_1x1"]}),t2=saveTemplate(B,ctx(20),{name:"Nur B",items:["d3_ie"]});
  const m=mergeGlobal(A,B),m2=mergeGlobal(B,A);
  assert.deepEqual(m.templates,m2.templates);assert.equal(m.templates.length,2);assert.equal(m.schemaVersion,5);
  // beide ändern dieselbe Vorlage: der spätere Stand gewinnt
  const A2=clone(m),B2=clone(m);saveTemplate(A2,ctx(30),Object.assign({},t1,{name:"A neu"}));saveTemplate(B2,ctx(40),Object.assign({},t1,{name:"B neu"}));
  assert.equal(findTemplate(mergeGlobal(A2,B2),t1.id).name,"B neu");assert.equal(findTemplate(mergeGlobal(B2,A2),t1.id).name,"B neu");
  // eine Löschung kommt auf dem anderen Gerät an und verschwindet nicht wieder
  const A3=clone(m),B3=clone(m);deleteTemplate(A3,ctx(50),t2.id);
  const m3=mergeGlobal(B3,A3);assert.equal(findTemplate(m3,t2.id),null);assert.ok(findTemplate(m3,t1.id));assert.deepEqual(mergeGlobal(m3,B3).templates,m3.templates,"nochmal zusammenführen ändert nichts");
  assert.deepEqual(mergeTemplates(undefined,undefined),[]);assert.deepEqual(mergeTemplates([{id:"t-x1x1x1",t:1,name:"a"}],"kaputt").length,1);
  assert.equal(mergeGlobal(A,B).trainer.name,A.trainer.name);
});
test("Konto: eingefrorene Vorlage (def) wird beim Abgleich erhalten, ein Neustart löscht sie auf allen Geräten",()=>{
  const def={id:"t-abc123",name:"X",items:["m3_1x1"],units:2,half:5,bonus:"none",t:5};
  const a={on:true,t:10,rs:0,units:{"1":{h1:{c:1,n:5},h2:{c:2,n:5},t:11,runs:1}},badge:0,def};
  const b={on:true,t:10,rs:0,units:{},badge:0};
  assert.deepEqual(mergeCamps({"c:t-abc123":a},{"c:t-abc123":b})["c:t-abc123"].def,def);
  assert.deepEqual(mergeCamps({"c:t-abc123":b},{"c:t-abc123":a})["c:t-abc123"].def,def);
  const reset={on:true,t:10,rs:99,units:{},badge:0};
  const m=mergeCamps({"c:t-abc123":a},{"c:t-abc123":reset})["c:t-abc123"];assert.equal(m.def,undefined);assert.equal(m.rs,99);assert.deepEqual(m.units,{});
  assert.equal(mergeCamps({"c:t-abc123":reset},{"c:t-abc123":a})["c:t-abc123"].def,undefined);
  const d2=Object.assign({},def,{name:"Y",t:6}),x=mergeCamps({"c:t-abc123":a},{"c:t-abc123":Object.assign({},a,{def:d2})})["c:t-abc123"],y=mergeCamps({"c:t-abc123":Object.assign({},a,{def:d2})},{"c:t-abc123":a})["c:t-abc123"];
  assert.deepEqual(x,y);assert.equal(x.def.name,"Y");
  // ganzer Stand
  const s1=prof(),s2=clone(s1);s1.camps={"c:t-abc123":a};s2.meta.deviceId="d2";
  assert.deepEqual(mergeProfile(s1,s2).camps["c:t-abc123"].def,def);
});
test("Lager-Liste: Vorlage wird zum Lager, Löschen entfernt es, eingefrorenes Lager bleibt, Neustart übernimmt die neue Vorlage",()=>{
  reset();
  try{
    const g=newGlobal(),s=prof();
    const t=saveTemplate(g,ctx(10),{name:"9er Reihe",items:["m3_1x1","kind:sacks"],rows:[9],units:3,half:5,bonus:"wall"}),id=campIdOf(t);
    assert.equal(syncCustomCamps(g,s.camps,1),true);assert.equal(syncCustomCamps(g,s.camps,1),false,"nichts geändert");
    assert.equal(CAMPS[id].units.length,3);assert.equal(CAMPS[id].title,"Trainingslager: 9er Reihe");assert.equal(CAMPS[id].custom,true);assert.equal(CAMPS[id].bonus,"wall");
    assert.ok(!campOn(s,id),"erst nach dem Einschalten");assert.ok(applyCampOn(s,ctx(20),id,true));assert.ok(campOn(s,id));
    assert.ok(unitOpen(s,id,1)&&!unitOpen(s,id,2));
    // Einheit 1 spielen: die Vorlage wird eingefroren
    const hs={c:4,n:5};applyCampUnit(s,ctx(30),{topic:id,unit:1,h1:hs,h2:hs,def:CAMPS[id].def});
    assert.equal(campDone(s,id),1);assert.ok(unitOpen(s,id,2));assert.equal(s.camps[id].def.units,3);assert.equal(checkProfileState(s),null);
    // die Eltern ändern die Vorlage (2 Einheiten, anderer Name): das begonnene Lager bleibt unverändert
    saveTemplate(g,ctx(40),Object.assign({},t,{name:"9er neu",units:2}));
    syncCustomCamps(g,s.camps,1);assert.equal(CAMPS[id].units.length,3,"läuft unverändert");assert.equal(CAMPS[id].name,"9er Reihe");
    const s2=prof();syncCustomCamps(g,s2.camps,1);assert.equal(CAMPS[id].units.length,2,"ein anderes Konto sieht die neue Vorlage");assert.equal(CAMPS[id].name,"9er neu");
    syncCustomCamps(g,s.camps,1);assert.equal(CAMPS[id].units.length,3);
    // Neustart: es gilt wieder die aktuelle Vorlage, der Fortschritt ist weg
    assert.ok(applyCampReset(s,ctx(50),id));assert.equal(s.camps[id].def,undefined);assert.equal(campDone(s,id),0);
    syncCustomCamps(g,s.camps,1);assert.equal(CAMPS[id].units.length,2);assert.equal(CAMPS[id].name,"9er neu");
    // Löschen: ohne Fortschritt verschwindet das Lager, mit Fortschritt bleibt es beim Konto
    applyCampUnit(s,ctx(60),{topic:id,unit:1,h1:hs,h2:hs,def:CAMPS[id].def});
    deleteTemplate(g,ctx(70),t.id);
    syncCustomCamps(g,s.camps,1);assert.ok(CAMPS[id]&&campOn(s,id),"mit Fortschritt bleibt es");
    syncCustomCamps(g,s2.camps,1);assert.equal(CAMPS[id],undefined,"ohne Fortschritt ist es weg");
    assert.ok(!campOn(s2,id));assert.equal(applyCampOn(s2,ctx(80),id,true),false);
    // Konto A und B nacheinander: keine Reste des anderen Kontos
    assert.ok(Object.keys(CAMPS).every(k=>!k.startsWith("c:")),"nur eigene Lager der aktuellen Liste");
  }finally{reset();}
});
test("Aufgaben der Einheit: 5, 10 oder 15 je Halbzeit, alle gewählten Arten, keine Aufgabe doppelt, Englisch mit Stufe",()=>{
  reset();
  try{
    for(const half of HALF_CHOICES){
      const def=defOf(Object.assign(normTemplate({id:"t-abc123",name:"Mix",items:["m3_1x1","kind:sacks","d3_ie","en_colors","m3_rest"],units:3,half,bonus:"penalty"}),{id:"t-abc123"}));
      for(let n=1;n<=3;n++){
        const seen=new Set(),h1=customHalf(def,n,seen),h2=customHalf(def,n,seen),pen=customPen(def,n,seen);
        assert.equal(h1.length,half);assert.equal(h2.length,half);assert.equal(pen.length,5);
        const keys=[...h1,...h2,...pen].map(keyOf);assert.equal(new Set(keys).size,keys.length,"keine Aufgabe doppelt");
        if(half>=10){const tp=new Set(h1.map(T=>T.topic));assert.ok(tp.has("m3_1x1")&&tp.has("d3_ie")&&tp.has("m3_rest"),"alle Themen kommen vor: "+[...tp]);assert.ok(h1.some(T=>T.type==="slots"||T.topic==="m3_1x1"));}
        assert.ok([...h1,...h2].every(T=>typeof T.topic==="string"&&typeof T.type==="string"&&typeof T.q==="string"));
      }
    }
    const none=defOf(normTemplate({id:"t-abc123",items:["m3_1x1"],bonus:"none"}));assert.deepEqual(customPen(none,1),[]);
    const wall=defOf(normTemplate({id:"t-abc123",items:["m3_1x1"],bonus:"wall"}));assert.deepEqual(customPen(wall,1),[]);
    assert.equal(customTask(none,1).topic,"m3_1x1");
  }finally{reset();}
});
test("Die Grenze des Kontos gilt immer, die Vorlage engt nur weiter ein, auch die 0",()=>{
  reset();
  try{
    const mk=o=>defOf(Object.assign(normTemplate(Object.assign({id:"t-abc123",items:["m3_1x1","kind:wheel","kind:chain","kind:sacks"],half:15,units:1},o)),{id:"t-abc123"}));
    const rowsOf=(def,mul)=>{setMul(mul);const out=new Set();
      for(let i=0;i<40;i++)for(const T of customHalf(def,1,new Set())){
        if(T.kind==="sacks")out.add(T.sacks.k);else if(T.kind==="chain")out.add(T.chain.row);else if(T.wheel)out.add(T.wheel.row);
        else if(T.topic==="m3_1x1"){const m=/^(\d+) ([·:]) (\d+) = \?$/.exec(String(T.q).replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim());if(m&&m[2]==="·"){out.add(+m[1]);out.add(+m[3]);}}
      }
      return out;};
    // Konto 8 und 9, Vorlage nur 9: nur die 9er Reihe (als Faktor)
    const r1=rowsOf(mk({rows:[9]}),{rows:[8,9],zero:true});assert.ok(r1.has(9));assert.ok(![...r1].some(x=>x===8&&false));
    assert.deepEqual(narrowedMul(mk({rows:[9]})),narrowedMul(mk({rows:[9]})));
    setMul({rows:[8,9],zero:true});assert.deepEqual(narrowedMul(mk({rows:[9]})),{rows:[9],zero:true});
    // Vorlage will 1 und 2, Konto nur 9: kein leerer Schnitt, die Konto-Grenze bleibt (nie erweitern)
    setMul({rows:[9],zero:true});assert.deepEqual(narrowedMul(mk({rows:[1,2]})),{rows:[9],zero:true});
    // 0: Vorlage "ohne 0" schaltet sie aus, Konto "aus" kann die Vorlage nicht einschalten
    setMul({rows:[9],zero:true});assert.equal(narrowedMul(mk({zero:false})).zero,false);assert.equal(narrowedMul(mk({zero:null})).zero,true);
    setMul({rows:[9],zero:false});assert.equal(narrowedMul(mk({zero:null})).zero,false);assert.equal(narrowedMul(mk({zero:true})).zero,false);
    for(const [mul,rows] of [[{rows:[9],zero:false},[9]],[{rows:[8,9],zero:false},[9]]]){
      const R=rowsOf(mk({rows,zero:false}),mul);
      for(const T of customHalf(mk({rows,zero:false}),1,new Set())){if(T.wheel)assert.ok(!T.wheel.inner.includes(0),"keine 0 im Kreis");if(T.kind==="chain")assert.ok(T.cells.every(c=>c.fix!==0));}
      assert.ok(R.size>0);
    }
    assert.deepEqual(getAfter(),defaultMul(),"die Grenze des Kontos ist nach dem Erzeugen wieder die alte");
  }finally{reset();}
});
function getAfter(){setMul({rows:[1,2,3,4,5,6,7,8,9,10],zero:true});return defaultMul();}
test("Päckchen-Einheit im Lager: ein Päckchen pro Halbzeit mit Kontroll-Pfiff (Ablauf je Einheit)",()=>{
  reset();
  try{
    const g=newGlobal(),t=saveTemplate(g,ctx(1),{name:"Ablauf",items:["m3_1x1"],rows:[9],units:2,half:10,bonus:"none",plan:[["kind:sacks"],["kind:pack"]]}),id=campIdOf(t);
    assert.deepEqual(t.plan,[["kind:sacks"],["kind:pack"]]);
    syncCustomCamps(g,{},1);
    assert.ok(!isPackUnit(id,1));assert.ok(isPackUnit(id,2));
    const sets=campUnit(id,2);assert.equal(sets.h1.length,10);assert.ok(sets.h1.every(T=>T.type==="num"&&T.topic==="m3_1x1"));assert.deepEqual(sets.pen,[]);
    const u1=campUnit(id,1);assert.ok(u1.h1.every(T=>T.kind==="sacks"&&T.sacks.k===9));
    assert.equal(CAMPS[id].units[0].title,"Ballsäcke");
    assert.equal(campHalf(id,1,1).length,10);assert.deepEqual(penaltyTasks(id,1),[]);assert.equal(campTask(id,1,1).kind,"sacks");
  }finally{reset();}
});
test("Nachspielzeit-Mini-Spiele nehmen ihre Aufgaben aus dem Lager (src), sonst gilt der Mix",()=>{
  const s=prof();let n=0;
  const src=()=>({topic:"m3_1x1",type:"num",q:`${2+n++%8} · 3 = ?`,a:(2+(n-1)%8)*3,sig:"x"+n});
  for(const kind of ["wall","dribble"]){const M=newMini(kind,s,Math.random,src);assert.ok(M&&M.items.length>=5&&M.items.every(it=>it.T.topic==="m3_1x1"&&/ · 3 = /.test(it.T.q)),kind);}
  assert.equal(newMini("memory",s,Math.random,()=>({topic:"d3_ie",type:"choice",q:"x",choices:["a","b"],a:"a",sig:String(Math.random())})),null,"Memory braucht Rechenaufgaben");
  assert.ok(newMini("wall",s));
});
test("Darstellung: Kacheln, Ergebnisknöpfe je Nachspielzeit, Eltern-Liste mit Schalter und Editor",()=>{
  reset();
  try{
    const g=newGlobal(),s=prof(),A0={};
    const t=saveTemplate(g,ctx(10),{name:"Test <b>Lager</b>",items:["m3_1x1","d3_ie"],units:2,half:5,bonus:"memory"}),id=campIdOf(t);
    syncCustomCamps(g,s.camps,1);applyCampOn(s,ctx(20),id,true);
    const tiles=campTilesHTML(s);assert.ok(tiles.includes(`data-camp="${id}:1"`)&&!tiles.includes("<b>Lager</b>"));assert.match(tiles,/als Nachspielzeit Memory/);
    const G=pen=>({camp:{topic:id,unit:1},pen});
    assert.match(campButtonsHTML(s,G(false)),/data-campmini="memory"/);assert.ok(!/id="penGo"/.test(campButtonsHTML(s,G(false))));
    applyCampUnit(s,ctx(30),{topic:id,unit:1,h1:{c:5,n:5},h2:{c:5,n:5},def:CAMPS[id].def});
    assert.match(campButtonsHTML(s,G(true)),new RegExp(`data-camp="${id}:2"`));
    const none=saveTemplate(g,ctx(40),{name:"Ohne",items:["m3_1x1"],units:2,bonus:"none"}),nid=campIdOf(none);syncCustomCamps(g,s.camps,1);applyCampOn(s,ctx(41),nid,true);
    applyCampUnit(s,ctx(42),{topic:nid,unit:1,h1:{c:5,n:5},h2:{c:5,n:5}});
    const bn=campButtonsHTML(s,{camp:{topic:nid,unit:1},pen:false});assert.ok(!/penGo|data-campmini/.test(bn));assert.match(bn,new RegExp(`data-camp="${nid}:2"`));
    const pen=saveTemplate(g,ctx(50),{name:"Elfer",items:["m3_1x1"]}),pid=campIdOf(pen);syncCustomCamps(g,s.camps,1);
    assert.match(campButtonsHTML(s,{camp:{topic:pid,unit:1},pen:false}),/id="penGo"/);
    assert.equal(campResumeHTML({topic:"c:t-weg0000",unit:1,half:1,c:1,m:1}).includes("Trainingslager weiterspielen"),true,"unbekanntes Lager bricht nichts");
    // Eltern-Bereich
    const a={id:s.profile.id,name:"Emil",state:s},A={g,tpl:null,confirm:null};
    const h=tplPanelHTML(A,a,g,seg);
    assert.match(h,/Eigene Trainingslager/);assert.ok(h.includes("Test bLager/b"),"spitze Klammern werden beim Speichern entfernt");assert.ok(!h.includes("<b>Lager</b>"));
    assert.match(h,new RegExp(`data-atplon="${s.profile.id}\\|${id.replace(/[:]/g,"\\:")}\\|off"`));assert.match(h,new RegExp(`data-atplon="${s.profile.id}\\|${id}\\|on" data-cur`.replace(/\|/g,"\\|")));
    assert.match(h,/data-atplnew/);assert.match(h,new RegExp(`data-atpledit="${t.id}"`));assert.match(h,new RegExp(`data-atplcopy="${t.id}"`));assert.match(h,new RegExp(`data-aask="tpldel:${t.id}"`));assert.ok(h.includes("Teilen mit Rest"));
    assert.match(tplPanelHTML(Object.assign({},A,{confirm:`tpldel:${t.id}`}),a,g,seg),/Ja, löschen/);
    const ed=tplEditorHTML(draftOf(findTemplate(g,t.id)));
    assert.match(ed,/id="tplName"/);for(const it of ITEM_LIST.slice(0,3))assert.ok(ed.includes(`data-atplitem="${it.id}"`));
    for(const r of [1,10])assert.match(ed,new RegExp(`data-atplrow="${r}"`));for(const k of BONUS_KINDS)assert.ok(ed.includes(`data-atplset="bonus:${k}"`));for(const hh of HALF_CHOICES)assert.ok(ed.includes(`data-atplset="half:${hh}"`));
    for(const u of [1,2,3,4,5])assert.ok(ed.includes(`data-atplset="units:${u}"`));assert.match(ed,/data-atplsave/);assert.match(ed,/data-atplcancel/);
    assert.match(tplPanelHTML({g,tpl:newDraft()},a,g,seg),/Neue Vorlage/);
    // Eltern-Fortschritt je Konto
    const adm=campAdminHTML({confirm:null},a,seg);assert.ok(adm.includes("Trainingslager: Test"));assert.match(adm,/Eigenes Trainingslager aus dem Baukasten/);assert.ok(adm.includes(`campreset:${s.profile.id}:${id}`));
  }finally{reset();}
});
test("Anbindung: Dateien im Service Worker, Handler in app.js, Lager-Nummer mit Doppelpunkt beim Neustart",()=>{
  const sw=fs.readFileSync(ROOT+"app/sw.js","utf8"),js=fs.readFileSync(ROOT+"app/js/app.js","utf8");
  assert.ok(sw.includes('"js/custom.js"')&&sw.includes('"js/tplviews.js"'));
  for(const a of ["atplnew","atpledit","atplcopy","atplitem","atplrow","atplset","atplsave","atplcancel","atplon","campmini"])assert.ok(js.includes(`[data-${a}]`),a);
  assert.match(js,/kind===\"tpldel\"/);assert.match(js,/arg\.indexOf\(\":\"\)/);assert.match(js,/syncCustomCamps\(globalRec\.state,s\.camps,currentLeague\(s\)\)/);
  assert.ok(Array.isArray(BUILTIN_TEMPLATES));assert.ok(allTemplates(newGlobal()).length>=BUILTIN_TEMPLATES.length);
  assert.ok(buildCamp(defOf(normTemplate({id:"t-abc123",items:["m3_1x1"]})),1).units.length>=1);
});
