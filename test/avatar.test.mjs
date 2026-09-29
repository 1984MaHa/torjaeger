// Avatar (Junge oder Mädchen, Baukasten, Figuren, Torszene mit Treffer und drei Fehlschuss-Varianten), Trainer und Trainerin (Hilfe in zwei Stufen).
import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {fileURLToPath} from "node:url";
import {LIGEN,topicsOf} from "../app/js/content.js";
import {GEN} from "../app/js/generators.js";
import {newProfile} from "../app/js/model.js";
import {FACES,NOSES,BROWS,EYESHAPES,GLASSES,BUILDS,BODIES,HATS,PATTERNS,COLLARS,MOUTHS,HAIR_STYLES,HAIR_COLORS,SKIN_TONES,SHIRT_COLORS,TEMPLATES,TRAINER_HAIR,cleanLook,cleanTrainer,defaultLook,defaultTrainer,defaultTrainer2,lookOf,templateLook,startLook,withBody} from "../app/js/avatar.js";
import {figureG,avatarSVG,crestSVG,trainerSVG,sceneSVG,pickShot,shotPath,SHOT_KINDS,SHOT_TEXT} from "../app/js/avatardraw.js";
import {avatarBuilderHTML,trainerPanelHTML} from "../app/js/avatarui.js";
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

test("Baukasten: Junge oder Mädchen, je 10 Frisuren, mehrere Hauttöne, 5 Vorlagen je Auswahl",()=>{
  assert.deepEqual(BODIES.map(b=>b[0]),["j","m"]);assert.deepEqual(BODIES.map(b=>b[1]),["Junge","Mädchen"]);
  for(const b of ["j","m"]){assert.ok(HAIR_STYLES[b].length>=6);assert.equal(new Set(HAIR_STYLES[b]).size,HAIR_STYLES[b].length);assert.equal(TEMPLATES.filter(t=>t.look.body===b).length,5);}
  assert.notDeepEqual(HAIR_STYLES.j,HAIR_STYLES.m);
  assert.ok(SKIN_TONES.length>=4);assert.ok(HAIR_COLORS.length>=5);assert.ok(SHIRT_COLORS.length>=6);
  for(const t of TEMPLATES){const l=cleanLook(t.look);assert.deepEqual(Object.keys(l).sort(),["body","boots","brows","build","c1","c2","collar","eyeShape","eyes","face","freckles","glasses","hair","hairColor","hat","hatColor","mouth","nose","number","pattern","shirt","shirtName","shorts","skin","socks","team","v"]);assert.equal(l.body,t.look.body);assert.equal(l.hair,t.look.hair);}
  assert.equal(new Set(TEMPLATES.map(t=>JSON.stringify(t.look))).size,TEMPLATES.length);
});

test("Wahl Junge oder Mädchen: Startaussehen und Wechsel behalten Farben, neue Frisurenliste",()=>{
  for(const b of ["j","m"]){const l=startLook(b,"Emil Muster Langname");assert.equal(l.body,b);assert.equal(l.shirtName,"EMIL MUSTE".slice(0,10).trim()||l.shirtName);assert.ok(l.hair<HAIR_STYLES[b].length);}
  const j={...startLook("j","Emil"),hair:7,shirt:"#8e44ad",number:"33",team:"Meine Elf"};
  const m=withBody(j,"m");
  assert.equal(m.body,"m");assert.equal(m.hair,0);assert.equal(m.shirt,"#8e44ad");assert.equal(m.number,"33");assert.equal(m.team,"Meine Elf");
  // Frisur außerhalb der Liste wird ersetzt
  assert.ok(cleanLook({body:"m",hair:99}).hair<HAIR_STYLES.m.length);
  assert.equal(cleanLook({hair:3}).body,"j");                        // alter Avatar ohne body
});

