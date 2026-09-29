// Trainer-Hilfe: gestufte Hilfe (1. Tipp, 2. Erklärung an einem ähnlichen Beispiel), Angebot nach langer Pause
// und die Sprechblase nach der Antwort. Die Hilfe verrät nie die Lösung vor dem Antworten.
import {trainerSVG} from "./avatardraw.js";
import {esc} from "./util.js";

// Lösungstext einer Aufgabe (für Anzeige und Prüfung)
export function rightText(T){return T.type==="tap"?T.words[T.a]:T.type==="pair"?`${T.a[0]} Rest ${T.a[1]}`:String(T.a);}

export const FALLBACK_TIP="Lies die Aufgabe noch einmal langsam. Probiere es in kleinen Schritten.";
export const FALLBACK_EXAMPLE="Mach es in kleinen Schritten. Schreib dir auf, was du schon weißt. Dann probierst du es Stück für Stück.";
const plain=t=>String(t).replace(/<[^>]+>/g," ").replace(/&nbsp;/g," ");

// Steht die Lösung (als Zahl oder Wort) im Text? Sehr kurze Antworten (ein oder zwei Buchstaben) lassen sich so nicht prüfen.
export function leaks(text,answer){
  const a=String(answer).trim();if(!a)return false;
  const hay=plain(text).toLowerCase();
  if(/^\d+$/.test(a))return new RegExp(`(^|[^\\d])${a}([^\\d]|$)`).test(hay);
  if(a.length<3)return false;
  return hay.includes(a.toLowerCase());
}

// Ein ähnliches Beispiel aus demselben Generator: andere Zahlen oder Wörter, andere Lösung,
// und die Lösung der echten Aufgabe kommt im Beispieltext nicht vor. Sonst null.
export function similarExample(gen,T,tries=60){
  const mine=rightText(T);
  for(let i=0;i<tries;i++){
    const E=gen[T.topic]();
    if(String(rightText(E))===String(mine))continue;
    // Auch die Beschreibung der Grafik zählt zum Text des Beispiels
    const labels=[...String(E.vis||"").matchAll(/aria-label="([^"]*)"/g)].map(m=>m[1]).join(" ");
    if(leaks(E.q+" "+E.ex+" "+labels,mine))continue;
    return E;
  }
  return null;
}
export function exampleHTML(E){
  return E?`<p><b>Eine ähnliche Aufgabe:</b> ${E.q}</p>${E.vis?`<div class="vis">${E.vis}</div>`:""}<p><b>So geht das:</b> ${E.ex}</p>`:`<p>${FALLBACK_EXAMPLE}</p>`;
}

// Text der Sprechblase je Hilfestufe (1 Tipp, 2 Tipp und Erklärung). exHTML kommt aus exampleHTML.
export function helpBubbleHTML(T,level,exHTML){
  const tip=`<p><b>Tipp:</b> ${T.hint||FALLBACK_TIP}</p>`;
  return level>=2?`${tip}<hr>${exHTML||exampleHTML(null)}`:tip;
}

// Trainer-Block in der Aufgabe. G: helpLevel (0 bis 2), offer (Angebot nach langer Pause), helpEx (Beispiel für Stufe 2).
// Vor der Antwort: Hilfe-Taste und Hilfe-Blase. Nach der Antwort: die Erklärung (ex) in einer Sprechblase.
export function coachHTML({T,G,trainer}){
  const name=esc(trainer.name),fig=`<div class="coachfig">${trainerSVG(trainer.look,{px:76,label:trainer.name})}<span class="coachname">${name}</span></div>`;
  if(G.done){
    const say=G.ok?T.ex:`<b>Richtig ist: ${esc(rightText(T))}.</b> ${T.ex}`;
    return `<div class="coach done">${fig}<div class="coachside"><div class="bubble" role="status"><p>${say}</p></div></div></div>`;
  }
  const level=G.helpLevel||0;
  let bubble="",buttons="";
  if(level>=1)bubble=`<div class="bubble" role="status">${helpBubbleHTML(T,level,G.helpEx)}</div>`;
  else if(G.offer)bubble=`<div class="bubble" role="status"><p>Hallo! Soll ich dir einen Tipp geben?</p><div class="row"><button class="helpbtn" id="coachYes">Ja, bitte</button><button class="btn ghost sm" id="coachNo">Nein, danke</button></div></div>`;
  if(level===0&&!G.offer)buttons=`<button class="helpbtn" id="coachHelp">Hilfe vom Trainer</button>`;
  else if(level===1)buttons=`<button class="helpbtn" id="coachHelp">Noch mehr Hilfe</button>`;
  return `<div class="coach">${fig}<div class="coachside">${bubble}${buttons}</div></div>`;
}
