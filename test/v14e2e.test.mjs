// Ende zu Ende für 1.4.0: die echte app.js mit Fake-DOM gegen einen echten Server.
// Englisch und Sachkunde in der Kreisliga, die vier neuen Aufgabenarten (Zuordnen, Sortieren, Reihenfolge, Bild wählen) im Päckchen mit
// Kontroll-Pfiff und Probe, Vorlesen mit Gerätestimme (nur nach Antippen), Themensteuerung im Eltern-Bereich und ihr Abgleich.
import {test} from "node:test";
import assert from "node:assert/strict";
import {api} from "./helpers.mjs";
import server from "../server/server.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// ---------- Fake-DOM (wie in e2e.test.mjs) ----------
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
// Gerätestimme: zuerst ohne Stimmen (wie beim Start auf dem iPad), später kommt eine englische dazu
const said=[],listeners={};let voices=[];
globalThis.speechSynthesis={getVoices:()=>voices,speak:u=>said.push(u),cancel(){},addEventListener:(ev,fn)=>{listeners[ev]=fn;}};
globalThis.SpeechSynthesisUtterance=class{constructor(t){this.text=t;}};

const sleep=ms=>new Promise(r=>realSetTimeout(r,ms));
async function until(cond,what,ms=4000){const t=Date.now();while(Date.now()-t<ms){if(cond())return;await sleep(15);}assert.fail("Zeitüberschreitung: "+what+"\n"+html.replace(/<svg[\s\S]*?<\/svg>/g,"<svg/>").slice(0,1800));}
const has=t=>html.includes(t);
const byId=id=>{const e=els.find(x=>x.id===id);assert.ok(e,"Element fehlt: #"+id);return e;};
const all=k=>els.filter(e=>k in e.dataset);
const byData=(k,v)=>{const e=els.find(x=>k in x.dataset&&(v===undefined||x.dataset[k]===v));assert.ok(e,`Element fehlt: data-${k}=${v}`);return e;};
const click=async(e,wait=30)=>{assert.equal(typeof e.onclick,"function","keine Aktion gebunden: "+JSON.stringify(e.attrs).slice(0,120));const r=e.onclick();await sleep(wait);return r;};
const clickId=(id,wait)=>click(byId(id),wait);
const clickData=(k,v,wait)=>click(byData(k,v),wait);
const disabled=id=>"disabled" in byId(id).attrs;

