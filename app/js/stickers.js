// Sammelalbum: 24 verschiedene Sticker. Jeder hat eine eigene Form, einen Farbverlauf, ein eigenes Motiv (eigene SVG-Zeichnung,
// keine Vereinslogos) und einen großen Jubelruf. Der Fußballbegriff (STICKERS in content.js) steht klein darunter.
// Die Nummer eines Stickers bleibt wie bisher der Index, gesammelte Sticker behalten also ihren Platz.
import {STICKERS} from "./content.js";
import {esc} from "./util.js";

const INK="#16271c";
// Formen, alle in einem Feld von 100 x 100. Jede liefert das Element mit dem Platzhalter {F} für die Füllung.
const pts=(n,ro,ri,rot=-90)=>Array.from({length:n*2},(_,i)=>{const a=(rot+i*180/n)*Math.PI/180,r=i%2?ri:ro;return `${(50+r*Math.cos(a)).toFixed(1)},${(50+r*Math.sin(a)).toFixed(1)}`;}).join(" ");
const poly=(n,r,rot)=>Array.from({length:n},(_,i)=>{const a=(rot+i*360/n)*Math.PI/180;return `${(50+r*Math.cos(a)).toFixed(1)},${(50+r*Math.sin(a)).toFixed(1)}`;}).join(" ");
export const SHAPES={
  rund:'<circle cx="50" cy="50" r="46" fill="{F}" stroke="'+INK+'" stroke-width="4"/>',
  stern:'<polygon points="'+pts(5,49,22)+'" fill="{F}" stroke="'+INK+'" stroke-width="4" stroke-linejoin="round"/>',
  burst:'<polygon points="'+pts(12,49,38)+'" fill="{F}" stroke="'+INK+'" stroke-width="4" stroke-linejoin="round"/>',
  schild:'<path d="M12 10H88V52C88 76 66 90 50 96C34 90 12 76 12 52Z" fill="{F}" stroke="'+INK+'" stroke-width="4" stroke-linejoin="round"/>',
  wimpel:'<path d="M8 12L94 50L8 88Z" fill="{F}" stroke="'+INK+'" stroke-width="4" stroke-linejoin="round"/>',
  sechseck:'<polygon points="'+poly(6,47,-90)+'" fill="{F}" stroke="'+INK+'" stroke-width="4" stroke-linejoin="round"/>',
  banner:'<path d="M6 22H94L84 50L94 78H6L16 50Z" fill="{F}" stroke="'+INK+'" stroke-width="4" stroke-linejoin="round"/>',
  achteck:'<polygon points="'+poly(8,47,-67.5)+'" fill="{F}" stroke="'+INK+'" stroke-width="4" stroke-linejoin="round"/>',
  raute:'<path d="M50 4L96 50L50 96L4 50Z" fill="{F}" stroke="'+INK+'" stroke-width="4" stroke-linejoin="round"/>',
  wolke:'<path d="M26 78C10 78 6 58 20 52C16 36 34 26 46 34C54 20 78 26 78 44C94 44 96 72 80 78Z" fill="{F}" stroke="'+INK+'" stroke-width="4" stroke-linejoin="round"/>',
  ticket:'<path d="M8 20H92V40A10 10 0 0 0 92 60V80H8V60A10 10 0 0 0 8 40Z" fill="{F}" stroke="'+INK+'" stroke-width="4" stroke-linejoin="round"/>',
  bogen:'<path d="M10 92V46C10 22 28 6 50 6C72 6 90 22 90 46V92Z" fill="{F}" stroke="'+INK+'" stroke-width="4" stroke-linejoin="round"/>',
  herz:'<path d="M50 90C16 66 6 46 12 30C18 14 40 14 50 32C60 14 82 14 88 30C94 46 84 66 50 90Z" fill="{F}" stroke="'+INK+'" stroke-width="4" stroke-linejoin="round"/>',
  blatt:'<path d="M50 6C86 18 94 52 50 94C6 52 14 18 50 6Z" fill="{F}" stroke="'+INK+'" stroke-width="4" stroke-linejoin="round"/>',
  tropfen:'<path d="M50 4C70 30 90 48 90 66A40 40 0 0 1 10 66C10 48 30 30 50 4Z" fill="{F}" stroke="'+INK+'" stroke-width="4" stroke-linejoin="round"/>',
  quadrat:'<rect x="10" y="10" width="80" height="80" rx="18" fill="{F}" stroke="'+INK+'" stroke-width="4"/>',
  vieleck5:'<polygon points="'+poly(5,48,-90)+'" fill="{F}" stroke="'+INK+'" stroke-width="4" stroke-linejoin="round"/>',
  stern8:'<polygon points="'+pts(8,49,30)+'" fill="{F}" stroke="'+INK+'" stroke-width="4" stroke-linejoin="round"/>',
  stern6:'<polygon points="'+pts(6,49,28)+'" fill="{F}" stroke="'+INK+'" stroke-width="4" stroke-linejoin="round"/>',
  oval:'<ellipse cx="50" cy="50" rx="46" ry="36" fill="{F}" stroke="'+INK+'" stroke-width="4"/>',
  tafel:'<path d="M6 16H94V70H60L50 90L40 70H6Z" fill="{F}" stroke="'+INK+'" stroke-width="4" stroke-linejoin="round"/>',
  kreuz:'<path d="M36 6H64V36H94V64H64V94H36V64H6V36H36Z" fill="{F}" stroke="'+INK+'" stroke-width="4" stroke-linejoin="round"/>',
  plakette:'<circle cx="50" cy="50" r="46" fill="{F}" stroke="'+INK+'" stroke-width="4"/><circle cx="50" cy="50" r="38" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="4 5"/>',
  halbrund:'<path d="M6 22H94V56A44 38 0 0 1 6 56Z" fill="{F}" stroke="'+INK+'" stroke-width="4" stroke-linejoin="round"/>'
};

