// Zeichnen der Figuren: Spieler, Wappen, Trainer und die Torszene. Alles eigene Formen
// (keine bekannten Figuren, keine Vereinslogos). Alle Farben und Texte laufen vorher durch
// cleanLook bzw. cleanTrainerLook und esc. Stil: Comic mit dunkler Kontur, Schattierung und Glanzlichtern.
import {esc} from "./util.js";
import {cleanLook,cleanTrainerLook,COLOR_NAMES} from "./avatar.js";

const OUT="#2b2320";
const FONT="Lilita One, Arial Rounded MT Bold, Arial, sans-serif";
const ST=`stroke="${OUT}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"`;
const clamp=v=>Math.max(0,Math.min(255,Math.round(v)));
function mix(h,to,t){const a=parseInt(h.slice(1),16),b=parseInt(to.slice(1),16);const c=s=>clamp(((a>>s)&255)*(1-t)+((b>>s)&255)*t);return"#"+[16,8,0].map(s=>c(s).toString(16).padStart(2,"0")).join("");}
const dark=(h,t=.22)=>mix(h,"#000000",t),light=(h,t=.3)=>mix(h,"#ffffff",t);
const lum=h=>{const n=parseInt(h.slice(1),16);return(0.299*(n>>16&255)+0.587*(n>>8&255)+0.114*(n&255))/255;};
const textOn=h=>lum(h)>0.6?OUT:"#ffffff";

