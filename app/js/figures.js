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

// ---------- Rücken: Name gebogen über der Nummer, im Rückenfeld ----------
const FONT="Lilita One, Arial Rounded MT Bold, Arial, sans-serif";
export const FONT_FAMILY=FONT;
const NUMW=.66,CAP=.75;
// field = {x0,x1,y0,y1} in Bildpunkten der Figur. Alles bleibt im Feld, der Name wird bei langen Namen kleiner, die Nummer bei zwei Ziffern.
export function backLayout(look,field){
  const name=String(look.shirtName||""),n=String(look.number||""),W=field.x1-field.x0,H=field.y1-field.y0,cx=(field.x0+field.x1)/2;
  const pad=W*.04,Wi=W-2*pad;
  const nameFs=name?+Math.max(W*.07,Math.min(W*.22,Wi/(name.length*.6))).toFixed(1):0,cw=nameFs*.6,R=W*1.1;
  const phiMax=name?((name.length-1)/2*cw)/R:0,drop=name?R*(1-Math.cos(phiMax)):0;
  const letters=[...name].map((ch,i,a)=>{const dx=(i-(a.length-1)/2)*cw,phi=dx/R;
    return{ch,x:+(cx+R*Math.sin(phi)).toFixed(1),y:+(field.y0+nameFs*.9+R*(1-Math.cos(phi))).toFixed(1),rot:+(phi*180/Math.PI).toFixed(1)};});
  const nameBottom=name?field.y0+nameFs*.9+drop+nameFs*.2:field.y0;
  const base=field.y1-H*.03,avail=base-nameBottom-(name?H*.04:0);
  const numFs=+Math.max(8,Math.min(Wi/(Math.max(1,n.length)*NUMW),avail/CAP,H*.52)).toFixed(1);
  return{
    name:{text:name,size:nameFs,letters,top:+(field.y0+nameFs*.9-nameFs*CAP).toFixed(1),bottom:+nameBottom.toFixed(1),width:+(name.length*cw).toFixed(1)},
    num:{text:n,x:cx,y:+base.toFixed(1),size:numFs,width:+(n.length*numFs*NUMW).toFixed(1),top:+(base-numFs*CAP).toFixed(1)}
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
