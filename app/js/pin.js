// Eltern-PIN: 4 Ziffern, mit Salz per SHA-256 gehasht (Web Crypto). Es geht um Kinderschutz, nicht um Hochsicherheit.
// Alt-Hash aus dem Prototyp (djb2) wird noch erkannt und beim ersten richtigen Eingeben aufgewertet.
import {randomId} from "./util.js";

const hex=buf=>[...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,"0")).join("");
async function sha256(text){return hex(await globalThis.crypto.subtle.digest("SHA-256",new TextEncoder().encode(text)));}
function djb2(p){let h=5381;const s="torjaeger:"+p;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))>>>0;return "h"+h.toString(36);}

export const validPin=p=>/^\d{4}$/.test(p);

export async function makePin(pin,now=Date.now()){
  const salt=randomId("",16);
  return{algo:"sha256-salt",salt,hash:await sha256(salt+":"+pin),t:now};
}
// Ergebnis: {ok, upgrade}. upgrade ist ein neuer PIN-Eintrag, wenn der alte Hash aufgewertet werden soll.
export async function checkPin(pin,rec,now=Date.now()){
  if(!rec||!validPin(pin))return{ok:false,upgrade:null};
  if(rec.algo==="legacy-djb2")return djb2(pin)===rec.hash?{ok:true,upgrade:await makePin(pin,now)}:{ok:false,upgrade:null};
  return{ok:(await sha256(rec.salt+":"+pin))===rec.hash,upgrade:null};
}
