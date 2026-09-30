// Version 1.5.0: feste Bild-Vorlagen statt Avatar-Baukasten. Schemaversion 6 (Konto) und 4 (global) mit Migration aus dem Format 1.4.1,
// Figuren-Bilder (freigestellt, ohne Markenlogo, in der Liste des Service Workers), Umfärben, Name und Nummer im Rückenfeld,
// Oberfläche „Mein Spieler“, Trainerfarben, Mannschaftsname auf Kachel, Kabine und Anzeigetafel.
import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {readPNG} from "../tools/png.mjs";
import {migrateProfile,migrateGlobal,newProfile,newGlobal,total,SCHEMA_VERSION,GLOBAL_SCHEMA_VERSION,UnsupportedSchema} from "../app/js/model.js";
import {mergeProfile,mergeGlobal} from "../app/js/merge.js";
import {applyAvatar,applyTrainer,applyReset} from "../app/js/rules.js";
import {KIT_COLORS,KIT_KEYS,KIT_PRESETS,KID_TEMPLATES,POLO_COLORS,COLOR_NAMES,cleanLook,cleanTrainer,defaultLook,defaultTrainer,defaultTrainer2,upgradeOldHair,lookOf,withKit,withPreset,presetIndex} from "../app/js/avatar.js";
import {FIGDATA} from "../app/js/figdata.js";
import {tintLayer,backLayout,textOn,contrast,shadeChannel,hexToRgb,figureURL,loadFigures,setFigureEnv,storeSize,basePath,FIG_IDS} from "../app/js/figures.js";
import {avatarSVG,trainerSVG,sceneSVG,figureParts} from "../app/js/avatardraw.js";
import {avatarBuilderHTML,trainerPanelHTML} from "../app/js/avatarui.js";
import {homeHTML,accountsHTML,playHTML,resultHTML} from "../app/js/views.js";

const ROOT=fileURLToPath(new URL("..",import.meta.url));
const fx=n=>JSON.parse(fs.readFileSync(path.join(ROOT,"test/fixtures",n),"utf8"));
const clone=o=>JSON.parse(JSON.stringify(o));
const dev=(id,t)=>({deviceId:id,now:t});
const sw=fs.readFileSync(path.join(ROOT,"app/sw.js"),"utf8");
const png=name=>readPNG(path.join(ROOT,"app/img",name));
function wellFormed(s){const stack=[],re=/<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>/g;let m;
  while((m=re.exec(s))){if(m[4]==="/")continue;if(m[1]==="/"){if(stack.pop()!==m[2])return false;}else stack.push(m[2]);}return stack.length===0;}
