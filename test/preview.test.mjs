// Vorschau-Betrieb: Kennung vom Server, Band in der App, Compose/.env, Branch-Prüfung in deploy.sh.
import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import server from "../server/server.js";
import {api} from "./helpers.mjs";
import {bandHTML} from "../app/js/views.js";
import {createSync} from "../app/js/sync.js";
import {memoryStore} from "../app/js/store.js";
import {APP_VERSION} from "../app/js/version.js";

const ROOT=path.resolve(fileURLToPath(new URL("../",import.meta.url)));
const gitOk=spawnSync("git",["--version"]).status===0;
const shOk=spawnSync("sh",["-c","exit 0"]).status===0;

async function withServer(opts,fn){
  const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),"torjaeger-prev-"));
  const srv=server.createServer({dataDir,...opts});
  await new Promise(r=>srv.listen(0,"127.0.0.1",r));
  try{await fn("http://127.0.0.1:"+srv.address().port);}
  finally{await new Promise(r=>{srv.close(r);srv.closeAllConnections&&srv.closeAllConnections();});fs.rmSync(dataDir,{recursive:true,force:true});}
}

test("Server meldet die Vorschau-Kennung in /api/health und /api/config",async()=>{
  await withServer({previewLabel:"VORSCHAU"},async base=>{
    const h=(await api(base,"GET","/api/health")).json;
    assert.equal(h.ok,true);assert.equal(h.preview,"VORSCHAU");assert.equal(h.serverVersion,APP_VERSION);
    assert.equal((await api(base,"GET","/api/config")).json.preview,"VORSCHAU");
  });
  await withServer({previewLabel:""},async base=>{
    assert.equal((await api(base,"GET","/api/config")).json.preview,"");
  });
});

test("Zwei Instanzen parallel: eigene Daten, eigene Kennung",async()=>{
  await withServer({previewLabel:""},async live=>{
    await withServer({previewLabel:"VORSCHAU"},async prev=>{
      await api(live,"POST","/api/profiles",{id:"k-live0001",name:"Nur Live"});
      assert.equal((await api(live,"GET","/api/profiles")).json.profiles.length,1);
      assert.equal((await api(prev,"GET","/api/profiles")).json.profiles.length,0);
      assert.notEqual((await api(live,"GET","/api/config")).json.preview,(await api(prev,"GET","/api/config")).json.preview);
    });
  });
});

test("App holt die Kennung über sync.getConfig, offline ohne Fehler",async()=>{
  await withServer({previewLabel:"VORSCHAU"},async base=>{
    const sync=createSync({store:memoryStore(),deviceId:"g-test",base});
    const r=await sync.getConfig();assert.equal(r.ok,true);assert.equal(r.config.preview,"VORSCHAU");
    const off=createSync({store:memoryStore(),deviceId:"g-test",base,fetchFn:()=>Promise.reject(new TypeError("offline"))});
    assert.deepEqual(await off.getConfig(),{ok:false,reason:"offline"});
  });
});

test("Band erscheint nur mit Kennung und entschärft den Text",()=>{
  assert.equal(bandHTML(""),"");assert.equal(bandHTML(undefined),"");
  assert.match(bandHTML("VORSCHAU"),/class="preview-band"[^>]*>VORSCHAU</);
  assert.ok(!bandHTML("<b>x</b>").includes("<b>"));
});

test("Compose und .env-Vorlagen: Name, Port und Kennung je Klon, .env nicht im Repo",()=>{
  const dc=fs.readFileSync(path.join(ROOT,"docker-compose.yml"),"utf8");
  assert.match(dc,/container_name: \$\{CONTAINER_NAME:-torjaeger-liga\}/);
  assert.match(dc,/127\.0\.0\.1:\$\{HOST_PORT:-8080\}:8080/);
  assert.match(dc,/PREVIEW_LABEL=\$\{PREVIEW_LABEL:-\}/);
  assert.match(fs.readFileSync(path.join(ROOT,".env.example"),"utf8"),/HOST_PORT=8080/);
  const prev=fs.readFileSync(path.join(ROOT,".env.preview.example"),"utf8");
  assert.match(prev,/HOST_PORT=8081/);assert.match(prev,/PREVIEW_LABEL=VORSCHAU/);assert.match(prev,/CONTAINER_NAME=torjaeger-liga-preview/);
  assert.ok(fs.readFileSync(path.join(ROOT,".gitignore"),"utf8").split("\n").includes(".env"));
});

// deploy.sh in einem eigenen Git-Ordner mit gewähltem Branch und optionaler .env ausführen
function deployIn(branch,env,args){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"torjaeger-branch-"));
  try{
    fs.copyFileSync(path.join(ROOT,"deploy.sh"),path.join(dir,"deploy.sh"));
    spawnSync("git",["init","-q","-b",branch],{cwd:dir});
    if(env!==null)fs.writeFileSync(path.join(dir,".env"),env);
    fs.mkdirSync(path.join(dir,"data","profiles"),{recursive:true});
    const r=spawnSync("sh",["deploy.sh",...args],{cwd:dir,encoding:"utf8"});
    const backups=fs.existsSync(path.join(dir,"data","backups"))?fs.readdirSync(path.join(dir,"data","backups")):[];
    return{...r,backups};
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
}
test("deploy.sh: Live nur auf main, Vorschau nur auf preview (Abbruch ohne Änderung)",t=>{
  if(!gitOk||!shOk)return t.skip("git oder sh fehlt");
  const PREV="CONTAINER_NAME=x\nHOST_PORT=8081\nPREVIEW_LABEL=VORSCHAU\n";
  // Live ohne .env: main passt
  assert.equal(deployIn("main",null,["--check"]).status,0);
  // Live auf preview: Abbruch, keine Sicherung angelegt
  let r=deployIn("preview",null,["--check"]);
  assert.notEqual(r.status,0);assert.match(r.stderr,/ABBRUCH.*main.*preview/s);
  r=deployIn("preview",null,[]);
  assert.notEqual(r.status,0);assert.deepEqual(r.backups,[]);
  // Vorschau: preview passt, main bricht ab
  assert.equal(deployIn("preview",PREV,["--check"]).status,0);
  r=deployIn("main",PREV,[]);
  assert.notEqual(r.status,0);assert.match(r.stderr,/ABBRUCH.*preview.*main/s);assert.deepEqual(r.backups,[]);
  // anderer Branch nie
  assert.notEqual(deployIn("feature",null,["--check"]).status,0);
  assert.notEqual(deployIn("feature",PREV,["--check"]).status,0);
  // nur sichern geht immer
  assert.equal(deployIn("feature",PREV,["--backup-only"]).status,0);
});
