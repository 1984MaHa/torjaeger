// Version 1.7.0 (C0): Überblicks-Grafik hinter dem Fragezeichen auf „Wer spielt?“
import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {fileURLToPath} from "node:url";
import {accountsHTML,infoHTML,INFO_IMG,INFO_ALT} from "../app/js/views.js";

const ROOT=fileURLToPath(new URL("..",import.meta.url));
const env={hasPin:true,persistent:true,syncText:"",updateReady:false,version:"1.7.0"};
const accts=[{id:"k-emil0001",name:"Emil",avatar:null}];
const base=()=>({newAcct:false,acctMsg:"",adminAsk:false});

test("Die Grafik liegt in der App, in FILES des Service Workers und ist klein genug",()=>{
  const f=ROOT+"app/"+INFO_IMG;assert.ok(fs.existsSync(f));
  assert.ok(fs.statSync(f).size<400*1024);
  assert.ok(fs.readFileSync(ROOT+"app/sw.js","utf8").includes('"'+INFO_IMG+'"'));
  assert.ok(fs.existsSync(ROOT+"assets-src/TorjaegerLiga-Ueberblick.jpg"));
});
test("„Wer spielt?“ hat die runde Taste, die Grafik ist erst nach dem Öffnen da",()=>{
  const h=accountsHTML(accts,base(),env);
  assert.match(h,/id="infoOpen"/);assert.ok(!h.includes("infoovl"));
  assert.ok(!/PIN/.test(h.match(/<button class="infobtn"[^>]*>/)[0]));
  const o=accountsHTML(accts,{...base(),info:true},env);
  assert.ok(o.includes(INFO_IMG));assert.ok(o.includes(INFO_ALT));
  assert.match(o,/id="infoClose"/);assert.match(o,/id="infoPlus"/);assert.match(o,/id="infoMinus"/);
});
test("Zoom: Vergrößern und Verkleinern haben Grenzen",()=>{
  assert.match(infoHTML({info:true,infoZoom:1}),/id="infoMinus"[^>]*disabled/);
  assert.match(infoHTML({info:true,infoZoom:1}),/width:100%/);
  assert.match(infoHTML({info:true,infoZoom:3}),/id="infoPlus"[^>]*disabled/);
  assert.match(infoHTML({info:true,infoZoom:9}),/width:300%/);
  assert.equal(infoHTML({info:false}),"");
});
test("Die Taste ist mindestens 44 px groß, Öffnen und Schließen sind in app.js verdrahtet",()=>{
  const css=fs.readFileSync(ROOT+"app/css/style.css","utf8");
  const m=css.match(/\.infobtn\{[^}]*width:(\d+)px;height:(\d+)px/);assert.ok(m&&+m[1]>=44&&+m[2]>=44);
  const js=fs.readFileSync(ROOT+"app/js/app.js","utf8");
  assert.match(js,/\$\("infoOpen"\)\.onclick=\(\)=>\{UI\.info=true/);
  assert.match(js,/\$\("infoClose"\)\.onclick=\(\)=>\{UI\.info=false/);
});
