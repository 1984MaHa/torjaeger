// Version 1.3.0: neue Avatare. Flacher Stil, Ganzkörper mit Rückansicht, Baukasten in 6 Schritten, Kopfbedeckungen über den Brauen,
// Rückenfeld mit Name und Nummer, Trainerteam im selben Stil, Schemaversion 4 (Migration 3 nach 4 mit Stand im Format 1.2.1).
import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {migrateProfile,migrateGlobal,newProfile,newGlobal,total,SCHEMA_VERSION,GLOBAL_SCHEMA_VERSION,UnsupportedSchema} from "../app/js/model.js";
import {mergeProfile,mergeGlobal} from "../app/js/merge.js";
import {applyAvatar,applyTrainer} from "../app/js/rules.js";
import {HAIRS,HAIR_KEYS,HATS,FACES,MOUTHS,STEPS,TEMPLATES,BEARDS,cleanLook,cleanTrainerLook,cleanTrainer,hairList,randomPatch,randomTrainerPatch,startLook,withBody,defaultTrainer,defaultTrainer2} from "../app/js/avatar.js";
import {avatarSVG,figureG,hatParts,backLayout,BACK_FIELD,BROW_TOP,HAT_LIMIT,trainerSVG,sceneSVG} from "../app/js/avatardraw.js";
import {avatarBuilderHTML,trainerPanelHTML} from "../app/js/avatarui.js";

const fx=n=>JSON.parse(fs.readFileSync(new URL("./fixtures/"+n,import.meta.url),"utf8"));
const clone=o=>JSON.parse(JSON.stringify(o));
const dev=(id,t)=>({deviceId:id,now:t});
function wellFormed(s){const stack=[],re=/<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>/g;let m;
  while((m=re.exec(s))){if(m[4]==="/")continue;if(m[1]==="/"){if(stack.pop()!==m[2])return false;}else stack.push(m[2]);}return stack.length===0;}
