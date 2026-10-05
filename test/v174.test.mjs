// Version 1.7.4 (C4): mitgelieferte Vorlage "9er Reihe" (ausgeschaltet, 5 Einheiten) und "für andere Reihe kopieren"
import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {fileURLToPath} from "node:url";
import {newProfile,newGlobal,checkGlobalState} from "../app/js/model.js";
import {ALL_TOPICS} from "../app/js/content.js";
import {setMul,defaultMul,ALL_ROWS} from "../app/js/mul.js";
import {CAMPS,syncCustomCamps,campUnit,isPackUnit} from "../app/js/camp.js";
import {BUILTIN_TEMPLATES,findTemplate,entriesOf,saveTemplate,deleteTemplate,copyForRow,copyTemplate,campIdOf,liveTemplates,templatesOf} from "../app/js/custom.js";
import {campOn,applyCampOn,unitOpen} from "../app/js/rules.js";
import {campTilesHTML} from "../app/js/campviews.js";
import {tplPanelHTML} from "../app/js/tplviews.js";
import {isRight} from "../app/js/check.js";

const ROOT=fileURLToPath(new URL("..",import.meta.url));
const prof=()=>newProfile({id:"k-emil0001",name:"Emil",deviceId:"d1",now:1000,topics:ALL_TOPICS});
const ctx=now=>({deviceId:"d1",now});
const reset=()=>{setMul(defaultMul());syncCustomCamps({templates:[]},{},1);};
const seg=(attr,opts,cur)=>opts.map(([v,l])=>`<b ${attr}="${v}" ${v===cur?"data-cur":""}>${l}</b>`).join("");
const KINDS=["sacks","chain","wheel","wheelback"];

