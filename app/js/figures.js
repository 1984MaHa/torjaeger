// Figuren aus festen Bild-Vorlagen: Umfärben der Bereiche (Trikot, Hose, ...), Name und Nummer auf dem Rücken.
// Jede Figur besteht aus zwei Bildern (app/img): dem Grundbild (Haut, Haare, Gesicht, Linien, Schuhe, mit Löchern an den
// umfärbbaren Stellen) und der Umfärb-Ebene (R = Schattierung, 128 = Mitte; G = Bereichsnummer; B = Deckung; A = 255 im Bereich).
// Zur Laufzeit wird die Ebene in der gewählten Farbe eingefärbt (Falten und Schatten bleiben), das Grundbild darübergelegt und
// das Ergebnis je Farbkombination zwischengespeichert. Die Rechenschritte sind reine Funktionen und laufen auch im Test.
import {FIGDATA} from "./figdata.js";

export const figInfo=id=>FIGDATA.figures[id];
export const FIG_IDS=Object.keys(FIGDATA.figures);

export function hexToRgb(h){const n=parseInt(String(h).slice(1),16);return[(n>>16)&255,(n>>8)&255,n&255];}
const lin=v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);};
export const luminance=h=>{const[r,g,b]=hexToRgb(h);return .2126*lin(r)+.7152*lin(g)+.0722*lin(b);};
export const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
export const INK_DARK="#0b0d10",INK_LIGHT="#ffffff";
// Schriftfarbe auf einer Trikotfarbe: hell oder dunkel, je nachdem, was mehr Kontrast gibt
export const textOn=h=>contrast(h,INK_LIGHT)>=contrast(h,INK_DARK)?INK_LIGHT:INK_DARK;

// Ein Punkt der Umfärb-Ebene in Farbe c (rgb) bei Schattierung s (0 bis 255, 128 = Farbe unverändert): dunkler multipliziert, heller mischt Weiß bei.
export function shadeChannel(v,s){const t=s/128;return t<=1?v*t:v+(255-v)*(t-1)*.5;}
// Färbt die Ebene ein. layer und Ergebnis sind RGBA (w*h*4). colors[i] ist die Farbe (#rrggbb) des Bereichs mit Nummer i+1.
export function tintLayer(layer,w,h,colors){
  const rgb=colors.map(hexToRgb),out=new Uint8ClampedArray(w*h*4);
  for(let i=0;i<w*h;i++){
    const o=i*4;
    if(layer[o+3]<255)continue;
    const c=rgb[layer[o+1]-1];if(!c)continue;
    const s=layer[o];
    out[o]=shadeChannel(c[0],s);out[o+1]=shadeChannel(c[1],s);out[o+2]=shadeChannel(c[2],s);out[o+3]=layer[o+2];
  }
  return out;
}

// ---------- Rücken: Mannschaft, Name gebogen über der Nummer, im Rückenfeld ----------
const FONT="Lilita One, Arial Rounded MT Bold, Arial, sans-serif";
export const FONT_FAMILY=FONT;
const NUMW=.66,CAP=.75;
// Breite eines Buchstabens (in Schriftgrößen): schmale wie I und Punkt, breite wie M und W. So stehen die Buchstaben gleichmäßig.
const NARROW={"I":.32,"J":.5," ":.34,".":.3,"'":.26,"-":.42,"1":.44,"L":.56,"F":.56,"T":.6,"E":.58,"Z":.6};
const WIDE={"M":.86,"W":.96,"Ä":.68,"Ö":.7,"Ü":.7};
export const charW=ch=>{const u=ch.toUpperCase();return NARROW[u]??WIDE[u]??.64;};
export const textWidth=t=>[...t].reduce((n,ch)=>n+charW(ch),0);
const textW=(t,fs)=>[...t].reduce((n,ch)=>n+charW(ch)*fs,0);
// Buchstaben auf einem flachen Bogen (Mitte oben, die Ränder etwas tiefer). top = obere Kante der Schrift.
function arc(text,fs,R,cx,top){
  const chars=[...text],total=textW(text,fs);let pos=-total/2;
  const letters=chars.map(ch=>{const w=charW(ch)*fs,dx=pos+w/2,phi=dx/R;pos+=w;
    return{ch,x:+(cx+R*Math.sin(phi)).toFixed(1),y:+(top+fs*.9+R*(1-Math.cos(phi))).toFixed(1),rot:+(phi*180/Math.PI).toFixed(1)};});
  const phiMax=text?(total/2)/R:0,drop=text?R*(1-Math.cos(phiMax)):0;
  return{letters,bottom:text?+(top+fs*.9+drop+fs*.2).toFixed(1):top,width:+total.toFixed(1)};
}
// field = {x0,x1,y0,y1} in Bildpunkten der Figur. Oben die Mannschaft (klein), darunter der eigene Name, direkt darunter die Nummer, so groß wie der Platz erlaubt.
// Alles bleibt im Feld: lange Namen werden kleiner, zweistellige Nummern auch, ohne Namen wird die Nummer größer.
export function backLayout(look,field){
  const team=String(look.team||""),name=String(look.shirtName||""),n=String(look.number||"");
  const W=field.x1-field.x0,H=field.y1-field.y0,cx=(field.x0+field.x1)/2,Wi=W*.92;
  const fit=(t,lo,hi)=>t?+Math.max(W*lo,Math.min(W*hi,Wi/textW(t,1))).toFixed(1):0;
  const teamFs=fit(team,.05,.1);
  const T=arc(team,teamFs,W*1.4,cx,field.y0);
  const nameFs=fit(name,.08,.26);
  const N=arc(name,nameFs,W*1.1,cx,T.bottom+(team&&name?H*.01:0));
  const gap=name||team?H*.015:0,avail=field.y1-N.bottom-gap;
  const numFs=+Math.max(8,Math.min(Wi/(Math.max(1,n.length)*NUMW),avail/CAP,H*.75)).toFixed(1);
  const base=+(N.bottom+gap+numFs*CAP).toFixed(1); // die Nummer hängt direkt unter dem Namen, nicht am unteren Rand
  return{
    team:{text:team,size:teamFs,letters:T.letters,bottom:T.bottom,width:T.width},
    name:{text:name,size:nameFs,letters:N.letters,top:+(T.bottom).toFixed(1),bottom:N.bottom,width:N.width},
    num:{text:n,x:cx,y:base,size:numFs,width:+(n.length*numFs*NUMW).toFixed(1),top:+(base-numFs*CAP).toFixed(1)}
  };
}

