// Bild-Aufbereitung für die festen Figuren-Vorlagen (nur beim Entwickeln, nicht Teil der App).
//   node tools/prepare-figures.mjs [emil|team] [--debug]
// Liest die Originale aus assets-src/, stellt jede Figur frei und schreibt nach app/img/:
//   fig-<id>.png        Grundbild (Haut, Haare, Gesicht, Linien, Schuhe) mit Löchern an den umfärbbaren Stellen
//   fig-<id>-layer.png  Umfärb-Ebene: R = Schattierung (128 = Mitte), G = Bereichsnummer, B = Deckung, A = 255 wo ein Bereich liegt
// und app/img/figures.json mit Maßen und Bereichen. Ablauf und Regeln: README.md, Abschnitt "Figuren-Vorlagen".
import fs from "node:fs";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {readPNG,writePNG} from "./png.mjs";
import * as L from "./fig-lib.mjs";
import CONFIG from "./figures.config.mjs";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const OUT=path.join(ROOT,"app","img"),WORK=path.join(ROOT,".work");
const args=process.argv.slice(2),debug=args.includes("--debug"),only=args.filter(a=>!a.startsWith("--"));
fs.mkdirSync(OUT,{recursive:true});fs.mkdirSync(WORK,{recursive:true});

function loadSource(s){
  const png=path.join(WORK,s.key+".png");
  if(!fs.existsSync(png)){
    if(process.platform!=="win32")throw new Error("Bitte "+s.jpg+" nach "+png+" als PNG umwandeln (zum Beispiel mit ImageMagick).");
    execFileSync("powershell",["-NoProfile","-File",path.join(ROOT,"tools","jpg2png.ps1"),path.join(ROOT,s.jpg),png],{stdio:"inherit"});
  }
  return readPNG(png);
}

// Figuren finden: Hintergrund vom Rand aus wegfluten, die n größten Reste sind die Figuren (von links nach rechts)
function findFigures(im,bgTest,n){
  const f={w:im.w,h:im.h,x0:0,y0:0,data:im.data};
  const bgMask=L.maskOf(f,bgTest),bg=L.floodFromBorder(f,bgMask);
  const lab=new Int32Array(f.w*f.h),comps=[];
  for(let i=0;i<lab.length;i++){
    if(bg[i]||lab[i])continue;
    const id=comps.length+1,st=[i];lab[i]=id;let area=0,x0=1e9,y0=1e9,x1=-1,y1=-1;
    while(st.length){
      const j=st.pop(),x=j%f.w,y=(j-x)/f.w;area++;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;
      for(const k of[x>0?j-1:-1,x<f.w-1?j+1:-1,y>0?j-f.w:-1,y<f.h-1?j+f.w:-1])if(k>=0&&!bg[k]&&!lab[k]){lab[k]=id;st.push(k);}
    }
    comps.push({id,area,x0,y0,x1:x1+1,y1:y1+1});
  }
  const big=comps.sort((a,b)=>b.area-a.area).slice(0,n).sort((a,b)=>a.x0-b.x0);
  return{bg,lab,figs:big};
}

