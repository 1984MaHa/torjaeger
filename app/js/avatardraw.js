// Zeichnen der Figuren: Spieler, Wappen, Trainer und die Torszene. Alles eigene, einfache Formen
// (keine bekannten Figuren, keine Vereinslogos). Koordinaten: Spieler 100 breit und 170 hoch.
// Alle Farben und Texte laufen vorher durch cleanLook bzw. cleanTrainerLook und esc.
import {esc} from "./util.js";
import {cleanLook,cleanTrainerLook,COLOR_NAMES} from "./avatar.js";

const INK="#16271c";
const FONT="Lilita One, Arial Rounded MT Bold, Arial, sans-serif";
const lum=h=>{const n=parseInt(h.slice(1),16);return(0.299*(n>>16&255)+0.587*(n>>8&255)+0.114*(n&255))/255;};
const textOn=h=>lum(h)>0.6?INK:"#ffffff";

// Haare. behind wird vor dem Körper gezeichnet, top nach dem Kopf (Vorderansicht) bzw. nach dem Trikot (Rückansicht).
function hairParts(style,c,view){
  const front=view==="front",o=style===7?' opacity=".55"':"";
  const capFront=`<path d="M31 33 Q30 11 50 11 Q70 11 69 33 Q66 22 50 22 Q34 22 31 33Z" fill="${c}"${o}/>`;
  const capBack=`<path d="M31 37 Q29 10 50 10 Q71 10 69 37 Q68 47 50 48 Q32 47 31 37Z" fill="${c}"${o}/>`;
  const cap=front?capFront:capBack;
  const dots=(pts,r)=>pts.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="${r}" fill="${c}"/>`).join("");
  let behind="",top=cap;
  if(style===1)top=cap+dots([[38,12],[50,8],[62,12],[44,10],[56,10]],6);
  else if(style===2){
    top=cap+dots([[33,26],[37,16],[46,11],[56,11],[64,16],[68,26]],7)+(front?dots([[40,22],[50,20],[60,22]],5.5):dots([[34,40],[66,40],[42,45],[58,45],[50,46]],6));
  }
  else if(style===3){
    if(front)behind=`<path d="M64 16 Q92 18 86 46 Q82 58 75 61 Q80 40 66 28Z" fill="${c}"/>`;
    else top=cap+`<path d="M44 18 Q50 12 56 18 Q62 46 56 62 Q50 68 44 62 Q38 46 44 18Z" fill="${c}"/><circle cx="50" cy="20" r="3.2" fill="#e5484d"/>`;
  }
  else if(style===4){
    const chain=(x,ys)=>ys.map(y=>`<circle cx="${x}" cy="${y}" r="4.6" fill="${c}"/>`).join("");
    if(front)behind=chain(26,[46,54,62,70])+chain(74,[46,54,62,70]);
    else top=cap+chain(31,[52,60,68,76])+chain(69,[52,60,68,76]);
  }
  else if(style===5){
    if(front)behind=`<path d="M31 30 Q29 12 50 12 Q71 12 69 30 L75 78 Q50 86 25 78Z" fill="${c}"/>`;
    else top=`<path d="M31 37 Q29 10 50 10 Q71 10 69 37 L72 70 Q50 77 28 70Z" fill="${c}"/>`;
  }
  else if(style===6)top=cap+`<circle cx="50" cy="8" r="7.5" fill="${c}"/>`;
  return{behind,top};
}

// Spieler als Gruppe (ohne svg-Hülle). view: front oder back (mit Name und Rückennummer auf dem Trikot).
export function figureG(look,view="front"){
  const l=cleanLook(look),front=view==="front";
  const tx=textOn(l.shirt),hp=hairParts(l.hair,l.hairColor,view);
  const nameText=l.shirtName,ns=Math.max(4.5,Math.min(8,34/(Math.max(1,nameText.length)*0.62)));
  const numS=l.number.length>1?22:26;
  const arm=(x,s)=>{ // s = -1 links, 1 rechts; x = Schulterpunkt
    return `<path d="M${x} 57 Q${x+s*9} 58 ${x+s*12} 66 L${x+s*16} 84 Q${x+s*11} 88 ${x+s*5} 86 L${x} 72Z" fill="${l.shirt}"/>`
      +`<path d="M${x+s*11.5} 79 L${x+s*16.5} 81.5 L${x+s*16} 85.5 Q${x+s*11} 89 ${x+s*5.5} 86.5 L${x+s*5.5} 83Z" fill="${l.c2}"/>`
      +`<rect x="${s<0?x-21:x+11}" y="84" width="10" height="17" rx="5" fill="${l.skin}"/>`;
  };
  let g=`<ellipse cx="50" cy="167" rx="30" ry="4" fill="#000" opacity=".18"/>`;
  g+=hp.behind;
  // Beine, Stutzen, Schuhe
  g+=`<rect x="30" y="126" width="15" height="34" rx="6" fill="${l.skin}"/><rect x="55" y="126" width="15" height="34" rx="6" fill="${l.skin}"/>`;
  g+=`<rect x="30" y="141" width="15" height="19" rx="5" fill="${l.shirt}"/><rect x="55" y="141" width="15" height="19" rx="5" fill="${l.shirt}"/>`;
  g+=`<rect x="30" y="141" width="15" height="4" fill="${l.c2}"/><rect x="55" y="141" width="15" height="4" fill="${l.c2}"/>`;
  g+=`<rect x="26" y="156" width="22" height="10" rx="5" fill="${l.boots}"/><rect x="52" y="156" width="22" height="10" rx="5" fill="${l.boots}"/>`;
  // Arme mit Händen, Rumpf
  g+=arm(30,-1)+arm(70,1);
  g+=`<path d="M30 57 Q50 50 70 57 L73 105 L27 105Z" fill="${l.shirt}"/>`;
  // Hose mit Streifen in der zweiten Vereinsfarbe
  g+=`<path d="M27 102 L73 102 L77 131 L53 131 L50 117 L47 131 L23 131Z" fill="${l.shorts}"/>`
    +`<path d="M27 102 L31 102 L27.5 131 L23 131Z" fill="${l.c2}"/><path d="M73 102 L69 102 L72.5 131 L77 131Z" fill="${l.c2}"/>`;
  // Hals und Kopf
  g+=`<rect x="44" y="47" width="12" height="11" fill="${l.skin}"/>`;
  g+=`<circle cx="32" cy="34" r="3.6" fill="${l.skin}"/><circle cx="68" cy="34" r="3.6" fill="${l.skin}"/><circle cx="50" cy="32" r="18" fill="${l.skin}"/>`;
  if(front){
    g+=`<path d="M43 55 L50 64 L57 55Z" fill="${l.skin}"/><path d="M42 55 L50 65 L58 55" stroke="${l.c2}" stroke-width="2.4" fill="none" stroke-linejoin="round"/>`;
    g+=hp.top;
    g+=`<circle cx="42" cy="34" r="2.4" fill="${INK}"/><circle cx="58" cy="34" r="2.4" fill="${INK}"/><path d="M43 41 Q50 47.5 57 41" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`
      +`<circle cx="37.5" cy="40" r="3" fill="#ff8a80" opacity=".35"/><circle cx="62.5" cy="40" r="3" fill="#ff8a80" opacity=".35"/>`;
    g+=`<text x="50" y="92" text-anchor="middle" font-family="${FONT}" font-size="${numS-2}" fill="${tx}">${esc(l.number)}</text>`;
  }else{
    g+=`<path d="M42 55 Q50 60 58 55" stroke="${l.c2}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    g+=`<text x="50" y="76" text-anchor="middle" font-family="${FONT}" font-size="${ns}" fill="${tx}">${esc(nameText)}</text>`;
    g+=`<text x="50" y="101" text-anchor="middle" font-family="${FONT}" font-size="${numS}" fill="${tx}">${esc(l.number)}</text>`;
    g+=hp.top;
  }
  return g;
}
const ariaLook=l=>`Spieler mit Trikot ${COLOR_NAMES[l.shirt]||"bunt"} und Nummer ${l.number}`;