// ---------- Bilder laden, färben, merken ----------
// env: {canvas(w,h), image(url) → Promise, blobURL(bytes) → url, base} . Im Browser wird er beim ersten Gebrauch aus dem Dokument gebaut.
let ENV=null;
export function setFigureEnv(env){ENV=env;STORE.clear();LOADED.clear();}
function browserEnv(){
  if(typeof document==="undefined")return null;
  return{
    base:"img/",
    canvas:(w,h)=>{const c=document.createElement("canvas");c.width=w;c.height=h;return c;},
    image:url=>new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error("Bild fehlt: "+url));i.src=url;}),
    blobURL:bytes=>URL.createObjectURL(new Blob([bytes],{type:"image/png"})),
    revoke:u=>URL.revokeObjectURL(u)
  };
}
const env=()=>ENV||(ENV=browserEnv());
const LOADED=new Map();  // id → {base, layer:Uint8ClampedArray}
const STORE=new Map();   // Schlüssel → url (zuletzt benutzte zuletzt)
const MAX_STORE=80;
export const basePath=id=>"img/fig-"+id+".png";
export const layerPath=id=>"img/fig-"+id+"-layer.png";

// Lädt Grundbild und Ebene der genannten Figuren (Standard: alle). Mehrfaches Aufrufen lädt nichts doppelt.
export function loadFigures(ids=FIG_IDS){
  const e=env();if(!e)return Promise.resolve(false);
  return Promise.all(ids.map(async id=>{
    if(LOADED.has(id))return;
    const info=figInfo(id);if(!info)return;
    const[base,lay]=await Promise.all([e.image((e.base||"img/")+"fig-"+id+".png"),e.image((e.base||"img/")+"fig-"+id+"-layer.png")]);
    const c=e.canvas(info.w,info.h),g=c.getContext("2d",{willReadFrequently:true});
    g.drawImage(lay,0,0);
    LOADED.set(id,{base,layer:g.getImageData(0,0,info.w,info.h).data});
  })).then(()=>true);
}
export const figureReady=id=>LOADED.has(id);

function toBytes(dataURL){
  const b64=dataURL.slice(dataURL.indexOf(",")+1),bin=atob(b64),out=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);
  return out;
}
// Adresse des Bildes einer Figur in den gewählten Farben (colors: {bereich:#rrggbb}). Ist alles geladen, kommt ein fertig gefärbtes
// Bild (Blob-Adresse). Sonst das Grundbild allein, damit nichts bricht.
export function figureURL(id,colors){
  const info=figInfo(id),e=env(),ld=LOADED.get(id);
  if(!info||!e||!ld)return basePath(id);
  const cols=info.regions.map(r=>colors[r]||"#888888"),key=id+"|"+cols.join("");
  const hit=STORE.get(key);
  if(hit){STORE.delete(key);STORE.set(key,hit);return hit;}
  const c=e.canvas(info.w,info.h),g=c.getContext("2d"),img=g.createImageData(info.w,info.h);
  img.data.set(tintLayer(ld.layer,info.w,info.h,cols));
  g.putImageData(img,0,0);g.drawImage(ld.base,0,0);
  const url=e.blobURL(toBytes(c.toDataURL("image/png")));
  STORE.set(key,url);
  while(STORE.size>MAX_STORE){ // die am längsten nicht benutzte Adresse freigeben
    const old=STORE.keys().next().value,u=STORE.get(old);STORE.delete(old);
    if(e.revoke)try{e.revoke(u);}catch(_){}
  }
  return url;
}
export const storeSize=()=>STORE.size;
