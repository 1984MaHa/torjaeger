// Lokale Speicherung: IndexedDB (ein Objektspeicher "docs", Schlüssel → Wert).
// Ist IndexedDB nicht nutzbar (z. B. privater Modus), läuft die App mit einem Speicher im Arbeitsspeicher
// weiter und meldet das über store.persistent === false.
const DB="torjaeger",STORE="docs";

export function memoryStore(){
  const m=new Map();
  return{persistent:false,
    async get(k){return m.has(k)?JSON.parse(m.get(k)):undefined;},
    async put(k,v){m.set(k,JSON.stringify(v));},
    async del(k){m.delete(k);},
    async keys(prefix=""){return[...m.keys()].filter(k=>k.startsWith(prefix));}};
}

export async function openStore(){
  try{
    if(!globalThis.indexedDB)throw new Error("kein IndexedDB");
    const db=await new Promise((res,rej)=>{
      const r=indexedDB.open(DB,1);
      r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE);};
      r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);r.onblocked=()=>rej(new Error("blockiert"));
    });
    const tx=(mode,fn)=>new Promise((res,rej)=>{
      const t=db.transaction(STORE,mode),os=t.objectStore(STORE);let out;
      out=fn(os);t.oncomplete=()=>res(out&&"result" in out?out.result:undefined);t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error);
    });
    try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist();}catch(e){}
    return{persistent:true,
      get:k=>tx("readonly",os=>os.get(k)),
      put:(k,v)=>tx("readwrite",os=>os.put(JSON.parse(JSON.stringify(v)),k)),
      del:k=>tx("readwrite",os=>os.delete(k)),
      keys:async(prefix="")=>{const all=await tx("readonly",os=>os.getAllKeys());return all.filter(k=>String(k).startsWith(prefix));}};
  }catch(e){
    console.warn("IndexedDB nicht verfügbar, Speicher nur im Arbeitsspeicher:",e);
    return memoryStore();
  }
}

// Schreibfehler abfangen: ein Speichern wird mehrmals versucht, danach alle paar Sekunden weiter, bis es klappt.
// Solange etwas nicht gespeichert ist, meldet onState(false) (die App zeigt einen deutlichen Hinweis), nach Erfolg onState(true).
// put() wirft nie: Der Stand liegt im Arbeitsspeicher, ein späteres Speichern schreibt immer den neuesten Stand des Schlüssels.
// Nur der letzte Wert je Schlüssel wird gemerkt (ein neueres put ersetzt das offene).
export function withRetry(store,{delays=[200,800,2500],again=8000,onState=()=>{},setTimer=setTimeout}={}){
  const pending=new Map(); // Schlüssel -> {value}
  let timer=null,failing=false;
  const state=ok=>{if(failing===!ok)return;failing=!ok;try{onState(ok);}catch(e){}};
  const settle=()=>{if(!pending.size)state(true);};
  async function tryWrite(key,slot){
    try{await store.put(key,slot.value);if(pending.get(key)===slot)pending.delete(key);return true;}catch(e){return false;}
  }
  function later(){
    if(timer||!pending.size)return;
    timer=setTimer(async()=>{
      timer=null;
      for(const [key,slot] of [...pending])await tryWrite(key,slot);
      if(pending.size)later();else settle();
    },again);
    if(timer&&timer.unref)timer.unref();
  }
  const wrapped=Object.assign(Object.create(store),{
    async put(key,value){
      const slot={value};pending.set(key,slot);
      for(let i=0;;i++){
        if(pending.get(key)!==slot)return true; // ein neueres put hat übernommen
        if(await tryWrite(key,slot)){settle();return true;}
        if(i>=delays.length)break;
        await new Promise(r=>{const t=setTimer(r,delays[i]);if(t&&t.unref)t.unref();});
      }
      state(false);later();return false;
    }
  });
  Object.defineProperty(wrapped,"pendingCount",{get:()=>pending.size});
  return wrapped;
}