// ---------- Haare ----------
// len: Länge (0 kurz, 1 Kinn, 2 Schulter, 3 lang). fr: Stirnpartie. ex: Zusatz.
const STYLES={
  j:[{len:0,fr:"side"},{len:0,fr:"tufts"},{len:0,fr:"spiky"},{len:0,fr:"curly"},{len:0,fr:"swoop"},{len:0,fr:"stubble"},{len:0,fr:"part"},{len:1,fr:"side"},{len:0,fr:"bald"}],
  m:[{len:0,fr:"side",ex:"tail"},{len:1,fr:"bangs",ex:"braids"},{len:3,fr:"bangs"},{len:0,fr:"side",ex:"bun"},{len:1,fr:"bangs"},{len:2,fr:"curly"},{len:2,fr:"side",ex:"bow"},{len:0,fr:"bangs"},{len:0,fr:"bald"}]
};
const circles=(pts,r,c)=>pts.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="${p[2]||r}" fill="${c}" ${ST}/>`).join("");
function hairParts(def,c,acc,view){
  const front=view==="front",hs=dark(c,.3),stub=def.fr==="stubble";
  const fill=`fill="${c}"${stub?' fill-opacity=".55"':""}`,line=stub?'stroke="none"':ST;
  const shape=d=>`<path d="${d}" ${fill} ${line}/>`;
  const capBack="M33 52 C28 14 46 6 60 6 C74 6 92 14 87 52 C86 63 76 69 60 69 C44 69 34 63 33 52Z";
  const capFront={
    side:"M34 47 C30 18 46 9 60 9 C76 9 90 18 86 47 C84 37 79 30 71 27 C60 35 45 35 34 47Z",
    part:"M34 47 C30 18 46 9 60 9 C76 9 90 18 86 47 C85 36 80 29 66 25 C58 33 42 36 34 47Z",
    bangs:"M33 48 C29 17 46 8 60 8 C76 8 91 17 87 48 L86 36 C74 29 46 29 34 36Z"
  };
  if(def.fr==="bald")return{behind:"",top:front?`<path d="M45 22 Q60 14 75 22" stroke="#fff" stroke-opacity=".3" stroke-width="3.4" fill="none" stroke-linecap="round"/>`:""}; // ohne Haare
  const base=capFront[def.fr]||capFront.side;
  const mass=[null,"M32 44 C26 76 30 86 42 84 L78 84 C90 86 94 76 88 44Z","M31 42 C22 84 24 104 38 104 L82 104 C96 104 98 84 89 42Z","M31 42 C20 90 22 128 38 130 L82 130 C98 128 100 90 89 42Z"][def.len];
  const massBack=[null,"M32 44 C26 70 30 84 42 84 L78 84 C90 84 94 70 88 44Z","M31 42 C22 70 24 90 40 92 L80 92 C96 90 98 70 89 42Z","M31 42 C22 70 24 90 40 92 L80 92 C96 90 98 70 89 42Z"][def.len];
  let behind="",top="";
  // Länge: bei Vorderansicht hinter dem Körper, bei Rückansicht über dem Trikot
  if(front&&mass)behind+=shape(mass);
  if(!front&&massBack)top+=shape(massBack);
  // Zusätze
  if(def.ex==="tail"){
    if(front)behind+=shape("M78 20 C106 18 112 52 98 74 C93 82 88 84 84 80 C92 64 90 44 76 34Z")+`<circle cx="80" cy="25" r="4.4" fill="${acc}" ${ST}/>`;
    else top+=shape("M50 12 C54 4 66 4 70 12 C80 40 76 84 64 96 C61 99 59 99 56 96 C44 84 40 40 50 12Z")+`<circle cx="60" cy="15" r="4.6" fill="${acc}" ${ST}/>`;
  }
  if(def.ex==="braids"){
    const chain=(x,ys)=>ys.map((y,i)=>`<ellipse cx="${x+(i%2?1.6:-1.6)}" cy="${y}" rx="6" ry="7" fill="${c}" ${ST}/>`).join("");
    if(front)behind+=chain(30,[64,73,82,91,100])+`<circle cx="30" cy="108" r="4.6" fill="${acc}" ${ST}/>`+chain(90,[64,73,82,91,100])+`<circle cx="90" cy="108" r="4.6" fill="${acc}" ${ST}/>`;
    else top+=chain(41,[76,84,92])+`<circle cx="41" cy="100" r="4.2" fill="${acc}" ${ST}/>`+chain(79,[76,84,92])+`<circle cx="79" cy="100" r="4.2" fill="${acc}" ${ST}/>`;
  }
  // Kopfhaar
  if(front){
    if(def.fr==="curly"){
      top+=circles([[36,34,8.5],[38,22,8.5],[47,14,8.5],[59,11,8.5],[71,13,8.5],[81,20,8.5],[85,32,8.5],[46,28,7],[58,26,7],[70,28,7]],8,c);
      if(def.len>=2)top+=circles([[31,52,7.5],[30,66,7.5],[30,80,7.5],[89,52,7.5],[90,66,7.5],[90,80,7.5]],7.5,c);
    }else{
      if(def.fr==="spiky")top+=shape("M35 30 L37 6 L47 20 L53 2 L60 18 L67 2 L73 20 L83 6 L85 30Z");
      if(def.fr==="tufts")top+=circles([[42,14],[54,8],[66,8],[78,14]],7.5,c);
      top+=shape(base);
      if(def.fr==="swoop")top+=shape("M42 24 C44 2 74 0 88 22 C74 13 58 16 46 30Z");
      if(def.fr==="part")top+=`<path d="M60 10 Q58 19 66 25" stroke="${hs}" stroke-width="1.8" fill="none"/>`;
      if(def.len>=2&&def.fr!=="curly")top+=shape("M31 46 C27 66 28 84 32 96 L40 90 C36 76 36 60 38 48Z")+shape("M89 46 C93 66 92 84 88 96 L80 90 C84 76 84 60 82 48Z");
      if(def.len===1)top+=shape("M32 46 C29 62 30 74 34 80 L40 74 C37 64 37 54 38 47Z")+shape("M88 46 C91 62 90 74 86 80 L80 74 C83 64 83 54 82 47Z");
    }
    if(!stub)top+=`<path d="M42 21 Q56 12 74 20" stroke="#fff" stroke-opacity=".38" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M52 14 Q49 23 45 30" stroke="${hs}" stroke-opacity=".55" stroke-width="1.6" fill="none"/><path d="M66 13 Q69 20 73 26" stroke="${hs}" stroke-opacity=".55" stroke-width="1.6" fill="none"/>`;
  }else{
    let back=shape(capBack);
    if(def.fr==="curly")back+=circles([[35,34,8.5],[37,20,8.5],[47,12,8.5],[59,9,8.5],[71,11,8.5],[82,18,8.5],[86,32,8.5],[36,50,8],[84,50,8],[44,60,8],[60,64,8],[76,60,8]],8,c);
    if(def.fr==="spiky")back=shape("M35 30 L37 6 L47 20 L53 2 L60 18 L67 2 L73 20 L83 6 L85 30Z")+back;
    if(def.fr==="tufts")back=circles([[42,10],[54,5],[66,5],[78,10]],7.5,c)+back;
    if(def.fr==="swoop")back+=shape("M42 22 C44 2 74 0 88 20 C74 12 58 14 46 28Z");
    top=back+top+(stub?"":`<path d="M60 10 L60 40" stroke="${hs}" stroke-opacity=".5" stroke-width="1.6"/><path d="M42 18 Q56 9 76 17" stroke="#fff" stroke-opacity=".32" stroke-width="3.4" fill="none" stroke-linecap="round"/>`);
  }
  if(def.ex==="bun")top+=`<circle cx="60" cy="8" r="11" fill="${c}" ${ST}/><path d="M50 12 Q60 17 70 12" stroke="${acc}" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M53 4 Q58 0 64 3" stroke="#fff" stroke-opacity=".4" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  if(def.ex==="bow")top+=`<path d="M60 14 L78 5 L78 23Z M60 14 L42 5 L42 23Z" fill="${acc}" ${ST}/><circle cx="60" cy="14" r="4.6" fill="${dark(acc,.2)}" ${ST}/>`;
  return{behind,top};
}

// ---------- Kopfbedeckungen (im Kopfraum gezeichnet, Kopf mittig bei 60, oben bei 12) ----------
// 0 keine, 1 Cap, 2 Cap verkehrt herum, 3 Mütze, 4 Stirnband, 5 Bandana
function hatParts(hat,c,view){
  if(!hat)return"";
  const front=view==="front",cd=dark(c,.24),cl=light(c,.28);
  const P=(d,f,extra="")=>`<path d="${d}" fill="${f}" ${ST} ${extra}/>`;
  const seams=`<path d="M60 8 L60 36 M47 11 Q45 25 43 36 M73 11 Q75 25 77 36" stroke="${cd}" stroke-width="1.4" fill="none"/>`;
  const dome="M35 40 C33 16 46 7 60 7 C74 7 87 16 85 40 C76 35 44 35 35 40Z";
  const visor="M37 38 C48 32 72 32 83 38 C92 41 90 50 78 50 C68 45 52 45 42 50 C30 50 28 41 37 38Z";
  const strap=`<path d="M36.5 38 Q60 43 83.5 38" stroke="${cd}" stroke-width="3.4" fill="none"/><rect x="55" y="39" width="10" height="5" rx="1.5" fill="${cl}" stroke="${OUT}" stroke-width="1.2"/>`;
  const shine=`<path d="M44 14 Q56 8 70 13" stroke="#fff" stroke-opacity=".4" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  if(hat===1){
    return front?P(dome,c)+seams+`<circle cx="60" cy="8" r="3" fill="${cd}" ${ST}/><circle cx="60" cy="24" r="5.4" fill="#fff" fill-opacity=".92" stroke="${OUT}" stroke-width="1.4"/>`+shine+P(visor,cd)
                :P(dome,c)+seams+`<circle cx="60" cy="8" r="3" fill="${cd}" ${ST}/>`+strap+shine;
  }
  if(hat===2){
    return front?P(dome,c)+seams+`<circle cx="60" cy="8" r="3" fill="${cd}" ${ST}/>`+strap+shine
                :P(dome,c)+seams+`<circle cx="60" cy="8" r="3" fill="${cd}" ${ST}/>`+shine+P(visor,cd);
  }
  if(hat===3){
    let rib="";for(let x=38;x<=82;x+=6)rib+=`M${x} 39 L${x} 48 `;
    return P("M33 46 C30 16 46 4 60 4 C74 4 90 16 87 46Z",c)+`<path d="M44 12 Q56 6 72 11" stroke="#fff" stroke-opacity=".35" stroke-width="3" fill="none" stroke-linecap="round"/>`
      +P("M32 38 C46 33 74 33 88 38 L88 50 C74 45 46 45 32 50Z",cl)+`<path d="${rib}" stroke="${cd}" stroke-width="1.2" fill="none"/><circle cx="60" cy="3" r="8" fill="${cl}" ${ST}/><path d="M55 0 Q60 -2 65 1" stroke="#fff" stroke-opacity=".5" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  }
  if(hat===4){
    return P("M34 34 C47 27 73 27 86 34 L86 43 C73 36 47 36 34 43Z",c)+`<path d="M34 38.6 C47 31.6 73 31.6 86 38.6" stroke="${cl}" stroke-width="2" fill="none"/>`;
  }
  // 5 Bandana mit Knoten
  const dots=[[44,26],[52,21],[62,20],[72,24],[78,30],[48,32],[66,29]].map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="1.5" fill="#fff" fill-opacity=".85"/>`).join("");
  return P("M34 42 C33 12 87 12 86 42 C72 34 48 34 34 42Z",c)+dots
    +(front?P("M86 34 L99 28 L97 44Z",cd)+`<circle cx="87" cy="36" r="3.4" fill="${cl}" ${ST}/>`
           :P("M54 38 L44 56 L57 51Z M66 38 L76 56 L63 51Z",c)+`<circle cx="60" cy="38" r="4" fill="${cl}" ${ST}/>`);
}

