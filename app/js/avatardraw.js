// Zeichnen der Figuren: Spieler (Ganzkörper und Brustbild), Wappen, Trainerteam und die Torszene.
// Alles eigene Formen (keine bekannten Figuren, keine Vereinslogos). Alle Farben und Texte laufen vorher
// durch cleanLook bzw. cleanTrainerLook und esc.
// Stil (ab 1.3.0): flache Vektorgrafik ohne Konturlinien, große weiche Farbflächen, höchstens eine hellere
// Glanzfläche. Kein Mundbereich mit Kontur, Lippen oder dunkler Fläche: die untere Gesichtshälfte ist glatte Haut.
// Koordinaten: Ganzkörper 120 breit, von y -10 bis 190. Kopfmitte (60, 46), Augen auf y 50, Brauen auf y 37 bis 40.
import {esc} from "./util.js";
import {cleanLook,cleanTrainerLook,COLOR_NAMES} from "./avatar.js";

const INK="#2b2320";
const FONT="Lilita One, Arial Rounded MT Bold, Arial, sans-serif";
const clamp=v=>Math.max(0,Math.min(255,Math.round(v)));
function mix(h,to,t){const a=parseInt(h.slice(1),16),b=parseInt(to.slice(1),16);const c=s=>clamp(((a>>s)&255)*(1-t)+((b>>s)&255)*t);return"#"+[16,8,0].map(s=>c(s).toString(16).padStart(2,"0")).join("");}
const dark=(h,t=.22)=>mix(h,"#000000",t),light=(h,t=.3)=>mix(h,"#ffffff",t);
const lum=h=>{const n=parseInt(h.slice(1),16);return(0.299*(n>>16&255)+0.587*(n>>8&255)+0.114*(n&255))/255;};
const textOn=h=>lum(h)>0.6?INK:"#ffffff";
const P=(d,f,extra="")=>`<path d="${d}" fill="${f}"${extra?" "+extra:""}/>`;
const C=(x,y,r,f,extra="")=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${f}"${extra?" "+extra:""}/>`;
const circles=(pts,r,f)=>pts.map(p=>C(p[0],p[1],p[2]||r,f)).join("");
const mirror=inner=>`<g transform="translate(120 0) scale(-1 1)">${inner}</g>`;

// Grenzen für die Regeln: Brauen beginnen bei y 34,9. Keine Kopfbedeckung und keine Frisur reicht im Gesicht tiefer als HAT_LIMIT.
export const BROW_TOP=34,HAT_LIMIT=33;

