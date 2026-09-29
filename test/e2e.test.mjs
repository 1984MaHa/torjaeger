// Ende-zu-Ende: die echte app.js mit einem kleinen Fake-DOM gegen einen echten Server.
// Konto anlegen, Avatar bauen, eine Runde mit Trainer-Hilfe spielen, Eltern-Bereich (Einstellungen, Trainer, Zurücksetzen, Löschen).
// Prüft, was die Tests der einzelnen Module nicht sehen: dass die Verdrahtung in app.js läuft.
import {test} from "node:test";
import assert from "node:assert/strict";
import {startServer,api} from "./helpers.mjs";
import server from "../server/server.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// ---------- Fake-DOM ----------
let html="",els=[];
const unref=(f,realFn)=>(fn,ms,...a)=>{const t=realFn(fn,ms,...a);if(t&&t.unref)t.unref();return t;};
globalThis.setInterval=unref(null,globalThis.setInterval);
globalThis.setTimeout=unref(null,globalThis.setTimeout);
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

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(cond,what,ms=4000){const t=Date.now();while(Date.now()-t<ms){if(cond())return;await sleep(15);}assert.fail("Zeitüberschreitung: "+what+"\n"+html.replace(/<svg[\s\S]*?<\/svg>/g,"<svg/>").slice(0,1500));}
const has=t=>html.includes(t);
const byId=id=>{const e=els.find(x=>x.id===id);assert.ok(e,"Element fehlt: #"+id);return e;};
const byData=(k,v)=>{const e=els.find(x=>k in x.dataset&&(v===undefined||x.dataset[k]===v));assert.ok(e,`Element fehlt: data-${k}=${v}`);return e;};
const click=async(e,wait=40)=>{assert.equal(typeof e.onclick,"function","keine Aktion gebunden: "+JSON.stringify(e.attrs).slice(0,120));const r=e.onclick();await sleep(wait);return r;};
const clickId=(id,wait)=>click(byId(id),wait);
const clickData=(k,v,wait)=>click(byData(k,v),wait);
const stripSvg=s=>s.replace(/<svg[\s\S]*?<\/svg>/g,"");