// ---------- Spieler ----------
// Spieler als Gruppe (ohne svg-Hülle), 120 breit und 182 hoch. view: front oder back (mit Name und Rückennummer).
export function figureG(look,view="front"){
  const l=cleanLook(look),front=view==="front",girl=l.body==="m";
  const def=STYLES[l.body][l.hair],hp=hairParts(def,l.hairColor,l.c2,view);
  const skD=dark(l.skin,.16),sk=l.skin,tx=textOn(l.shirt);
  const nameText=l.shirtName,ns=Math.max(5,Math.min(9,40/(Math.max(1,nameText.length)*0.62)));
  const numS=l.number.length>1?24:28;
  let g=`<ellipse cx="60" cy="179" rx="36" ry="4.5" fill="#000" opacity=".2"/>`;
  if(hp.behind)g+=`<g transform="translate(60 72) scale(.9) translate(-60 -72)">${hp.behind}</g>`;
  // Beine, Stutzen, Schuhe
  g+=`<rect x="43" y="148" width="14" height="26" rx="4" fill="${sk}" ${ST}/><rect x="63" y="148" width="14" height="26" rx="4" fill="${sk}" ${ST}/>`;
  g+=`<rect x="42" y="158" width="16" height="16" rx="3" fill="${l.shirt}" ${ST}/><rect x="62" y="158" width="16" height="16" rx="3" fill="${l.shirt}" ${ST}/>`;
  g+=`<path d="M42 160 H58 M62 160 H78" stroke="${l.c2}" stroke-width="4"/>`;
  g+=`<path d="M32 172 Q32 166 42 166 L52 166 Q58 166 58 172 L58 176 Q58 180 53 180 L37 180 Q32 180 32 176Z" fill="${l.boots}" ${ST}/><path d="M62 172 Q62 166 68 166 L78 166 Q88 166 88 172 L88 176 Q88 180 83 180 L67 180 Q62 180 62 176Z" fill="${l.boots}" ${ST}/>`;
  g+=`<path d="M34 176.5 H56 M64 176.5 H86" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>`;
  // Rumpf mit Schatten
  g+=`<path d="M40 78 Q60 72 80 78 L83 104 L85 130 Q60 135 35 130 L37 104Z" fill="${l.shirt}" ${ST}/>`;
  g+=`<path d="M70 79 L80 78 L85 130 Q78 132 72 132Z" fill="#000" opacity=".13"/>`;
  // Hose mit Streifen in der zweiten Vereinsfarbe
  g+=`<path d="M37 126 L83 126 L89 153 L64 153 L60 139 L56 153 L31 153Z" fill="${l.shorts}" ${ST}/>`
    +`<path d="M37 126 L41.5 126 L36.5 153 L31 153Z" fill="${l.c2}"/><path d="M83 126 L78.5 126 L83.5 153 L89 153Z" fill="${l.c2}"/><path d="M60 139 L64 153 L89 153 L83 126 L74 126Z" fill="#000" opacity=".1"/>`;
  // Arme: Ärmel, Manschetten, Hände
  g+=`<rect x="22" y="106" width="10" height="14" rx="4" fill="${sk}" ${ST}/><ellipse cx="27" cy="123" rx="5.6" ry="6.9" fill="${sk}" ${ST}/><ellipse cx="32" cy="121.6" rx="2" ry="3.8" fill="${sk}" ${ST}/><rect x="88" y="106" width="10" height="14" rx="4" fill="${sk}" ${ST}/><ellipse cx="93" cy="123" rx="5.6" ry="6.9" fill="${sk}" ${ST}/><ellipse cx="88" cy="121.6" rx="2" ry="3.8" fill="${sk}" ${ST}/>`;
  g+=`<path d="M41 79 Q31 81 27 93 L22 109 Q29 114 37 110 L42 96Z" fill="${l.shirt}" ${ST}/><path d="M79 79 Q89 81 93 93 L98 109 Q91 114 83 110 L78 96Z" fill="${l.shirt}" ${ST}/>`;
  g+=`<path d="M22.6 107 Q29 112 36.4 108.6 L35.6 104.6 Q29 108 23.6 103Z" fill="${l.c2}"/><path d="M97.4 107 Q91 112 83.6 108.6 L84.4 104.6 Q91 108 96.4 103Z" fill="${l.c2}"/>`;
  // Hals, Ohren, Kopf. Kopf, Haare und Kopfbedeckung stehen in einer Gruppe, etwas kleiner (natürlichere Proportionen).
  const HEAD="M35 40 C35 20 46 12 60 12 C74 12 85 20 85 40 C85 50 82 60 76 67 C72 72 66 75 60 75 C54 75 48 72 44 67 C38 60 35 50 35 40Z";
  const hg=inner=>`<g transform="translate(60 72) scale(.9) translate(-60 -72)">${inner}</g>`;
  const lipC=mix(sk,"#c0392b",.45);
  g+=`<path d="M52 66 L52 80 Q60 85 68 80 L68 66Z" fill="${skD}" ${ST}/>`;
  let head=`<path d="M36.5 43 C30.5 41 29 51 35 55.5 C36 52 36.5 48 36.5 43Z" fill="${sk}" ${ST}/><path d="M83.5 43 C89.5 41 91 51 85 55.5 C84 52 83.5 48 83.5 43Z" fill="${sk}" ${ST}/>`;
  head+=`<path d="M33.6 46 Q32.6 50 34.6 52.4 M86.4 46 Q87.4 50 85.4 52.4" stroke="${skD}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
  head+=`<path d="${HEAD}" fill="${sk}" ${ST}/>`;
  head+=`<path d="M38 52 C40 64 48 71 60 73 C49 70 41 63 38 52Z M82 52 C80 64 72 71 60 73 C71 70 79 63 82 52Z" fill="${skD}" opacity=".4"/>`;
  const hat=hatParts(l.hat,l.hatColor,view);
  if(front){
    g+=`<path d="M50 77 L60 92 L70 77Z" fill="${sk}"/><path d="M47 76 L60 94 L73 76" stroke="${l.c2}" stroke-width="3.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    const eye=x=>{const o=x<60?-1:1;
      return `<path d="M${x-6.2} 47.4 Q${x} 42 ${x+6.2} 47.4 Q${x} 52.2 ${x-6.2} 47.4Z" fill="#fff" stroke="${OUT}" stroke-width="1.3"/><circle cx="${x}" cy="47.2" r="3.5" fill="#4a3426"/><circle cx="${x}" cy="47.2" r="1.8" fill="#120c08"/><circle cx="${x+1.3}" cy="45.8" r="1.1" fill="#fff"/>`
        +`<path d="M${x-6.8} 47 Q${x} 40.8 ${x+6.8} 47" stroke="${OUT}" stroke-width="${girl?2.5:2}" fill="none" stroke-linecap="round"/>`
        +(girl?`<path d="M${x+o*6.4} 46.2 L${x+o*8.6} 44.2 M${x+o*6} 47.6 L${x+o*8.4} 47" stroke="${OUT}" stroke-width="1.5" stroke-linecap="round"/>`:"");};
    const brow=dark(l.hairColor,.35),bw=girl?2.3:3;
    let face=`<path d="M42.5 39.8 Q48 36 54.5 39.4" stroke="${brow}" stroke-width="${bw}" fill="none" stroke-linecap="round"/><path d="M65.5 39.4 Q72 36 77.5 39.8" stroke="${brow}" stroke-width="${bw}" fill="none" stroke-linecap="round"/>`;
    face+=eye(48)+eye(72);
    face+=`<path d="M59.6 48.4 Q58.4 55 56.6 58.4 Q60 61 63.4 58.4" stroke="${dark(sk,.3)}" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    face+=`<path d="M51.5 64 Q60 72.6 68.5 64 Q60 67.6 51.5 64Z" fill="#fff" stroke="${OUT}" stroke-width="1.3" stroke-linejoin="round"/><path d="M50.6 63.4 Q60 68 69.4 63.4" stroke="${lipC}" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M54.4 69.2 Q60 72.6 65.6 69.2" stroke="${lipC}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
    face+=`<circle cx="42" cy="58" r="4.2" fill="#ff7e7e" opacity=".22"/><circle cx="78" cy="58" r="4.2" fill="#ff7e7e" opacity=".22"/>`;
    g+=hg(head+hp.top+face+hat);
    g+=`<text x="60" y="114" text-anchor="middle" font-family="${FONT}" font-size="${numS-2}" fill="${tx}" fill-opacity=".95">${esc(l.number)}</text>`;
  }else{
    g+=`<path d="M49 78 Q60 86 71 78" stroke="${l.c2}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`;
    g+=hg(head+hp.top+hat);
    g+=`<text x="60" y="103" text-anchor="middle" font-family="${FONT}" font-size="${ns}" fill="${tx}">${esc(nameText)}</text>`;
    g+=`<text x="60" y="128" text-anchor="middle" font-family="${FONT}" font-size="${numS}" fill="${tx}">${esc(l.number)}</text>`;
  }
  return g;
}
const ariaLook=l=>`${l.body==="m"?"Spielerin":"Spieler"} mit Trikot ${COLOR_NAMES[l.shirt]||"bunt"} und Nummer ${l.number}`;

