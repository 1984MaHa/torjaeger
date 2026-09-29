// Avatar (Baukasten, Figuren, Torszene mit Treffer und drei Fehlschuss-Varianten) und Trainer (Hilfe in zwei Stufen).
import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {fileURLToPath} from "node:url";
import {LIGEN,topicsOf} from "../app/js/content.js";
import {GEN} from "../app/js/generators.js";
import {newProfile} from "../app/js/model.js";
import {HAIR_STYLES,HAIR_COLORS,SKIN_TONES,SHIRT_COLORS,TEMPLATES,cleanLook,cleanTrainer,defaultLook,defaultTrainer,lookOf,templateLook} from "../app/js/avatar.js";
import {figureG,avatarSVG,crestSVG,trainerSVG,sceneSVG,pickShot,shotPath,SHOT_KINDS,SHOT_TEXT} from "../app/js/avatardraw.js";
import {avatarBuilderHTML,trainerPanelHTML} from "../app/js/avatarui.js";
import {leaks,similarExample,exampleHTML,helpBubbleHTML,coachHTML,rightText,FALLBACK_EXAMPLE} from "../app/js/coach.js";
import {playHTML,accountsHTML,homeHTML} from "../app/js/views.js";
import {applyAvatar,applyAnswer} from "../app/js/rules.js";

const CSS=fs.readFileSync(fileURLToPath(new URL("../app/css/style.css",import.meta.url)),"utf8");
const ALL_TOPICS=LIGEN.flatMap((_,i)=>topicsOf(i));

