// Ende zu Ende für 1.7.3: Baukasten "Eigenes Trainingslager" mit der echten app.js (Fake-DOM) gegen einen echten Server.
// Eltern legen eine Vorlage an und schalten sie für das Konto ein, das Kind spielt eine Einheit bis zum Ergebnis, die Vorlage wird geändert, das Lager bleibt.
import {test} from "node:test";
import assert from "node:assert/strict";
import server from "../server/server.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// ---------- Fake-DOM (wie in v153-e2e.test.mjs) ----------
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
async function until(cond,what,ms=5000){const t=Date.now();while(Date.now()-t<ms){if(cond())return;await sleep(10);}assert.fail("Zeitüberschreitung: "+what+"\n"+html.replace(/<svg[\s\S]*?<\/svg>/g,"<svg/>").slice(0,1800));}
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

// Die Lösung steht nie im DOM: der Test rechnet die Aufgabe aus dem Fragetext selbst aus (nur Einmaleins mit Mal und Geteilt).
function solve(q){
  const p=q.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();let m;
  if((m=/^(\d+) · (\d+) = \?$/.exec(p)))return +m[1]*+m[2];
  if((m=/^(\d+) : (\d+) = \?$/.exec(p)))return +m[1]/+m[2];
  assert.fail("Aufgabe nicht lösbar im Test: "+p);
}
async function playHalf(label,total){
  for(let k=1;k<=total;k++){
    await until(()=>has(`${label} · Aufgabe ${k} von ${total}`),`${label} Aufgabe ${k}`);
    await type(solve(qText()));
    await until(()=>has('id="ovl"'),"Rückmeldung");await clickId("ovl");
  }
}