test("Ende zu Ende: Konto, Avatar, Runde mit Hilfe, Eltern-Bereich",async()=>{
  const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),"torjaeger-e2e-"));
  const srv=server.createServer({dataDir,previewLabel:"VORSCHAU"});
  await new Promise(r=>srv.listen(0,"127.0.0.1",r));
  BASE="http://127.0.0.1:"+srv.address().port;
  const get=async u=>(await api(BASE,"GET",u)).json;
  try{
    await import("../app/js/app.js");
    await until(()=>has("Willkommen"),"Startseite ohne Konto");
    await until(()=>has("preview-band"),"Band VORSCHAU");        // Kennung vom Server
    assert.ok(has(">VORSCHAU<"));

    // ----- Konto anlegen (PIN wird festgelegt), Baukasten wird angeboten -----
    await clickId("acctNew");byId("acctName").value="Emil";byId("acctPin").value="1234";
    await clickId("acctCreate");
    await until(()=>has("Dein Spieler"),"Baukasten beim ersten Öffnen");
    assert.ok(has('id="avSkip"')&&has("Später")&&(html.match(/data-avhair=/g)||[]).length>=6);
    await clickData("avtpl","2");
    byId("avShirtName").value="Emil";byId("avTeam").value="Die Wirbel";
    await clickData("avhair","4");                                   // Zöpfe, liest dabei die Eingaben
    await clickData("avnum","1");
    assert.ok(has("Die Wirbel")&&has('class="numv"'));
    await clickId("avSave");
    await until(()=>has("Hallo Emil"),"Kabine nach Speichern");
    assert.ok(has('id="avEdit"')&&has("avsvg"));

    // ----- Eine Runde: Hilfe in zwei Stufen, Torszene, Erklärung im Sprechblase -----
    await clickData("play","0:math");
    await until(()=>has("Aufgabe 1 von 8"),"Aufgabe 1");
    assert.ok(has('id="coachHelp"')&&has("Trainer Papa"));
    assert.ok(!has("Trainer-Tipp anzeigen"));
    await clickId("coachHelp");
    assert.ok(has("Tipp:")&&has("Noch mehr Hilfe"));
    await clickId("coachHelp");
    assert.ok(has("So geht das")||has("kleinen Schritten"));
    assert.ok(!has('id="coachHelp"'),"nach Stufe 2 keine weitere Stufe");
    let done=0,sawKinds=new Set();
    for(let i=0;i<8;i++){
      await until(()=>has(`Aufgabe ${i+1} von 8`),"Aufgabe "+(i+1));
      if(i>0&&i<3){await clickId("coachHelp");}                     // Tipp bei weiteren Aufgaben
      // beantworten, egal ob richtig: je nach Aufgabenart
      if(els.some(e=>"c" in e.dataset))await click(els.find(e=>"c" in e.dataset));
      else if(els.some(e=>"w" in e.dataset)){await click(els.find(e=>"w" in e.dataset));await clickId("tapok");}
      else{for(let tries=0;tries<3&&!has('id="next"');tries++){await clickData("k","1");await clickData("k","ok");}}
      await until(()=>has('id="next"'),"Antwort "+(i+1));
      const kind=/class="scene sc-(\w+)"/.exec(html);assert.ok(kind,"Torszene fehlt");sawKinds.add(kind[1]);
      assert.ok(has("bubble")&&has("class=\"fb "),"Trainer erklärt nach der Antwort");
      done++;
      await clickId("next");
    }
    await until(()=>has("Zur Kabine"),"Ergebnis");
    assert.equal(done,8);
    await sleep(900);                                               // Abgleich mit dem Server
    const list=(await get("/api/profiles")).profiles;assert.equal(list.length,1);
    const id=list[0].id;
    let st=(await get(`/api/profiles/${id}/state`)).state;
    assert.equal(st.meta.schemaVersion,2);
    assert.equal(st.profile.avatar.hair,4);assert.equal(st.profile.avatar.team,"Die Wirbel");assert.equal(st.profile.avatar.number.length>0,true);assert.equal(st.profile.avatarAsked,true);
    assert.equal(st.history.length,1);assert.ok(Number.isFinite(st.history[0].dur)&&st.history[0].dur>=0,"Dauer gespeichert");
    const helped=Object.values(st.stats).flatMap(t=>Object.values(t.help||{}));
    assert.ok(helped.reduce((n,h)=>n+h.t1,0)>=3&&helped.reduce((n,h)=>n+h.t2,0)>=1&&helped.reduce((n,h)=>n+h.n,0)>=1,"Hilfe wurde gezählt: "+JSON.stringify(helped));
    const tot=Object.values(st.stats).flatMap(t=>t.last);assert.equal(tot.length,8);
    assert.ok(tot.filter(a=>a.h).length>=1);

    // ----- Eltern-Bereich -----
    await clickId("home");await until(()=>has("Hallo Emil"),"Kabine");
    await clickId("switch");await until(()=>has("Wer spielt?"),"Wer spielt?");
    assert.ok(has('id="adminOpen"')&&has("avsvg"));
    await clickId("adminOpen");byId("adminPin").value="0000";await clickId("adminGo",120);
    assert.ok(has("Die PIN stimmt nicht")&&!has("Eltern-Bereich</h1>"));
    byId("adminPin").value="1234";await clickId("adminGo",150);
    await until(()=>has("Eltern-Bereich"),"Eltern-Bereich offen");
    for(const t of ["Konten","Lernstand","Einstellungen","Sicherungen und System"])assert.ok(has(t),t);
    assert.ok(has("Zurücksetzen")&&has("Löschen")&&has("Umbenennen"));
    // Lernstand
    await clickData("atab","stand");assert.ok(has("Letzte Spiele")&&has("Letzte 10")&&has("Trainingstage"));
    // Einstellungen: 6 Aufgaben pro Runde, Trainer umbenennen
    await clickData("atab","settings");
    await clickData("aset","perRound:6");await clickData("aset","hintAfter:0");
    assert.ok(has('aria-pressed="true"'));
    byId("trName").value="Coach Marco";await clickData("atrcap","#2f6fde");
    assert.ok(has("Coach Marco"));
    await clickData("atrsave",undefined,200);
    assert.ok(has("Der Trainer ist gespeichert"));
    await sleep(900);
    st=(await get(`/api/profiles/${id}/state`)).state;
    assert.equal(st.settings.perRound,6);assert.equal(st.settings.hintAfter,0);
    const g=(await get("/api/settings")).settings;
    assert.equal(g.trainer.name,"Coach Marco");assert.equal(g.trainer.look.cap,"#2f6fde");assert.equal(g.schemaVersion,2);
    // PIN ändern
    byId("aOldPin").value="1234";byId("aNewPin").value="4321";await clickData("apin",undefined,200);
    await until(()=>has("Die neue PIN gilt"),"PIN geändert");
    assert.equal((await api(BASE,"POST","/api/admin/verify",{pin:"1234"})).status,403);
    assert.equal((await api(BASE,"POST","/api/admin/verify",{pin:"4321"})).status,200);
    // Sicherungen und System
    await clickData("atab","system");
    await until(()=>has("Tagessicherungen")&&has("Dieses Gerät"),"Listen vom Server");
    assert.ok(has("App-Version")&&has("Vorschau (VORSCHAU)")&&has("Server 2, App 2"));
    // Konten: umbenennen, zurücksetzen, löschen
    await clickData("atab","accounts");
    await clickData("arename",id);byId("renameIn").value="Emil M.";await clickData("arenameok",id);
    assert.ok(has("Umbenannt")&&has("Emil M."));
    await clickData("aask","reset:"+id);assert.ok(has("Ja, zurücksetzen"));
    await clickData("ado",undefined);await sleep(300);
    assert.ok(has("zurückgesetzt"));
    st=(await get(`/api/profiles/${id}/state`)).state;
    assert.equal(st.history.length,0);assert.equal(st.profile.avatar.hair,4);assert.equal(st.profile.name,"Emil M.");
    await clickData("aask","delete:"+id);await clickData("ado",undefined);await sleep(300);
    assert.ok(has("Papierkorb"));assert.ok(!has('data-arename="'+id+'"'));
    assert.equal((await api(BASE,"GET",`/api/profiles/${id}/state`)).status,410);
    // Papierkorb zeigt das Konto, Zurückholen bringt es zurück
    await clickData("atab","system");await until(()=>has("Zurückholen"),"Papierkorb-Eintrag");
    await clickData("aask",undefined);
    await clickData("ado",undefined);await sleep(400);
    await until(()=>has("Zurückgeholt"),"Zurückgeholt");
    assert.equal((await api(BASE,"GET",`/api/profiles/${id}/state`)).status,200);
    await clickData("aclose");assert.ok(has("Wer spielt?"));
    assert.ok(!stripSvg(html).includes("undefined")&&!/NaN/.test(html));
  }finally{
    await new Promise(r=>{srv.close(r);srv.closeAllConnections&&srv.closeAllConnections();});
    fs.rmSync(dataDir,{recursive:true,force:true});
  }
});