// ---------- Kopfbedeckungen (Vorderansicht endet immer über den Brauen) ----------
// 0 keine, 1 Cap, 2 Cap verkehrt herum, 3 Mütze, 4 Stirnband, 5 Bandana, 6 Hut
export function hatParts(hat,c,view){
  if(!hat)return"";
  const front=view==="front",cd=dark(c,.2),cl=light(c,.3),hl=`<path d="M42 10 Q56 4 72 9" stroke="#fff" stroke-opacity=".32" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  const cap="M30 32 C28 12 44 2 60 2 C76 2 92 12 90 32 C78 27 42 27 30 32Z";
  if(hat===1)return front
    ?P(cap,c)+hl+C(60,3.5,3,cd)+C(60,16,5,"#fff","fill-opacity=\".9\"")+P("M34 30 C46 23 74 23 86 30 C88 33 84 33 78 33 C68 29 52 29 42 33 C36 33 32 33 34 30Z",cd)
    :P("M30 36 C28 10 44 2 60 2 C76 2 92 10 90 36 C78 40 42 40 30 36Z",c)+hl+C(60,3.5,3,cd)+P("M31 33 C44 37 76 37 89 33 L89 36 C76 40 44 40 31 36Z",cd);
  if(hat===2)return front
    ?P(cap,c)+hl+C(60,3.5,3,cd)+P("M31 29 C44 24 76 24 89 29 L89 32 C76 27 44 27 31 32Z",cd)+P("M55 25 L65 25 L65 31 L55 31Z",cl)
    :P("M30 36 C28 10 44 2 60 2 C76 2 92 10 90 36 C78 40 42 40 30 36Z",c)+hl+C(60,3.5,3,cd)+P("M36 35 C48 41 72 41 84 35 C92 39 90 50 78 50 C68 45 52 45 42 50 C30 50 28 39 36 35Z",cd);
  if(hat===3)return front
    ?P("M29 32 C26 8 44 2 60 2 C76 2 94 8 91 32Z",c)+`<rect x="28" y="21" width="64" height="11" rx="5" fill="${cl}"/>`+C(60,1,7,cl)+`<path d="M44 9 Q56 4 70 8" stroke="#fff" stroke-opacity=".3" stroke-width="3" fill="none" stroke-linecap="round"/>`
    :P("M29 38 C26 8 44 2 60 2 C76 2 94 8 91 38Z",c)+`<rect x="28" y="28" width="64" height="11" rx="5" fill="${cl}"/>`+C(60,1,7,cl);
  if(hat===4)return front
    ?P("M30 32 C42 26 78 26 90 32 L90 24 C78 18 42 18 30 24Z",c)+P("M30 29 C42 23 78 23 90 29 L90 27 C78 21 42 21 30 27Z",cl)
    :P("M30 38 C42 44 78 44 90 38 L90 28 C78 34 42 34 30 28Z",c)+P("M30 34 C42 40 78 40 90 34 L90 32 C78 38 42 38 30 32Z",cl);
  if(hat===5){
    const dots=[[44,22],[52,15],[62,13],[72,17],[79,24],[48,27],[66,24]].map(p=>C(p[0],p[1],1.7,"#fff","fill-opacity=\".85\"")).join("");
    return front
      ?P("M30 32 C28 6 92 6 90 32 C78 27 42 27 30 32Z",c)+dots+P("M88 24 L104 20 L101 32Z",cd)+C(89,25,3.6,cl)
      :P("M30 38 C28 6 92 6 90 38 C78 44 42 44 30 38Z",c)+dots+P("M54 42 L44 60 L57 55Z M66 42 L76 60 L63 55Z",cd)+C(60,42,4.4,cl);
  }
  // 6 Hut
  return front
    ?P("M40 28 C40 6 80 6 80 28Z",c)+P("M40 22 L80 22 L80 28 L40 28Z",cd)+`<ellipse cx="60" cy="28" rx="36" ry="5" fill="${cd}"/>`
    :P("M40 34 C40 8 80 8 80 34Z",c)+P("M40 28 L80 28 L80 34 L40 34Z",cd)+`<ellipse cx="60" cy="34" rx="36" ry="6" fill="${cd}"/>`;
}
const HIDES_HAIR=[1,2,3,5,6]; // diese Kopfbedeckungen verdecken die Frisur oben

// ---------- Haare vorn ----------
const CAP="M30 48 C26 16 44 6 60 6 C76 6 94 16 90 48 C88 40 84 34 78 31 C70 28 50 28 42 31 C36 34 32 40 30 48Z";
const CAP_BANGS="M30 48 C26 16 44 6 60 6 C76 6 94 16 90 48 L89 34 C76 28 44 28 31 34Z";
const strands=L=>`<path d="M29 42 C24 58 24 ${L-14} 32 ${L} L42 ${L-4} C38 ${L-20} 38 62 40 46Z" /><path d="M91 42 C96 58 96 ${L-14} 88 ${L} L78 ${L-4} C82 ${L-20} 82 62 80 46Z" />`;
const SPIKES="M34 26 L34 4 L45 18 L52 -2 L60 16 L68 -2 L75 18 L86 4 L86 26Z";
const LEN={bob:86,halblang:100,lang:118,halbzopf:96,surfer:0};
function hairFront(key,c,acc,hatHides){
  const hd=dark(c,.28),hl=light(c,.25),sh=d=>P(d,c);
  if(key==="ohne")return{behind:"",top:hatHides?"":`<path d="M46 18 Q60 10 74 18" stroke="#fff" stroke-opacity=".35" stroke-width="3.4" fill="none" stroke-linecap="round"/>`,side:""};
  const strandsEl=L=>strands(L).replace(/ \/>/g,` fill="${c}"/>`);
  let behind="",top="";
  const gloss=`<path d="M42 22 C50 11 66 9 79 15 C65 13 53 17 44 28Z" fill="${hl}" fill-opacity=".75"/>`;
  switch(key){
    case"kurz":top=sh(CAP)+gloss;break;
    case"wuschel":top=circles([[40,14,8],[52,9,8.5],[66,9,8.5],[79,14,8],[33,27,7],[87,27,7]],8,c)+sh(CAP)+gloss;break;
    case"igel":top=sh(SPIKES)+sh(CAP)+gloss;break;
    case"locken":top=circles([[33,34,7.5],[33,22,8],[40,12,8],[51,7,8.5],[62,6,8.5],[73,8,8.5],[83,14,8],[87,26,8],[87,34,7.5],[46,24,8],[60,22,8],[74,24,8]],8,c)+C(50,14,3,hl)+C(68,12,3,hl);break;
    case"tolle":top=sh(CAP)+sh("M40 26 C42 0 76 -4 92 18 C76 10 60 14 48 30Z")+gloss;break;
    case"stoppel":top=P(CAP,c,'fill-opacity=".55"');break;
    case"scheitel":top=sh(CAP)+P("M60 8 C56 18 62 26 74 29 C64 26 58 18 60 8Z",hd,'fill-opacity=".55"')+gloss;break;
    case"surfer":top=sh(CAP)+sh("M30 46 C26 62 28 74 34 80 L42 72 C38 64 38 54 38 46Z")+sh("M90 46 C94 62 92 74 86 80 L78 72 C82 64 82 54 82 46Z")+gloss;break;
    case"fransen":top=sh("M30 48 C26 16 44 6 60 6 C76 6 94 16 90 48 L86 36 L82 33 L78 26 L73 33 L68 25 L62 33 L56 25 L50 33 L45 26 L40 33 L36 36Z")+gloss;break;
    case"bob":behind=strandsEl(LEN.bob);top=sh(CAP_BANGS)+gloss;break;
    case"halblang":behind=strandsEl(LEN.halblang);top=sh(CAP)+gloss;break;
    case"lang":behind=strandsEl(LEN.lang);top=sh(CAP)+gloss;break;
    case"lockenmaehne":behind=circles([[28,54],[26,68],[28,82],[92,54],[94,68],[92,82]],9,c);top=circles([[33,34,7.5],[33,22,8],[40,12,8],[51,7,8.5],[62,6,8.5],[73,8,8.5],[83,14,8],[87,26,8],[87,34,7.5],[46,24,8],[60,22,8],[74,24,8]],8,c);break;
    case"zoepfe":{const chain=x=>[66,75,84,93,102].map((y,i)=>`<ellipse cx="${x+(i%2?1.6:-1.6)}" cy="${y}" rx="6" ry="7" fill="${c}"/>`).join("");
      behind=chain(28)+C(28,110,4.6,acc)+chain(92)+C(92,110,4.6,acc);top=sh(CAP_BANGS)+gloss;break;}
    case"pferdeschwanz":behind=sh("M76 18 C104 14 112 50 100 76 C95 84 90 86 86 82 C92 64 90 44 76 34Z")+C(80,22,4.6,acc);top=sh(CAP)+gloss;break;
    case"dutt":top=sh(CAP)+C(60,4,10,c)+`<path d="M50 9 Q60 14 70 9" stroke="${acc}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`+gloss;break;
    case"halbzopf":behind=strandsEl(LEN.halbzopf);top=sh(CAP)+`<path d="M60 12 L76 4 L76 20Z M60 12 L44 4 L44 20Z" fill="${acc}"/>`+C(60,12,4.4,dark(acc,.2))+gloss;break;
    case"pony":top=sh(CAP_BANGS)+gloss;break;
    default:top=sh(CAP)+gloss;
  }
  const side=P("M30 48 C29 40 31 35 35 33 L38 42 C36 45 35 49 34 53Z",c)+P("M90 48 C91 40 89 35 85 33 L82 42 C84 45 85 49 86 53Z",c);
  return{behind,top,side};
}