const noInput=s=>s.replace(/<input[^>]*>/g,"");
const clean=(s,w)=>{assert.ok(wellFormed(s),w+": nicht wohlgeformt");assert.ok(!/undefined|NaN|\bnull\b|\[object/.test(s.replace(/data-[a-z]+="[^"]*"/g,"")),w+": kaputter Wert");assert.ok(!/<script|<img|javascript:|\son[a-z]+\s*=/i.test(s),w+": unsicher");};

// ---------- Datenmodell ----------
test("Schema ist 6 (Konto) und 4 (global), Version 1.5.0 an allen vier Stellen",()=>{
  assert.equal(SCHEMA_VERSION,6);assert.equal(GLOBAL_SCHEMA_VERSION,4);
  assert.match(fs.readFileSync(path.join(ROOT,"app/js/version.js"),"utf8"),/"1\.5\.0"/);assert.match(sw,/VERSION = "1\.5\.0"/);
  assert.match(fs.readFileSync(path.join(ROOT,"server/server.js"),"utf8"),/SERVER_VERSION = "1\.5\.0"/);
  assert.equal(JSON.parse(fs.readFileSync(path.join(ROOT,"package.json"),"utf8")).version,"1.5.0");
});

test("Migration 5 nach 6: Stand im Format 1.4.1 bleibt vollständig, Farben, Nummer, Name und Mannschaft wandern in die neue Vorlage",()=>{
  const old=fx("state-v5.json"),before=JSON.stringify(old),s=migrateProfile(old);
  assert.equal(old.meta.schemaVersion,5);assert.equal(JSON.stringify(old),before,"Eingabe bleibt unverändert");
  assert.equal(s.meta.schemaVersion,6);
  for(const k of ["progress","stats","history","settings","zusatz","futureField"])assert.deepEqual(s[k],old[k],k);
  assert.equal(total(s,"points"),total(old,"points"));
  assert.deepEqual({...s.profile,avatar:0},{...old.profile,avatar:0});
  const a=s.profile.avatar,o=old.profile.avatar;
  assert.equal(a.v,4);assert.equal(a.tpl,"emil");assert.equal(a.t,o.t,"Zeitstempel des Aussehens bleibt");
  assert.deepEqual(a.kit,{trikot:o.shirt,streifen:o.c2,hose:o.shorts,stutzen:o.socks},"Trikot, Streifen, Hose und Stutzen aus dem alten Avatar");
  assert.equal(a.number,o.number);assert.equal(a.shirtName,o.shirtName);assert.equal(a.team,o.team);
  for(const k of Object.keys(o))if(!["v","t"].includes(k))assert.deepEqual(a[k],o[k],"altes Feld bleibt: "+k); // Unbekanntes wird erhalten
  // ohne Avatar, zweimal migrieren, ältere Fixtures, neuere Version
  const n=clone(old);n.profile.avatar=null;assert.equal(migrateProfile(n).profile.avatar,null);
  assert.deepEqual(migrateProfile(clone(s)),s);
  for(const f of ["state-v1.json","state-v2.json","state-v3.json","state-v4.json"])assert.equal(migrateProfile(fx(f)).meta.schemaVersion,6,f);
  const neu=newProfile({id:"k-abc12345",name:"X",deviceId:"d"});neu.meta.schemaVersion=7;assert.throws(()=>migrateProfile(neu),UnsupportedSchema);
});

test("Stand aus Emils Konto im Format 1.2.1 geht über alle Stufen, der Avatar bleibt lesbar und trägt die alten Farben",()=>{
  const old=fx("state-v3.json"),s=migrateProfile(old),a=s.profile.avatar,o=old.profile.avatar;
  assert.equal(s.meta.schemaVersion,6);assert.equal(a.t,o.t);assert.equal(a.hair,"zoepfe","alte Frisur als Schlüssel, bleibt im Stand");
  assert.equal(a.kit.trikot,o.shirt);assert.equal(a.number,o.number);assert.equal(a.shirtName,o.shirtName);assert.equal(a.team,o.team);
  const l=lookOf(s.profile);clean(avatarSVG(l,{view:"back",px:190}),"Rücken");clean(avatarSVG(l,{crop:"bust",px:90}),"Brustbild");
});

test("Alte Frisuren-Indizes (Junge und Mädchen, 0 bis 9) werden beim Überführen zu Schlüsseln, nichts geht verloren",()=>{
  const seen={j:[],m:[]};
  for(const body of ["j","m"])for(let i=0;i<10;i++){const h=upgradeOldHair({body,hair:i}).hair;assert.equal(typeof h,"string",body+i);seen[body].push(h);}
  assert.equal(new Set(seen.j).size,10);assert.equal(new Set(seen.m).size,10);
  assert.equal(seen.j[9],"ohne");assert.equal(seen.m[0],"pferdeschwanz");assert.equal(seen.j[8],"fransen");
  assert.deepEqual(upgradeOldHair({hair:"igel"}),{hair:"igel"});assert.deepEqual(upgradeOldHair({hair:99}),{hair:99},"unbekannte Zahl bleibt stehen");
});

test("Globale Migration 3 nach 4: Trainer tragen Farben, Name und Zeitstempel bleiben, die frühere Jacke wird zum Polo",()=>{
  const old=fx("global-v3.json"),before=JSON.stringify(old),g=migrateGlobal(clone(old));
  assert.equal(JSON.stringify(old),before);
  assert.equal(g.schemaVersion,4);assert.equal(g.trainer.name,"Coach Kai");assert.equal(g.trainer.t,old.trainer.t);assert.equal(g.extra,"bleibt");assert.deepEqual(g.pin,old.pin);
  const l=g.trainer.look;
  assert.equal(l.v,4);assert.equal(l.polo,old.trainer.look.jacket);assert.equal(l.hose,defaultTrainer().look.hose);assert.equal(l.stutzen,defaultTrainer().look.stutzen);
  for(const k of Object.keys(old.trainer.look))if(k!=="v")assert.deepEqual(l[k],old.trainer.look[k],"altes Feld bleibt: "+k);
  assert.deepEqual(g.trainer2,defaultTrainer2(),"nie geändert (t 0): aktuelle Vorgabe");
  assert.deepEqual(migrateGlobal(clone(g)),g);assert.deepEqual(newGlobal().trainer,defaultTrainer());
  for(const f of ["global-v2.json"])assert.equal(migrateGlobal(fx(f)).schemaVersion,4);
  assert.throws(()=>migrateGlobal({schemaVersion:5}),UnsupportedSchema);
});

test("Abgleich: das Aussehen mit dem neueren Zeitstempel gewinnt samt Farben, Trainerfarben ebenso, Zurücksetzen behält das Aussehen",()=>{
  const a=migrateProfile(fx("state-v5.json")),b=clone(a);
  applyAvatar(a,dev("A",1790100000000),{...a.profile.avatar,kit:{...a.profile.avatar.kit,trikot:"#d23b3b"},number:"7"});
  applyAvatar(b,dev("B",1790200000000),{...b.profile.avatar,kit:{...b.profile.avatar.kit,hose:"#f4f4f4"},team:"Die Adler"});
  const ab=mergeProfile(a,b),ba=mergeProfile(b,a);
  assert.equal(ab.profile.avatar.kit.hose,"#f4f4f4");assert.equal(ab.profile.avatar.kit.trikot,b.profile.avatar.kit.trikot);assert.equal(ab.profile.avatar.team,"Die Adler");assert.equal(ab.profile.avatar.number,b.profile.avatar.number);
  assert.deepEqual(ab.profile.avatar,ba.profile.avatar);
  // ein Gerät mit altem Format (ohne kit) verliert gegen das neuere, gewinnt es, wird es trotzdem richtig gelesen
  const c=clone(a);c.profile.avatar=clone(fx("state-v5.json").profile.avatar);c.profile.avatar.t=1790900000000;
  assert.deepEqual(lookOf(mergeProfile(a,c).profile).kit,{trikot:"#2f6fde",streifen:"#f4f4f4",hose:"#22252b",stutzen:"#22252b"});
  const g1=migrateGlobal(fx("global-v3.json")),g2=clone(g1);
  applyTrainer(g2,dev("X",1790600000000),{name:"Coach Ina",look:{...g2.trainer.look,polo:"#d23b3b",hose:"#f4f4f4"}},1);
  const m=mergeGlobal(g1,g2);assert.equal(m.trainer.name,"Coach Ina");assert.equal(m.trainer.look.polo,"#d23b3b");assert.equal(m.trainer.look.hose,"#f4f4f4");
  const r=applyReset(clone(a),dev("d",7));assert.deepEqual(r.profile.avatar,a.profile.avatar);
});

test("Aussehen prüfen: Vorgaben, Farben, Vorschläge und Text",()=>{
  assert.equal(KID_TEMPLATES[0].id,"emil");assert.deepEqual(KIT_KEYS,["trikot","streifen","hose","stutzen"]);
  assert.ok(KIT_COLORS.length>=12&&new Set(KIT_COLORS).size===KIT_COLORS.length&&KIT_COLORS.every(c=>/^#[0-9a-f]{6}$/.test(c)&&COLOR_NAMES[c]),"Palette mit Namen");
  assert.ok(POLO_COLORS.every(c=>/^#[0-9a-f]{6}$/.test(c)&&COLOR_NAMES[c]));
  for(const p of KIT_PRESETS){assert.ok(KIT_KEYS.every(k=>KIT_COLORS.includes(p.kit[k])),p.name);assert.ok(p.team.length>0&&p.team.length<=20);}
  assert.ok(KIT_PRESETS.length>=8&&new Set(KIT_PRESETS.map(p=>p.name)).size===KIT_PRESETS.length);
  const l=withPreset(defaultLook("Emil"),2);assert.deepEqual(l.kit,KIT_PRESETS[2].kit);assert.equal(presetIndex(l),2);assert.equal(withKit(l,"hose","#f4f4f4").kit.hose,"#f4f4f4");
  assert.equal(presetIndex(withKit(l,"hose","#7b3fa0")),-1);
  assert.equal(cleanLook({kit:{trikot:"x"}}).kit.trikot,KID_TEMPLATES[0].kit.trikot);
  assert.equal(cleanLook({shirtName:"abcdefghijklmnop"}).shirtName.length,10);assert.equal(cleanLook({number:"123"}).number,"12");assert.equal(cleanLook({tpl:"gibtsnicht"}).tpl,"emil");
  // Vorgabefarben der Vorlage = Farben des Bildes (Emil, blau mit weißen Streifen, schwarze Hose und Stutzen)
  assert.deepEqual(KID_TEMPLATES[0].kit,{trikot:"#26589d",streifen:"#f4f4f4",hose:"#2b2e33",stutzen:"#2b2e33"});
});

// ---------- Bilder ----------
test("Figuren-Bilder: Dateien, Maße, Liste des Service Workers, kein Markenlogo, freigestellt, Größe im Blick",()=>{
  const dir=path.join(ROOT,"app/img"),files=fs.readdirSync(dir).sort();
  assert.deepEqual(files,["fig-emil-back-layer.png","fig-emil-back.png","fig-emil-front-layer.png","fig-emil-front.png","fig-trainer-front-layer.png","fig-trainer-front.png","fig-trainerin-front-layer.png","fig-trainerin-front.png"]);
  for(const f of files){assert.ok(sw.includes(`"img/${f}"`),"nicht im Service Worker: "+f);assert.ok(!/adidas|nike|puma|logo/i.test(f),f);}
  const bytes=files.reduce((n,f)=>n+fs.statSync(path.join(dir,f)).size,0);
  assert.ok(bytes<1.6*1024*1024,"Bilder insgesamt "+Math.round(bytes/1024)+" KB");
  assert.deepEqual(FIG_IDS.sort(),["emil-back","emil-front","trainer-front","trainerin-front"]);
  for(const id of FIG_IDS){
    const info=FIGDATA.figures[id],b=png(`fig-${id}.png`),l=png(`fig-${id}-layer.png`);
    assert.deepEqual([b.w,b.h],[info.w,info.h],id);assert.deepEqual([l.w,l.h],[info.w,info.h],id);
    // freigestellt: Rand ist durchsichtig, großer Teil des Bildes ist Hintergrund
    let edge=0,empty=0;
    for(let y=0;y<b.h;y++)for(let x=0;x<b.w;x++){const a=b.data[(y*b.w+x)*4+3],al=l.data[(y*b.w+x)*4+3];if(!a&&!al)empty++;if((x===0||y===0||x===b.w-1||y===b.h-1)&&(a||al))edge++;}
    assert.equal(edge,0,id+": Rand ist durchsichtig");assert.ok(empty/(b.w*b.h)>.3,id+": Hintergrund ist weg");
    // Ebene: Bereichsnummern nur aus der Liste, Deckung vorhanden, nur volle oder leere Punkte
    for(let i=0;i<l.w*l.h;i++){const o=i*4;if(!l.data[o+3])continue;assert.equal(l.data[o+3],255);assert.ok(l.data[o+1]>=1&&l.data[o+1]<=info.regions.length);assert.ok(l.data[o+2]>0);}
  }
  for(const [id,tpl] of [["emil-front","front"],["emil-back","back"]])assert.ok(KID_TEMPLATES[0][tpl]===id);
  assert.deepEqual(FIGDATA.figures["emil-front"].regions,KID_TEMPLATES[0].regions);
  assert.ok(fs.existsSync(path.join(ROOT,"assets-src/emil-avatar.jpg"))&&fs.existsSync(path.join(ROOT,"assets-src/trainer-team.jpg")),"Originale als Quelle im Repo");
});

test("Markenlogo auf der Brust ist übermalt: an der Stelle liegt Trikotfläche, kein helles Logo im Grundbild",()=>{
  const info=FIGDATA.figures["emil-front"],b=png("fig-emil-front.png"),l=png("fig-emil-front-layer.png"),tr=info.regions.indexOf("trikot")+1,C=info.chest;
  let light=0,covered=0,n=0;
  for(let y=Math.round(C.y-42);y<Math.round(C.y+6);y++)for(let x=Math.round(C.cx-36);x<Math.round(C.cx+36);x++){
    const o=(y*b.w+x)*4,lum=.299*b.data[o]+.587*b.data[o+1]+.114*b.data[o+2];
    n++;if(b.data[o+3]>60&&lum>170)light++;
    if(l.data[o+3]===255&&l.data[o+1]===tr&&l.data[o+2]>=250&&Math.abs(l.data[o]-128)<=1)covered++;
  }
  assert.equal(light,0,"kein weißes Logo im Grundbild");assert.ok(covered/n>.6,"Trikotfläche in Trikotfarbe: "+covered+" von "+n);
});

// ---------- Umfärben ----------
test("Umfärben: jede Palettenfarbe gibt für jeden Bereich jeder Figur ein eigenes Bild, Schattierung bleibt, Deckung bleibt",()=>{
  for(const id of FIG_IDS){
    const info=FIGDATA.figures[id],l=png(`fig-${id}-layer.png`),hashes=new Set();
    const palette=id.startsWith("emil")?KIT_COLORS:POLO_COLORS;
    let opaque=0;for(let i=0;i<l.w*l.h;i++)if(l.data[i*4+3]===255)opaque++;
    assert.ok(opaque>5000,id+": Bereiche vorhanden");
    for(const c of palette){
      const out=tintLayer(l.data,l.w,l.h,info.regions.map(()=>c)),[r,g,bb]=hexToRgb(c);
      let n=0,sr=0,sg=0,sb=0,var128=0;
      for(let i=0;i<l.w*l.h;i++){
        const o=i*4;
        if(l.data[o+3]!==255){assert.equal(out[o+3],0);continue;}
        assert.equal(out[o+3],l.data[o+2],"Deckung bleibt");n++;
        sr+=out[o];sg+=out[o+1];sb+=out[o+2];if(out[o]!==r||out[o+1]!==g||out[o+2]!==bb)var128++;
      }
      assert.ok(n===opaque);assert.ok(var128>n*.1,id+" "+c+": Falten und Schatten bleiben sichtbar");
      // im Mittel bleibt die Farbe nah an der gewählten
      const tol=Math.max(30,.22*Math.max(r,g,bb));
      assert.ok(Math.abs(sr/n-r)<tol&&Math.abs(sg/n-g)<tol&&Math.abs(sb/n-bb)<tol,`${id} ${c}: Mittel ${Math.round(sr/n)},${Math.round(sg/n)},${Math.round(sb/n)}`);
      hashes.add(Buffer.from(out).toString("base64").length+":"+out.reduce((a,v,i)=>(a*31+v+i)>>>0,7));
    }
    assert.equal(hashes.size,palette.length,id+": jede Farbe ergibt ein eigenes Bild");
  }
  // einzelne Bereiche getrennt färbbar
  const info=FIGDATA.figures["emil-front"],l=png("fig-emil-front-layer.png");
  const a=tintLayer(l.data,l.w,l.h,["#d23b3b","#f4f4f4","#2b2e33","#2b2e33"]),b=tintLayer(l.data,l.w,l.h,["#d23b3b","#f4f4f4","#2b2e33","#f5c431"]);
  let diff=0,diffRegion=new Set();for(let i=0;i<l.w*l.h;i++)if(a[i*4]!==b[i*4]||a[i*4+1]!==b[i*4+1]||a[i*4+2]!==b[i*4+2]){diff++;diffRegion.add(l.data[i*4+1]);}
  assert.ok(diff>1000);assert.deepEqual([...diffRegion],[info.regions.indexOf("stutzen")+1],"nur die Stutzen haben sich geändert");
  assert.equal(shadeChannel(200,128),200);assert.ok(shadeChannel(200,64)<200&&shadeChannel(200,200)>200&&shadeChannel(255,255)<=255);
});

// Ersatz für Bilder und Zeichenfläche: echte Pixel aus den PNG, einfaches Übereinanderlegen
function fakeEnv(log){
  const over=(dst,src)=>{for(let i=0;i<dst.length;i+=4){const sa=src[i+3]/255;if(!sa)continue;const da=dst[i+3]/255,oa=sa+da*(1-sa);for(let k=0;k<3;k++)dst[i+k]=(src[i+k]*sa+dst[i+k]*da*(1-sa))/oa;dst[i+3]=oa*255;}};
  return{
    base:"app/img/",
    canvas:(w,h)=>{const px=new Uint8ClampedArray(w*h*4);return{width:w,height:h,px,
      getContext:()=>({drawImage:img=>{log.draws++;over(px,img.data);},getImageData:()=>({data:px.slice()}),createImageData:(w2,h2)=>({data:new Uint8ClampedArray(w2*h2*4)}),putImageData:d=>{px.set(d.data);}}),
      toDataURL:()=>{log.last=px.slice();return"data:image/png;base64,"+Buffer.from(String(px.reduce((a,v,i)=>(a*33+v+i)>>>0,5))).toString("base64");}};},
    image:async url=>{log.loads++;return readPNG(path.join(ROOT,url));},
    blobURL:bytes=>{log.blobs++;return"blob:test/"+log.blobs;},
    revoke:u=>log.revoked.push(u)
  };
}
test("Bilder laden, färben und zwischenspeichern: gleiche Farben gleiche Adresse, neue Farben neue, alte werden freigegeben",async()=>{
  const log={draws:0,loads:0,blobs:0,revoked:[]};
  setFigureEnv(fakeEnv(log));
  const cols={trikot:"#d23b3b",streifen:"#f4f4f4",hose:"#2b2e33",stutzen:"#2b2e33"};
  assert.equal(figureURL("emil-front",cols),basePath("emil-front"),"vor dem Laden nur das Grundbild");
  assert.equal(await loadFigures(),true);assert.equal(log.loads,FIG_IDS.length*2);
  await loadFigures();assert.equal(log.loads,FIG_IDS.length*2,"nichts wird doppelt geladen");
  const u1=figureURL("emil-front",cols);assert.match(u1,/^blob:/);assert.equal(figureURL("emil-front",cols),u1);assert.equal(log.blobs,1);
  // das gelegte Bild: Trikotmitte hat die gewählte Farbe, Haut bleibt Haut
  const px=log.last,info=FIGDATA.figures["emil-front"],o=(Math.round(info.h*.42)*info.w+Math.round(info.w*.5))*4;
  assert.ok(Math.abs(px[o]-210)<60&&px[o+1]<90&&px[o+2]<90&&px[o+3]===255,"Mitte des Trikots ist rot: "+[...px.slice(o,o+4)]);
  const u2=figureURL("emil-front",{...cols,hose:"#f4f4f4"});assert.notEqual(u2,u1);assert.equal(log.blobs,2);
  for(let i=0;i<100;i++)figureURL("emil-front",{...cols,trikot:"#"+(0x100000+i*997).toString(16).padStart(6,"0")});
  assert.ok(storeSize()<=80,"Zwischenspeicher ist begrenzt");assert.ok(log.revoked.length>=20,"alte Adressen werden freigegeben");
  for(const id of FIG_IDS)assert.match(figureURL(id,{}),/^blob:/,id);
  setFigureEnv(null);
});

// ---------- Name und Nummer ----------
test("Rückenfeld: Name gebogen über der Nummer, beides im Feld, lange Namen und zweistellige Nummern werden kleiner, nie über die Hose",()=>{
  const f=FIGDATA.figures["emil-back"].field,W=f.x1-f.x0;
  const lay=(name,num)=>backLayout({shirtName:name,number:num},f);
  const inField=B=>{
    for(const L of B.name.letters){assert.ok(L.x>=f.x0&&L.x<=f.x1&&L.y>=f.y0&&L.y<=f.y1,"Buchstabe im Feld "+L.ch+" "+L.x+","+L.y);}
    if(B.name.letters.length){const first=B.name.letters[0],last=B.name.letters.at(-1);assert.ok(first.x-B.name.size*.3>=f.x0&&last.x+B.name.size*.3<=f.x1,"Name nicht breiter als das Feld");}
    assert.ok(B.num.y<=f.y1&&B.num.top>=f.y0&&B.num.x-B.num.width/2>=f.x0-1&&B.num.x+B.num.width/2<=f.x1+1,"Nummer im Feld "+JSON.stringify(B.num));
    if(B.name.text)assert.ok(B.num.top>=B.name.bottom,"Nummer beginnt unter dem Namen");
  };
  const cases=[["EMIL","10"],["WOLFGANGXY","88"],["A","7"],["","5"],["WOLFGANG","100"],["MARIE LUISE","99"],["IIIIIIIIII","1"],["WWWWWWWWWW","99"]];
  for(const[n,x]of cases)inField(lay(n,x));
  assert.ok(lay("WOLFGANGXY","88").name.size<lay("EMIL","88").name.size,"lange Namen werden kleiner");
  assert.ok(lay("EMIL","88").num.size<lay("EMIL","8").num.size,"zweistellige Nummern werden kleiner");
  assert.ok(lay("","8").num.size>=lay("EMIL","8").num.size,"ohne Namen darf die Nummer groß sein");
  // der Name ist gebogen: die äußeren Buchstaben stehen tiefer als der mittlere und sind gedreht
  const B=lay("TORJÄGER","9"),mid=B.name.letters[3];assert.ok(B.name.letters[0].y>mid.y&&B.name.letters.at(-1).y>mid.y);assert.ok(B.name.letters[0].rot<0&&B.name.letters.at(-1).rot>0);
  // das Feld liegt ganz auf dem Trikot (Rückenfläche), nicht auf der Hose
  const info=FIGDATA.figures["emil-back"],l=png("fig-emil-back-layer.png"),tr=info.regions.indexOf("trikot")+1,ho=info.regions.indexOf("hose")+1;
  let onShirt=0,onShorts=0,n=0;
  for(let y=f.y0;y<f.y1;y++)for(let x=f.x0;x<f.x1;x++){const o=(y*l.w+x)*4;n++;if(l.data[o+3]===255&&l.data[o+1]===tr)onShirt++;if(l.data[o+3]===255&&l.data[o+1]===ho)onShorts++;}
  assert.equal(onShorts,0,"keine Hose im Rückenfeld");assert.ok(onShirt/n>.95,"Rückenfeld liegt auf dem Trikot: "+Math.round(onShirt/n*100)+" Prozent");
});

test("Schriftfarbe auf dem Trikot: hell oder dunkel, immer guter Kontrast (für jede Trikotfarbe der Palette)",()=>{
  for(const c of [...KIT_COLORS,...POLO_COLORS]){const t=textOn(c);assert.ok(["#ffffff","#0b0d10"].includes(t));assert.ok(contrast(c,t)>=4.3,c+" "+contrast(c,t).toFixed(2));}
  assert.equal(textOn("#f4f4f4"),"#0b0d10");assert.equal(textOn("#2b2e33"),"#ffffff");assert.equal(textOn("#f5c431"),"#0b0d10");assert.equal(textOn("#26589d"),"#ffffff");
  const svg=avatarSVG({kit:{trikot:"#f5c431"},shirtName:"EMIL",number:"10"},{view:"back"});assert.ok(svg.includes('fill="#0b0d10"')&&!svg.includes('fill="#ffffff"'));
  assert.ok(avatarSVG({kit:{trikot:"#2b2e33"},shirtName:"EMIL",number:"10"},{view:"back"}).includes('fill="#ffffff"'));
});

// ---------- Zeichnung ----------
test("Spieler: Ganzfigur vorn und hinten, Brustbild aus dem Vorderbild, Name und Nummer hinten, kleine Nummer vorn",()=>{
  const look=cleanLook({kit:KIT_PRESETS[1].kit,shirtName:"Emil",number:"7",team:"Rote Blitze"});
  const front=avatarSVG(look,{px:200}),back=avatarSVG(look,{px:200,view:"back"}),bust=avatarSVG(look,{crop:"bust",px:90});
  for(const [s,w] of [[front,"vorn"],[back,"hinten"],[bust,"Brustbild"]]){clean(s,w);assert.ok(s.includes("<image href="),w);}
  assert.ok(back.includes('data-part="rueckenfeld"')&&back.includes('data-k="num"')&&back.includes(">7</text>")&&[..."EMIL"].every(ch=>back.includes(`>${ch}</text>`)));
  assert.ok(!front.includes("rueckenfeld")&&front.includes('data-k="chest"'),"vorn nur die kleine Brustnummer");
  assert.ok(bust.includes("clipPath")&&bust.includes("<circle")&&!bust.includes("data-k="),"Brustbild: rund, ohne Beschriftung");
  const bi=FIGDATA.figures["emil-front"].bust;assert.ok(bust.includes(`viewBox="${bi[0]} ${bi[1]} ${bi[2]-bi[0]} ${bi[3]-bi[1]}"`),"Fenster aus dem Vorderbild");
  assert.ok(!back.includes("Rote Blitze")&&!front.includes("Rote Blitze"),"der Verein steht nicht auf dem Trikot");
  assert.ok(figureParts(look,"back").id==="emil-back"&&figureParts(look,"front").id==="emil-front");
  // Brustbild ist ein Ausschnitt der Vorderansicht: gleiche Bildquelle
  assert.equal(front.match(/href="([^"]*)"/)[1],bust.match(/href="([^"]*)"/)[1]);
  // alle Farben der Palette zeichnen sauber
  for(const c of KIT_COLORS)for(const k of KIT_KEYS)for(const v of ["front","back"])clean(avatarSVG(withKit(look,k,c),{view:v,px:100}),k+c+v);
  for(const w of [1,2])for(const c of POLO_COLORS)clean(trainerSVG({polo:c,hose:c,stutzen:c},{px:50,which:w}),"Trainer"+w+c);
});

test("Torszene: Rückansicht des Kindes mit Name und Nummer, kleiner Satz nach vorn, reduzierte Bewegung schaltet ihn ab",()=>{
  const css=fs.readFileSync(path.join(ROOT,"app/css/style.css"),"utf8");
  const look=cleanLook({shirtName:"EMIL",number:"10"});
  for(const kind of ["goal","post","bar","wide"]){
    const s=sceneSVG(look,{kind,side:1});clean(s,kind);
    assert.ok(s.includes('class="pl"')&&s.includes("<image href=")&&s.includes('data-part="rueckenfeld"')&&s.includes(">10</text>"),kind);
  }
  assert.ok(/\.scene \.pl\{animation:kick[^}]*\}/.test(css)&&/@keyframes kick\{[^]*?scale\(1\.07\)/.test(css),"kleiner Satz mit Vergrößerung nach vorn");
  assert.ok(/prefers-reduced-motion:reduce\)\{[^]*\.scene \.pl/.test(css));
});

// ---------- Oberfläche ----------
test("Mein Spieler: eine Seite mit Vorschau vorn und hinten, Vereinsfarben, Farben je Bereich, Nummer, Name und Mannschaft",()=>{
  const look=defaultLook("Emil");
  let h=avatarBuilderHTML({look,name:"Emil",first:true,view:"front"});clean(noInput(h),"Mein Spieler");
  assert.ok(h.includes("Dein Spieler")&&h.includes('id="avSkip"')&&h.includes('id="avSave"')&&h.includes('data-avview="front"')&&h.includes('data-avview="back"'));
  assert.ok(h.includes("Vereinsfarben")&&(h.match(/data-avpreset=/g)||[]).length===KIT_PRESETS.length);
  for(const k of KIT_KEYS)assert.equal((h.match(new RegExp(`data-av="${k}:#`,"g"))||[]).length,KIT_COLORS.length,k);
  assert.ok(h.includes('data-avnum="-1"')&&h.includes('data-avnum="1"')&&h.includes('id="avShirtName"')&&h.includes('id="avTeam"')&&h.includes(look.team));
  assert.ok(!/Frisur|Kopfform|Augen|Bart|data-avstep|avNext|avDice/.test(h),"der alte Baukasten ist weg");
  assert.ok(!h.includes("data-avtpl"),"bei einer Vorlage keine Auswahl");
  h=avatarBuilderHTML({look,name:"Emil",first:false,view:"back"});assert.ok(h.includes("Mein Spieler")&&h.includes('id="avCancel"')&&h.includes('data-k="num"'));
  // gewählte Farbe ist markiert
  assert.ok(h.includes(`data-av="trikot:${look.kit.trikot}"`)&&new RegExp(`class="sw on" data-av="trikot:${look.kit.trikot}"`).test(h));
  // böse Eingaben
  clean(noInput(avatarBuilderHTML({look:{...look,shirtName:'"><script>',team:"<b>x</b>"},view:"front"})),"böse");
});

test("Trainerteam im Eltern-Bereich: Name und Farben von Polo, Hose und Stutzen",()=>{
  for(const w of [1,2]){
    const T=w===2?defaultTrainer2():defaultTrainer(),h=trainerPanelHTML(T,w);clean(noInput(h),"Trainer"+w);
    assert.ok(h.includes(`id="trName${w}"`)&&h.includes(`data-atrsave="${w}"`)&&h.includes(`data-atrdefault="${w}"`));
    assert.equal((h.match(new RegExp(`data-atr="${w}:polo:#`,"g"))||[]).length,POLO_COLORS.length);
    for(const k of ["hose","stutzen"])assert.equal((h.match(new RegExp(`data-atr="${w}:${k}:#`,"g"))||[]).length,KIT_COLORS.length);
    assert.ok(!/Bart|Brille|Frisur|Klemmbrett|data-atrstep|data-atrdice/.test(h));
  }
  assert.equal(cleanTrainer({name:"Trainerin X"},2).name,"Trainerin X");assert.equal(cleanTrainer({},2).name,"Trainerin");assert.equal(cleanTrainer({},1).name,"Trainer");
});

test("Name der Mannschaft steht auf Kachel „Wer spielt?“, in der Kabine und auf der Anzeigetafel, der Name des Kindes bleibt in der Begrüßung",()=>{
  const env={hasPin:true,persistent:true,syncText:"",updateReady:false,version:"1.5.0"},UI={newAcct:false,acctMsg:"",adminAsk:false,parent:false,pinMsg:""};
  const s=newProfile({id:"k-abc12345",name:"Emil",deviceId:"d1"});applyAvatar(s,dev("d1",5),{...defaultLook("Emil"),team:"Die Wirbel"});
  assert.ok(accountsHTML([{id:"k-a",name:"Emil",avatar:s.profile.avatar}],UI,env).includes("Die Wirbel"));
  const home=homeHTML(s,UI,env);assert.ok(home.includes("Die Wirbel")&&home.includes("Hallo Emil!"));
  const G={li:0,mode:"math",trial:false,pool:["m_read"],len:8,i:0,res:[true],hist:[],pts:0,streak:0,rival:"FC Test",task:{topic:"m_read",type:"num",q:"1+1",a:2,ex:"",hint:""},input:"",inp:["",""],act:0,done:false,helpLevel:0,pickIdx:-1,given:null};
  assert.ok(playHTML(s,G).includes("Die Wirbel"));
  assert.ok(resultHTML(s,{...G,res:[true,true,false],len:3,pts:10,newSticker:null,bonus:0},{celebrate:""}).includes("Die Wirbel<small>Heim</small>"));
});

// ---------- Dateien ----------
test("Neue Dateien stehen im Service Worker, der Baukasten-Code ist entfernt, README beschreibt die Aufbereitung",()=>{
  for(const f of ["figures.js","figdata.js"])assert.ok(sw.includes(`"js/${f}"`),f);
  const draw=fs.readFileSync(path.join(ROOT,"app/js/avatardraw.js"),"utf8");assert.ok(!/hairFront|hairBack|headG|beardSvg|hatParts/.test(draw));
  const readme=fs.readFileSync(path.join(ROOT,"README.md"),"utf8");
  for(const w of ["Figuren-Vorlagen","prepare-figures","figures.config","assets-src","jpg2png"])assert.ok(readme.includes(w),w);
  for(const f of ["tools/prepare-figures.mjs","tools/figures.config.mjs","tools/fig-lib.mjs","tools/png.mjs","tools/jpg2png.ps1"])assert.ok(fs.existsSync(path.join(ROOT,f)),f);
  const dockerignore=fs.readFileSync(path.join(ROOT,"Dockerfile"),"utf8");assert.ok(!dockerignore.includes("assets-src"),"Quellbilder gehören nicht ins Image");
});
