// Version 1.6.6 (B7): Überraschungsspiel. Lost ein Mini-Spiel aus, oder das Kind wählt selbst in der Kabine.
import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {fileURLToPath} from "node:url";
import {newProfile} from "../app/js/model.js";
import {ALL_TOPICS} from "../app/js/content.js";
import {applyFach,applyTopicMode} from "../app/js/rules.js";
import {MINI_IDS,newSurprise,miniAnswer,miniNext,miniOver} from "../app/js/mini.js";
import {miniPanelHTML,miniHTML} from "../app/js/miniviews.js";
import {homeHTML} from "../app/js/views.js";

const ROOT=fileURLToPath(new URL("..",import.meta.url));
const prof=()=>newProfile({id:"k-emil0001",name:"Emil",deviceId:"d1",now:1000,topics:ALL_TOPICS});

test("Überraschung lost über die Zeit alle Arten aus und markiert das Spiel",()=>{
  const s=prof(),seen=new Set();
  for(let i=0;i<60;i++){const M=newSurprise(s);assert.ok(M&&M.surprise===true);assert.ok(MINI_IDS.includes(M.kind));seen.add(M.kind);}
  assert.deepEqual([...seen].sort(),[...MINI_IDS].sort());
});
test("Die zuletzt gespielte Art kommt nicht gleich wieder, solange es andere gibt",()=>{
  const s=prof();
  for(const k of MINI_IDS)for(let i=0;i<15;i++)assert.notEqual(newSurprise(s,Math.random,k).kind,k);
});
test("Ist nur eine Art spielbar, wird sie gelost (auch die zuletzt gespielte); ist nichts spielbar, gibt es null",()=>{
  // Rechenthemen aus: Memory fällt weg, Torwand und Parcours bleiben (Deutsch)
  const s=prof();for(const t of ["m_read","m_split","m_plaet","m_zehner","m_mal","m_rechnen","m3_rest","m3_1x1","m3_htz","m3_plus","m3_sach","m4_stelle","m4_mult","m4_div","m4_runden"])applyTopicMode(s,{deviceId:"d1",now:2},t,"aus");
  const ks=new Set();for(let i=0;i<40;i++){const M=newSurprise(s);if(M)ks.add(M.kind);}
  assert.ok(!ks.has("memory"));
  const t=prof();for(const f of ["math","deu"])applyFach(t,{deviceId:"d1",now:2},f,false);
  assert.equal(newSurprise(t),null);
});
test("Ansichten: Knopf in der Kabine, Meldung, nach dem Spiel noch eine Überraschung",()=>{
  const s=prof();
  assert.match(miniPanelHTML(s),/data-mini="surprise"[^>]*>Überraschungsspiel/);
  assert.match(miniPanelHTML(s,"Gerade gibt es kein Mini-Spiel mit passenden Aufgaben."),/role="status">Gerade gibt es kein Mini-Spiel/);
  const env={camp:null,pack:null,hasPin:true,syncText:"",updateReady:false,persistent:true};
  assert.match(homeHTML(s,{miniMsg:"Testmeldung"},env),/Testmeldung/);assert.match(homeHTML(s,{},env),/data-mini="surprise"/);
  let M=newSurprise(s);
  while(!miniOver(M)){if(M.kind==="memory"){M.found=M.items.map((_,k)=>k);break;}const it=M.items[M.i];miniAnswer(M,it.right);miniNext(M);}
  if(M.kind==="dribble")M.fin=true;
  assert.match(miniHTML(s,M),/Noch eine Überraschung/);
});
test("Verdrahtung: app.js startet die Überraschung ohne die letzte Art, Texte ohne Gedankenstriche",()=>{
  const src=fs.readFileSync(ROOT+"app/js/app.js","utf8");
  assert.match(src,/newSurprise\(S\(\),Math\.random,MG&&MG\.kind\)/);
  for(const f of ["mini.js","miniviews.js"])assert.ok(!/[—–]/.test(fs.readFileSync(ROOT+"app/js/"+f,"utf8")),f);
});
