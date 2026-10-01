// Ende zu Ende für 1.5.3: die echte app.js mit Fake-DOM gegen einen echten Server.
// Päckchen sichern und fortsetzen, „Warum stimmt das?“, Kontoanlage mit stehendem Namen, Mix-Beschriftung, Nummern beim Zuordnen.
import {test} from "node:test";
import assert from "node:assert/strict";
import server from "../server/server.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// ---------- Fake-DOM (wie in v14e2e.test.mjs) ----------
let html="",els=[];
const realSetTimeout=globalThis.setTimeout,realSetInterval=globalThis.setInterval;
globalThis.setTimeout=(fn,ms,...a)=>{const t=realSetTimeout(fn,ms>=10000&&ms%1000===0?ms/100:ms,...a);if(t&&t.unref)t.unref();return t;};
globalThis.setInterval=(fn,ms,...a)=>{const t=realSetInterval(fn,ms,...a);if(t&&t.unref)t.unref();return t;};
const focused=[];
function parse(){
  els=[];
  for(const m of html.matchAll(/<([a-z][\w-]*)\b([^>]*)>/g)){
    const attrs={};
    for(const a of m[2].matchAll(/([\w:-]+)(?:="([^"]*)")?/g))attrs[a[1]]=a[2]===undefined?"":a[2];
    const dataset={};for(const k in attrs)if(k.startsWith("data-"))dataset[k.slice(5)]=attrs[k];
    els.push({tagName:m[1].toUpperCase(),attrs,dataset,value:attrs.value||"",onclick:null,id:attrs.id,focus(){focused.push(attrs.id);},getAttribute:k=>attrs[k]??null});
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
async function until(cond,what,ms=4000){const t=Date.now();while(Date.now()-t<ms){if(cond())return;await sleep(15);}assert.fail("Zeitüberschreitung: "+what+"\n"+html.replace(/<svg[\s\S]*?<\/svg>/g,"<svg/>").slice(0,1800));}
const has=t=>html.includes(t);
const byId=id=>{const e=els.find(x=>x.id===id);assert.ok(e,"Element fehlt: #"+id);return e;};
const all=k=>els.filter(e=>k in e.dataset);
const byData=(k,v)=>{const e=els.find(x=>k in x.dataset&&(v===undefined||x.dataset[k]===v));assert.ok(e,`Element fehlt: data-${k}=${v}`);return e;};
const click=async(e,wait=30)=>{assert.equal(typeof e.onclick,"function","keine Aktion gebunden: "+JSON.stringify(e.attrs).slice(0,120));const r=e.onclick({stopPropagation(){}});await sleep(wait);return r;};
const clickId=(id,wait)=>click(byId(id),wait);
const clickData=(k,v,wait)=>click(byData(k,v),wait);
const key=k=>clickData("k",String(k),5);
const type=async digits=>{for(const d of String(digits))await key(d);await key("ok");};

test("Ende zu Ende 1.5.3: Kontoanlage, Mix-Beschriftung, Päckchen sichern und fortsetzen, Warum stimmt das?",async()=>{
  const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),"torjaeger-e2e153-"));
  const srv=server.createServer({dataDir});
  await new Promise(r=>srv.listen(0,"127.0.0.1",r));
  BASE="http://127.0.0.1:"+srv.address().port;
  try{
    await import("../app/js/app.js");
    const {GEN}=await import("../app/js/generators.js");
    await until(()=>has("Willkommen"),"Startseite ohne Konto");

    // ----- 12. Fehler bei der Kontoanlage: der Name bleibt stehen, das fehlerhafte Feld bekommt den Fokus -----
    await clickId("acctNew");byId("acctName").value="Emil";byId("acctPin").value="12";
    focused.length=0;
    await clickId("acctCreate");
    await until(()=>has("genau 4 Ziffern"),"Fehlermeldung");
    assert.ok(has('value="Emil"'),"der Name bleibt stehen");
    assert.equal(focused.at(-1),"acctPin","das fehlerhafte Feld bekommt den Fokus");
    byId("acctName").value="";byId("acctPin").value="1234";focused.length=0;
    await clickId("acctCreate");
    await until(()=>has("Bitte einen Namen eingeben"),"Fehlermeldung Name");
    assert.equal(focused.at(-1),"acctName");
    byId("acctName").value="Emil";byId("acctPin").value="1234";
    await clickId("acctCreate");
    await until(()=>has("Dein Spieler"),"Baukasten");
    await clickId("avSkip");
    await until(()=>has("Hallo Emil"),"Kabine");

    // ----- 9. Taste „Mix: Mathe & Deutsch“ statt „Mix-Spiel“ -----
    assert.ok(has("Mix: Mathe &amp; Deutsch")&&!has("Mix-Spiel"),"neue Beschriftung");

    // ----- 5. Päckchen sichern und fortsetzen -----
    // Ein Thema mit fester Aufgabe: 1 + 1 = 2, so ist die Antwort bekannt (die Lösung steht nie im DOM)
    GEN.m_zehner=()=>({type:"num",q:"1 + 1 = ?",a:2,ex:"1 und 1 sind zusammen 2.",hint:"Zähle weiter."});
    await clickData("fach","0:math");
    await clickData("play","0:topic:m_zehner");
    await until(()=>has("Päckchen · Aufgabe 1 von 5"),"Päckchen startet");
    assert.ok(!has('id="packResume"'));
    await type(2);await type(2);await type(7); // drei Antworten, die dritte falsch
    await until(()=>has("Aufgabe 4 von 5"),"Aufgabe 4");
    await clickId("home"); // versehentlich „Kabine“
    await until(()=>has("Hallo Emil")&&has("Päckchen weiterspielen?"),"Angebot in der Kabine");
    assert.ok(has("3 von 5 Aufgaben sind eingetragen"),"Stand des Päckchens wird genannt");
    // Weiterspielen: Aufgabe 4, die drei Antworten sind noch da
    await clickId("packResume");
    await until(()=>has("Päckchen · Aufgabe 4 von 5"),"weiter bei Aufgabe 4");
    await type(2);await type(2);
    await until(()=>has("Kontroll-Pfiff!"),"Kontroll-Pfiff");
    // die Antworten stehen in der Übersicht (2, 2, 7, 2, 2)
    assert.equal([...html.matchAll(/class="cval"[^>]*>([^<]*)</g)].map(m=>m[1]).join(","),"2,2,7,2,2","alle Antworten sind erhalten");

    // im Kontroll-Pfiff verlassen und wieder fortsetzen
    await clickId("home");
    await until(()=>has("Päckchen weiterspielen?"),"Angebot im Kontroll-Pfiff");
    assert.ok(has("es fehlt nur noch der Kontroll-Pfiff"));
    await clickId("packResume");
    await until(()=>has("Kontroll-Pfiff!"),"Kontroll-Pfiff wieder da");
    assert.equal([...html.matchAll(/class="cval"[^>]*>([^<]*)</g)].map(m=>m[1]).join(","),"2,2,7,2,2");
    // die Probe bleibt geöffnet und zählt weiter
    await click(all("probe")[0]);
    await clickId("home");
    await until(()=>has("Päckchen weiterspielen?"),"Angebot nach der Probe");
    await clickId("packResume");
    await until(()=>has("Kontroll-Pfiff!"),"noch einmal");
    assert.ok(has('class="bubble probebox"'),"die geöffnete Probe ist noch offen");

    // „Neu anfangen“ startet frisch (dasselbe Thema), das alte Päckchen ist weg
    await clickId("home");
    await until(()=>has("Päckchen weiterspielen?"),"Angebot");
    await clickId("packDrop");
    await until(()=>has("Päckchen · Aufgabe 1 von 5"),"neues Päckchen");
    await clickId("home");
    await until(()=>has("Hallo Emil"),"Kabine");
    assert.ok(!has("Päckchen weiterspielen?"),"ohne eingetragene Antwort gibt es nichts zu sichern, nach „Neu anfangen“ ist das alte weg");

    // ----- 8. Warum stimmt das? Ein richtiger Treffer in der Auswertung, ohne den Ablauf zu bremsen -----
    await clickData("fach","0:math");
    await clickData("play","0:topic:m_zehner");
    await until(()=>has("Päckchen · Aufgabe 1 von 5"),"Päckchen für die Auswertung");
    for(let i=0;i<5;i++)await type(2);
    await until(()=>has("Kontroll-Pfiff!"),"Kontroll-Pfiff 2");
    await clickId("ctlDone",80);
    await until(()=>has('id="ovl"'),"Tor-Overlay in der Auswertung");
    assert.ok(has('id="why"')&&has("Warum stimmt das?"),"die Taste ist im Overlay");
    assert.ok(!has('id="packResume"'));
    await clickId("why",30);
    assert.ok(has("Darum stimmt das")&&has("1 und 1 sind zusammen 2."),"die Erklärung erscheint");
    assert.ok(!has('id="ovl"'),"das Overlay ist die Erklärungskarte");
    await sleep(2300); // länger als die 1,8 Sekunden: es wartet auf „Weiter“
    assert.ok(has("Darum stimmt das")&&has("Aufgabe 1 von 5"),"nichts läuft von allein weiter");
    await clickId("ovlNext",40);
    await until(()=>has("Aufgabe 2 von 5")&&has('id="ovl"'),"weiter zur nächsten Auswertung");
    // ohne Antippen läuft es wie bisher von allein weiter
    await until(()=>has("Aufgabe 3 von 5"),"automatisch weiter",3500);
    // gesichertes Päckchen nach der Abgabe: keines
    await clickId("home");
    await until(()=>has("Hallo Emil"),"Kabine nach der Auswertung");
    assert.ok(!has("Päckchen weiterspielen?"),"nach der Abgabe gibt es nichts mehr zu fortsetzen");
  }finally{
    await new Promise(r=>{srv.close(r);srv.closeAllConnections&&srv.closeAllConnections();});
    fs.rmSync(dataDir,{recursive:true,force:true});
  }
});
