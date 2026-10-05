// Version 1.7.2 (C2): Aufgabenarten zur Reihe (Ballsäcke, Passkette, Rechenkreis vorwärts und rückwärts, Päckchen Reihe)
import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {fileURLToPath} from "node:url";
import {setMul,defaultMul,mulOk,ALL_ROWS} from "../app/js/mul.js";
import {sacksTask,chainTask,wheelTask,rowPackTasks,rowTask,varietyTask,ROW_KINDS,SLOT_KINDS,WHEEL_N,CHAIN_N,ROWPACK_MIN,ROWPACK_MAX} from "../app/js/rowtasks.js";
import {slotsHTML,sacksSVG} from "../app/js/slots.js";
import {isRight,givenText,probeOf,packOf,keyOf} from "../app/js/check.js";
import {rightText} from "../app/js/coach.js";
import {GEN} from "../app/js/generators.js";

const ROOT=fileURLToPath(new URL("..",import.meta.url));
const plain=q=>String(q).replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
const noDigits=s=>!/\d/.test(String(s));
const slotsOf=T=>[].concat(T.cells.inner||[],T.cells.outer||[],Array.isArray(T.cells)?T.cells:[]).filter(c=>c.slot!==undefined).map(c=>c.slot);
const G=(T,extra={})=>Object.assign({task:T,inp:T.a.map(()=>""),act:0,done:false,given:null},extra);

