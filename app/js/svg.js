// Grafiken als SVG-Strings (Ball, Tor, Zehnerstangen, Stellenwerttafel, Punktefeld, Gruppen).
export function ballSVG(s,cls){return `<svg ${cls===false?"":'class="ballx"'} width="${s}" height="${s}" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18" fill="#fff" stroke="#16271c" stroke-width="2.5"/><polygon points="20,12 27,17 24.5,25 15.5,25 13,17" fill="#16271c"/><path d="M20 12V3M27 17l9-3M24.5 25l5.5 8M15.5 25L10 33M13 17l-9-3" stroke="#16271c" stroke-width="2.5" fill="none"/></svg>`;}
export function blocksSVG(z,e){const u=18,gap=7,w=10*u+10,h=Math.max(1,z)*(u+gap)+(e?u+16:0)+6;let s=`<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${z} Zehnerstangen und ${e} Einerwürfel">`;let y=4;
  for(let i=0;i<z;i++){for(let k=0;k<10;k++)s+=`<rect x="${5+k*u}" y="${y}" width="${u}" height="${u}" fill="#9fc3a9" stroke="#16271c" stroke-width="1.5"/>`;y+=u+gap;}
  y=z?y+6:4;for(let k=0;k<e;k++)s+=`<rect x="${5+k*(u+6)}" y="${y}" width="${u}" height="${u}" fill="#ffd66b" stroke="#16271c" stroke-width="1.5"/>`;return s+"</svg>";}
export function stwSVG(z,e){const W=300,H=150,cw=W/2;let s=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Stellenwerttafel"><rect x="2" y="2" width="${W-4}" height="${H-4}" fill="#fff" stroke="#16271c" stroke-width="3"/><rect x="2" y="2" width="${W-4}" height="34" fill="#e3f0e6" stroke="#16271c" stroke-width="3"/><line x1="${cw}" y1="2" x2="${cw}" y2="${H-2}" stroke="#16271c" stroke-width="3"/><text x="${cw/2}" y="27" text-anchor="middle" font-size="22" font-family="Andika,sans-serif" font-weight="700" fill="#16271c">Z</text><text x="${cw*1.5}" y="27" text-anchor="middle" font-size="22" font-family="Andika,sans-serif" font-weight="700" fill="#16271c">E</text>`;
  const pl=(n,x0)=>{for(let i=0;i<n;i++)s+=`<circle cx="${x0+22+(i%5)*26}" cy="${62+Math.floor(i/5)*30}" r="10" fill="#16271c"/>`;};pl(z,4);pl(e,cw+4);return s+"</svg>";}
export function fieldSVG(r,c){const d=38,w=c*d+20,h=r*d+20;let s=`<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Punktefeld"><rect x="2" y="2" width="${w-4}" height="${h-4}" rx="10" fill="#fff" stroke="#16271c" stroke-width="3"/>`;
  for(let i=0;i<r;i++)for(let j=0;j<c;j++)s+=`<circle cx="${10+d/2+j*d}" cy="${10+d/2+i*d}" r="12" fill="#16271c"/>`;return s+"</svg>";}
export function groupsSVG(a,b){ // a Punkte in Gruppen zu b
  const q=Math.floor(a/b),r=a%b,d=22,gw=Math.min(b,5)*d+16,rows=Math.ceil(b/5),gh=rows*d+16,per=Math.max(1,Math.floor(560/(gw+10)));
  const n=q+(r?1:0),W=Math.min(n,per)*(gw+10),H=Math.ceil(n/per)*(gh+10);let s=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${a} Punkte">`;
  for(let g=0;g<n;g++){const x=(g%per)*(gw+10),y=Math.floor(g/per)*(gh+10),cnt=g<q?b:r,full=g<q;
    s+=`<rect x="${x+1}" y="${y+1}" width="${gw}" height="${gh}" rx="10" fill="${full?"#fff":"#fff4c9"}" stroke="${full?"#16271c":"#c9951d"}" stroke-width="2" stroke-dasharray="${full?"":"6 4"}"/>`;
    for(let k=0;k<cnt;k++)s+=`<circle cx="${x+9+d/2+(k%5)*d}" cy="${y+9+d/2+Math.floor(k/5)*d}" r="8" fill="#16271c"/>`;}
  return s+"</svg>";}