// Vollständige Grafik. crop: "full" (ganze Figur), "bust" (bis zum Gürtel, für Kacheln), "head" (Frisuren-Auswahl).
export function avatarSVG(look,{view="front",px=100,crop="full",label}={}){
  const l=cleanLook(look);
  const vb=crop==="head"?"10 0 80 64":crop==="bust"?"8 2 84 106":"0 0 100 170";
  const [,,w,h]=vb.split(" ").map(Number);
  return `<svg class="avsvg" viewBox="${vb}" width="${Math.round(px*w/h)}" height="${px}" role="img" aria-label="${esc(label||ariaLook(l))}">${figureG(l,view)}</svg>`;
}

// Wappen aus den beiden Vereinsfarben
export function crestSVG(look,px=40){
  const l=cleanLook(look);
  return `<svg viewBox="0 0 40 46" width="${Math.round(px*40/46)}" height="${px}" role="img" aria-label="Wappen von ${esc(l.team)}"><path d="M4 4 H36 V24 Q36 38 20 44 Q4 38 4 24Z" fill="${l.c1}"/><path d="M20 4 H36 V24 Q36 38 20 44Z" fill="${l.c2}"/><path d="M4 4 H36 V24 Q36 38 20 44 Q4 38 4 24Z" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/><circle cx="20" cy="22" r="6.5" fill="#fff" stroke="${INK}" stroke-width="2"/></svg>`;
}

