// Bausteine der Bild-Aufbereitung (nur beim Entwickeln): Freistellen, Bereiche finden, Basis und Umfärb-Ebene schreiben.
// Arbeitet auf einem Ausschnitt {w,h,data(RGBA)} mit Masken als Uint8Array (0 oder 1).
export const lumOf=(r,g,b)=>0.299*r+0.587*g+0.114*b;
export const clamp=(v,a=0,b=255)=>v<a?a:v>b?b:v;

export function crop(im,x0,y0,x1,y1){
  const w=x1-x0,h=y1-y0,data=Buffer.alloc(w*h*4);
  for(let y=0;y<h;y++)im.data.copy(data,y*w*4,((y0+y)*im.w+x0)*4,((y0+y)*im.w+x1)*4);
  return{w,h,x0,y0,data};
}
// Maske aller Punkte, die test(r,g,b,x,y) erfüllen (x und y in Quellkoordinaten des Bildes).
export function maskOf(f,test){
  const m=new Uint8Array(f.w*f.h);
  for(let y=0;y<f.h;y++)for(let x=0;x<f.w;x++){const o=(y*f.w+x)*4;if(test(f.data[o],f.data[o+1],f.data[o+2],x+f.x0,y+f.y0))m[y*f.w+x]=1;}
  return m;
}
// Zusammenhängende Fläche ab Startpunkten (4er-Nachbarschaft) innerhalb der Maske.
export function flood(f,mask,seeds){
  const out=new Uint8Array(mask.length),st=[];
  for(const[x,y]of seeds){const i=(y-f.y0)*f.w+(x-f.x0);if(mask[i]&&!out[i]){out[i]=1;st.push(i);}}
  while(st.length){
    const i=st.pop(),x=i%f.w,y=(i-x)/f.w;
    if(x>0&&mask[i-1]&&!out[i-1]){out[i-1]=1;st.push(i-1);}
    if(x<f.w-1&&mask[i+1]&&!out[i+1]){out[i+1]=1;st.push(i+1);}
    if(y>0&&mask[i-f.w]&&!out[i-f.w]){out[i-f.w]=1;st.push(i-f.w);}
    if(y<f.h-1&&mask[i+f.w]&&!out[i+f.w]){out[i+f.w]=1;st.push(i+f.w);}
  }
  return out;
}
// Hintergrund: alles, was vom Rand aus über passende Punkte erreichbar ist
export function floodFromBorder(f,mask){
  const seeds=[];
  for(let x=0;x<f.w;x++){seeds.push([x+f.x0,f.y0],[x+f.x0,f.y0+f.h-1]);}
  for(let y=0;y<f.h;y++){seeds.push([f.x0,y+f.y0],[f.x0+f.w-1,y+f.y0]);}
  return flood(f,mask,seeds);
}
export const and=(a,b)=>{const o=new Uint8Array(a.length);for(let i=0;i<a.length;i++)o[i]=a[i]&b[i];return o;};
export const or=(a,b)=>{const o=new Uint8Array(a.length);for(let i=0;i<a.length;i++)o[i]=a[i]|b[i];return o;};
export const not=a=>{const o=new Uint8Array(a.length);for(let i=0;i<a.length;i++)o[i]=a[i]?0:1;return o;};
export const andNot=(a,b)=>{const o=new Uint8Array(a.length);for(let i=0;i<a.length;i++)o[i]=a[i]&&!b[i]?1:0;return o;};
// Verkleinern/Vergrößern um r Punkte (Quadrat, getrennt in Zeilen und Spalten)
function pass(m,w,h,r,horiz,keepIf){
  const o=new Uint8Array(m.length);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    let c=0,n=0;
    for(let d=-r;d<=r;d++){
      const xx=horiz?x+d:x,yy=horiz?y:y+d;
      if(xx<0||yy<0||xx>=w||yy>=h){n++;continue;}
      n++;c+=m[yy*w+xx];
    }
    o[y*w+x]=keepIf(c,n)?1:0;
  }
  return o;
}
export const dilate=(f,m,r)=>r?pass(pass(m,f.w,f.h,r,true,c=>c>0),f.w,f.h,r,false,c=>c>0):m;
export const erode=(f,m,r)=>r?pass(pass(m,f.w,f.h,r,true,(c,n)=>c===n),f.w,f.h,r,false,(c,n)=>c===n):m;
export function box(f,m,rect){ // nur Punkte im Rechteck [x0,y0,x1,y1] (Quellkoordinaten)
  const o=new Uint8Array(m.length);
  for(let y=0;y<f.h;y++)for(let x=0;x<f.w;x++){const X=x+f.x0,Y=y+f.y0;if(m[y*f.w+x]&&X>=rect[0]&&X<rect[2]&&Y>=rect[1]&&Y<rect[3])o[y*f.w+x]=1;}
  return o;
}
export const count=m=>{let c=0;for(const v of m)c+=v;return c;};
// weiche Kanten: Mittelwert 3x3 der Maske (0 bis 255)
export function soften(f,m){
  const o=new Uint8Array(m.length);
  for(let y=0;y<f.h;y++)for(let x=0;x<f.w;x++){
    let s=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<f.w&&yy<f.h)s+=m[yy*f.w+xx];}
    o[y*f.w+x]=Math.round(s*255/9);
  }
  return o;
}
// Schließen: kleine Lücken in einer Fläche füllen (erst vergrößern, dann verkleinern)
export const close=(f,m,r)=>erode(f,dilate(f,m,r),r);
