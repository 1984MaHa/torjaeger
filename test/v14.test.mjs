// Version 1.4.0: Englisch und Sachkunde (Kreisliga), vier neue Aufgabenarten, Vorlesen, Themensteuerung im Eltern-Bereich,
// Schemaversion 5 (Migration 4 nach 5). Die Verdrahtung mit app.js prüft v14e2e.test.mjs.
import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {LIGEN,TOPICS,ENG_IDS,SU_IDS,topicsOf,allTopicsOf,poolOf} from "../app/js/content.js";
import {EN_TOPICS} from "../app/js/content-en.js";
import {SU_TOPICS} from "../app/js/content-su.js";
import {GEN} from "../app/js/generators.js";
import {migrateProfile,newProfile,SCHEMA_VERSION,lvOf,termsOf,answersOf,UnsupportedSchema} from "../app/js/model.js";
import {mergeProfile} from "../app/js/merge.js";
import {applyAnswer,applyRoundEnd,applyTopicMode,applySettings,applyReset,nextTopic,weightOf,topicModeOf,topicOn,gateTopics,mastered,safeCount,leagueState,topicDone,topicSafe,fachProgress,activeTopics} from "../app/js/rules.js";
import {isRight,termResults,givenText,probeOf,probeHTML,packOf,packLen,gradePack} from "../app/js/check.js";
import {leaks,rightText,similarExample} from "../app/js/coach.js";
import {canSpeak,speak,speakBtn,englishVoice} from "../app/js/speech.js";
import {homeHTML,playHTML} from "../app/js/views.js";
import {adminHTML} from "../app/js/admin.js";
import {newInputHTML} from "../app/js/inputs.js";
import {canon} from "../app/js/util.js";

const clone=o=>JSON.parse(JSON.stringify(o));
const fx=n=>JSON.parse(fs.readFileSync(new URL("./fixtures/"+n,import.meta.url),"utf8"));
const dev=(id,t)=>({deviceId:id,now:t});
const plain=t=>String(t).replace(/<[^>]+>/g," ").replace(/&nbsp;/g," ");
const env={hasPin:true,syncText:"noch nie",updateReady:false,persistent:true,version:"1.4.0"};
const UI0=()=>({parent:false,pinMsg:"",celebrate:"",newAcct:false,acctMsg:"",sync:"",fach:null,lgOpen:{}});
const fresh=()=>newProfile({id:"k-emil0001",name:"Emil",deviceId:"d1",now:1000});
const withStimme=(voices,fn)=>{
  const old=globalThis.speechSynthesis,oldU=globalThis.SpeechSynthesisUtterance,said=[];
  globalThis.speechSynthesis={getVoices:()=>voices,speak:u=>said.push(u),cancel(){}};
  globalThis.SpeechSynthesisUtterance=class{constructor(t){this.text=t;}};
  try{return fn(said);}finally{globalThis.speechSynthesis=old;globalThis.SpeechSynthesisUtterance=oldU;if(old===undefined)delete globalThis.speechSynthesis;if(oldU===undefined)delete globalThis.SpeechSynthesisUtterance;}
};
const correct=T=>T.a;
function wrong(T){
  if(T.type==="match"){const a=T.a.slice();[a[0],a[1]]=[a[1],a[0]];return a;}
  if(T.type==="sort")return T.a.map((x,i)=>i===0?(x+1)%T.baskets.length:x);
  if(T.type==="order"){const a=T.a.slice();[a[0],a[1]]=[a[1],a[0]];return a;}
  if(T.type==="pic")return(T.a+1)%T.tiles.length;
  return T.choices.find(c=>c!==T.a);
}

// ---------- Schema 5 ----------
test("Schema 5 (seit 1.4.0): Migration 4 nach 5, Stand im Format 1.3.0 bleibt vollständig erhalten, alles ist aktuell",()=>{
  assert.equal(SCHEMA_VERSION,10);
  const old=fx("state-v4.json"),before=JSON.stringify(old);
  assert.equal(old.meta.schemaVersion,4);assert.ok(!("topicMode" in old.settings));
  const s=migrateProfile(old);
  assert.equal(JSON.stringify(old),before,"Eingabe bleibt unverändert");
  assert.equal(s.meta.schemaVersion,10);
  assert.deepEqual(s.settings,{...old.settings,topicMode:{},topicSeen:s.settings.topicSeen,mul:s.settings.mul});
  assert.deepEqual({...s.profile,avatar:0},{...old.profile,avatar:0},"Konto ohne das Aussehen unverändert");
  for(const k of ["progress","stats","history","zusatz","futureField"])assert.deepEqual(s[k],old[k],k);
  for(const t of allTopicsOf(1))assert.equal(topicModeOf(s,t),"aktuell");
  assert.equal(canon(migrateProfile(s)),canon(s),"zweimal migrieren ändert nichts");
  for(const f of ["state-v1.json","state-v2.json","state-v3.json"])assert.equal(migrateProfile(fx(f)).meta.schemaVersion,10,f);
  const neu=newProfile({id:"k-abc12345",name:"X",deviceId:"d"});neu.meta.schemaVersion=11;
  assert.throws(()=>migrateProfile(neu),UnsupportedSchema);
});

