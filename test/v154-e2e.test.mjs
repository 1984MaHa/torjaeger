// Ende zu Ende für 1.5.4: die echte app.js mit Fake-DOM gegen einen echten Server.
// Trainingslager einschalten (Eltern), Einheit 1 mit Halbzeitpause, Sichern und Fortsetzen mitten in der 2. Halbzeit, Elfmeterschießen,
// Freischalten der Einheiten, Einheit 4 als Päckchen mit Kontroll-Pfiff, Neustart durch die Eltern.
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

// Die Lösung steht nie im DOM: der Test rechnet die Aufgabe aus dem Fragetext selbst aus.
function solve(q){
  let m;
  if((m=/Wie oft passt die <mark>(\d+)<\/mark> in die <mark>(\d+)<\/mark>/.exec(q)))return{num:+m[2]/+m[1]};
  if((m=/^\s*(\d+) : (\d+) = \? <mark>Rest<\/mark>/.exec(q)))return{pair:[Math.floor(+m[1]/+m[2]),+m[1]%+m[2]],b:+m[2]};
  if((m=/^\s*(\d+) : (\d+) = \?/.exec(q)))return{num:+m[1]/+m[2]};
  const n=[...q.replace(/<[^>]+>/g," ").matchAll(/\d+/g)].map(x=>+x[0]),a=Math.max(...n),b=Math.min(...n);
  return{num:/braucht man/.test(q)?Math.floor(a/b)+1:Math.floor(a/b)};
}
// Eine Antwort eintippen. wrong: absichtlich falsch (bei Aufgaben mit Rest ist der Rest dann so groß wie der Teiler).
async function answerNow(wrong){
  const S=solve(qText());
  if(S.pair){await type(S.pair[0]);await type(wrong?S.b:S.pair[1]);}
  else await type(wrong?S.num+1:S.num);
  return S;
}
// Rückmeldung wegklicken: richtig = Overlay antippen, falsch = Taste „Weiter“ bzw. „Abpfiff“ / „Halbzeitpause“
async function afterAnswer(wrong,{expectNote}={}){
  await until(()=>has('id="ovl"')||has('id="next"'),"Rückmeldung");
  if(wrong){assert.ok(has('id="next"'),"falsch: Weiter-Taste");if(expectNote)assert.ok(has("Da passt noch einer rein"),"freundliche Rückmeldung");await clickId("next");}
  else await clickId("ovl");
}
// Aufgaben k bis n einer Halbzeit spielen. wrongAt: Nummern (ab 1), die falsch beantwortet werden.
async function playTasks(from,to,total,wrongAt=[],opts){
  for(let k=from;k<=to;k++){
    await until(()=>has(`Aufgabe ${k} von ${total}`),`Aufgabe ${k}`);
    const wrong=wrongAt.includes(k);
    await answerNow(wrong);
    await afterAnswer(wrong,opts);
  }
}

