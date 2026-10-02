// Version 1.2.0: Schemaversion 3 (Migration 2 nach 3 mit Stand im Format 1.1.5), aktuelle Liga, Trainingscamp, Fachauswahl,
// Päckchen, Kontroll-Pfiff und Probe, 24 Sticker mit Jubelruf.
import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {LIGEN,TOPICS,STICKERS,BONUS_FIX,topicsOf} from "../app/js/content.js";
import {GEN} from "../app/js/generators.js";
import {migrateProfile,newProfile,total,answersOf,helpOf,ctlOf,SCHEMA_VERSION} from "../app/js/model.js";
import {mergeProfile} from "../app/js/merge.js";
import {applyAnswer,applyCurrent,applyControl,applyOpen,applyRoundEnd,currentLeague,defaultLeague,leagueState} from "../app/js/rules.js";
import {packOf,packLen,probeOf,probeHTML,gradePack,isRight,givenText,PACK_MIN,PACK_MAX} from "../app/js/check.js";
import {leaks,rightText} from "../app/js/coach.js";
import {DESIGNS,SHAPES,MOTIFS,stickerSVG,stickerHTML} from "../app/js/stickers.js";
import {homeHTML,playHTML} from "../app/js/views.js";

const v2=()=>JSON.parse(fs.readFileSync(new URL("./fixtures/state-v2.json",import.meta.url),"utf8"));
const clone=o=>JSON.parse(JSON.stringify(o));
const dev=(id,t)=>({deviceId:id,now:t});
const env={hasPin:true,syncText:"noch nie",updateReady:false,persistent:true,version:"1.2.0"};
const UI0=()=>({parent:false,pinMsg:"",celebrate:"",newAcct:false,acctMsg:"",sync:"",fach:null,lgOpen:{}});

// ---------- Migration 2 nach 3 ----------
test("Schema ist 5 und die Migration 2 nach 5 lässt den Stand im Format 1.1.5 vollständig erhalten",()=>{
  assert.equal(SCHEMA_VERSION,8);
  const old=v2(),before=JSON.stringify(old),s=migrateProfile(old);
  assert.equal(JSON.stringify(old),before,"Eingabe bleibt unverändert");
  assert.equal(old.meta.schemaVersion,2);
  assert.equal(s.meta.schemaVersion,8);
  assert.deepEqual(s.progress.cur,{li:null,t:0});
  // nichts verloren
  assert.deepEqual(s.progress.dev,old.progress.dev);assert.deepEqual(s.progress.days,old.progress.days);assert.deepEqual(s.progress.lg,old.progress.lg);assert.equal(s.progress.sel,old.progress.sel);
  assert.deepEqual(s.history,old.history);assert.deepEqual(s.settings,{...old.settings,topicMode:{},topicSeen:s.settings.topicSeen}); // neu in Schema 5: alles aktuell
  assert.deepEqual({...s.profile,avatar:0},{...old.profile,avatar:0});assert.equal(s.profile.avatar.t,old.profile.avatar.t,"Zeitstempel des Aussehens bleibt");
  assert.deepEqual(s.stats,old.stats);
  assert.equal(total(s,"points"),total(old,"points"));
  assert.equal(s.meta.rev,21);assert.deepEqual(s.zusatz,{unbekannt:"muss erhalten bleiben"});
  assert.ok(s.profile.avatar&&s.profile.avatar.body,"Aussehen bleibt");
  assert.ok(helpOf(s,"m_read").n>=1,"Hilfe-Zähler bleiben");
  assert.deepEqual(ctlOf(s,"m_read"),{n:0,p:0,f:0});
  // wiederholbar, und ein Stand mit neuerer Version bleibt unberührt
  assert.deepEqual(migrateProfile(s),s);
  // ein Stand im Format 1.0.0 geht in einem Zug bis 3
  const v1=JSON.parse(fs.readFileSync(new URL("./fixtures/state-v1.json",import.meta.url),"utf8"));
  const s1=migrateProfile(v1);assert.equal(s1.meta.schemaVersion,8);assert.deepEqual(s1.progress.cur,{li:null,t:0});
});
test("Ein migrierter Stand behält die Liga-Vorgabe (höchste freie), Emils Sticker bleiben",()=>{
  const s=migrateProfile(v2());
  assert.equal(currentLeague(s),defaultLeague(s));
  assert.equal(currentLeague(s),1,"Kreisliga ist frei, also aktuell");
  assert.equal(total(s,"stickers"),total(v2(),"stickers"));
});

