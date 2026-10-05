// Darstellung der Aufgabenart "slots" (ab 1.7.2): Ballsäcke, Passkette, Rechenkreis. Reine Zeichenfunktionen, kein DOM, keine Daten.
// Eine Aufgabe hat Felder zum Ausfüllen (cells mit slot: Nummer) und feste Zahlen (fix). Das aktive Feld (G.act) ist hervorgehoben,
// ein Tipp auf ein Feld hat data-slot (app.js setzt dann G.act). Nach der Antwort zeigen die Felder richtig oder falsch.
import {esc} from "./util.js";

const INK="#16271c",GOLD="#ffc83d",SKY="#2f6fde";
// Zustand eines Feldes: Wert (Text), aktiv, richtig oder falsch (erst nach der Antwort)
function stateOf(T,G,j){
  const vals=G.done?(Array.isArray(G.given)?G.given:[]):G.inp||[];
  const v=vals[j]===undefined||vals[j]===null?"":String(vals[j]);
  return{v,act:!G.done&&G.act===j,right:G.done&&v!==""&&Number(v)===T.a[j],wrong:G.done&&(v===""||Number(v)!==T.a[j])};
}
const fillOf=s=>s.right?"#d7f5df":s.wrong?"#ffd9d4":"#fff";

// ---------- Feld als Kreis in einer Zeichnung ----------
function slotCircle(T,G,j,cx,cy,r){
  const s=stateOf(T,G,j),label=(T.labels&&T.labels[j])||"Feld";
  return `<g data-slot="${j}" role="button" tabindex="0" aria-label="${esc(label)}${s.v?": "+esc(s.v):", leer"}" style="cursor:pointer">`
    +`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fillOf(s)}" stroke="${s.act?SKY:INK}" stroke-width="${s.act?6:3}"/>`
    +(s.act?`<circle cx="${cx}" cy="${cy}" r="${r+6}" fill="none" stroke="#cfe0ff" stroke-width="5"/>`:"")
    +`<text x="${cx}" y="${cy+9}" text-anchor="middle" font-size="${r*0.95}" font-family="Lilita One,Arial Rounded MT Bold,sans-serif" fill="${INK}">${esc(s.v)}</text></g>`;
}
function fixCircle(v,cx,cy,r,fill="#e8f1ea"){
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${INK}" stroke-width="3"/>`
    +`<text x="${cx}" y="${cy+9}" text-anchor="middle" font-size="${r*0.95}" font-family="Lilita One,Arial Rounded MT Bold,sans-serif" fill="${INK}">${v}</text>`;
}
const cellCircle=(T,G,c,cx,cy,r)=>c.slot!==undefined?slotCircle(T,G,c.slot,cx,cy,r):fixCircle(c.fix,cx,cy,r);

// ---------- Ballsäcke ----------
// n Säcke in Reihen zu je 5, auf jedem Sack steht die Zahl k gut sichtbar. Darunter die Malaufgabe mit zwei Feldern.
export function sacksSVG(n,k){
  const per=5,w=96,h=112,rows=Math.ceil(n/per),W=Math.min(n,per)*w+8,H=rows*h+8;
  let s=`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="max-width:100%;height:auto" role="img" aria-label="${n} ${n===1?"Sack":"Säcke"} mit je ${k} Bällen">`;
  for(let i=0;i<n;i++){
    const x=4+(i%per)*w,y=4+Math.floor(i/per)*h;
    s+=`<g transform="translate(${x},${y})"><path d="M20 24 Q48 6 76 24 L86 98 Q48 110 10 98 Z" fill="#d9b277" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`
      +`<rect x="34" y="10" width="28" height="10" rx="5" fill="#a77d3f" stroke="${INK}" stroke-width="2"/>`
      +`<circle cx="48" cy="64" r="26" fill="#fff" stroke="${INK}" stroke-width="3"/>`
      +`<path d="M48 46 L58 53 L54 65 L42 65 L38 53 Z" fill="${INK}" opacity=".12"/>`
      +`<text x="48" y="74" text-anchor="middle" font-size="${k>=10?26:30}" font-family="Lilita One,Arial Rounded MT Bold,sans-serif" fill="${INK}">${k}</text></g>`;
  }
  return s+"</svg>";
}
function sacksHTML(T,G){
  const {n,k}=T.sacks,sl=j=>{const s=stateOf(T,G,j);
    return `<span class="ans slotbox ${s.act?"act":""} ${s.right?"right":""} ${s.wrong?"wrong":""}" data-slot="${j}" role="button" tabindex="0" aria-label="${esc(T.labels[j])}${s.v?": "+esc(s.v):", leer"}">${s.v?esc(s.v):"&nbsp;"}</span>`;};
  return `<div class="vis sm slotvis">${sacksSVG(n,k)}</div>`
    +`<div class="pairrow slotsrow">${sl(0)}<span>·</span><span class="fixbox">${k}</span><span>=</span>${sl(1)}</div>`;
}

