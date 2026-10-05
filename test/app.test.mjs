// Prüft die Auslieferung: Service-Worker-Liste, Versionen, keine externen Ressourcen, Aufgaben-Generatoren, deploy.sh.
import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {LIGEN,TOPICS,topicsOf} from "../app/js/content.js";
import {GEN} from "../app/js/generators.js";
import {newProfile} from "../app/js/model.js";
import {nextTopic} from "../app/js/rules.js";
import {APP_VERSION} from "../app/js/version.js";

const APP=fileURLToPath(new URL("../app/",import.meta.url));
const ROOT=path.resolve(APP,"..");
const walk=(d,base=d)=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name),base):[path.relative(base,path.join(d,e.name)).split(path.sep).join("/")]);
const sw=fs.readFileSync(path.join(APP,"sw.js"),"utf8");

test("Service Worker cached jede App-Datei (offline nichts vergessen)",()=>{
  const listed=[...sw.matchAll(/"([\w./-]+\.(?:html|js|css|png|jpg|woff2|webmanifest))"/g)].map(m=>m[1]);
  const actual=walk(APP).filter(f=>f!=="sw.js"&&f!=="js/package.json"&&f!=="fonts/OFL.txt");
  assert.deepEqual([...new Set(listed)].sort(),actual.sort());
});

test("Versionen in sw.js und version.js stimmen überein",()=>{
  assert.equal(/const VERSION = "([^"]+)"/.exec(sw)[1],APP_VERSION);
});

test("Service Worker berührt weder IndexedDB noch löscht er fremde Daten",()=>{
  const code=sw.split("\n").filter(l=>!l.trim().startsWith("//")).join("\n");
  assert.ok(!/indexedDB|localStorage|deleteDatabase/i.test(code));
  assert.ok(/startsWith\("torjaeger-app-"\)/.test(sw));
  assert.ok(/pathname\.startsWith\("\/api\/"\)/.test(sw)); // /api geht nie über den Cache
});