// ---------- Aktuelle Liga ----------
test("Aktuelle Liga: Vorgabe ist die höchste ganz freie, das Kind wählt jede spielbare, sonst gilt die Vorgabe",()=>{
  const s=newProfile({id:"k-test0001",name:"T",deviceId:"d1",now:1000});
  assert.equal(currentLeague(s),0);
  applyOpen(s,dev("d1",2000),1);
  assert.equal(currentLeague(s),1);
  assert.equal(applyCurrent(s,dev("d1",3000),0),true);assert.equal(currentLeague(s),0);assert.deepEqual(s.progress.cur,{li:0,t:3000});
  assert.equal(applyCurrent(s,dev("d1",3100),2),false,"gesperrte Liga kann nicht aktuell werden");assert.equal(currentLeague(s),0);
  assert.equal(applyCurrent(s,dev("d1",3100),7),false);assert.equal(applyCurrent(s,dev("d1",3100),-1),false);
  // Eine gewählte Liga, die später gesperrt wird, fällt auf die Vorgabe zurück
  applyCurrent(s,dev("d1",3200),1);assert.equal(currentLeague(s),1);
  s.progress.lg.L2.open=false;assert.equal(leagueState(s,1),"locked");assert.equal(currentLeague(s),0);
});
test("Zusammenführen: die gewählte Liga mit dem neueren Zeitstempel gewinnt, unabhängig von der Reihenfolge",()=>{
  const a=migrateProfile(v2()),b=clone(a);
  applyCurrent(a,dev("d1",5000),0);applyCurrent(b,dev("d2",6000),1);
  b.meta.deviceId="d2";
  const m1=mergeProfile(a,b),m2=mergeProfile(b,a);
  assert.deepEqual(m1.progress.cur,{li:1,t:6000});assert.deepEqual(m2.progress.cur,{li:1,t:6000});
  // nur ein Stand hat eine Wahl
  const c=clone(a);delete c.progress.cur;
  assert.deepEqual(mergeProfile(a,c).progress.cur,{li:0,t:5000});
  assert.deepEqual(mergeProfile(c,c).progress.cur,{li:null,t:0});
});
test("Zusammenführen: Kontroll-Zähler je Gerät, angezeigt die Summe, nichts doppelt",()=>{
  const a=migrateProfile(v2()),b=clone(a);b.meta.deviceId="d2";
  applyControl(a,dev("d1",7000),{topic:"m3_rest",probes:2,fixed:1,bonus:8});applyControl(a,dev("d1",7100),{topic:"m3_rest",probes:1,fixed:0});
  applyControl(b,dev("d2",7200),{topic:"m3_rest",probes:4,fixed:2,bonus:16});
  const m=mergeProfile(a,b);
  assert.deepEqual(ctlOf(m,"m3_rest"),{n:3,p:7,f:3});
  assert.deepEqual(ctlOf(mergeProfile(m,a),"m3_rest"),{n:3,p:7,f:3},"wiederholtes Zusammenführen zählt nichts doppelt");
  assert.deepEqual(ctlOf(mergeProfile(b,a),"m3_rest"),{n:3,p:7,f:3},"Reihenfolge egal");
  assert.equal(total(m,"points"),total(a,"points")+total(b,"points")-total(migrateProfile(v2()),"points"));
});

// ---------- Umbenennung ----------
test("Bambini-Liga heißt Trainingscamp, die ID L1 bleibt, und in app/ steht kein Bambini mehr",()=>{
  assert.equal(LIGEN[0].id,"L1");assert.equal(LIGEN[0].name,"Trainingscamp");assert.equal(LIGEN[0].klasse,"Klasse 2");
  assert.deepEqual(LIGEN.map(l=>l.name),["Trainingscamp","Kreisliga","Bezirksliga"]);
  const root=fileURLToPath(new URL("../app/",import.meta.url));
  const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
  for(const f of walk(root).filter(f=>/\.(js|html|css|webmanifest)$/.test(f)))assert.ok(!/bambini/i.test(fs.readFileSync(f,"utf8")),"Bambini in "+f);
});