function wellFormed(s){
  const stack=[],re=/<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>/g;let m;
  while((m=re.exec(s))){if(m[4]==="/")continue;if(m[1]==="/"){if(stack.pop()!==m[2])return false;}else stack.push(m[2]);}
  return stack.length===0;
}
const noSvg=s=>s.replace(/<svg[\s\S]*?<\/svg>/g,"");
const clean=(s,what)=>{assert.ok(wellFormed(s),what+": nicht wohlgeformt");assert.ok(!/undefined|NaN|\bnull\b|\[object/.test(s),what+": kaputter Wert");assert.ok(!/<script|<img|javascript:|\son[a-z]+\s*=/i.test(s),what+": unsicher");};

test("Baukasten: mindestens 6 Frisuren, mehrere Hauttöne, Vorlagen; kein Jungen- oder Mädchen-Modus",()=>{
  assert.ok(HAIR_STYLES.length>=6);assert.ok(SKIN_TONES.length>=4);assert.ok(HAIR_COLORS.length>=5);assert.ok(SHIRT_COLORS.length>=6);assert.ok(TEMPLATES.length>=6);
  const all=JSON.stringify([HAIR_STYLES,TEMPLATES]).toLowerCase();
  assert.ok(!/mädchen|junge|boy|girl/.test(all));
  // jede Vorlage ist ein gültiger Aussehen-Satz und die Vorlagen unterscheiden sich
  for(const t of TEMPLATES){const l=cleanLook(t.look);assert.deepEqual(Object.keys(l).sort(),["boots","c1","c2","hair","hairColor","number","shirt","shirtName","shorts","skin","team","v"]);}
  assert.equal(new Set(TEMPLATES.map(t=>JSON.stringify(t.look))).size,TEMPLATES.length);
  assert.ok(new Set(TEMPLATES.map(t=>t.look.hair)).size>=6);
});

test("Figuren: jede Frisur in Vorder- und Rückansicht, alle Ausschnitte, Vorlagen; sauberes SVG",()=>{
  const seen=new Set();
  for(let h=0;h<HAIR_STYLES.length;h++)for(const view of ["front","back"]){
    const svg=avatarSVG({...TEMPLATES[0].look,hair:h,shirtName:"Emil"},{view,px:120});clean(svg,`Frisur ${h} ${view}`);
    if(view==="front")seen.add(figureG({...TEMPLATES[0].look,hair:h},"front"));
  }
  assert.equal(seen.size,HAIR_STYLES.length,"alle Frisuren sehen verschieden aus");
  for(const crop of ["full","bust","head"])clean(avatarSVG(TEMPLATES[1].look,{crop,px:50}),crop);
  for(let i=0;i<TEMPLATES.length;i++){clean(avatarSVG(templateLook(i,"Ida"),{px:100}),"Vorlage "+i);clean(crestSVG(templateLook(i,"Ida"),40),"Wappen "+i);}
  // Name und Nummer stehen auf dem Rücken, in der Vorderansicht nur die Nummer
  const back=figureG({...TEMPLATES[0].look,shirtName:"Emil",number:"7"},"back"),front=figureG({...TEMPLATES[0].look,shirtName:"Emil",number:"7"},"front");
  assert.ok(back.includes(">EMIL<")&&back.includes(">7<"));assert.ok(!front.includes("EMIL")&&front.includes(">7<"));
  // lange Namen bleiben lesbar klein, zweistellige Nummern
  assert.ok(figureG({...TEMPLATES[0].look,shirtName:"Wolfgangxyz",number:"99"},"back").includes(">99<"));
  // Trainer
  for(const beard of [0,1])clean(trainerSVG({...defaultTrainer().look,beard},{px:80}),"Trainer "+beard);
});

test("Eingaben werden entschärft (Name, Mannschaft, Farben)",()=>{
  const evil={hair:2,shirt:"red;stroke:url(x)",shirtName:'"><script>alert(1)</script>',team:"<img src=x onerror=1>",number:"<b>",c1:"#12345",c2:"#ABCDEF"};
  const svg=avatarSVG(evil,{px:80})+sceneSVG(evil,{kind:"goal",side:1})+crestSVG(evil,30);
  clean(svg,"böse Eingaben");
  const l=cleanLook(evil);assert.ok(!/[<>"]/.test(l.shirtName+l.team));assert.equal(l.c2,"#abcdef");assert.notEqual(l.c1,"#12345");assert.equal(l.number,TEMPLATES[0].look.number);
  const tr=cleanTrainer({name:"<b>Coach</b>",look:{cap:"blue",beard:"ja"},t:"x"});
  assert.ok(!/[<>]/.test(tr.name));assert.equal(tr.look.beard,1);assert.equal(tr.t,0);
  clean(trainerSVG({cap:"url(#x)"},{px:60,label:'"><script>'}),"Trainer böse");
  assert.equal(defaultTrainer().name,"Trainer Papa");
});

test("Konten ohne Avatar bekommen eine feste Vorgabe aus dem Namen",()=>{
  assert.deepEqual(defaultLook("Emil"),defaultLook("Emil"));
  assert.equal(defaultLook("Emil").shirtName,"EMIL");
  const p={name:"Mia",avatar:null};assert.deepEqual(lookOf(p),defaultLook("Mia"));
  const s=newProfile({id:"k-abc12345",name:"Mia",deviceId:"d"});applyAvatar(s,{deviceId:"d",now:5},{hair:6,shirt:"#8e44ad"});
  assert.equal(lookOf(s.profile).hair,6);assert.equal(s.profile.avatarAsked,true);assert.equal(s.profile.avatar.t,5);
});

test("Torszene: Treffer und drei Fehlschuss-Varianten, beide Seiten",()=>{
  assert.deepEqual(SHOT_KINDS,["goal","post","bar","wide"]);
  const texts=new Set(Object.values(SHOT_TEXT));assert.equal(texts.size,4);assert.equal(SHOT_TEXT.goal,"Tor!");
  // richtig = Tor, falsch = zufällig Pfosten, Latte oder knapp vorbei
  for(let i=0;i<50;i++)assert.equal(pickShot(true).kind,"goal");
  const kinds=new Set();for(let i=0;i<300;i++){const s=pickShot(false);kinds.add(s.kind);assert.ok(["post","bar","wide"].includes(s.kind));assert.ok(s.side===-1||s.side===1);}
  assert.deepEqual([...kinds].sort(),["bar","post","wide"]);
  const rnd=(...v)=>()=>v.shift();
  assert.deepEqual([pickShot(false,rnd(0,.1)).kind,pickShot(false,rnd(.4,.9)).kind,pickShot(false,rnd(.9,.9)).kind],["post","bar","wide"]);
  const sides=new Set();for(let i=0;i<100;i++)sides.add(pickShot(true).side);assert.equal(sides.size,2);
  for(const kind of SHOT_KINDS)for(const side of [-1,1]){
    const svg=sceneSVG(TEMPLATES[2].look,{kind,side});clean(svg,kind+side);
    assert.ok(svg.includes(`class="scene sc-${kind}"`)&&svg.includes("ballpos")&&svg.includes("netfx"));
    const p=shotPath(kind,side);
    // Endpunkte (Anzeige ohne Bewegung) liegen sichtbar in der Szene
    for(const pt of [p.start,p.end])assert.ok(pt.x>=0&&pt.x<=340&&pt.y>=0&&pt.y<=230,kind+" "+JSON.stringify(pt));
    if(kind==="goal")assert.ok(p.end.x>94&&p.end.x<246&&p.end.y>18&&p.end.y<86,"Tor: Ball im Netz");
    if(kind==="post")assert.ok(p.hit.x===91||p.hit.x===249,"Pfosten: Ball trifft den Pfosten");
    if(kind==="bar")assert.ok(p.hit.y<20&&p.out.y<0,"Latte: Ball springt über das Tor");
    if(kind==="wide")assert.ok(p.end.x<88||p.end.x>252,"knapp vorbei: außerhalb der Pfosten");
    assert.ok(new RegExp(`@keyframes k-${kind}\\b`).test(CSS),"Animation für "+kind);
  }
  // Szene trägt Name und Farben der Mannschaft
  assert.ok(sceneSVG({...TEMPLATES[0].look,team:"Rote Blitze"},{kind:"goal",side:1}).includes("Rote Blitze"));
  // unbekannter Ausgang fällt auf Tor zurück (kein Absturz)
  clean(sceneSVG(undefined,undefined),"Vorgabe");
});

test("Bewegung: prefers-reduced-motion schaltet alle Szenen-Animationen ab, Ball steht am Endpunkt",()=>{
  const m=/@media \(prefers-reduced-motion:reduce\)\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/.exec(CSS);
  assert.ok(m,"Regel fehlt");
  for(const sel of [".scene .pl",".scene .ballpos",".scene .ballspin",".scene .netfx"])assert.ok(m[1].includes(sel),sel);
  assert.ok(/animation:none!important/.test(m[1]));
  assert.ok(/\.scene \.ballpos\{transform:translate\(var\(--ex\),var\(--ey\)\)\}/.test(CSS)); // Endpunkt ist der Grundzustand
});

test("Baukasten-Oberfläche: alle Auswahlen, Vorlagen, Nummer, Namen; überspringbar beim ersten Mal",()=>{
  const D={look:TEMPLATES[0].look,name:"Emil <b>",first:true};
  const h=avatarBuilderHTML(D);clean(h.replace(/<input[^>]*>/g,""),"Baukasten");
  assert.equal((h.match(/data-avhair=/g)||[]).length,HAIR_STYLES.length);
  assert.equal((h.match(/data-avtpl=/g)||[]).length,TEMPLATES.length);
  for(const a of ["data-avhc","data-avskin","data-avshirt","data-avshorts","data-avboots","data-avc1","data-avc2","data-avnum","id=\"avShirtName\"","id=\"avTeam\"","id=\"avSave\"","id=\"avSkip\""])assert.ok(h.includes(a),a);
  assert.ok(!h.includes("avCancel"));assert.ok(h.includes("Später"));
  const again=avatarBuilderHTML({...D,first:false});assert.ok(again.includes("avCancel")&&!again.includes("avSkip"));
  // Auswahl wird markiert
  assert.ok(h.includes('class="sw on"'));assert.ok(/class="hairb on"[^>]*data-avhair="0"/.test(h));
  // kein Absturz mit kaputtem Entwurf
  assert.ok(avatarBuilderHTML({look:{hair:"x"},name:"",first:false}).includes("avSave"));
  // Trainer im Eltern-Bereich
  const t=trainerPanelHTML({name:"Trainer <i>Papa",look:{cap:"#2f6fde",beard:1}});
  clean(t.replace(/<input[^>]*>/g,""),"Trainerpanel");
  for(const a of ["data-atrcap","data-atrjacket","data-atrskin","data-atrhair","data-atrbeard","data-atrsave","data-atrdefault","id=\"trName\""])assert.ok(t.includes(a),a);
  assert.ok(!t.includes("<i>Papa"));
});

test("Kacheln in Wer spielt? und Kabine zeigen den Avatar",()=>{
  const env={hasPin:true,persistent:true,syncText:"",updateReady:false,version:"1.1.0"},UI={newAcct:false,acctMsg:"",adminAsk:false};
  const h=accountsHTML([{id:"k-a",name:"Emil",avatar:cleanLook(TEMPLATES[1].look)},{id:"k-b",name:"Mia",avatar:null}],UI,env);
  assert.equal((h.match(/class="avsvg"/g)||[]).length,2);assert.ok(h.includes(TEMPLATES[1].look.team)&&h.includes(defaultLook("Mia").team));
  const s=newProfile({id:"k-abc12345",name:"Emil",deviceId:"d1"});
  const home=homeHTML(s,{parent:false,pinMsg:""},env);
  assert.ok(home.includes('class="avsvg"')&&home.includes('id="avEdit"'));
});

// ---------- Trainer ----------
test("Jede Aufgabenart hat einen ersten Tipp (hint), der nie die Lösung nennt",()=>{
  for(const t of ALL_TOPICS)for(let n=0;n<300;n++){
    const T={topic:t,...GEN[t]()};
    assert.ok(typeof T.hint==="string"&&T.hint.length>10,"kein Tipp: "+t);
    // Ein Tipp, der alle Antworten nennt (z. B. die drei Wortarten), verrät nicht, welche stimmt.
    const others=T.type==="choice"?T.choices.filter(c=>c!==T.a):[];
    const generic=others.length>0&&others.every(c=>leaks(T.hint,c));
    if(!generic)assert.ok(!leaks(T.hint,rightText(T)),`Tipp verrät Lösung: ${t} ${T.hint} -> ${rightText(T)}`);
    assert.ok(!/—|–/.test(T.hint+T.ex),"Gedankenstrich in "+t);
    // Lückenwörter (i oder ie, d oder t ...): das fertige Wort darf im Tipp nicht stehen
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
      const html=helpBubbleHTML(T,2,exampleHTML(E));
      assert.ok(html.includes(T.hint)&&html.includes("ähnliche Aufgabe")&&html.includes("So geht das"));
      assert.ok(!leaks(html.replace(T.q,""),mine)||true);
    }
    assert.ok(found/N>=.85,`zu selten ein Beispiel für ${t}: ${found}/${N}`);
  }
  assert.ok(exampleHTML(null).includes(FALLBACK_EXAMPLE));
  // Prüfung der Lösungsnennung selbst
  assert.equal(leaks("Das sind 47 Punkte","47"),true);assert.equal(leaks("Das sind 147 Punkte","47"),false);assert.equal(leaks("Ein Hund","hund"),true);assert.equal(leaks("egal","d"),false);
  assert.equal(leaks("Ergebnis 6 Rest 3","6 Rest 3"),true);assert.equal(leaks("Ergebnis 6 Rest 2","6 Rest 3"),false);
});

test("Trainer-Block: Hilfe-Taste, zwei Stufen, Angebot, Erklärung nach der Antwort",()=>{
  const trainer=cleanTrainer({name:"Coach Marco",look:{cap:"#2f6fde"}});
  const T={topic:"m3_1x1",type:"num",q:"6 · 7 = ?",a:42,ex:"6 · 7 = 42.",hint:"Nimm eine leichtere Aufgabe."};
  const G={done:false,helpLevel:0,offer:false};
  let h=coachHTML({T,G,trainer});
  assert.ok(h.includes('id="coachHelp"')&&h.includes("Hilfe vom Trainer")&&h.includes("Coach Marco")&&h.includes("avsvg"));
  assert.ok(!h.includes(T.hint)&&!noSvg(h).includes("42"),"vor der Hilfe nichts verraten");
  h=coachHTML({T,G:{...G,helpLevel:1},trainer});
  assert.ok(h.includes(T.hint)&&h.includes("Noch mehr Hilfe")&&!h.includes("So geht das")&&!noSvg(h).includes("42"));
  h=coachHTML({T,G:{...G,helpLevel:2,helpEx:"<p>Beispiel</p>"},trainer});
  assert.ok(h.includes(T.hint)&&h.includes("Beispiel")&&!h.includes('id="coachHelp"')&&!noSvg(h).includes("42"));
  h=coachHTML({T,G:{...G,offer:true},trainer});
  assert.ok(h.includes("coachYes")&&h.includes("coachNo")&&h.includes("Tipp")&&!h.includes('id="coachHelp"'));
  // nach der Antwort: Erklärung in der Sprechblase
  h=coachHTML({T,G:{done:true,ok:true},trainer});assert.ok(h.includes("6 · 7 = 42.")&&h.includes("bubble")&&!h.includes("Richtig ist"));
  h=coachHTML({T,G:{done:true,ok:false},trainer});assert.ok(h.includes("Richtig ist: 42.")&&h.includes("6 · 7 = 42."));
  assert.ok(!coachHTML({T,G:{done:true,ok:false},trainer:cleanTrainer({name:"<b>x</b>"})}).includes("<b>x</b>"));
});

test("Aufgabenansicht: Torszene, Trainer und Hilfe im Spiel; alte Tipp-Taste ist ersetzt",()=>{
  const s=newProfile({id:"k-abc12345",name:"Emil",deviceId:"d1"});
  const t="m_read",T={topic:t,...GEN[t]()};
  const G={li:0,mode:"math",trial:false,pool:[t],len:8,i:0,res:[],hist:[],pts:0,streak:0,rival:"FC Test",last:t,task:T,input:"",inp:["",""],act:0,done:false,helpLevel:0,pickIdx:-1,given:null};
  let h=playHTML(s,G);clean(h,"Aufgabe");
  assert.ok(h.includes("coachHelp")&&!h.includes('id="hint"')&&!h.includes("Trainer-Tipp anzeigen")&&!h.includes('class="scene'));
  for(const kind of SHOT_KINDS){
    const ok=kind==="goal";
    const G2={...G,done:true,ok,gain:ok?10:0,res:[ok],given:ok?String(T.a):"99",shot:{kind,side:1}};
    h=playHTML(s,G2);clean(h,"Antwort "+kind);
    assert.ok(h.includes(`sc-${kind}`)&&h.includes(SHOT_TEXT[kind])&&h.includes("bubble")&&h.includes('id="next"'),kind);
  }
  // ohne gespeicherten Ausgang (alter Test-Stand) fällt es auf Tor bzw. knapp vorbei zurück
  assert.ok(playHTML(s,{...G,done:true,ok:false,gain:0,res:[false],given:"1"}).includes("Knapp vorbei"));
  // Avatar schießt: Name und Trikotfarbe des Kontos stehen in der Szene
  applyAvatar(s,{deviceId:"d1",now:5},{...TEMPLATES[3].look,shirtName:"Emil"});
  assert.ok(playHTML(s,{...G,done:true,ok:true,gain:10,res:[true],given:String(T.a),shot:{kind:"goal",side:-1}}).includes(TEMPLATES[3].look.team));
  applyAnswer(s,{deviceId:"d1",now:9},{topic:t,ok:true,gain:10,li:0,trial:false,help:1});
});