// ---------- Haare hinten: jede Frisur hat eine eigene Hinterkopf-Zeichnung ----------
const BK="M30 50 C26 14 44 4 60 4 C76 4 94 14 90 50 C90 60 84 66 76 68 L44 68 C36 66 30 60 30 50Z";
function hairBack(key,c,acc){
  const hd=dark(c,.25),hl=light(c,.25),sh=d=>P(d,c),sw=(d,w=1.8,col=hd)=>`<path d="${d}" stroke="${col}" stroke-opacity=".6" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
  const gloss=`<path d="M42 18 Q58 8 78 16" stroke="#fff" stroke-opacity=".3" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
  let g="";
  switch(key){
    case"ohne":return `<g data-hb="ohne"><path d="M46 18 Q60 10 74 18" stroke="#fff" stroke-opacity=".35" stroke-width="3.4" fill="none" stroke-linecap="round"/></g>`;
    case"kurz":g=sh(BK)+sw("M60 14 C70 14 72 26 62 26 C55 26 55 19 60 19")+gloss;break;
    case"wuschel":g=circles([[36,14,8],[50,8,8.5],[66,8,8.5],[82,14,8],[31,30,7],[89,30,7],[35,50,6.5],[85,50,6.5]],8,c)+sh(BK)+gloss;break;
    case"igel":g=sh(SPIKES)+sh(BK)+gloss;break;
    case"locken":g=circles([[34,36,8],[33,22,8],[40,12,8],[51,7,8.5],[62,6,8.5],[73,8,8.5],[83,14,8],[87,26,8],[86,38,8],[34,50,7.5],[86,52,7.5],[44,56,8],[60,60,8.5],[76,56,8],[46,32,8],[60,30,8],[74,32,8]],8,c)+C(50,18,3,hl)+C(70,16,3,hl);break;
    case"tolle":g=sh(BK)+sh("M44 10 C48 -4 76 -2 86 14 C72 6 58 8 52 18Z")+gloss;break;
    case"stoppel":g=P(BK,c,'fill-opacity=".55"');break;
    case"scheitel":g=sh(BK)+sw("M60 6 C56 20 60 32 70 40")+gloss;break;
    case"surfer":g=sh("M29 50 C25 14 44 4 60 4 C76 4 95 14 91 50 C92 64 88 76 78 78 L42 78 C32 76 28 64 29 50Z")+gloss;break;
    case"fransen":g=sh("M30 50 C26 14 44 4 60 4 C76 4 94 14 90 50 L87 60 L81 66 L75 61 L68 70 L62 62 L56 70 L50 62 L44 66 L38 61 L33 58Z")+gloss;break;
    case"bob":g=sh("M27 48 C23 12 44 3 60 3 C76 3 97 12 93 48 C95 66 92 82 84 84 L36 84 C28 82 25 66 27 48Z")+gloss;break;
    case"halblang":g=sh("M27 48 C23 12 44 3 60 3 C76 3 97 12 93 48 C97 70 94 92 84 94 L36 94 C26 92 23 70 27 48Z")+gloss;break;
    case"lang":g=sh("M27 48 C23 12 44 3 60 3 C76 3 97 12 93 48 C98 70 96 90 88 94 L78 88 L70 94 L60 88 L50 94 L42 88 L32 94 C24 90 22 70 27 48Z")+gloss;break;
    case"lockenmaehne":g=circles([[30,30,9],[32,44,9],[30,58,9],[32,72,9],[36,86,9],[90,30,9],[88,44,9],[90,58,9],[88,72,9],[84,86,9],[46,82,9],[60,86,9],[74,82,9],[60,14,14],[44,22,10],[76,22,10],[48,48,10],[72,48,10],[60,66,10],[40,14,8],[80,14,8]],9,c)+C(52,16,3,hl)+C(70,18,3,hl);break;
    case"zoepfe":{const chain=x=>[72,80,88,96].map((y,i)=>`<ellipse cx="${x+(i%2?1.4:-1.4)}" cy="${y}" rx="5.6" ry="6.6" fill="${c}"/>`).join("");
      g=sh(BK)+chain(35)+C(35,104,4.2,acc)+chain(85)+C(85,104,4.2,acc)+gloss;break;}
    case"pferdeschwanz":g=sh(BK)+sh("M52 10 C54 2 66 2 68 10 C78 36 74 80 64 90 C61 93 59 93 56 90 C46 80 42 36 52 10Z")+C(60,15,5,acc)+gloss;break;
    case"dutt":g=sh(BK)+C(60,4,11,c)+`<path d="M49 9 Q60 15 71 9" stroke="${acc}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`+gloss;break;
    case"halbzopf":g=sh("M27 48 C23 12 44 3 60 3 C76 3 97 12 93 48 C96 66 94 86 84 90 L36 90 C26 86 24 66 27 48Z")+`<path d="M60 12 L76 4 L76 20Z M60 12 L44 4 L44 20Z" fill="${acc}"/>`+C(60,12,4.4,dark(acc,.2))+gloss;break;
    case"pony":g=sh("M29 50 C25 14 44 4 60 4 C76 4 95 14 91 50 C91 58 86 64 78 66 L42 66 C34 64 29 58 29 50Z")+gloss;break;
    default:g=sh(BK)+gloss;
  }
  return `<g data-hb="${key}">${g}</g>`;
}

