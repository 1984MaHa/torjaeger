// Avatar: Eingaben, Torszene mit Treffer und drei Fehlschuss-Varianten, Kacheln; Trainer und Trainerin (Hilfe in zwei Stufen).
// Zeichnung, Baukasten und Datenmodell des neuen Stils (1.3.0) stehen in v13.test.mjs.
import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {fileURLToPath} from "node:url";
import {LIGEN,topicsOf} from "../app/js/content.js";
import {GEN} from "../app/js/generators.js";
import {newProfile} from "../app/js/model.js";
import {HAIRS,TEMPLATES,cleanLook,cleanTrainer,defaultLook,defaultTrainer,defaultTrainer2,lookOf} from "../app/js/avatar.js";
import {avatarSVG,crestSVG,trainerSVG,sceneSVG,pickShot,shotPath,SHOT_KINDS,SHOT_TEXT} from "../app/js/avatardraw.js";
import {leaks,similarExample,exampleHTML,helpBubblesHTML,coachHTML,rightText,speakerOf,FALLBACK_EXAMPLE} from "../app/js/coach.js";
import {playHTML,accountsHTML,homeHTML} from "../app/js/views.js";
import {applyAvatar,applyAnswer} from "../app/js/rules.js";

const CSS=fs.readFileSync(fileURLToPath(new URL("../app/css/style.css",import.meta.url)),"utf8");
const ALL_TOPICS=LIGEN.flatMap((_,i)=>topicsOf(i));
const TRAINERS=[defaultTrainer(),defaultTrainer2()];