// ---------- Trainer ----------
export function trainerSVG(look,{px=64,label}={}){
  const l=cleanTrainerLook(look);
  let g=`<ellipse cx="50" cy="127" rx="34" ry="3.5" fill="#000" opacity=".15"/>`;
  g+=`<path d="M20 128 Q18 84 50 80 Q82 84 80 128Z" fill="${l.jacket}"/><path d="M50 84 L50 128" stroke="#fff" stroke-width="2.2" opacity=".8"/>`;
  g+=`<rect x="43" y="66" width="14" height="16" fill="${l.skin}"/>`;
  g+=`<circle cx="30" cy="54" r="4" fill="${l.skin}"/><circle cx="70" cy="54" r="4" fill="${l.skin}"/><circle cx="50" cy="52" r="20" fill="${l.skin}"/>`;
  g+=`<path d="M30 48 Q29 58 33 63 L35 48Z" fill="${l.hairColor}"/><path d="M70 48 Q71 58 67 63 L65 48Z" fill="${l.hairColor}"/>`;
  if(l.beard)g+=`<path d="M32 58 Q34 76 50 78 Q66 76 68 58 Q60 68 50 68 Q40 68 32 58Z" fill="${l.hairColor}"/>`;
  g+=`<circle cx="42" cy="54" r="2.4" fill="${INK}"/><circle cx="58" cy="54" r="2.4" fill="${INK}"/><path d="M43 61 Q50 67 57 61" stroke="${l.beard?"#fff":INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  g+=`<path d="M28 46 Q28 22 50 22 Q72 22 72 46Z" fill="${l.cap}"/><path d="M24 47 Q50 38 76 47 Q76 53 50 51 Q24 53 24 47Z" fill="${l.cap}" stroke="#000" stroke-opacity=".2" stroke-width="1.5"/>`;
  g+=`<circle cx="50" cy="33" r="5.5" fill="#fff" stroke="${INK}" stroke-width="1.6"/><path d="M50 29 L53 32 L52 36 L48 36 L47 32Z" fill="${INK}"/>`;
  g+=`<path d="M40 82 Q50 100 60 82" stroke="${INK}" stroke-width="2" fill="none"/><rect x="44" y="96" width="14" height="9" rx="4.5" fill="#ffc83d" stroke="${INK}" stroke-width="1.6"/><circle cx="48" cy="100.5" r="1.8" fill="${INK}"/>`;
  return `<svg class="avsvg" viewBox="0 0 100 130" width="${Math.round(px*100/130)}" height="${px}" role="img" aria-label="${esc(label||"Trainer mit Kappe und Pfeife")}">${g}</svg>`;
}

// ---------- Torszene ----------
// Der Spieler steht mit dem Rücken zur Kamera und schießt aufs Tor.
// Ausgang: goal (Tor), post (Pfosten), bar (Latte), wide (knapp vorbei).
export const SHOT_KINDS=["goal","post","bar","wide"];
export const SHOT_TEXT={goal:"Tor!",post:"Pfosten!",bar:"Latte!",wide:"Knapp vorbei"};
const SHOT_ARIA={goal:"Der Ball fliegt ins Tor.",post:"Der Ball trifft den Pfosten.",bar:"Der Ball trifft die Latte.",wide:"Der Ball fliegt knapp am Tor vorbei."};

// Richtig: Tor. Falsch: zufällig Pfosten, Latte oder knapp vorbei. Seite zufällig (-1 links, 1 rechts).
export function pickShot(ok,rnd=Math.random){
  return{kind:ok?"goal":["post","bar","wide"][Math.floor(rnd()*3)%3],side:rnd()<.5?-1:1};
}
// Ballbahn in Bildpunkten der Szene (340 mal 230). end ist der Endpunkt ohne Bewegung (reduzierte Bewegung).
export function shotPath(kind,side){
  const s={x:178,y:208};
  if(kind==="goal")return{start:s,end:{x:170+side*42,y:58}};
  if(kind==="post")return{start:s,hit:{x:side>0?249:91,y:58},end:{x:side>0?278:62,y:124}};
  if(kind==="bar")return{start:s,hit:{x:170+side*38,y:15},end:{x:170+side*38,y:15},out:{x:170+side*72,y:-30}};
  return{start:s,hit:{x:170+side*70,y:36},end:{x:side>0?296:44,y:66}};
}
export function sceneSVG(look,shot){
  const l=cleanLook(look),k=SHOT_KINDS.includes(shot&&shot.kind)?shot.kind:"goal",side=shot&&shot.side<0?-1:1,p=shotPath(k,side);
  const px=o=>`${Math.round(o.x)}px`,py=o=>`${Math.round(o.y)}px`;
  const vars=`--sx:${px(p.start)};--sy:${py(p.start)};--ex:${px(p.end)};--ey:${py(p.end)}`+(p.hit?`;--hx:${px(p.hit)};--hy:${py(p.hit)}`:"")+(p.out?`;--ox:${px(p.out)};--oy:${py(p.out)}`:"");
  let net="";
  for(let x=94;x<=246;x+=12)net+=`<line x1="${x}" y1="18" x2="${x}" y2="86"/>`;
  for(let y=18;y<=86;y+=12)net+=`<line x1="94" y1="${y}" x2="246" y2="${y}"/>`;
  const team=l.team,tw=Math.round(team.length*7.2+40);
  return `<svg class="scene sc-${k}" viewBox="0 0 340 230" role="img" aria-label="${esc(SHOT_ARIA[k])}">`
    +`<rect width="340" height="230" fill="#4fae63"/><rect y="0" width="340" height="40" fill="#57b96b"/><rect y="86" width="340" height="44" fill="#57b96b"/><rect y="176" width="340" height="54" fill="#57b96b"/>`
    +`<rect x="94" y="18" width="152" height="68" fill="#1d5b30" opacity=".28"/><g stroke="#fff" stroke-opacity=".55" stroke-width="1">${net}</g><rect class="netfx" x="94" y="18" width="152" height="68" fill="#fff" opacity="0"/>`
    +`<line x1="40" y1="86" x2="300" y2="86" stroke="#fff" stroke-opacity=".7" stroke-width="2"/>`
    +`<rect x="88" y="12" width="6" height="76" rx="2" fill="#fff"/><rect x="246" y="12" width="6" height="76" rx="2" fill="#fff"/><rect x="88" y="12" width="164" height="6" rx="2" fill="#fff"/>`
    +`<ellipse cx="170" cy="150" rx="5" ry="2.5" fill="#fff" opacity=".8"/>`
    +`<g class="pl"><g transform="translate(119 116) scale(.62)">${figureG(l,"back")}</g></g>`
    +`<g class="ballpos" style="${vars}"><g class="ballspin"><circle r="8" fill="#fff" stroke="${INK}" stroke-width="1.6"/><polygon points="0,-4 3.8,-1.2 2.4,3.2 -2.4,3.2 -3.8,-1.2" fill="${INK}"/></g></g>`
    +`<g><rect x="6" y="198" width="${tw}" height="24" rx="12" fill="${l.c1}"/><circle cx="19" cy="210" r="7" fill="${l.c2}" stroke="#fff" stroke-width="1.5"/><text x="32" y="215.5" font-family="${FONT}" font-size="14" fill="${textOn(l.c1)}">${esc(team)}</text></g>`
    +`</svg>`;
}
