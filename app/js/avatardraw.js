// Darstellung von Spieler, Trainerteam und Torszene aus den festen Bild-Vorlagen (Bilder, Umfärben und Rückenfeld: figures.js).
// Alles ist SVG mit einem eingebetteten Bild. Gefärbt wird je Farbkombination einmal, danach kommt die Adresse aus dem Zwischenspeicher.
import {cleanLook,cleanTrainerLook,KID_TEMPLATES,COLOR_NAMES} from "./avatar.js";
import {figInfo,figureURL,backLayout,textOn,textWidth,FONT_FAMILY as FONT} from "./figures.js";
import {esc} from "./util.js";

const INK="#2b2320";
const clamp=v=>Math.max(0,Math.min(255,Math.round(v)));
function mix(h,to,t){const a=parseInt(h.slice(1),16),b=parseInt(to.slice(1),16);const c=s=>clamp(((a>>s)&255)*(1-t)+((b>>s)&255)*t);return"#"+[16,8,0].map(s=>c(s).toString(16).padStart(2,"0")).join("");}
const light=(h,t=.3)=>mix(h,"#ffffff",t);
const lum=h=>{const n=parseInt(h.slice(1),16);return(0.299*(n>>16&255)+0.587*(n>>8&255)+0.114*(n&255))/255;};
const tplOf=id=>KID_TEMPLATES.find(t=>t.id===id)||KID_TEMPLATES[0];
// Hintergrund des runden Brustbildes: heller Ton der Trikotfarbe (bei sehr hellen Trikots ein neutrales Hellgrau)
const bgOf=kit=>lum(kit.trikot)>.82?"#e6e9ec":light(kit.trikot,.78);

// Figur als Bild mit Beschriftung, Bildpunkte der Vorlage (0/0 = links oben). view: front oder back.
// Hinten: Name gebogen über der Nummer im Rückenfeld. Vorn: kleine Nummer auf der Brust (wo das Logo der Vorlage übermalt ist).
export function figureParts(look,view="front"){
  const l=cleanLook(look),tpl=tplOf(l.tpl),id=view==="back"?tpl.back:tpl.front,info=figInfo(id);
  const fg=textOn(l.kit.trikot);
  let g=`<image href="${figureURL(id,l.kit)}" width="${info.w}" height="${info.h}"/>`;
  if(view==="back"&&info.field){
    const B=backLayout(l,info.field);
    g+=`<g data-part="rueckenfeld">`+B.team.letters.map(L=>`<text data-k="team" x="${L.x}" y="${L.y}" text-anchor="middle" font-family="${FONT}" font-size="${B.team.size}" fill="${fg}" fill-opacity=".9" transform="rotate(${L.rot} ${L.x} ${L.y})">${esc(L.ch)}</text>`).join("")+B.name.letters.map(L=>`<text x="${L.x}" y="${L.y}" text-anchor="middle" font-family="${FONT}" font-size="${B.name.size}" fill="${fg}" transform="rotate(${L.rot} ${L.x} ${L.y})">${esc(L.ch)}</text>`).join("")
      +`<text data-k="num" x="${B.num.x}" y="${B.num.y}" text-anchor="middle" font-family="${FONT}" font-size="${B.num.size}" fill="${fg}">${esc(B.num.text)}</text></g>`;
  }
  if(view==="front"&&info.chest){
    const C=info.chest,fs=+Math.min(C.size,C.width/(Math.max(1,l.number.length)*.66)).toFixed(1);
    g+=`<text data-k="chest" x="${C.cx}" y="${C.y}" text-anchor="middle" font-family="${FONT}" font-size="${fs}" fill="${fg}" fill-opacity=".92">${esc(l.number)}</text>`;
  }
  return{id,info,g,look:l};
}
const ariaLook=l=>`Spieler mit Trikot ${COLOR_NAMES[l.kit.trikot]||"bunt"} und Nummer ${l.number}`;

