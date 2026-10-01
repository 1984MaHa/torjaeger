// Version 1.5.3: Regressionstests zur Bewertung vom 01.10.2026 (Teil 1: fachlich falsch oder Datenverlust).
import {test} from "node:test";
import assert from "node:assert/strict";
import {GEN,SPELL_LISTS} from "../app/js/generators.js";

const strip=h=>String(h).replace(/<[^>]+>/g,"");

// ---------- 1. Rechtschreib-Listen: Vorlage plus richtige Lösung ergibt genau das Zielwort ----------
// Eigene, von Hand gepflegte Liste richtig geschriebener Wörter (unabhängig von den Daten der App).
const RICHTIG=new Set(["Spiel","Tier","Wiese","Brief","Ziel","Knie","Fliege","niemand","Kind","Fisch","Tisch","Wind","Bild","Schiff","Mitte","Trikot",
  "Hund","Kind","Wald","Pferd","Bild","Hemd","Zelt","Hut","Elefant","Blatt","Berg","Zwerg","Zug","Weg","Schrank","Werk","Korb","Sieb","Kalb","gelb",
  "Ball","Sonne","Mutter","kommen","Teller","Suppe","schwimmen","Himmel","Pfiff","Mannschaft","Hose","Blume","Tafel","Schule","Tor","Kette"]);
// Wörter, die auch mit der falschen Wahl ein echtes deutsches Wort ergäben (dann wäre die Frage nicht eindeutig)
const ECHTE_FALSCHE=new Set(["Lid"]);

test("i/ie: jede Vorlage plus richtige Lösung ergibt genau das Zielwort aus der Wortliste",()=>{
  for(const [wort,sol] of SPELL_LISTS.IE){
    const gap=SPELL_LISTS.ieGap(wort,sol);
    assert.equal((gap.match(/_/g)||[]).length,1,wort+": genau eine Lücke");
    assert.equal(gap.replace("_",sol),wort,wort+": Vorlage plus Lösung");
    assert.ok(RICHTIG.has(wort),wort+" steht in der Wortliste");
    const falsch=sol==="ie"?"i":"ie";
    assert.ok(!RICHTIG.has(gap.replace("_",falsch)),wort+": die falsche Wahl ergibt kein richtiges Wort");
    assert.ok(!ECHTE_FALSCHE.has(gap.replace("_",falsch)),wort+": die falsche Wahl ergibt kein echtes Wort");
  }
});

test("i/ie: die erzeugte Aufgabe ist stimmig (Lösung füllt die Lücke zum Zielwort, nie Lieed oder Spieel)",()=>{
  const seen=new Set();
  for(let n=0;n<600;n++){
    const T=GEN.d3_ie(),tpl=/<b>(.*?)<\/b>/.exec(T.q)[1].replace("<mark>_</mark>","_");
    const word=tpl.replace("_",T.a);seen.add(word);
    assert.ok(RICHTIG.has(word),"erzeugtes Wort "+word+" ist kein richtiges Wort");
    assert.ok(!/ieed|ieel|ieer|iees|ieef|iee\b/i.test(word),word+": doppeltes e");
    assert.deepEqual([...T.choices].sort(),["i","ie"]);
    assert.ok(strip(T.ex).startsWith(word+":"),"Erklärung nennt das richtige Wort: "+T.ex);
  }
  assert.equal(seen.size,SPELL_LISTS.IE.length,"alle Wörter der Liste kommen vor");
});

test("Verlängern (b/p, d/t, g/k): Vorlage plus Lösung ergibt ein Wort der Liste, die andere Wahl ein falsches",()=>{
  for(const v of SPELL_LISTS.VERL){
    const vorlage=v[0].replace(/ \(.*\)$/,""),wort=vorlage.replace("_",v[1]),falsch=vorlage.replace("_",v[2]);
    const art=v[3].replace(/^(der|die|das) /,"");
    assert.equal(wort,art,v[0]+": Lösung ergibt das Zielwort");
    assert.ok(RICHTIG.has(wort),wort+" steht in der Wortliste");
    assert.ok(!RICHTIG.has(falsch),v[0]+": die falsche Wahl "+falsch+" ist kein richtiges Wort");
    assert.notEqual(v[1],v[2]);
  }
  for(let n=0;n<200;n++){const T=GEN.d_verl();assert.equal(T.choices.length,2);assert.ok(T.choices.includes(T.a));}
});

test("Doppelt oder einfach: das richtige Wort steht in der Liste, das falsche nicht, die Regel passt zum Wort",()=>{
  for(const [richtig,falsch,doppelt] of SPELL_LISTS.DOPPEL){
    assert.ok(RICHTIG.has(richtig),richtig+" steht in der Wortliste");
    assert.ok(!RICHTIG.has(falsch),falsch+" ist kein richtiges Wort");
    assert.equal(/(.)\1/i.test(richtig),!!doppelt,richtig+": Doppelbuchstabe passt zur Regel");
    assert.notEqual(richtig,falsch);
  }
  for(let n=0;n<200;n++){const T=GEN.d3_doppel();assert.ok(RICHTIG.has(T.a));assert.ok(T.choices.includes(T.a)&&T.choices.length===2);}
});

// ---------- 2. Sachaufgabe Netze: die Erklärung nennt den echten Rest ----------
test("Netze: Erklärung und Rechnung passen über viele Zufallswerte zusammen, nie „halb voll“",()=>{
  let netze=0;
  for(let n=0;n<4000;n++){
    const T=GEN.m3_sach(),q=strip(T.q);
    const m=/Für (\d+) Bälle gibt es Netze\. In ein Netz passen (\d+) Bälle/.exec(q);
    if(!m)continue;netze++;
    const a=Number(m[1]),b=Number(m[2]),voll=Math.floor(a/b),rest=a%b;
    assert.equal(T.a,voll,"Antwort = volle Netze");
    assert.ok(rest>=1&&rest<b);
    const ex=strip(T.ex);
    assert.ok(!/halb/.test(ex),"nie halb voll: "+ex);
    assert.ok(ex.includes(`${a} : ${b} = ${voll} Rest ${rest}`),"Rechnung stimmt: "+ex);
    assert.ok(rest===1?ex.includes("liegt nur 1 Ball"):ex.includes(`liegen nur ${rest} Bälle`),"nennt den echten Rest "+rest+": "+ex);
  }
  assert.ok(netze>200,"die Netze-Aufgabe kam oft genug vor ("+netze+")");
});