test("Figuren: jede Frisur (Junge und Mädchen) vorn und hinten, alle Ausschnitte, Vorlagen; sauberes SVG",()=>{
  for(const body of ["j","m"]){
    const seen=new Set();
    for(let h=0;h<HAIR_STYLES[body].length;h++)for(const view of ["front","back"]){
      const look={...TEMPLATES.find(t=>t.look.body===body).look,hair:h,shirtName:"Emil"};
      clean(avatarSVG(look,{view,px:120}),`${body} Frisur ${h} ${view}`);
      if(view==="front")seen.add(figureG(look,"front"));
    }
    assert.equal(seen.size,HAIR_STYLES[body].length,body+": alle Frisuren sehen verschieden aus");
  }
  for(const crop of ["full","bust","head"])clean(avatarSVG(TEMPLATES[1].look,{crop,px:50}),crop);
  for(let i=0;i<TEMPLATES.length;i++){clean(avatarSVG(templateLook(i,"Ida"),{px:100}),"Vorlage "+i);clean(crestSVG(templateLook(i,"Ida"),40),"Wappen "+i);}
  const back=figureG({...TEMPLATES[0].look,shirtName:"Emil",number:"7"},"back"),front=figureG({...TEMPLATES[0].look,shirtName:"Emil",number:"7"},"front");
  assert.ok(back.includes(">EMIL<")&&back.includes(">7<"));assert.ok(!front.includes("EMIL")&&front.includes(">7<"));
  assert.ok(figureG({...TEMPLATES[0].look,shirtName:"Wolfgangxyz",number:"99"},"back").includes(">99<"));
  // Mädchen und Junge unterscheiden sich im Gesicht
  assert.notEqual(figureG({...TEMPLATES[0].look,body:"m"},"front"),figureG({...TEMPLATES[0].look,body:"j"},"front"));
  // Konturen und Schattierung: Figur ist mehr als flache Farbflächen
  assert.ok((figureG(TEMPLATES[0].look,"front").match(/stroke=/g)||[]).length>30);
});

test("Trainer und Trainerin nach den Fotos: Glatze mit Brille, blond schulterlang mit Creolen",()=>{
  const [t1,t2]=TRAINERS;
  assert.equal(t1.name,"Trainer");assert.equal(t2.name,"Trainerin");
  assert.equal(t1.look.hair,0);assert.equal(TRAINER_HAIR[t1.look.hair],"Glatze");assert.equal(t1.look.glasses,1);assert.equal(t1.look.earrings,0);
  assert.equal(TRAINER_HAIR[t2.look.hair],"Schulterlang");assert.equal(t2.look.glasses,0);assert.equal(t2.look.earrings,1);
  const s1=trainerSVG(t1.look,{px:120,which:1}),s2=trainerSVG(t2.look,{px:120,which:2});clean(s1,"Trainer");clean(s2,"Trainerin");
  assert.ok(s1.includes('stroke="#15161a"')&&!s1.includes('stroke="#c5cad3"'));      // Brille, keine Ohrringe
  assert.ok(!s2.includes('stroke="#15161a"')&&s2.includes('stroke="#c5cad3"'));      // Ohrringe, keine Brille
  assert.notEqual(s1,s2);
  const seen=new Set();
  for(let h=0;h<TRAINER_HAIR.length;h++)for(const which of [1,2])for(const [g,b,e] of [[0,0,0],[1,1,1]]){
    const svg=trainerSVG({...(which===2?t2:t1).look,hair:h,glasses:g,beard:b,earrings:e},{px:80,which});clean(svg,`Trainer ${which} ${h}`);if(which===1&&!g)seen.add(svg);
  }
  assert.equal(seen.size,TRAINER_HAIR.length);
  assert.equal(cleanTrainer({name:"Trainer Papa"},1).name,"Trainer Papa");         // eigener Name bleibt
  assert.equal(cleanTrainer({},2).name,"Trainerin");
  const panel=trainerPanelHTML(t2,2);clean(panel.replace(/<input[^>]*>/g,""),"Trainerpanel");
  for(const a of ['data-atr="2:hair:0"','data-atr="2:glasses:1"','data-atr="2:earrings:0"','data-atr="2:jacket:','data-atr="2:skin:','data-atr="2:hairColor:','data-atrsave="2"','data-atrdefault="2"','id="trName2"'])assert.ok(panel.includes(a),a);
});