// ---------- Kopf (gemeinsam für Kinder und Trainerteam) ----------
const FACE_PATHS=[
  "M32 44 C32 24 44 14 60 14 C76 14 88 24 88 44 C88 62 76 76 60 76 C44 76 32 62 32 44Z",
  "M31 46 C31 28 44 16 60 16 C76 16 89 28 89 46 C89 63 76 76 60 76 C44 76 31 63 31 46Z",
  "M32 40 C32 22 44 14 60 14 C76 14 88 22 88 40 L88 56 C88 69 79 76 68 76 L52 76 C41 76 32 69 32 56Z",
  "M31 38 C31 22 43 14 60 14 C77 14 89 22 89 38 C89 52 78 64 68 72 C64 76 62 79 60 79 C58 79 56 76 52 72 C42 64 31 52 31 38Z",
  "M34 42 C34 24 45 12 60 12 C75 12 86 24 86 42 C86 58 80 72 72 77 C68 80 64 82 60 82 C56 82 52 80 48 77 C40 72 34 58 34 42Z"
];
const EAR_X=[31,30,31,30,34];
const ROSE="#a84450",MOUTH_IN="#b4404f";
function eyeSvg(x,sh,eyes){
  const [rx,ry]=[[4.6,4.6],[4.2,5.4],[5,3.4]][sh];
  return `<g data-part="eye"><ellipse cx="${x}" cy="50" rx="${rx}" ry="${ry}" fill="${dark(eyes,.55)}"/><ellipse cx="${x}" cy="${+(50+ry*.32).toFixed(2)}" rx="${+(rx*.6).toFixed(2)}" ry="${+(ry*.5).toFixed(2)}" fill="${eyes}"/>${C(+(x+rx*.36).toFixed(2),+(50-ry*.38).toFixed(2),1.5,"#fff")}</g>`;
}
function mouthSvg(m){
  if(m===1)return `<path d="M50.5 62.5 Q60 65 69.5 62.5 Q68.5 75 60 75 Q51.5 75 50.5 62.5Z" fill="${MOUTH_IN}"/><path d="M51.4 63 Q60 65.4 68.6 63 Q68.3 67 67.8 67.6 Q60 69.6 52.2 67.6 Q51.7 67 51.4 63Z" fill="#fff"/><ellipse cx="60" cy="72.2" rx="4.6" ry="2.3" fill="#f3889a"/>`;
  if(m===2)return `<path d="M54.5 66.5 Q60 65 65.5 66.5" stroke="${ROSE}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  if(m===3)return `<ellipse cx="60" cy="67" rx="3.8" ry="4.8" fill="${MOUTH_IN}"/>`;
  return `<path d="M52.5 64 Q60 71.5 67.5 64" stroke="${ROSE}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
}
function beardSvg(type,c,sk){
  if(!type)return"";
  const fx=d=>P(d,c);
  if(type===1)return fx("M30 50 C30 72 44 84 60 84 C76 84 90 72 90 50 L86 50 C84 60 80 62 76 62 C70 60 50 60 44 62 C40 62 36 60 34 50Z")+`<ellipse cx="60" cy="67" rx="13" ry="7.5" fill="${sk}"/>`+fx("M47 60 C52 56 58 59 60 60 C62 59 68 56 73 60 C70 64 64 62.5 60 62 C56 62.5 50 64 47 60Z");
  if(type===2)return fx("M48 71 C52 67 68 67 72 71 C70 83 50 83 48 71Z");
  if(type===3)return fx("M46 60 C52 55 58 59 60 60 C62 59 68 55 74 60 C70 65 64 63 60 62 C56 63 50 65 46 60Z");
  return P("M32 52 C32 72 44 82 60 82 C76 82 88 72 88 52 C84 62 76 64 60 64 C44 64 36 62 32 52Z",c,'fill-opacity=".32"');
}
// o: Merkmale des Kopfes. view: front oder back. Gibt die Gruppe im Kopfkoordinatensystem zurück.
function headG(o,view){
  const front=view==="front",sk=o.skin,ex=EAR_X[o.face],hatHides=HIDES_HAIR.includes(o.hat);
  const ear=`<g data-part="ear"><circle cx="${ex}" cy="50" r="6.4" fill="${sk}"/><circle cx="${ex+.4}" cy="50.5" r="3.3" fill="${light(sk,.2)}"/><circle cx="${120-ex}" cy="50" r="6.4" fill="${sk}"/><circle cx="${120-ex-.4}" cy="50.5" r="3.3" fill="${light(sk,.2)}"/></g>`;
  const head=`<path data-part="head" d="${FACE_PATHS[o.face]}" fill="${sk}"/>`;
  const acc=o.acc||"#e5484d",hat=hatParts(o.hat,o.hatColor,view);
  const earr=o.earrings?`<circle cx="${ex-1}" cy="61" r="4" fill="none" stroke="#c9ced6" stroke-width="2"/><circle cx="${121-ex}" cy="61" r="4" fill="none" stroke="#c9ced6" stroke-width="2"/>`:"";
  if(!front)return ear+head+hairBack(o.hair,o.hairColor,acc)+hat;
  const hf=hairFront(o.hair,o.hairColor,acc,hatHides);
  const brow=o.browColor||o.hairColor,bw=[2,2.9,4.2][o.brows];
  let face=`<g data-part="brows"><path d="M41.5 39.5 Q47.5 35 54.5 38.8" stroke="${brow}" stroke-width="${bw}" fill="none" stroke-linecap="round"/><path d="M65.5 38.8 Q72.5 35 78.5 39.5" stroke="${brow}" stroke-width="${bw}" fill="none" stroke-linecap="round"/></g>`;
  face+=eyeSvg(48,o.eyeShape,o.eyes)+eyeSvg(72,o.eyeShape,o.eyes);
  face+=`<path data-part="nose" d="${["M60 54 Q58.6 57 60.6 58","M60.4 53 Q58 58.4 61.4 59.4","M60.8 52 Q56.8 59 62 60.4"][o.nose]}" stroke="${dark(sk,.26)}" stroke-width="1.9" fill="none"  stroke-linecap="round"/>`;
  if(o.cheeks)face+=`<g data-part="cheeks">${C(38.5,60,5.2,"#ff8fa3",'fill-opacity=".5"')}${C(81.5,60,5.2,"#ff8fa3",'fill-opacity=".5"')}</g>`;
  if(o.freckles)face+=[[43,55],[48,58],[40,58.5],[45.5,61],[77,55],[72,58],[80,58.5],[74.5,61],[57.5,55],[62.5,55],[60,57]].map(p=>C(p[0],p[1],1.1,dark(sk,.3),'fill-opacity=".6"')).join("");
  const beard=o.beard?'<g data-part="beard">'+beardSvg(o.beard,o.beardColor||o.hairColor,sk)+'</g>':"";
  const mouth=`<g data-part="mouth">${mouthSvg(o.mouth)}</g>`;
  let glasses="";
  if(o.glasses===1)glasses=`<g data-part="glasses"><circle cx="48" cy="50" r="8.8" fill="#bcd4f5" fill-opacity=".2" stroke="#2a2f3a" stroke-width="2"/><circle cx="72" cy="50" r="8.8" fill="#bcd4f5" fill-opacity=".2" stroke="#2a2f3a" stroke-width="2"/><path d="M56.8 49 Q60 47 63.2 49 M39.2 48 L34 46 M80.8 48 L86 46" stroke="#2a2f3a" stroke-width="2" fill="none" stroke-linecap="round"/></g>`;
  if(o.glasses===2)glasses=`<g data-part="glasses"><rect x="38.5" y="43" width="19" height="14.6" rx="3.6" fill="#bcd4f5" fill-opacity=".2" stroke="#2a2f3a" stroke-width="2"/><rect x="62.5" y="43" width="19" height="14.6" rx="3.6" fill="#bcd4f5" fill-opacity=".2" stroke="#2a2f3a" stroke-width="2"/><path d="M57.5 48 H62.5 M38.5 47 L34 45.6 M81.5 47 L86 45.6" stroke="#2a2f3a" stroke-width="2" fill="none" stroke-linecap="round"/></g>`;
  const top=hatHides?hf.side:hf.top;
  return hf.behind+ear+head+beard+face+mouth+`<g data-hf="${o.hair}">${top}</g>`+glasses+earr+hat;
}

