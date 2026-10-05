// Version 1.7.1 (C1): Einmaleins-Grenze je Konto (Reihen 1 bis 10, auch mal 0, Ergebnis höchstens 100, Faktor höchstens 10)
import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {fileURLToPath} from "node:url";
import {SCHEMA_VERSION,migrateProfile,checkProfileState,newProfile} from "../app/js/model.js";
import {ALL_TOPICS} from "../app/js/content.js";
import {setMul,getMul,normMul,mulOf,mulOk,defaultMul,ALL_ROWS,MUL_MAX_RESULT} from "../app/js/mul.js";
import {applyMulRow,applyMulZero} from "../app/js/rules.js";
import {GEN} from "../app/js/generators.js";
import {packOf} from "../app/js/check.js";
import {campTask,campHalf,penaltyTasks} from "../app/js/camp.js";
import {miniTasks,memoryPair,wallOptions} from "../app/js/mini.js";
import {mulPanel} from "../app/js/admin.js";

const ROOT=fileURLToPath(new URL("..",import.meta.url));
const fx=f=>JSON.parse(fs.readFileSync(ROOT+"test/fixtures/"+f,"utf8"));
const plain=q=>String(q).replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
const prof=()=>newProfile({id:"k-emil0001",name:"Emil",deviceId:"d1",now:1000,topics:ALL_TOPICS});
const RUNS=100;
const SETS=[[9],[1],[10],[7,8],[2,5],[3,4,6],ALL_ROWS];

test("Schema ist 9, Standard ist alle Reihen und 0 an, ungültige Werte werden bereinigt",()=>{
  assert.equal(SCHEMA_VERSION,9);
  assert.deepEqual(defaultMul(),{rows:ALL_ROWS,zero:true});
  assert.deepEqual(normMul(undefined),defaultMul());
  assert.deepEqual(normMul({rows:[],zero:false}),{rows:ALL_ROWS,zero:false});
  assert.deepEqual(normMul({rows:[9,3,3,0,11,"x",7.5]}),{rows:[3,9],zero:true});
  assert.deepEqual(mulOf({settings:{mul:{rows:[4],zero:false}}}),{rows:[4],zero:false});
  assert.deepEqual(mulOf({}),defaultMul());
  assert.equal(MUL_MAX_RESULT,100);
});
test("Migration 8 nach 9 aus dem Format 1.6.7 verliert nichts, setzt die Vorgabe und lässt die Eingabe unverändert",()=>{
  const old=fx("state-v8.json"),copy=JSON.parse(JSON.stringify(old));
  const s=migrateProfile(old);
  assert.deepEqual(old,copy,"Eingabe unverändert");
  assert.equal(s.meta.schemaVersion,9);assert.deepEqual(s.settings.mul,defaultMul());assert.equal(checkProfileState(s),null);
  const a=JSON.parse(JSON.stringify(s));delete a.settings.mul;a.meta.schemaVersion=8;
  assert.deepEqual(a,copy,"alles andere bleibt gleich");
  assert.deepEqual(migrateProfile(s),s,"zweimal migrieren ändert nichts");
  const o2=JSON.parse(JSON.stringify(copy));o2.settings.mul={rows:[9],zero:false};o2.settings.extra="bleibt";
  const m2=migrateProfile(o2);assert.deepEqual(m2.settings.mul,{rows:[9],zero:false});assert.equal(m2.settings.extra,"bleibt");
});
test("Alle älteren Fixtures gehen bis Schema 9 durch",()=>{
  for(const f of ["state-v1.json","state-v2.json","state-v3.json","state-v4.json","state-v5.json","state-v6.json","state-v7.json","state-v8.json"]){
    const m=migrateProfile(fx(f));assert.equal(m.meta.schemaVersion,9,f);assert.deepEqual(m.settings.mul,defaultMul(),f);assert.equal(checkProfileState(m),null,f);
  }
});
test("Der Server-Check lehnt eine kaputte Einstellung ab",()=>{
  const s=prof();s.settings.mul=5;assert.match(checkProfileState(s),/mul/);
});
test("Eltern: Reihe an und aus (mindestens eine bleibt), 0 an und aus, Stempel gesetzt",()=>{
  const s=prof(),ctx={deviceId:"d1",now:5000};
  assert.ok(applyMulRow(s,ctx,9,false));assert.ok(!mulOf(s).rows.includes(9));assert.equal(s.settings.t,5000);
  for(const r of ALL_ROWS.filter(x=>x!==4))applyMulRow(s,ctx,r,false);
  assert.deepEqual(mulOf(s).rows,[4]);
  assert.equal(applyMulRow(s,ctx,4,false),false,"die letzte Reihe bleibt");assert.deepEqual(mulOf(s).rows,[4]);
  assert.ok(applyMulRow(s,ctx,7,true));assert.deepEqual(mulOf(s).rows,[4,7]);
  assert.equal(applyMulRow(s,ctx,11,true),false);assert.equal(applyMulRow(s,ctx,0,true),false);
  applyMulZero(s,ctx,false);assert.equal(mulOf(s).zero,false);assert.deepEqual(mulOf(s).rows,[4,7]);
  applyMulZero(s,ctx,true);assert.equal(mulOf(s).zero,true);
});
test("Der Eltern-Bereich zeigt die Reihen 1 bis 10 und den Schalter für die 0",()=>{
  const s=prof();applyMulRow(s,{deviceId:"d",now:2},9,false);
  const h=mulPanel({name:"Emil",state:s});
  for(const r of ALL_ROWS)assert.match(h,new RegExp(`data-amul="row:${r}:(on|off)"`));
  assert.match(h,/data-amul="row:9:on"[^>]*aria-pressed="false"/);assert.match(h,/data-amul="row:8:off"[^>]*aria-pressed="true"/);
  assert.match(h,/data-amul="zero:on"/);assert.match(h,/data-amul="zero:off"/);
  const js=fs.readFileSync(ROOT+"app/js/app.js","utf8");
  assert.match(js,/\[data-amul\]/);assert.match(js,/setMul\(mulOf\(s\)\)/);
  assert.ok(fs.readFileSync(ROOT+"app/sw.js","utf8").includes('"js/mul.js"'));
});