// ---------- Passkette: zehn Spieler im Kreis, der Ball läuft im Uhrzeigersinn ----------
export function chainSVG(T,G){
  const cells=T.cells,n=cells.length,cx=210,cy=210,R0=150,r=27;
  const pos=i=>{const a=-Math.PI/2+i*2*Math.PI/n;return[cx+R0*Math.cos(a),cy+R0*Math.sin(a)];};
  let s=`<svg viewBox="0 0 420 420" width="420" height="420" style="max-width:100%;height:auto" role="group" aria-label="Passkette mit ${n} Kreisen">`;
  s+=`<circle cx="${cx}" cy="${cy}" r="${R0-r-18}" fill="#e8f5ea" stroke="#bcd9c2" stroke-width="2"/>`;
  for(let i=0;i<n;i++){ // Pfeile von Kreis zu Kreis
    const [x1,y1]=pos(i),[x2,y2]=pos((i+1)%n),dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len;
    const ax=x1+ux*(r+4),ay=y1+uy*(r+4),bx=x2-ux*(r+6),by=y2-uy*(r+6);
    s+=`<line x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="${INK}" stroke-width="3"/>`
      +`<polygon points="${bx.toFixed(1)},${by.toFixed(1)} ${(bx-ux*10+uy*6).toFixed(1)},${(by-uy*10-ux*6).toFixed(1)} ${(bx-ux*10-uy*6).toFixed(1)},${(by-uy*10+ux*6).toFixed(1)}" fill="${INK}"/>`;
  }
  cells.forEach((c,i)=>{const [x,y]=pos(i);s+=i===0&&c.fix!==undefined?fixCircle(c.fix,x.toFixed(1),y.toFixed(1),r,"#fff0b8"):cellCircle(T,G,c,x.toFixed(1),y.toFixed(1),r);}); // der Anpfiff ist gelb
  s+=`<text x="${cx}" y="${cy-4}" text-anchor="middle" font-size="26" font-family="Lilita One,Arial Rounded MT Bold,sans-serif" fill="${INK}">${T.chain.row}er-Reihe</text>`
    +`<text x="${cx}" y="${cy+26}" text-anchor="middle" font-size="20" fill="#5b6b60">Anpfiff oben</text></svg>`;
  return s;
}

// ---------- Rechenkreis: Zielscheibe mit Mitte "· k", innerem und äußerem Ring ----------
export function wheelSVG(T,G){
  const {row,back}=T.wheel,n=T.cells.inner.length,cx=220,cy=220,rIn=100,rOut=170,rc=26;
  const ang=i=>-Math.PI/2+i*2*Math.PI/n,at=(rad,i)=>[cx+rad*Math.cos(ang(i)),cy+rad*Math.sin(ang(i))];
  let s=`<svg viewBox="0 0 440 440" width="440" height="440" style="max-width:100%;height:auto" role="group" aria-label="Rechenkreis mal ${row}">`;
  s+=`<circle cx="${cx}" cy="${cy}" r="214" fill="#fff" stroke="${INK}" stroke-width="4"/>`
    +`<circle cx="${cx}" cy="${cy}" r="136" fill="#eaf6ec" stroke="${INK}" stroke-width="3"/>`
    +`<circle cx="${cx}" cy="${cy}" r="62" fill="${GOLD}" stroke="${INK}" stroke-width="4"/>`;
  for(let i=0;i<n;i++){const a=ang(i)+Math.PI/n,x1=cx+62*Math.cos(a),y1=cy+62*Math.sin(a),x2=cx+214*Math.cos(a),y2=cy+214*Math.sin(a);
    s+=`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#9fb8a5" stroke-width="2"/>`;}
  s+=`<text x="${cx}" y="${cy+16}" text-anchor="middle" font-size="46" font-family="Lilita One,Arial Rounded MT Bold,sans-serif" fill="${INK}">· ${row}</text>`;
  T.cells.inner.forEach((c,i)=>{const [x,y]=at(rIn,i);s+=cellCircle(T,G,c,x.toFixed(1),y.toFixed(1),rc);});
  T.cells.outer.forEach((c,i)=>{const [x,y]=at(rOut,i);s+=cellCircle(T,G,c,x.toFixed(1),y.toFixed(1),rc);});
  return s+"</svg>";
}

// Alle Felder der Aufgabe in der Reihenfolge, in der der Zahlenblock sie anspringt (Feld 0, 1, 2 ...)
export const slotCount=T=>Array.isArray(T.a)?T.a.length:0;

// Eingabe-HTML ohne Zahlenblock (den setzt views.js darunter)
export function slotsHTML(T,G){
  if(T.kind==="sacks")return sacksHTML(T,G);
  if(T.kind==="chain")return `<div class="vis slotvis chainvis">${chainSVG(T,G)}</div>`;
  return `<div class="vis slotvis wheelvis">${wheelSVG(T,G)}</div>`;
}