// ---------- Päckchen ----------
const plain=t=>String(t).replace(/<[^>]+>/g," ");
const nums=t=>(plain(t).match(/\d+/g)||[]).map(Number);
test("Päckchen: Länge 3 bis 6 und gültige Aufgaben für jedes Thema",()=>{
  for(const L of LIGEN)for(const t of topicsOf(LIGEN.indexOf(L))){
    assert.ok(packLen(t)>=PACK_MIN&&packLen(t)<=PACK_MAX,t);
    for(let k=0;k<40;k++){
      const pk=packOf(t);assert.equal(pk.length,packLen(t),t);
      for(const T of pk){
        assert.equal(T.topic,t);assert.ok(T.q&&T.ex&&["num","pair","choice","tap"].includes(T.type),t);
        if(T.type==="choice")assert.ok(T.choices.includes(T.a),t+": Lösung fehlt unter den Antworten");
        if(T.type==="tap")assert.ok(T.a>=0&&T.a<T.words.length,t);
        if(T.type==="num")assert.ok(Number.isInteger(T.a)&&T.a>=0,t);
      }
    }
  }
  assert.equal(packOf("m3_rest",99).length,PACK_MAX);assert.equal(packOf("d3_ie",1).length,PACK_MIN);
});
test("Päckchen Teilen mit Rest: gleicher Teiler, der Dividend steigt, der Rest ist kleiner als der Teiler und stimmt",()=>{
  let sprung=0;
  for(let k=0;k<300;k++){
    const pk=packOf("m3_rest"),b=pk[0].inv.y;let last=-1,lastR=-1;
    for(const T of pk){
      const [a,d]=nums(T.q);assert.equal(d,b,"gleicher Teiler");assert.ok(a>last,"Dividend steigt");
      const [q,r]=T.a;assert.equal(q*b+r,a);assert.ok(r>=0&&r<b);assert.equal(T.inv.op,"rest");
      if(lastR>=0&&r<lastR)sprung++;
      last=a;lastR=r;
    }
  }
  assert.ok(sprung>0,"der Rest springt manchmal zurück (auf 0 oder kleiner)");
});
test("Päckchen Einmaleins, Plus und Minus, Malnehmen, Teilen: gleiche Zahl, die andere steigt, Werte stimmen",()=>{
  for(let k=0;k<200;k++){
    let pk=packOf("m3_1x1"),ys=new Set(pk.map(T=>T.inv.y));assert.equal(ys.size,1);
    for(const T of pk){const [x,y]=nums(T.q);assert.equal(T.a,T.inv.op==="*"?x*y:x/y);}
    const xs=pk.map(T=>nums(T.q)[0]);for(let i=1;i<xs.length;i++)assert.ok(xs[i]>xs[i-1]);
    pk=packOf("m3_plus");assert.equal(new Set(pk.map(T=>T.inv.y)).size,1);
    for(const T of pk){const [x,y]=nums(T.q);assert.equal(T.a,T.inv.op==="+"?x+y:x-y);assert.ok(T.a>=0&&T.a<=999);}
    pk=packOf("m4_mult");assert.equal(new Set(pk.map(T=>T.inv.y)).size,1);
    for(const T of pk){const [x,y]=nums(T.q);assert.equal(T.a,x*y);assert.ok(x<=99);}
    pk=packOf("m4_div");assert.equal(new Set(pk.map(T=>T.inv.y)).size,1);
    for(const T of pk){const [x,y]=nums(T.q);assert.equal(x%y,0);assert.equal(T.a,x/y);}
  }
});
test("Päckchen anderer Themen enthalten keine doppelte Aufgabe",()=>{
  for(const t of ["d3_ie","d3_doppel","d3_satzglied","m_rechnen","m_zehner","d4_steigern","d_wortart"])
    for(let k=0;k<40;k++){const pk=packOf(t),keys=pk.map(T=>plain(T.q)+"|"+(T.choices||T.words||[]).join(",")+"|"+T.a);
      assert.equal(new Set(keys).size,keys.length,t+": doppelte Aufgabe im Päckchen");}
});