test("Ende zu Ende 1.4.0: Englisch und Sachkunde, neue Aufgabenarten, Vorlesen, Themensteuerung",async()=>{
  const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),"torjaeger-e2e14-"));
  const srv=server.createServer({dataDir});
  await new Promise(r=>srv.listen(0,"127.0.0.1",r));
  BASE="http://127.0.0.1:"+srv.address().port;
  const get=async u=>(await api(BASE,"GET",u)).json;
  try{
    await import("../app/js/app.js");
    const {GEN}=await import("../app/js/generators.js");
    await until(()=>has("Willkommen"),"Startseite ohne Konto");
    await clickId("acctNew");byId("acctName").value="Emil";byId("acctPin").value="1234";
    await clickId("acctCreate");
    await until(()=>has("Dein Spieler"),"Baukasten");
    await clickId("avSkip");
    await until(()=>has("Hallo Emil"),"Kabine");
    // Trainingscamp: kein Englisch, keine Sachkunde
    assert.ok(!has('data-fach="0:eng"')&&!has('data-fach="0:su"')&&!has('data-fach="1:eng"'),"erst Trainingscamp, nur Mathe und Deutsch");
    // Kreisliga freigeben (Trainerbank), sie wird die aktuelle Liga
    byId("pinIn").value="1234";await clickId("pinOk",60);
    await until(()=>has('data-open="1"'),"Eltern-Bereich in der Trainerbank");
    await clickData("open","1");
    await until(()=>has('data-fach="1:eng"'),"Kreisliga zeigt Englisch");
    assert.ok(has('data-fach="1:su"')&&has('data-fach="1:math"')&&has('data-fach="1:deu"')&&has("Mix-Spiel"));

    // ----- Englisch ohne Stimme: keine 🔊-Taste, keine Hör-Aufgabe -----
    await clickData("fach","1:eng");
    assert.ok(has("Mix: alles aus Englisch")&&has('data-play="1:topic:en_tiere"')&&has("Stufe 1 von 3"));
    await clickData("play","1:eng");
    await until(()=>has("Aufgabe 1 von 8"),"Englisch Aufgabe 1");
    assert.ok(has("Welches Bild passt zu")&&all("pic").length>=3&&!has("data-say")&&!has("Anhören"),"ohne Stimme kein Vorlesen");
    // die Stimme kommt nach dem Start dazu (iPad lädt sie verzögert): die Taste erscheint
    voices=[{lang:"de-DE",name:"Anna"},{lang:"en-US",name:"Sam"},{lang:"en-GB",name:"Daniel"}];
    assert.equal(typeof listeners.voiceschanged,"function","App horcht auf voiceschanged");
    listeners.voiceschanged();await sleep(30);
    assert.ok(has('class="spk')&&all("say").length===1,"🔊 am englischen Wort der Frage");
    assert.equal(said.length,0,"nichts wird von allein vorgelesen");
    await click(all("say")[0]);
    assert.equal(said.length,1);assert.equal(said[0].voice.lang,"en-GB");assert.equal(said[0].text,all("say")[0].dataset.say);
    // richtig antworten: die Kachel mit dem Namen des Wortes kennt nur der Test
    // die Lösung steht nicht im DOM: einfach die erste Kachel antippen
    await click(all("pic")[0]);
    await until(()=>has('id="ovl"')||has('id="next"'),"Antwort auf Bild wählen");
    assert.ok(has("Tor!")||has("Richtig ist"));
    if(has('id="ovl"'))await clickId("ovl");else await clickId("next");
    // ein ganzes Spiel: keine Frage kommt zweimal dran (auch nicht zufällig)
    const words=[said[0].text];
    for(let i=2;i<=8;i++){
      await until(()=>has("Aufgabe "+i+" von 8"),"Aufgabe "+i);
      const m=new RegExp("zu <b>([^<]+)</b>").exec(html),say=els.find(e=>"say" in e.dataset);
      words.push(m?m[1]:say.dataset.say);
      await click(all("pic")[0]);
      await until(()=>has('id="ovl"')||has('id="next"'),"Antwort "+i);
      if(has('id="ovl"'))await clickId("ovl");else await clickId("next");
    }
    assert.equal(words.length,8);assert.equal(new Set(words).size,8,"keine Frage doppelt: "+words.join(", "));
    await until(()=>has("Zur Kabine"),"Ende des Englisch-Spiels");
    await clickId("home");
    await until(()=>has("Hallo Emil"),"zurück in die Kabine");

    // ----- Sachkunde-Päckchen mit allen vier neuen Aufgabenarten, Kontroll-Pfiff und Probe -----
    const forced=[()=>{for(;;){const T=GEN.en_tiere({level:2});if(T.type==="match")return T;}}, // mit Stimme wird 1 von 5 Aufgaben zur Hör-Aufgabe: hier nicht
      ()=>{for(;;){const T=GEN.su_verkehr();if(T.type==="sort")return T;}},()=>{for(;;){const T=GEN.su_getreide();if(T.type==="order")return T;}},()=>GEN.en_tiere({level:1})];
    const made=[];let k=0;
    const real=GEN.su_wasser;
    GEN.su_wasser=()=>{const T=forced[k%forced.length]();k++;made.push(T);const c=Object.assign({},T);delete c.topic;return c;};
    await clickData("fach","1:su");
    assert.ok(has("Mix: alles aus Sachkunde")&&has('data-play="1:topic:su_wasser"'));
    await clickData("play","1:topic:su_wasser");
    await until(()=>has("Päckchen · Aufgabe 1 von 4"),"Päckchen startet");
    assert.ok(k>=4);
    // 1. Zuordnen (mit 🔊, weil jetzt eine Stimme da ist)
    let T=made[0];assert.ok(all("ml").length===T.left.length&&all("mr").length===T.right.length&&has("Noch einmal antippen löst das Paar"));
    assert.ok(all("say").length===T.left.length,"🔊 an jedem englischen Wort");
    assert.ok(disabled("fin"),"Fertig erst, wenn alle Paare gesetzt sind");
    await clickData("ml","0");await clickData("mr",String(T.a[0]));
    assert.equal(new Set([...html.matchAll(/--pc:(#[0-9a-f]{6})/g)].map(m=>m[1])).size,1,"beide bekommen dieselbe Farbe");
    await clickData("ml","0");   // löst das Paar
    assert.ok(!has("--pc:"),"noch einmal antippen löst das Paar");
    for(let i=0;i<T.left.length;i++){await clickData("ml",String(i));await clickData("mr",String(T.a[i]));}
    assert.ok(!disabled("fin"));
    // zwei rechts vertauschen: eine Aufgabe falsch machen? Nein, hier alles richtig, die Kontrolle bringt später den Bonus
    await clickId("fin");
    await until(()=>has("Päckchen · Aufgabe 2 von 4"),"Sortieren");
    // 2. Sortieren: bewusst falsch, Karte 0 in den falschen Korb
    T=made[1];assert.ok(all("sc").length===T.cards.length&&all("sb").length===T.baskets.length&&disabled("fin"));
    const wrongBasket=(T.a[0]+1)%T.baskets.length;
    await clickData("sc","0");await clickData("sb",String(wrongBasket));
    assert.ok(has('data-sp="0"'),"Karte liegt im Korb");
    await clickData("sp","0");assert.ok(has('data-sc="0"'),"Karte kommt aus dem Korb zurück");
    await clickData("sc","0");await clickData("sb",String(wrongBasket));
    for(let i=1;i<T.cards.length;i++){await clickData("sc",String(i));await clickData("sb",String(T.a[i]));}
    assert.ok(!disabled("fin"));await clickId("fin");
    await until(()=>has("Päckchen · Aufgabe 3 von 4"),"Reihenfolge");
    // 3. Reihenfolge: Nummern erscheinen, Zurücksetzen
    T=made[2];assert.ok(all("oc").length===T.cards.length&&disabled("fin"));
    await clickData("oc","0");await clickData("oc","1");assert.ok(has('<b class="onum">1</b>')&&has('<b class="onum">2</b>'));
    await clickId("ordReset");assert.ok(!has('<b class="onum">1</b>'),"Zurücksetzen");
    for(const i of T.a)await clickData("oc",String(i));
    assert.ok(!disabled("fin"));await clickId("fin");
    await until(()=>has("Päckchen · Aufgabe 4 von 4"),"Bild wählen");
    // 4. Bild wählen: richtige Kachel
    T=made[3];await clickData("pic",String(T.a));
    await until(()=>has("Kontroll-Pfiff!"),"Kontroll-Pfiff");
    assert.ok(all("probe").length===4&&all("edit").length===4);
    // Probe: bei Zuordnen und Sortieren "Schau dir jedes Paar noch einmal an", nie die Lösung
    await clickData("probe","0");assert.ok(has("Schau dir jedes Paar noch einmal an"));
    await clickData("probe","1");assert.ok((html.match(/Schau dir jedes Paar noch einmal an/g)||[]).length===2);
    await clickData("probe","2");assert.ok(has("Reihenfolge prüfen"));
    // Antwort ändern: das Sortieren zeigt die bisherige Antwort, Karte 0 in den richtigen Korb
    await clickData("edit","1");
    assert.ok(has("Antwort ändern")&&all("sp").length===made[1].cards.length,"bisherige Antwort ist vorbelegt");
    await clickData("sp","0");await clickData("sc","0");await clickData("sb",String(made[1].a[0]));
    await clickId("fin");
    await until(()=>has("Kontroll-Pfiff!"),"zurück zur Kontrolle");
    await clickId("ctlDone");
    // Auswertung: je Aufgabe eine Torszene, danach das Ergebnis
    for(let i=0;i<4;i++){
      await until(()=>has('id="ovl"')||has('id="next"'),"Auswertung "+(i+1));
      assert.ok(has("Tor!")||has("Selbst gefunden")||has("Richtig ist"));
      if(has('id="ovl"'))await clickId("ovl",40);else await clickId("next",40);
    }
    await until(()=>has("Zur Kabine"),"Ergebnis");
    assert.ok(has("Kontroll-Pfiff: Du hast 1 Fehler selbst gefunden"),"Bonus für den selbst verbesserten Fehler (auch bei Sortieren)");
    GEN.su_wasser=real;
    await sleep(900);
    const list=(await get("/api/profiles")).profiles;assert.equal(list.length,1);
    const id=list[0].id;
    let st=(await get(`/api/profiles/${id}/state`)).state;
    assert.equal(st.meta.schemaVersion,5);
    assert.equal(st.history.at(-1).mode,"topic");assert.equal(st.history.at(-1).topic,"su_wasser");assert.equal(st.history.at(-1).pk,true);
    const eng=st.stats.en_tiere;assert.ok(eng===undefined||eng.tot);
    const sw=st.stats.su_wasser;assert.equal(Object.values(sw.tot).reduce((a,x)=>a+x.a,0),4,"vier Antworten im Thema");
    const terms=Object.values(sw.terms)[0];assert.ok(Object.keys(terms).some(x=>x.startsWith("a:"))&&Object.keys(terms).some(x=>x.startsWith("c:")),"Statistik je Begriff");
    assert.ok(sw.last.every(x=>x.ok===0||x.ok===1));
    assert.deepEqual(st.settings.topicMode,{});

    // ----- Themensteuerung im Eltern-Bereich: Wasser aus -----
    await clickId("home");await until(()=>has("Hallo Emil"),"Kabine");
    await clickId("switch");await until(()=>has("Wer spielt?"),"Kontenliste");
    await clickId("adminOpen");byId("adminPin").value="1234";await clickId("adminGo",150);
    await until(()=>has("Eltern-Bereich"),"Eltern-Bereich offen");
    await clickData("atab","settings");
    assert.ok(has("Themen im Unterricht")&&has('data-atopic="su_wasser:aus"')&&has('data-atopic="en_tiere:wiederholen"')&&has('data-atopic="m_read:aktuell"'));
    await clickData("atopic","su_wasser:aus");
    assert.ok(/data-atopic="su_wasser:aus" aria-pressed="true"/.test(html));
    await clickData("atopic","en_tiere:wiederholen");
    await clickData("atab","stand");assert.ok(has("(aus)")&&has("(wiederholen)")&&has("<h3>Begriffe"));
    await clickData("aclose");
    await until(()=>has("Wer spielt?"),"zurück");
    await clickData("acct",id);await until(()=>has("Hallo Emil"),"Kabine");
    await clickData("fach","1:su");
    assert.ok(!has('data-play="1:topic:su_wasser"')&&has('data-play="1:topic:su_kartoffel"'),"aus: ausgeblendet");
    await clickData("fach","1:eng");
    assert.ok(has('data-play="1:topic:en_tiere"')&&has("wiederholen"));
    assert.ok(has("Sachkunde: 0 von 6 Themen sicher"));
    await sleep(900);
    st=(await get(`/api/profiles/${id}/state`)).state;
    assert.deepEqual(st.settings.topicMode,{su_wasser:"aus",en_tiere:"wiederholen"},"Themensteuerung wird mit dem Server abgeglichen");
  }finally{
    await new Promise(r=>{srv.close(r);srv.closeAllConnections&&srv.closeAllConnections();});
    fs.rmSync(dataDir,{recursive:true,force:true});
  }
});