function processFigure(im,src,found,fig,idx){
  const c=found.figs[idx],pad=6;
  const x0=Math.max(0,c.x0-pad),y0=Math.max(0,c.y0-pad),x1=Math.min(im.w,c.x1+pad),y1=Math.min(im.h,c.y1+pad);
  const f=L.crop(im,x0,y0,x1,y1),W=f.w,H=f.h,N=W*H;
  // Figur = die eigene Fläche, dazu Löcher, die in der Config freigegeben sind (zum Beispiel in Creolen)
  const fg=new Uint8Array(N),bgHere=new Uint8Array(N);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const gi=(y+y0)*im.w+(x+x0),i=y*W+x;
    fg[i]=found.lab[gi]===c.id?1:0;bgHere[i]=found.bg[gi]?1:0;
  }
  for(const[hx,hy]of fig.holes||[]){const hole=L.flood(f,L.maskOf(f,src.bgTest),[[hx,hy]]);for(let i=0;i<N;i++)if(hole[i]){fg[i]=0;bgHere[i]=1;}}
  // weiche Kante: Randpunkte bekommen eine Deckung aus ihrer Helligkeit (Linienfarbe gegen Hintergrund)
  const bgL=src.bgLum,outL=L.lumOf(...src.ink),near=L.dilate(f,bgHere,2);
  const alpha=new Uint8Array(N);
  for(let i=0;i<N;i++){
    if(!fg[i]){alpha[i]=0;continue;}
    const o=i*4;alpha[i]=255;
    if(near[i]){
      const lum=L.lumOf(f.data[o],f.data[o+1],f.data[o+2]),a=L.clamp((bgL-lum)/(bgL-outL),0,1);
      if(a<.98){alpha[i]=Math.round(a*255);f.data[o]=src.ink[0];f.data[o+1]=src.ink[1];f.data[o+2]=src.ink[2];}
    }
  }
  // Bereiche
  const ctx={f,fg:fg,L};
  const regions=[],taken=new Uint8Array(N);
  for(const r of fig.regions){
    let m=r.mask(ctx);m=L.andNot(m,taken);m=L.and(m,fg);
    const cnt=L.count(m);if(!cnt)throw new Error(fig.id+": Bereich "+r.id+" ist leer");
    for(let i=0;i<N;i++)if(m[i])taken[i]=1;
    let sum=0;for(let i=0;i<N;i++)if(m[i]){const o=i*4;sum+=L.lumOf(f.data[o],f.data[o+1],f.data[o+2]);}
    regions.push({id:r.id,label:r.label,mask:m,mean:sum/cnt,flat:r.flat||[],k:r.k??.75,area:cnt});
  }
  // Ebene und Grundbild
  const layer={w:W,h:H,data:Buffer.alloc(N*4)},base={w:W,h:H,data:Buffer.from(f.data)};
  const cover=new Uint8Array(N),shade=new Uint8Array(N),rid=new Uint8Array(N);
  regions.forEach((r,ri)=>{
    const soft=L.soften(f,r.mask);
    for(let i=0;i<N;i++){
      if(!soft[i]||!fg[i])continue;
      const o=i*4,lum=L.lumOf(f.data[o],f.data[o+1],f.data[o+2]);
      const x=i%W+x0,y=((i/W)|0)+y0;
      const inFlat=r.flat.some(b=>x>=b[0]&&x<b[2]&&y>=b[1]&&y<b[3]);
      let s=128*(1+r.k*(lum/r.mean-1));if(inFlat)s=128;
      if(soft[i]>cover[i]){cover[i]=soft[i];rid[i]=ri+1;shade[i]=L.clamp(Math.round(s),30,235);}
    }
  });
  for(let i=0;i<N;i++){
    const o=i*4;
    if(alpha[i]===0){base.data[o+3]=0;continue;}
    base.data[o+3]=Math.round(alpha[i]*(1-cover[i]/255));
    if(cover[i]){layer.data[o]=shade[i];layer.data[o+1]=rid[i];layer.data[o+2]=cover[i];layer.data[o+3]=255;}
  }
  // leere Punkte im Grundbild auf 0 setzen (kleinere Datei)
  for(let i=0;i<N;i++){const o=i*4;if(base.data[o+3]===0){base.data[o]=base.data[o+1]=base.data[o+2]=0;}}
  return{base,layer,W,H,box:[x0,y0,x1,y1],regions:regions.map(r=>({id:r.id,label:r.label,mean:Math.round(r.mean),area:r.area}))};
}

// Prüfbild: Figur in mehreren Farbvarianten auf Schachbrett (so rechnet auch die App)
function writeDebug(fig,r){
  const variants=fig.debugColors||[[0,{}]];
  const cw=r.W,gap=10,n=variants.length,out={w:(cw+gap)*n,h:r.H,data:Buffer.alloc((cw+gap)*n*r.H*4)};
  variants.forEach(([,pal],vi)=>{
    for(let y=0;y<r.H;y++)for(let x=0;x<cw;x++){
      const i=y*cw+x,o=i*4,chk=((x>>4)+(y>>4))&1?200:235;
      let R=chk,G=chk,B=chk;
      if(r.layer.data[o+3]){
        const s=r.layer.data[o]/128,c=pal&&pal[fig.regions[r.layer.data[o+1]-1].id];
        if(c){const cv=c.map(v=>s<=1?v*s:v+(255-v)*(s-1)*.5),a=r.layer.data[o+2]/255;R=R*(1-a)+cv[0]*a;G=G*(1-a)+cv[1]*a;B=B*(1-a)+cv[2]*a;}
      }
      const ba=r.base.data[o+3]/255;
      R=R*(1-ba)+r.base.data[o]*ba;G=G*(1-ba)+r.base.data[o+1]*ba;B=B*(1-ba)+r.base.data[o+2]*ba;
      const p=(y*out.w+vi*(cw+gap)+x)*4;out.data[p]=R;out.data[p+1]=G;out.data[p+2]=B;out.data[p+3]=255;
    }
  });
  writePNG(path.join(WORK,"dbg-"+fig.id+".png"),out);
}