// Vollständige Grafik. crop: "full" (ganze Figur), "bust" (bis zum Gürtel, für Kacheln), "head" (Frisuren-Auswahl).
export function avatarSVG(look,{view="front",px=100,crop="full",label}={}){
  const l=cleanLook(look);
  const vb=crop==="head"?"12 0 96 84":crop==="bust"?"8 2 104 140":"0 0 120 184";
  const [,,w,h]=vb.split(" ").map(Number);
  return `<svg class="avsvg" viewBox="${vb}" width="${Math.round(px*w/h)}" height="${px}" role="img" aria-label="${esc(label||ariaLook(l))}">${figureG(l,view)}</svg>`;
}

// Wappen aus den beiden Vereinsfarben
export function crestSVG(look,px=40){
  const l=cleanLook(look);
  return `<svg viewBox="0 0 40 46" width="${Math.round(px*40/46)}" height="${px}" role="img" aria-label="Wappen von ${esc(l.team)}"><path d="M4 4 H36 V24 Q36 38 20 44 Q4 38 4 24Z" fill="${l.c1}"/><path d="M20 4 H36 V24 Q36 38 20 44Z" fill="${l.c2}"/><path d="M4 4 H36 V24 Q36 38 20 44 Q4 38 4 24Z" fill="none" stroke="${OUT}" stroke-width="2.4" stroke-linejoin="round"/><circle cx="20" cy="22" r="6.5" fill="#fff" stroke="${OUT}" stroke-width="2"/></svg>`;
}