// ---------- Körper ----------
const BUILD_X=[.9,1,1.12];
const NUMW=.66,FIELD={x0:44,x1:76,y0:92,y1:129};
export const BACK_FIELD=FIELD;
// Rückenfeld: Name leicht gebogen über der Nummer, beides wird automatisch skaliert und bleibt im Feld.
export function backLayout(look){
  const l=cleanLook(look),name=l.shirtName,n=l.number,W=FIELD.x1-FIELD.x0-2;
  const numFs=+Math.min(26,W/(n.length*NUMW)).toFixed(2);
  const num={text:n,x:60,y:127,size:numFs,width:+(n.length*numFs*NUMW).toFixed(2),top:+(127-numFs*.75).toFixed(2)};
  const nameFs=name?+Math.max(4.4,Math.min(9,(W+2)/(name.length*.58))).toFixed(2):0,cw=nameFs*.58,R=34;
  const letters=[...name].map((ch,i,a)=>{const dx=(i-(a.length-1)/2)*cw,phi=dx/R;return{ch,x:+(60+R*Math.sin(phi)).toFixed(2),y:+(101+R*(1-Math.cos(phi))).toFixed(2),rot:+(phi*180/Math.PI).toFixed(1),w:+cw.toFixed(2)};});
  return{num,name:{text:name,size:nameFs,letters,top:+(101-nameFs*.75).toFixed(2)}};
}
function patterns(pat,c2,front){
  let g="";
  if(pat===1)g+=`<path d="M41 87 Q31 89 27 101 M42 91 Q34 93 30.5 103 M43 95 Q37 97 34 105" stroke="${c2}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`+mirror(`<path d="M41 87 Q31 89 27 101 M42 91 Q34 93 30.5 103 M43 95 Q37 97 34 105" stroke="${c2}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`);
  // Querstreifen und Brustband nur vorn: der Rücken bleibt frei für Name und Nummer
  if(pat===2&&front)g+=`<path d="M36.6 90 H83.4 V96 H36.6Z" fill="${c2}"/><path d="M36.2 118 H83.8 V124 H36.2Z" fill="${c2}"/>`;
  if(pat===3&&front)g+=`<path d="M36 92 H84 V101 H36Z" fill="${c2}"/>`;
  return g;
}
// Ganzkörper (oder Brustbild: portrait) als Gruppe. view front oder back, pose stand oder shoot (Schuss).
function bodyG(l,view,pose,portrait){
  const front=view==="front",sk=l.skin,skD=dark(sk,.14),shoot=pose==="shoot";
  const kind=portrait?l.outfit:0,main=kind?l.outfitColor:l.shirt,c2=kind?light(main,.35):l.c2,tx=textOn(main);
  let g="";
  if(!portrait)g+=`<ellipse cx="60" cy="186.5" rx="36" ry="4.5" fill="#000" opacity=".16"/>`;
  // Beine, Stutzen, Schuhe
  if(!portrait){
    const leg=(x,sx)=>`<rect x="${x}" y="150" width="12" height="28" rx="5" fill="${sk}"/><rect x="${x-1}" y="160" width="14" height="20" rx="4" fill="${l.socks}"/><rect x="${x-1}" y="162" width="14" height="3.4" fill="${l.c2}"/><rect x="${sx}" y="175" width="21" height="12" rx="6" fill="${l.boots}"/><rect x="${sx}" y="184" width="21" height="3" rx="1.5" fill="#fff" fill-opacity=".75"/>`;
    g+=leg(44,39)+(shoot?`<g transform="rotate(-42 70 152)">${leg(64,60)}</g>`:leg(64,60));
  }
  g+=`<g transform="translate(60 0) scale(${BUILD_X[l.build]} 1) translate(-60 0)">`;
  // Hals mit Schatten unter dem Kinn (nur als Fläche)
  g+=`<rect x="52" y="64" width="16" height="26" fill="${sk}"/><path d="M52 66 L68 66 L68 80 Q60 86.5 52 80Z" fill="${skD}"/>`;
  // Arme
  const armL=a=>`<g transform="rotate(${a} 40 88)"><rect x="24" y="108" width="10" height="22" rx="5" fill="${sk}"/>${C(29,131,5.8,sk)}<path d="M40 86 Q30 88 26 100 L22 114 Q29 119 37 114 L41 102Z" fill="${main}"/><path d="M22.4 112.6 Q29 118 37 113 L36.3 109.6 Q29 114.4 23.4 109Z" fill="${c2}"/></g>`;
  const arm2=shoot?[34,6]:[3,3]; // Winkel nach außen: links, rechts
  g+=armL(arm2[0])+`<g transform="translate(120 0) scale(-1 1)">${armL(arm2[1])}</g>`;
  // Rumpf
  g+=P("M40 86 Q60 79.5 80 86 L84 108 L83 134 Q60 138 37 134 L36 108Z",main);
  g+=P("M70 88 L80 86 L84 108 L83 134 Q76 136 71 136Z","#000",'opacity=".09"');
  if(kind===0)g+=patterns(l.pattern,l.c2,front);
  if(kind===2)g+=`<path d="M60 92 L60 136" stroke="${c2}" stroke-width="2.2"/><path d="M68 112 H78" stroke="${c2}" stroke-width="2" stroke-linecap="round"/>`;
  // Hose (Streifen in der zweiten Vereinsfarbe)
  if(!portrait){
    g+=P("M38 128 L82 128 L88 154 L63 154 L60 142 L57 154 L32 154Z",l.shorts)+P("M38 128 L42.5 128 L37.5 154 L32 154Z",l.c2)+P("M82 128 L77.5 128 L82.5 154 L88 154Z",l.c2)+P("M60 142 L63 154 L88 154 L82 128 L72 128Z","#000",'opacity=".08"');
  }
  // Kragen, Nummer, Rücken
  if(front){
    if(kind===1)g+=`<path d="M49 83.6 Q60 98 71 83.6Z" fill="${c2}"/><path d="M52.6 83.6 Q60 93 67.4 83.6Z" fill="${sk}"/>`;
    else if(kind===2)g+=`<path d="M48 84 L56 82 L60 92 L64 82 L72 84 L66 96 L60 100 L54 96Z" fill="${c2}"/><path d="M54 84 L60 92 L66 84Z" fill="${sk}"/>`;
    else g+=l.collar
      ?`<path d="M47 83 Q60 99 73 83Z" fill="${c2}"/><path d="M51 83 Q60 94 69 83Z" fill="${sk}"/>`
      :`<path d="M46 83 L60 101 L74 83Z" fill="${c2}"/><path d="M50 83 L60 96 L70 83Z" fill="${sk}"/>`;
    if(kind===0)g+=`<text x="71" y="110" text-anchor="middle" font-family="${FONT}" font-size="10" fill="${tx}" fill-opacity=".92">${esc(l.number)}</text>`;
  }else{
    g+=`<path d="M50 85 Q60 91 70 85 L70 83 Q60 88.5 50 83Z" fill="${c2}"/>`;
    if(!portrait){
      const B=backLayout(l),fgc=tx;
      g+=`<g data-part="rueckenfeld">`;
      g+=B.name.letters.map(L=>`<text x="${L.x}" y="${L.y}" text-anchor="middle" font-family="${FONT}" font-size="${B.name.size}" fill="${fgc}" transform="rotate(${L.rot} ${L.x} ${L.y})">${esc(L.ch)}</text>`).join("");
      g+=`<text data-k="num" x="60" y="${B.num.y}" text-anchor="middle" font-family="${FONT}" font-size="${B.num.size}" fill="${fgc}">${esc(B.num.text)}</text></g>`;
    }
  }
  g+="</g>";
  return g;
}
const ariaLook=l=>`${l.body==="m"?"Spielerin":"Spieler"} mit Trikot ${COLOR_NAMES[l.shirt]||"bunt"} und Nummer ${l.number}`;