test("Ende zu Ende 1.7.3: Eltern bauen ein Trainingslager, das Kind spielt eine Einheit",async()=>{
  const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),"torjaeger-e2e173-"));
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

    // ----- Eltern: Reiter Einstellungen, neue Vorlage -----
    await clickId("switch");await until(()=>has("Wer spielt?"),"Wer spielt?");
    for(let n=0;n<400;n++){const s=(await get("/api/settings")).settings;if(s&&s.pin)break;await sleep(25);}
    await clickId("adminOpen");byId("adminPin").value="1234";await clickId("adminGo",150);
    await until(()=>has("Eltern-Bereich"),"Eltern-Bereich");
    await clickData("atab","settings");
    await until(()=>has("Eigene Trainingslager"),"Baukasten-Abschnitt");
    assert.ok(has("Teilen mit Rest")&&has("data-atplnew"),"Liste mit der mitgelieferten Vorlage und Neu-Taste");
    await clickData("atplnew");
    await until(()=>has("Neue Vorlage")&&has('id="tplName"'),"Editor");
    assert.ok(has("1. Wie viele Aufgaben?")&&has("2. Welche Fächer?")&&!has('data-atplitem="d3_ie"'),"Schritte, Deutsch noch nicht gewählt");
    await clickData("atplfach","Deutsch");assert.ok(has('data-atplitem="d3_ie"'),"Deutsch zeigt seine Themen");
    await clickData("atplall","Deutsch|on");assert.ok(has("von")&&has('aria-pressed="true"'));
    await clickData("atplfach","Deutsch");assert.ok(!has('data-atplitem="d3_ie"'),"Deutsch wieder aus, seine Themen sind weg");
    byId("tplName").value="9er Reihe";
    await clickData("atplrow","9");await clickData("atplset","units:2");await clickData("atplset","half:5");await clickData("atplset","bonus:none");
    await clickData("atplsave");
    await until(()=>has("Die Vorlage ist gespeichert"),"Vorlage gespeichert");
    assert.ok(has("9er Reihe")&&has("2 Einheiten, 5 Aufgaben je Halbzeit, Keine Nachspielzeit, Reihen 9"),"Zusammenfassung");
    const tid=/data-atpledit="(t-[a-z0-9]+)"/.exec(html)[1],camp="c:"+tid;
    // auf dem Server (global) angekommen
    for(let n=0;n<400;n++){const s=(await get("/api/settings")).settings;if(s&&(s.templates||[]).some(x=>x.id===tid))break;await sleep(25);}
    assert.ok(((await get("/api/settings")).settings.templates||[]).some(x=>x.id===tid&&x.name==="9er Reihe"),"Vorlage ist global abgeglichen");
    // für das Konto einschalten
    await clickData("atplon",`${id}|${camp}|on`);
    assert.ok(has(`data-atplon="${id}|${camp}|on" aria-pressed="true"`)||has("aria-pressed=\"true\""),"Schalter an");
    await clickData("aclose");await until(()=>has("Wer spielt?"),"zurück");
    await clickData("acct",id);await until(()=>has("Hallo Emil"),"Kabine 2");
    assert.ok(has("Trainingslager: 9er Reihe")&&has("0 von 2 Einheiten geschafft")&&has("2 Halbzeiten.")&&!has("Nachspielzeit"),"Kachel ohne Nachspielzeit");

    // ----- Einheit 1 spielen -----
    await clickData("camp",camp+":1");
    await until(()=>has("Trainingslager · Einheit 1 · 1. Halbzeit · Aufgabe 1 von 5"),"Einheit startet mit 5 Aufgaben");
    await playHalf("Trainingslager · Einheit 1 · 1. Halbzeit",5);
    await until(()=>has("Halbzeitpause!"),"Halbzeitpause");
    assert.ok(has("5 : 0"));
    await clickId("halfGo");
    await playHalf("Trainingslager · Einheit 1 · 2. Halbzeit",5);
    await until(()=>has("Zur Kabine")&&has("Nächste Einheit"),"Ergebnis mit Nächste Einheit (keine Nachspielzeit)");
    assert.ok(!has("id=\"penGo\""),"kein Elfmeterschießen");
    // der Server hat den Fortschritt und die eingefrorene Vorlage
    let st;for(let n=0;n<400;n++){st=(await get(`/api/profiles/${id}/state`)).state;if(st&&st.camps&&st.camps[camp]&&st.camps[camp].units&&st.camps[camp].units["1"])break;await sleep(25);}
    assert.equal(st.meta.schemaVersion,10);assert.equal(st.camps[camp].on,true);assert.equal(st.camps[camp].units["1"].h1.c,5);assert.equal(st.camps[camp].def.units,2);assert.equal(st.camps[camp].def.name,"9er Reihe");

    // ----- Eltern ändern die Vorlage (3 Einheiten): das begonnene Lager bleibt bei 2 Einheiten -----
    await clickId("home");await until(()=>has("Hallo Emil"),"Kabine 3");
    await clickId("switch");await until(()=>has("Wer spielt?"),"Wer spielt? 2");
    await clickId("adminOpen");byId("adminPin").value="1234";await clickId("adminGo",150);
    await until(()=>has("Eltern-Bereich"),"Eltern-Bereich 2");
    await clickData("atab","settings");await until(()=>has("Eigene Trainingslager"),"Baukasten 2");
    await clickData("atpledit",tid);await until(()=>has("Vorlage bearbeiten"),"Editor 2");
    await clickData("atplset","units:3");await clickData("atplsave");
    await until(()=>has("Die Vorlage ist gespeichert"),"geändert gespeichert");
    assert.ok(has("3 Einheiten"),"Liste zeigt die neue Vorlage");
    await clickData("aclose");await until(()=>has("Wer spielt?"),"zurück 2");
    await clickData("acct",id);await until(()=>has("Hallo Emil"),"Kabine 4");
    assert.ok(has("1 von 2 Einheiten geschafft"),"das laufende Lager bleibt bei 2 Einheiten");
  }finally{await new Promise(r=>srv.close(r));}
});