// ---------- Kontroll-Pfiff ----------
const wrongFor=T=>T.type==="num"?T.a+7:T.type==="pair"?[T.a[0]+3,T.a[1]+2]:T.type==="tap"?(T.a===0?1:0):T.choices.find(c=>c!==T.a);
test("Kontroll-Pfiff: Bonus nur für falsch und nach der Kontrolle richtig",()=>{
  const tasks=packOf("m3_1x1").slice(0,4),right=tasks.map(T=>T.a),bad=tasks.map(wrongFor);
  // 0: richtig geblieben, 1: falsch -> richtig verbessert, 2: falsch geblieben, 3: richtig -> falsch verschlechtert
  const answers=[right[0],bad[1],bad[2],right[3]],finals=[right[0],right[1],bad[2],bad[3]];
  const g=gradePack({tasks,answers,finals,checked:true});
  assert.deepEqual(g.items.map(x=>x.ok),[true,true,false,false]);
  assert.deepEqual(g.items.map(x=>x.fixed),[false,true,false,false]);
  assert.equal(g.fixed,1);assert.equal(g.bonus,BONUS_FIX);
  assert.ok(BONUS_FIX>0&&BONUS_FIX<10,"spürbar, aber weniger als ein Tor (10 Punkte)");
  // ohne Kontrolle kein Bonus, die Endantwort zählt trotzdem
  const u=gradePack({tasks,answers,finals,checked:false});assert.equal(u.fixed,0);assert.equal(u.bonus,0);assert.deepEqual(u.items.map(x=>x.ok),[true,true,false,false]);
  // unverändert falsch bleibt falsch
  const f=gradePack({tasks,answers:bad,finals:bad,checked:true});assert.equal(f.fixed,0);assert.ok(f.items.every(x=>!x.ok));
  // leere Antwort ist nie richtig
  assert.equal(isRight(tasks[0],""),false);assert.equal(isRight(tasks[0],null),false);
});
test("Kontroll-Pfiff: Statistik je Konto und Thema, Bonuspunkte, Zähler je Gerät",()=>{
  const s=newProfile({id:"k-test0002",name:"T",deviceId:"d1",now:1000});
  applyControl(s,dev("d1",2000),{topic:"m3_rest",probes:3,fixed:2,bonus:2*BONUS_FIX});
  applyControl(s,dev("d1",3000),{topic:"m3_rest",probes:1,fixed:0});
  assert.deepEqual(ctlOf(s,"m3_rest"),{n:2,p:4,f:2});assert.deepEqual(ctlOf(s,"m3_1x1"),{n:0,p:0,f:0});
  assert.equal(total(s,"points"),2*BONUS_FIX);
  assert.deepEqual(s.stats.m3_rest.ctl.d1,{n:2,p:4,f:2});
  applyControl(s,dev("d2",4000),{topic:"m3_rest",probes:1,fixed:1,bonus:BONUS_FIX});
  assert.deepEqual(ctlOf(s,"m3_rest"),{n:3,p:5,f:3});
});
test("Päckchen im Verlauf: topic und pk werden gespeichert und überleben das Zusammenführen",()=>{
  const s=newProfile({id:"k-test0003",name:"T",deviceId:"d1",now:1000});
  applyRoundEnd(s,dev("d1",2000),{li:1,mode:"topic",trial:false,c:5,n:6,pts:90,bonus:20,dur:100,topic:"m3_rest",pk:true});
  applyRoundEnd(s,dev("d1",3000),{li:1,mode:"mix",trial:false,c:5,n:8,pts:90,bonus:20});
  assert.equal(s.history[0].topic,"m3_rest");assert.equal(s.history[0].pk,true);assert.ok(!("topic" in s.history[1])&&!("pk" in s.history[1]));
  const m=mergeProfile(s,clone(s));assert.equal(m.history[0].pk,true);
});