const dataFile=path.join(ROOT,"app","js","figdata.js");
const manifest={figures:{}};
const kb=f=>Math.round(fs.statSync(f).size/1024);
for(const src of CONFIG.sources){
  if(only.length&&!only.includes(src.key))continue;
  console.log("Quelle",src.key,src.jpg);
  const im=loadSource(src),found=findFigures(im,src.bgTest,src.figures.length);
  src.figures.forEach((fig,idx)=>{
    if(!fig.use&&!debug){console.log(" ",fig.id,"übersprungen (use:false)");return;}
    const r=processFigure(im,src,found,fig,idx);
    if(fig.use){
      writePNG(path.join(OUT,"fig-"+fig.id+".png"),r.base);
      writePNG(path.join(OUT,"fig-"+fig.id+"-layer.png"),r.layer);
      manifest.figures[fig.id]={w:r.W,h:r.H,regions:r.regions.map(x=>x.id),labels:r.regions.map(x=>x.label),bust:fig.bust||null,field:fig.field||null,chest:fig.chest?{cx:fig.chest.local?fig.chest.cx:fig.chest.cx-r.box[0],y:fig.chest.local?fig.chest.y:fig.chest.y-r.box[1],size:fig.chest.size,width:fig.chest.width}:null,logo:fig.logo?[fig.logo[0]-r.box[0],fig.logo[1]-r.box[1],fig.logo[2]-r.box[0],fig.logo[3]-r.box[1]]:null};
    }
    if(debug)writeDebug(fig,r);
    console.log(" ",fig.id,r.W+"x"+r.H,r.regions.map(x=>x.id+":"+x.area).join(" "),fig.use?("Grundbild "+kb(path.join(OUT,"fig-"+fig.id+".png"))+" KB, Ebene "+kb(path.join(OUT,"fig-"+fig.id+"-layer.png"))+" KB"):"");
  });
}
// Maße und Fenster als Modul für die App (nur bei einem Lauf über alle Quellen, sonst fehlen Einträge)
if(!only.length){
  fs.writeFileSync(dataFile,"// Erzeugt von tools/prepare-figures.mjs, nicht von Hand ändern.\n// Maße der Figuren-Bilder (Bildpunkte), Umfärb-Bereiche, Fenster des Brustbildes (bust) und Rückenfeld (field).\nexport const FIGDATA="+JSON.stringify(manifest,null,1)+";\n");
}

// Prüfbild der Brustbilder (runder Ausschnitt auf Pastellgrund) und des Rückenfeldes: .work/dbg-bust.png
if(debug){
  const S=220,items=[];
  for(const src of CONFIG.sources)for(const fig of src.figures){
    if(!fig.use)continue;
    const base=readPNG(path.join(OUT,"fig-"+fig.id+".png")),lay=readPNG(path.join(OUT,"fig-"+fig.id+"-layer.png"));
    items.push({fig,base,lay});
  }
  const out={w:(S+10)*items.length,h:S*2+10,data:Buffer.alloc((S+10)*items.length*(S*2+10)*4,255)};
  items.forEach(({fig,base,lay},k)=>{
    const b=fig.bust;if(!b)return;
    const[wx0,wy0,wx1,wy1]=b,sc=S/(wx1-wx0);
    for(let y=0;y<S;y++)for(let x=0;x<S;x++){
      const dx=x-S/2,dy=y-S/2;if(dx*dx+dy*dy>S*S/4)continue;
      const sx=Math.floor(wx0+x/sc),sy=Math.floor(wy0+y/sc);
      let R=214,G=232,B=255;
      if(sx>=0&&sy>=0&&sx<base.w&&sy<base.h){
        const o=(sy*base.w+sx)*4;
        if(lay.data[o+3]){const s=lay.data[o]/128,a=lay.data[o+2]/255,c=(fig.debugColors[1][1][lay.data[o+1]===1&&fig.regions[0].id]||[200,40,40]).map(v=>s<=1?v*s:v+(255-v)*(s-1)*.5);R=R*(1-a)+c[0]*a;G=G*(1-a)+c[1]*a;B=B*(1-a)+c[2]*a;}
        const ba=base.data[o+3]/255;R=R*(1-ba)+base.data[o]*ba;G=G*(1-ba)+base.data[o+1]*ba;B=B*(1-ba)+base.data[o+2]*ba;
      }
      const p=(y*out.w+k*(S+10)+x)*4;out.data[p]=R;out.data[p+1]=G;out.data[p+2]=B;
    }
  });
  writePNG(path.join(WORK,"dbg-bust.png"),out);
}