test("Eingaben werden entschärft (Name, Mannschaft, Farben)",()=>{
  const evil={hair:2,shirt:"red;stroke:url(x)",shirtName:'"><script>alert(1)</script>',team:"<img src=x onerror=1>",number:"<b>",c1:"#12345",c2:"#ABCDEF"};
  const svg=avatarSVG(evil,{px:80})+sceneSVG(evil,{kind:"goal",side:1})+crestSVG(evil,30);
  clean(svg,"böse Eingaben");
  const l=cleanLook(evil);assert.ok(!/[<>"]/.test(l.shirtName+l.team));assert.equal(l.c2,"#abcdef");assert.notEqual(l.c1,"#12345");assert.equal(l.number,TEMPLATES[0].look.number);
  const tr=cleanTrainer({name:"<b>Coach</b>",look:{jacket:"blue",beard:"ja",glasses:0,hair:9},t:"x"},1);
  assert.ok(!/[<>]/.test(tr.name));assert.equal(tr.look.beard,1);assert.equal(tr.look.glasses,0);assert.equal(tr.look.hair,0);assert.equal(tr.t,0);
  clean(trainerSVG({jacket:"url(#x)"},{px:60,label:'"><script>'}),"Trainer böse");
});

test("Konten ohne Avatar bekommen eine feste Vorgabe aus dem Namen",()=>{
  assert.deepEqual(defaultLook("Emil"),defaultLook("Emil"));
  assert.equal(defaultLook("Emil").shirtName,"EMIL");
  const p={name:"Mia",avatar:null};assert.deepEqual(lookOf(p),defaultLook("Mia"));
  const s=newProfile({id:"k-abc12345",name:"Mia",deviceId:"d"});applyAvatar(s,{deviceId:"d",now:5},{body:"m",hair:6,shirt:"#8e44ad"});
  assert.equal(lookOf(s.profile).hair,6);assert.equal(lookOf(s.profile).body,"m");assert.equal(s.profile.avatarAsked,true);assert.equal(s.profile.avatar.t,5);
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

test("Baukasten-Oberfläche: erst Junge oder Mädchen, dann Auswahlen; überspringbar beim ersten Mal",()=>{
  const g=avatarBuilderHTML({look:startLook("j","Emil"),name:"Emil <b>",first:true,step:"gender"});
  clean(g,"Auswahl");
  assert.equal((g.match(/data-avbody=/g)||[]).length,2);assert.ok(g.includes("Junge")&&g.includes("Mädchen")&&g.includes('id="avSkip"'));
  assert.ok(!g.includes("data-avhair"));
  for(const body of ["j","m"]){
    const D={look:startLook(body,"Emil <b>"),name:"Emil <b>",first:true,step:"build"};
    const h=avatarBuilderHTML(D);clean(h.replace(/<input[^>]*>/g,""),"Baukasten "+body);
    assert.equal((h.match(/data-avhair=/g)||[]).length,HAIR_STYLES[body].length);
    for(const n of HAIR_STYLES[body])assert.ok(h.includes(n),n);
    assert.equal((h.match(/data-avtpl=/g)||[]).length,5);                 // nur Vorlagen der Auswahl
    assert.equal((h.match(/data-avbody=/g)||[]).length,2);                // Umschalter Junge oder Mädchen
    for(const a of ["data-avhc","data-avskin","data-avshirt","data-avshorts","data-avboots","data-avc1","data-avc2","data-avnum","id=\"avShirtName\"","id=\"avTeam\"","id=\"avSave\"","id=\"avSkip\""])assert.ok(h.includes(a),a);
    assert.ok(!h.includes("avCancel")&&h.includes("Später"));
    assert.ok(/class="hairb on"[^>]*data-avhair="\d"/.test(h)&&h.includes('class="sw on"'));
  }
  assert.ok(avatarBuilderHTML({look:startLook("m","x"),name:"x",first:false,step:"build"}).includes("avCancel"));
  assert.ok(avatarBuilderHTML({look:{hair:"x"},name:"",first:false,step:"build"}).includes("avSave"));   // kaputter Entwurf stürzt nicht ab
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

test("Realistischere Figuren: eiförmiger Kopf statt Kreis, Gesicht mit Details",()=>{
  const f=figureG(TEMPLATES[0].look,"front");
  assert.ok(!/<ellipse cx="60" cy="42" rx="26" ry="27"/.test(f),"kein kreisrunder Kopf mehr");
  assert.ok(f.includes("M35 40 C35 20 46 12 60 12"),"Kopf mit Wangen und Kinn");
  assert.ok(f.includes('transform="translate(60 72) scale(.9)'),"Kopf im Verhältnis kleiner");
  for(const detail of ["M59.6 48.4","M42.5 39.8","M51.5 64"])assert.ok(f.includes(detail),"Gesichtsdetail "+detail);   // Nase, Braue, Mund
  const t=trainerSVG(defaultTrainer().look,{px:100,which:1});
  assert.ok(!/<ellipse cx="60" cy="58" rx="27" ry="30"/.test(t)&&t.includes("M33 58 C33 36 46 28 60 28"),"Trainerkopf eiförmig");
});

test("Ohne Haare und Kopfbedeckungen: Cap, Cap verkehrt, Mütze, Stirnband, Bandana",()=>{
  assert.deepEqual(HATS,["Keine","Cap","Cap verkehrt","Mütze","Stirnband","Bandana"]);
  for(const b of ["j","m"]){
    assert.equal(HAIR_STYLES[b].at(-1),"Ohne Haare");
    const look={...startLook(b,"Emil")};
    const bald=figureG({...look,hair:HAIR_STYLES[b].length-1},"front"),withHair=figureG({...look,hair:0},"front");
    assert.notEqual(bald,withHair);
    assert.ok(!bald.includes(look.hairColor+'" stroke'),"ohne Haare: keine Haarfläche in Haarfarbe");
    for(const view of ["front","back"]){
      const seen=new Set();
      for(let h=0;h<HATS.length;h++){
        const svg=avatarSVG({...look,hair:0,hat:h,hatColor:"#2f6fde"},{view,px:100});clean(svg,`${b} Hut ${h} ${view}`);
        seen.add(figureG({...look,hair:0,hat:h,hatColor:"#2f6fde"},view));
        if(h>0)assert.ok(svg.includes("#2f6fde"),"Kopfbedeckung trägt die gewählte Farbe");
      }
      assert.equal(seen.size,HATS.length,"alle Kopfbedeckungen sehen verschieden aus ("+view+")");
    }
    // auch ohne Haare mit Kopfbedeckung
    clean(avatarSVG({...look,hair:HAIR_STYLES[b].length-1,hat:1},{px:80}),"ohne Haare mit Cap");
  }
  // Cap: Schirm vorn sichtbar, verkehrt herum hinten
  const look=startLook("j","Emil");
  assert.notEqual(figureG({...look,hat:1},"front"),figureG({...look,hat:2},"front"));
  assert.notEqual(figureG({...look,hat:1},"back"),figureG({...look,hat:2},"back"));
  // Prüfung
  assert.equal(cleanLook({...look,hat:99}).hat,0);assert.equal(cleanLook({...look,hat:3,hatColor:"rot"}).hatColor,"#e5484d");assert.equal(cleanLook({...look,hat:3,hatColor:"#2F6FDE"}).hatColor,"#2f6fde");
  // Baukasten
  const h=avatarBuilderHTML({look:{...look,hat:1},name:"Emil",first:false,step:"build"});clean(h.replace(/<input[^>]*>/g,""),"Baukasten mit Cap");
  assert.equal((h.match(/data-avhat=/g)||[]).length,HATS.length);assert.ok(h.includes("data-avhatc")&&h.includes("Kopfbedeckung"));
  assert.ok(!avatarBuilderHTML({look:{...look,hat:0},name:"Emil",first:false,step:"build"}).includes("data-avhatc"),"Farbwahl nur mit Kopfbedeckung");
  // Vorlagen bleiben ohne Kopfbedeckung
  for(const t of TEMPLATES)assert.equal(cleanLook(t.look).hat,0);
});

test("Vorlage nach dem Foto: blonde Fransen, blaue Augen, blaues Trikot mit Schulterstreifen, schwarze Hose und Stutzen, Grinsen",()=>{
  const t=TEMPLATES.find(x=>x.name==="Torjäger"),l=cleanLook(t.look);
  assert.equal(l.body,"j");assert.equal(HAIR_STYLES.j[l.hair],"Fransen");assert.equal(l.hairColor,"#e6c15a");assert.equal(l.skin,"#ffe0c7");assert.equal(l.eyes,"#6a95c4");
  assert.equal(l.shirt,"#2f6fde");assert.equal(PATTERNS[l.pattern],"Schulterstreifen");assert.equal(COLLARS[l.collar],"Rundkragen");assert.equal(l.shorts,"#22252b");assert.equal(l.socks,"#22252b");assert.equal(MOUTHS[l.mouth],"Breites Grinsen");
  const f=figureG(l,"front");
  assert.ok(f.includes('fill="#6a95c4"'),"blaue Iris");assert.ok(f.includes("M43 80.5 Q34 82 30 93"),"Schulterstreifen");assert.ok(f.includes("M49.5 77 Q60 88.5"),"Rundkragen");assert.ok(f.includes("M49 62.6"),"Grinsen");
  assert.ok((f.match(/rx="3" fill="#22252b"/g)||[]).length===2,"schwarze Stutzen");
  clean(avatarSVG(l,{px:220}),"Foto-Vorlage vorn");clean(avatarSVG(l,{px:220,view:"back"}),"Foto-Vorlage hinten");
  // Fransen sehen anders aus als alle anderen Frisuren, auch von hinten
  const others=new Set(HAIR_STYLES.j.map((_,h)=>figureG({...l,hair:h},"front")));assert.equal(others.size,HAIR_STYLES.j.length);
});

test("Neue Auswahlen ändern das Bild: Augenfarbe, Muster, Kragen, Mund, Stutzenfarbe",()=>{
  const l=cleanLook(TEMPLATES[0].look);
  const same=(a,b)=>figureG({...l,...a},"front")===figureG({...l,...b},"front");
  assert.equal(new Set([0,1,2,3].map(p=>figureG({...l,pattern:p},"front"))).size,4);
  assert.equal(new Set([0,1,2,3].map(p=>figureG({...l,pattern:p},"back"))).size,4);
  assert.ok(!same({collar:0},{collar:1}));assert.ok(!same({mouth:0},{mouth:1}));
  assert.ok(!same({eyes:"#4a3426"},{eyes:"#5f9b6a"}));assert.ok(!same({socks:"#22252b"},{socks:"#f4f4f4"}));
  for(const p of [0,1,2,3])for(const view of ["front","back"])clean(avatarSVG({...l,pattern:p,collar:1,mouth:1},{view,px:90}),`Muster ${p} ${view}`);
  // alte Avatare ohne die neuen Felder sehen wie vorher aus: Stutzen wie das Trikot, braune Augen, kein Muster
  const old=cleanLook({body:"j",hair:1,hairColor:"#2b1d14",skin:"#f6c9a0",shirt:"#e5484d",shorts:"#f4f4f4",boots:"#22252b",number:"9",team:"X",c1:"#e5484d",c2:"#f4f4f4"});
  assert.equal(old.socks,"#e5484d");assert.equal(old.eyes,"#4a3426");assert.equal(old.pattern,0);assert.equal(old.collar,0);assert.equal(old.mouth,0);
  assert.equal(cleanLook({...l,pattern:9,collar:9,mouth:9,eyes:"grün",socks:"x"}).pattern,0);
  // Baukasten zeigt die neuen Auswahlen
  const h=avatarBuilderHTML({look:l,name:"Emil",first:false,step:"build"});clean(h.replace(/<input[^>]*>/g,""),"Baukasten neu");
  for(const [a,n] of [["data-aveyes",5],["data-avpattern",4],["data-avcollar",2],["data-avmouth",2],["data-avsocks",10]])assert.equal((h.match(new RegExp(a+"=","g"))||[]).length,n,a);
  for(const w of ["Augenfarbe","Trikotmuster","Kragen","Stutzenfarbe","Gesicht","Schulterstreifen","Rundkragen","Breites Grinsen"])assert.ok(h.includes(w),w);
});

test("Mehr Vielfalt: Kopfform, Augenform, Augenbrauen, Nase, Sommersprossen, Brille, Statur ändern das Bild",()=>{
  const l=cleanLook(TEMPLATES[0].look);
  assert.deepEqual([FACES.length,NOSES.length,BROWS.length,EYESHAPES.length,GLASSES.length,BUILDS.length],[5,3,3,3,3,3]);
  const variants=(key,n)=>new Set(Array.from({length:n},(_,i)=>figureG({...l,[key]:i},"front"))).size;
  assert.equal(variants("face",5),5,"5 verschiedene Kopfformen");
  assert.equal(variants("eyeShape",3),3);assert.equal(variants("brows",3),3);assert.equal(variants("nose",3),3);assert.equal(variants("glasses",3),3);assert.equal(variants("build",3),3);
  assert.notEqual(figureG({...l,freckles:0},"front"),figureG({...l,freckles:1},"front"));
  // Statur wirkt auch von hinten und in der Torszene
  assert.notEqual(figureG({...l,build:0},"back"),figureG({...l,build:2},"back"));
  assert.ok(sceneSVG({...l,build:2},{kind:"goal",side:1}).includes("scale(1.12 1)"));
  // Kopfformen sind keine Kreise und liegen im Kopfraum
  for(const face of [0,1,2,3,4])for(const body of ["j","m"]){
    clean(avatarSVG({...l,body,hair:0,face,glasses:face%3,freckles:face%2,build:face%3,nose:face%3,brows:face%3,eyeShape:face%3},{px:110}),`Kopfform ${face} ${body}`);
    clean(avatarSVG({...l,face},{crop:"head",px:60}),"Kopf "+face);
    clean(avatarSVG({...l,face,glasses:1,hat:1},{view:"back",px:60}),"Kopf hinten "+face);
  }
  assert.ok(figureG({...l,face:2},"front").includes("L85 56 C85 66"),"eckig hat einen breiten Kiefer");
  // Brille sitzt auf den Augen, freie Farben bleiben gültig
  assert.ok(figureG({...l,glasses:1},"front").includes('r="9" fill="#9bb7e6"')&&figureG({...l,glasses:2},"front").includes('width="19.2"'));
  // Vorgaben: alte Avatare sehen unverändert aus (Oval, Mandelaugen, mittlere Nase, normale Brauen, normale Statur, keine Sommersprossen, keine Brille)
  const old=cleanLook({body:"j",hair:1,shirt:"#e5484d"});
  assert.deepEqual([old.face,old.eyeShape,old.nose,old.brows,old.build,old.freckles,old.glasses],[0,1,1,1,1,0,0]);
  assert.equal(cleanLook({...l,face:9,nose:9,brows:9,eyeShape:9,glasses:9,build:9,freckles:"ja"}).face,0);
  // Baukasten zeigt sie
  const h=avatarBuilderHTML({look:l,name:"Emil",first:false,step:"build"});clean(h.replace(/<input[^>]*>/g,""),"Baukasten Vielfalt");
  for(const [a,n] of [["data-avface",5],["data-aveyeshape",3],["data-avbrows",3],["data-avnose",3],["data-avfreckles",2],["data-avglasses",3],["data-avbuild",3]])assert.equal((h.match(new RegExp(a+"=","g"))||[]).length,n,a);
  for(const w of ["Kopfform","Augenform","Augenbrauen","Nase","Sommersprossen","Brille","Statur","Herz","Kräftig"])assert.ok(h.includes(w),w);
});
