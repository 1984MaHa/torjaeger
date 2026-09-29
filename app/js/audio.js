// Töne per Web Audio (kein Audiomaterial nötig).
let AC=null;
export function tone(fs,dur,on){
  if(!on)return;
  try{
    AC=AC||new (window.AudioContext||window.webkitAudioContext)();
    fs.forEach((f,i)=>{
      const o=AC.createOscillator(),g=AC.createGain();o.type="triangle";o.frequency.value=f;const t=AC.currentTime+i*dur;
      g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.25,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
      o.connect(g).connect(AC.destination);o.start(t);o.stop(t+dur+.02);
    });
  }catch(e){}
}
