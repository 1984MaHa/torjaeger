// Version 1.6.2 (B3): Frust-Bremse. Drei Fehler in Folge im selben Thema: Thema seltener, Tipp-Angebot, Markierung für die Eltern.
import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {fileURLToPath} from "node:url";
import {newProfile} from "../app/js/model.js";
import {ALL_TOPICS} from "../app/js/content.js";
import {strikeStep,frustTopics,isFrust,nextTopic,applyAnswer,applyTopicMode,FRUST_N,FRUST_FACTOR} from "../app/js/rules.js";
import {adminHTML} from "../app/js/admin.js";

const ROOT=fileURLToPath(new URL("..",import.meta.url));
const ctx=(t,d="d1")=>({deviceId:d,now:t});
const prof=()=>newProfile({id:"k-emil0001",name:"Emil",deviceId:"d1",now:1000,topics:ALL_TOPICS});
const ans=(s,t,ok,n)=>applyAnswer(s,ctx(n),{topic:t,ok,gain:0,li:1,trial:false});

test("strikeStep: greift genau beim dritten Fehler in Folge, eine richtige Antwort setzt zurück",()=>{
  const st={};
  assert.equal(FRUST_N,3);
  assert.deepEqual([false,false,false].map(()=>strikeStep(st,"m3_rest",true)),[false,false,false]);
  assert.equal(strikeStep(st,"m3_rest",false),false);assert.equal(strikeStep(st,"m3_rest",false),false);
  assert.equal(strikeStep(st,"m3_rest",false),true,"dritter Fehler");
  assert.equal(strikeStep(st,"m3_rest",false),false,"danach nicht noch einmal");
  strikeStep(st,"m3_rest",true);
  assert.equal(strikeStep(st,"m3_rest",false),false);assert.equal(strikeStep(st,"m3_rest",false),false);assert.equal(strikeStep(st,"m3_rest",false),true);
  // je Thema getrennt: ein Fehler in einem anderen Thema unterbricht die Folge nicht
  const b={};strikeStep(b,"a",false);strikeStep(b,"b",false);strikeStep(b,"a",false);assert.equal(strikeStep(b,"a",false),true);
});
test("Bremse: das Thema kommt in der Runde deutlich seltener dran, die anderen bleiben",()=>{
  const s=prof(),pool=["m3_rest","m3_1x1","m3_htz","m3_plus"],N=8000;
  const share=cool=>{let n=0;for(let i=0;i<N;i++)if(nextTopic(s,pool,null,Math.random,cool)==="m3_rest")n++;return n/N;};
  const normal=share(null),cooled=share({m3_rest:true});
  assert.ok(FRUST_FACTOR<1);assert.ok(cooled<normal*.4,`${cooled} gegen ${normal}`);assert.ok(cooled>0,"nicht ganz weg");
  for(let i=0;i<300;i++)assert.ok(pool.includes(nextTopic(s,pool,null,Math.random,{m3_rest:true})));
  // gekühlt ist das einzige Thema: es kommt trotzdem dran
  assert.equal(nextTopic(s,["m3_rest"],null,Math.random,{m3_rest:true}),"m3_rest");
});
test("Eltern-Markierung: letzte drei Antworten falsch, verschwindet nach einer richtigen",()=>{
  const s=prof();
  ans(s,"d3_ie",false,1);ans(s,"d3_ie",false,2);assert.equal(isFrust(s,"d3_ie"),false);
  ans(s,"d3_ie",false,3);assert.deepEqual(frustTopics(s),["d3_ie"]);
  ans(s,"d3_ie",true,4);assert.deepEqual(frustTopics(s),[]);
  ans(s,"m3_rest",true,5);ans(s,"m3_rest",false,6);ans(s,"m3_rest",false,7);ans(s,"m3_rest",false,8);assert.deepEqual(frustTopics(s),["m3_rest"]);
});
test("Ausgeschaltete oder zurückgestellte Themen werden nicht markiert",()=>{
  const s=prof();for(let i=1;i<=3;i++)ans(s,"d3_ie",false,i);
  assert.equal(isFrust(s,"d3_ie"),true);
  applyTopicMode(s,ctx(10),"d3_ie","zurueck");assert.equal(isFrust(s,"d3_ie"),false);
  applyTopicMode(s,ctx(11),"d3_ie","aus");assert.equal(isFrust(s,"d3_ie"),false);
});
test("Eltern-Bereich zeigt die Frage nach dem Unterricht, aber nur bei Frust",()=>{
  const s=prof();ans(s,"d3_ie",false,1);
  const A=()=>({tab:"stand",accounts:[{id:"k-emil0001",name:"Emil",state:s}],sel:"k-emil0001",confirm:"",tr1:null,tr2:null,server:{},schema:{app:8,global:4},cfg:{},msg:null});
  const none=adminHTML(A(),"x");assert.ok(!none.includes("schon im Unterricht"));
  ans(s,"d3_ie",false,2);ans(s,"d3_ie",false,3);
  const html=adminHTML(A(),"x");assert.match(html,/Drei Fehler in Folge\. Ist das schon im Unterricht dran\?/);
});
test("app.js verdrahtet die Bremse (Zähler je Runde, Tipp-Angebot, nur ohne Trainingslager)",()=>{
  const src=fs.readFileSync(ROOT+"app/js/app.js","utf8");
  assert.match(src,/strikeStep\(G\.strikes/);assert.match(src,/nextTopic\(S\(\),G\.pool,G\.last,Math\.random,G\.cool\)/);
  assert.match(src,/G\.offerNext/);assert.match(src,/!G\.camp&&strikeStep/);
  assert.ok(!/[—–]/.test(fs.readFileSync(ROOT+"app/js/rules.js","utf8").split("Frust-Bremse")[1]||""));
});
