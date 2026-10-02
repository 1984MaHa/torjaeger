// Version 1.6.5 (B6): Mini-Spiel Dribbel-Parcours. Richtig = ein Hindernis weiter, falsch = Ball verloren, neue Aufgabe.
import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {fileURLToPath} from "node:url";
import {newProfile,total} from "../app/js/model.js";
import {ALL_TOPICS} from "../app/js/content.js";
import {applyFach} from "../app/js/rules.js";
import {MINI,DRIBBLE_STATIONS,DRIBBLE_TRIES,newMini,miniAnswer,miniNext,miniOver,miniBonus} from "../app/js/mini.js";
import {miniHTML,miniPanelHTML} from "../app/js/miniviews.js";

const ROOT=fileURLToPath(new URL("..",import.meta.url));
const prof=()=>newProfile({id:"k-emil0001",name:"Emil",deviceId:"d1",now:1000,topics:ALL_TOPICS});
const wrongOf=it=>it.opts.findIndex((_,k)=>k!==it.right);
const play=(M,plan)=>{ // plan: Liste true/false je Versuch
  for(const ok of plan){const it=M.items[M.i];miniAnswer(M,ok?it.right:wrongOf(it));if(miniNext(M))break;}
};

test("Neuer Parcours: fünf Hindernisse, höchstens zwölf Aufgaben, alle verschieden",()=>{
  assert.equal(DRIBBLE_STATIONS,5);assert.equal(DRIBBLE_TRIES,12);
  const M=newMini("dribble",prof());
  assert.ok(M);assert.equal(M.kind,"dribble");assert.equal(M.stations,5);assert.equal(M.pos,0);assert.equal(M.lost,0);
  assert.ok(M.items.length>=5&&M.items.length<=12);
  assert.equal(new Set(M.items.map(i=>i.T.q.replace(/<[^>]+>/g,""))).size,M.items.length);
});
test("Richtig bringt weiter, falsch verliert den Ball und gibt eine neue Aufgabe",()=>{
  const M=newMini("dribble",prof()),q0=M.items[0].T.q;
  const r=miniAnswer(M,wrongOf(M.items[0]));
  assert.equal(r.ok,false);assert.equal(M.pos,0);assert.equal(M.lost,1);assert.equal(M.gain,0);
  assert.equal(miniAnswer(M,M.items[0].right),null,"nicht zweimal antworten");
  assert.equal(miniNext(M),false);assert.notEqual(M.items[M.i].T.q,q0,"neue Aufgabe");
  const r2=miniAnswer(M,M.items[M.i].right);
  assert.equal(r2.ok,true);assert.equal(M.pos,1);assert.equal(M.lost,1);assert.equal(r2.gain,10);
  assert.equal(miniOver(M),false);
});
test("Tor nach fünf richtigen Antworten, Bonus 20 ohne Ballverlust, einmalig",()=>{
  const M=newMini("dribble",prof());
  play(M,[true,true,true,true,true]);
  assert.equal(M.pos,5);assert.equal(miniOver(M),true);assert.equal(M.lost,0);
  assert.equal(M.pts,10+10+15+15+15);
  assert.equal(miniBonus(M),20);assert.equal(miniBonus(M),0,"nur einmal");assert.equal(M.pts,65+20);
});
test("Mit verlorenen Bällen gibt es 10 Bonus, ohne Tor keinen",()=>{
  const M=newMini("dribble",prof());
  play(M,[true,false,true,true,false,true,true]);
  assert.equal(M.pos,5);assert.equal(M.lost,2);assert.equal(miniOver(M),true);assert.equal(miniBonus(M),10);
  const N=newMini("dribble",prof());
  play(N,Array(N.items.length).fill(false));
  assert.equal(miniOver(N),true);assert.equal(N.pos,0);assert.equal(miniBonus(N),0,"ohne Tor kein Bonus");
});
test("Zu viele Fehlversuche beenden das Spiel nach den vorhandenen Aufgaben",()=>{
  const M=newMini("dribble",prof()),n=M.items.length;
  play(M,[true,true].concat(Array(n).fill(false)));
  assert.equal(miniOver(M),true);assert.equal(M.pos,2);assert.ok(M.i<=n);
});
test("Kein Fach an: kein Parcours",()=>{
  const s=prof();for(const f of ["math","deu"])applyFach(s,{deviceId:"d1",now:2},f,false);
  assert.equal(newMini("dribble",s),null);
});
test("Ansichten: Auswahl, Strecke mit Hindernissen und Antworten, Rückmeldungen, Ergebnis",()=>{
  const s=prof(),M=newMini("dribble",s);
  assert.match(miniPanelHTML(s),/data-mini="dribble"/);
  let h=miniHTML(s,M);
  assert.match(h,/Parcours <em>0<\/em> von 5/);assert.match(h,/<svg class="track"/);assert.equal((h.match(/data-hole="/g)||[]).length,M.items[0].opts.length);
  assert.match(h,/Ball verloren: 0/);assert.ok(!h.includes("miniNext"));
  miniAnswer(M,wrongOf(M.items[0]));
  h=miniHTML(s,M);assert.match(h,/Ball verloren! Neuer Versuch/);assert.match(h,/Richtig war:/);assert.match(h,/id="miniNext"/);
  miniNext(M);miniAnswer(M,M.items[M.i].right);
  h=miniHTML(s,M);assert.match(h,/Vorbei! \+10/);
  miniNext(M);
  for(let k=0;k<4;k++){miniAnswer(M,M.items[M.i].right);miniNext(M);}
  assert.equal(miniOver(M),true);miniBonus(M);
  h=miniHTML(s,M);assert.match(h,/Tor!/);assert.match(h,/Alle 5 Hindernisse geschafft, 1× Ball verloren/);assert.match(h,/miniAgain/);
});
test("Verdrahtung: Bonus wird über applyMiniPoints gutgeschrieben, Texte ohne Gedankenstriche",()=>{
  const src=fs.readFileSync(ROOT+"app/js/app.js","utf8");
  assert.match(src,/miniBonus\(MG\)/);assert.match(src,/applyMiniPoints\(s,c,b\)/);
  for(const f of ["mini.js","miniviews.js"])assert.ok(!/[—–]/.test(fs.readFileSync(ROOT+"app/js/"+f,"utf8")),f);
  assert.equal(MINI.dribble.name,"Dribbel-Parcours");
  assert.equal(total(prof(),"points"),0);
});
