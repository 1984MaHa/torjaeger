// Zusammenführen zweier Stände desselben Kontos (lokal und Server). Reine Funktion.
// Regeln (siehe SPEC.md):
//  - Zähler (Punkte, Spiele, Siege, Sticker, Antworten) stehen je Gerät getrennt; je Gerät gilt der größere Wert.
//    Angezeigt wird die Summe: das entspricht "Summe der Zuwächse je Gerät".
//  - Je Thema die letzten 10 Antworten nach Zeitstempel (Vereinigung ohne Doppelte).
//  - Trainingstage und Spielverlauf: Vereinigung.
//  - Ligen-Freigaben, Name, Einstellungen: der neuere Stand gewinnt.
//  - Aussehen (profile.avatar) und Trainer (global): der neuere Stand gewinnt, je mit eigenem Zeitstempel.
//  - Tipp-Nutzung (stats.<Thema>.help) und Kontrolle (stats.<Thema>.ctl): je Gerät der größere Wert, angezeigt wird die Summe (wie die Antwortzähler).
//  - Gewählte aktuelle Liga (progress.cur): der neuere Stand gewinnt (eigener Zeitstempel t).
//  - Zurücksetzen (meta.resetAt): der Stand mit dem späteren Zurücksetzen gewinnt vollständig.
//  - Unbekannte Felder bleiben erhalten.
// Das Ergebnis ist unabhängig von der Reihenfolge und ändert sich nicht, wenn man erneut zusammenführt.
import {clone} from "./util.js";
import {SCHEMA_VERSION,GLOBAL_SCHEMA_VERSION,defaultLg} from "./model.js";
import {defaultTrainer,defaultTrainer2} from "./avatar.js";
import {canon} from "./util.js";
import {MASTER_N} from "./content.js";

const isNum=v=>typeof v==="number"&&Number.isFinite(v);

function mergeMax(a,b,newerIsA){
  const out={};
  for(const k of new Set([...Object.keys(a||{}),...Object.keys(b||{})])){
    const x=a&&a[k],y=b&&b[k];
    out[k]=isNum(x)&&isNum(y)?Math.max(x,y):(newerIsA?(x!==undefined?x:y):(y!==undefined?y:x));
  }
  return out;
}
function mergeDevMap(a,b,newerIsA){
  const out={};
  for(const d of new Set([...Object.keys(a||{}),...Object.keys(b||{})]))out[d]=mergeMax(a&&a[d],b&&b[d],newerIsA);
  return out;
}
function mergeLg(a,b){
  a=Object.assign(defaultLg(),a);b=Object.assign(defaultLg(),b);
  let res;
  if(a.t!==b.t){
    const w=a.t>b.t?a:b,l=w===a?b:a;
    res=Object.assign({},l,w);
    res.spent=(w.probe===l.probe&&w.open===l.open)?Math.max(a.spent,b.spent):w.spent;
  }else{
    res=Object.assign({},a,b,{probe:a.probe||b.probe,open:a.open||b.open,spent:Math.max(a.spent,b.spent)});
  }
  res.trial=a.trial>b.trial?a.trial:b.trial;
  res.t=Math.max(a.t,b.t);
  return res;
}
// Der Wert mit dem größeren Zeitstempel t gewinnt. Bei Gleichstand entscheidet die Textform (unabhängig von der Reihenfolge).
function newerBy(a,b){
  if(!a)return b===undefined?null:b;if(!b)return a;
  const ta=a.t||0,tb=b.t||0;
  if(ta!==tb)return ta>tb?a:b;
  return canon(a)>=canon(b)?a:b;
}
function mergeLast(a,b){
  const seen=new Map();
  for(const e of [...(a||[]),...(b||[])])seen.set(e.t+"|"+(e.d||""),e);
  return [...seen.values()].sort((x,y)=>x.t-y.t||String(x.d).localeCompare(String(y.d))).slice(-MASTER_N);
}