const clean=(s,w)=>{assert.ok(wellFormed(s),w+": nicht wohlgeformt");assert.ok(!/undefined|NaN|\bnull\b|\[object/.test(s.replace(/data-[a-z]+="[^"]*"/g,"")),w+": kaputter Wert");assert.ok(!/<script|<img|javascript:|\son[a-z]+\s*=/i.test(s),w+": unsicher");};
const BASE=TEMPLATES[0].look;
// größte y-Koordinate aller Formen einer Zeichnung (Pfade mit absoluten Befehlen, Kreise, Ellipsen, Rechtecke)
function maxY(svg){
  let m=-1e9;
  for(const d of svg.matchAll(/ d="([^"]*)"/g)){const n=d[1].match(/-?\d+(?:\.\d+)?/g).map(Number);for(let i=1;i<n.length;i+=2)m=Math.max(m,n[i]);}
  for(const c of svg.matchAll(/<circle cx="[^"]*" cy="([^"]*)" r="([^"]*)"/g))m=Math.max(m,+c[1]+ +c[2]);
  for(const e of svg.matchAll(/<ellipse cx="[^"]*" cy="([^"]*)" rx="[^"]*" ry="([^"]*)"/g))m=Math.max(m,+e[1]+ +e[2]);
  for(const r of svg.matchAll(/<rect x="[^"]*" y="([^"]*)" width="[^"]*" height="([^"]*)"/g))m=Math.max(m,+r[1]+ +r[2]);
  return m;
}
// Inhalt einer Gruppe mit data-part
const group=(svg,part)=>{const i=svg.indexOf(`data-part="${part}"`);if(i<0)return"";const s=svg.indexOf(">",i)+1;let depth=1,k=s;const re=/<(\/?)g\b[^>]*>/g;re.lastIndex=s;let m;while((m=re.exec(svg))){depth+=m[1]?-1:1;k=m.index;if(depth===0)break;}return svg.slice(s,k);};

// ---------- Datenmodell: Schemaversion 4 ----------
test("Schema ist 4 (Konto) und 3 (global)",()=>{assert.equal(SCHEMA_VERSION,4);assert.equal(GLOBAL_SCHEMA_VERSION,3);});

test("Migration 3 nach 4: Stand im Format 1.2.1 bleibt vollständig erhalten, der alte Avatar wird überführt",()=>{
  const old=fx("state-v3.json"),before=JSON.stringify(old),s=migrateProfile(old);
  assert.equal(old.meta.schemaVersion,3);assert.equal(JSON.stringify(old),before,"Eingabe bleibt unverändert");
  assert.equal(s.meta.schemaVersion,4);
  // nichts verloren
  assert.deepEqual(s.progress,old.progress);assert.deepEqual(s.stats,old.stats);assert.deepEqual(s.history,old.history);assert.deepEqual(s.settings,old.settings);
  assert.equal(total(s,"points"),total(old,"points"));
  assert.deepEqual({...s.profile,avatar:0},{...old.profile,avatar:0});
  const a=s.profile.avatar,o=old.profile.avatar;
  assert.equal(a.t,o.t,"Zeitstempel des Aussehens bleibt");assert.equal(a.v,3);
  // alte Merkmale bleiben, die Frisur ist jetzt ein Schlüssel (Mädchen, Index 1 = Zöpfe)
  assert.equal(a.hair,"zoepfe");
  for(const k of ["body","hairColor","skin","hat","hatColor","eyes","pattern","collar","mouth","socks","face","nose","brows","eyeShape","freckles","glasses","build","shirt","shorts","boots","number","shirtName","team","c1","c2"])assert.equal(a[k],o[k],k);
  // neue Merkmale bekommen nächstliegende Werte
  assert.equal(a.browColor,"");assert.equal(a.cheeks,1);assert.equal(a.outfit,0);assert.equal(a.outfitColor,o.shirt);assert.equal(a.bg,"");
  // ohne Avatar und von Schema 1 und 2 aus geht es auch
  const n=clone(old);n.profile.avatar=null;assert.equal(migrateProfile(n).profile.avatar,null);
  assert.equal(migrateProfile(fx("state-v1.json")).meta.schemaVersion,4);assert.equal(migrateProfile(fx("state-v2.json")).meta.schemaVersion,4);
  // zweimal migrieren ändert nichts, neuere Schemaversion wird abgelehnt
  assert.deepEqual(migrateProfile(clone(s)),s);
  const neu=newProfile({id:"k-abc12345",name:"X",deviceId:"d"});neu.meta.schemaVersion=5;assert.throws(()=>migrateProfile(neu),UnsupportedSchema);
});

test("Alle alten Frisuren (Junge und Mädchen, Index 0 bis 9) gehen in gültige Schlüssel über, nichts geht verloren",()=>{
  const seen={j:[],m:[]};
  for(const body of ["j","m"])for(let i=0;i<10;i++){const h=cleanLook({...BASE,body,hair:i}).hair;assert.ok(HAIR_KEYS.includes(h),body+i);seen[body].push(h);}
  assert.equal(new Set(seen.j).size,10);assert.equal(new Set(seen.m).size,10);
  assert.equal(seen.j[9],"ohne");assert.equal(seen.m[9],"ohne");assert.equal(seen.m[0],"pferdeschwanz");assert.equal(seen.j[8],"fransen");
  assert.ok(HAIRS.length>=15);
});

test("Globale Migration 2 nach 3: Trainer im neuen Aufbau, Name und Zeitstempel bleiben",()=>{
  const old=fx("global-v2.json"),before=JSON.stringify(old),g=migrateGlobal(clone(old));
  assert.equal(JSON.stringify(old),before);
  assert.equal(g.schemaVersion,3);assert.equal(g.trainer.name,"Coach Kai");assert.equal(g.trainer.t,old.trainer.t);
  const l=g.trainer.look;
  assert.equal(l.v,3);assert.equal(l.hair,"halblang");assert.equal(l.hairColor,"#b8341f");assert.equal(l.skin,"#c68642");assert.equal(l.jacket,"#2f6fde");assert.equal(l.eyes,"#5f9b6a");
  assert.equal(l.beard,1);assert.equal(l.beardColor,"#b8341f","alter Bart behält die Haarfarbe");assert.equal(l.glasses,2);assert.equal(l.mouth,1);assert.equal(l.gear,1,"die Pfeife bleibt");
  assert.deepEqual(g.trainer2,defaultTrainer2());                       // nie geändert (t 0): aktuelle Vorgabe
  assert.deepEqual(migrateGlobal(clone(g)),g);
  assert.deepEqual(newGlobal().trainer,defaultTrainer());
});

test("Abgleich: das Aussehen mit dem neueren Zeitstempel gewinnt (neue Felder inklusive), das Trainerteam ebenso",()=>{
  const a=migrateProfile(fx("state-v3.json")),b=clone(a);
  applyAvatar(a,dev("A",1790100000000),{...a.profile.avatar,hair:"dutt",outfit:1,bg:"#ffd9e0"});
  applyAvatar(b,dev("B",1790200000000),{...b.profile.avatar,hair:"igel",browColor:"#2f6fde",cheeks:0});
  const ab=mergeProfile(a,b),ba=mergeProfile(b,a);
  assert.equal(ab.profile.avatar.hair,"igel");assert.equal(ab.profile.avatar.browColor,"#2f6fde");assert.equal(ab.profile.avatar.cheeks,0);assert.equal(ab.profile.avatar.outfit,0);
  assert.deepEqual(ab.profile.avatar,ba.profile.avatar);
  const g1=migrateGlobal(fx("global-v2.json")),g2=clone(g1);
  applyTrainer(g2,dev("X",1790300000000),{name:"Coach Ina",look:{...g2.trainer.look,beard:3,gear:2}},1);
  const m=mergeGlobal(g1,g2);assert.equal(m.trainer.name,"Coach Ina");assert.equal(m.trainer.look.beard,3);assert.equal(m.trainer.look.gear,2);
});

// ---------- Zeichenstil ----------
test("Flacher Stil: keine Konturlinien, keine Lippen, Mund und Kinn ohne Kontur oder dunkle Fläche, Schatten nur am Hals",()=>{
  for(let face=0;face<FACES.length;face++)for(let mouth=0;mouth<MOUTHS.length;mouth++)for(const body of ["j","m"]){
    const l={...BASE,body,face,mouth,hair:"kurz",hat:0,glasses:0},svg=figureG(l,"front"),head=group(svg,"kopf");
    clean(avatarSVG(l,{px:100}),`Gesicht ${face}/${mouth}`);
    assert.ok(!svg.includes("#2b2320"),"keine Konturfarbe");assert.ok(!/stroke-linejoin|stroke-linecap="round" stroke-linejoin/.test(svg),"keine Konturlinien");
    // Mundgruppe: nur Rosé-Linie oder Mundinneres, kein Lippenstrich, keine dunkle Fläche
    const mouthG=group(svg,"mouth");assert.ok(mouthG.length>10);
    for(const st of mouthG.matchAll(/stroke="([^"]+)"/g))assert.equal(st[1],"#a84450");
    for(const f of mouthG.matchAll(/fill="([^"]+)"/g))assert.ok(["#b4404f","#fff","#f3889a","none"].includes(f[1]),"Mundfarbe "+f[1]);
    assert.ok(!/data-part="(lips|chin|beard|chinshadow|lowerface)"/.test(svg),"nichts, was nach Bart oder Lippen aussieht");
    // Nach der Kopfform kommen nur Brauen, Augen, Nase, Bäckchen und Mund, nichts Dunkles am Kinn
    const after=head.slice(head.indexOf('data-part="head"'));
    const parts=[...after.matchAll(/data-part="([a-z]+)"/g)].map(m=>m[1]);
    assert.deepEqual(parts.filter(p=>!["head","brows","eye","nose","cheeks","mouth"].includes(p)),[]);
  }
  // Die Figur ist flach: Striche gibt es nur für Brauen, Nase, Mund, Streifen am Ärmel und Haardetails
  const f=figureG(BASE,"front");assert.ok((f.match(/stroke="/g)||[]).length<=10,"wenige Striche");
});

test("Kinder haben keinen Bart: kein Bart-Merkmal im Aussehen, nie eine Bartzeichnung",()=>{
  const l=cleanLook({...BASE,beard:1,beardColor:"#000000",bart:1});
  assert.ok(!("beard" in l)&&!("beardColor" in l),"kein Bart-Merkmal");
  for(const body of ["j","m"])for(const hair of HAIR_KEYS)for(const view of ["front","back"])assert.ok(!figureG({...BASE,body,hair,beard:2},view).includes('data-part="beard"'),hair);
  for(const t of TEMPLATES)assert.ok(!avatarBuilderHTML({look:t.look,name:"x",first:false,step:4}).includes("Bart"));
  // Trainerteam: Bart in mehreren Formen mit eigener Farbe
  assert.ok(BEARDS.length>=4);
  const seen=new Set();
  for(let b=0;b<BEARDS.length;b++){const svg=trainerSVG({...defaultTrainer().look,beard:b,beardColor:"#5a3825"},{px:80});clean(svg,"Bart "+b);seen.add(svg);assert.equal(svg.includes('data-part="beard"'),b>0);}
  assert.equal(seen.size,BEARDS.length,"jede Form sieht anders aus");
  assert.notEqual(trainerSVG({...defaultTrainer().look,beard:1,beardColor:"#5a3825"},{px:80}),trainerSVG({...defaultTrainer().look,beard:1,beardColor:"#e6c15a"},{px:80}));
});

test("Brustbild ist ein Ausschnitt derselben Figur: gleicher Kopf, nur Kleidung und Hintergrund wechseln",()=>{
  for(const t of TEMPLATES){
    const l=cleanLook(t.look),full=avatarSVG(l,{px:180}),bust=avatarSVG(l,{crop:"bust",px:90}),head=avatarSVG(l,{crop:"head",px:70});
    for(const s of [full,bust,head])clean(s,t.name);
    assert.equal(group(full,"kopf"),group(bust,"kopf"),t.name+": Kopf wie in der Ganzkörperfigur");
    assert.equal(group(full,"kopf"),group(head,"kopf"));
    assert.ok(bust.includes("<circle")&&bust.includes("avclip"),"runder Pastellkreis");
  }
  // Hintergrund wählbar oder aus der Vereinsfarbe abgeleitet
  const a=avatarSVG({...BASE,bg:"#d3e2ff"},{crop:"bust"}),b=avatarSVG({...BASE,bg:""},{crop:"bust"}),c=avatarSVG({...BASE,bg:"",c1:"#2f6fde"},{crop:"bust"});
  assert.ok(a.includes("#d3e2ff"));assert.notEqual(b,c);
  // Porträt-Kleidung: T-Shirt und Sportjacke in eigener Farbe, die Ganzkörperfigur trägt immer das Trikot
  const shirt={...BASE,shirt:"#e5484d",outfit:1,outfitColor:"#34a853"};
  assert.ok(avatarSVG(shirt,{crop:"bust"}).includes("#34a853"));assert.ok(!avatarSVG(shirt,{px:200}).includes("#34a853"),"im Spiel immer das Trikot");
  assert.notEqual(avatarSVG({...shirt,outfit:2},{crop:"bust"}),avatarSVG(shirt,{crop:"bust"}));
});

test("Ganzkörperfigur: alle Frisuren, Kopfformen, Muster und Haltungen vorn und hinten zeichnen sauberes SVG",()=>{
  const fronts=new Set();
  for(const hair of HAIR_KEYS)for(const view of ["front","back"]){
    const svg=figureG({...BASE,hair,shirtName:"Emil"},view);clean(avatarSVG({...BASE,hair},{view,px:120}),hair+view);
    if(view==="front")fronts.add(svg);
  }
  assert.equal(fronts.size,HAIR_KEYS.length,"alle Frisuren sehen vorn verschieden aus");
  for(let f=0;f<FACES.length;f++)for(let p=0;p<4;p++)for(const view of ["front","back"])clean(avatarSVG({...BASE,face:f,pattern:p,collar:p%2},{view,px:100}),`Kopf ${f} Muster ${p}`);
  for(const pose of ["stand","shoot"])for(const view of ["front","back"])clean(avatarSVG(BASE,{view,pose,px:150}),pose+view);
  assert.notEqual(avatarSVG(BASE,{pose:"shoot"}),avatarSVG(BASE,{pose:"stand"}));
  // Trikot vorn mit Kragen, Muster und kleiner Nummer, Hose, Stutzen, Schuhe in den gewählten Farben
  const f=figureG({...BASE,shirt:"#2f6fde",shorts:"#1f3f8f",socks:"#ffc83d",boots:"#d7f000",number:"7",pattern:1},"front");
  for(const c of ["#2f6fde","#1f3f8f","#ffc83d","#d7f000"])assert.ok(f.includes(c),c);assert.ok(f.includes(">7<"));
  assert.notEqual(figureG({...BASE,collar:0},"front"),figureG({...BASE,collar:1},"front"));
  for(let b=0;b<3;b++)clean(avatarSVG({...BASE,build:b},{px:100}),"Körperbau");
});

// ---------- Kopfbedeckungen ----------
test("Kopfbedeckungen reichen nie unter die Brauenlinie: für jede Kopfform, jede Kopfbedeckung und jede Farbe",()=>{
  assert.ok(HAT_LIMIT<BROW_TOP);
  assert.deepEqual(HATS,["Keine","Cap","Cap verkehrt","Mütze","Stirnband","Bandana","Hut"]);
  for(let hat=1;hat<HATS.length;hat++)for(const color of ["#e5484d","#22252b","#f4f4f4"]){
    const svg=hatParts(hat,color,"front");assert.ok(svg.length>30,HATS[hat]);
    assert.ok(maxY(svg)<=HAT_LIMIT,`${HATS[hat]} reicht bis y ${maxY(svg)}`);
  }
  for(let face=0;face<FACES.length;face++)for(let hat=1;hat<HATS.length;hat++)for(const hair of HAIR_KEYS){
    const l={...BASE,face,hat,hair,glasses:1,hatColor:"#e5484d"},svg=figureG(l,"front");clean(avatarSVG(l,{crop:"head",px:80}),`${FACES[face]} ${HATS[hat]} ${hair}`);
    // die Kopfbedeckung wird zuletzt gezeichnet (über Frisur und Gesicht), Augen, Brauen, Nase und Mund sind immer da
    assert.ok(group(svg,"kopf").endsWith(hatParts(hat,"#e5484d","front")),"Kopfbedeckung zuletzt: "+HATS[hat]);
    for(const p of ["brows","eye","nose","mouth"])assert.ok(svg.includes(`data-part="${p}"`),p);
  }
  // Brauen und Augen liegen unterhalb der Grenze
  const brows=group(figureG(BASE,"front"),"brows");
  for(const d of brows.matchAll(/ d="([^"]*)"/g)){const n=d[1].match(/-?\d+(?:\.\d+)?/g).map(Number);for(let i=1;i<n.length;i+=2)assert.ok(n[i]>HAT_LIMIT);}
  for(const hair of HAIR_KEYS)assert.ok(figureG({...BASE,hair,hat:0},"front").includes(`data-hf="${hair}"`));
  // mit Kopfbedeckung verschwindet die Frisur oben (keine Haare ragen durch Cap und Mütze)
  assert.ok(figureG({...BASE,hair:"igel",hat:0},"front").includes("M34 26 L34 4")&&!figureG({...BASE,hair:"igel",hat:3},"front").includes("M34 26 L34 4"));
  // Die Rückansicht hat für jede Kopfbedeckung eine eigene Zeichnung
  const backs=new Set();for(let hat=0;hat<HATS.length;hat++)backs.add(figureG({...BASE,hat},"back"));assert.equal(backs.size,HATS.length);
});

// ---------- Rückansicht ----------
test("Rückansicht: jede Frisur hat eine eigene Hinterkopf-Zeichnung, kein Gesicht, Ohren seitlich sichtbar",()=>{
  const seen=new Set();
  for(const body of ["j","m"])for(const hair of HAIR_KEYS){
    const svg=figureG({...BASE,body,hair},"back");
    assert.ok(svg.includes(`data-hb="${hair}"`),hair);
    for(const p of ["eye","brows","nose","mouth","cheeks","glasses"])assert.ok(!svg.includes(`data-part="${p}"`),`Rückansicht ${hair} zeigt ${p}`);
    assert.ok(!svg.includes("data-hf="),"keine Vorderfrisur über dem Gesicht");
    assert.ok(svg.includes('data-part="ear"'),"Ohren");
    const hb=svg.slice(svg.indexOf("data-hb="),svg.indexOf("</g>",svg.indexOf("data-hb=")));
    if(body==="j")seen.add(hb);
  }
  assert.equal(seen.size,HAIR_KEYS.length,"jede Hinterkopf-Zeichnung ist anders");
  // Zöpfe, Pferdeschwanz und lange Haare hängen im Rücken und bleiben über dem Namensfeld
  for(const hair of ["zoepfe","pferdeschwanz","lang","halblang","bob"]){
    const svg=figureG({...BASE,hair},"back"),hb=svg.slice(svg.indexOf("data-hb="),svg.indexOf('data-part="rueckenfeld"'));
    assert.ok(maxY(hb)<=108,hair+" reicht bis "+maxY(hb));
  }
  // dasselbe Haar sieht vorn und hinten verschieden aus, die Haarfarbe ist dieselbe
  assert.notEqual(figureG({...BASE,hair:"zoepfe"},"front"),figureG({...BASE,hair:"zoepfe"},"back"));
  assert.ok(figureG({...BASE,hair:"kurz",hairColor:"#e6c15a"},"back").includes("#e6c15a"));
});

test("Trikotrücken: Name gebogen über der Nummer, beides im Rückenfeld, automatisch skaliert, nie über die Hose",()=>{
  const names=["","EMIL","MAXIMILIAN","WOLFGANGXY","MI","ÄÖÜ ß","AAAAAAAAAA","WWWWWWWWWW"],nums=["1","7","10","88","99","00"];
  for(const name of names)for(const number of nums){
    const l={...BASE,shirtName:name,number},B=backLayout(l),F=BACK_FIELD;
    const nm=cleanLook(l).shirtName;assert.equal(B.name.text,nm);
    // Nummer: Breite und Höhe im Feld, Grundlinie oberhalb der Hose (Hose beginnt bei y 128)
    assert.ok(B.num.width<=F.x1-F.x0,`Nummer ${number} zu breit: ${B.num.width}`);assert.ok(60-B.num.width/2>=F.x0&&60+B.num.width/2<=F.x1);
    assert.ok(B.num.y<=F.y1&&B.num.y<128,"Nummer endet über der Hose");assert.ok(B.num.top>=F.y0,"Nummer beginnt im Feld");
    // Name: jeder Buchstabe im Feld, über der Nummer
    let lastX=-1e9;
    for(const L of B.name.letters){
      assert.ok(L.x-L.w/2>=F.x0-.01&&L.x+L.w/2<=F.x1+.01,`${nm}: Buchstabe ${L.ch} außerhalb x ${L.x}`);
      assert.ok(L.y<=F.y1&&L.y<B.num.top,"Name über der Nummer");assert.ok(L.y-B.name.size*.75>=F.y0-.01,"Name beginnt im Feld");
      assert.ok(L.x>lastX);lastX=L.x;
    }
    if(nm.length>=3){ // leicht gebogen: die äußeren Buchstaben stehen tiefer als die mittleren und sind gedreht
      const ys=B.name.letters.map(L=>L.y);assert.ok(ys[0]>Math.min(...ys)&&ys.at(-1)>Math.min(...ys));
      assert.ok(B.name.letters[0].rot<0&&B.name.letters.at(-1).rot>0);
    }
    const svg=figureG(l,"back");assert.ok(svg.includes(`font-size="${B.num.size}"`)&&svg.includes('data-part="rueckenfeld"'));
    clean(avatarSVG(l,{view:"back"}),name+number);
  }
  // lange Namen werden kleiner, kurze nicht größer als 9, zweistellige Zahlen kleiner als einstellige
  assert.ok(backLayout({...BASE,shirtName:"MAXIMILIAN"}).name.size<backLayout({...BASE,shirtName:"EMIL"}).name.size);
  assert.ok(backLayout({...BASE,shirtName:"MI"}).name.size<=9);
  assert.ok(backLayout({...BASE,number:"88"}).num.size<backLayout({...BASE,number:"8"}).num.size);
  // Querstreifen und Brustband laufen nicht über den Rücken (der Text bleibt lesbar)
  for(const pattern of [2,3]){const b=figureG({...BASE,pattern,c2:"#ffc83d"},"back");assert.ok(!/M36(\.\d)? (90|92) H/.test(b));}
  // Die Torszene zeigt den Rücken mit Schusspose und Rückenfeld
  const sc=sceneSVG({...BASE,shirtName:"Emil",number:"88"},{kind:"goal",side:1});
  assert.ok(sc.includes('data-part="rueckenfeld"')&&sc.includes("data-hb=")&&sc.includes("rotate(-42 70 152)"));clean(sc,"Szene");
});

// ---------- Baukasten ----------
const builder=(look,step,opts={})=>avatarBuilderHTML({look,name:"Emil <b>",first:!!opts.first,step,view:opts.view});
const dataAv=(h,key)=>[...h.matchAll(new RegExp(`data-av="${key}:([^"]*)"`,"g"))].map(m=>m[1]);

test("Baukasten: 6 Schritte in der Reihenfolge von Marco, jeder mit Vorschau, Zurück, Weiter, Würfel und Fertig",()=>{
  assert.deepEqual(STEPS.map(s=>s[1]),["Junge oder Mädchen","Kopf und Haut","Frisur","Gesicht","Kleidung","Trikot und Verein"]);
  const l=startLook("j","Emil");
  for(let step=1;step<=6;step++){
    const h=builder(l,step,{first:true}),t=h.replace(/<input[^>]*>/g,"");clean(t,"Schritt "+step);
    assert.ok(h.includes(`Schritt ${step} von 6`),"Schritt "+step);
    assert.equal((h.match(/data-avstep=/g)||[]).length,6,"alle Schritte wieder aufrufbar");
    assert.ok(h.includes('class="avprev"')&&h.includes("<svg"),"große Vorschau");
    assert.ok(h.includes('data-avview="front"')&&h.includes('data-avview="back"'),"Umschalter vorn und hinten");
    assert.ok(h.includes('id="avBack"'));assert.equal(/id="avBack" disabled/.test(h),step===1);
    assert.equal(h.includes('id="avDice"'),step>1,"Würfel ab Schritt 2");
    assert.equal(h.includes('id="avNext"'),step<6);assert.ok(h.includes('id="avSave"'));assert.ok(h.includes('id="avSkip"')&&h.includes("Später"));
  }
  assert.ok(!builder(l,3,{first:false}).includes("avSkip")&&builder(l,3,{first:false}).includes("avCancel"));
  // Vergrößerter Kopf bei Gesichtsschritten, Rückseite mit Hinterkopf
  for(const step of [2,3,4,5])assert.ok(builder(l,step).includes('class="avhead"'),"Kopf vergrößert in Schritt "+step);
  assert.ok(!builder(l,1).includes('class="avhead"')&&!builder(l,6).includes('class="avhead"'));
  assert.ok(builder(l,3,{view:"back"}).includes("data-hb="));
  // Schritt 2: zuerst die Kopfform, dann der Hautton
  const s2=builder(l,2);assert.ok(s2.indexOf("Kopfform")<s2.indexOf("Hautton"));assert.equal(dataAv(s2,"face").length,FACES.length);assert.ok(dataAv(s2,"skin").length>=6);
  // Schritt 3: Haartypen, Haarfarbe, Brauenfarbe wie die Haare oder eigene
  const s3=builder(l,3);for(const n of ["Kurz","Halblang","Lang","Locken","Zöpfe","Pferdeschwanz","Wuschel","Fransen","Ohne Haare"])assert.ok(s3.includes(n),n);
  assert.ok(s3.includes("Wie die Haare")&&dataAv(s3,"browColor").includes("")&&dataAv(s3,"hairColor").length>=10);
  // Schritt 4: Augenform und -farbe, vier Münder, Nase, Sommersprossen, Bäckchen
  const s4=builder(l,4);for(const n of ["Augenform","Augenfarbe","Lächeln","Breites Lachen","Ernst","Überrascht","Nase","Sommersprossen","Bäckchen"])assert.ok(s4.includes(n),n);
  // Schritt 5: T-Shirt, Sportjacke, Trikot, Brille, sieben Kopfbedeckungen, Hintergrund
  const s5=builder(l,5);for(const n of ["T-Shirt","Sportjacke","Trikot","Brille","Cap","Cap verkehrt","Mütze","Stirnband","Bandana","Hut","Hintergrund"])assert.ok(s5.includes(n),n);
  assert.equal(dataAv(s5,"hat").length,HATS.length);
  assert.ok(builder({...l,outfit:1},5).includes('data-av="outfitColor:')&&!s5.includes('data-av="outfitColor:'));
  // Schritt 6: Trikot und Verein
  const s6=builder(l,6);for(const a of ["shirt","shorts","socks","boots","c1","c2","pattern","collar"])assert.ok(dataAv(s6,a).length>=2,a);
  for(const a of ["data-avnum",'id="avShirtName"','id="avTeam"'])assert.ok(s6.includes(a),a);assert.ok(s6.includes("muster")&&s6.includes("Kragen")&&s6.includes("Stutzen")&&s6.includes("Schuh"));
});

test("Junge oder Mädchen ist nur eine Vorauswahl: alle Frisuren, Farben und Kleidungsstücke bleiben für beide wählbar",()=>{
  const j=builder(startLook("j","x"),3),m=builder(startLook("m","x"),3);
  assert.deepEqual([...dataAv(j,"hair")].sort(),[...dataAv(m,"hair")].sort(),"dieselbe Auswahl");
  assert.equal(dataAv(j,"hair").length,HAIRS.length);
  assert.notDeepEqual(dataAv(j,"hair"),dataAv(m,"hair"),"nur die Reihenfolge der Vorschläge ist anders");
  assert.equal(dataAv(j,"hair")[0],hairList("j")[0]);assert.equal(dataAv(m,"hair")[0],hairList("m")[0]);
  assert.deepEqual([...hairList("j")].sort(),[...HAIR_KEYS].sort());
  const strip=h=>h.match(/data-av="[^"]*"/g);
  for(const step of [2,4,5,6])assert.deepEqual(strip(builder(startLook("j","x"),step)),strip(builder(startLook("m","x"),step)),"Schritt "+step+" ohne Einschränkung");
  // Wechsel im laufenden Entwurf behält alles (auch eine Mädchenfrisur bei einem Jungen)
  const l={...startLook("j","Emil"),hair:"zoepfe",shirt:"#8e44ad",number:"33",team:"Meine Elf",skin:"#8d5524"};
  const w=withBody(l,"m");assert.equal(w.body,"m");for(const k of ["hair","shirt","number","team","skin"])assert.equal(w[k],l[k],k);
  assert.equal(cleanLook({...l,body:"j",hair:"zoepfe"}).hair,"zoepfe");assert.equal(cleanLook({...l,body:"m",hair:"igel"}).hair,"igel");
  clean(avatarSVG({...l,body:"j"},{px:100}),"Junge mit Zöpfen");
  // Schritt 1: zwei Kacheln und fünf Vorlagen der Auswahl
  const s1=builder(startLook("m","Emil"),1,{first:true});assert.equal((s1.match(/data-avbody=/g)||[]).length,2);assert.equal((s1.match(/data-avtpl=/g)||[]).length,5);
  assert.ok(s1.includes("nur ein Vorschlag"));
});

test("Würfel: Zufallsvorschlag nur für den Schritt, immer gültige Werte, ändert sich mit dem Zufall",()=>{
  const FIELDS={1:["hair","hairColor","skin","shirt","outfitColor","shorts","boots","c1","c2","team","number"],2:["face","skin","build"],3:["hair","hairColor"],4:["eyeShape","eyes","mouth","nose","brows","freckles","cheeks"],5:["outfit","outfitColor","glasses","hat","hatColor","bg"],6:["shirt","c1","c2","socks","shorts","boots","pattern","collar","number"]};
  let seed=1;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  for(let step=1;step<=6;step++){
    const results=new Set();
    for(let n=0;n<60;n++){
      const p=randomPatch(step,BASE,rnd);
      for(const k of Object.keys(p))assert.ok(FIELDS[step].includes(k),`Schritt ${step} ändert ${k}`);
      const l=cleanLook({...BASE,...p});
      for(const k of Object.keys(p))assert.deepEqual(l[k],p[k],`Schritt ${step}: ${k} ungültig ${p[k]}`);
      results.add(JSON.stringify(p));
    }
    assert.ok(results.size>(step===1?2:5),"Schritt "+step+" würfelt verschieden");
  }
  assert.deepEqual(randomPatch(3,BASE,()=>0),randomPatch(3,BASE,()=>0));
  // Junge oder Mädchen bestimmt nur die Vorschläge des Würfels für die Frisur
  const hj=new Set(),hm=new Set();for(let n=0;n<200;n++){hj.add(randomPatch(3,{...BASE,body:"j"},rnd).hair);hm.add(randomPatch(3,{...BASE,body:"m"},rnd).hair);}
  assert.ok(hj.size>=8&&hm.size>=8);
  assert.ok(randomPatch(3,{...BASE,body:"m"},()=>0).hair==="pferdeschwanz"&&randomPatch(3,{...BASE,body:"j"},()=>0).hair==="kurz");
  // Trainerteam: Schritte 2 bis 5
  for(let step=2;step<=5;step++)for(const w of [1,2])for(let n=0;n<40;n++){const p=randomTrainerPatch(step,defaultTrainer().look,w,rnd),l=cleanTrainerLook({...defaultTrainer().look,...p},w);for(const k of Object.keys(p))assert.deepEqual(l[k],p[k],`Trainer Schritt ${step}: ${k}`);}
});

// ---------- Trainerteam ----------
test("Trainerteam im selben Stil: Brustbild, Bart nur hier, Brille, Kopfbedeckung, Pfeife oder Klemmbrett, baubar in den Schritten 2 bis 5",()=>{
  const [t1,t2]=[defaultTrainer(),defaultTrainer2()];
  assert.equal(t1.name,"Trainer");assert.equal(t2.name,"Trainerin");assert.equal(t1.look.hair,"ohne");assert.equal(t1.look.glasses,2);assert.equal(t2.look.earrings,1);
  for(const tr of [t1,t2]){const svg=trainerSVG(tr.look,{px:100,which:tr===t1?1:2});clean(svg,tr.name);assert.ok(!svg.includes("#2b2320")&&!/stroke-linejoin/.test(svg),"flach, ohne Kontur");assert.ok(svg.includes('data-part="kopf"'));}
  const seen=new Set();
  for(const hair of HAIR_KEYS)for(const which of [1,2]){const svg=trainerSVG({...(which===1?t1:t2).look,hair},{px:80,which});clean(svg,"Trainer "+hair);if(which===1)seen.add(svg);}
  assert.equal(seen.size,HAIR_KEYS.length);
  for(let hat=0;hat<HATS.length;hat++)clean(trainerSVG({...t1.look,hat},{px:80}),"Kopfbedeckung "+hat);
  const gears=new Set();for(let g=0;g<3;g++)gears.add(trainerSVG({...t1.look,gear:g},{px:80}));assert.equal(gears.size,3);
  assert.ok(trainerSVG({...t1.look,gear:1},{px:80}).includes("#ffc83d")&&trainerSVG({...t1.look,gear:2},{px:80}).includes("#b07a45"));
  assert.notEqual(trainerSVG({...t1.look,glasses:0},{px:80}),trainerSVG({...t1.look,glasses:1},{px:80}));
  assert.equal(cleanTrainer({name:"Trainer Papa"},1).name,"Trainer Papa");assert.equal(cleanTrainer({},2).name,"Trainerin");
  // Panel: Schritte 2 bis 5 mit denselben Auswahlen wie beim Spieler, dazu Extras nur für Erwachsene
  for(let step=2;step<=5;step++){
    const p=trainerPanelHTML(t1,1,step);clean(p.replace(/<input[^>]*>/g,""),"Trainerpanel "+step);
    assert.equal((p.match(/data-atrstep="1:/g)||[]).length,4);assert.ok(p.includes('data-atrdice="1:'+step+'"')&&p.includes('data-atrsave="1"')&&p.includes('data-atrdefault="1"')&&p.includes('id="trName1"'));
  }
  const p2=trainerPanelHTML(t1,1,2),p3=trainerPanelHTML(t1,1,3),p4=trainerPanelHTML(t1,1,4),p5=trainerPanelHTML(t1,1,5);
  assert.ok(p2.includes('data-atr="1:face:')&&p2.includes('data-atr="1:skin:'));
  assert.ok(p3.includes('data-atr="1:hair:kurz"')&&p3.includes('data-atr="1:hairColor:')&&p3.includes("Wie die Haare"));
  assert.ok(p4.includes('data-atr="1:beard:1"')&&p4.includes("Vollbart")&&p4.includes("Kinnbart")&&p4.includes("Schnurrbart")&&p4.includes("Dreitagebart")&&p4.includes('data-atr="1:mouth:'));
  assert.ok(!p4.includes("Bartfarbe")&&trainerPanelHTML({...t1,look:{...t1.look,beard:2}},1,4).includes("Bartfarbe"));
  assert.ok(p5.includes('data-atr="1:jacket:')&&p5.includes('data-atr="1:hat:')&&p5.includes('data-atr="1:gear:1"')&&p5.includes("Klemmbrett")&&p5.includes("Pfeife")&&p5.includes('data-atr="1:glasses:'));
  // Die Felder sind im Datenmodell, falsche Werte werden ersetzt
  const l=cleanTrainerLook({hair:"dutt",beard:4,beardColor:"#2b1d14",gear:2,hat:6,glasses:1,mouth:3},1);
  assert.deepEqual([l.hair,l.beard,l.beardColor,l.gear,l.hat,l.glasses,l.mouth],["dutt",4,"#2b1d14",2,6,1,3]);
  assert.equal(cleanTrainerLook({beard:99,gear:9,hat:99,hair:"xyz"},1).beard,0);
});

test("Stand aus Emils Konto im Format 1.2.1: nach der Migration zeigt die Zeichnung dasselbe Kind, alle Trikotwerte bleiben",()=>{
  const s=migrateProfile(fx("state-v3.json")),l=cleanLook(s.profile.avatar);
  assert.equal(l.shirtName,"WOLFGANGXY");assert.equal(l.number,"88");
  const B=backLayout(l);assert.equal(B.num.text,"88");assert.ok(B.name.size>=4.4);
  clean(avatarSVG(l,{view:"back",px:190}),"Rücken");clean(avatarSVG(l,{crop:"bust",px:90}),"Brustbild");
  assert.ok(figureG(l,"back").includes('data-hb="zoepfe"')&&figureG(l,"front").includes('data-hf="zoepfe"'));
});