// Brustbild (Kopf und Schultern) im runden Hintergrund aus einem Bild
function bustSVG(id,inner,info,bg,px,label){
  const[x0,y0,x1,y1]=info.bust,S=x1-x0,cid="avc-"+id;
  return `<svg class="avsvg" viewBox="${x0} ${y0} ${S} ${S}" width="${px}" height="${px}" role="img" aria-label="${esc(label)}"><defs><clipPath id="${cid}"><circle cx="${x0+S/2}" cy="${y0+S/2}" r="${S/2}"/></clipPath></defs><circle cx="${x0+S/2}" cy="${y0+S/2}" r="${S/2}" fill="${bg}"/><g clip-path="url(#${cid})">${inner}</g></svg>`;
}

// Vollständige Grafik. crop: "full" (ganze Figur, vorn oder hinten) oder "bust" (Brustbild im runden Hintergrund, für Kacheln).
export function avatarSVG(look,{view="front",px=100,crop="full",label}={}){
  if(crop==="bust"){
    const p=figureParts(look,"front");
    return bustSVG(p.id,`<image href="${figureURL(p.id,p.look.kit)}" width="${p.info.w}" height="${p.info.h}"/>`,p.info,bgOf(p.look.kit),px,label||ariaLook(p.look));
  }
  const p=figureParts(look,view==="back"?"back":"front");
  return `<svg class="avsvg" viewBox="0 0 ${p.info.w} ${p.info.h}" width="${Math.round(px*p.info.w/p.info.h)}" height="${px}" role="img" aria-label="${esc(label||ariaLook(p.look))}">${p.g}</svg>`;
}

// ---------- Trainer und Trainerin (Brustbild aus der Vorlage) ----------
export const TRAINER_FIG={1:"trainer-front",2:"trainerin-front"};
export const TRAINER_BACK={1:"trainer-back",2:"trainerin-back"};
const TRAINER_BG={1:"#d3e2ff",2:"#ffe3c2"};
export function trainerSVG(look,{px=72,label,which=1}={}){
  const l=cleanTrainerLook(look,which),id=TRAINER_FIG[which===2?2:1],info=figInfo(id);
  const inner=`<image href="${figureURL(id,{polo:l.polo,hose:l.hose,stutzen:l.stutzen})}" width="${info.w}" height="${info.h}"/>`;
  return bustSVG(id,inner,info,TRAINER_BG[which===2?2:1],px,label||(which===2?"Trainerin":"Trainer"));
}

// Trainer oder Trainerin als ganze Figur, vorn oder hinten (für die Einstellung im Eltern-Bereich, damit man die Kleidung sieht).
// Der Name steht vorn klein auf der Brust und hinten gebogen auf dem Rücken, in hell oder dunkel je nach Polofarbe.
export function trainerFullSVG(look,{px=260,label,which=1,view="front",name=""}={}){
  const l=cleanTrainerLook(look,which),w2=which===2?2:1,back=view==="back",id=(back?TRAINER_BACK:TRAINER_FIG)[w2],info=figInfo(id),fg=textOn(l.polo);
  let g=`<image href="${figureURL(id,{polo:l.polo,hose:l.hose,stutzen:l.stutzen})}" width="${info.w}" height="${info.h}"/>`;
  const nm=String(name||"");
  if(nm&&!back&&info.chest){
    const C=info.chest,fs=+Math.min(C.size,C.width/textWidth(nm)).toFixed(1);
    g+=`<text data-k="chest" x="${C.cx}" y="${C.y}" text-anchor="middle" font-family="${FONT}" font-size="${fs}" fill="${fg}" fill-opacity=".92">${esc(nm)}</text>`;
  }
  if(nm&&back&&info.field){
    const B=backLayout({shirtName:nm.toUpperCase(),number:"",team:""},info.field);
    g+=`<g data-part="rueckenfeld">`+B.name.letters.map(L=>`<text x="${L.x}" y="${L.y}" text-anchor="middle" font-family="${FONT}" font-size="${B.name.size}" fill="${fg}" transform="rotate(${L.rot} ${L.x} ${L.y})">${esc(L.ch)}</text>`).join("")+"</g>";
  }
  return `<svg class="avsvg" viewBox="0 0 ${info.w} ${info.h}" width="${Math.round(px*info.w/info.h)}" height="${px}" role="img" aria-label="${esc(label||((which===2?"Trainerin":"Trainer")+(back?" von hinten":" von vorn")))}">${g}</svg>`;
}

