// Ende zu Ende für 1.7.4: die echte app.js mit Fake-DOM gegen einen echten Server.
// Die mitgelieferte Vorlage "9er Reihe" wird für eine andere Reihe kopiert (7er), eingeschaltet und von Einheit 1 bis 5 gespielt:
// Ballsäcke, Passkette, Rechenkreis vorwärts und rückwärts (alle über die Zahlenfelder), Päckchen mit Kontroll-Pfiff, Elfmeterschießen mit Feldern.
import {test} from "node:test";
import assert from "node:assert/strict";
import server from "../server/server.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// ---------- Fake-DOM (wie in v154-e2e.test.mjs) ----------
let html="",els=[];
const realSetTimeout=globalThis.setTimeout,realSetInterval=globalThis.setInterval;
globalThis.setTimeout=(fn,ms,...a)=>{const t=realSetTimeout(fn,ms>=10000&&ms%1000===0?ms/100:ms,...a);if(t&&t.unref)t.unref();return t;};
globalThis.setInterval=(fn,ms,...a)=>{const t=realSetInterval(fn,ms,...a);if(t&&t.unref)t.unref();return t;};
function parse(){
  els=[];
  for(const m of html.matchAll(/<([a-z][\w-]*)\b([^>]*)>/g)){
    const attrs={};
    for(const a of m[2].matchAll(/([\w:-]+)(?:="([^"]*)")?/g))attrs[a[1]]=a[2]===undefined?"":a[2];
    const dataset={};for(const k in attrs)if(k.startsWith("data-"))dataset[k.slice(5)]=attrs[k];
    els.push({tagName:m[1].toUpperCase(),attrs,dataset,value:attrs.value||"",onclick:null,id:attrs.id,focus(){},getAttribute:k=>attrs[k]??null});
  }
}
const root={get innerHTML(){return html;},set innerHTML(v){html=v;parse();}};
globalThis.document={
  getElementById:id=>id==="app"?root:els.find(e=>e.id===id)||null,
  querySelectorAll:sel=>{const m=/^\[([\w-]+)\]$/.exec(sel);return m?els.filter(e=>m[1] in e.attrs):[];},
  addEventListener(){},activeElement:{tagName:"BODY"},visibilityState:"visible",title:""
};
globalThis.window={addEventListener(){},scrollTo(){},location:{reload(){}}};
globalThis.sessionStorage={getItem:()=>null,setItem(){}};
const realFetch=globalThis.fetch;
let BASE="";
globalThis.fetch=(u,o)=>realFetch(String(u).startsWith("/")?BASE+u:u,o);

const sleep=ms=>new Promise(r=>realSetTimeout(r,ms));
async function until(cond,what,ms=12000){const t=Date.now();while(Date.now()-t<ms){if(cond())return;await sleep(10);}assert.fail("Zeitüberschreitung: "+what+"\n"+html.replace(/<svg[\s\S]*?<\/svg>/g,"<svg/>").slice(0,1800));}
const has=t=>html.includes(t);
const byId=id=>{const e=els.find(x=>x.id===id);assert.ok(e,"Element fehlt: #"+id);return e;};
const all=k=>els.filter(e=>k in e.dataset);
const byData=(k,v)=>{const e=els.find(x=>k in x.dataset&&(v===undefined||x.dataset[k]===v));assert.ok(e,`Element fehlt: data-${k}=${v}`);return e;};
const click=async(e,wait=20)=>{assert.equal(typeof e.onclick,"function","keine Aktion gebunden: "+JSON.stringify(e.attrs).slice(0,120));const r=e.onclick({stopPropagation(){}});await sleep(wait);return r;};
const clickId=(id,wait)=>click(byId(id),wait);
const clickData=(k,v,wait)=>click(byData(k,v),wait);
const key=k=>clickData("k",String(k),2);
const type=async digits=>{for(const d of String(digits))await key(d);await key("ok");};
const qText=()=>(/<p class="q"[^>]*>([\s\S]*?)<\/p>/.exec(html)||[])[1]||"";
const plain=q=>q.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();

// Die Lösung steht nie im DOM: der Test liest die Zeichnung (Säcke zählen, Zahlen im Kreis lesen) und rechnet selbst.
function cellsOf(svg){
  const out=[];
  for(const m of svg.matchAll(/<g data-slot="(\d+)"|fill="#e8f1ea" stroke="#16271c" stroke-width="3"\/><text[^>]*>(\d+)<\/text>/g))out.push(m[1]!==undefined?{slot:+m[1]}:{fix:+m[2]});
  return out;
}
function solveSlots(){
  const q=plain(qText());
  if(has('class="fixbox"')){ // Ballsäcke
    const n=(html.match(/<path d="M20 24/g)||[]).length,k=+/<span class="fixbox">(\d+)<\/span>/.exec(html)[1];
    return[n,n*k];
  }
  let m;
  if((m=/<svg viewBox="0 0 420 420"[\s\S]*?<\/svg>/.exec(html))){ // Passkette
    const cells=cellsOf(m[0]),row=+/(\d+)er-Reihe/.exec(q)[1],start=/beginnt mit der 0/.test(q)?0:1;
    return cells.filter(c=>c.slot!==undefined).map(c=>(start+cells.indexOf(c))*row);
  }
  if((m=/<svg viewBox="0 0 440 440"[\s\S]*?<\/svg>/.exec(html))){ // Rechenkreis
    const cells=cellsOf(m[0]),row=+/· (\d+)<\/text>/.exec(m[0])[1];
    assert.equal(cells.length,16);
    return cells[0].slot!==undefined?cells.slice(8).map(c=>c.fix/row):cells.slice(8).map((c,i)=>cells[i].fix*row);
  }
  assert.fail("unbekannte Zeichnung");
}
function solveNum(){
  const p=plain(qText());let m;
  if((m=/^(\d+) · (\d+) = \?$/.exec(p)))return +m[1]*+m[2];
  if((m=/^(\d+) : (\d+) = \?$/.exec(p)))return +m[1]/+m[2];
  assert.fail("Aufgabe nicht lösbar im Test: "+p);
}
async function answerNow(){
  if(has("slotvis")){const a=solveSlots();for(const v of a)await type(v);}
  else await type(solveNum());
}
async function playTasks(total,label){
  for(let k=1;k<=total;k++){
    await until(()=>has(`${label} · Aufgabe ${k} von ${total}`)||has(`Aufgabe ${k} von ${total}`),`${label} Aufgabe ${k}`);
    await answerNow();
    await until(()=>has('id="ovl"'),"Rückmeldung");await clickId("ovl");
  }
}

test("Ende zu Ende 1.7.4: Vorlage 9er Reihe für die 7er Reihe kopiert und alle fünf Einheiten gespielt",async()=>{
  const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),"torjaeger-e2e174-"));
  const srv=server.createServer({dataDir});
  await new Promise(r=>srv.listen(0,"127.0.0.1",r));
  BASE="http://127.0.0.1:"+srv.address().port;
  const get=async u=>(await realFetch(BASE+u)).json();
  try{
    await import("../app/js/app.js");
    await until(()=>has("Willkommen"),"Startseite ohne Konto");
    await clickId("acctNew");byId("acctName").value="Emil";byId("acctPin").value="1234";
    await clickId("acctCreate");
    await until(()=>has("Dein Spieler"),"Baukasten");
    await clickId("avSkip");
    await until(()=>has("Hallo Emil"),"Kabine");
    let id;for(let n=0;n<400&&!id;n++){const p=(await get("/api/profiles")).profiles;if(p.length)id=p[0].id;else await sleep(25);}
    assert.ok(id,"Konto auf dem Server");

    // ----- Eltern: mitgelieferte Vorlage, für die 7er Reihe kopieren, kürzere Halbzeiten, einschalten -----
    await clickId("switch");await until(()=>has("Wer spielt?"),"Wer spielt?");
    for(let n=0;n<400;n++){const s=(await get("/api/settings")).settings;if(s&&s.pin)break;await sleep(25);}
    await clickId("adminOpen");byId("adminPin").value="1234";await clickId("adminGo",150);
    await until(()=>has("Eltern-Bereich"),"Eltern-Bereich");
    await clickData("atab","settings");await until(()=>has("Eigene Trainingslager"),"Baukasten");
    assert.ok(has("9er Reihe")&&has("mitgeliefert")&&has("Für andere Reihe kopieren"));
    assert.ok(!has("data-atpledit=\"b-9er\""),"mitgelieferte Vorlage nicht bearbeitbar");
    await clickData("atplcopyrow","b-9er|7");
    await until(()=>has("Die Vorlage „7er Reihe“ ist angelegt"),"Kopie angelegt");
    const tid=/data-atpledit="(t-[a-z0-9]+)"/.exec(html)[1],camp="c:"+tid;
    await clickData("atpledit",tid);await until(()=>has("Vorlage bearbeiten"),"Editor");
    await clickData("atplset","half:5");await clickData("atplsave");
    await until(()=>has("Die Vorlage ist gespeichert"),"gespeichert");
    await clickData("atplon",`${id}|${camp}|on`);
    await clickData("aclose");await until(()=>has("Wer spielt?"),"zurück");
    await clickData("acct",id);await until(()=>has("Hallo Emil"),"Kabine 2");
    assert.ok(has("Trainingslager: 7er Reihe")&&has("0 von 5 Einheiten geschafft")&&!has("Trainingslager: 9er Reihe"),"Kachel nur für die eingeschaltete Vorlage");
    assert.ok(has("Ballsäcke")&&has("Passkette")&&has("Rechenkreis vorwärts")&&has("Rechenkreis rückwärts")&&has("Päckchen Reihe"),"fünf Einheiten");

    // ----- Einheiten 1 bis 4: je zwei Halbzeiten mit fünf Aufgaben über die Zahlenfelder -----
    for(let u=1;u<=4;u++){
      await clickData("camp",`${camp}:${u}`);
      await until(()=>has(`Trainingslager · Einheit ${u} · 1. Halbzeit · Aufgabe 1 von 5`),`Einheit ${u} startet`);
      assert.ok(has("slotvis"),"Zahlenfelder in der Zeichnung");
      await playTasks(5,`Trainingslager · Einheit ${u} · 1. Halbzeit`);
      await until(()=>has("Halbzeitpause!"),`Pause ${u}`);assert.ok(has("5 : 0"));
      await clickId("halfGo");
      await playTasks(5,`Trainingslager · Einheit ${u} · 2. Halbzeit`);
      await until(()=>has('id="penGo"'),`Ergebnis Einheit ${u}`);
      assert.ok(has("Perfektes Spiel!"),"10 von 10");
      if(u===1){ // Elfmeterschießen mit Aufgaben aus dem Lager (Ballsäcke), alle fünf Schüsse sitzen
        await clickId("penGo");
        await until(()=>has("Nachspielzeit · Aufgabe 1 von 5"),"Elfmeterschießen startet");
        assert.ok(has("slotvis"));
        await playTasks(5,"Nachspielzeit");
        await until(()=>has("Elfmeterschießen: 5 : 0"),"Ergebnis Elfmeterschießen");
        assert.ok(has("Nächste Einheit"));
      }
      await clickId("home");await until(()=>has("Hallo Emil"),`Kabine nach Einheit ${u}`);
      assert.ok(has(`${u} von 5 Einheiten geschafft`));
    }

    // ----- Einheit 5: Päckchen der Reihe mit Kontroll-Pfiff je Halbzeit -----
    await clickData("camp",`${camp}:5`);
    await until(()=>has("Einheit 5 · 1. Halbzeit · Päckchen · Aufgabe 1 von "),"Päckchen startet");
    for(const half of [1,2]){
      const N=+/Aufgabe 1 von (\d+)/.exec(html)[1];assert.ok(N>=12&&N<=16,"Päckchen mit 12 bis 16 Aufgaben: "+N);
      for(let k=1;k<=N;k++){await until(()=>has(`Aufgabe ${k} von ${N}`),`P${half}.${k}`);await type(solveNum());}
      await until(()=>has("Kontroll-Pfiff!")&&has(`Einheit 5 · ${half}. Halbzeit`),"Kontroll-Pfiff "+half);
      assert.equal([...html.matchAll(/class="cval"/g)].length,N,"alle Antworten stehen im Kontroll-Pfiff");
      if(half===1){await click(all("probe")[0]);assert.ok(has("Probe")||has("Umkehraufgabe")||has("Tauschaufgabe"));await clickId("ctlDone",60);}
      else await clickId("ctlSkip",60);
      for(let k=1;k<=N;k++){await until(()=>has('id="ovl"'),`Auswertung ${half}.${k}`);await clickId("ovl");}
      if(half===1){await until(()=>has("Halbzeitpause!"),"Pause 5");await clickId("halfGo");await until(()=>has("Einheit 5 · 2. Halbzeit · Päckchen · Aufgabe 1 von "),"2. Päckchen");}
    }
    await until(()=>has('id="penGo"'),"Ergebnis Einheit 5");
    assert.ok(has("Abzeichen")&&has("Profi: 7er Reihe"),"Abzeichen am Ende des Lagers");
    await clickId("home");await until(()=>has("Hallo Emil"),"Kabine 5");
    assert.ok(has("5 von 5 Einheiten geschafft")&&has("Profi: 7er Reihe"));

    // ----- Server-Stand: Fortschritt, Abzeichen, eingefrorene Vorlage -----
    let st;for(let n=0;n<400;n++){st=(await get(`/api/profiles/${id}/state`)).state;if(st&&st.camps&&st.camps[camp]&&st.camps[camp].badge>0)break;await sleep(25);}
    assert.ok(st.camps[camp].badge>0);assert.equal(st.meta.schemaVersion,10);
    for(const u of [1,2,3,4,5])assert.ok(st.camps[camp].units[String(u)].h1&&st.camps[camp].units[String(u)].h2,"Einheit "+u);
    assert.equal(st.camps[camp].units["1"].pen.c,5);assert.equal(st.camps[camp].def.rows[0],7);assert.equal(st.camps[camp].def.name,"7er Reihe");
  }finally{await new Promise(r=>srv.close(r));}
});
