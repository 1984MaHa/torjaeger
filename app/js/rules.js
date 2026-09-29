// Spielregeln auf dem Konto-Stand: Ligen, sichere Themen, Aufstieg, Punkte, Sticker.
// Alles reine Funktionen auf dem Stand `s` (kein DOM), damit sie getestet werden können.
// Änderungen laufen über die apply*-Funktionen mit ctx = {deviceId, now}.
import {LIGEN,STICKERS,TRIAL,PROBE,MASTER_N,MASTER_K,WEAK,topicsOf} from "./content.js";
import {lgOf,devOf,statOf,total,newProfile,defaultLg} from "./model.js";
import {todayKey} from "./util.js";

// ---------- Abfragen ----------
export function topicSafe(s,t){
  const st=s.stats[t];if(!st||!st.last)return false;
  const l=st.last.slice(-MASTER_N);
  return l.length>=MASTER_N&&l.reduce((a,x)=>a+x.ok,0)>=MASTER_K;
}
export const safeCount=(s,i)=>topicsOf(i).filter(t=>topicSafe(s,t)).length;
export const mastered=(s,i)=>safeCount(s,i)===topicsOf(i).length;
export const budgetOf=(s,i)=>Math.max(0,PROBE-lgOf(s,LIGEN[i].id).spent);
// open | probe | wait | locked
export function leagueState(s,i){
  if(i===0)return"open";
  const l=s.progress.lg[LIGEN[i].id]||defaultLg();
  if(l.open)return"open";
  if(l.probe)return budgetOf(s,i)>0?"probe":"wait";
  return"locked";
}
export const playable=(s,i)=>{const x=leagueState(s,i);return x==="open"||x==="probe";};
export function topLeague(s){let t=0;LIGEN.forEach((_,i)=>{if(leagueState(s,i)!=="locked")t=i;});return t;}
export function canTrial(s,i,now=Date.now()){
  const l=s.progress.lg[LIGEN[i].id]||defaultLg();
  return leagueState(s,i)==="locked"&&i<=topLeague(s)+2&&l.trial!==todayKey(now);
}
export function streakDays(s,now=Date.now()){
  const set=new Set(s.progress.days);let n=0;const d=new Date(now);
  if(!set.has(todayKey(d.getTime())))d.setDate(d.getDate()-1);
  while(set.has(todayKey(d.getTime()))){n++;d.setDate(d.getDate()-1);}
  return n;
}
export const stickerCount=s=>Math.min(STICKERS.length,total(s,"stickers"));

// Gewichtung: schwache Themen kommen öfter dran.
export function weightOf(s,t){
  const st=s.stats[t];let w=WEAK[t]||1.2;
  if(st&&st.last&&st.last.length>=3){const l=st.last.slice(-MASTER_N);w*=0.5+2.2*(1-l.reduce((a,x)=>a+x.ok,0)/l.length);}
  if(topicSafe(s,t))w*=.6;
  return Math.max(.25,w);
}
export function nextTopic(s,pool,last,rnd=Math.random){
  let tot=0;const ws=pool.map(t=>{const w=weightOf(s,t)*(t===last?.3:1);tot+=w;return w;});
  let x=rnd()*tot;for(let i=0;i<pool.length;i++){x-=ws[i];if(x<=0)return pool[i];}
  return pool[pool.length-1];
}

// ---------- Änderungen ----------
const touch=(s,ctx)=>{s.meta.updatedAt=ctx.now;};

// Eine beantwortete Aufgabe: Antwortverlauf, Probetraining-Budget und Punkte.
export function applyAnswer(s,ctx,{topic,ok,gain,li,trial}){
  const st=statOf(s,topic),dev=ctx.deviceId;
  const tot=st.tot[dev]||(st.tot[dev]={a:0,c:0});
  tot.a++;if(ok)tot.c++;
  st.last.push({t:ctx.now,ok:ok?1:0,d:dev.slice(0,6)});st.last=st.last.slice(-MASTER_N);
  if(!trial&&leagueState(s,li)==="probe"){const l=lgOf(s,LIGEN[li].id);l.spent=Math.min(PROBE,l.spent+1);l.t=ctx.now;}
  if(gain)devOf(s,dev).points+=gain;
  touch(s,ctx);
}
export function applyTrial(s,ctx,li){const l=lgOf(s,LIGEN[li].id);l.trial=todayKey(ctx.now);l.t=ctx.now;touch(s,ctx);}

// Nächste Liga freigeben, wenn die aktuelle durchgespielt ist (Probetraining beginnt).
export function checkPromotions(s,ctx){
  let msg="";
  for(let i=0;i<LIGEN.length-1;i++){
    const nx=lgOf(s,LIGEN[i+1].id);
    if(mastered(s,i)&&!nx.probe&&!nx.open){nx.probe=true;nx.spent=0;nx.t=ctx.now;
      msg=`Stark! Die ${LIGEN[i].name} ist durchgespielt. In der ${LIGEN[i+1].name} kannst du jetzt ${PROBE} Aufgaben spielen.`;}
  }
  return msg;
}

// Spielende: Bonus, Spiele, Siege, Sticker, Trainingstag, Verlauf, Aufstieg.
export function applyRoundEnd(s,ctx,{li,mode,trial,c,n,pts,bonus}){
  const dev=devOf(s,ctx.deviceId);
  const win=!trial&&c/n>=.6;
  dev.points+=bonus;dev.rounds++;
  let newSticker=null;
  if(win){dev.wins++;if(total(s,"stickers")<STICKERS.length){newSticker=total(s,"stickers");dev.stickers++;}}
  const d=todayKey(ctx.now);
  if(!s.progress.days.includes(d)){s.progress.days.push(d);s.progress.days=s.progress.days.sort().slice(-120);}
  const msg=checkPromotions(s,ctx);
  s.history.push({id:ctx.now+"-"+ctx.deviceId,t:ctx.now,d,liga:LIGEN[li].id,mode,trial:!!trial,c,n,pts});
  s.history=s.history.slice(-200);
  touch(s,ctx);
  return{newSticker,celebrate:msg};
}
export function applyOpen(s,ctx,li){const l=lgOf(s,LIGEN[li].id);l.open=true;l.t=ctx.now;touch(s,ctx);}
export function applyLock(s,ctx,li){const l=lgOf(s,LIGEN[li].id);l.open=false;l.probe=false;l.spent=0;l.t=ctx.now;touch(s,ctx);}
export function applySound(s,ctx,on){s.settings.sound=!!on;s.settings.t=ctx.now;touch(s,ctx);}
export function applySel(s,ctx,li){s.progress.sel=li;touch(s,ctx);}

// Zurücksetzen: Spielstand leer, Name und Einstellungen bleiben. resetAt sorgt dafür, dass der leere
// Stand auf allen Geräten gewinnt (siehe merge.js).
export function applyReset(s,ctx){
  const fresh=newProfile({id:s.profile.id,name:s.profile.name,deviceId:ctx.deviceId,now:ctx.now});
  fresh.meta.resetAt=ctx.now;fresh.meta.createdAt=s.meta.createdAt;fresh.meta.rev=s.meta.rev;
  fresh.settings=s.settings;
  return fresh;
}