// ---- Grenze in den Aufgaben ----
// Prüft eine Mal- oder Geteilt-Aufgabe der Form "a · b = ?" oder "a : b = ?": ganze Zahlen, höchstens 10, Ergebnis höchstens 100, eine Zahl in den Reihen.
function checkQ(T,label){
  const q=plain(T.q);let m;
  if((m=/^(\d+) · (\d+) = \?$/.exec(q))){assert.ok(mulOk(+m[1],+m[2]),label+": "+q);assert.equal(T.a,m[1]*m[2],label);return true;}
  if((m=/^(\d+) : (\d+) = \?$/.exec(q))){const n=+m[1],d=+m[2];assert.ok(d>=1&&n%d===0,label+" teilbar: "+q);assert.ok(mulOk(n/d,d),label+": "+q);assert.equal(T.a,n/d,label);return true;}
  return false;
}
// Aufgabe mit Rest: Teiler aus den Reihen (wenn es dort einen Teiler ab 2 gibt), Ergebnis höchstens 10, Rest kleiner als der Teiler
function checkRest(a,b,q,r,rows,label){
  assert.equal(a,b*q+r,label);assert.ok(r<b,label+" Rest kleiner als Teiler");assert.ok(q<=10,label+" Ergebnis höchstens 10: "+a+":"+b);assert.ok(a<=MUL_MAX_RESULT,label);
  if(rows.some(x=>x>=2))assert.ok(rows.includes(b),label+" Teiler "+b+" nicht in "+rows);
}
for(const rows of SETS)for(const zero of [true,false]){
  const tag=`Reihen ${rows.join(",")}, 0 ${zero?"an":"aus"}`;
  test(`Einmaleins, Teilen mit Rest, Sachaufgaben, Punktefeld und Päckchen halten die Grenze (${tag})`,()=>{
    setMul({rows,zero});assert.deepEqual(getMul(),{rows:[...rows].sort((a,b)=>a-b),zero});
    try{
      let withZero=0;
      for(let i=0;i<RUNS;i++){
        const T=GEN.m3_1x1();assert.ok(checkQ(T,"m3_1x1"),"Form: "+T.q);if(/^0 · |· 0 =|^0 :/.test(plain(T.q)))withZero++;
        const R=GEN.m3_rest();checkRest(R.inv.y*R.a[0]+R.a[1],R.inv.y,R.a[0],R.a[1],rows,"m3_rest");
        const S=GEN.m3_sach(),m=/(\d+) : (\d+) = (\d+) Rest (\d+)/.exec(S.ex);assert.ok(m,"Sach: "+S.ex);checkRest(+m[1],+m[2],+m[3],+m[4],rows,"m3_sach");
        const M=GEN.m_mal(),mm=/(\d+) Reihen mit je (\d+) Punkten/.exec(M.ex);assert.ok(mm);assert.ok(+mm[1]<=10&&+mm[2]<=10&&mm[1]*mm[2]<=100);
        if(rows.length<10)assert.ok(rows.includes(+mm[1])||rows.includes(+mm[2]),"m_mal: "+M.ex+" "+rows);
        if(M.type==="choice")for(const c of M.choices){const f=/^(\d+) · (\d+)$/.exec(c);if(f)assert.ok(+f[1]<=10&&+f[2]<=10&&f[1]*f[2]<=100,"Antwort "+c);}
      }
      if(!zero)assert.equal(withZero,0,"keine 0, wenn aus");
      for(let i=0;i<40;i++){
        for(const t of ["m3_1x1","m3_rest"])for(const T of packOf(t)){
          if(t==="m3_1x1")assert.ok(checkQ(T,"Päckchen 1x1"),T.q);
          else checkRest(T.inv.y*T.a[0]+T.a[1],T.inv.y,T.a[0],T.a[1],rows,"Päckchen Rest");
        }
      }
    }finally{setMul(defaultMul());}
  });
}
test("Mit 0 an kommt die 0 vor, bei den Standardreihen auch die 10er-Reihe",()=>{
  setMul(defaultMul());let z=0,ten=0;
  for(let i=0;i<600;i++){const q=plain(GEN.m3_1x1().q);if(/^0 |[·:] 0 =/.test(q))z++;if(/(^10 )|( 10 =)/.test(q))ten++;}
  assert.ok(z>0&&ten>0,`0: ${z}, 10: ${ten}`);
});
test("Trainingslager (alle Einheiten), Päckchen-Einheit und Nachspielzeit halten die Grenze",()=>{
  for(const rows of [[9],[2,5],[10],[1],ALL_ROWS]){
    setMul({rows,zero:false});
    try{
      for(let i=0;i<10;i++)for(const n of [1,2,3,4,5]){
        for(const half of [1,2]){
          for(const T of [campTask("m3_rest",n,half)].concat(campHalf("m3_rest",n,half),penaltyTasks("m3_rest",n))){
            if(T.type==="pair"){const b=T.inv.y;checkRest(b*T.a[0]+T.a[1],b,T.a[0],T.a[1],rows,"Lager "+n);}
            else if(T.topic==="m3_sach"||/Rest/.test(T.ex)){const m=/(\d+) : (\d+) = (\d+) Rest (\d+)/.exec(T.ex);assert.ok(m,T.ex);checkRest(+m[1],+m[2],+m[3],+m[4],rows,"Lager Sach");}
            else{
              const w=/Wie oft passt die (\d+) in die (\d+)/.exec(plain(T.q));
              if(w){const b=+w[1],a=+w[2];assert.ok(a%b===0&&a/b<=10&&a<=100&&b<=10);if(rows.some(x=>x>=2))assert.ok(rows.includes(b),"Teiler "+b);}
              else if(rows.some(x=>x>=2))assert.ok(checkQ(T,"Lager 1"),plain(T.q));
              else assert.ok(Number.isInteger(T.a)&&T.a<=10,"nur Reihe 1: Teiler fällt auf 2 bis 5 zurück, Ergebnis bleibt klein");
            }
          }
        }
      }
    }finally{setMul(defaultMul());}
  }
});
test("Mini-Spiele (Torwand, Memory) und Mix ziehen nur Aufgaben in der Grenze",()=>{
  setMul({rows:[9],zero:false});
  try{
    const s=prof();
    for(let i=0;i<40;i++){
      for(const T of miniTasks(s,1,5,Math.random,wallOptions).map(x=>x.T)){const q=plain(T.q);if(/^\d+ [·:] \d+ = \?$/.test(q))assert.ok(checkQ(T,"Torwand"),q);}
      for(const T of miniTasks(s,1,5,Math.random,memoryPair).map(x=>x.T)){const q=plain(T.q);if(/^\d+ [·:] \d+ = \?$/.test(q))assert.ok(checkQ(T,"Memory"),q);}
    }
  }finally{setMul(defaultMul());}
});
