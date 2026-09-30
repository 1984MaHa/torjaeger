// Ohne Browser prüfbar: Ansichten lassen sich rendern, und app.js importiert nur Namen, die es wirklich gibt.
import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {fileURLToPath} from "node:url";
import {LIGEN,ROUND,topicsOf} from "../app/js/content.js";
import {GEN} from "../app/js/generators.js";
import {newProfile} from "../app/js/model.js";
import {applyAnswer,applyRoundEnd,nextTopic,leagueState,topLeague} from "../app/js/rules.js";
import {homeHTML,accountsHTML,playHTML,resultHTML} from "../app/js/views.js";

const env={hasPin:true,syncText:"noch nie",updateReady:true,persistent:true,version:"1.1.0"};
const UI={confirmReset:false,parent:true,pinMsg:"",celebrate:"",newAcct:true,acctMsg:"x",sync:""};

test("app.js importiert nur vorhandene Exporte",async()=>{
  const dir=fileURLToPath(new URL("../app/js/",import.meta.url));
  const src=fs.readFileSync(dir+"app.js","utf8");
  for(const m of src.matchAll(/import \{([^}]+)\} from "\.\/([\w-]+\.js)"/g)){
    if(m[2]==="store.js"||m[2]==="audio.js"){ // fassen den Browser nur bei Aufruf an
    }
    const mod=await import("../app/js/"+m[2]);
    for(const name of m[1].split(",").map(x=>x.trim()).filter(Boolean))assert.ok(name in mod,m[2]+" exportiert "+name+" nicht");
  }
});

test("Kabine, Konten, Spiel und Ergebnis lassen sich rendern (mit Namen mit Sonderzeichen)",()=>{
  const s=newProfile({id:"k-abc12345",name:"<b>Emil</b>",deviceId:"d1",now:1000});
  const home=homeHTML(s,UI,env);
  assert.ok(home.includes("&lt;b&gt;Emil&lt;/b&gt;")&&!home.includes("<b>Emil</b>"),"Name muss entschärft sein");
  assert.ok(home.includes("Zuletzt abgeglichen")&&home.includes("Trainingscamp"));
  assert.ok(accountsHTML([{id:"k-abc12345",name:"Emil"}],UI,env).includes('data-acct="k-abc12345"'));
  assert.ok(accountsHTML([],{...UI,newAcct:false,acctMsg:""},{...env,hasPin:false}).includes("Neues Konto"));
  // ein ganzes Spiel in jeder Liga und jedem Modus, jede Aufgabe wird gerendert
  for(let li=0;li<LIGEN.length;li++){
    const pool=LIGEN[li].math.concat(LIGEN[li].deu);
    const G={li,mode:"mix",trial:false,pool,len:ROUND,i:0,res:[],hist:[],pts:0,streak:0,rival:"FC Test",last:null};
    for(let i=0;i<ROUND;i++){
      const t=nextTopic(s,pool,G.last);G.last=t;
      G.task=Object.assign({topic:t},GEN[t]());G.input="";G.inp=["",""];G.act=0;G.done=false;G.showHint=false;G.pickIdx=-1;G.given=null;G.i=i;
      assert.ok(playHTML(s,G).includes("Aufgabe "+(i+1)));
      const ok=i%2===0;G.done=true;G.ok=ok;G.res.push(ok);G.gain=ok?10:0;G.pts+=G.gain;G.given=G.task.type==="num"?String(G.task.a):G.task.a;
      assert.ok(playHTML(s,G).includes(ok?"Tor!":"Knapp vorbei"));
      applyAnswer(s,{deviceId:"d1",now:2000+i},{topic:t,ok,gain:G.gain,li,trial:false});
    }
    G.bonus=0;G.newSticker=null;
    applyRoundEnd(s,{deviceId:"d1",now:3000},{li,mode:"mix",trial:false,c:4,n:ROUND,pts:G.pts,bonus:0});
    assert.ok(resultHTML(s,G,UI).includes("4 : 4"));
  }
  assert.equal(s.history.length,LIGEN.length);
});

test("Aufstieg: alle Themen sicher gibt Probetraining, danach Freigabe möglich",()=>{
  const s=newProfile({id:"k-abc12345",name:"E",deviceId:"d1",now:1000});
  const c=n=>({deviceId:"d1",now:n});let t=10;
  for(const topic of topicsOf(0))for(let i=0;i<10;i++)applyAnswer(s,c(t++),{topic,ok:i<8,gain:10,li:0,trial:false});
  assert.equal(leagueState(s,1),"locked");
  const r=applyRoundEnd(s,c(t++),{li:0,mode:"mix",trial:false,c:8,n:8,pts:80,bonus:20});
  assert.match(r.celebrate,/Kreisliga/);
  assert.equal(leagueState(s,1),"probe");assert.equal(topLeague(s),1);
  // 20 Probe-Aufgaben verbrauchen das Budget
  for(let i=0;i<20;i++)applyAnswer(s,c(t++),{topic:"m3_1x1",ok:true,gain:10,li:1,trial:false});
  assert.equal(leagueState(s,1),"wait");
});