// ---------- Trainer und Trainerin (nach den Fotos) ----------
export function trainerSVG(look,{px=72,label,which=1}={}){
  const l=cleanTrainerLook(look,which),sk=l.skin,skD=dark(sk,.15),j=l.jacket,jL=light(j,.2),hc=l.hairColor,hd=dark(hc,.3);
  let g=`<ellipse cx="60" cy="146" rx="44" ry="4" fill="#000" opacity=".16"/>`;
  if(l.hair===3)g+=`<path d="M28 60 C18 90 22 112 36 120 L84 120 C98 112 102 90 92 60Z" fill="${hc}" ${ST}/>`;
  g+=`<path d="M12 150 Q10 108 42 100 L78 100 Q110 108 108 150Z" fill="${j}" ${ST}/>`;
  g+=`<path d="M46 99 L60 124 L74 99Z" fill="#dfe3e8" ${ST}/><path d="M38 101 L52 127 L60 119 L46 99Z" fill="${jL}" ${ST}/><path d="M82 101 L68 127 L60 119 L74 99Z" fill="${jL}" ${ST}/><path d="M60 128 L60 150" stroke="${jL}" stroke-width="2.2"/>`;
  g+=`<path d="M50 84 L50 103 Q60 111 70 103 L70 84Z" fill="${skD}" ${ST}/>`;
  g+=`<ellipse cx="33" cy="62" rx="4.8" ry="6.8" fill="${sk}" ${ST}/><ellipse cx="87" cy="62" rx="4.8" ry="6.8" fill="${sk}" ${ST}/>`;
  g+=`<path d="M33 58 C33 36 46 28 60 28 C74 28 87 36 87 58 C87 70 83 80 76 86 C72 90 66 92 60 92 C54 92 48 90 44 86 C37 80 33 70 33 58Z" fill="${sk}" ${ST}/><path d="M36 64 C38 76 46 88 60 91 C47 88 39 78 36 64Z M84 64 C82 76 74 88 60 91 C73 88 81 78 84 64Z" fill="${skD}" opacity=".35"/>`;
  if(l.beard)g+=`<path d="M34 64 C36 88 48 91 60 91 C72 91 84 88 86 64 C80 77 70 75 60 75 C50 75 40 77 34 64Z" fill="${hc}" ${ST}/>`;
  // Haare
  if(l.hair===0)g+=`<path d="M44 33 Q60 23 76 33" stroke="#fff" stroke-opacity=".38" stroke-width="4.2" fill="none" stroke-linecap="round"/>`;
  if(l.hair===1)g+=`<path d="M33 56 C30 26 46 15 60 15 C74 15 90 26 87 56 C85 44 78 38 60 38 C42 38 35 44 33 56Z" fill="${hc}" ${ST}/><path d="M44 24 Q60 16 76 24" stroke="#fff" stroke-opacity=".3" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  if(l.hair===2)g+=`<path d="M33 58 C29 24 46 12 62 12 C80 12 92 26 87 58 C85 44 78 34 66 30 C56 40 42 42 33 58Z" fill="${hc}" ${ST}/><path d="M62 13 Q60 22 66 30" stroke="${hd}" stroke-width="1.8" fill="none"/><path d="M44 22 Q60 13 78 22" stroke="#fff" stroke-opacity=".3" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  if(l.hair===3){
    g+=`<path d="M31 66 C25 26 44 11 62 11 C84 11 96 30 90 66 C88 50 84 40 74 33 C62 28 46 34 40 54 C38 60 35 64 31 66Z" fill="${hc}" ${ST}/>`;
    g+=`<path d="M31 62 C27 86 30 106 40 114 L47 100 C41 90 39 76 41 60Z" fill="${hc}" ${ST}/><path d="M89 62 C93 86 90 106 80 114 L73 100 C79 90 81 76 79 60Z" fill="${hc}" ${ST}/>`;
    g+=`<path d="M52 18 Q40 28 38 46" stroke="${hd}" stroke-opacity=".6" stroke-width="1.8" fill="none"/><path d="M70 16 Q84 22 86 40" stroke="#fff" stroke-opacity=".4" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  }
  // Gesicht
  const eye=x=>`<path d="M${x-6.4} 55.4 Q${x} 49.6 ${x+6.4} 55.4 Q${x} 60.6 ${x-6.4} 55.4Z" fill="#fff" stroke="${OUT}" stroke-width="1.3"/><circle cx="${x+.3}" cy="55.4" r="3.6" fill="${l.eyes}"/><circle cx="${x+.3}" cy="55.4" r="1.8" fill="#10151c"/><circle cx="${x+1.6}" cy="53.9" r="1.1" fill="#fff"/><path d="M${x-7} 55 Q${x} 48.8 ${x+7} 55" stroke="${OUT}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  g+=`<path d="M40 45 Q47 41 55 44 M65 44 Q73 41 80 45" stroke="${l.hair===0?dark(hc,.15):hd}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`;
  g+=eye(47)+eye(73);
  g+=`<path d="M60 59 Q56 67 61 68" stroke="${skD}" stroke-width="2.1" fill="none" stroke-linecap="round"/>`;
  g+=l.smile?`<path d="M46 73 Q60 88 74 73Z" fill="#8f2f2b" ${ST}/><path d="M48.6 73.6 Q60 80.6 71.4 73.6 L70.4 76.8 Q60 83.4 49.6 76.8Z" fill="#fff"/>`
            :`<path d="M49 75 Q60 83 71 75" stroke="${OUT}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M53 78 Q60 82 67 78" stroke="#c96a6a" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".6"/>`;
  g+=`<circle cx="41" cy="70" r="4.6" fill="#ff7e7e" opacity=".24"/><circle cx="79" cy="70" r="4.6" fill="#ff7e7e" opacity=".24"/>`;
  if(l.glasses)g+=`<rect x="34" y="44" width="25" height="19" rx="5.5" fill="#9bb7e6" fill-opacity=".16" stroke="#15161a" stroke-width="3.2"/><rect x="61" y="44" width="25" height="19" rx="5.5" fill="#9bb7e6" fill-opacity=".16" stroke="#15161a" stroke-width="3.2"/><path d="M59 51 H61" stroke="#15161a" stroke-width="2.6"/><path d="M34 50 L29 48.6 M86 50 L91 48.6" stroke="#8a8f98" stroke-width="2.6" stroke-linecap="round"/><path d="M38 47 L44 47" stroke="#fff" stroke-opacity=".5" stroke-width="1.8" stroke-linecap="round"/>`;
  if(l.earrings)g+=`<circle cx="32" cy="76" r="6" fill="none" stroke="#c5cad3" stroke-width="2.2"/><circle cx="88" cy="76" r="6" fill="none" stroke="#c5cad3" stroke-width="2.2"/>`;
  // Pfeife
  g+=`<path d="M46 101 Q60 128 74 101" stroke="#20242a" stroke-width="1.9" fill="none"/><rect x="52" y="122" width="16" height="10.5" rx="5" fill="#ffc83d" ${ST}/><circle cx="57" cy="127.4" r="1.9" fill="${OUT}"/>`;
  return `<svg class="avsvg" viewBox="0 0 120 150" width="${Math.round(px*120/150)}" height="${px}" role="img" aria-label="${esc(label||(which===2?"Trainerin":"Trainer"))}">${g}</svg>`;
}

// ---------- Torszene ----------
// Der Spieler steht mit dem Rücken zur Kamera und schießt aufs Tor.
// Ausgang: goal (Tor), post (Pfosten), bar (Latte), wide (knapp vorbei).
export const SHOT_KINDS=["goal","post","bar","wide"];
export const SHOT_TEXT={goal:"Tor!",post:"Pfosten!",bar:"Latte!",wide:"Knapp vorbei"};
const SHOT_ARIA={goal:"Der Ball fliegt ins Tor.",post:"Der Ball trifft den Pfosten.",bar:"Der Ball trifft die Latte.",wide:"Der Ball fliegt knapp am Tor vorbei."};
const POP_TEXT={post:"PLING!",bar:"BONG!",wide:"Uups!"};

// Richtig: Tor. Falsch: zufällig Pfosten, Latte oder knapp vorbei. Seite zufällig (-1 links, 1 rechts).
export function pickShot(ok,rnd=Math.random){
  return{kind:ok?"goal":["post","bar","wide"][Math.floor(rnd()*3)%3],side:rnd()<.5?-1:1};
}
// Ballbahn in Bildpunkten der Szene (340 mal 230), s ist der Maßstab (Perspektive).
// end ist der Endpunkt ohne Bewegung (reduzierte Bewegung).
export function shotPath(kind,side){
  const s={x:188,y:205,s:1};
  if(kind==="goal")return{start:s,end:{x:170+side*36,y:62,s:.62}};
  if(kind==="post")return{start:s,hit:{x:side>0?238:102,y:62,s:.66},end:{x:side>0?276:64,y:132,s:.95}};
  if(kind==="bar")return{start:s,hit:{x:170+side*34,y:32,s:.68},end:{x:170+side*34,y:32,s:.68},out:{x:170+side*62,y:-24,s:.5}};
  return{start:s,hit:{x:170+side*80,y:44,s:.64},end:{x:side>0?318:22,y:66,s:.58}};
}
const CROWD=["#e5484d","#ffc83d","#f4f4f4","#2f6fde","#34a853","#ff8a00"];
export function sceneSVG(look,shot){
  const l=cleanLook(look),k=SHOT_KINDS.includes(shot&&shot.kind)?shot.kind:"goal",side=shot&&shot.side<0?-1:1,p=shotPath(k,side);
  const pt=(n,o)=>`--${n}x:${Math.round(o.x)}px;--${n}y:${Math.round(o.y)}px;--${n}s:${o.s}`;
  const vars=[pt("s",p.start),pt("e",p.end),p.hit?pt("h",p.hit):"",p.out?pt("o",p.out):""].filter(Boolean).join(";");
  let crowd="";
  for(let r=0;r<3;r++)for(let i=0;i<40;i++)crowd+=`<circle cx="${(4+r*4+i*8.6).toFixed(1)}" cy="${46+r*7}" r="3.1" fill="${CROWD[(i*5+r*3)%CROWD.length]}"/>`;
  let stripes="";
  for(let i=0;i<8;i++)if(i%2)stripes+=`<polygon points="${170+(i-4)*22},72 ${170+(i-3)*22},72 ${170+(i-3)*80},230 ${170+(i-4)*80},230" fill="#fff" opacity=".07"/>`;
  let mesh="";
  for(let x=114;x<=226;x+=9.3)mesh+=`<line x1="${x.toFixed(1)}" y1="40" x2="${x.toFixed(1)}" y2="88"/>`;
  for(let y=40;y<=88;y+=8)mesh+=`<line x1="114" y1="${y}" x2="226" y2="${y}"/>`;
  const pop=POP_TEXT[k]?(()=>{
    const c=k==="post"?{x:side>0?290:50,y:70}:k==="bar"?{x:side>0?92:248,y:20}:{x:side>0?250:90,y:108};
    return `<g class="pop"><ellipse cx="${c.x}" cy="${c.y}" rx="${POP_TEXT[k].length*5.4+12}" ry="15" fill="#fff" stroke="${OUT}" stroke-width="2.4"/><text x="${c.x}" y="${c.y+5.5}" text-anchor="middle" font-family="${FONT}" font-size="17" fill="#e5484d">${POP_TEXT[k]}</text></g>`;
  })():"";
  return `<svg class="scene sc-${k}" viewBox="0 0 340 230" role="img" aria-label="${esc(SHOT_ARIA[k])}">`
    +`<defs><linearGradient id="scSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5eb6ff"/><stop offset="1" stop-color="#d8f0ff"/></linearGradient>`
    +`<linearGradient id="scGrass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f9a4f"/><stop offset="1" stop-color="#5cc06c"/></linearGradient>`
    +`<linearGradient id="scPost" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#e3e8ec"/><stop offset="1" stop-color="#b9c2c9"/></linearGradient>`
    +`<radialGradient id="scBall" cx=".38" cy=".34" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d5dde3"/></radialGradient></defs>`
    +`<rect width="340" height="74" fill="url(#scSky)"/><ellipse cx="60" cy="18" rx="30" ry="8" fill="#fff" opacity=".85"/><ellipse cx="84" cy="14" rx="20" ry="7" fill="#fff" opacity=".85"/><ellipse cx="280" cy="24" rx="26" ry="7" fill="#fff" opacity=".8"/>`
    +`<rect y="38" width="340" height="34" fill="#2d3f5c"/>${crowd}<rect y="66" width="340" height="8" fill="#e5484d"/><rect x="0" y="66" width="70" height="8" fill="#ffc83d"/><rect x="140" y="66" width="70" height="8" fill="#2f6fde"/><rect x="270" y="66" width="70" height="8" fill="#ffc83d"/>`
    +`<rect y="74" width="340" height="156" fill="url(#scGrass)"/>${stripes}`
    +`<g stroke="#fff" stroke-opacity=".7" stroke-width="2" fill="none"><path d="M0 93 H340"/><path d="M52 93 L28 150 H312 L288 93"/><path d="M96 93 L88 114 H252 L244 93"/></g><ellipse cx="170" cy="176" rx="5" ry="2.4" fill="#fff" opacity=".85"/>`
    +`<rect x="114" y="40" width="112" height="48" fill="#0d2a17" opacity=".3"/><g stroke="#fff" stroke-opacity=".55" stroke-width="1">${mesh}<path d="M102 32 L114 40 M238 32 L226 40 M102 92 L114 88 M238 92 L226 88"/></g><rect class="netfx" x="106" y="34" width="128" height="58" fill="#fff" opacity="0"/>`
    +`<rect x="98" y="28" width="7" height="66" rx="2" fill="url(#scPost)" stroke="${OUT}" stroke-width="1.4"/><rect x="235" y="28" width="7" height="66" rx="2" fill="url(#scPost)" stroke="${OUT}" stroke-width="1.4"/><rect x="98" y="28" width="144" height="7" rx="2" fill="url(#scPost)" stroke="${OUT}" stroke-width="1.4"/>`
    +`<g class="pl"><g transform="translate(122 84) scale(.8)">${figureG(l,"back")}</g></g>`
    +`<g class="ballpos" style="${vars}"><g class="ballspin"><circle r="9" fill="url(#scBall)" stroke="${OUT}" stroke-width="1.6"/><polygon points="0,-4.5 4.3,-1.4 2.7,3.6 -2.7,3.6 -4.3,-1.4" fill="${OUT}"/><path d="M0 -4.5 V-9 M4.3 -1.4 L8.6 -2.8 M2.7 3.6 L5.3 7.3 M-2.7 3.6 L-5.3 7.3 M-4.3 -1.4 L-8.6 -2.8" stroke="${OUT}" stroke-width="1.4" fill="none"/></g><ellipse cx="-3" cy="-4.4" rx="2.8" ry="1.7" fill="#fff" opacity=".75"/></g>`
    +pop
    +`</svg>`;
}
