// Spielregeln auf dem Konto-Stand: Ligen, sichere Themen, Aufstieg, Punkte, Sticker.
// Alles reine Funktionen auf dem Stand `s` (kein DOM), damit sie getestet werden können.
// Änderungen laufen über die apply*-Funktionen mit ctx = {deviceId, now}.
import {LIGEN,STICKERS,TRIAL,ROUND,PROBE,MASTER_N,MASTER_K,WEAK,BONUS_FIX,EN_LEVELS,LATE_IDS,topicsOf,allTopicsOf,isEng,TOPIC_MODES} from "./content.js";
import {lgOf,devOf,statOf,total,newProfile,defaultLg,defaultSettings,lvOf} from "./model.js";
import {cleanLook,cleanText,cleanTrainerLook} from "./avatar.js";
import {todayKey} from "./util.js";

// ---------- Abfragen ----------
export function topicSafe(s,t){
  const st=s.stats[t];if(!st||!st.last)return false;
  const l=st.last.slice(-MASTER_N);
  return l.length>=MASTER_N&&l.reduce((a,x)=>a+x.ok,0)>=MASTER_K;
}
// Themensteuerung der Eltern je Konto: aktuell (Vorgabe), wiederholen (seltener) oder aus (ausgeblendet).
export const topicModeOf=(s,t)=>{const m=s.settings&&s.settings.topicMode,v=m&&typeof m==="object"?m[t]:null;return v==="aus"||v==="wiederholen"?v:"aktuell";};
export const topicOn=(s,t)=>topicModeOf(s,t)!=="aus";
export const activeTopics=(s,list)=>list.filter(t=>topicOn(s,t));
// Themen, die für den Aufstieg zählen: nur Mathe und Deutsch, und nur die, die nicht "aus" sind.
export const gateTopics=(s,i)=>activeTopics(s,topicsOf(i));
export const safeCount=(s,i)=>gateTopics(s,i).filter(t=>topicSafe(s,t)).length;
export const mastered=(s,i)=>{const n=gateTopics(s,i).length;return n>0&&safeCount(s,i)===n;};
// Häkchen je Thema. Englisch: sicher und Stufe 3 erreicht.
export const topicDone=(s,t)=>topicSafe(s,t)&&(!isEng(t)||lvOf(s,t)>=EN_LEVELS);
// Fortschritt in einem Fach (math, deu, eng, su) einer Liga, ohne ausgeschaltete Themen.
export function fachProgress(s,li,fach){
  const list=activeTopics(s,LIGEN[li][fach]||[]);
  return{done:list.filter(t=>topicDone(s,t)).length,total:list.length};
}
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
// Aktuelle Liga (groß dargestellt): die gewählte, wenn sie spielbar ist, sonst die höchste ganz freie.
export function defaultLeague(s){let t=0;LIGEN.forEach((_,i)=>{if(leagueState(s,i)==="open")t=i;});return t;}
export function currentLeague(s){
  const c=s.progress.cur;
  if(c&&Number.isInteger(c.li)&&c.li>=0&&c.li<LIGEN.length&&playable(s,c.li))return c.li;
  return defaultLeague(s);
}
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
  w=Math.max(.25,w);
  if(LATE_IDS.includes(t))w*=.4; // Stoff vielleicht noch nicht gehabt: seltener
  return topicModeOf(s,t)==="wiederholen"?w*.35:w; // Wiederholen kommt seltener dran
}
export function nextTopic(s,pool,last,rnd=Math.random){
  const on=activeTopics(s,pool);if(on.length)pool=on; // ausgeschaltete Themen kommen nie dran
  let tot=0;const ws=pool.map(t=>{const w=weightOf(s,t)*(t===last?.3:1);tot+=w;return w;});
  let x=rnd()*tot;for(let i=0;i<pool.length;i++){x-=ws[i];if(x<=0)return pool[i];}
  return pool[pool.length-1];
}

// ---------- Änderungen ----------
const touch=(s,ctx)=>{s.meta.updatedAt=ctx.now;};

