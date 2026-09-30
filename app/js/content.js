// Inhalte: Ligen, Themen, Sticker, Gegner und Konstanten. Reine Daten, keine Logik.
// Englisch und Sachkunde (nur Kreisliga) stehen in content-en.js und content-su.js.
import {EN_TOPICS} from "./content-en.js";
import {SU_TOPICS} from "./content-su.js";
export const ENG_IDS=Object.keys(EN_TOPICS),SU_IDS=Object.keys(SU_TOPICS);
export const LIGEN=[
  {id:"L1",name:"Trainingscamp",klasse:"Klasse 2",math:["m_read","m_split","m_plaet","m_zehner","m_mal","m_rechnen"],deu:["d_wortart","d_verl","d_satz"]},
  {id:"L2",name:"Kreisliga",klasse:"Klasse 3",math:["m3_rest","m3_1x1","m3_htz","m3_plus","m3_sach"],deu:["d3_praet","d3_fam","d3_ie","d3_doppel","d3_satzglied"],eng:ENG_IDS,su:SU_IDS},
  {id:"L3",name:"Bezirksliga",klasse:"Klasse 4",math:["m4_stelle","m4_mult","m4_div","m4_runden"],deu:["d4_perfekt","d4_rede","d4_steigern"]}
];
export const TOPICS={
  m_read:"Zahlen lesen",m_split:"Zehner und Einer",m_plaet:"Plättchen zaubern",m_zehner:"Zehner oder Einer dazu",m_mal:"Malaufgaben zum Bild",m_rechnen:"Kopfrechnen bis 100",
  d_wortart:"Wortarten",d_verl:"Verlängern",d_satz:"Satzende finden",
  m3_rest:"Teilen mit Rest",m3_1x1:"Einmaleins",m3_htz:"Hunderter, Zehner, Einer",m3_plus:"Rechnen bis 1000",m3_sach:"Sachaufgaben mit Rest",
  d3_praet:"Vergangenheit (Präteritum)",d3_fam:"Wortfamilien",d3_ie:"i oder ie",d3_doppel:"Doppelte Mitlaute",d3_satzglied:"Subjekt und Prädikat",
  m4_stelle:"Zahlen bis 1 Million",m4_mult:"Malnehmen groß",m4_div:"Teilen groß",m4_runden:"Runden",
  d4_perfekt:"Perfekt",d4_rede:"Wörtliche Rede",d4_steigern:"Adjektive steigern"};
for(const k of ENG_IDS)TOPICS[k]="Englisch: "+EN_TOPICS[k].name;
for(const k of SU_IDS)TOPICS[k]=SU_TOPICS[k].name;
export const FACHER={math:"Mathe",deu:"Deutsch",eng:"Englisch",su:"Sachkunde"};
export const isEng=t=>ENG_IDS.includes(t);
// Sachkunde-Themen, deren Stoff in der Schule oft noch nicht dran war: kommen seltener, falsche Antworten zählen nicht.
export const LATE_IDS=SU_IDS.filter(t=>SU_TOPICS[t].late);
export const EN_LEVELS=3;
export const WEAK={m_split:1.3,m_plaet:1.4,m_zehner:1.5,m_mal:1.1,m_rechnen:.9,d_wortart:1.5,d_verl:1.3,d_satz:1.4};
export const STICKERS=["Anstoß","Doppelpass","Flanke","Kopfball","Dribbling","Eckball","Freistoß","Elfmeter","Torwart-Parade","Fallrückzieher","Hattrick","Kapitän","Goldener Schuh","Pokal","Meisterschale","Champions-Stern","Flutlicht","Fankurve","Aufstieg","Derbysieg","Rekordtor","Traumpass","Wembley-Tor","Weltmeister"];
export const RIVALS=["FC Zahlenfuchs","SV Silbenbogen","Rot-Weiß Einmaleins","Kickers Komma","Eintracht Einer","Zehner United","Dynamo Diktat","Borussia Bündel","Hertha Hunderter","Viktoria Verb"];
export const ROUND=8,TRIAL=3,PROBE=20,MASTER_N=10,MASTER_K=8;
export const BONUS_FIX=8; // Kontroll-Bonus je selbst gefundenem und richtig verbessertem Fehler (weniger als ein Tor)
// Themen, die für den Aufstieg zählen (nur Mathe und Deutsch).
export const topicsOf=i=>LIGEN[i].math.concat(LIGEN[i].deu);
// Alle Themen der Liga, auch Englisch und Sachkunde (eigener Fortschritt, zählt nicht für den Aufstieg).
export const allTopicsOf=i=>topicsOf(i).concat(LIGEN[i].eng||[],LIGEN[i].su||[]);
// Themen eines Spiels: mix = nur Mathe und Deutsch, sonst das Fach (math, deu, eng, su).
export const poolOf=(li,mode)=>{const L=LIGEN[li];return mode==="mix"?L.math.concat(L.deu):(L[mode]||[]);};
export const TOPIC_MODES=["aktuell","wiederholen","aus"];
