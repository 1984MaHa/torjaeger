// Trainer-Hilfe: gestufte Hilfe (1. Tipp vom Trainer, 2. Erklärung an einem ähnlichen Beispiel von der Trainerin),
// Angebot nach langer Pause und die Erklärung nach der Antwort. Die Hilfe verrät nie die Lösung vor dem Antworten.
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

// Wer spricht? 0 = Trainer, 1 = Trainerin. Tipp: Trainer. Erklärung am Beispiel: Trainerin.
// Angebot und Erklärung nach der Antwort wechseln sich von Aufgabe zu Aufgabe ab.
export const speakerOf=(G,kind)=>kind==="tip"?0:kind==="explain"?1:((G&&G.i)||0)%2;

const bubble=(who,inner)=>`<div class="bubble" role="status"><span class="who">${esc(who)}</span>${inner}</div>`;

// Sprechblasen je Hilfestufe (1 Tipp, 2 Tipp und Erklärung). trainers = [Trainer, Trainerin], exHTML aus exampleHTML.
export function helpBubblesHTML(T,level,exHTML,trainers){
  const tip=bubble(trainers[speakerOf(null,"tip")].name,`<p>${T.hint||FALLBACK_TIP}</p>`);
  return level>=2?tip+bubble(trainers[speakerOf(null,"explain")].name,exHTML||exampleHTML(null)):tip;
}

const fig=(t,which,talk)=>`<div class="coachfig${talk?" talk":""}">${trainerSVG(t.look,{px:70,label:t.name,which})}<span class="coachname">${esc(t.name)}</span></div>`;

// Trainer-Block in der Aufgabe. G: helpLevel (0 bis 2), offer (Angebot nach langer Pause), helpEx (Beispiel für Stufe 2), i (Aufgabe).
// Vor der Antwort: Hilfe-Taste und Hilfe-Blasen. Nach der Antwort: die Erklärung (ex) in einer Sprechblase.
export function coachHTML({T,G,trainers}){
  const [a,b]=trainers;
  if(G.done){
    const s=speakerOf(G,"after"),say=G.ok?T.ex:`<b>Richtig ist: ${esc(rightText(T))}.</b> ${T.ex}`;
    return `<div class="coach done"><div class="coachfigs">${fig(a,1,s===0)}${fig(b,2,s===1)}</div><div class="coachside">${bubble(trainers[s].name,`<p>${say}</p>`)}</div></div>`;
  }
  const level=G.helpLevel||0;
  let bubbles="",buttons="",talkA=false,talkB=false;
  if(level>=1){bubbles=helpBubblesHTML(T,level,G.helpEx,trainers);talkA=true;talkB=level>=2;}
  else if(G.offer){
    const s=speakerOf(G,"offer");talkA=s===0;talkB=s===1;
    bubbles=bubble(trainers[s].name,`<p>Hallo! Soll ich dir einen Tipp geben?</p><div class="row"><button class="helpbtn" id="coachYes">Ja, bitte</button><button class="btn ghost sm" id="coachNo">Nein, danke</button></div>`);
  }
  if(level===0&&!G.offer)buttons=`<button class="helpbtn" id="coachHelp">Hilfe vom Trainer</button>`;
  else if(level===1)buttons=`<button class="helpbtn" id="coachHelp">Noch mehr Hilfe</button>`;
  return `<div class="coach"><div class="coachfigs">${fig(a,1,talkA)}${fig(b,2,talkB)}</div><div class="coachside">${bubbles}${buttons}</div></div>`;
}