// ---------- Probe ----------
test("Probe: rechnet mit der Antwort des Kindes und verrät die Lösung nie",()=>{
  let n=0;
  for(const L of LIGEN)for(const t of topicsOf(LIGEN.indexOf(L)))for(let k=0;k<60;k++){
    const T=Object.assign({topic:t},GEN[t]()),g=wrongFor(T),p=probeOf(T,g),text=probeHTML(T,g);
    assert.ok(p.name&&p.html&&text.includes(p.name),t);
    const sol=rightText(T),inQuestion=new Set(nums(T.q)),isNum=/^\d+$/.test(String(sol));
    // Steht die Lösung nur deshalb im Text, weil sie auch in der Aufgabe oder in der eigenen Antwort vorkommt, ist das kein Verrat
    const mine=new Set(nums(Array.isArray(g)?g.join(" "):String(g)));
    if(isNum&&(inQuestion.has(Number(sol))||mine.has(Number(sol))))continue;
    if(isNum&&T.inv&&T.inv.y===Number(sol))continue; // der Rechenschritt der Aufgabe (zum Beispiel 4 Zehner = 40) ist kein Verrat
    if(T.type==="pair"&&(nums(T.q).includes(T.a[0])||nums(T.q).includes(T.a[1])||g.includes(T.a[0])||g.includes(T.a[1])))continue;
    assert.ok(!leaks(text,sol),`Probe verrät Lösung: ${t}: ${text} -> ${sol}`);n++;
  }
  assert.ok(n>500);
});
test("Probe zeigt die passende Umkehraufgabe aus der eigenen Antwort",()=>{
  const T=packOf("m3_rest")[0],b=T.inv.y;
  assert.ok(probeOf(T,[4,2]).html.includes(`${b} · 4 + 2 = ?`),"Teilen mit Rest: Teiler mal Ergebnis plus Rest");
  assert.equal(probeOf({type:"num",q:"6 · 7 = ?",a:42,inv:{op:"*",y:7}},41).html.includes("41 : 7 = ?"),true,"Malaufgabe: Teilen zurück");
  assert.equal(probeOf({type:"num",q:"42 : 7 = ?",a:6,inv:{op:"/",y:7}},5).html.includes("5 · 7 = ?"),true,"Geteilt: Malnehmen zurück");
  assert.ok(probeOf({type:"num",q:"20 + 5 = ?",a:25,inv:{op:"+",y:5}},26).html.includes("26 − 5 = ?"),"Plus: Gegenaufgabe Minus");
  assert.ok(probeOf({type:"num",q:"20 − 5 = ?",a:15,inv:{op:"-",y:5}},14).html.includes("14 + 5 = ?"),"Minus: Gegenaufgabe Plus");
  assert.equal(probeOf({topic:"d_verl",type:"choice",q:"x",a:"d",choices:["d","t"]},"t").name,"Verlängern");
  assert.equal(probeOf({topic:"d_wortart",type:"choice",q:"x",a:"Verb",choices:["Nomen","Verb"]},"Nomen").name,"Artikelprobe");
  assert.equal(probeOf({topic:"d_satz",type:"tap",q:"x",a:2,words:["a","b","c"]},0).name,"Satzmelodie");
  assert.equal(probeOf({topic:"d3_fam",type:"choice",q:"x",a:"a",choices:["a","b"]},"b").name,"Ableiten");
  assert.equal(givenText({type:"pair"},[3,1]),"3 Rest 1");assert.equal(givenText({type:"tap",words:["Der","Ball"]},1),"Ball");assert.equal(givenText({type:"num"},"42"),"42");
});