function headOpts(l){return{hair:l.hair,hairColor:l.hairColor,browColor:l.browColor,skin:l.skin,face:l.face,eyeShape:l.eyeShape,eyes:l.eyes,brows:l.brows,nose:l.nose,mouth:l.mouth,cheeks:l.cheeks,freckles:l.freckles,glasses:l.glasses,hat:l.hat,hatColor:l.hatColor,beard:0,earrings:0,acc:l.c2};}
const bgOf=l=>l.bg||light(l.c1,.78);

// Spieler als Gruppe (ohne svg-Hülle), 120 breit, y von -10 bis 190. view: front oder back.
// opts.pose: stand oder shoot (Schusspose für die Torszene), opts.portrait: Brustbild-Ausschnitt mit Porträt-Kleidung.
export function figureG(look,view="front",{pose="stand",portrait=false}={}){
  const l=cleanLook(look);
  return bodyG(l,view,pose,portrait)+`<g data-part="kopf">${headG(headOpts(l),view)}</g>`;
}
const VB={full:"0 -10 120 200",bust:"4 0 112 112",head:"22 -10 76 94"};
// Vollständige Grafik. crop: "full" (ganze Figur), "bust" (Brustbild im runden Hintergrund, für Kacheln), "head" (Auswahlfelder).
export function avatarSVG(look,{view="front",px=100,crop="full",label,pose="stand"}={}){
  const l=cleanLook(look),vb=VB[crop]||VB.full;
  const [,,w,h]=vb.split(" ").map(Number);
  let inner;
  if(crop==="bust")inner=`<defs><clipPath id="avclip"><circle cx="60" cy="56" r="56"/></clipPath></defs><circle cx="60" cy="56" r="56" fill="${bgOf(l)}"/><g clip-path="url(#avclip)">${figureG(l,view,{portrait:true})}</g>`;
  else if(crop==="head")inner=figureG(l,view,{});
  else inner=figureG(l,view,{pose});
  return `<svg class="avsvg" viewBox="${vb}" width="${Math.round(px*w/h)}" height="${px}" role="img" aria-label="${esc(label||ariaLook(l))}">${inner}</svg>`;
}