// ---------- Torszene ----------
// Der Spieler steht mit dem Rücken zur Kamera (Rückansicht der Vorlage, Name und Nummer im Rückenfeld) und macht beim Schuss einen kleinen Satz nach vorn.
// Ausgang: goal (Tor), post (Pfosten), bar (Latte), wide (knapp vorbei).
export const SHOT_KINDS=["goal","post","bar","wide"];
export const SHOT_TEXT={goal:"Tor!",post:"Pfosten!",bar:"Latte!",wide:"Knapp vorbei",saved:"Gehalten!",corner:"Tor! Genau ins Eck!"};
const SHOT_ARIA={corner:"Der Ball schlägt genau im Torwinkel ein.",saved:"Der Torwart hält den Ball.",goal:"Der Ball fliegt ins Tor.",post:"Der Ball trifft den Pfosten.",bar:"Der Ball trifft die Latte.",wide:"Der Ball fliegt knapp am Tor vorbei."};
const POP_TEXT={post:"PLING!",bar:"BONG!",wide:"Uups!",saved:"Gehalten!"};

// Trefferpunkte im Tor (Bildpunkte der Szene, Tor innen 114 bis 226 mal 40 bis 88). side: -1 links, 1 rechts, 0 Mitte.
// curve: Bahnform (effet = Bogen von außen herein, arc = hoher Bogen, flat = flach).
export const SPOTS={
  ul:{x:127,y:48,side:-1,curve:"effet"},ur:{x:213,y:48,side:1,curve:"effet"},
  ll:{x:127,y:80,side:-1,curve:"flat"},lr:{x:213,y:80,side:1,curve:"flat"},
  ml:{x:138,y:64,side:-1,curve:"arc"},mr:{x:202,y:64,side:1,curve:"arc"},
  mf:{x:170,y:82,side:0,curve:"flat"},lat:{x:170,y:44,side:0,curve:"arc"},
  wl:{x:119,y:44,side:-1,curve:"effet",corner:true},wr:{x:221,y:44,side:1,curve:"effet",corner:true} // Torwinkel
};
export const SPOT_IDS=Object.keys(SPOTS).filter(i=>!SPOTS[i].corner);
export const CORNER_IDS=Object.keys(SPOTS).filter(i=>SPOTS[i].corner);
export const isCorner=shot=>!!(shot&&shot.kind==="goal"&&SPOTS[shot.spot]&&SPOTS[shot.spot].corner);
export const goalText=shot=>isCorner(shot)?SHOT_TEXT.corner:SHOT_TEXT.goal;
// Eckentreffer-Regel: bei jeder 3. richtigen Antwort in Folge (opts.streak) sicher, sonst zufällig mit 1 zu 10 (zusammen mit der Lücke etwa jeder 6. Treffer), spätestens beim 6. Treffer nach dem letzten Eck.
export const CORNER_CHANCE=.1,CORNER_MAX_GAP=5;
let lastSpot="",sinceCorner=0;
// Richtig: Tor mit gewürfeltem Trefferpunkt (nie zweimal derselbe hintereinander). Falsch: zufällig Pfosten, Latte oder knapp vorbei.
// Seite zufällig (-1 links, 1 rechts). opts.prev: der vorige Punkt (sonst wird der zuletzt gewürfelte gemerkt), opts.pen: Elfmeterschießen (richtig = Tor, falsch = gehalten).
export function pickShot(ok,rnd=Math.random,opts={}){
  if(opts.pen&&!ok)return{kind:"saved",side:rnd()<.5?-1:1};
  if(!ok)return{kind:["post","bar","wide"][Math.floor(rnd()*3)%3],side:rnd()<.5?-1:1};
  const track=opts.prev===undefined,prev=track?lastSpot:opts.prev,since=track?sinceCorner:(opts.since||0);
  const corner=(opts.streak>0&&opts.streak%3===0)||since>=CORNER_MAX_GAP||rnd()<CORNER_CHANCE;
  const base=corner?CORNER_IDS:SPOT_IDS,pool=base.filter(i=>i!==prev),spot=pool[Math.floor(rnd()*pool.length)%pool.length];
  if(track){lastSpot=spot;sinceCorner=corner?0:sinceCorner+1;}
  return{kind:"goal",spot,side:SPOTS[spot].side||(rnd()<.5?-1:1)};
}
// Zwischenpunkt der ersten Strecke: leicht gebogene Bahn
function bend(a,b,curve,dir){
  const m={x:(a.x+b.x)/2,y:(a.y+b.y)/2,s:(a.s+b.s)/2};
  if(curve==="arc")m.y-=26;else if(curve==="flat")m.y-=6;else{m.x-=dir*18;m.y-=12;}
  return m;
}
// Ballbahn in Bildpunkten der Szene (340 mal 230), s ist der Maßstab (Perspektive).
// c ist ein Zwischenpunkt der Bogenbahn, end der Endpunkt ohne Bewegung (reduzierte Bewegung).
export function shotPath(kind,side,spot){
  const s={x:188,y:205,s:1},sd=side<0?-1:1;
  if(kind==="saved"){const end={x:170+sd*34,y:68,s:.66};return{start:s,c:bend(s,end,"arc",sd),end};}
  if(kind==="goal"){
    const sp=SPOTS[spot]||SPOTS[sd>0?"ur":"ul"],end={x:sp.x,y:sp.y,s:.6};
    const out={start:s,c:bend(s,end,sp.curve,sp.side),end};
    if(sp.corner)out.n={x:end.x+(s.x-end.x)*.1,y:end.y+(s.y-end.y)*.1,s:end.s+(s.s-end.s)*.1}; // kurz vor dem Einschlag: Zeitlupe
    return out;
  }
  if(kind==="post"){const hit={x:sd>0?238:102,y:62,s:.66};return{start:s,c:bend(s,hit,"effet",sd),hit,end:{x:sd>0?276:64,y:132,s:.95}};}
  if(kind==="bar"){const hit={x:170+sd*34,y:32,s:.68};return{start:s,c:bend(s,hit,"arc",sd),hit,end:hit,out:{x:170+sd*62,y:-24,s:.5}};}
  const hit={x:170+sd*80,y:44,s:.64};
  return{start:s,c:bend(s,hit,"effet",sd),hit,end:{x:sd>0?318:22,y:66,s:.58}};
}
// Der Spieler von hinten (Rückansicht der Vorlage), Füße am unteren Rand der Szene, Mitte vor dem Tor
function playerG(l){
  const p=figureParts(l,"back"),s=190/p.info.h;
  return `<g transform="translate(${(170-p.info.w*s/2).toFixed(1)} ${(231-p.info.h*s).toFixed(1)}) scale(${s.toFixed(4)})">${p.g}</g>`;
}
const KEEPER="#ffc83d";
function keeperG(dir,saved){
  const cls="kp "+(dir<0?"kp-l":"kp-r")+(saved?" kp-save":"");
  return `<g class="${cls}" data-part="torwart"><g transform="translate(170 62)"><ellipse cx="0" cy="22" rx="12" ry="3" fill="#000" opacity=".18"/>`
    +`<rect x="-7" y="-6" width="14" height="22" rx="5" fill="${KEEPER}" stroke="${INK}" stroke-width="1.6"/><rect x="-6" y="14" width="5" height="9" fill="#2b2f36"/><rect x="1" y="14" width="5" height="9" fill="#2b2f36"/>`
    +`<circle cx="0" cy="-12" r="6.5" fill="#f2c9a5" stroke="${INK}" stroke-width="1.6"/><path d="M-6.5 -13 Q0 -21 6.5 -13 Q0 -16 -6.5 -13Z" fill="#7a4a21"/>`
    +`<path d="M-7 -3 L-21 -9" stroke="${KEEPER}" stroke-width="5" stroke-linecap="round"/><path d="M7 -3 L21 -9" stroke="${KEEPER}" stroke-width="5" stroke-linecap="round"/>`
    +`<circle cx="-22" cy="-10" r="4" fill="#fff" stroke="${INK}" stroke-width="1.4"/><circle cx="22" cy="-10" r="4" fill="#fff" stroke="${INK}" stroke-width="1.4"/></g></g>`;
}
const CROWD=["#e5484d","#ffc83d","#f4f4f4","#2f6fde","#34a853","#ff8a00"];
export function sceneSVG(look,shot,opts={}){
  const l=cleanLook(look),keeper=!!opts.keeper,k=SHOT_KINDS.includes(shot&&shot.kind)||(keeper&&shot&&shot.kind==="saved")?shot.kind:"goal",side=shot&&shot.side<0?-1:1,p=shotPath(k,side,shot&&shot.spot);
  const pt=(n,o)=>`--${n}x:${Math.round(o.x)}px;--${n}y:${Math.round(o.y)}px;--${n}s:${o.s}`;
  const vars=[pt("s",p.start),pt("e",p.end),pt("c",p.c),p.n?pt("n",p.n):"",p.hit?pt("h",p.hit):"",p.out?pt("o",p.out):""].filter(Boolean).join(";");
  let crowd="";
  for(let r=0;r<3;r++)for(let i=0;i<40;i++)crowd+=`<circle cx="${(4+r*4+i*8.6).toFixed(1)}" cy="${46+r*7}" r="3.1" fill="${CROWD[(i*5+r*3)%CROWD.length]}"/>`;
  let stripes="";
  for(let i=0;i<8;i++)if(i%2)stripes+=`<polygon points="${170+(i-4)*22},72 ${170+(i-3)*22},72 ${170+(i-3)*80},230 ${170+(i-4)*80},230" fill="#fff" opacity=".07"/>`;
  let mesh="";
  for(let x=114;x<=226;x+=9.3)mesh+=`<line x1="${x.toFixed(1)}" y1="40" x2="${x.toFixed(1)}" y2="88"/>`;
  for(let y=40;y<=88;y+=8)mesh+=`<line x1="114" y1="${y}" x2="226" y2="${y}"/>`;
  let sparks="";
  if(p.n)for(let i=0;i<10;i++){const a=i/10*Math.PI*2+.3,r=24+(i%3)*8;sparks+=`<circle class="sp" cx="${p.end.x}" cy="${p.end.y}" r="${i%2?2.2:3}" fill="${["#ffc83d","#fff","#e5484d"][i%3]}" style="--dx:${Math.round(Math.cos(a)*r)}px;--dy:${Math.round(Math.sin(a)*r)}px"/>`;}
  const pop=POP_TEXT[k]?(()=>{
    const c=k==="saved"?{x:side>0?236:104,y:34}:k==="post"?{x:side>0?290:50,y:70}:k==="bar"?{x:side>0?92:248,y:20}:{x:side>0?250:90,y:108};
    return `<g class="pop"><ellipse cx="${c.x}" cy="${c.y}" rx="${POP_TEXT[k].length*5.4+12}" ry="15" fill="#fff" stroke="${INK}" stroke-width="2.4"/><text x="${c.x}" y="${c.y+5.5}" text-anchor="middle" font-family="${FONT}" font-size="17" fill="#e5484d">${POP_TEXT[k]}</text></g>`;
  })():"";
  return `<svg class="scene sc-${k}${p.n?" sc-corner":""}" viewBox="0 0 340 230" role="img" aria-label="${esc(SHOT_ARIA[p.n?"corner":k])}">`
    +`<defs><linearGradient id="scSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5eb6ff"/><stop offset="1" stop-color="#d8f0ff"/></linearGradient>`
    +`<linearGradient id="scGrass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f9a4f"/><stop offset="1" stop-color="#5cc06c"/></linearGradient>`
    +`<linearGradient id="scPost" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#e3e8ec"/><stop offset="1" stop-color="#b9c2c9"/></linearGradient>`
    +`<radialGradient id="scBump"><stop offset="0" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><radialGradient id="scBall" cx=".38" cy=".34" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d5dde3"/></radialGradient></defs>`
    +`<rect width="340" height="74" fill="url(#scSky)"/><ellipse cx="60" cy="18" rx="30" ry="8" fill="#fff" opacity=".85"/><ellipse cx="84" cy="14" rx="20" ry="7" fill="#fff" opacity=".85"/><ellipse cx="280" cy="24" rx="26" ry="7" fill="#fff" opacity=".8"/>`
    +`<rect y="38" width="340" height="34" fill="#2d3f5c"/>${crowd}<rect y="66" width="340" height="8" fill="#e5484d"/><rect x="0" y="66" width="70" height="8" fill="#ffc83d"/><rect x="140" y="66" width="70" height="8" fill="#2f6fde"/><rect x="270" y="66" width="70" height="8" fill="#ffc83d"/>`
    +`<rect y="74" width="340" height="156" fill="url(#scGrass)"/>${stripes}`
    +`<g stroke="#fff" stroke-opacity=".7" stroke-width="2" fill="none"><path d="M0 93 H340"/><path d="M52 93 L28 150 H312 L288 93"/><path d="M96 93 L88 114 H252 L244 93"/></g><ellipse cx="170" cy="176" rx="5" ry="2.4" fill="#fff" opacity=".85"/>`
    +`<rect x="114" y="40" width="112" height="48" fill="#0d2a17" opacity=".3"/><g stroke="#fff" stroke-opacity=".55" stroke-width="1">${mesh}<path d="M102 32 L114 40 M238 32 L226 40 M102 92 L114 88 M238 92 L226 88"/></g><g class="netfx" style="--bx:${Math.round(p.end.x)}px;--by:${Math.round(p.end.y)}px"><ellipse cx="${p.end.x}" cy="${p.end.y}" rx="30" ry="22" fill="url(#scBump)"/><path d="M${p.end.x-22} ${p.end.y} Q${p.end.x} ${p.end.y+14} ${p.end.x+22} ${p.end.y} M${p.end.x} ${p.end.y-16} Q${p.end.x+10} ${p.end.y} ${p.end.x} ${p.end.y+16}" stroke="#fff" stroke-width="1.4" fill="none"/></g>`
    +`<rect x="98" y="28" width="7" height="66" rx="2" fill="url(#scPost)"/><rect x="235" y="28" width="7" height="66" rx="2" fill="url(#scPost)"/><rect x="98" y="28" width="144" height="7" rx="2" fill="url(#scPost)"/>`
    +(keeper?keeperG(k==="saved"?side:-side,k==="saved"):"")
    +`<g class="pl">${playerG(l)}</g>`
    +`<g class="ballpos" style="${vars}"><g class="ballspin"><circle r="9" fill="url(#scBall)"/><polygon points="0,-4.5 4.3,-1.4 2.7,3.6 -2.7,3.6 -4.3,-1.4" fill="${INK}"/><path d="M0 -4.5 V-9 M4.3 -1.4 L8.6 -2.8 M2.7 3.6 L5.3 7.3 M-2.7 3.6 L-5.3 7.3 M-4.3 -1.4 L-8.6 -2.8" stroke="${INK}" stroke-width="1.4" fill="none"/></g><ellipse cx="-3" cy="-4.4" rx="2.8" ry="1.7" fill="#fff" opacity=".75"/></g>`
    +pop
    +(sparks?`<g class="sparks">${sparks}</g>`:"")
    +`</svg>`;
}
