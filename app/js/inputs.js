// Eingabe der neuen Aufgabenarten als HTML: Zuordnen (match), Bild wählen (pic), Sortieren (sort), Reihenfolge (order).
// Nur Antippen, große Tippflächen, kein Ziehen. Reine Darstellung, der Zustand steckt in G (siehe app.js).
//   match: G.pairs (je links die Nummer rechts oder -1), G.msel (gewählter linker Begriff oder -1)
//   sort:  G.sortA (je Karte die Nummer des Korbs oder -1), G.ssel (gewählte Karte oder -1)
//   order: G.ord (Kartennummern in der angetippten Reihenfolge)
//   pic:   Antwort ist die Nummer der Kachel
import {tileHTML} from "./tasks.js";
import {speakBtn,canSpeak} from "./speech.js";
import {esc} from "./util.js";

export const NEW_TYPES=["match","sort","order","pic"];
// Paarfarben: kein Rot und kein Grün, damit ein Paar nicht wie „falsch“ oder „richtig“ aussieht
export const PAIR_COLORS=["#2f6fde","#8e44ad","#0e9aa7","#d98200","#c2338a"];
const cell=it=>it.k==="txt"?`<span class="ctxt">${it.t}</span>`:tileHTML(it,false);
const btn=(label,id,ready)=>`<button class="btn" id="${id}" ${ready?"":'disabled style="opacity:.5"'}>${label}</button>`;

// Fertig-Taste: im Päckchen "Eintragen" oder "Ändern", sonst "Fertig!"
export function finLabel(G){return G.pack&&G.phase==="solve"?"Eintragen":G.pack&&G.phase==="edit"?"Ändern":"Fertig!";}

export function matchHTML(T,G){
  const given=G.done?G.given:null,pairs=given||G.pairs||T.left.map(()=>-1);
  const left=T.left.map((l,i)=>{
    const c=pairs[i]>=0?PAIR_COLORS[i%5]:"",cls=["mitem",G.msel===i?"sel":"",given?(given[i]===T.a[i]?"right":"wrong"):""].filter(Boolean).join(" ");
    return `<div class="mrow"><button class="${cls}" data-ml="${i}" ${G.done?"disabled":""} ${c?`style="--pc:${c}"`:""} aria-pressed="${G.msel===i}">${cell(l)}</button>${l.say?speakBtn(l.say):""}</div>`;}).join("");
  const right=T.right.map((r,j)=>{
    const i=pairs.indexOf(j),c=i>=0?PAIR_COLORS[i%5]:"";
    return `<div class="mrow"><button class="mitem" data-mr="${j}" ${G.done?"disabled":""} ${c?`style="--pc:${c}"`:""}>${cell(r)}</button></div>`;}).join("");
  const fix=given?T.left.map((l,i)=>given[i]===T.a[i]?"":`<li>${l.k==="txt"||l.k==="emo"?l.t:"Dieser Kasten"} gehört zu: <b>${T.right[T.a[i]].t}</b></li>`).join(""):"";
  return `<p class="note">Tippe links ein Wort, dann rechts den Partner. Beide bekommen dieselbe Farbe. Noch einmal antippen löst das Paar.</p>
    <div class="match"><div class="mcol">${left}</div><div class="mcol">${right}</div></div>
    ${given?(fix?`<ul class="fixlist" aria-label="Richtige Paare">${fix}</ul>`:""):btn(finLabel(G),"fin",pairs.every(x=>x>=0))}`;
}

export function picHTML(T,G){
  const sel=G.done?G.given:-1;
  const cls=i=>G.done?(i===T.a?"right":i===sel?"wrong":""):"";
  const listen=T.listen&&canSpeak()?`<div class="row" style="justify-content:center"><button class="spk big" data-say="${esc(T.say)}" aria-label="Wort anhören">\u{1F50A} Anhören</button></div>`:"";
  if(T.layout==="compass"){
    const pos={n:"n",o:"o",s:"s",w:"w"};
    return `<div class="compass" role="group" aria-label="Kompassrose">${T.tiles.map((t,i)=>`<button class="ctile ${pos[t.pos]} ${cls(i)}" data-pic="${i}" ${G.done?"disabled":""} aria-label="${G.done?esc(t.name):"Richtung"}">${t.t||"•"}</button>`).join("")}<span class="cmid" aria-hidden="true">✛</span></div>`;
  }
  const grid=`<div class="pics n${T.tiles.length}">${T.tiles.map((t,i)=>`<button class="ptile ${cls(i)}" data-pic="${i}" ${G.done?"disabled":""}>${tileHTML(t,true)}${G.done&&t.name?`<small>${t.name}</small>`:""}</button>`).join("")}</div>`;
  return listen+grid;
}

export function sortHTML(T,G){
  const given=G.done?G.given:null,A=given||G.sortA||T.cards.map(()=>-1);
  const pool=T.cards.map((c,i)=>A[i]<0?`<button class="scard ${G.ssel===i?"sel":""}" data-sc="${i}" aria-pressed="${G.ssel===i}">${c.t}</button>`:"").join("");
  const baskets=T.baskets.map((b,j)=>{
    const inside=T.cards.map((c,i)=>A[i]===j?`<button class="scard in${given?(T.a[i]===j?" right":" wrong"):""}" data-sp="${i}" ${G.done?"disabled":""}>${c.t}</button>`:"").join("");
    return `<div class="basket"><button class="bhead" data-sb="${j}" ${G.done?"disabled":""}>${b.t}</button><div class="binside">${inside||`<span class="note">leer</span>`}</div></div>`;}).join("");
  const fix=given?T.cards.map((c,i)=>given[i]===T.a[i]?"":`<li>${c.t} gehört zu: <b>${T.baskets[T.a[i]].t}</b></li>`).join(""):"";
  return `<p class="note">Tippe eine Karte an, dann den Korb, in den sie gehört. Eine Karte im Korb kannst du wieder herausnehmen.</p>
    <div class="spool">${pool||`<span class="note">Alle Karten sind sortiert.</span>`}</div><div class="baskets n${T.baskets.length}">${baskets}</div>
    ${given?(fix?`<ul class="fixlist" aria-label="Richtige Körbe">${fix}</ul>`:""):btn(finLabel(G),"fin",A.every(x=>x>=0))}`;
}

export function orderHTML(T,G){
  const given=G.done?G.given:null,ord=given||G.ord||[];
  const cards=T.cards.map((c,i)=>{const n=ord.indexOf(i)+1;
    return `<button class="ocard ${n?"used":""}" data-oc="${i}" ${G.done?"disabled":""}>${n?`<b class="onum">${n}</b>`:`<b class="onum empty"></b>`}<span>${c.t}</span></button>`;}).join("");
  const right=given?`<ol class="fixlist" aria-label="Richtige Reihenfolge">${T.a.map((ci,p)=>`<li class="${given[p]===ci?"right":"wrong"}">${T.cards[ci].t}</li>`).join("")}</ol>`:"";
  return `<p class="note">Tippe die Karten der Reihe nach an. Die Nummern zeigen deine Reihenfolge. Mit „Zurücksetzen“ fängst du neu an.</p>
    <div class="ocards">${cards}</div>
    ${given?`<p class="note">So ist es richtig:</p>${right}`:`<div class="row"><button class="btn ghost sm" id="ordReset">Zurücksetzen</button>${btn(finLabel(G),"fin",ord.length===T.cards.length)}</div>`}`;
}

export function newInputHTML(T,G){
  return T.type==="match"?matchHTML(T,G):T.type==="sort"?sortHTML(T,G):T.type==="order"?orderHTML(T,G):picHTML(T,G);
}
