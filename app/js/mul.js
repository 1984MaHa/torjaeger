// Einmaleins-Grenze je Konto (ab 1.7.1): Reihen 1 bis 10 und "auch mal 0". Ergebnis höchstens 100, Faktor höchstens 10 (fest).
// Alle Aufgaben mit Mal und Geteilt im kleinen Einmaleins halten sich daran. Die Grenze liegt als Modulzustand vor, damit die Generatoren
// sie ohne Umwege kennen; app.js setzt sie bei jedem Zugriff auf den Konto-Stand (setMul(mulOf(s))). Ohne Aufruf gilt: alle Reihen, 0 an.
// Rechnen bis 1000 (Plus, Minus) und die Bezirksliga-Themen "Malnehmen groß" und "Teilen groß" (zweistellige Zahlen, Ergebnis über 100) bleiben unberührt.
import {R,pick} from "./util.js";

export const MUL_MAX_FACTOR=10,MUL_MAX_RESULT=100;
export const ALL_ROWS=[1,2,3,4,5,6,7,8,9,10];
export const defaultMul=()=>({rows:ALL_ROWS.slice(),zero:true});
// Bereinigt eine Einstellung: Reihen sind ganze Zahlen von 1 bis 10 ohne Doppelte, sortiert; leer oder ungültig = alle. zero fehlt = an.
export function normMul(m){
  const rows=m&&Array.isArray(m.rows)?[...new Set(m.rows.filter(x=>Number.isInteger(x)&&x>=1&&x<=MUL_MAX_FACTOR))].sort((a,b)=>a-b):[];
  return{rows:rows.length?rows:ALL_ROWS.slice(),zero:!(m&&m.zero===false)};
}
export const mulOf=s=>normMul(s&&s.settings&&s.settings.mul);

let LIM=defaultMul();
export const setMul=m=>{LIM=normMul(m);return LIM;};
export const getMul=()=>LIM;
export const rowsOnly=()=>LIM.rows.length<ALL_ROWS.length;

// Eine Reihe aus den gewählten Reihen im Bereich lo bis hi. Gibt es dort keine, nimmt sie eine gewählte Reihe ab min (nie größer als 10),
// und nur wenn auch das nicht geht (zum Beispiel nur die 1-er-Reihe, aber ein Teiler für Aufgaben mit Rest), fällt sie auf lo bis hi zurück.
export function pickRow(lo=1,hi=10,min=lo){
  let c=LIM.rows.filter(x=>x>=lo&&x<=hi);
  if(!c.length)c=LIM.rows.filter(x=>x>=min);
  return c.length?pick(c):R(lo,hi);
}
// Die andere Zahl der Aufgabe (1 bis 10). Mit "auch mal 0" kommt hin und wieder eine 0 vor, daneben eine 1.
export function otherFactor(lo=2){
  if(Math.random()<.14)return LIM.zero&&Math.random()<.65?0:1;
  return R(Math.max(lo,1),MUL_MAX_FACTOR);
}
// Ist die Aufgabe a · b (oder das Ergebnis dazu a · b : b) im Rahmen? Eine der beiden Zahlen muss in den gewählten Reihen liegen.
export function mulOk(a,b){
  if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a>MUL_MAX_FACTOR||b>MUL_MAX_FACTOR||a*b>MUL_MAX_RESULT)return false;
  if(!LIM.zero&&(a===0||b===0))return false;
  return LIM.rows.includes(a)||LIM.rows.includes(b);
}