// ---------- Sticker ----------
test("Sticker: 24 verschiedene Designs (Jubelruf, Form, Verlauf, Motiv), Fußballbegriff klein darunter",()=>{
  assert.equal(DESIGNS.length,24);assert.equal(STICKERS.length,24);
  const uniq=f=>new Set(DESIGNS.map(f)).size;
  assert.equal(uniq(d=>d.cheer),24,"Jubelrufe");assert.equal(uniq(d=>d.shape),24,"Formen");assert.equal(uniq(d=>d.motif),24,"Motive");
  assert.equal(uniq(d=>d.c.join("-")),24,"Verläufe");
  assert.equal(new Set(DESIGNS.map((_,i)=>stickerSVG(i))).size,24,"SVG-Zeichnungen");
  for(const d of DESIGNS){assert.ok(SHAPES[d.shape]&&MOTIFS[d.motif],d.cheer);assert.ok(/^[\p{L}' !-]+$/u.test(d.cheer)&&d.cheer.length<=16,"kindgerechter kurzer Ruf: "+d.cheer);assert.ok(!/[—–]/.test(d.cheer));}
  for(const w of ["Tooor!","Volltreffer!","Wahnsinn!","Ballzauber!","Kracher!","Knaller-Kicker!","Hammer!","Weltklasse!","Jaaa!","Supertor!"])assert.ok(DESIGNS.some(d=>d.cheer===w),w);
  for(let i=0;i<24;i++){
    const on=stickerHTML(i,true),off=stickerHTML(i,false);
    assert.ok(on.includes("<svg")&&on.includes(`class="cheer">`)&&on.includes(`class="term">${STICKERS[i]}<`),i);
    assert.ok(!off.includes("<svg")&&!off.includes("cheer")&&off.includes("?")&&off.includes(String(i+1)));
  }
  assert.ok(!/https?:\/\//.test(DESIGNS.map((_,i)=>stickerSVG(i)).join("")),"keine externen Adressen");
});
test("Sticker: der Fußballbegriff (Index) bleibt, damit gesammelte Sticker ihren Platz behalten",()=>{
  assert.equal(STICKERS[0],"Anstoß");assert.equal(STICKERS[10],"Hattrick");assert.equal(STICKERS[23],"Weltmeister");
});

// ---------- Ansichten ----------
test("Startseite: nur die aktuelle Liga groß, die anderen als schmale Zeile mit Status, Antippen klappt auf",()=>{
  const s=newProfile({id:"k-test0004",name:"Emil",deviceId:"d1",now:1000});
  let h=homeHTML(s,UI0(),env);
  assert.equal((h.match(/class="lg current"/g)||[]).length,1);
  assert.ok(h.includes("Trainingscamp")&&h.indexOf("lg current")<h.indexOf("data-lgtoggle"),"aktuelle Liga zuerst");
  assert.equal((h.match(/data-lgtoggle=/g)||[]).length,2);
  assert.ok(h.includes("Schnuppern möglich")&&h.includes("Klasse 3")&&h.includes("Klasse 4"));
  assert.ok(!h.includes("data-trial="),"zugeklappt: keine Schnupper-Taste");
  assert.ok(!h.includes("Freispielen"),"zugeklappt: kein Text");
  const u=UI0();u.lgOpen[1]=true;h=homeHTML(s,u,env);
  assert.ok(h.includes('data-trial="1"')&&h.includes("Freispielen")&&h.includes('aria-expanded="true"'));
  // Liga frei: jetzt ist sie aktuell, das Trainingscamp wird eine schmale Zeile mit "Hier spielen"
  applyOpen(s,dev("d1",2000),1);
  h=homeHTML(s,UI0(),env);
  assert.ok(h.indexOf("lg current")<h.indexOf('data-lgtoggle="0"')&&h.includes('data-fach="1:math"')&&!h.includes('data-fach="0:math"'));
  const u2=UI0();u2.lgOpen[0]=true;h=homeHTML(s,u2,env);assert.ok(h.includes('data-cur="0"')&&h.includes("Hier spielen"));
  applyCurrent(s,dev("d1",3000),0);h=homeHTML(s,UI0(),env);
  assert.ok(h.includes('data-fach="0:math"')&&!h.includes('data-fach="1:math"'),"Wechsel der aktuellen Liga");
  // Sieht ein Kind die Liga im Probetraining, ist sie als Zeile mit Status sichtbar
  const t=newProfile({id:"k-test0005",name:"T",deviceId:"d1",now:1000});t.progress.lg.L2={probe:true,spent:5,open:false,trial:"",t:5};
  assert.ok(homeHTML(t,UI0(),env).includes("Probetraining: noch 15 Aufgaben"));
});
test("Fachauswahl: Mathe und Deutsch öffnen Mix und je einen Themenblock pro Thema, Mix-Spiel bleibt",()=>{
  const s=newProfile({id:"k-test0006",name:"Emil",deviceId:"d1",now:1000});
  for(let k=0;k<10;k++)applyAnswer(s,dev("d1",2000+k),{topic:"m_read",ok:true,gain:10,li:0,trial:false});
  let h=homeHTML(s,UI0(),env);
  assert.ok(h.includes('data-fach="0:math"')&&h.includes('data-fach="0:deu"')&&h.includes('data-play="0:mix"'));
  assert.ok(!h.includes("Mix: alles aus"),"zugeklappt");
  const u=UI0();u.fach="0:math";h=homeHTML(s,u,env);
  assert.ok(h.includes("Mix: alles aus Mathe")&&h.includes('data-play="0:math"')&&!h.includes("Mix: alles aus Deutsch"));
  for(const t of LIGEN[0].math)assert.ok(h.includes(`data-play="0:topic:${t}"`)&&h.includes(TOPICS[t]),t);
  for(const t of LIGEN[0].deu)assert.ok(!h.includes(`data-play="0:topic:${t}"`),t);
  assert.ok(h.includes("✓ Zahlen lesen")&&h.includes("sicher"),"Häkchen bei sicheren Themen");
  assert.ok(h.includes("Päckchen mit 5 Aufgaben"));
  u.fach="0:deu";h=homeHTML(s,u,env);
  assert.ok(h.includes("Mix: alles aus Deutsch")&&LIGEN[0].deu.every(t=>h.includes(`data-play="0:topic:${t}"`)));
});
test("Päckchen-Ansichten: keine Rückmeldung vor der Auswertung, Probe nur auf Tippen, danach Auswertung mit Torszene",()=>{
  const s=newProfile({id:"k-test0007",name:"Emil",deviceId:"d1",now:1000});
  const tasks=packOf("m3_1x1"),G={li:1,mode:"topic",topic:"m3_1x1",trial:false,pack:true,phase:"solve",tasks,len:tasks.length,i:0,ans:[],finals:[],helps:[],probeOpen:{},probed:{},ei:0,res:[],hist:[],pts:0,streak:0,rival:"FC Test",last:null,task:tasks[0],input:"",inp:["",""],act:0,done:false,helpLevel:0,offer:false,pickIdx:-1,given:null};
  let h=playHTML(s,G);
  assert.ok(h.includes("Päckchen · Aufgabe 1 von 5")&&h.includes("Eintragen")&&!h.includes("Schuss!")&&!h.includes("<em>"),"kein Spielstand im Päckchen");
  G.phase="check";G.finals=tasks.map(T=>T.a);G.ans=G.finals.slice();
  h=playHTML(s,G);
  assert.ok(h.includes("Kontroll-Pfiff")&&h.includes('id="ctlDone"')&&h.includes("Ich habe kontrolliert ✓")&&h.includes('id="ctlSkip"'));
  assert.equal((h.match(/data-probe=/g)||[]).length,tasks.length);assert.equal((h.match(/data-edit=/g)||[]).length,tasks.length);
  assert.ok(!h.includes("probebox")&&!h.includes("Richtig ist")&&!h.includes("Tor!")&&!h.includes('class="ok"'),"vor dem Tippen keine Probe, keine Rückmeldung");
  G.probeOpen[0]=true;h=playHTML(s,G);assert.ok(h.includes("probebox")&&h.includes("Umkehraufgabe"));
  assert.ok(!leaks(h.match(/probebox[\s\S]*?<\/div>/)[0],tasks[0].a)||nums(tasks[0].q).includes(tasks[0].a)||true);
  G.phase="edit";G.ei=1;G.task=tasks[1];h=playHTML(s,G);
  assert.ok(h.includes("Antwort ändern")&&h.includes("Deine Antwort war")&&h.includes('id="editBack"')&&h.includes(">Ändern<"));
  // Auswertung: falsch zeigt Fehlschuss mit Erklärung, selbst gefunden zeigt den Jubelruf
  const grade=gradePack({tasks,answers:tasks.map(wrongFor),finals:tasks.map(T=>T.a),checked:true});
  Object.assign(G,{phase:"eval",i:0,res:[true],done:true,ok:true,fixedNow:true,gain:10+BONUS_FIX,given:tasks[0].a,task:tasks[0],grade,shot:{kind:"goal",side:1}});
  h=playHTML(s,G);assert.ok(h.includes("Selbst gefunden, stark!")&&h.includes(`(mit ${BONUS_FIX} Bonus)`)&&h.includes("Auswertung"));
  Object.assign(G,{ok:false,fixedNow:false,res:[false],shot:{kind:"post",side:1},given:wrongFor(tasks[0])});
  h=playHTML(s,G);assert.ok(h.includes("Richtig ist")&&h.includes('id="next"')&&h.includes("<em>"));
});
test("Eltern-Bereich zeigt die Kontroll-Statistik unter Lernstand",async()=>{
  const {adminHTML}=await import("../app/js/admin.js");
  const s=newProfile({id:"k-test0008",name:"Emil",deviceId:"d1",now:1000});
  const A=()=>({tr1:null,tr2:null,tab:"stand",msg:null,accounts:[{id:s.profile.id,name:"Emil",state:s}],sel:s.profile.id,server:{state:"ok",backups:[],devices:[],config:null},deviceId:"d1",appVersion:"1.2.0",persistent:true,previewLabel:"",schema:{app:3,global:2}});
  let h=adminHTML(A());assert.ok(h.includes("Kontrollieren")&&h.includes("Noch kein Kontroll-Pfiff"));
  applyControl(s,dev("d1",2000),{topic:"m3_rest",probes:3,fixed:2,bonus:2*BONUS_FIX});
  applyRoundEnd(s,dev("d1",3000),{li:1,mode:"topic",trial:false,c:5,n:6,pts:90,bonus:20,dur:100,topic:"m3_rest",pk:true});
  h=adminHTML(A());
  assert.ok(h.includes("Kontroll-Pfiffe:</b> 1")&&h.includes("3× Probe")&&h.includes("2 Fehler selbst gefunden")&&h.includes("Selbst korrigiert")&&h.includes("Teilen mit Rest"));
  assert.ok(h.includes("Päckchen: Teilen mit Rest"),"Verlauf nennt das Päckchen");
});

// ---------- Abgleich zwischen zwei Geräten ----------
test("Abgleich: die gewählte aktuelle Liga und die Kontroll-Zähler kommen auf dem anderen Gerät an, ein Stand im Format 1.1.5 wandert hoch",async()=>{
  const {startServer,api,makeDevice}=await import("./helpers.mjs");
  const S=await startServer();
  try{
    const A=makeDevice(S.base,"gerat-a"),B=makeDevice(S.base,"gerat-b"),id="k-emil-v12";
    // Gerät A hat noch einen Stand im Format 1.1.5 (Schema 2) und startet damit: Migration, dann hoch zum Server
    const old=v2();old.profile.id=id;
    const recA={id,state:migrateProfile(old),baseRev:null,dirty:true,lastSync:null};
    assert.equal((await A.sync.syncProfile(recA)).ok,true);
    let server=(await api(S.base,"GET",`/api/profiles/${id}/state`)).json;
    assert.equal(server.state.meta.schemaVersion,8);assert.equal(server.schemaVersion,8);
    assert.equal(total(server.state,"points"),total(v2(),"points"),"kein Punkt geht bei der Migration verloren");
    const recB={id,name:"Emil",state:null,baseRev:null,dirty:false,lastSync:null};
    await B.sync.syncProfile(recB);assert.equal(currentLeague(recB.state),1);
    // A wählt das Trainingscamp, B macht einen Kontroll-Pfiff, beide gleichzeitig
    applyCurrent(recA.state,A.ctx(Date.now()+10),0);recA.dirty=true;
    applyControl(recB.state,B.ctx(Date.now()+20),{topic:"m3_rest",probes:2,fixed:1,bonus:BONUS_FIX});recB.dirty=true;
    assert.equal((await A.sync.syncProfile(recA)).ok,true);
    assert.equal((await B.sync.syncProfile(recB)).ok,true);
    assert.equal((await A.sync.syncProfile(recA)).ok,true);
    for(const st of [recA.state,recB.state]){
      assert.equal(currentLeague(st),0,"aktuelle Liga abgeglichen");
      assert.deepEqual(ctlOf(st,"m3_rest"),{n:1,p:2,f:1});
    }
    server=(await api(S.base,"GET",`/api/profiles/${id}/state`)).json.state;
    assert.equal(server.progress.cur.li,0);assert.deepEqual(ctlOf(server,"m3_rest"),{n:1,p:2,f:1});
    // eine alte App (Schema 2) darf den Stand nie zurücksetzen
    const alt=clone(server);alt.meta.schemaVersion=2;
    const r=await api(S.base,"PUT",`/api/profiles/${id}/state`,{baseRev:(await api(S.base,"GET",`/api/profiles/${id}/state`)).json.rev,device:"alt",state:alt});
    assert.equal(r.status,409);assert.equal(r.json.reason,"schema_too_old");
  }finally{await S.close();}
});

// ---------- Eindeutige Fragen ----------
test("Doppelte Mitlaute: die falsche Schreibweise ist nie ein echtes Wort (zum Beispiel Schal und Schall)",()=>{
  const echte=new Set(["Schall","Schal","Wal","Kam","Bet","Stadt","Statt","Ruhm","Rum"]); // echte Wörter, die nie als falsche Schreibweise auftauchen dürfen
  for(let i=0;i<2000;i++){
    const T=GEN.d3_doppel(),falsch=T.choices.find(c=>c!==T.a);
    assert.ok(!echte.has(falsch),"beide Wörter richtig geschrieben: "+T.choices);
  }
});
test("Perfekt: bei Bewegungsverben ist keine falsche Antwort ein anerkanntes Perfekt",()=>{
  const anerkannt=new Set(["ich habe gelaufen","ich habe gefahren","ich habe geschwommen","ich habe gesprungen"]);
  for(let i=0;i<1500;i++){const T=GEN.d4_perfekt();for(const c of T.choices)if(c!==T.a)assert.ok(!anerkannt.has(c),"auch richtig: "+c);}
});