// Motive: kleine Zeichnungen um den Mittelpunkt (30 bis 70), Farben aus w (weiß), k (Kontur), a (Akzent).
const W="#ffffff",K=INK,Y="#ffd23f",R_="#e5484d",B="#2f6fde",G="#34c56a",O="#ff8a00";
const ball=(cx,cy,r)=>`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${W}" stroke="${K}" stroke-width="2.5"/><polygon points="${cx},${cy-r*.45} ${cx+r*.43},${cy-r*.14} ${cx+r*.27},${cy+r*.36} ${cx-r*.27},${cy+r*.36} ${cx-r*.43},${cy-r*.14}" fill="${K}"/>`;
export const MOTIFS={
  pfeife:`<rect x="30" y="44" width="30" height="18" rx="8" fill="${W}" stroke="${K}" stroke-width="3"/><circle cx="56" cy="53" r="10" fill="${W}" stroke="${K}" stroke-width="3"/><circle cx="56" cy="53" r="4" fill="${K}"/><path d="M30 46C22 44 20 36 28 34" fill="none" stroke="${K}" stroke-width="3" stroke-linecap="round"/><path d="M62 40L70 32M66 46L76 44" stroke="${K}" stroke-width="3" stroke-linecap="round"/>`,
  doppelpass:`<path d="M26 38H66" stroke="${K}" stroke-width="5" stroke-linecap="round"/><path d="M58 28L70 38L58 48" fill="none" stroke="${K}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M74 62H34" stroke="${W}" stroke-width="5" stroke-linecap="round"/><path d="M42 52L30 62L42 72" fill="none" stroke="${W}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`,
  flanke:`<path d="M24 66C30 26 62 22 76 44" fill="none" stroke="${K}" stroke-width="4" stroke-dasharray="2 7" stroke-linecap="round"/>${ball(70,50,11)}`,
  kopfball:`<circle cx="38" cy="58" r="15" fill="#f2c9a0" stroke="${K}" stroke-width="3"/><path d="M26 54C28 42 46 40 50 50" fill="${K}" stroke="${K}" stroke-width="2"/>${ball(64,36,11)}<path d="M52 46L56 42M50 38L56 38" stroke="${K}" stroke-width="3" stroke-linecap="round"/>`,
  wirbel:`<path d="M50 50m-4 0a4 4 0 1 1 8 0a9 9 0 1 1-18 0a15 15 0 1 1 30 0a21 21 0 1 1-42 0" fill="none" stroke="${K}" stroke-width="4" stroke-linecap="round"/>${ball(50,50,7)}`,
  eckfahne:`<path d="M38 74V26" stroke="${K}" stroke-width="4" stroke-linecap="round"/><path d="M38 26L70 36L38 48Z" fill="${Y}" stroke="${K}" stroke-width="3" stroke-linejoin="round"/><path d="M28 76Q38 66 48 76" fill="none" stroke="${K}" stroke-width="4"/>`,
  zielscheibe:`<circle cx="50" cy="50" r="22" fill="${W}" stroke="${K}" stroke-width="3"/><circle cx="50" cy="50" r="14" fill="${R_}" stroke="${K}" stroke-width="3"/><circle cx="50" cy="50" r="6" fill="${W}" stroke="${K}" stroke-width="3"/><path d="M50 50L74 26" stroke="${K}" stroke-width="3"/><path d="M68 24L76 24L76 32" fill="none" stroke="${K}" stroke-width="3"/>`,
  eis:`<path d="M50 28V72M32 39L68 61M32 61L68 39" stroke="${K}" stroke-width="5" stroke-linecap="round"/><path d="M44 28L50 34L56 28M44 72L50 66L56 72" fill="none" stroke="${K}" stroke-width="4" stroke-linecap="round"/>`,
  handschuh:`<path d="M34 72V50C30 44 34 38 40 42V30C40 24 48 24 48 30V28C48 22 56 22 56 28V30C58 26 66 28 64 34V58C64 68 58 74 50 74H42Z" fill="${W}" stroke="${K}" stroke-width="3" stroke-linejoin="round"/><rect x="36" y="64" width="26" height="8" fill="${G}" stroke="${K}" stroke-width="3"/>`,
  fallrueck:`<circle cx="54" cy="36" r="9" fill="#f2c9a0" stroke="${K}" stroke-width="3"/><path d="M50 46L40 62L56 70M50 46L66 58" fill="none" stroke="${K}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>${ball(32,36,9)}`,
  hattrick:`${ball(34,62,11)}${ball(66,62,11)}${ball(50,36,11)}`,
  binde:`<rect x="30" y="38" width="40" height="26" rx="5" fill="${Y}" stroke="${K}" stroke-width="3"/><text x="50" y="59" text-anchor="middle" font-size="22" font-weight="700" font-family="Lilita One,Andika,sans-serif" fill="${K}">C</text>`,
  goldschuh:`<path d="M28 60C30 46 34 34 38 30H50V46C56 50 68 52 74 58V66H28Z" fill="${Y}" stroke="${K}" stroke-width="3" stroke-linejoin="round"/><path d="M34 66V72M46 66V72M60 66V72" stroke="${K}" stroke-width="4" stroke-linecap="round"/>`,
  pokal:`<path d="M34 28H66V44C66 56 58 62 50 62C42 62 34 56 34 44Z" fill="${Y}" stroke="${K}" stroke-width="3"/><path d="M34 34H26C26 46 32 50 36 50M66 34H74C74 46 68 50 64 50" fill="none" stroke="${K}" stroke-width="3"/><path d="M50 62V72M38 74H62" stroke="${K}" stroke-width="5" stroke-linecap="round"/>`,
  schale:`<ellipse cx="50" cy="56" rx="26" ry="10" fill="${W}" stroke="${K}" stroke-width="3"/><path d="M26 56C28 70 72 70 74 56" fill="${Y}" stroke="${K}" stroke-width="3"/><path d="M40 42L50 30L60 42" fill="none" stroke="${K}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
  sternring:`<polygon points="${pts(5,22,9)}" fill="${W}" stroke="${K}" stroke-width="3" stroke-linejoin="round"/><circle cx="50" cy="50" r="27" fill="none" stroke="${K}" stroke-width="3" stroke-dasharray="3 5"/>`,
  flutlicht:`<path d="M50 74V40" stroke="${K}" stroke-width="5"/><rect x="34" y="26" width="32" height="18" rx="3" fill="${W}" stroke="${K}" stroke-width="3"/><circle cx="41" cy="35" r="3" fill="${Y}"/><circle cx="50" cy="35" r="3" fill="${Y}"/><circle cx="59" cy="35" r="3" fill="${Y}"/><path d="M34 22L28 16M50 20V12M66 22L72 16" stroke="${K}" stroke-width="3" stroke-linecap="round"/>`,
  megafon:`<path d="M30 44L62 30V66L30 54Z" fill="${W}" stroke="${K}" stroke-width="3" stroke-linejoin="round"/><rect x="24" y="42" width="10" height="14" rx="3" fill="${R_}" stroke="${K}" stroke-width="3"/><path d="M68 40L76 36M68 48H78M68 56L76 60" stroke="${K}" stroke-width="3" stroke-linecap="round"/>`,
  aufwaerts:`<path d="M50 74V30M34 46L50 28L66 46" fill="none" stroke="${K}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M34 74H66" stroke="${W}" stroke-width="5" stroke-linecap="round"/>`,
  feuerwerk:`<path d="M50 50L50 26M50 50L70 34M50 50L74 50M50 50L70 66M50 50L50 74M50 50L30 66M50 50L26 50M50 50L30 34" stroke="${K}" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="50" r="6" fill="${Y}" stroke="${K}" stroke-width="3"/><circle cx="50" cy="22" r="3" fill="${W}"/><circle cx="74" cy="32" r="3" fill="${W}"/><circle cx="78" cy="56" r="3" fill="${W}"/>`,
  krone:`<path d="M28 66L26 38L40 50L50 32L60 50L74 38L72 66Z" fill="${Y}" stroke="${K}" stroke-width="3" stroke-linejoin="round"/><circle cx="26" cy="36" r="3" fill="${W}" stroke="${K}" stroke-width="2"/><circle cx="50" cy="30" r="3" fill="${W}" stroke="${K}" stroke-width="2"/><circle cx="74" cy="36" r="3" fill="${W}" stroke="${K}" stroke-width="2"/>`,
  zauberstab:`<path d="M30 70L60 40" stroke="${K}" stroke-width="6" stroke-linecap="round"/><path d="M30 70L40 60" stroke="${W}" stroke-width="6" stroke-linecap="round"/><polygon points="${pts(4,13,4)}" transform="translate(22 -20)" fill="${Y}" stroke="${K}" stroke-width="2.5" stroke-linejoin="round"/><circle cx="36" cy="34" r="3" fill="${W}"/><circle cx="74" cy="64" r="3" fill="${W}"/>`,
  stadionbogen:`<path d="M26 72V50C26 36 36 28 50 28C64 28 74 36 74 50V72" fill="none" stroke="${K}" stroke-width="6" stroke-linecap="round"/><path d="M36 72V54C36 44 42 38 50 38C58 38 64 44 64 54V72" fill="none" stroke="${W}" stroke-width="4"/><path d="M24 72H76" stroke="${K}" stroke-width="5" stroke-linecap="round"/>`,
  weltkugel:`<circle cx="50" cy="50" r="22" fill="${B}" stroke="${K}" stroke-width="3"/><path d="M36 42C42 36 50 40 48 46C46 52 38 50 36 42ZM54 54C60 50 66 54 62 62C58 66 52 60 54 54Z" fill="${G}" stroke="${K}" stroke-width="2"/><path d="M28 50H72M50 28C42 40 42 60 50 72M50 28C58 40 58 60 50 72" fill="none" stroke="${W}" stroke-width="1.6" opacity=".7"/>`
};

// 24 Sticker in der Reihenfolge des Albums (Index = bisheriger Fußballbegriff in STICKERS).
// Form, Verlauf (oben, unten), Motiv und Jubelruf sind je Sticker verschieden (ein Test prüft es).
export const DESIGNS=[
  {cheer:"Auf geht's!",  shape:"rund",     c:["#ffe66d","#ffb703"], motif:"pfeife"},
  {cheer:"Zack zack!",   shape:"sechseck", c:["#7bd3ff","#2f6fde"], motif:"doppelpass"},
  {cheer:"Wusch!",       shape:"wolke",    c:["#c8f7d4","#34c56a"], motif:"flanke"},
  {cheer:"Bumm!",        shape:"burst",    c:["#ffd0a8","#ff7a2f"], motif:"kopfball"},
  {cheer:"Wirbelwind!",  shape:"oval",     c:["#d9c2ff","#8a5cf6"], motif:"wirbel"},
  {cheer:"Ecke klar!",   shape:"wimpel",   c:["#fff2a8","#f2b705"], motif:"eckfahne"},
  {cheer:"Volltreffer!", shape:"achteck",  c:["#ff9aa2","#e5484d"], motif:"zielscheibe"},
  {cheer:"Eiskalt!",     shape:"stern6",   c:["#e3f6ff","#6ec6f5"], motif:"eis"},
  {cheer:"Gehalten!",    shape:"schild",   c:["#b9f3d0","#1f9d55"], motif:"handschuh"},
  {cheer:"Wahnsinn!",    shape:"stern8",   c:["#ffb3e6","#d6336c"], motif:"fallrueck"},
  {cheer:"Tooor!",       shape:"stern",    c:["#fff59d","#fbc02d"], motif:"hattrick"},
  {cheer:"Chef!",        shape:"banner",   c:["#ffd6a5","#e67700"], motif:"binde"},
  {cheer:"Goldschuss!",  shape:"raute",    c:["#fff3b0","#e0a100"], motif:"goldschuh"},
  {cheer:"Hammer!",      shape:"bogen",    c:["#ffe08a","#d9480f"], motif:"pokal"},
  {cheer:"Weltklasse!",  shape:"halbrund", c:["#d0ebff","#1c7ed6"], motif:"schale"},
  {cheer:"Sternstunde!", shape:"vieleck5", c:["#cfd8ff","#4263eb"], motif:"sternring"},
  {cheer:"Lichtshow!",   shape:"quadrat",  c:["#f1f3f5","#868e96"], motif:"flutlicht"},
  {cheer:"Jaaa!",        shape:"tafel",    c:["#ffc9c9","#fa5252"], motif:"megafon"},
  {cheer:"Hoch hinaus!", shape:"blatt",    c:["#c3fae8","#12b886"], motif:"aufwaerts"},
  {cheer:"Kracher!",     shape:"kreuz",    c:["#ffec99","#fd7e14"], motif:"feuerwerk"},
  {cheer:"Knaller-Kicker!",shape:"tropfen",c:["#eebefa","#ae3ec9"], motif:"krone"},
  {cheer:"Ballzauber!",  shape:"herz",     c:["#ffdeeb","#f06595"], motif:"zauberstab"},
  {cheer:"Supertor!",    shape:"ticket",   c:["#bac8ff","#3b5bdb"], motif:"stadionbogen"},
  {cheer:"Unschlagbar!", shape:"plakette", c:["#a5d8ff","#1864ab"], motif:"weltkugel"}
];

export function stickerSVG(i,px=64){
  const d=DESIGNS[i];if(!d)return "";
  const id="stg"+i,fill=`url(#${id})`;
  return `<svg class="stsvg" width="${px}" height="${px}" viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${d.c[0]}"/><stop offset="1" stop-color="${d.c[1]}"/></linearGradient></defs>${SHAPES[d.shape].replace("{F}",fill)}<g>${MOTIFS[d.motif]}</g></svg>`;
}
export const cheerOf=i=>DESIGNS[i]?DESIGNS[i].cheer:"";
export const termOf=i=>STICKERS[i]||"";
// Ein Album-Feld: eingeklebt mit Bild, Jubelruf und kleinem Fußballbegriff, sonst nur Nummer und Fragezeichen.
export function stickerHTML(i,on){
  if(!on)return `<div class="st"><span class="n">${i+1}</span><span class="q">?</span></div>`;
  const d=DESIGNS[i];
  return `<div class="st on" style="--stc:${d.c[1]}">${stickerSVG(i,64)}<span class="cheer">${esc(d.cheer)}</span><span class="term">${esc(termOf(i))}</span></div>`;
}