// ---------- Inhalte ----------
const CODE=t=>[...t].map(c=>c.codePointAt(0));
const U14PLUS=[[0x1F6DC,0x1F6DF],[0x1F7F0,0x1F7F0],[0x1F979,0x1F979],[0x1F9CC,0x1F9CC],[0x1FA75,0x1FA77],[0x1FA7B,0x1FA7C],[0x1FA87,0x1FA88],[0x1FAA9,0x1FAAF],[0x1FAB7,0x1FABF],[0x1FAC3,0x1FAC5],[0x1FACE,0x1FACF],[0x1FAD7,0x1FADB],[0x1FAE0,0x1FAE8],[0x1FAF0,0x1FAF8]];
test("Kreisliga hat Englisch (10 Themen, je mindestens 10 Wörter) und Sachkunde (7 Themen), die anderen Ligen nicht",()=>{
  assert.equal(ENG_IDS.length,10);assert.equal(SU_IDS.length,7);
  assert.deepEqual(LIGEN[1].eng,ENG_IDS);assert.deepEqual(LIGEN[1].su,SU_IDS);
  assert.ok(!LIGEN[0].eng&&!LIGEN[0].su&&!LIGEN[2].eng&&!LIGEN[2].su);
  for(const t of ENG_IDS){assert.ok(EN_TOPICS[t].words.length>=10,t);assert.ok(TOPICS[t]);assert.ok(GEN[t]);}
  for(const t of SU_IDS){assert.ok(SU_TOPICS[t].tasks.length>=5,t);assert.ok(TOPICS[t]);assert.ok(GEN[t]);}
  // für den Aufstieg zählen nur Mathe und Deutsch
  for(let i=0;i<LIGEN.length;i++){assert.deepEqual(topicsOf(i),LIGEN[i].math.concat(LIGEN[i].deu));assert.ok(topicsOf(i).every(t=>!ENG_IDS.includes(t)&&!SU_IDS.includes(t)));}
  assert.deepEqual(allTopicsOf(1),topicsOf(1).concat(ENG_IDS,SU_IDS));
  // Mix (fachübergreifend) nimmt nur Mathe und Deutsch
  assert.deepEqual(poolOf(1,"mix"),topicsOf(1));assert.deepEqual(poolOf(1,"eng"),ENG_IDS);assert.deepEqual(poolOf(1,"su"),SU_IDS);assert.deepEqual(poolOf(0,"eng"),[]);
});
test("Englisch: Wörter, Übersetzungen und Bilder sind eindeutig, falsche Schreibweisen sind keine echten Wörter der Liste",()=>{
  const all=new Set(Object.values(EN_TOPICS).flatMap(t=>t.words.map(w=>w[0].toLowerCase())));
  const pics=new Map();
  for(const [id,t] of Object.entries(EN_TOPICS)){
    const en=new Set(),de=new Set();
    for(const w of t.words){
      assert.equal(w.length,5,id+" "+w[0]);
      assert.ok(!en.has(w[0])&&!de.has(w[1]),`doppelt in ${id}: ${w[0]}`);en.add(w[0]);de.add(w[1]);
      assert.ok(w[2],w[0]);
      if(!/^#/.test(w[2])||/^#[0-9a-f]{6}$/i.test(w[2])){ // Emoji oder Farbkasten: nie zweimal dasselbe Bild in der ganzen Liste
        assert.ok(!pics.has(w[2]),`Bild doppelt: ${w[0]} und ${pics.get(w[2])}`);pics.set(w[2],w[0]);
      }
      const bad=[w[3],w[4]];
      assert.equal(new Set(bad).size,2,w[0]);
      for(const b of bad){assert.notEqual(b.toLowerCase(),w[0].toLowerCase());assert.ok(!all.has(b.toLowerCase()),`falsche Schreibweise ist ein Wort der Liste: ${b}`);assert.match(b,/^[A-Za-z-]+$/);}
      for(const c of CODE(w[2]))assert.ok(!U14PLUS.some(([a,b])=>c>=a&&c<=b),`Emoji neuer als Unicode 13: ${w[0]}`);
    }
  }
  // Farben sind Farbkästen, keine Emoji
  assert.ok(EN_TOPICS.en_farben.words.every(w=>/^#[0-9a-f]{6}$/i.test(w[2])));
  assert.ok(EN_TOPICS.en_zahlen.words.length===13&&EN_TOPICS.en_zahlen.words.map(w=>w[2]).join()===[...Array(13).keys()].map(i=>"#"+i).join());
});
test("Sachkunde: jede Aufgabe ist gültig definiert (Körbe, Reihenfolgen, Paare, Kacheln)",()=>{
  for(const [id,t] of Object.entries(SU_TOPICS)){
    assert.ok(t.name&&t.tasks.length>=5,id);
    for(const d of t.tasks){
      assert.ok(["match","sort","order","choice","pic","rose","compass"].includes(d.k),id);
      assert.ok(d.k==="compass"||d.hint&&(d.ex||d.k==="compass"),id+" "+d.q);
      if(d.k==="match"){assert.ok(d.pairs.length>=3&&d.pairs.length<=5&&d.n[0]>=3&&d.n[1]<=d.pairs.length,id);
        assert.equal(new Set(d.pairs.map(p=>p[0])).size,d.pairs.length,id+" linke Begriffe doppelt");assert.equal(new Set(d.pairs.map(p=>p[1])).size,d.pairs.length,id+" Partner doppelt");}
      if(d.k==="sort"){assert.ok(d.baskets.length>=2&&d.baskets.length<=3&&d.n[0]>=4&&d.n[1]<=8,id);
        for(let b=0;b<d.baskets.length;b++)assert.ok(d.cards.some(c=>c[1]===b),id+" leerer Korb");
        assert.equal(new Set(d.cards.map(c=>c[0])).size,d.cards.length,id);}
      if(d.k==="order"){assert.ok(d.steps.length>=3&&d.steps.length<=5&&d.win[0]>=3&&d.win[1]<=d.steps.length,id);assert.equal(new Set(d.steps).size,d.steps.length,id);}
      if(d.k==="choice"){assert.ok(!d.wrong.includes(d.right)&&new Set([d.right,...d.wrong]).size===d.wrong.length+1,id+" "+d.q);}
      if(d.k==="pic"){assert.ok(d.tiles.length>=3&&d.tiles.length<=4&&new Set(d.tiles.map(x=>x[0])).size===d.tiles.length&&new Set(d.tiles.map(x=>x[1])).size===d.tiles.length,id+" "+d.q);
        for(const tl of d.tiles)for(const c of CODE(tl[0]))assert.ok(!U14PLUS.some(([a,b])=>c>=a&&c<=b),"Emoji neuer als Unicode 13: "+tl[1]);}
      for(const s of [d.q||"",d.hint||"",d.ex||""])assert.ok(!/[—–]/.test(s),id);
    }
  }
});

// ---------- Aufgaben ----------
function checkTask(T,label){
  assert.ok(T.q&&T.ex&&T.hint&&T.sig!==undefined,label+" q, ex, hint oder sig fehlt");
  assert.ok(!/[—–]/.test(T.q+T.ex+T.hint),label+" Gedankenstrich");
  switch(T.type){
    case"match":{
      assert.ok(T.left.length>=3&&T.left.length<=5&&T.left.length===T.right.length&&T.a.length===T.left.length,label);
      assert.equal(new Set(T.a).size,T.a.length,label+" zwei linke Begriffe haben denselben Partner");
      assert.ok(T.a.every(j=>j>=0&&j<T.right.length),label);
      const key=x=>x.k+"|"+x.t;
      assert.equal(new Set(T.left.map(key)).size,T.left.length,label+" doppelte Begriffe links");
      assert.equal(new Set(T.right.map(key)).size,T.right.length,label+" doppelte Partner rechts");
      assert.equal(T.terms.length,T.left.length,label);
      assert.ok(T.a.some((j,i)=>j!==i),label+" Lösung steht schon in Reihenfolge");
      break;}
    case"pic":{
      assert.ok(T.tiles.length>=3&&T.tiles.length<=4,label);assert.ok(T.a>=0&&T.a<T.tiles.length,label);
      const key=x=>x.k+"|"+x.t+"|"+x.name;
      assert.equal(new Set(T.tiles.map(key)).size,T.tiles.length,label+" doppelte Kachel");
      assert.equal(new Set(T.tiles.map(x=>x.name)).size,T.tiles.length,label+" ein Bild steht für zwei Wörter");
      break;}
    case"sort":{
      assert.ok(T.cards.length>=4&&T.cards.length<=8&&T.baskets.length>=2&&T.baskets.length<=3&&T.a.length===T.cards.length,label);
      for(let b=0;b<T.baskets.length;b++)assert.ok(T.a.includes(b),label+" leerer Korb");
      assert.equal(new Set(T.cards.map(c=>c.t)).size,T.cards.length,label+" doppelte Karte");
      break;}
    case"order":{
      assert.ok(T.cards.length>=3&&T.cards.length<=5&&T.a.length===T.cards.length,label);
      assert.deepEqual([...T.a].sort((x,y)=>x-y),T.cards.map((_,i)=>i),label+" Lösung ist keine Reihenfolge der Karten");
      assert.ok(T.a.some((x,i)=>x!==i),label+" Karten liegen schon richtig");
      assert.equal(new Set(T.cards.map(c=>c.t)).size,T.cards.length,label);
      break;}
    case"choice":
      assert.ok(T.choices.includes(T.a)&&new Set(T.choices).size===T.choices.length,label+" "+T.q);break;
    default:assert.fail(label+" unbekannter Typ "+T.type);
  }
  // richtig und falsch
  assert.equal(isRight(T,correct(T)),true,label+" richtig wird nicht anerkannt");
  assert.equal(isRight(T,wrong(T)),false,label+" falsch wird anerkannt");
  assert.equal(isRight(T,null),false);
  // der Tipp verrät nichts: Lösungswörter stehen nicht im Text (Auswahlwörter der Frage selbst ausgenommen)
  const hint=plain(T.hint).toLowerCase(),q=plain(T.q).toLowerCase();
  const secret=T.type==="match"?T.right.map(r=>r.t):T.type==="sort"||T.type==="order"?T.cards.map(c=>c.t):T.type==="pic"?[T.tiles[T.a].name]:T.type==="choice"?[T.a]:[];
  for(const x of secret){const w=String(x).toLowerCase();if(w.length>=4&&!q.includes(w))assert.ok(!hint.includes(w),`Tipp verrät Lösung (${label}): ${T.hint} -> ${x}`);}
  assert.ok(!leaks(T.hint,rightText(T))||T.type==="choice"&&T.choices.filter(c=>c!==T.a).every(c=>leaks(T.hint,c)),label+" Tipp verrät");
  assert.ok(typeof rightText(T)==="string"&&rightText(T).length>0);
  // Probe: zeigt nie die Lösung
  const p=probeOf(T,correct(T));assert.ok(p.name&&p.html,label);
  if(T.type==="match"||T.type==="sort")assert.ok(p.html.includes("Schau dir jedes Paar noch einmal an"),label);
  assert.ok(!/[—–]/.test(p.html));
  assert.ok(givenText(T,correct(T)).length>0&&givenText(T,null)==="-");
}
test("Alle Englisch-Themen in allen drei Stufen: gültig, eindeutig, Tipp und Probe verraten nichts",()=>{
  for(const t of ENG_IDS)for(const level of [1,2,3])for(let n=0;n<120;n++){
    const T={topic:t,...GEN[t]({level})};
    assert.equal(T.level,level,t);
    checkTask(T,`${t} Stufe ${level}`);
    assert.ok(!T.listen,"ohne Stimme keine Hör-Aufgabe");
    const words=EN_TOPICS[t].words;
    if(level===1){assert.equal(T.type,"pic");assert.ok(T.speak);assert.ok(words.some(w=>w[0]===T.speak));assert.equal(T.tiles[T.a].name,T.speak);assert.ok(!plain(T.hint).includes(T.speak));}
    if(level===2){assert.equal(T.type,"match");assert.ok(T.left.length>=4&&T.left.length<=5);
      T.left.forEach((l,i)=>{assert.ok(l.say&&l.k==="txt");const w=words.find(x=>x[0]===l.t);assert.ok(w);assert.equal(T.right[T.a[i]].t,w[1],"Partner ist die Übersetzung");});}
    if(level===3){assert.equal(T.type,"choice");assert.equal(T.choices.length,3);assert.ok(T.vis&&/class="tile /.test(T.vis));
      const w=words.find(x=>x[0]===T.a);assert.ok(w);assert.deepEqual([...T.choices].sort(),[w[0],w[3],w[4]].sort());
      assert.ok(!plain(T.q+T.hint).toLowerCase().includes(w[0].toLowerCase()),"Stufe 3 nennt das Wort nicht");}
  }
});
test("Englisch Stufe 1: Farben als Farbkästen, Zahlen als Ziffern, sonst Emoji; jede Kachel einer Aufgabe ist verschieden",()=>{
  for(let n=0;n<100;n++){
    const c=GEN.en_farben({level:1});assert.ok(c.tiles.every(x=>x.k==="col"&&/^#[0-9a-f]{6}$/i.test(x.t)));
    const z=GEN.en_zahlen({level:1});assert.ok(z.tiles.every(x=>x.k==="num"));
    const e=GEN.en_tiere({level:1});assert.ok(e.tiles.every(x=>x.k==="emo"));
  }
  const vis=GEN.en_farben({level:3}).vis;assert.ok(vis.includes("tile col big")&&vis.includes("background:#"));
});
test("Alle Sachkunde-Themen: Zuordnen, Sortieren, Reihenfolge, Bild wählen und Auswahl sind gültig",()=>{
  const seen=new Set();
  for(const t of SU_IDS)for(let n=0;n<400;n++){
    const T={topic:t,...GEN[t]()};seen.add(T.type);
    checkTask(T,t);
  }
  assert.deepEqual([...seen].sort(),["choice","match","order","pic","sort"]);
});
test("Zuordnen: Paar lösen und neu setzen, richtig nur wenn alle Paare stimmen, falsche Paare werden erkannt",()=>{
  const T=GEN.en_tiere({level:2}),n=T.left.length;
  // Zustand wie in app.js: G.pairs
  const pairs=T.left.map(()=>-1);
  pairs[0]=T.a[0];assert.equal(isRight(T,pairs),false,"noch nicht alle zugeordnet");
  pairs[0]=-1;
  for(let i=0;i<n;i++)pairs[i]=T.a[i];assert.equal(isRight(T,pairs),true);
  const swapped=pairs.slice();[swapped[0],swapped[1]]=[swapped[1],swapped[0]];assert.equal(isRight(T,swapped),false,"ein falsches Paar genügt");
  const r=termResults(T,swapped);assert.equal(r.length,n);assert.deepEqual(r.map(x=>x.ok),T.a.map((x,i)=>swapped[i]===x));
  assert.ok(r.filter(x=>!x.ok).length===2);
  // Ansicht: gleiche Farbe für Paar, Fertig erst wenn alle gesetzt, danach werden die falschen Paare gezeigt
  const G={pairs:T.left.map(()=>-1),msel:-1,done:false};
  let h=newInputHTML(T,G);assert.ok(h.includes("data-ml=\"0\"")&&h.includes("data-mr=\"0\"")&&h.includes('id="fin"')&&/id="fin" disabled/.test(h));
  G.pairs[0]=T.a[0];h=newInputHTML(T,G);
  const col=/--pc:(#[0-9a-f]{6})/g,cols=[...h.matchAll(col)].map(m=>m[1]);assert.equal(cols.length,2);assert.equal(cols[0],cols[1],"beide bekommen dieselbe Farbe");
  G.pairs=pairs.slice();h=newInputHTML(T,G);assert.ok(!/id="fin" disabled/.test(h));
  Object.assign(G,{done:true,given:swapped,pairs:null});h=newInputHTML(T,G);
  assert.ok(h.includes("gehört zu")&&(h.match(/<li>/g)||[]).length===2&&h.includes("mitem right")&&h.includes("mitem wrong"));
  G.given=pairs;h=newInputHTML(T,G);assert.ok(!h.includes("gehört zu"));
});
test("Sortieren, Reihenfolge und Bild wählen: Ansichten und Auswertung",()=>{
  const S=GEN.su_verkehr,pick=type=>{for(let i=0;i<500;i++){const T=GEN.su_wasser();if(T.type===type)return T;}for(let i=0;i<500;i++){const T=S();if(T.type===type)return T;}throw new Error(type);};
  const so=pick("sort"),G={sortA:so.cards.map(()=>-1),ssel:-1,done:false};
  let h=newInputHTML(so,G);assert.ok(so.cards.every((_,i)=>h.includes(`data-sc="${i}"`))&&so.baskets.every((_,j)=>h.includes(`data-sb="${j}"`))&&/id="fin" disabled/.test(h));
  G.sortA=so.a.slice();h=newInputHTML(so,G);assert.ok(so.cards.every((_,i)=>h.includes(`data-sp="${i}"`))&&!/id="fin" disabled/.test(h)&&!h.includes("data-sc="));
  const bad=wrong(so);Object.assign(G,{done:true,given:bad});h=newInputHTML(so,G);assert.ok(h.includes("gehört zu")&&h.includes("scard in wrong")&&h.includes("scard in right"));
  const od=pick("order");
  const G2={ord:[],done:false};h=newInputHTML(od,G2);assert.ok(od.cards.every((_,i)=>h.includes(`data-oc="${i}"`))&&h.includes('id="ordReset"')&&/id="fin" disabled/.test(h));
  G2.ord=od.a.slice(0,2);h=newInputHTML(od,G2);assert.ok(h.includes('<b class="onum">1</b>')&&h.includes('<b class="onum">2</b>'));
  G2.ord=od.a.slice();h=newInputHTML(od,G2);assert.ok(!/id="fin" disabled/.test(h));
  Object.assign(G2,{done:true,given:wrong(od)});h=newInputHTML(od,G2);assert.ok(h.includes("So ist es richtig")&&h.includes('class="wrong"'));
  const pc=GEN.en_tiere({level:1}),G3={done:false};h=newInputHTML(pc,G3);assert.ok(pc.tiles.every((_,i)=>h.includes(`data-pic="${i}"`)));
  Object.assign(G3,{done:true,given:(pc.a+1)%pc.tiles.length});h=newInputHTML(pc,G3);assert.ok(h.includes("ptile right")&&h.includes("ptile wrong")&&h.includes(`<small>${pc.speak}</small>`));
});
test("Kompassrose: Norden ist beschriftet, gefragt wird nach Osten, Süden oder Westen",()=>{
  let n=0;
  for(let i=0;i<3000&&n<30;i++){const T=GEN.su_himmel();if(T.layout!=="compass")continue;n++;
    assert.deepEqual(T.tiles.map(t=>t.name),["Norden","Osten","Süden","Westen"]);assert.ok(T.a>=1&&T.a<=3);assert.equal(T.tiles[0].t,"N");assert.ok(T.tiles.slice(1).every(t=>t.t===""));
    assert.ok(T.q.includes(T.tiles[T.a].name));assert.ok(!T.hint.includes(T.tiles[T.a].name));
    const h=newInputHTML(T,{done:false});assert.ok(h.includes('class="compass"')&&(h.match(/data-pic=/g)||[]).length===4);}
  assert.ok(n>0);
  for(let i=0;i<300;i++){const T=GEN.su_himmel();if(T.vis&&T.vis.includes("Kompassrose")){assert.ok(T.vis.includes("<svg")&&T.choices.length===4);break;}}
});
test("Päckchen für Englisch und Sachkunde: 4 Aufgaben ohne Doppelte, Englisch in der gewählten Stufe",()=>{
  for(const t of [...ENG_IDS,...SU_IDS]){
    assert.equal(packLen(t),4);
    for(let k=0;k<30;k++){const pk=packOf(t,undefined,{level:2});assert.equal(pk.length,4);
      assert.equal(new Set(pk.map(T=>T.sig+"|"+T.q)).size,4,t+" doppelt im Päckchen");
      for(const T of pk){assert.equal(T.topic,t);if(ENG_IDS.includes(t))assert.equal(T.type,"match");}}
  }
  // Auswertung und Kontroll-Pfiff: Bonus für selbst gefundene Fehler gilt auch für die neuen Aufgabenarten
  const tasks=packOf("en_tiere",undefined,{level:2}),answers=tasks.map(wrong),finals=tasks.map((T,i)=>i<2?correct(T):answers[i]);
  const g=gradePack({tasks,answers,finals,checked:true});assert.equal(g.fixed,2);assert.deepEqual(g.items.map(x=>x.ok),[true,true,false,false]);
});
test("Hilfe: das ähnliche Beispiel hat eine andere Lösung und verrät die echte nie",()=>{
  for(const t of [...ENG_IDS,...SU_IDS])for(let n=0;n<60;n++){
    const T={topic:t,...GEN[t]({level:1+n%3})},E=similarExample(GEN,T);
    if(!E)continue;
    assert.notEqual(String(rightText(E)),String(rightText(T)),t);
    assert.ok(!leaks(E.q+" "+E.ex,rightText(T)),`Beispiel verrät Lösung: ${t}`);
    assert.equal(E.level,T.level||E.level,"gleiche Stufe");
  }
});

// ---------- Vorlesen ----------
test("Vorlesen: Stimme en-GB bevorzugt, sonst en-US; ohne englische Stimme sind Taste und Hör-Aufgaben weg",()=>{
  const de={lang:"de-DE",name:"Anna"},us={lang:"en-US",name:"Sam"},gb={lang:"en_GB",name:"Daniel"};
  withStimme([de],said=>{assert.equal(canSpeak(),false);assert.equal(speakBtn("dog"),"");assert.equal(speak("dog"),false);assert.equal(said.length,0);
    for(let n=0;n<600;n++){const T=GEN[ENG_IDS[n%10]]({level:1+n%3});assert.ok(!T.listen);}
    const s=fresh(),T={topic:"en_tiere",...GEN.en_tiere({level:1})};
    const G={li:1,mode:"eng",trial:false,pool:ENG_IDS,len:8,i:0,res:[],hist:[],pts:0,streak:0,rival:"X",last:null,task:T,input:"",inp:["",""],act:0,done:false,pickIdx:-1,given:null};
    assert.ok(!/data-say|Anhören|\u{1F50A}/u.test(playHTML(s,G)));
    const G2={...G,task:{topic:"en_tiere",...GEN.en_tiere({level:2})}};assert.ok(!/data-say|\u{1F50A}/u.test(playHTML(s,G2)));});
  withStimme([],()=>assert.equal(canSpeak(),false));
  globalThis.speechSynthesis=undefined;assert.equal(canSpeak(),false);delete globalThis.speechSynthesis;
  withStimme([de,us],said=>{assert.equal(englishVoice().lang,"en-US");assert.equal(canSpeak(),true);assert.ok(speakBtn("dog").includes('data-say="dog"'));assert.equal(speak("dog"),true);assert.equal(said.length,1);assert.equal(said[0].text,"dog");assert.equal(said[0].voice,us);});
  withStimme([de,us,gb],said=>{assert.equal(englishVoice(),gb,"en-GB wird bevorzugt");speak("cat");assert.equal(said[0].lang,"en_GB");});
  withStimme([us,{lang:"en-AU"}],()=>assert.equal(englishVoice(),us));
  withStimme([{lang:"en-AU",name:"Karen"}],()=>assert.equal(englishVoice().lang,"en-AU"));
});
test("Mit Stimme: 🔊 an jedem englischen Wort, Hör-Aufgabe nennt das Wort nicht im Text",()=>{
  withStimme([{lang:"en-GB",name:"Daniel"}],()=>{
    const s=fresh();let listen=0,l1=0,l2=0;
    for(let n=0;n<1500;n++){
      const t=ENG_IDS[n%10],level=1+n%3,T={topic:t,...GEN[t]({level})};
      const G={li:1,mode:"eng",trial:false,pool:ENG_IDS,len:8,i:0,res:[],hist:[],pts:0,streak:0,rival:"X",last:null,task:T,input:"",inp:["",""],act:0,done:false,pickIdx:-1,given:null};
      const h=playHTML(s,G);
      if(T.listen){listen++;checkTask(T,"Hör-Aufgabe");assert.ok(h.includes(`data-say="${T.say}"`)&&h.includes("Anhören"));
        const visible=plain(h.replace(/<svg[\s\S]*?<\/svg>/g,""));assert.ok(!new RegExp(`\\b${T.say}\\b`,"i").test(visible.replace(/Englisch: [^\n]*/g,"")),"Hör-Aufgabe zeigt das Wort nicht: "+T.say);
        assert.ok(T.tiles.every(x=>!x.name||!h.includes(`<small>${x.name}</small>`)),"Namen der Bilder erst nach der Antwort");}
      else if(level===1){l1++;assert.ok(h.includes(`data-say="${T.speak}"`),"🔊 am Wort der Frage");}
      else if(level===2){l2++;assert.equal((h.match(/class="spk/g)||[]).length,T.left.length,"🔊 an jedem englischen Wort");}
    }
    assert.ok(listen>150&&l1>100&&l2>100,`listen ${listen}, l1 ${l1}, l2 ${l2}`);
  });
});

// ---------- Themensteuerung ----------
test("Themensteuerung: Vorgabe aktuell, aus = nicht im Mix, nicht in der Themenliste; wiederholen kommt seltener",()=>{
  const s=fresh(),c=dev("d1",2000);
  for(const t of allTopicsOf(1))assert.equal(topicModeOf(s,t),"aktuell");
  assert.equal(applyTopicMode(s,c,"m3_rest","aus"),true);assert.equal(topicModeOf(s,"m3_rest"),"aus");assert.equal(topicOn(s,"m3_rest"),false);
  assert.equal(s.settings.t,2000);assert.equal(s.meta.updatedAt,2000);
  assert.equal(applyTopicMode(s,c,"m3_rest","quatsch"),false);assert.equal(applyTopicMode(s,c,"gibtsnicht","aus"),false);
  const pool=LIGEN[1].math.concat(LIGEN[1].deu);
  for(let i=0;i<500;i++)assert.notEqual(nextTopic(s,pool,null),"m3_rest");
  assert.ok(!activeTopics(s,pool).includes("m3_rest"));
  // Wiederholen: seltener
  applyTopicMode(s,c,"m3_1x1","wiederholen");
  const base=weightOf(fresh(),"m3_1x1"),rep=weightOf(s,"m3_1x1");assert.ok(rep<base*.5,`wiederholen ${rep} gegen aktuell ${base}`);
  let n=0;for(let i=0;i<4000;i++)if(nextTopic(s,pool,null)==="m3_1x1")n++;
  let n0=0;const s0=fresh();for(let i=0;i<4000;i++)if(nextTopic(s0,pool,null)==="m3_1x1")n0++;
  assert.ok(n>0&&n<n0*.6,`wiederholen ${n} gegen aktuell ${n0}`);
  applyTopicMode(s,c,"m3_1x1","aktuell");assert.equal(topicModeOf(s,"m3_1x1"),"aktuell");assert.ok(!("m3_1x1" in s.settings.topicMode));
  // für alle Fächer (auch Englisch, Sachkunde, Trainingscamp)
  for(const t of ["en_tiere","su_wasser","m_read","d4_rede"])assert.equal(applyTopicMode(s,c,t,"aus"),true,t);
  // Einstellungen danach bleiben erhalten (Tipp-Zeit ändern löscht die Themensteuerung nicht), auch beim Zurücksetzen des Spielstands
  applySettings(s,dev("d1",2500),{hintAfter:60});assert.equal(topicModeOf(s,"en_tiere"),"aus");
  assert.equal(topicModeOf(applyReset(s,dev("d1",3000)),"en_tiere"),"aus");
});
test("Aufstieg: ein Thema auf aus blockiert nicht, Englisch und Sachkunde zählen nie",()=>{
  const s=fresh(),c=dev("d1",2000);let t=10;
  const safe=topic=>{for(let i=0;i<10;i++)applyAnswer(s,dev("d1",t++),{topic,ok:i<8,gain:10,li:1,trial:false});};
  const gate=topicsOf(1);
  for(const topic of gate.slice(0,-1))safe(topic);
  assert.equal(mastered(s,1),false,"ein Thema fehlt");
  applyTopicMode(s,c,gate[gate.length-1],"aus");
  assert.equal(mastered(s,1),true,"das ausgeschaltete Thema blockiert nicht");
  assert.equal(safeCount(s,1),gate.length-1);assert.equal(gateTopics(s,1).length,gate.length-1);
  // Englisch und Sachkunde sind nicht nötig ...
  assert.ok([...ENG_IDS,...SU_IDS].every(x=>!topicSafe(s,x)));
  // ... und zählen nicht als Ersatz
  const s2=fresh();for(const topic of [...ENG_IDS,...SU_IDS])for(let i=0;i<10;i++)applyAnswer(s2,dev("d1",t++),{topic,ok:true,gain:10,li:1,trial:false,lv:3});
  assert.equal(mastered(s2,1),false);assert.equal(safeCount(s2,1),0);
  // alles aus: nichts zu schaffen, aber auch kein Aufstieg von selbst
  const s3=fresh();for(const topic of gate)applyTopicMode(s3,dev("d1",t++),topic,"aus");assert.equal(mastered(s3,1),false);
  // der Aufstieg geschieht am Spielende über Mathe und Deutsch
  const s4=fresh();for(const topic of topicsOf(0))for(let i=0;i<10;i++)applyAnswer(s4,dev("d1",t++),{topic,ok:i<8,gain:10,li:0,trial:false});
  assert.equal(leagueState(s4,1),"locked");const r=applyRoundEnd(s4,dev("d1",t++),{li:0,mode:"eng",trial:false,c:8,n:8,pts:80,bonus:20});
  assert.match(r.celebrate,/Kreisliga/);assert.equal(leagueState(s4,1),"probe");assert.equal(s4.history.at(-1).mode,"eng");
});

// ---------- Stufen und Begriffe ----------
test("Englisch-Stufe steigt ab 8 von 10 richtig in der aktuellen Stufe, sinkt nie; Häkchen erst in Stufe 3",()=>{
  const s=fresh();let t=10;const play=(n,ok,lv)=>{for(let i=0;i<n;i++)applyAnswer(s,dev("d1",t++),{topic:"en_tiere",ok:ok(i),gain:10,li:1,trial:false,lv});};
  assert.equal(lvOf(s,"en_tiere"),1);
  play(9,()=>true,1);assert.equal(lvOf(s,"en_tiere"),1,"erst nach 10 Antworten");
  play(1,()=>true,1);assert.equal(lvOf(s,"en_tiere"),2);
  play(10,i=>i<7,2);assert.equal(lvOf(s,"en_tiere"),2,"7 von 10 reichen nicht");
  play(10,i=>i<8,2);assert.equal(lvOf(s,"en_tiere"),3,"8 von 10 reichen");
  assert.equal(topicSafe(s,"en_tiere"),true);assert.equal(topicDone(s,"en_tiere"),true);
  play(10,()=>false,3);assert.equal(lvOf(s,"en_tiere"),3,"die Stufe sinkt nie");assert.equal(topicDone(s,"en_tiere"),false,"aber das Häkchen geht, wenn es nicht mehr sicher ist");
  const s2=fresh();t=10;for(let i=0;i<10;i++)applyAnswer(s2,dev("d1",t++),{topic:"en_farben",ok:true,gain:10,li:1,trial:false,lv:1});
  assert.equal(topicSafe(s2,"en_farben"),true);assert.equal(topicDone(s2,"en_farben"),false,"sicher, aber Stufe 1: noch kein Häkchen");
  assert.deepEqual(fachProgress(s,1,"eng"),{done:0,total:10});assert.deepEqual(fachProgress(s,1,"su"),{done:0,total:7});
  for(const x of s.stats.en_tiere.last)assert.ok(x.lv>=1);
});
test("Statistik je Begriff: Zuordnen und Sortieren je Begriff, Zähler je Gerät, Summe angezeigt",()=>{
  const s=fresh();
  const T=GEN.en_tiere({level:2}),val=T.a.slice();[val[0],val[1]]=[val[1],val[0]];
  applyAnswer(s,dev("d1",2000),{topic:"en_tiere",ok:false,gain:0,li:1,trial:false,lv:2,terms:termResults(T,val)});
  applyAnswer(s,dev("d1",2001),{topic:"en_tiere",ok:true,gain:10,li:1,trial:false,lv:2,terms:termResults(T,T.a)});
  const m=termsOf(s,"en_tiere");
  for(const id of T.terms)assert.equal(m[id].a,2,id);
  assert.equal(m[T.terms[0]].c,1);assert.equal(m[T.terms[2]].c,2);
  const S=(()=>{for(let i=0;i<500;i++){const x=GEN.su_wasser();if(x.type==="sort")return x;}})();
  const r=termResults(S,S.a);assert.equal(r.length,S.cards.length);assert.ok(r.every(x=>x.ok));
  const P=GEN.en_tiere({level:1});assert.deepEqual(termResults(P,P.a),[{id:P.term,ok:true}]);assert.deepEqual(termResults(P,(P.a+1)%P.tiles.length),[{id:P.term,ok:false}]);
  assert.deepEqual(termResults({type:"order",a:[0],cards:[{t:"x"}]},[0]),[],"Reihenfolge hat keine Begriffe");
  assert.equal(answersOf(s,"en_tiere").a,2);
});
test("Zusammenführen: Stufe steigt nie zurück (höherer Wert), Begriffszähler je Gerät, Themensteuerung vom neueren Stand",()=>{
  const a=fresh(),b=clone(a);b.meta.deviceId="B";
  const term=(s,d,now,ok)=>applyAnswer(s,dev(d,now),{topic:"en_tiere",ok,gain:0,li:1,trial:false,lv:1,terms:[{id:"dog",ok}]});
  term(a,"A",2000,true);term(a,"A",2001,false);term(b,"B",3000,true);
  a.stats.en_tiere.lv=2;b.stats.en_tiere.lv=3;
  applyTopicMode(a,dev("A",4000),"su_wasser","aus");applyTopicMode(b,dev("B",5000),"en_farben","wiederholen");
  const ab=mergeProfile(a,b),ba=mergeProfile(b,a),strip=s=>{const x=clone(s);delete x.meta.deviceId;return canon(x);};
  assert.equal(strip(ab),strip(ba),"unabhängig von der Reihenfolge");
  assert.equal(ab.stats.en_tiere.lv,3);assert.equal(termsOf(ab,"en_tiere").dog.a,3);assert.equal(termsOf(ab,"en_tiere").dog.c,2);
  assert.deepEqual(ab.settings.topicMode,{en_farben:"wiederholen"},"der neuere Stand der Einstellungen gewinnt");
  assert.equal(strip(mergeProfile(ab,b)),strip(ab),"zweimal zusammenführen zählt nichts doppelt");
  const old=fresh(),neu=clone(old);neu.stats.en_tiere={tot:{},last:[],lv:2};
  assert.equal(mergeProfile(old,neu).stats.en_tiere.lv,2);assert.equal(mergeProfile(neu,old).stats.en_tiere.lv,2);
});

// ---------- Ansichten ----------
test("Kreisliga zeigt Englisch und Sachkunde mit Mix und Themenblöcken; Trainingscamp und Bezirksliga nicht",()=>{
  const s=fresh();
  for(const li of [0,1,2]){
    s.progress.cur={li,t:5};s.progress.lg.L2={probe:false,spent:0,open:true,trial:"",t:1};s.progress.lg.L3={probe:false,spent:0,open:true,trial:"",t:1};
    const h=homeHTML(s,UI0(),env);
    assert.equal(h.includes('data-fach="1:eng"'),li===1,"Englisch nur in der Kreisliga");assert.equal(h.includes('data-fach="1:su"'),li===1);
    if(li!==1){assert.ok(!h.includes("Englisch")||!h.includes('data-fach='+'"'+li+':eng"'));assert.ok(!h.includes(`data-fach="${li}:su"`)&&!h.includes(`data-fach="${li}:eng"`));}
  }
  s.progress.cur={li:1,t:6};
  const h=homeHTML(s,{...UI0(),fach:"1:eng"},env);
  assert.ok(h.includes("Mix: alles aus Englisch")&&h.includes('data-play="1:eng"'));
  for(const t of ENG_IDS)assert.ok(h.includes(`data-play="1:topic:${t}"`)&&h.includes(TOPICS[t]),t);
  assert.ok(h.includes("Stufe 1 von 3")&&h.includes("Päckchen mit 4 Aufgaben"));
  const hs=homeHTML(s,{...UI0(),fach:"1:su"},env);
  assert.ok(hs.includes("Mix: alles aus Sachkunde")&&hs.includes('data-play="1:su"'));
  for(const t of SU_IDS)assert.ok(hs.includes(`data-play="1:topic:${t}"`),t);
  assert.ok(!hs.includes(`data-play="1:topic:en_tiere"`),"Englisch-Themen nicht im Sachkunde-Fach");
  // das fachübergreifende Mix-Spiel bleibt, die Fächer stehen daneben
  assert.ok(h.includes('data-play="1:mix"')&&h.includes("Mix: Mathe &amp; Deutsch"));
  assert.ok(h.includes("Englisch: 0 von 10 Themen sicher")&&h.includes("Sachkunde: 0 von 7 Themen sicher")&&h.includes("zählt nicht für den Aufstieg"));
  // Kopfzeile: Aufstiegs-Stand nur Mathe und Deutsch
  assert.ok(h.includes("0 von 10 Themen sicher"));
});
test("Themensteuerung in der Ansicht: ausgeschaltete Themen sind ausgeblendet, Wiederholen ist markiert",()=>{
  const s=fresh();s.progress.cur={li:1,t:5};s.progress.lg.L2={probe:false,spent:0,open:true,trial:"",t:1};
  applyTopicMode(s,dev("d1",2000),"en_tiere","aus");applyTopicMode(s,dev("d1",2001),"en_farben","wiederholen");applyTopicMode(s,dev("d1",2002),"m3_rest","aus");applyTopicMode(s,dev("d1",2003),"su_wasser","aus");
  const h=homeHTML(s,{...UI0(),fach:"1:eng"},env);
  assert.ok(!h.includes('data-play="1:topic:en_tiere"')&&!h.includes(TOPICS.en_tiere),"aus: ausgeblendet");
  assert.ok(h.includes('data-play="1:topic:en_farben"')&&h.includes("wiederholen"));
  assert.ok(!h.includes(TOPICS.m3_rest)&&!h.includes(TOPICS.su_wasser),"auch in Chips und Trainerbank");
  assert.ok(h.includes("Englisch: 0 von 9 Themen sicher")&&h.includes("Sachkunde: 0 von 6 Themen sicher")&&h.includes("0 von 9 Themen sicher"));
  for(const t of SU_IDS.filter(x=>x!=="su_wasser"))assert.ok(homeHTML(s,{...UI0(),fach:"1:su"},env).includes(`data-play="1:topic:${t}"`));
  for(const t of ENG_IDS)applyTopicMode(s,dev("d1",3000),t,"aus");
  const none=homeHTML(s,{...UI0(),fach:"1:eng"},env);assert.ok(none.includes("kein Thema angeschaltet")&&!none.includes("Mix: alles aus Englisch"));
});
test("Spielansicht der neuen Aufgabenarten, Probe im Päckchen zeigt 'Schau dir jedes Paar noch einmal an'",()=>{
  const s=fresh();
  for(const make of [()=>GEN.en_tiere({level:1}),()=>GEN.en_tiere({level:2}),()=>GEN.en_tiere({level:3}),()=>{for(;;){const T=GEN.su_tiere();if(T.type==="sort")return T;}},()=>{for(;;){const T=GEN.su_getreide();if(T.type==="order")return T;}}]){
    const T={topic:"en_tiere",...make()},G={li:1,mode:"eng",trial:false,pool:ENG_IDS,len:8,i:0,res:[],hist:[],pts:0,streak:0,rival:"X",last:null,task:T,input:"",inp:["",""],act:0,done:false,pickIdx:-1,given:null,
      pairs:T.type==="match"?T.left.map(()=>-1):null,msel:-1,sortA:T.type==="sort"?T.cards.map(()=>-1):null,ssel:-1,ord:[]};
    let h=playHTML(s,G);assert.ok(h.includes("Aufgabe 1 von 8")&&!/undefined|NaN|\[object/.test(h),T.type);
    Object.assign(G,{done:true,ok:true,given:correct(T),res:[true],gain:10});h=playHTML(s,G);assert.ok(h.includes("Tor!"),T.type);
    Object.assign(G,{done:true,ok:false,given:wrong(T),res:[false],gain:0});h=playHTML(s,G);assert.ok(h.includes("Richtig ist")&&!/undefined|NaN|\[object/.test(h),T.type);
  }
  const M=GEN.en_tiere({level:2});assert.ok(probeHTML(M,M.a).includes("Schau dir jedes Paar noch einmal an")&&!leaks(probeHTML(M,M.a),rightText(M)));
});

// ---------- Eltern-Bereich ----------
const aModel=(tab,s)=>({tab,msg:null,accounts:[{id:"k-emil0001",name:"Emil",state:s}],sel:"k-emil0001",renaming:null,renamingDevice:null,confirm:null,moreDaily:false,deviceId:"g-ipad00001",
  appVersion:"1.4.0",persistent:true,previewLabel:"",schema:{app:5,global:3},server:{state:"ok",config:null,backups:[],devices:[]}});
test("Eltern-Bereich: Themensteuerung je Konto (aktuell, wiederholen, aus) für alle Fächer, Lernstand mit Stufe und Begriffen",()=>{
  const s=fresh();applyTopicMode(s,dev("d1",2000),"d4_rede","aus");applyTopicMode(s,dev("d1",2001),"su_kartoffel","wiederholen");
  const h=adminHTML(aModel("settings",s));
  for(let i=0;i<LIGEN.length;i++)for(const t of allTopicsOf(i)){
    for(const m of ["aktuell","wiederholen","aus"])assert.ok(h.includes(`data-atopic="${t}:${m}"`),`${t}:${m}`);
  }
  assert.ok(h.includes("Themen im Unterricht")&&h.includes("Sachkunde")&&h.includes("Englisch")&&h.includes("Trainingscamp")&&h.includes("Bezirksliga"));
  assert.ok(/data-atopic="d4_rede:aus" aria-pressed="true"/.test(h)&&/data-atopic="su_kartoffel:wiederholen" aria-pressed="true"/.test(h)&&/data-atopic="m3_rest:aktuell" aria-pressed="true"/.test(h));
  assert.ok(!/undefined|NaN|\[object/.test(h));
  // Lernstand
  let t=10;for(let i=0;i<10;i++)applyAnswer(s,dev("d1",t++),{topic:"en_tiere",ok:true,gain:10,li:1,trial:false,lv:1,terms:[{id:"dog",ok:i%2===0},{id:"cat",ok:true}]});
  const st=adminHTML(aModel("stand",s));
  assert.ok(st.includes("Englisch: Tiere (Stufe 2)")&&st.includes("Begriffe (Englisch und Sachkunde)")&&st.includes("dog")&&st.includes("5/10"));
  assert.ok(st.includes("Wortarten (Mathe und Deutsch)")||st.includes("Themen zuletzt sicher geübt (Mathe und Deutsch)"));
  assert.ok(st.indexOf("dog")<st.indexOf("cat"),"schwächster Begriff zuerst");
  assert.ok(st.includes("(aus)")&&st.includes("(wiederholen)"));
});

// ---------- Dateien ----------
test("Neue Dateien stehen im Service Worker, Version 1.7.6 an allen vier Stellen, Inhaltsliste ist vollständig",()=>{
  const ROOT=fileURLToPath(new URL("..",import.meta.url)),sw=fs.readFileSync(path.join(ROOT,"app/sw.js"),"utf8");
  for(const f of ["content-en.js","content-su.js","speech.js","tasks.js","inputs.js","icons.js"])assert.ok(sw.includes(`"js/${f}"`),f);
  assert.match(fs.readFileSync(path.join(ROOT,"app/js/version.js"),"utf8"),/"1.7.6"/);assert.match(sw,/VERSION = "1.7.6"/);
  assert.match(fs.readFileSync(path.join(ROOT,"server/server.js"),"utf8"),/SERVER_VERSION = "1.7.6"/);assert.equal(JSON.parse(fs.readFileSync(path.join(ROOT,"package.json"),"utf8")).version,"1.7.6");
  const doc=fs.readFileSync(path.join(ROOT,"docs/Inhalte-Englisch-Sachkunde.md"),"utf8");
  for(const [id,t] of Object.entries(EN_TOPICS)){assert.ok(doc.includes("`"+id+"`"),id);for(const w of t.words){assert.ok(doc.includes(`| ${w[0]} | ${w[1]} |`),w[0]);assert.ok(doc.includes(w[3])&&doc.includes(w[4]),w[0]);}}
  for(const [id,t] of Object.entries(SU_TOPICS)){assert.ok(doc.includes("`"+id+"`"),id);for(const d of t.tasks){if(d.hint)assert.ok(doc.includes(d.hint),d.hint);if(d.unsure)assert.ok(doc.includes(d.unsure),d.unsure);
    if(d.right)assert.ok(doc.includes(d.right));if(d.steps)for(const s of d.steps)assert.ok(doc.includes(s),s);if(d.cards)for(const c of d.cards)assert.ok(doc.includes(c[0]),c[0]);if(d.pairs)for(const p of d.pairs)assert.ok(doc.includes(p[1]),p[1]);}}
  assert.ok(!/[—–]/.test(doc),"Gedankenstrich in der Inhaltsliste");
  assert.ok(doc.includes("unsicher"));
});