// Wappen aus den beiden Vereinsfarben (flach, ohne Kontur)
export function crestSVG(look,px=40){
  const l=cleanLook(look);
  return `<svg viewBox="0 0 40 46" width="${Math.round(px*40/46)}" height="${px}" role="img" aria-label="Wappen von ${esc(l.team)}"><path d="M4 4 H36 V24 Q36 38 20 44 Q4 38 4 24Z" fill="${l.c1}"/><path d="M20 4 H36 V24 Q36 38 20 44Z" fill="${l.c2}"/><circle cx="20" cy="22" r="6.5" fill="#fff"/></svg>`;
}

// ---------- Trainer und Trainerin (gleicher Stil, Brustbild) ----------
export function trainerSVG(look,{px=72,label,which=1}={}){
  const l=cleanTrainerLook(look,which),j=l.jacket,jl=light(j,.22),sk=l.skin,skD=dark(sk,.14);
  const o={hair:l.hair,hairColor:l.hairColor,browColor:l.browColor,skin:sk,face:l.face,eyeShape:l.eyeShape,eyes:l.eyes,brows:l.brows,nose:l.nose,mouth:l.mouth,cheeks:l.cheeks,freckles:l.freckles,glasses:l.glasses,hat:l.hat,hatColor:l.hatColor,beard:l.beard,beardColor:l.beardColor,earrings:l.earrings,acc:jl};
  let g=`<rect x="52" y="64" width="16" height="26" fill="${sk}"/><path d="M52 66 L68 66 L68 80 Q60 86.5 52 80Z" fill="${skD}"/>`;
  g+=P("M14 120 Q12 92 40 86 Q60 79.5 80 86 Q108 92 106 120Z",j);
  g+=P("M46 84 L60 106 L74 84Z","#eef1f4")+P("M38 88 L52 112 L60 102 L46 84Z",jl)+P("M82 88 L68 112 L60 102 L74 84Z",jl)+`<path d="M60 110 L60 122" stroke="${jl}" stroke-width="2.2"/>`;
  g+=P("M49 84 L60 101 L71 84Z",sk);
  if(l.gear===1)g+=`<path d="M49 84 L60 108 L71 84" stroke="#20242a" stroke-width="1.8" fill="none"/>${`<rect x="53.5" y="105" width="13" height="9" rx="4.5" fill="#ffc83d"/>`}${C(58,109.5,1.7,"#8a6a10")}`;
  if(l.gear===2)g+=`<rect x="76" y="92" width="22" height="28" rx="3" fill="#b07a45"/><rect x="79" y="96" width="16" height="21" rx="1.5" fill="#fff"/><rect x="83" y="90" width="8" height="5" rx="1.5" fill="#8a8f98"/><path d="M82 102 H92 M82 106 H92 M82 110 H89" stroke="#9aa6b2" stroke-width="1.4" stroke-linecap="round"/>`;
  g+=`<g data-part="kopf">${headG(o,"front")}</g>`;
  const bg=l.bg||light(jl,.6);
  return `<svg class="avsvg" viewBox="4 0 112 112" width="${px}" height="${px}" role="img" aria-label="${esc(label||(which===2?"Trainerin":"Trainer"))}"><defs><clipPath id="avclip"><circle cx="60" cy="56" r="56"/></clipPath></defs><circle cx="60" cy="56" r="56" fill="${bg}"/><g clip-path="url(#avclip)">${g}</g></svg>`;
}

