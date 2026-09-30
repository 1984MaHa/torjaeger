// Version 1.4.1: Rückmeldungen nach der ersten Sicht (Kontroll-Pfiff zeigt das Gesuchte, keine doppelten Fragen, Paarfarben ohne Rot und Grün,
// "Stoff noch nicht gehabt", ruhigere Aufgabenansicht, Fach-Symbole, Trainerbank eingeklappt).
import {test} from "node:test";
import assert from "node:assert/strict";
import {GEN} from "../app/js/generators.js";
import {ENG_IDS,LATE_IDS,SU_IDS,LIGEN} from "../app/js/content.js";
import {EN_TOPICS} from "../app/js/content-en.js";
import {newProfile,statOf} from "../app/js/model.js";
import {applyAnswer,weightOf,topicSafe} from "../app/js/rules.js";
import {packOf,keyOf} from "../app/js/check.js";
import {coachHTML} from "../app/js/coach.js";
import {homeHTML,playHTML} from "../app/js/views.js";
import {PAIR_COLORS} from "../app/js/inputs.js";
import {ICONS} from "../app/js/icons.js";
import {cleanTrainer} from "../app/js/avatar.js";

const fresh=()=>newProfile({id:"k-emil0001",name:"Emil",deviceId:"d1",now:1000});
const dev=(t)=>({deviceId:"d1",now:t});
const env={hasPin:true,syncText:"noch nie",updateReady:false,persistent:true,version:"1.4.1"};
const UI0=()=>({parent:false,pinMsg:"",celebrate:"",newAcct:false,acctMsg:"",sync:"",fach:null,lgOpen:{}});
const trainers=[cleanTrainer({name:"Coach Marco"},1),cleanTrainer({name:"Coach Ina"},2)];
const hue=hex=>{const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255),mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;
  if(!d)return 0;const h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;return(h*60+360)%360;};