function wellFormed(s){
  const stack=[],re=/<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>/g;let m;
  while((m=re.exec(s))){if(m[4]==="/")continue;if(m[1]==="/"){if(stack.pop()!==m[2])return false;}else stack.push(m[2]);}
  return stack.length===0;
}
const noSvg=s=>s.replace(/<svg[\s\S]*?<\/svg>/g,"");
const clean=(s,what)=>{assert.ok(wellFormed(s),what+": nicht wohlgeformt");assert.ok(!/undefined|NaN|\bnull\b|\[object/.test(s),what+": kaputter Wert");assert.ok(!/<script|<img|javascript:|\son[a-z]+\s*=/i.test(s),what+": unsicher");};

test("Eingaben werden entschärft (Name, Mannschaft, Farben)",()=>{
  const evil={hair:2,shirt:"red;stroke:url(x)",shirtName:'"><script>alert(1)</script>',team:"<img src=x onerror=1>",number:"<b>",c1:"#12345",c2:"#ABCDEF"};
  const svg=avatarSVG(evil,{px:80})+sceneSVG(evil,{kind:"goal",side:1})+crestSVG(evil,30);
  clean(svg,"böse Eingaben");
  const l=cleanLook(evil);assert.ok(!/[<>"]/.test(l.shirtName+l.team));assert.equal(l.c2,"#abcdef");assert.notEqual(l.c1,"#12345");assert.equal(l.number,TEMPLATES[0].look.number);
  const tr=cleanTrainer({name:"<b>Coach</b>",look:{jacket:"blue",beard:"ja",glasses:0,hair:9},t:"x"},1);
  assert.ok(!/[<>]/.test(tr.name));assert.equal(tr.look.beard,1);assert.equal(tr.look.glasses,0);assert.equal(tr.look.hair,"ohne");assert.equal(tr.t,0);
  clean(trainerSVG({jacket:"url(#x)"},{px:60,label:'"><script>'}),"Trainer böse");
});

test("Konten ohne Avatar bekommen eine feste Vorgabe aus dem Namen",()=>{
  assert.deepEqual(defaultLook("Emil"),defaultLook("Emil"));
  assert.equal(defaultLook("Emil").shirtName,"EMIL");
  const p={name:"Mia",avatar:null};assert.deepEqual(lookOf(p),defaultLook("Mia"));
  const s=newProfile({id:"k-abc12345",name:"Mia",deviceId:"d"});applyAvatar(s,{deviceId:"d",now:5},{body:"m",hair:6,shirt:"#8e44ad"});
  assert.equal(lookOf(s.profile).hair,"halbzopf");assert.equal(lookOf(s.profile).body,"m");assert.equal(s.profile.avatarAsked,true);assert.equal(s.profile.avatar.t,5);
});

test("Torszene: Treffer und drei Fehlschuss-Varianten, beide Seiten, ohne Vereinsschild",()=>{
  assert.deepEqual(SHOT_KINDS,["goal","post","bar","wide"]);
  const texts=new Set(Object.values(SHOT_TEXT));assert.equal(texts.size,4);assert.equal(SHOT_TEXT.goal,"Tor!");
  for(let i=0;i<50;i++)assert.equal(pickShot(true).kind,"goal");
  const kinds=new Set();for(let i=0;i<300;i++){const s=pickShot(false);kinds.add(s.kind);assert.ok(["post","bar","wide"].includes(s.kind));assert.ok(s.side===-1||s.side===1);}
  assert.deepEqual([...kinds].sort(),["bar","post","wide"]);
  const rnd=(...v)=>()=>v.shift();
  assert.deepEqual([pickShot(false,rnd(0,.1)).kind,pickShot(false,rnd(.4,.9)).kind,pickShot(false,rnd(.9,.9)).kind],["post","bar","wide"]);
  const sides=new Set();for(let i=0;i<100;i++)sides.add(pickShot(true).side);assert.equal(sides.size,2);
  const look={...TEMPLATES[2].look,team:"Geheimer Vereinsname"};
  for(const kind of SHOT_KINDS)for(const side of [-1,1]){
    const svg=sceneSVG(look,{kind,side});clean(svg,kind+side);
    assert.ok(svg.includes(`class="scene sc-${kind}"`)&&svg.includes("ballpos")&&svg.includes("netfx")&&svg.includes("<defs>"));
    assert.ok(!svg.includes("Geheimer Vereinsname"),"der Verein steht nicht dauernd in der Szene");
    const p=shotPath(kind,side);
    for(const pt of [p.start,p.end])assert.ok(pt.x>=0&&pt.x<=340&&pt.y>=0&&pt.y<=230&&pt.s>0&&pt.s<=1,kind+" "+JSON.stringify(pt));
    if(kind==="goal")assert.ok(p.end.x>114&&p.end.x<226&&p.end.y>40&&p.end.y<88,"Tor: Ball im Netz");
    if(kind==="post")assert.ok(p.hit.x===102||p.hit.x===238,"Pfosten: Ball trifft den Pfosten");
    if(kind==="bar")assert.ok(p.hit.y<40&&p.out.y<0,"Latte: Ball springt über das Tor");
    if(kind==="wide")assert.ok(p.end.x<98||p.end.x>242,"knapp vorbei: außerhalb der Pfosten");
    assert.ok(new RegExp(`@keyframes k-${kind}\\b`).test(CSS),"Animation für "+kind);
    // witzige Sprechblase bei Fehlschüssen
    assert.equal(svg.includes('class="pop"'),kind!=="goal");
    if(kind==="post")assert.ok(svg.includes("PLING!"));if(kind==="bar")assert.ok(svg.includes("BONG!"));if(kind==="wide")assert.ok(svg.includes("Uups!"));
  }
  clean(sceneSVG(undefined,undefined),"Vorgabe");
});

test("Sprechblase bleibt in der Fragenbox: Rand und Innenabstand zählen zur Breite",()=>{
  const lines=CSS.split(String.fromCharCode(10));
  const bubble=lines.find(l=>l.startsWith(".bubble{"));
  assert.ok(bubble&&bubble.includes("box-sizing:border-box")&&bubble.includes("max-width:100%")&&bubble.includes("width:100%"));
  assert.ok(CSS.includes(".bubble .vis svg{max-width:100%"));
  assert.ok(lines.find(l=>l.startsWith(".coachside{")).includes("box-sizing:border-box"));
});

test("Bewegung: prefers-reduced-motion schaltet die Szenen-Animationen ab, Ball steht am Endpunkt, Blase sofort da",()=>{
  const start=CSS.indexOf("@media (prefers-reduced-motion:reduce){");assert.ok(start>=0,"Regel fehlt");
  let depth=0,open=CSS.indexOf("{",start),end=open;
  for(;end<CSS.length;end++){if(CSS[end]==="{")depth++;else if(CSS[end]==="}"&&--depth===0)break;}
  const m=[null,CSS.slice(open+1,end)];
  for(const sel of [".scene .pl",".scene .ballpos",".scene .ballspin",".scene .netfx",".ovl",".ovltxt"])assert.ok(m[1].includes(sel),sel);
  assert.ok(/animation:none!important/.test(m[1]));assert.ok(/\.scene \.pop\{animation:none!important;opacity:1\}/.test(m[1]));
  assert.ok(/\.scene \.ballpos\{transform:translate\(var\(--ex\),var\(--ey\)\) scale\(var\(--es\)\)\}/.test(CSS));
  assert.ok(/\.ovl\{position:fixed;inset:0/.test(CSS));
});

test("Kacheln in Wer spielt? und Kabine zeigen den Avatar",()=>{
  const env={hasPin:true,persistent:true,syncText:"",updateReady:false,version:"1.1.0"},UI={newAcct:false,acctMsg:"",adminAsk:false};
  const h=accountsHTML([{id:"k-a",name:"Emil",avatar:cleanLook(TEMPLATES[1].look)},{id:"k-b",name:"Mia",avatar:null}],UI,env);
  assert.equal((h.match(/class="avsvg"/g)||[]).length,2);assert.ok(h.includes(TEMPLATES[1].look.team)&&h.includes(defaultLook("Mia").team));
  const s=newProfile({id:"k-abc12345",name:"Emil",deviceId:"d1"});
  const home=homeHTML(s,{parent:false,pinMsg:""},env);
  assert.ok(home.includes('class="avsvg"')&&home.includes('id="avEdit"'));
});

// ---------- Trainer: Hilfe ----------
test("Jede Aufgabenart hat einen ersten Tipp (hint), der nie die Lösung nennt",()=>{
  for(const t of ALL_TOPICS)for(let n=0;n<300;n++){
    const T={topic:t,...GEN[t]()};
    assert.ok(typeof T.hint==="string"&&T.hint.length>10,"kein Tipp: "+t);
    const others=T.type==="choice"?T.choices.filter(c=>c!==T.a):[];
    const generic=others.length>0&&others.every(c=>leaks(T.hint,c));
    if(!generic)assert.ok(!leaks(T.hint,rightText(T)),`Tipp verrät Lösung: ${t} ${T.hint} -> ${rightText(T)}`);
    assert.ok(!/—|–/.test(T.hint+T.ex),"Gedankenstrich in "+t);
    const gap=/<b>([^<\s]*)<mark>_<\/mark>([^<\s]*)<\/b>/.exec(T.q);
    if(gap)assert.ok(!T.hint.toLowerCase().includes((gap[1]+T.a+gap[2]).toLowerCase()),`Tipp nennt das fertige Wort: ${t} ${T.q} ${T.hint}`);
  }
});

test("Zweite Stufe: ähnliches Beispiel mit anderer Lösung, die echte Lösung steht nie im Text",()=>{
  for(const t of ALL_TOPICS){
    let found=0;const N=150;
    for(let n=0;n<N;n++){
      const T={topic:t,...GEN[t]()},mine=rightText(T),E=similarExample(GEN,T);
      if(!E)continue;found++;
      assert.notEqual(String(rightText(E)),String(mine),t);
      assert.ok(!leaks(E.q+" "+E.ex,mine),`Beispiel verrät Lösung: ${t}: ${E.q} ${E.ex} -> ${mine}`);
      const html=helpBubblesHTML(T,2,exampleHTML(E),TRAINERS);
      assert.ok(html.includes(T.hint)&&html.includes("ähnliche Aufgabe")&&html.includes("So geht das")&&html.includes("Trainerin"));
    }
    assert.ok(found/N>=.85,`zu selten ein Beispiel für ${t}: ${found}/${N}`);
  }
  assert.ok(exampleHTML(null).includes(FALLBACK_EXAMPLE));
  assert.equal(leaks("Das sind 47 Punkte","47"),true);assert.equal(leaks("Das sind 147 Punkte","47"),false);assert.equal(leaks("Ein Hund","hund"),true);assert.equal(leaks("egal","d"),false);
  assert.equal(leaks("Ergebnis 6 Rest 3","6 Rest 3"),true);assert.equal(leaks("Ergebnis 6 Rest 2","6 Rest 3"),false);
});

test("Trainer-Block: beide Figuren, Hilfe-Taste, zwei Stufen, Angebot, Erklärung nach der Antwort",()=>{
  const trainers=[cleanTrainer({name:"Coach Marco"},1),cleanTrainer({name:"Coach Ina"},2)];
  const T={topic:"m3_1x1",type:"num",q:"6 · 7 = ?",a:42,ex:"6 · 7 = 42.",hint:"Nimm eine leichtere Aufgabe."};
  const G={done:false,helpLevel:0,offer:false,i:0};
  let h=coachHTML({T,G,trainers});
  assert.equal((h.match(/class="avsvg"/g)||[]).length,2);
  assert.ok(h.includes('id="coachHelp"')&&h.includes("Hilfe vom Trainer")&&h.includes("Coach Marco")&&h.includes("Coach Ina"));
  assert.ok(!h.includes(T.hint)&&!noSvg(h).includes("42"),"vor der Hilfe nichts verraten");
  h=coachHTML({T,G:{...G,helpLevel:1},trainers});
  assert.ok(h.includes(T.hint)&&h.includes("Noch mehr Hilfe")&&!h.includes("So geht das")&&!noSvg(h).includes("42")&&h.includes("Coach Marco"));
  h=coachHTML({T,G:{...G,helpLevel:2,helpEx:"<p>Beispiel</p>"},trainers});
  assert.ok(h.includes(T.hint)&&h.includes("Beispiel")&&!h.includes('id="coachHelp"')&&!noSvg(h).includes("42"));
  assert.equal((h.match(/class="bubble"/g)||[]).length,2);assert.equal((h.match(/coachfig talk/g)||[]).length,2);   // Tipp vom Trainer, Erklärung von der Trainerin
  h=coachHTML({T,G:{...G,offer:true},trainers});
  assert.ok(h.includes("coachYes")&&h.includes("coachNo")&&h.includes("Tipp")&&!h.includes('id="coachHelp"'));
  assert.equal(speakerOf({i:0},"offer"),0);assert.equal(speakerOf({i:1},"offer"),1);assert.equal(speakerOf({i:2},"after"),0);
  h=coachHTML({T,G:{done:true,ok:false,i:1},trainers});assert.ok(h.includes("Richtig ist: 42.")&&h.includes("6 · 7 = 42.")&&h.includes("Coach Ina"));
  h=coachHTML({T,G:{done:true,ok:true,i:0},trainers});assert.ok(h.includes("6 · 7 = 42.")&&!h.includes("Richtig ist")&&h.includes("Coach Marco"));
  assert.ok(!coachHTML({T,G:{done:true,ok:false,i:0},trainers:[cleanTrainer({name:"<b>x</b>"},1),trainers[1]]}).includes("<b>x</b>"));
});

test("Aufgabenansicht: richtig = kurzes Overlay ohne Weiter-Taste, falsch = witziger Fehlschuss mit Erklärung",()=>{
  const s=newProfile({id:"k-abc12345",name:"Emil",deviceId:"d1"});
  const t="m_read",T={topic:t,...GEN[t]()};
  const G={li:0,mode:"math",trial:false,pool:[t],len:8,i:0,res:[],hist:[],pts:0,streak:0,rival:"FC Test",last:t,task:T,input:"",inp:["",""],act:0,done:false,helpLevel:0,pickIdx:-1,given:null};
  let h=playHTML(s,G);clean(h,"Aufgabe");
  assert.ok(h.includes("coachHelp")&&!h.includes('id="hint"')&&!h.includes("Trainer-Tipp anzeigen")&&!h.includes('class="scene')&&!h.includes('id="ovl"'));
  // richtig
  const ok=playHTML(s,{...G,done:true,ok:true,gain:15,res:[true],given:String(T.a),shot:{kind:"goal",side:1}});clean(ok,"richtig");
  assert.ok(ok.includes('id="ovl"')&&ok.includes("Tor!")&&ok.includes("+15 Serie!")&&ok.includes("sc-goal"));
  assert.ok(!ok.includes('id="next"')&&!ok.includes("bubble"),"richtig: kein Weiter, keine Erklärung, es geht von allein weiter");
  // falsch: alle drei Varianten
  for(const kind of ["post","bar","wide"]){
    const bad=playHTML(s,{...G,done:true,ok:false,gain:0,res:[false],given:"99",shot:{kind,side:-1}});clean(bad,"falsch "+kind);
    assert.ok(bad.includes(`sc-${kind}`)&&bad.includes(SHOT_TEXT[kind])&&bad.includes("bubble")&&bad.includes('id="next"')&&!bad.includes('id="ovl"')&&bad.includes("Richtig ist"),kind);
  }
  assert.ok(playHTML(s,{...G,done:true,ok:false,gain:0,res:[false],given:"1"}).includes("Knapp vorbei"));   // ohne gespeicherten Ausgang
  assert.ok(playHTML(s,{...G,done:true,ok:false,gain:0,res:[false],given:"1",i:7,len:8}).includes("Abpfiff"));
  applyAvatar(s,{deviceId:"d1",now:5},{...TEMPLATES[3].look,shirtName:"Emil"});
  applyAnswer(s,{deviceId:"d1",now:9},{topic:t,ok:true,gain:10,li:0,trial:false,help:1});
});