// Eine beantwortete Aufgabe: Antwortverlauf, Probetraining-Budget und Punkte.
// help: höchste Hilfestufe in dieser Aufgabe (0 keine, 1 Tipp, 2 Erklärung). Hilfe kostet keine Punkte.
// lv: Englisch-Stufe der Aufgabe, terms: [{id, ok}] Begriffe für die Statistik je Begriff.
// soft: Aufgabe mit Stoff, der vielleicht noch nicht dran war. Eine falsche Antwort zählt dann nicht (keine Wertung im Thema, kein Begriff).
export function applyAnswer(s,ctx,{topic,ok,gain,li,trial,help=0,lv=0,terms=null,soft=false}){
  const skip=soft&&!ok;
  const st=statOf(s,topic),dev=ctx.deviceId;
  const tot=st.tot[dev]||(st.tot[dev]={a:0,c:0});
  if(!skip)tot.a++;if(ok)tot.c++;
  const entry={t:ctx.now,ok:ok?1:0,d:dev.slice(0,6)};if(help>0)entry.h=help;if(lv>0)entry.lv=lv;
  if(!skip){st.last.push(entry);st.last=st.last.slice(-MASTER_N);}
  if(isEng(topic)&&!skip)promoteLevel(s,st,topic);
  if(!skip&&Array.isArray(terms)&&terms.length){const tm=st.terms=st.terms||{},d=tm[dev]||(tm[dev]={});
    for(const x of terms){d["a:"+x.id]=(d["a:"+x.id]||0)+1;if(x.ok)d["c:"+x.id]=(d["c:"+x.id]||0)+1;}}
  if(help>0)helpOn(st,dev).n++;
  if(!trial&&leagueState(s,li)==="probe"){const l=lgOf(s,LIGEN[li].id);l.spent=Math.min(PROBE,l.spent+1);l.t=ctx.now;}
  if(gain)devOf(s,dev).points+=gain;
  touch(s,ctx);
}
// Englisch: Stufe steigt, wenn die letzten 10 Antworten in dieser Stufe mindestens 8 richtige hatten. Sie sinkt nie.
function promoteLevel(s,st,topic){
  const cur=lvOf(s,topic);if(cur>=EN_LEVELS)return;
  const l=st.last.filter(e=>(e.lv||1)===cur);
  if(l.length>=MASTER_N&&l.reduce((a,x)=>a+x.ok,0)>=MASTER_K)st.lv=cur+1;
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
export function applyRoundEnd(s,ctx,{li,mode,trial,c,n,pts,bonus,dur,topic,pk}){
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
  if(topic)h.topic=topic;if(pk)h.pk=true; // Themenblock als Päckchen
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
// Themensteuerung (Eltern): topic = Thema, mode = aktuell, wiederholen oder aus. Gehört zu den Einstellungen (neuerer Stand gewinnt).
export function applyTopicMode(s,ctx,topic,mode){
  if(!TOPIC_MODES.includes(mode)||!LIGEN.some((_,i)=>allTopicsOf(i).includes(topic)))return false;
  const m=Object.assign({},s.settings.topicMode);
  if(mode==="aktuell")delete m[topic];else m[topic]=mode;
  s.settings.topicMode=m;s.settings.t=ctx.now;touch(s,ctx);return true;
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
// PIN des Kindes (4 Ziffern, freiwillig, leer = keine). Steht im Klartext, damit Eltern sie im Eltern-Bereich sehen, wenn sie vergessen wurde.
export const validKidPin=v=>typeof v==="string"&&/^\d{4}$/.test(v);
export function applyProfilePin(s,ctx,code){
  const c=code===""||code===null||code===undefined?"":String(code);
  if(c!==""&&!validKidPin(c))return false;
  s.profile.pin={code:c,t:ctx.now};touch(s,ctx);return true;
}
export function applyAvatarAsked(s,ctx){if(!s.profile.avatarAsked){s.profile.avatarAsked=true;touch(s,ctx);}}
// Trainer (global, gilt für alle Konten). g ist der globale Stand.
// which: 1 = Trainer, 2 = Trainerin
export function applyTrainer(g,ctx,{name,look},which=1){
  g[which===2?"trainer2":"trainer"]={name:cleanText(name,16,which===2?"Trainerin":"Trainer"),look:cleanTrainerLook(look,which),t:ctx.now};
  g.updatedAt=ctx.now;
}
export function applySel(s,ctx,li){s.progress.sel=li;touch(s,ctx);}
// Das Kind wählt die aktuelle Liga (nur spielbare). Der neueste Stand gewinnt beim Zusammenführen.
export function applyCurrent(s,ctx,li){
  if(!Number.isInteger(li)||li<0||li>=LIGEN.length||!playable(s,li))return false;
  s.progress.cur={li,t:ctx.now};touch(s,ctx);return true;
}
// Kontroll-Pfiff eines Päckchens: je Thema Pfiffe, benutzte Proben und selbst korrigierte Fehler (Zähler je Gerät).
// bonus: Punkte für selbst gefundene Fehler. Nur Stand und Zähler, die Antworten selbst laufen über applyAnswer.
export function applyControl(s,ctx,{topic,probes=0,fixed=0,bonus=0}){
  const st=statOf(s,topic),dev=ctx.deviceId;st.ctl=st.ctl||{};
  const c=st.ctl[dev]||(st.ctl[dev]={n:0,p:0,f:0});
  c.n++;c.p+=Math.max(0,probes|0);c.f+=Math.max(0,fixed|0);
  if(bonus>0)devOf(s,dev).points+=bonus;
  touch(s,ctx);
}
export const fixBonus=fixed=>fixed*BONUS_FIX;

// Zurücksetzen: Spielstand leer, Name und Einstellungen bleiben. resetAt sorgt dafür, dass der leere
// Stand auf allen Geräten gewinnt (siehe merge.js).
export function applyReset(s,ctx){
  const fresh=newProfile({id:s.profile.id,name:s.profile.name,deviceId:ctx.deviceId,now:ctx.now});
  fresh.meta.resetAt=ctx.now;fresh.meta.createdAt=s.meta.createdAt;fresh.meta.rev=s.meta.rev;
  fresh.settings=s.settings;
  fresh.profile.avatar=s.profile.avatar||null;fresh.profile.avatarAsked=!!s.profile.avatarAsked; // Aussehen bleibt
  if(s.profile.pin)fresh.profile.pin=s.profile.pin; // PIN des Kindes bleibt
  return fresh;
}