test("Paarfarben beim Zuordnen: weder rot noch grün, alle verschieden",()=>{
  assert.equal(new Set(PAIR_COLORS).size,PAIR_COLORS.length);assert.ok(PAIR_COLORS.length>=5);
  for(const c of PAIR_COLORS){const h=hue(c);assert.ok(!(h<=20||h>=340),`${c} wirkt rot (${h})`);assert.ok(!(h>=80&&h<=160),`${c} wirkt grün (${h})`);}
});
test("Dieselbe Frage kommt nicht zweimal: gleiche Kennung je Englisch-Wort in allen Stufen, Päckchen ohne Doppelte",()=>{
  for(const t of ENG_IDS)for(const w of EN_TOPICS[t].words){
    const keys=new Set();
    for(let n=0;n<300;n++){const T=GEN[t]({level:1+n%3});if(T.sig&&T.sig.startsWith("w|")&&T.sig==="w|"+w[0])keys.add(T.topic?keyOf(T):T.sig);}
    // Stufe 1, Hör-Aufgabe und Stufe 3 desselben Wortes teilen die Kennung (nur die Frageform unterscheidet sich im Text, nicht die Kennung)
    for(const k of keys)assert.ok(k.includes("w|"+w[0]));
  }
  const a=GEN.en_tiere({level:1}),b=GEN.en_tiere({level:3});
  let x=null,y=null;for(let i=0;i<500&&!(x&&y);i++){const T=GEN.en_tiere({level:1});if(T.sig==="w|dog")x=T;const U=GEN.en_tiere({level:3});if(U.sig==="w|dog")y=U;}
  assert.ok(x&&y);assert.equal(x.sig,y.sig);assert.ok(a&&b);
  for(const t of [...ENG_IDS,...SU_IDS])for(let k=0;k<40;k++){const pk=packOf(t,undefined,{level:1+k%3});assert.equal(new Set(pk.map(keyOf)).size,pk.length,t);}
});
test("Kontroll-Pfiff zeigt, was gesucht war: Bild, Hörtaste und die Antwort als Bild",()=>{
  const s=fresh();
  const mk=T=>({li:1,mode:"topic",topic:T.topic,pack:true,phase:"check",tasks:[T],finals:[T.type==="pic"?0:T.a],probeOpen:{},len:1,i:0,res:[],rival:"X",task:T});
  const T3={topic:"en_farben",...GEN.en_farben({level:3})};
  let h=playHTML(s,mk(T3));assert.ok(h.includes("Kontroll-Pfiff")&&h.includes("tile col big"),"Stufe 3: das Bild zur Frage ist zu sehen");
  const T1={topic:"en_farben",...GEN.en_farben({level:1,listen:false})};
  h=playHTML(s,mk(T1));assert.ok(h.includes("tile col")&&h.includes("Deine Antwort"),"Antwort als Farbkasten");
  const T0={topic:"en_tiere",type:"pic",q:"Hör zu",listen:true,say:"dog",tiles:[{t:"\u{1F436}",k:"emo",name:"dog"},{t:"\u{1F431}",k:"emo",name:"cat"},{t:"\u{1F434}",k:"emo",name:"horse"}],a:0,ex:"x",hint:"y",sig:"w|dog"};
  const old=globalThis.speechSynthesis;globalThis.speechSynthesis={getVoices:()=>[{lang:"en-GB"}],speak(){},cancel(){}};
  try{h=playHTML(s,mk(T0));assert.ok(h.includes('data-say="dog"')&&h.includes("noch einmal anhören"),"Hör-Aufgabe: Wort im Kontrollieren wieder anhören");}
  finally{if(old===undefined)delete globalThis.speechSynthesis;else globalThis.speechSynthesis=old;}
});
test("Stoff noch nicht gehabt (Himmelsrichtungen): seltener, als solche gekennzeichnet, falsche Antwort zählt nicht",()=>{
  assert.deepEqual(LATE_IDS,["su_himmel"]);
  for(let i=0;i<100;i++){const T=GEN.su_himmel();assert.equal(T.late,true);}
  for(let i=0;i<100;i++)assert.ok(!GEN.su_wasser().late&&!GEN.en_tiere({level:1}).late);
  const s=fresh();assert.ok(weightOf(s,"su_himmel")<weightOf(s,"su_wasser")*.6,"kommt seltener dran");
  // falsch zählt nicht: kein Eintrag, kein Zähler, kein Begriff; richtig zählt normal
  applyAnswer(s,dev(2000),{topic:"su_himmel",ok:false,gain:0,li:1,trial:false,soft:true,terms:[{id:"x",ok:false}]});
  assert.equal(s.stats.su_himmel.last.length,0);assert.equal(Object.values(s.stats.su_himmel.tot).reduce((n,x)=>n+x.a,0),0);assert.ok(!s.stats.su_himmel.terms);
  applyAnswer(s,dev(2001),{topic:"su_himmel",ok:true,gain:10,li:1,trial:false,soft:true,terms:[{id:"x",ok:true}]});
  assert.equal(s.stats.su_himmel.last.length,1);assert.equal(s.stats.su_himmel.last[0].ok,1);
  // normale Themen zählen falsche Antworten weiter
  applyAnswer(s,dev(2002),{topic:"su_wasser",ok:false,gain:0,li:1,trial:false});assert.equal(s.stats.su_wasser.last.length,1);
  for(let i=0;i<10;i++)applyAnswer(s,dev(3000+i),{topic:"su_himmel",ok:i%4!==0,gain:0,li:1,trial:false,soft:true});
  assert.equal(topicSafe(s,"su_himmel"),false,"die 3 falschen Antworten zählen nicht mit, es fehlen noch Antworten für die Wertung");
  for(let i=0;i<3;i++)applyAnswer(s,dev(4000+i),{topic:"su_himmel",ok:true,gain:0,li:1,trial:false,soft:true});
  assert.equal(topicSafe(s,"su_himmel"),true,"nur zählende Antworten bilden die Wertung");
  const h=playHTML(s,{li:1,mode:"su",trial:false,pool:SU_IDS,len:8,i:0,res:[],hist:[],pts:0,streak:0,rival:"X",last:null,task:{topic:"su_himmel",...GEN.su_himmel()},input:"",inp:["",""],act:0,done:false,pickIdx:-1,given:null});
  assert.ok(h.includes("noch nicht in der Schule")&&h.includes("Raten ist okay"));
  assert.ok(!playHTML(s,{li:1,mode:"su",trial:false,pool:SU_IDS,len:8,i:0,res:[],hist:[],pts:0,streak:0,rival:"X",last:null,task:{topic:"su_wasser",...GEN.su_wasser()},input:"",inp:["",""],act:0,done:false,pickIdx:-1,given:null}).includes("noch nicht in der Schule"));
});
test("Trainerteam: im Ruhezustand klein oben rechts in der Fragenkachel, groß erst bei Angebot, Hilfe und Antwort",()=>{
  const T={topic:"m3_1x1",type:"num",q:"6 · 7 = ?",a:42,ex:"6 · 7 = 42.",hint:"Denke an die Reihe."};
  let h=coachHTML({T,G:{i:0},trainers});
  assert.ok(h.startsWith('<div class="coach mini"')&&h.includes('id="coachHelp"')&&h.includes("Hilfe vom Trainer")&&h.includes("Coach Marco")&&!h.includes("bubble"));
  assert.ok(!coachHTML({T,G:{i:0,offer:true},trainers}).includes("coach mini")&&coachHTML({T,G:{i:0,offer:true},trainers}).includes("coachYes"));
  assert.ok(!coachHTML({T,G:{i:0,helpLevel:1},trainers}).includes("coach mini"));
  assert.ok(!coachHTML({T,G:{done:true,ok:true,i:0},trainers}).includes("coach mini"));
  const s=fresh(),G={li:1,mode:"mix",trial:false,pool:["m3_1x1"],len:8,i:0,res:[],hist:[],pts:0,streak:0,rival:"X",last:null,task:T,input:"",inp:["",""],act:0,done:false,pickIdx:-1,given:null};
  h=playHTML(s,G);assert.ok(/<div class="cardtop"><div class="tag">[^<]*<\/div><div class="coach mini"/.test(h),"klein in der Kopfzeile der Kachel");
  assert.ok(h.indexOf("coach mini")<h.indexOf('class="q"'));
  h=playHTML(s,{...G,offer:true});assert.ok(h.includes("coachYes")&&!h.includes("coach mini")&&h.indexOf('class="q"')<h.indexOf("coachYes"),"groß erst beim Angebot");
});
test("Startseite: keine grauen Themenkästen, Fach-Symbole statt Buchstaben, Trainerbank eingeklappt",()=>{
  const s=fresh();s.progress.lg.L2={probe:false,spent:0,open:true,trial:"",t:1};s.progress.cur={li:1,t:2};
  let h=homeHTML(s,UI0(),env);
  assert.ok(!h.includes("chipsT"),"keine grauen Themenboxen");
  for(const k of ["math","deu","eng","su","mix"])assert.ok(h.includes(ICONS[k]),k);
  assert.ok(!/class="ic"[^>]*>(\+|Aa|En|Sk|★)</.test(h),"keine Buchstaben im Kreis");
  assert.ok((h.match(/class="ic"[^>]*><svg/g)||[]).length===5);
  for(const k in ICONS)assert.ok(ICONS[k].includes("<svg")&&!/—|–/.test(ICONS[k]));
  assert.ok(/<details data-bank >/.test(h)||/<details data-bank>/.test(h.replace("<details data-bank >","<details data-bank>")),"Trainerbank eingeklappt");
  assert.ok(!/<details data-bank open/.test(h));
  h=homeHTML(s,{...UI0(),bankOpen:true},env);assert.ok(/<details data-bank open/.test(h),"bleibt offen, solange man sie aufgeklappt hat");
  h=homeHTML(s,{...UI0(),parent:true},env);assert.ok(/<details data-bank open/.test(h));
  // die Fachauswahl zeigt weiter jedes Thema als Themenblock
  assert.ok(homeHTML(s,{...UI0(),fach:"1:math"},env).includes('data-play="1:topic:m3_rest"'));
  // andere Ligen klappen ohne Themenkästen auf
  s.progress.cur={li:0,t:5};assert.ok(!homeHTML(s,{...UI0(),lgOpen:{1:true}},env).includes("chipsT"));
});
