// Ende-zu-Ende: die echte app.js mit einem kleinen Fake-DOM gegen einen echten Server.
// Konto anlegen, Junge oder Mädchen wählen, Avatar bauen, eine Runde mit Trainer-Hilfe spielen (Angebot schon bei der ersten Aufgabe,
// richtige Antwort geht von allein weiter, falsche zeigt den Fehlschuss), Eltern-Bereich (Einstellungen, Trainer, Zurücksetzen, Löschen).
// Prüft, was die Tests der einzelnen Module nicht sehen: dass die Verdrahtung in app.js läuft.
import {test} from "node:test";
import assert from "node:assert/strict";
import {api} from "./helpers.mjs";
import server from "../server/server.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// ---------- Fake-DOM ----------
let html="",els=[];
const realSetTimeout=globalThis.setTimeout,realSetInterval=globalThis.setInterval;
// Timer nicht am Leben halten. Lange Wartezeiten der App in ganzen Sekunden (zum Beispiel die 45 Sekunden Tipp-Zeit) laufen 100 mal schneller.
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

    // ----- Konto anlegen (PIN wird festgelegt). Der Baukasten beginnt mit Junge oder Mädchen -----
    await clickId("acctNew");byId("acctName").value="Emil";byId("acctPin").value="1234";
    await clickId("acctCreate");
    await until(()=>has("Dein Spieler"),"Baukasten beim ersten Öffnen");
    // Schritt 1: Junge oder Mädchen ist nur eine Vorauswahl
    assert.ok(has("Schritt 1 von 6")&&has("Junge")&&has("Mädchen")&&has('id="avSkip"')&&has('id="avNext"')&&!has('id="avDice"'),"erst die Auswahl");
    assert.equal(els.filter(e=>"avbody" in e.dataset).length,2);
    assert.equal(els.filter(e=>"avstep" in e.dataset).length,6,"alle sechs Schritte sind wieder aufrufbar");
    await clickData("avbody","m");
    assert.equal((html.match(/data-avtpl=/g)||[]).length,5);
    await clickData("avtpl","5");                                    // Vorlage Wald (Mädchen)
    // Schritt 3: alle Frisuren sind für jedes Kind wählbar, Mädchenfrisuren stehen nur zuerst
    await clickId("avNext");await clickId("avNext");
    assert.ok(has("Schritt 3 von 6")&&has('id="avBack"')&&has('id="avDice"'));
    assert.ok((html.match(/data-av="hair:/g)||[]).length>=15&&has("Pferdeschwanz")&&has("Wuschel")&&has("Ohne Haare"),"alle Frisuren");
    assert.ok(html.indexOf('data-av="hair:pferdeschwanz"')<html.indexOf('data-av="hair:wuschel"'),"Mädchenfrisuren zuerst");
    await clickData("av","hair:bob");
    await clickId("avDice");                                         // Würfel ändert nur Frisur und Haarfarbe
    assert.ok(has("Schritt 3 von 6"));
    await clickData("av","hair:lang");await clickData("av","browColor:#2f6fde");
    await clickId("avBack");await clickData("av","face:3");await clickData("av","skin:#c68642");await clickData("av","build:2");
    await clickData("avstep","4");assert.ok(has("Schritt 4 von 6")&&has("Breites Lachen")&&has("Überrascht")&&!has("Bart"),"kein Bart bei Kindern");
    await clickData("av","eyeShape:0");await clickData("av","eyes:#6a95c4");await clickData("av","mouth:1");await clickData("av","nose:2");await clickData("av","brows:2");await clickData("av","freckles:1");await clickData("av","cheeks:0");
    await clickId("avNext");assert.ok(has("Schritt 5 von 6"));
    await clickData("av","outfit:2");await clickData("av","outfitColor:#34a853");await clickData("av","glasses:2");
    await clickData("av","hat:1");assert.ok(has('data-av="hatColor:'));await clickData("av","hatColor:#2f6fde");await clickData("av","bg:#ffd9e0");
    await clickId("avNext");assert.ok(has("Schritt 6 von 6")&&!has('id="avNext"'));
    await clickData("av","pattern:1");await clickData("av","socks:#22252b");await clickData("av","collar:1");
    byId("avShirtName").value="Emil";byId("avTeam").value="Die Wirbel";
    await clickData("av","shirt:#2f6fde");                           // liest dabei die Eingaben
    await clickData("avnum","1");
    await clickData("avview","back");assert.ok(has("Die Wirbel")&&has('class="numv"')&&has("data-hb="),"Rückansicht mit Hinterkopf");
    await clickId("avSave");
    await until(()=>has("Hallo Emil"),"Kabine nach Speichern");
    assert.ok(has('id="avEdit"')&&has("avsvg"));

    // ----- Eine Runde -----
    await clickData("fach","0:math");                              // Mathe antippen öffnet Mix und Themenblöcke
    assert.ok(has("Mix: alles aus Mathe")&&has("data-play=\"0:topic:m_read\""),"Fachauswahl mit Themenblöcken");
    await clickData("play","0:math");
    await until(()=>has("Aufgabe 1 von 8"),"Aufgabe 1");
    // das Angebot des Trainers kommt von allein, schon bei der ersten Aufgabe (Tipp-Zeit 45 Sekunden, hier 100 mal schneller)
    await until(()=>has('id="coachYes"'),"Angebot des Trainers bei der ersten Aufgabe",3000);
    assert.ok(has("Soll ich dir einen Tipp geben"));
    await clickId("coachNo");
    assert.ok(has('id="coachHelp"')&&has("Trainer")&&has("Trainerin")&&!has("coachYes"));
    assert.ok(!has("Trainer-Tipp anzeigen"));
    await clickId("coachHelp");
    assert.ok(has("Noch mehr Hilfe")&&has('class="bubble"'));
    await clickId("coachHelp");
    assert.ok(has("So geht das")||has("kleinen Schritten"));
    assert.ok(!has('id="coachHelp"'),"nach Stufe 2 keine weitere Stufe");
    let done=0,autoNext=0,wrong=0,right=0;
    for(let i=0;i<8;i++){
      await until(()=>has(`Aufgabe ${i+1} von 8`),"Aufgabe "+(i+1));
      if(i>0&&i<3){await clickId("coachHelp");}                     // Tipp bei weiteren Aufgaben
      // beantworten, egal ob richtig: je nach Aufgabenart
      if(els.some(e=>"c" in e.dataset))await click(els.find(e=>"c" in e.dataset));
      else if(els.some(e=>"w" in e.dataset)){await click(els.find(e=>"w" in e.dataset));await clickId("tapok");}
      else{for(let tries=0;tries<3&&!has('id="next"')&&!has('id="ovl"');tries++){await clickData("k","1");await clickData("k","ok");}}
      await until(()=>has('id="next"')||has('id="ovl"'),"Antwort "+(i+1));
      if(has('id="ovl"')){
        right++;
        assert.ok(has("Tor!")&&has("sc-goal")&&!has('id="next"')&&!has('class="bubble"'),"richtig: Overlay, keine Weiter-Taste");
        if(autoNext<2&&i<7){autoNext++;await until(()=>has(`Aufgabe ${i+2} von 8`),"automatisch weiter nach dem Overlay",4000);}   // ohne Tippen
        else await clickId("ovl");                                    // Tippen aufs Overlay geht schneller
      }else{
        wrong++;
        assert.ok(/class="scene sc-(post|bar|wide)"/.test(html),"falsch: witziger Fehlschuss");
        assert.ok(has('class="bubble"')&&has("Richtig ist")&&has("class=\"pop\""),"falsch: Erklärung und Sprechblase");
        await clickId("next");
      }
      done++;
    }
    await until(()=>has("Zur Kabine"),"Ergebnis");
    assert.equal(done,8);assert.equal(right+wrong,8);
    await sleep(900);                                               // Abgleich mit dem Server
    const list=(await get("/api/profiles")).profiles;assert.equal(list.length,1);
    const id=list[0].id;
    let st=(await get(`/api/profiles/${id}/state`)).state;
    assert.equal(st.meta.schemaVersion,5);
    const av=st.profile.avatar;assert.equal(av.v,3);assert.equal(av.body,"m");assert.equal(av.hair,"lang");assert.equal(av.browColor,"#2f6fde");assert.equal(av.hat,1);assert.equal(av.pattern,1);assert.equal(av.eyes,"#6a95c4");assert.equal(av.socks,"#22252b");assert.equal(av.mouth,1);assert.equal(av.collar,1);assert.deepEqual([av.face,av.eyeShape,av.brows,av.nose,av.freckles,av.glasses,av.build,av.cheeks,av.outfit],[3,0,2,2,1,2,2,0,2]);assert.equal(av.hatColor,"#2f6fde");assert.equal(av.outfitColor,"#34a853");assert.equal(av.bg,"#ffd9e0");assert.equal(av.shirt,"#2f6fde");assert.equal(av.team,"Die Wirbel");assert.equal(st.profile.avatarAsked,true);assert.ok(!("beard" in av),"kein Bart-Merkmal");
    assert.equal(st.history.length,1);assert.ok(Number.isFinite(st.history[0].dur)&&st.history[0].dur>=0,"Dauer gespeichert");
    const helped=Object.values(st.stats).flatMap(t=>Object.values(t.help||{}));
    assert.ok(helped.reduce((n,h)=>n+h.t1,0)>=3&&helped.reduce((n,h)=>n+h.t2,0)>=1&&helped.reduce((n,h)=>n+h.n,0)>=1,"Hilfe wurde gezählt: "+JSON.stringify(helped));
    const tot=Object.values(st.stats).flatMap(t=>t.last);assert.equal(tot.length,8);
    assert.ok(tot.filter(a=>a.h).length>=1);

    // ----- Themenblock als Päckchen mit Kontroll-Pfiff -----
    await clickId("home");await until(()=>has("Hallo Emil"),"Kabine vor dem Päckchen");
    assert.equal((html.match(/class="lg current"/g)||[]).length,1,"nur die aktuelle Liga ist groß");
    assert.ok(has('data-lgtoggle="1"')&&has("Schnuppern möglich")&&!has("data-trial="),"andere Ligen eingeklappt");
    await clickData("lgtoggle","1");assert.ok(has('data-trial="1"'),"Antippen klappt auf, Schnuppern bleibt möglich");
    await clickData("fach","0:math");
    await clickData("play","0:topic:m_zehner");
    await until(()=>has("Päckchen · Aufgabe 1 von 5"),"Päckchen startet");
    for(let i=0;i<5;i++){
      await until(()=>has(`Aufgabe ${i+1} von 5`),"Päckchen-Aufgabe "+(i+1));
      assert.ok(!has('id="ovl"')&&!has("Richtig ist")&&!has("sc-goal"),"keine Rückmeldung im Päckchen");
      await clickData("k","1");await clickData("k","ok");
    }
    await until(()=>has("Kontroll-Pfiff!"),"Kontroll-Pfiff");
    assert.ok(has("Ich habe kontrolliert")&&!has('id="ovl"')&&!has("probebox"));
    await clickData("probe","0");assert.ok(has("probebox"),"Probe auf Tippen");
    await clickData("edit","1");assert.ok(has("Antwort ändern")&&has("Deine Antwort war"));
    await clickData("k","2");await clickData("k","ok");
    await until(()=>has("Kontroll-Pfiff!")&&has("data-probe"),"zurück in der Kontrolle");
    await clickId("ctlDone");
    for(let i=0;i<5;i++){
      await until(()=>has('id="ovl"')||has('id="next"'),"Auswertung "+(i+1));
      assert.ok(has("Auswertung"));
      if(has('id="ovl"'))await clickId("ovl");else await clickId("next");
    }
    await until(()=>has("Zur Kabine"),"Ergebnis des Päckchens");
    assert.ok(has("Kontroll-Pfiff"));
    // warten, bis Kontroll-Zähler und Spielende (Verlauf) beim Server angekommen sind (unter Last dauert der Abgleich länger)
    for(let n=0;n<300;n++){const x=(await get(`/api/profiles/${id}/state`)).state;if(((x.stats.m_zehner||{}).ctl)&&x.history.length>=2)break;await sleep(25);}
    st=(await get(`/api/profiles/${id}/state`)).state;
    const ctl=Object.values(st.stats.m_zehner.ctl);
    assert.equal(ctl.reduce((n,c)=>n+c.n,0),1,"ein Kontroll-Pfiff");assert.equal(ctl.reduce((n,c)=>n+c.p,0),1,"eine Probe benutzt");
    assert.ok(st.stats.m_zehner.last.length>=5,"mindestens die fünf Antworten des Päckchens (frühere Runden können dazukommen)");
    assert.equal(st.history.length,2);assert.equal(st.history[1].mode,"topic");assert.equal(st.history[1].topic,"m_zehner");assert.equal(st.history[1].pk,true);
    // aktuelle Liga wählen und abgleichen (Kreisliga ist hier nicht frei, also nur das Trainingscamp wählbar)
    assert.deepEqual(st.progress.cur,{li:null,t:0});

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
    // Einstellungen: 6 Aufgaben pro Runde, Trainer und Trainerin einstellen
    await clickData("atab","settings");
    await clickData("aset","perRound:6");await clickData("aset","hintAfter:0");
    assert.ok(has('aria-pressed="true"'));
    assert.ok(has('id="trName1"')&&has('id="trName2"')&&has("Trainerin"));
    byId("trName1").value="Coach Marco";
    await clickData("atrstep","1:4");assert.ok(has("Vollbart")&&has("Dreitagebart"),"Bart im Trainerteam");await clickData("atr","1:beard:1");await clickData("atrdice","1:4");await clickData("atr","1:beard:2");
    await clickData("atrstep","1:5");assert.ok(has("Klemmbrett")&&has("Pfeife"));await clickData("atr","1:jacket:#2f6fde");await clickData("atr","1:gear:2");
    assert.ok(has("Coach Marco"));
    await clickData("atrstep","2:5");await clickData("atr","2:earrings:0");await clickData("atrsave","1",200);
    assert.ok(has("Der Trainer ist gespeichert"));
    await clickData("atrsave","2",200);
    assert.ok(has("Die Trainerin ist gespeichert"));
    for(let n=0;n<200&&((await get(`/api/profiles/${id}/state`)).state.settings.perRound!==6||!(await get("/api/settings")).settings.trainer2);n++)await sleep(25);   // warten, bis der Abgleich fertig ist
    st=(await get(`/api/profiles/${id}/state`)).state;
    assert.equal(st.settings.perRound,6);assert.equal(st.settings.hintAfter,0);
    const g=(await get("/api/settings")).settings;
    assert.equal(g.trainer.name,"Coach Marco");assert.equal(g.trainer.look.jacket,"#2f6fde");assert.equal(g.trainer.look.glasses,2);assert.equal(g.trainer.look.beard,2);assert.equal(g.trainer.look.gear,2);assert.equal(g.trainer.look.v,3);
    assert.equal(g.trainer2.name,"Trainerin");assert.equal(g.trainer2.look.earrings,0);assert.equal(g.schemaVersion,3);
    // PIN ändern
    byId("aOldPin").value="1234";byId("aNewPin").value="4321";await clickData("apin",undefined,200);
    await until(()=>has("Die neue PIN gilt"),"PIN geändert");
    assert.equal((await api(BASE,"POST","/api/admin/verify",{pin:"1234"})).status,403);
    assert.equal((await api(BASE,"POST","/api/admin/verify",{pin:"4321"})).status,200);
    // Sicherungen und System
    await clickData("atab","system");
    await until(()=>has("Tagessicherungen")&&has("Dieses Gerät"),"Listen vom Server");
    assert.ok(has("App-Version")&&has("Vorschau (VORSCHAU)")&&has("Server 5, App 5")&&has("Server 3, App 3"));
    // Konten: umbenennen, zurücksetzen, löschen
    await clickData("atab","accounts");
    await clickData("arename",id);byId("renameIn").value="Emil M.";await clickData("arenameok",id);
    assert.ok(has("Umbenannt")&&has("Emil M."));
    await clickData("aask","reset:"+id);assert.ok(has("Ja, zurücksetzen"));
    await clickData("ado",undefined);await sleep(300);
    assert.ok(has("zurückgesetzt"));
    st=(await get(`/api/profiles/${id}/state`)).state;
    assert.equal(st.history.length,0);assert.equal(st.profile.avatar.hair,"lang");assert.equal(st.profile.name,"Emil M.");
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
