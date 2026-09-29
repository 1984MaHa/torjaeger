// Spielregeln auf dem Konto-Stand: Ligen, sichere Themen, Aufstieg, Punkte, Sticker.
// Alles reine Funktionen auf dem Stand `s` (kein DOM), damit sie getestet werden können.
// Änderungen laufen über die apply*-Funktionen mit ctx = {deviceId, now}.
import {LIGEN,STICKERS,TRIAL,ROUND,PROBE,MASTER_N,MASTER_K,WEAK,topicsOf} from "./content.js";
import {lgOf,devOf,statOf,total,newProfile,defaultLg,defaultSettings} from "./model.js";
import {cleanLook,cleanText,cleanTrainerLook} from "./avatar.js";
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
// Einstellungen je Konto mit Vorgaben (ältere Stände ohne Felder funktionieren weiter).
export const settingsOf=s=>Object.assign(defaultSettings(),s.settings);
export const roundLen=s=>{const n=settingsOf(s).perRound;return[6,8,10].includes(n)?n:ROUND;};
export const trialLen=s=>{const n=settingsOf(s).trialN;return Number.isInteger(n)&&n>=1&&n<=20?n:TRIAL;};
export const winNeed=n=>Math.ceil(n*3/5); // Sieg ab 60 Prozent
export function canTrial(s,i,now=Date.now()){
  const l=s.progress.lg[LIGEN[i].id]||defaultLg();
  return leagueState(s,i)==="locked"&&i<=topLeague(s)+2&&(!settingsOf(s).trialDaily||l.trial!==todayKey(now));
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
// help: höchste Hilfestufe in dieser Aufgabe (0 keine, 1 Tipp, 2 Erklärung). Hilfe kostet keine Punkte.
export function applyAnswer(s,ctx,{topic,ok,gain,li,trial,help=0}){
  const st=statOf(s,topic),dev=ctx.deviceId;
  const tot=st.tot[dev]||(st.tot[dev]={a:0,c:0});
  tot.a++;if(ok)tot.c++;
  const entry={t:ctx.now,ok:ok?1:0,d:dev.slice(0,6)};if(help>0)entry.h=help;
  st.last.push(entry);st.last=st.last.slice(-MASTER_N);
  if(help>0)helpOn(st,dev).n++;
  if(!trial&&leagueState(s,li)==="probe"){const l=lgOf(s,LIGEN[li].id);l.spent=Math.min(PROBE,l.spent+1);l.t=ctx.now;}
  if(gain)devOf(s,dev).points+=gain;
  touch(s,ctx);
}
const helpOn=(st,dev)=>{st.help=st.help||{};return st.help[dev]||(st.help[dev]={n:0,t1:0,t2:0});};
// Der Trainer wurde um Hilfe gebeten (level 1 Tipp, level 2 Erklärung). Pro Aufgabe und Stufe einmal aufrufen.
export function applyHelp(s,ctx,{topic,level}){
  const h=helpOn(statOf(s,topic),ctx.deviceId);
  if(level===1)h.t1++;else if(level===2)h.t2++;
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
export function applyRoundEnd(s,ctx,{li,mode,trial,c,n,pts,bonus,dur}){
  const dev=devOf(s,ctx.deviceId);
  const win=!trial&&c/n>=.6;
  dev.points+=bonus;dev.rounds++;
  let newSticker=null;
  if(win){dev.wins++;if(total(s,"stickers")<STICKERS.length){newSticker=total(s,"stickers");dev.stickers++;}}
  const d=todayKey(ctx.now);
  if(!s.progress.days.includes(d)){s.progress.days.push(d);s.progress.days=s.progress.days.sort().slice(-120);}
  const msg=checkPromotions(s,ctx);
  const h={id:ctx.now+"-"+ctx.deviceId,t:ctx.now,d,liga:LIGEN[li].id,mode,trial:!!trial,c,n,pts};
  if(Number.isFinite(dur)&&dur>=0)h.dur=Math.round(dur); // Dauer in Sekunden
  s.history.push(h);
  s.history=s.history.slice(-200);
  touch(s,ctx);
  return{newSticker,celebrate:msg};
}
export function applyOpen(s,ctx,li){const l=lgOf(s,LIGEN[li].id);l.open=true;l.t=ctx.now;touch(s,ctx);}
export function applyLock(s,ctx,li){const l=lgOf(s,LIGEN[li].id);l.open=false;l.probe=false;l.spent=0;l.t=ctx.now;touch(s,ctx);}
export function applySound(s,ctx,on){s.settings.sound=!!on;s.settings.t=ctx.now;touch(s,ctx);}
// Einstellungen je Konto (Admin). Ungültige Werte werden ignoriert.
export function applySettings(s,ctx,patch){
  const st=s.settings;
  if("sound" in patch)st.sound=!!patch.sound;
  if([6,8,10].includes(patch.perRound))st.perRound=patch.perRound;
  if(Number.isInteger(patch.trialN)&&patch.trialN>=1&&patch.trialN<=20)st.trialN=patch.trialN;
  if("trialDaily" in patch)st.trialDaily=!!patch.trialDaily;
  if(Number.isInteger(patch.hintAfter)&&(patch.hintAfter===0||(patch.hintAfter>=10&&patch.hintAfter<=300)))st.hintAfter=patch.hintAfter;
  st.t=ctx.now;touch(s,ctx);
}
export function applyRename(s,ctx,name){
  const n=typeof name==="string"?name.trim().slice(0,40):"";
  if(!n)return false;
  s.profile.name=n;s.profile.t=ctx.now;touch(s,ctx);return true;
}
// Aussehen speichern (look wird geprüft), Baukasten gilt damit als angeboten.
export function applyAvatar(s,ctx,look){
  s.profile.avatar=Object.assign(cleanLook(look),{t:ctx.now});
  s.profile.avatarAsked=true;touch(s,ctx);
}
export function applyAvatarAsked(s,ctx){if(!s.profile.avatarAsked){s.profile.avatarAsked=true;touch(s,ctx);}}
// Trainer (global, gilt für alle Konten). g ist der globale Stand.
export function applyTrainer(g,ctx,{name,look}){
  g.trainer={name:cleanText(name,16,"Trainer Papa"),look:cleanTrainerLook(look),t:ctx.now};
  g.updatedAt=ctx.now;
}
export function applySel(s,ctx,li){s.progress.sel=li;touch(s,ctx);}

// Zurücksetzen: Spielstand leer, Name und Einstellungen bleiben. resetAt sorgt dafür, dass der leere
// Stand auf allen Geräten gewinnt (siehe merge.js).
export function applyReset(s,ctx){
  const fresh=newProfile({id:s.profile.id,name:s.profile.name,deviceId:ctx.deviceId,now:ctx.now});
  fresh.meta.resetAt=ctx.now;fresh.meta.createdAt=s.meta.createdAt;fresh.meta.rev=s.meta.rev;
  fresh.settings=s.settings;
  fresh.profile.avatar=s.profile.avatar||null;fresh.profile.avatarAsked=!!s.profile.avatarAsked; // Aussehen bleibt
  return fresh;
}