test("Ende zu Ende 1.5.4: Trainingslager von den Eltern bis zum Elfmeterschießen",async()=>{
  const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),"torjaeger-e2e154-"));
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
    let id;for(let n=0;n<300&&!id;n++){const p=(await get("/api/profiles")).profiles;if(p.length)id=p[0].id;else await sleep(20);}
    assert.ok(id,"Konto auf dem Server");
    assert.ok(!has("Trainingslager"),"Standard: aus, keine Kachel");

    // ----- Eltern schalten das Trainingslager ein -----
    await clickId("switch");await until(()=>has("Wer spielt?"),"Wer spielt?");
    await clickId("adminOpen");byId("adminPin").value="1234";await clickId("adminGo",150);
    await until(()=>has("Eltern-Bereich"),"Eltern-Bereich");
    await clickData("atab","settings");
    assert.ok(has("Trainingslager: Teilen mit Rest")&&has("Trainingslager neu starten")&&has("0 von 5 Einheiten"));
    await clickData("acamp","m3_rest:on");
    assert.ok(has('aria-pressed="true"'));
    await clickData("aclose");await until(()=>has("Wer spielt?"),"zurück");
    await clickData("acct",id);await until(()=>has("Hallo Emil"),"Kabine 2");
    assert.ok(has("Trainingslager: Teilen mit Rest")&&has("Einheit 1 von 5")&&has("0 von 5 Einheiten geschafft"),"Kachel mit Fortschritt");
    assert.ok(/data-camp="m3_rest:2"[^>]*disabled/.test(html),"Einheit 2 ist gesperrt");
    await click(byData("camp","m3_rest:2"));
    assert.ok(has("Hallo Emil")&&!has("Halbzeit · Aufgabe"),"gesperrte Einheit startet nicht");

    // ----- Einheit 1: 1. Halbzeit, dritte und achte Aufgabe falsch -----
    await clickData("camp","m3_rest:1");
    await until(()=>has("Trainingslager · Einheit 1 · 1. Halbzeit · Aufgabe 1 von 10"),"Einheit 1 startet");
    await playTasks(1,10,10,[3,8]);
    await until(()=>has("Halbzeitpause!"),"Halbzeitpause");
    assert.ok(has("8 : 2")&&has("8 Tore und 2 Fehlschüsse")&&has("2. Halbzeit anpfeifen"),"Zwischenstand 8 : 2");
    assert.ok(has("Trainer"),"Trainer-Satz");
    // in der Pause die Kabine antippen: Angebot zum Weiterspielen
    await clickId("home");await until(()=>has("Hallo Emil")&&has("Trainingslager weiterspielen?"),"Angebot in der Pause");
    assert.ok(has("Halbzeitpause")&&has("Stand 8 : 2"));
    await clickId("campResume");await until(()=>has("Halbzeitpause!"),"wieder in der Pause");
    await clickId("halfGo");
    await until(()=>has("Trainingslager · Einheit 1 · 2. Halbzeit · Aufgabe 1 von 10"),"2. Halbzeit");
    assert.ok(/<em>8<\/em> : <em>2<\/em>/.test(html),"der Spielstand zählt beide Halbzeiten");

    // ----- mitten in der 2. Halbzeit verlassen und fortsetzen -----
    await playTasks(1,4,10,[2]);
    await until(()=>has("Aufgabe 5 von 10"),"Aufgabe 5");
    await clickId("home");
    await until(()=>has("Trainingslager weiterspielen?"),"Angebot mitten in der 2. Halbzeit");
    assert.ok(has("2. Halbzeit")&&has("Stand 11 : 3"),"Stand genannt: 8 : 2 plus 3 : 1");
    await clickId("campResume");
    await until(()=>has("2. Halbzeit · Aufgabe 5 von 10"),"weiter bei Aufgabe 5");
    assert.ok(/<em>11<\/em> : <em>3<\/em>/.test(html));
    // „Neu anfangen“ startet die Einheit frisch; danach wieder bis zum Stand der 2. Halbzeit
    await clickId("home");await until(()=>has("Trainingslager weiterspielen?"),"Angebot");
    await clickId("campDrop");
    await until(()=>has("Einheit 1 · 1. Halbzeit · Aufgabe 1 von 10"),"neu angefangen: wieder 1. Halbzeit");
    await playTasks(1,10,10,[3,8]);
    await until(()=>has("Halbzeitpause!"),"Pause 2");await clickId("halfGo");
    await playTasks(1,10,10,[2,6]);
    await until(()=>has("Sieg!")||has("Perfektes Spiel!")||has("Unentschieden")||has("Heute verloren"),"Ergebnis");
    assert.ok(has("1. Halbzeit")&&has("8 von 10")&&has("2. Halbzeit"),"Halbzeiten im Ergebnis");
    assert.ok(has("Nachspielzeit: Elfmeterschießen")&&has('id="penGo"'));
    assert.ok(has("16 : 4")||has(">16<"),"Gesamtergebnis 16 von 20");

    // ----- Nachspielzeit: Elfmeterschießen, ein Schuss wird gehalten -----
    await clickId("penGo");
    await until(()=>has("Nachspielzeit · Aufgabe 1 von 5"),"Elfmeterschießen startet");
    assert.ok(has("Torwart")&&has("Fünf Schüsse gegen den Torwart"));
    await playTasks(1,5,5,[4]);
    await until(()=>has("Elfmeterschießen: 4 : 1"),"Ergebnis Elfmeterschießen");
    assert.ok(has("Nächste Einheit"),"nächste Einheit ist frei");
    await clickId("home");await until(()=>has("Hallo Emil"),"Kabine nach Einheit 1");
    assert.ok(!has("weiterspielen?"),"nichts mehr zu sichern");
    assert.ok(has("Einheit 2 von 5")&&has("1 von 5 Einheiten geschafft")&&has("Elfmeterschießen 4 : 1")&&has("1. Halbzeit 8 von 10, 2. Halbzeit 8 von 10"));
    assert.ok(!/data-camp="m3_rest:2"[^>]*disabled/.test(html)&&/data-camp="m3_rest:3"[^>]*disabled/.test(html),"2 ist frei, 3 noch nicht");

    // ----- Stand auf dem Server -----
    let st;
    for(let n=0;n<300;n++){st=(await get(`/api/profiles/${id}/state`)).state;if(st.camps&&st.camps.m3_rest&&st.camps.m3_rest.units["1"]&&st.camps.m3_rest.units["1"].pen)break;await sleep(25);}
    const c=st.camps.m3_rest;
    assert.equal(st.meta.schemaVersion,7);assert.equal(c.on,true);
    assert.deepEqual(c.units["1"].h1,{c:8,n:10});assert.deepEqual(c.units["1"].h2,{c:8,n:10});assert.deepEqual(c.units["1"].pen,{c:4,n:5});assert.equal(c.badge,0);
    const camps=st.history.filter(h=>h.mode==="camp");
    assert.equal(camps.length,1);assert.equal(camps[0].c,16);assert.equal(camps[0].n,20);assert.equal(camps[0].topic,"m3_rest");
    assert.ok(st.stats.m3_rest.last.length>=1,"Antworten zählen im Lernstand von Teilen mit Rest");
    const answered=Object.values(st.stats.m3_rest.tot).reduce((n,x)=>n+x.a,0);
    assert.ok(answered>=15,"Aufgaben der Einheit stehen im Lernstand: "+answered);

    // ----- Einheiten 2 und 3 schnell durchspielen (alles richtig), freundliche Rückmeldung in Einheit 3 -----
    for(const u of [2,3]){
      await clickData("camp","m3_rest:"+u);
      await until(()=>has(`Einheit ${u} · 1. Halbzeit · Aufgabe 1 von 10`),"Einheit "+u);
      if(u===2)assert.ok(has('class="vis"'),"Einheit 2, 1. Halbzeit mit Ballbildern");
      await playTasks(1,10,10,u===3?[1]:[],{expectNote:u===3});
      await until(()=>has("Halbzeitpause!"),"Pause "+u);await clickId("halfGo");
      await until(()=>has(`Einheit ${u} · 2. Halbzeit · Aufgabe 1 von 10`),"2. Halbzeit "+u);
      if(u===2)assert.ok(!has('class="vis"'),"Einheit 2, 2. Halbzeit ohne Bilder");
      await playTasks(1,10,10,[]);
      await until(()=>has('id="penGo"'),"Ergebnis "+u);
      await clickId("home");await until(()=>has("Hallo Emil"),"Kabine "+u);
    }
    assert.ok(has("3 von 5 Einheiten geschafft")&&has("Einheit 4 von 5"));

    // ----- Einheit 4: Päckchen mit Kontroll-Pfiff je Halbzeit -----
    await clickData("camp","m3_rest:4");
    await until(()=>has("Einheit 4 · 1. Halbzeit · Päckchen · Aufgabe 1 von 6"),"Päckchen startet");
    for(let k=1;k<=6;k++){await until(()=>has(`Aufgabe ${k} von 6`),"P"+k);await answerNow(false);}
    await until(()=>has("Kontroll-Pfiff!")&&has("Einheit 4 · 1. Halbzeit"),"Kontroll-Pfiff");
    // mitten im Kontroll-Pfiff verlassen und fortsetzen
    await clickId("home");await until(()=>has("Trainingslager weiterspielen?"),"Angebot im Kontroll-Pfiff");
    await clickId("campResume");await until(()=>has("Kontroll-Pfiff!"),"Kontroll-Pfiff wieder da");
    assert.equal([...html.matchAll(/class="cval"/g)].length,6,"alle sechs Antworten sind erhalten");
    await click(all("probe")[0]);assert.ok(has("Umkehraufgabe"),"Probe zeigt die Umkehraufgabe");
    await clickId("ctlDone",60);
    for(let k=1;k<=6;k++){await until(()=>has('id="ovl"'),"Auswertung "+k);await clickId("ovl");}
    await until(()=>has("Halbzeitpause!"),"Halbzeitpause nach dem Päckchen");
    assert.ok(has("6 : 0"),"alle sechs richtig");
    await clickId("halfGo");
    await until(()=>has("Einheit 4 · 2. Halbzeit · Päckchen · Aufgabe 1 von 6"),"2. Päckchen");
    for(let k=1;k<=6;k++){await until(()=>has(`Aufgabe ${k} von 6`),"Q"+k);await answerNow(false);}
    await until(()=>has("Kontroll-Pfiff!"),"Kontroll-Pfiff 2");await clickId("ctlSkip",60);
    for(let k=1;k<=6;k++){await until(()=>has('id="ovl"'),"Auswertung 2."+k);await clickId("ovl");}
    await until(()=>has('id="penGo"'),"Ergebnis Einheit 4");
    assert.ok(has("Perfektes Spiel!"),"12 von 12");
    await clickId("home");await until(()=>has("Hallo Emil"),"Kabine 4");
    assert.ok(has("4 von 5 Einheiten geschafft")&&has("Einheit 5 von 5"));

    // ----- Einheit 5 bis zum Abzeichen -----
    await clickData("camp","m3_rest:5");
    await until(()=>has("Einheit 5 · 1. Halbzeit · Aufgabe 1 von 10"),"Einheit 5");
    await playTasks(1,10,10);await until(()=>has("Halbzeitpause!"),"Pause 5");await clickId("halfGo");
    await playTasks(1,10,10);
    await until(()=>has("Perfektes Spiel!"),"Ergebnis 5");
    assert.ok(has("Abzeichen")&&has("Rest-Profi")&&has("Jubel-Sticker"),"Abzeichen am Ende von Einheit 5");
    await clickId("home");await until(()=>has("Hallo Emil"),"Kabine 5");
    assert.ok(has("Rest-Profi")&&has("5 von 5 Einheiten geschafft"));
    assert.ok(!/data-camp="[^"]*"[^>]*disabled/.test(html),"abgeschlossene Einheiten lassen sich wiederholen");

    // ----- Server-Stand: Abzeichen und Sticker -----
    for(let n=0;n<300;n++){st=(await get(`/api/profiles/${id}/state`)).state;if(st.camps.m3_rest.badge>0)break;await sleep(25);}
    assert.ok(st.camps.m3_rest.badge>0);
    for(const u of [1,2,3,4,5])assert.ok(st.camps.m3_rest.units[String(u)].h1&&st.camps.m3_rest.units[String(u)].h2,"Einheit "+u);
    const stickers=Object.values(st.progress.dev).reduce((n,d)=>n+d.stickers,0);
    assert.ok(stickers>=1&&stickers<=24);

    // ----- Eltern: Neustart mit Rückfrage -----
    await clickId("switch");await until(()=>has("Wer spielt?"),"Wer spielt?");
    await clickId("adminOpen");byId("adminPin").value="1234";await clickId("adminGo",150);
    await until(()=>has("Eltern-Bereich"),"Eltern-Bereich 2");
    await clickData("atab","settings");
    assert.ok(has("5 von 5 Einheiten")&&has("Abzeichen Rest-Profi erreicht"));
    await clickData("aask","campreset:"+id+":m3_rest");
    assert.ok(has("wirklich neu starten"));
    await clickData("acancel");assert.ok(!has("wirklich neu starten"),"Abbrechen lässt alles, wie es ist");
    await clickData("aask","campreset:"+id+":m3_rest");
    await clickData("ado",undefined,80);
    assert.ok(has("Das Trainingslager ist neu gestartet")&&has("0 von 5 Einheiten"));
    await clickData("aclose");await clickData("acct",id);await until(()=>has("Hallo Emil"),"Kabine 6");
    assert.ok(has("Einheit 1 von 5")&&has("0 von 5 Einheiten geschafft")&&!has("Rest-Profi"),"alles wieder auf Anfang");
    assert.ok(/data-camp="m3_rest:2"[^>]*disabled/.test(html));
    for(let n=0;n<300;n++){st=(await get(`/api/profiles/${id}/state`)).state;if(Object.keys(st.camps.m3_rest.units).length===0)break;await sleep(25);}
    assert.deepEqual(st.camps.m3_rest.units,{});assert.equal(st.camps.m3_rest.badge,0);assert.equal(st.camps.m3_rest.on,true);
  }finally{
    await new Promise(r=>{srv.close(r);srv.closeAllConnections&&srv.closeAllConnections();});
    fs.rmSync(dataDir,{recursive:true,force:true});
  }
});