export function mergeProfile(local,remote){
  const lr=local.meta.resetAt||0,rr=remote.meta.resetAt||0;
  if(lr!==rr){
    const w=clone(lr>rr?local:remote);
    w.meta.deviceId=local.meta.deviceId;w.meta.schemaVersion=SCHEMA_VERSION;
    return w;
  }
  const aNewer=(local.meta.updatedAt||0)>=(remote.meta.updatedAt||0);
  const n=aNewer?local:remote,o=aNewer?remote:local;
  const out=Object.assign(clone(o),clone(n));

  const created=Math.min(local.meta.createdAt||Infinity,remote.meta.createdAt||Infinity);
  out.meta=Object.assign({},o.meta,n.meta,{
    schemaVersion:SCHEMA_VERSION,deviceId:local.meta.deviceId,rev:local.meta.rev,
    updatedAt:Math.max(local.meta.updatedAt||0,remote.meta.updatedAt||0),
    createdAt:created===Infinity?0:created,resetAt:lr});
  out.profile=clone((local.profile.t||0)>=(remote.profile.t||0)?local.profile:remote.profile);
  out.profile.avatar=clone(newerBy(local.profile.avatar,remote.profile.avatar));
  out.profile.avatarAsked=!!(local.profile.avatarAsked||remote.profile.avatarAsked);

  const lp=local.progress,rp=remote.progress;
  const lg={};
  for(const id of new Set([...Object.keys(lp.lg||{}),...Object.keys(rp.lg||{})]))lg[id]=mergeLg(lp.lg&&lp.lg[id],rp.lg&&rp.lg[id]);
  out.progress=Object.assign({},clone(o.progress),clone(n.progress),{
    dev:mergeDevMap(lp.dev,rp.dev,aNewer),
    days:[...new Set([...(lp.days||[]),...(rp.days||[])])].sort().slice(-120),
    lg,sel:n.progress.sel,cur:clone(newerBy(lp.cur,rp.cur)||{li:null,t:0})});

  const stats={};
  for(const t of new Set([...Object.keys(local.stats||{}),...Object.keys(remote.stats||{})])){
    const x=local.stats[t]||{},y=remote.stats[t]||{};
    stats[t]=Object.assign({},clone(y),clone(x),{tot:mergeDevMap(x.tot,y.tot,aNewer),last:mergeLast(x.last,y.last)});
    if(x.help||y.help)stats[t].help=mergeDevMap(x.help,y.help,aNewer);
    if(x.ctl||y.ctl)stats[t].ctl=mergeDevMap(x.ctl,y.ctl,aNewer);
  }
  out.stats=stats;

  const hist=new Map();
  for(const h of [...(local.history||[]),...(remote.history||[])])hist.set(h.id,h);
  out.history=[...hist.values()].sort((x,y)=>(x.t||0)-(y.t||0)||String(x.id).localeCompare(String(y.id))).slice(-200);

  out.settings=clone((local.settings.t||0)>=(remote.settings.t||0)?local.settings:remote.settings);
  return out;
}

export function mergeGlobal(local,remote){
  const lt=local.pin?local.pin.t||0:-1,rt=remote.pin?remote.pin.t||0:-1;
  const aNewer=(local.updatedAt||0)>=(remote.updatedAt||0);
  const n=aNewer?local:remote,o=aNewer?remote:local;
  const out=Object.assign(clone(o),clone(n));
  out.schemaVersion=GLOBAL_SCHEMA_VERSION;
  out.pin=clone(lt>=rt?local.pin:remote.pin);
  out.trainer=clone(newerBy(local.trainer||defaultTrainer(),remote.trainer||defaultTrainer()));
  out.trainer2=clone(newerBy(local.trainer2||defaultTrainer2(),remote.trainer2||defaultTrainer2()));
  out.updatedAt=Math.max(local.updatedAt||0,remote.updatedAt||0);
  return out;
}