test("Ballsäcke: n Säcke zu je k Bällen, zwei Felder (Anzahl und Ergebnis), k steht auf jedem Sack",()=>{
  for(let row=1;row<=10;row++)for(let i=0;i<40;i++){
    const T=sacksTask(row),{n,k}=T.sacks;
    assert.equal(T.type,"slots");assert.equal(k,row);assert.ok(n>=1&&n<=10);assert.deepEqual(T.a,[n,n*k]);assert.ok(n*k<=100);
    assert.deepEqual(slotsOf(T),[0,1]);assert.ok(T.cells.some(c=>c.fix===k));
    const svg=sacksSVG(n,k);assert.equal((svg.match(/<path d="M20 24/g)||[]).length,n,"Säcke zählbar");
    assert.equal((svg.match(new RegExp(`>${k}</text>`,"g"))||[]).length,n,"Zahl auf jedem Sack");
  }
});
test("Passkette: 10 Kreise der Reihe, ein oder zwei Werte vorgegeben, Variante mit 0 am Anfang",()=>{
  let withZero=0;
  for(let row=1;row<=10;row++)for(let i=0;i<40;i++){
    const zero=i%2===0,T=chainTask(row,zero);
    assert.equal(T.cells.length,CHAIN_N);
    const vals=T.cells.map((c,j)=>c.fix!==undefined?c.fix:null),given=vals.filter(v=>v!==null);
    assert.ok(given.length===1||given.length===2);
    const start=zero?0:1,full=[...Array(CHAIN_N).keys()].map(j=>(start+j)*row);
    T.cells.forEach((c,j)=>{if(c.fix!==undefined)assert.equal(c.fix,full[j]);});
    assert.deepEqual(T.a,full.filter((_,j)=>T.cells[j].slot!==undefined));assert.deepEqual(slotsOf(T),T.a.map((_,j)=>j));
    assert.ok(Math.max(...full)<=100);if(zero){withZero++;assert.equal(full[0],0);}
    assert.equal(new Set(T.a).size,T.a.length,"jede Zahl nur einmal");
  }
  assert.ok(withZero>0);
});
test("Rechenkreis: Mitte mal k, 8 verschiedene Zahlen innen, vorwärts außen gesucht, rückwärts innen gesucht",()=>{
  for(let row=1;row<=10;row++)for(const back of [false,true])for(let i=0;i<30;i++){
    const T=wheelTask(row,back),{inner,outer}=T.wheel;
    assert.equal(inner.length,WHEEL_N);assert.equal(new Set(inner).size,WHEEL_N,"Zahlen innen verschieden");
    assert.deepEqual(outer,inner.map(x=>x*row));assert.ok(inner.every(x=>x>=0&&x<=10)&&outer.every(x=>x<=100));
    assert.equal(T.kind,back?"wheelback":"wheel");
    assert.deepEqual(T.a,back?inner:outer);assert.deepEqual(slotsOf(T),[...Array(WHEEL_N).keys()]);
    const hidden=back?T.cells.inner:T.cells.outer,shown=back?T.cells.outer:T.cells.inner;
    assert.ok(hidden.every(c=>c.slot!==undefined)&&shown.every(c=>c.fix!==undefined));
    assert.deepEqual(shown.map(c=>c.fix),back?outer:inner);
    if(back)assert.equal(new Set(outer).size,WHEEL_N,"rückwärts ist eindeutig (Mitte größer als 0)");
  }
});
test("Päckchen Reihe: 12 bis 16 verschiedene Aufgaben, Tauschaufgaben, mal 1, mal 10, mal 0 nur mit Schalter",()=>{
  for(const zero of [true,false]){
    setMul({rows:ALL_ROWS,zero});
    try{
      for(let row=1;row<=10;row++)for(let i=0;i<25;i++){
        const L=rowPackTasks(row),qs=L.map(T=>plain(T.q));
        assert.ok(L.length>=ROWPACK_MIN&&L.length<=ROWPACK_MAX,"Länge "+L.length);assert.equal(new Set(qs).size,qs.length,"keine Aufgabe doppelt");
        for(const T of L){assert.equal(T.type,"num");const m=/^(\d+) ([·:]) (\d+) = \?$/.exec(plain(T.q));assert.ok(m,T.q);
          const a=+m[1],b=+m[3];
          if(m[2]==="·"){assert.ok(a<=10&&b<=10&&a*b<=100&&(a===row||b===row));assert.equal(T.a,a*b);}
          else{assert.ok(b>=1&&a%b===0&&a<=100);assert.equal(T.a,a/b);assert.ok(a/b===row||b===row);}
          if(!zero)assert.ok(!/(^0 )|( 0 =)|(· 0)/.test(plain(T.q)),"keine 0: "+T.q);}
        assert.ok(qs.some(q=>q===`1 · ${row} = ?`||q===`${row} · 1 = ?`),"mal 1");
        assert.ok(qs.some(q=>q===`10 · ${row} = ?`||q===`${row} · 10 = ?`),"mal 10");
        if(zero)assert.ok(qs.some(q=>q===`0 · ${row} = ?`||q===`${row} · 0 = ?`),"mal 0");
        const swap=qs.some(q=>{const m=/^(\d+) · (\d+) = \?$/.exec(q);return m&&m[1]!==m[2]&&qs.includes(`${m[2]} · ${m[1]} = ?`);});assert.ok(swap,"mit Tauschaufgabe");
      }
    }finally{setMul(defaultMul());}
  }
});
test("Jede Art ist für jede Reihe lösbar und die Prüfung erkennt richtig und falsch",()=>{
  for(let row=1;row<=10;row++)for(const kind of SLOT_KINDS)for(let i=0;i<15;i++){
    const T=rowTask(kind,row);
    assert.ok(isRight(T,T.a.map(String)),"richtige Antwort wird erkannt: "+kind);
    assert.ok(isRight(T,T.a.slice()),"auch als Zahlen");
    const bad=T.a.map(String);bad[bad.length-1]=String(T.a[T.a.length-1]+1);assert.ok(!isRight(T,bad));
    const part=T.a.map(String);part[0]="";assert.ok(!isRight(T,part),"leeres Feld zählt nicht");
    assert.ok(!isRight(T,T.a.slice(1).map(String)),"zu kurz");assert.ok(!isRight(T,""));assert.ok(!isRight(T,null));
    assert.match(rightText(T),/\d/);assert.match(givenText(T,T.a.map(String)),/\d/);assert.equal(givenText(T,["","1"].concat(T.a.slice(2).map(String))).includes("?"),true);
    assert.ok(noDigits(T.hint),"Tipp ohne Zahlen (keine Lösung): "+T.hint);assert.ok(noDigits(probeOf(T,T.a).html),"Probe ohne Zahlen");assert.ok(!/\d/.test(probeOf(T,T.a).name));
    assert.ok(typeof T.sig==="string"&&keyOf(T).includes(T.sig));
  }
  assert.deepEqual(ROW_KINDS,["sacks","chain","wheel","wheelback","pack"]);
});
test("Mit Einmaleins-Grenze: nur gewählte Reihen, keine 0 wenn aus",()=>{
  setMul({rows:[9],zero:false});
  try{
    for(let i=0;i<120;i++){
      const T=varietyTask();assert.equal(T.row,9);
      if(T.kind==="sacks")assert.equal(T.sacks.k,9);
      if(T.kind==="chain")assert.ok(T.cells.every(c=>c.fix===undefined||c.fix>0)&&T.a.every(v=>v>0&&v%9===0));
      if(T.wheel)assert.ok(T.wheel.inner.every(x=>x>=1)&&T.wheel.outer.every(x=>x%9===0&&x>=9));
    }
    for(const T of rowPackTasks()){const m=/^(\d+) ([·:]) (\d+) = \?$/.exec(plain(T.q)),a=+m[1],b=+m[3];assert.ok(m[2]==="·"?(a===9||b===9):(b===9||a/b===9),T.q);}
  }finally{setMul(defaultMul());}
  setMul({rows:[9],zero:true});
  try{let z=0;for(let i=0;i<400;i++){const T=varietyTask();if(T.kind==="chain"&&T.cells[0].fix===0)z++;if(T.wheel&&T.wheel.inner.includes(0))z++;}assert.ok(z>0,"0 kommt mit Schalter vor");}finally{setMul(defaultMul());}
});
test("Einmaleins mit Abwechslung: GEN ohne Option bleibt Zahlenaufgabe, mit Option kommen auch die neuen Arten",()=>{
  for(let i=0;i<200;i++)assert.equal(GEN.m3_1x1().type,"num");
  const kinds=new Set();for(let i=0;i<600;i++){const T=GEN.m3_1x1({variety:true});kinds.add(T.type==="slots"?T.kind:"num");}
  assert.deepEqual([...kinds].sort(),["chain","num","sacks","wheel","wheelback"]);
  const L=packOf("m3_1x1",undefined,{rowPack:true,row:7});assert.ok(L.length>=12&&L.length<=16);assert.ok(L.every(T=>T.topic==="m3_1x1"));
  assert.equal(packOf("m3_1x1").length,5,"das gewohnte Päckchen bleibt");
});
test("Darstellung: jedes Feld ist antippbar (data-slot), feste Zahlen stehen da, aktives Feld, richtig und falsch nach der Antwort",()=>{
  for(const kind of SLOT_KINDS){
    const T=rowTask(kind,9),h=slotsHTML(T,G(T));
    for(let j=0;j<T.a.length;j++)assert.match(h,new RegExp(`data-slot="${j}"`));
    assert.equal((h.match(/data-slot=/g)||[]).length,T.a.length,"genau so viele Felder wie Antworten");
    assert.match(h,/stroke="#2f6fde"|class="ans slotbox act/,"aktives Feld");
    const solved=slotsHTML(T,G(T,{done:true,given:T.a.map(String)}));assert.ok(!/#ffd9d4/.test(solved)&&!/slotbox [^"]*wrong/.test(solved));assert.match(solved,/#d7f5df|slotbox [^"]*right/);
    const wrong=slotsHTML(T,G(T,{done:true,given:T.a.map(()=>"")}));assert.match(wrong,/#ffd9d4|slotbox [^"]*wrong/);
  }
  const T=wheelTask(9,false),h=slotsHTML(T,G(T));
  for(const x of T.wheel.inner)assert.ok(h.includes(`>${x}</text>`),"Zahl innen "+x);assert.ok(h.includes("· 9"));
  const S=sacksTask(7);assert.ok(slotsHTML(S,G(S)).includes('class="pairrow slotsrow"'));
});
test("Anbindung: Eingabe, Zahlenblock, Service Worker, Versionen",()=>{
  const js=fs.readFileSync(ROOT+"app/js/app.js","utf8"),sw=fs.readFileSync(ROOT+"app/sw.js","utf8");
  assert.match(js,/T\.type==="slots"\?T\.a\.map\(\(\)=>""\)/);assert.match(js,/G\.fresh/);assert.match(js,/rowPack:Math\.random\(\)<\.25/);
  assert.ok(sw.includes('"js/rowtasks.js"')&&sw.includes('"js/slots.js"'));
  const views=fs.readFileSync(ROOT+"app/js/views.js","utf8");assert.match(views,/T\.type==="slots"/);
});
