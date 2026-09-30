// Vorlesen englischer Wörter mit der Gerätestimme (speechSynthesis), nur nach Antippen, nie automatisch.
// Ohne englische Stimme sind Taste und Hör-Aufgaben ausgeblendet, die App bleibt voll nutzbar.
const synth=()=>{const s=globalThis.speechSynthesis;return s&&typeof s.getVoices==="function"&&typeof s.speak==="function"?s:null;};
const lang=v=>String(v&&v.lang||"").replace("_","-").toLowerCase();
// Bevorzugt en-GB, sonst en-US, sonst irgendeine englische Stimme. Sonst null.
export function englishVoice(){
  const s=synth();if(!s)return null;
  let list;try{list=s.getVoices()||[];}catch(e){return null;}
  const en=[...list].filter(v=>lang(v).startsWith("en"));
  return en.find(v=>lang(v)==="en-gb")||en.find(v=>lang(v)==="en-us")||en[0]||null;
}
export const canSpeak=()=>!!englishVoice();
export function speak(word){
  const s=synth(),v=englishVoice();
  if(!s||!v||!word)return false;
  try{
    const u=new globalThis.SpeechSynthesisUtterance(String(word));
    u.voice=v;u.lang=v.lang;u.rate=.8;
    if(typeof s.cancel==="function")s.cancel();
    s.speak(u);return true;
  }catch(e){return false;}
}
// Taste 🔊 für ein englisches Wort (leer, wenn keine Stimme da ist).
export const speakBtn=(word,cls="")=>canSpeak()?`<button class="spk ${cls}" data-say="${String(word).replace(/"/g,"&quot;")}" aria-label="Vorlesen">\u{1F50A}</button>`:"";
