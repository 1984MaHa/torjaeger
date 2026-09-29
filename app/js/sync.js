// Abgleich mit dem Server. Läuft im Browser und in Node (Tests), ohne DOM.
//
// Ein Datensatz (rec) ist {id, state, baseRev, dirty, lastSync}:
//   state    der lokale Stand (wird von der App direkt verändert und lokal gespeichert)
//   baseRev  Server-Revision, auf der der Stand aufbaut (0 = Server hat noch nichts)
//   dirty    lokale Änderungen, die noch nicht auf dem Server sind
// Ablauf: Server-Stand holen, bei anderer Revision zusammenführen, dann mit baseRev senden. Bei 409 von vorn.
// Das Ergebnis nennt einen Grund, wenn nichts abgeglichen wurde:
//   offline  Server nicht erreichbar (kein Fehler, wird später nachgeholt)
//   reload   App ist veraltet (Server oder Stand hat neuere Schemaversion), App muss neu geladen werden
//   busy     zu viele Konflikte hintereinander
import {migrateProfile,migrateGlobal,UnsupportedSchema} from "./model.js";
import {mergeProfile,mergeGlobal} from "./merge.js";
import {canon} from "./util.js";

class Offline extends Error{}
class Reload extends Error{}

// Vergleichsform ohne Felder, die je Gerät verschieden sein dürfen.
const same=(a,b,kind)=>{
  const strip=x=>{if(kind==="profile"){const y=JSON.parse(JSON.stringify(x));delete y.meta.deviceId;delete y.meta.rev;return y;}return x;};
  return canon(strip(a))===canon(strip(b));
};

export function createSync({store,deviceId,fetchFn,base="",now=()=>Date.now()}){
  const doFetch=fetchFn||((...a)=>globalThis.fetch(...a));
  async function call(method,url,body){
    let res;
    try{
      res=await doFetch(base+url,{method,headers:body?{"Content-Type":"application/json"}:undefined,body:body?JSON.stringify(body):undefined,cache:"no-store"});
    }catch(e){throw new Offline(String(e&&e.message||e));}
    let json=null;try{json=await res.json();}catch(e){}
    return{status:res.status,json};
  }
  const inflight=new Map();
  // Läuft schon ein Abgleich für denselben Datensatz, wird danach genau ein weiterer angehängt.
  function single(key,fn){
    const cur=inflight.get(key);
    if(cur){cur.again=true;return cur.promise;}
    const slot={again:false};
    slot.promise=(async()=>{
      let r;
      do{slot.again=false;r=await fn();}while(slot.again&&r.ok);
      inflight.delete(key);return r;
    })().catch(e=>{inflight.delete(key);throw e;});
    inflight.set(key,slot);return slot.promise;
  }
  const guard=async fn=>{
    try{return await fn();}
    catch(e){
      if(e instanceof Offline)return{ok:false,reason:"offline"};
      if(e instanceof Reload||e instanceof UnsupportedSchema)return{ok:false,reason:"reload"};
      throw e;
    }
  };

  // ----- Konto -----
  function syncProfile(rec,key){
    return single(key||"profile:"+rec.id,()=>guard(async()=>{
      for(let attempt=0;attempt<6;attempt++){
        let r=await call("GET",`/api/profiles/${rec.id}/state`);
        if(r.status===404){
          const name=rec.state&&rec.state.profile?rec.state.profile.name:rec.id;
          const c=await call("POST","/api/profiles",{id:rec.id,name});
          if(c.status!==201&&c.status!==409)throw new Error("Konto anlegen fehlgeschlagen: "+c.status);
          r=await call("GET",`/api/profiles/${rec.id}/state`);
        }
        if(r.status!==200)throw new Error("Abgleich fehlgeschlagen: "+r.status);
        const remote=r.json;
        if(remote.state){
          const rs=migrateProfile(remote.state,{id:rec.id});
          if(!rec.state){rec.state=rs;rec.dirty=false;rec.baseRev=remote.rev;}
          else if(remote.rev!==rec.baseRev){
            const merged=mergeProfile(rec.state,rs);
            rec.dirty=!same(merged,rs,"profile");
            rec.state=merged;rec.baseRev=remote.rev;
          }
          // Wurde ein älterer Stand migriert, muss die neue Form auch zurück auf den Server.
          if(remote.schemaVersion!==rs.meta.schemaVersion)rec.dirty=true;
        }else{rec.baseRev=0;rec.dirty=true;}
        if(!rec.state)return{ok:true,pushed:false};
        rec.state.meta.rev=rec.baseRev;
        await store.put("profile:"+rec.id,rec);
        if(!rec.dirty){rec.lastSync=now();await store.put("profile:"+rec.id,rec);return{ok:true,pushed:false};}
        const payload=JSON.parse(JSON.stringify(rec.state));
        const p=await call("PUT",`/api/profiles/${rec.id}/state`,{baseRev:rec.baseRev,device:deviceId,state:payload});
        if(p.status===200){
          rec.baseRev=p.json.rev;rec.state.meta.rev=p.json.rev;rec.lastSync=now();
          // Hat die App inzwischen weitergespielt, bleibt der Stand dirty und geht beim nächsten Abgleich raus.
          rec.dirty=!same(rec.state,payload,"profile");
          await store.put("profile:"+rec.id,rec);
          return{ok:true,pushed:true};
        }
        if(p.status===409&&p.json&&p.json.reason==="schema_too_old")throw new Reload();
        if(p.status===409)continue;
        throw new Error("Senden fehlgeschlagen: "+p.status);
      }
      return{ok:false,reason:"busy"};
    }));
  }

  // ----- Globale Einstellungen (Eltern-PIN) -----
  function syncGlobal(rec){
    return single("global",()=>guard(async()=>{
      for(let attempt=0;attempt<6;attempt++){
        const r=await call("GET","/api/settings");
        if(r.status!==200)throw new Error("Abgleich fehlgeschlagen: "+r.status);
        const remote=r.json;
        if(remote.settings){
          const rs=migrateGlobal(remote.settings);
          if(remote.rev!==rec.baseRev){
            const merged=mergeGlobal(rec.state,rs);
            rec.dirty=canon(merged)!==canon(rs);rec.state=merged;rec.baseRev=remote.rev;
          }
        }else{rec.baseRev=0;rec.dirty=true;}
        await store.put("global",rec);
        if(!rec.dirty){rec.lastSync=now();await store.put("global",rec);return{ok:true,pushed:false};}
        const sent=canon(rec.state),payload=JSON.parse(JSON.stringify(rec.state));
        const p=await call("PUT","/api/settings",{baseRev:rec.baseRev,device:deviceId,settings:payload});
        if(p.status===200){
          rec.baseRev=p.json.rev;rec.lastSync=now();rec.dirty=canon(rec.state)!==sent;
          await store.put("global",rec);return{ok:true,pushed:true};
        }
        if(p.status===409&&p.json&&p.json.reason==="schema_too_old")throw new Reload();
        if(p.status===409)continue;
        throw new Error("Senden fehlgeschlagen: "+p.status);
      }
      return{ok:false,reason:"busy"};
    }));
  }

  // ----- Kontenliste -----
  async function listRemoteProfiles(){
    return guard(async()=>{
      const r=await call("GET","/api/profiles");
      if(r.status!==200)throw new Error("Kontenliste fehlgeschlagen: "+r.status);
      return{ok:true,profiles:r.json.profiles};
    });
  }
  return{syncProfile,syncGlobal,listRemoteProfiles};
}
