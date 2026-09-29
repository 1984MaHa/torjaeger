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