// ---------- Torszene ----------
// Der Spieler steht mit dem Rücken zur Kamera und schießt aufs Tor (Schusspose).
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
    return `<g class="pop"><ellipse cx="${c.x}" cy="${c.y}" rx="${POP_TEXT[k].length*5.4+12}" ry="15" fill="#fff" stroke="${INK}" stroke-width="2.4"/><text x="${c.x}" y="${c.y+5.5}" text-anchor="middle" font-family="${FONT}" font-size="17" fill="#e5484d">${POP_TEXT[k]}</text></g>`;
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
    +`<rect x="98" y="28" width="7" height="66" rx="2" fill="url(#scPost)"/><rect x="235" y="28" width="7" height="66" rx="2" fill="url(#scPost)"/><rect x="98" y="28" width="144" height="7" rx="2" fill="url(#scPost)"/>`
    +`<g class="pl"><g transform="translate(124 86) scale(.76)">${figureG(l,"back",{pose:"shoot"})}</g></g>`
    +`<g class="ballpos" style="${vars}"><g class="ballspin"><circle r="9" fill="url(#scBall)"/><polygon points="0,-4.5 4.3,-1.4 2.7,3.6 -2.7,3.6 -4.3,-1.4" fill="${INK}"/><path d="M0 -4.5 V-9 M4.3 -1.4 L8.6 -2.8 M2.7 3.6 L5.3 7.3 M-2.7 3.6 L-5.3 7.3 M-4.3 -1.4 L-8.6 -2.8" stroke="${INK}" stroke-width="1.4" fill="none"/></g><ellipse cx="-3" cy="-4.4" rx="2.8" ry="1.7" fill="#fff" opacity=".75"/></g>`
    +pop
    +`</svg>`;
}