test("Keine externen Ressourcen in app/ (http(s):// nur in Kommentaren und Lizenztext)",()=>{
  const bad=[];
  for(const f of walk(APP)){
    if(/\.(png|woff2)$/.test(f)||f==="fonts/OFL.txt")continue;
    const lines=fs.readFileSync(path.join(APP,f),"utf8").split("\n");
    lines.forEach((l,i)=>{if(/https?:\/\//.test(l)&&!/^\s*(\/\/|\/\*|\*)/.test(l)&&!/xmlns=/.test(l))bad.push(f+":"+(i+1)+": "+l.trim().slice(0,80));});
  }
  assert.deepEqual(bad,[]);
  const html=fs.readFileSync(path.join(APP,"index.html"),"utf8");
  assert.ok(!/fonts\.googleapis|fonts\.gstatic|cdn\./i.test(html));
});

test("Schriften und Icons sind vorhanden und echt",()=>{
  for(const f of ["andika-400.woff2","andika-700.woff2","lilita-one-400.woff2"])assert.equal(fs.readFileSync(path.join(APP,"fonts",f)).subarray(0,4).toString(),"wOF2",f);
  assert.ok(fs.existsSync(path.join(APP,"fonts","OFL.txt")));
  for(const [f,w] of [["icon-192.png",192],["icon-512.png",512],["icon-maskable-512.png",512],["apple-touch-icon.png",180]]){
    const b=fs.readFileSync(path.join(APP,"icons",f));
    assert.equal(b.readUInt32BE(16),w,f);assert.equal(b.readUInt32BE(20),w,f);
  }
  const man=JSON.parse(fs.readFileSync(path.join(APP,"manifest.webmanifest"),"utf8"));
  assert.equal(man.display,"standalone");
  for(const i of man.icons)assert.ok(fs.existsSync(path.join(APP,i.src)),i.src);
});

test("Alle Themen haben einen Generator; Aufgaben sind in sich stimmig",()=>{
  for(const t of LIGEN.flatMap((_,i)=>topicsOf(i))){
    assert.ok(GEN[t],"Generator fehlt: "+t);assert.ok(TOPICS[t],"Themenname fehlt: "+t);
    for(let n=0;n<300;n++){
      const T=GEN[t]();
      assert.ok(T.q&&T.ex,t);
      if(T.type==="num")assert.ok(Number.isInteger(T.a)&&T.a>=0,t+" "+T.q+" a="+T.a);
      else if(T.type==="pair")assert.ok(T.a.length===2&&T.a[1]<parseInt(/: (\d+)/.exec(T.q.replace(/<[^>]+>/g,""))?.[1]||99),t+" "+T.q);
      else if(T.type==="choice"){assert.ok(T.choices.includes(T.a),t+" "+T.q);assert.equal(new Set(T.choices).size,T.choices.length,t+" doppelte Auswahl: "+T.choices);}
      else if(T.type==="tap")assert.ok(Number.isInteger(T.a)&&T.a>=0&&T.a<T.words.length,t);
      else assert.fail("unbekannter Typ "+T.type);
    }
  }
});

test("nextTopic wählt nur Themen aus dem Pool",()=>{
  const s=newProfile({id:"k-abc12345",name:"X",deviceId:"d"});
  const pool=LIGEN[0].math;
  for(let i=0;i<200;i++)assert.ok(pool.includes(nextTopic(s,pool,pool[0])));
});

test("deploy.sh legt vor dem Pull eine Sicherung pre-deploy-JJJJMMTT-HHMM an",t=>{
  if(spawnSync("sh",["-c","exit 0"]).status!==0)return t.skip("sh nicht verfügbar");
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"torjaeger-deploy-"));
  try{
    fs.copyFileSync(path.join(ROOT,"deploy.sh"),path.join(dir,"deploy.sh"));
    fs.mkdirSync(path.join(dir,"data","profiles"),{recursive:true});
    fs.writeFileSync(path.join(dir,"data","profiles","k-emil0001.json"),'{"rev":7}');
    fs.writeFileSync(path.join(dir,"data","settings.json"),'{"rev":2}');
    // alte Sicherungen: die 20 neuesten bleiben
    for(let i=1;i<=22;i++)fs.mkdirSync(path.join(dir,"data","backups","pre-deploy-2020010"+String(i).padStart(2,"0")+"-0000"),{recursive:true});
    const r=spawnSync("sh",["deploy.sh","--backup-only"],{cwd:dir,encoding:"utf8"});
    assert.equal(r.status,0,r.stderr);
    const made=fs.readdirSync(path.join(dir,"data","backups")).filter(f=>/^pre-deploy-\d{8}-\d{4}$/.test(f)&&!f.startsWith("pre-deploy-2020"));
    assert.equal(made.length,1);
    const b=path.join(dir,"data","backups",made[0]);
    assert.equal(fs.readFileSync(path.join(b,"profiles","k-emil0001.json"),"utf8"),'{"rev":7}');
    assert.equal(fs.readFileSync(path.join(b,"settings.json"),"utf8"),'{"rev":2}');
    assert.equal(fs.readFileSync(path.join(dir,"data","profiles","k-emil0001.json"),"utf8"),'{"rev":7}'); // Original unberührt
    assert.equal(fs.readdirSync(path.join(dir,"data","backups")).filter(f=>f.startsWith("pre-deploy-")).length,20);
    // Reihenfolge im Skript: Sicherung steht vor git pull
    const script=fs.readFileSync(path.join(ROOT,"deploy.sh"),"utf8").split("\n").filter(l=>!l.trim().startsWith("#")).join("\n");
    assert.ok(script.indexOf("pre-deploy-")>=0&&script.indexOf("pre-deploy-")<script.indexOf("git pull"));
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test("Keine Gedankenstriche in Texten der App (Regel: kurze Sätze, keine Gedankenstriche)",()=>{
  const bad=[];
  for(const f of walk(APP)){
    if(!/\.(js|html|webmanifest)$/.test(f))continue;
    fs.readFileSync(path.join(APP,f),"utf8").split("\n").forEach((l,i)=>{if(/[—–]/.test(l))bad.push(f+":"+(i+1)+": "+l.trim().slice(0,80));});
  }
  assert.deepEqual(bad,[]);
});
