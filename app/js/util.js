// Kleine Hilfen ohne Abhängigkeiten (laufen im Browser und in Node).
export const R=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
export const pick=a=>a[Math.floor(Math.random()*a.length)];
export const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
export const fmt=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g," ");
export const dkey=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
export const todayKey=(now=Date.now())=>dkey(new Date(now));
export const clone=o=>JSON.parse(JSON.stringify(o));

// Stabile Textform (Schlüssel sortiert), um Stände zuverlässig zu vergleichen.
export function canon(v){
  if(Array.isArray(v))return"["+v.map(canon).join(",")+"]";
  if(v&&typeof v==="object")return"{"+Object.keys(v).sort().map(k=>JSON.stringify(k)+":"+canon(v[k])).join(",")+"}";
  return JSON.stringify(v);
}

// Zufällige Kennung, z. B. für Geräte und Konten (nur a-z, 0-9).
export function randomId(prefix,len=8){
  const chars="abcdefghijklmnopqrstuvwxyz0123456789";let s="";
  const c=globalThis.crypto;
  if(c&&c.getRandomValues){const b=new Uint8Array(len);c.getRandomValues(b);for(const x of b)s+=chars[x%chars.length];}
  else for(let i=0;i<len;i++)s+=chars[Math.floor(Math.random()*chars.length)];
  return prefix+s;
}

// Text für innerHTML entschärfen (Kontonamen sind Eingaben).
export const esc=t=>String(t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