test("Die Vorlage 9er Reihe ist mitgeliefert, ausgeschaltet und schreibgeschützt",()=>{
  assert.equal(BUILTIN_TEMPLATES.length,1);
  const t=findTemplate(newGlobal(),"b-9er");
  assert.ok(t&&t.builtin);assert.equal(t.name,"9er Reihe");assert.deepEqual(t.rows,[9]);assert.equal(t.units,5);assert.equal(t.bonus,"penalty");
  assert.deepEqual(t.plan,[["kind:sacks"],["kind:chain"],["kind:wheel"],["kind:wheelback"],["kind:pack"]]);
  const g=newGlobal();assert.equal(saveTemplate(g,ctx(5),Object.assign({},t,{name:"Hack"})),null,"mitgelieferte lassen sich nicht ändern");
  assert.equal(deleteTemplate(g,ctx(6),"b-9er"),false);assert.equal(templatesOf(g).length,0);assert.equal(checkGlobalState(g),null);
  assert.ok(entriesOf(g).some(e=>e.id==="b-9er"&&e.builtin&&e.rows1===9));
  reset();
  try{
    const s=prof();syncCustomCamps(g,s.camps,1);assert.ok(CAMPS["c:b-9er"]);assert.ok(!campOn(s,"c:b-9er"),"ausgeschaltet");assert.equal(campTilesHTML(s),"");
    assert.ok(applyCampOn(s,ctx(10),"c:b-9er",true));assert.ok(campOn(s,"c:b-9er"));
    const tiles=campTilesHTML(s);assert.match(tiles,/data-camp="c:b-9er:1"/);assert.match(tiles,/Trainingslager: 9er Reihe/);assert.match(tiles,/eine Nachspielzeit/);
    assert.ok(unitOpen(s,"c:b-9er",1)&&!unitOpen(s,"c:b-9er",2));
  }finally{reset();}
});
test("Fünf Einheiten: Ballsäcke, Passkette, Rechenkreis vorwärts und rückwärts, Päckchen mit Kontroll-Pfiff, Nachspielzeit Elfmeterschießen",()=>{
  reset();
  try{
    const g=newGlobal(),id="c:b-9er";syncCustomCamps(g,{},1);
    assert.equal(CAMPS[id].units.length,5);assert.deepEqual(CAMPS[id].units.map(u=>u.title),["Ballsäcke","Passkette","Rechenkreis vorwärts","Rechenkreis rückwärts","Päckchen Reihe"]);
    for(let i=0;i<5;i++)assert.equal(isPackUnit(id,i+1),i===4);
    for(let rep=0;rep<5;rep++)for(let n=1;n<=5;n++){
      const set=campUnit(id,n);
      assert.equal(set.pen.length,5,"Elfmeterschießen mit 5 Schüssen");
      for(const T of [].concat(set.h1,set.h2)){
        if(n<=4){assert.equal(T.type,"slots");assert.equal(T.kind,KINDS[n-1]);assert.equal(T.row,9);}
        else{assert.equal(T.type,"num");const m=/^(\d+) ([·:]) (\d+) = \?$/.exec(String(T.q));assert.ok(m,T.q);const a=+m[1],b=+m[3];assert.ok(m[2]==="·"?(a===9||b===9):(b===9||a/b===9),"Aufgabe der 9er Reihe: "+T.q);}
      }
      if(n<=4){assert.equal(set.h1.length,10);assert.equal(set.h2.length,10);}
      else{
        assert.ok(set.h1.length>=12&&set.h1.length<=16&&set.h2.length>=12&&set.h2.length<=16);
        const qs=set.h1.map(T=>T.q);assert.equal(new Set(qs).size,qs.length,"Päckchen ohne doppelte Aufgabe");
      }
      for(const T of [].concat(set.h1,set.h2,set.pen))if(T.type==="slots")assert.ok(isRight(T,T.a.map(String)));
    }
  }finally{reset();}
});
test("Für andere Reihe kopieren: Reihe gewählt, Name passt sich an, Ablauf bleibt, Aufgaben nutzen die neue Reihe",()=>{
  reset();
  try{
    const g=newGlobal();
    for(let row=1;row<=10;row++){
      if(row===9)continue;
      const c=copyForRow(g,ctx(100+row),"b-9er",row);
      assert.ok(c&&!c.builtin);assert.equal(c.name,`${row}er Reihe`);assert.deepEqual(c.rows,[row]);assert.equal(c.units,5);assert.deepEqual(c.plan,findTemplate(g,"b-9er").plan);assert.equal(c.bonus,"penalty");
      syncCustomCamps(g,{},1);const id=campIdOf(c);
      const set=campUnit(id,1);assert.ok(set.h1.every(T=>T.sacks.k===row));
      const w=campUnit(id,3);assert.ok(w.h1.every(T=>T.wheel.row===row&&T.wheel.outer.every((v,i)=>v===T.wheel.inner[i]*row)));
    }
    assert.equal(liveTemplates(g).length,9,"jede Kopie ist eine eigene Vorlage");assert.equal(new Set(liveTemplates(g).map(t=>t.id)).size,9);assert.equal(checkGlobalState(g),null);
    assert.equal(copyForRow(g,ctx(500),"b-9er",0),null);assert.equal(copyForRow(g,ctx(500),"b-9er",11),null);assert.equal(copyForRow(g,ctx(500),"t-unbekannt",3),null);
    const own=saveTemplate(g,ctx(600),{name:"Mein Training",items:["m3_1x1"],rows:[4]});assert.equal(copyForRow(g,ctx(601),own.id,6).name,"Mein Training (6er Reihe)");
    const own2=saveTemplate(g,ctx(602),{name:"Meine 4er Reihe",items:["m3_1x1"],rows:[4]});assert.equal(copyForRow(g,ctx(603),own2.id,8).name,"Meine 8er Reihe");
    const free=saveTemplate(g,ctx(604),{name:"Frei",items:["m3_1x1"]});assert.equal(entriesOf(g).find(e=>e.id===free.id).rows1,0,"ohne feste Reihe kein Kopieren für andere Reihe");
    assert.ok(copyTemplate(g,ctx(700),"b-9er","Meine 9er Kopie"),"normales Kopieren der mitgelieferten Vorlage geht weiter");
  }finally{reset();}
});
test("Eine Reihe, die das Konto nicht übt, wird nie erweitert (auch nicht durch die mitgelieferte Vorlage)",()=>{
  reset();
  try{
    const g=newGlobal();syncCustomCamps(g,{},1);setMul({rows:[7],zero:false});
    for(let rep=0;rep<10;rep++)for(let n=1;n<=4;n++)for(const T of campUnit("c:b-9er",n).h1){
      if(T.kind==="sacks")assert.equal(T.sacks.k,7);else assert.equal(T.wheel?T.wheel.row:T.chain.row,7);
      if(T.wheel)assert.ok(T.wheel.inner.every(x=>x>=1));if(T.chain)assert.ok(T.cells.every(c=>c.fix!==0));
    }
  }finally{reset();}
});
test("Eltern-Liste: mitgeliefert ohne Bearbeiten und Löschen, mit Reihen zum Kopieren; Handler in app.js",()=>{
  const g=newGlobal(),s=prof(),a={id:s.profile.id,name:"Emil",state:s};
  reset();
  try{
    syncCustomCamps(g,s.camps,1);
    const h=tplPanelHTML({g,tpl:null,confirm:null},a,g,seg);
    assert.ok(h.includes("9er Reihe")&&h.includes("mitgeliefert"));
    assert.ok(!h.includes('data-atpledit="b-9er"')&&!h.includes('data-aask="tpldel:b-9er"'));assert.ok(h.includes('data-atplcopy="b-9er"'));
    assert.match(h,/Für andere Reihe kopieren/);
    for(const r of ALL_ROWS)if(r!==9)assert.ok(h.includes(`data-atplcopyrow="b-9er|${r}"`),"Reihe "+r);
    assert.ok(!h.includes('data-atplcopyrow="b-9er|9"'));
    assert.ok(h.includes(`data-atplon="${s.profile.id}|c:b-9er|off"`)&&h.includes(`data-atplon="${s.profile.id}|c:b-9er|on"`));
  }finally{reset();}
  const js=fs.readFileSync(ROOT+"app/js/app.js","utf8");assert.ok(js.includes("[data-atplcopyrow]")&&js.includes("copyForRow"));
});
