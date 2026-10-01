// Aufgaben-Generatoren je Thema (Klasse 2 bis 4) samt Wortlisten.
import {R,pick,shuffle,fmt} from "./util.js";
import {blocksSVG,stwSVG,fieldSVG,groupsSVG} from "./svg.js";
import {TASKGEN} from "./tasks.js";

const NOMEN=[["BALL","der Ball"],["TOR","das Tor"],["TRAINER","der Trainer"],["WIESE","die Wiese"],["TRIKOT","das Trikot"],["SCHUH","der Schuh"],["PFIFF","der Pfiff"],["SONNE","die Sonne"],["SCHAF","das Schaf"],["HUND","der Hund"],["BLUME","die Blume"],["NETZ","das Netz"],["MANNSCHAFT","die Mannschaft"],["KATZE","die Katze"]];
const VERBEN=[["LAUFEN","ich laufe"],["SPRINGT","er springt"],["SCHIESST","er schießt"],["LIEGT","es liegt"],["KICKT","sie kickt"],["JUBELN","wir jubeln"],["RENNT","er rennt"],["SPIELEN","wir spielen"],["LACHT","sie lacht"],["FÄNGT","er fängt"],["WIRFT","sie wirft"],["PFEIFT","er pfeift"]];
const ADJ=[["SCHNELL","der schnelle Ball"],["GRÜN","die grüne Wiese"],["RUND","der runde Ball"],["LAUT","der laute Pfiff"],["SCHÖN","das schöne Tor"],["SAFTIG","die saftige Wiese"],["BUNT","das bunte Trikot"],["KLEIN","der kleine Hund"],["MÜDE","der müde Trainer"],["STARK","der starke Torwart"]];
const VERL=[["Hun_","d","t","der Hund","die Hunde"],["Kin_","d","t","das Kind","die Kinder"],["Wal_","d","t","der Wald","die Wälder"],["Pfer_","d","t","das Pferd","die Pferde"],["Bil_","d","t","das Bild","die Bilder"],["Hem_","d","t","das Hemd","die Hemden"],
  ["Zel_","t","d","das Zelt","die Zelte"],["Hu_ (auf dem Kopf)","t","d","der Hut","die Hüte"],["Elefan_","t","d","der Elefant","die Elefanten"],["Blat_","t","d","das Blatt","die Blätter"],
  ["Ber_","g","k","der Berg","die Berge"],["Zwer_","g","k","der Zwerg","die Zwerge"],["Zu_","g","k","der Zug","die Züge"],["We_","g","k","der Weg","die Wege"],["Schran_","k","g","der Schrank","die Schränke"],["Wer_","k","g","das Werk","die Werke"],
  ["Kor_","b","p","der Korb","die Körbe"],["Sie_","b","p","das Sieb","die Siebe"],["Kal_","b","p","das Kalb","die Kälber"],["gel_","b","p","gelb","die gelbe Karte"]];
const SAETZE=[["Emil schießt aufs Tor","Der Ball fliegt ins Netz"],["Am Samstag ist ein Spiel","Alle Kinder freuen sich"],["Der Trainer pfeift","Jetzt geht es los"],["Die Sonne scheint","Wir spielen auf der Wiese"],["Mein Trikot ist grün","Es hat die Nummer zehn"],["Die Katze spielt gern","Sie jagt den kleinen Ball"],["Im Frühling gibt es viele Tierkinder","Küken schlüpfen aus den Eiern"],["Der Torwart fängt den Ball","Die Fans jubeln laut"],["Es regnet heute","Wir trainieren in der Halle"],["Emil zieht seine Schuhe an","Dann läuft er auf den Platz"]];
const PRAET=[["läuft","lief","laufte"],["spielt","spielte","spielen"],["schießt","schoss","schießte"],["rennt","rannte","rennte"],["geht","ging","gehte"],["kommt","kam","kommte"],["fängt","fing","fangte"],["springt","sprang","springte"],["lacht","lachte","lucht"],["ruft","rief","rufte"],["sieht","sah","siehte"],["trinkt","trank","trinkte"],["schreibt","schrieb","schreibte"],["singt","sang","singte"],["wirft","warf","werfte"],["trainiert","trainierte","trainieren"]];
const FAM=[["fahren",["Fahrer","Fahrrad","Abfahrt"],"Farbe"],["spielen",["Spieler","Spielplatz","verspielt"],"Spiegel"],["lesen",["Leser","Lesebuch","vorlesen"],"Löwe"],["schreiben",["Schrift","Schreibtisch","abschreiben"],"schreien"],["fallen",["Unfall","Falle","gefallen"],"falten"],["laufen",["Läufer","Anlauf","Lauf"],"Laub"],["backen",["Bäcker","Backofen","gebacken"],"Bach"],["schießen",["Schuss","Torschütze","abschießen"],"Schüssel"],["werfen",["Wurf","Einwurf","Werfer"],"Wurst"]];
// Zielwort und Lösung. Die Vorlage entsteht daraus (erste Stelle der Lösung wird zur Lücke), so passt Vorlage plus Lösung immer zum Wort.
// Mit der falschen Wahl darf kein echtes Wort entstehen (sonst wäre die Frage nicht eindeutig): Lid statt Lied fehlt deshalb.
const IE=[["Spiel","ie"],["Tier","ie"],["Wiese","ie"],["Brief","ie"],["Ziel","ie"],["Knie","ie"],["Fliege","ie"],["niemand","ie"],["Kind","i"],["Fisch","i"],["Tisch","i"],["Wind","i"],["Bild","i"],["Schiff","i"],["Mitte","i"],["Trikot","i"]];
const ieGap=(w,sol)=>w.replace(sol,"_");
const DOPPEL=[["Ball","Bal",1],["Sonne","Sone",1],["Mutter","Muter",1],["kommen","komen",1],["Teller","Teler",1],["Suppe","Supe",1],["schwimmen","schwimen",1],["Himmel","Himel",1],["Pfiff","Pfif",1],["Mannschaft","Manschaft",1],["Hose","Hosse",0],["Blume","Blumme",0],["Tafel","Taffel",0],["Schule","Schulle",0],["Tor","Torr",0],["Kette","Kete",1]];
const SG=[["Der Torwart fängt den Ball",1,2],["Emil schießt ein Tor",0,1],["Die Fans singen laut",1,2],["Der Trainer ruft die Kinder",1,2],["Im Winter trainiert die Mannschaft in der Halle",4,2],["Morgen spielt Emil gegen Dynamo",2,1],["Die Sonne scheint auf den Platz",1,2],["Der Schiedsrichter zeigt die gelbe Karte",1,2],["Heute gewinnt unser Team",3,1],["Die Katze jagt den Ball",1,2]];
const PERF=[["laufen","ich bin gelaufen","ich habe gelauft","ich bin gelauft"],["spielen","ich habe gespielt","ich bin gespielt","ich habe gespielen"],["schießen","ich habe geschossen","ich bin geschossen","ich habe geschießt"],["fahren","ich bin gefahren","ich habe gefahrt","ich bin gefahrt"],["essen","ich habe gegessen","ich bin gegessen","ich habe geesst"],["schwimmen","ich bin geschwommen","ich habe geschwimmt","ich bin geschwimmt"],["schreiben","ich habe geschrieben","ich habe geschreibt","ich bin geschrieben"],["kommen","ich bin gekommen","ich habe gekommen","ich bin gekommt"],["singen","ich habe gesungen","ich habe gesingt","ich bin gesungen"],["springen","ich bin gesprungen","ich habe gespringt","ich bin gespringt"],["gewinnen","ich habe gewonnen","ich habe gewinnt","ich bin gewonnen"]];
const REDE=[["Emil","sagt","Ich spiele heute im Tor","."],["Der Trainer","ruft","Alle kommen zu mir","."],["Mama","fragt","Hast du deine Schuhe dabei","?"],["Tim","fragt","Wann beginnt das Spiel","?"],["Die Trainerin","sagt","Heute üben wir Pässe","."],["Emil","ruft","Gib mir den Ball","!"]];
const STEIG=[["schnell","schneller","am schnellsten","schnellerer"],["groß","größer","am größten","großer"],["gut","besser","am besten","guter"],["viel","mehr","am meisten","vieler"],["hoch","höher","am höchsten","hocher"],["stark","stärker","am stärksten","starker"],["klein","kleiner","am kleinsten","kleinerer"],["laut","lauter","am lautesten","lautster"],["weit","weiter","am weitesten","weiterer"]];

// Wortlisten der Rechtschreib-Aufgaben (für die Tests)
export const SPELL_LISTS={IE,VERL,DOPPEL,ieGap};

// Bausteine für Aufgaben, die auch als Päckchen (check.js) vorkommen. inv: Gegenaufgabe für die Probe (check.js).
export const mk={
  rest(a,b){const q=Math.floor(a/b),r=a%b;
    return{type:"pair",q:`${a} : ${b} = ? <mark>Rest</mark> ?`,vis:groupsSVG(a,b),a:[q,r],labels:["Ergebnis","Rest"],inv:{op:"rest",y:b},
      ex:`${q} · ${b} = ${q*b}. Bis ${a} fehlen noch ${r}. Also ${a} : ${b} = ${q} Rest ${r}.`,hint:`Suche die größte Zahl aus der ${b}er-Reihe, die in ${a} passt. Der Rest muss kleiner als ${b} sein.`};},
  einmaleins(a,b,div){
    if(!div)return{type:"num",q:`${a} · ${b} = ?`,a:a*b,inv:{op:"*",y:b},ex:`${a} · ${b} = ${a*b}. Tipp: ${a} · ${b} ist dasselbe wie ${b} · ${a}.`};
    return{type:"num",q:`${a*b} : ${b} = ?`,a:a,inv:{op:"/",y:b},ex:`${a} · ${b} = ${a*b}, also ${a*b} : ${b} = ${a}.`};},
  plus(a,b,minus){
    return minus?{type:"num",q:`${a} − ${b} = ?`,a:a-b,inv:{op:"-",y:b},ex:`Rechne Stelle für Stelle: ${a} − ${b} = ${a-b}.`}
      :{type:"num",q:`${a} + ${b} = ?`,a:a+b,inv:{op:"+",y:b},ex:`Rechne Stelle für Stelle: ${a} + ${b} = ${a+b}.`};},
  mult(a,b){const z=a-a%10,e=a%10;return{type:"num",q:`${a} · ${b} = ?`,a:a*b,inv:{op:"*",y:b},ex:`${z} · ${b} = ${z*b} und ${e} · ${b} = ${e*b}. Zusammen ${a*b}.`,hint:`Zerlege ${a} in ${z} und ${e}.`};},
  div(b,q){const a=b*q,big=Math.floor(q/10)*10*b;return{type:"num",q:`${a} : ${b} = ?`,a:q,inv:{op:"/",y:b},ex:`${big} : ${b} = ${big/b} und ${a-big} : ${b} = ${(a-big)/b}. Zusammen ${q}.`,hint:`Zerlege ${a} in Zahlen, die gut durch ${b} gehen.`};}
};

const WA_HINT="<b>Nomen:</b> Passt der, die oder das davor?<br><b>Verb:</b> Passt ich, er oder wir davor?<br><b>Adjektiv:</b> Passt es zwischen der und ein Nomen, wie „der ___ Ball“?";
export const GEN={
  // ---- Klasse 2 ----
  m_read(){let z=R(0,9),e=R(0,9);if(!z&&!e)e=5;const n=10*z+e;return{type:"num",q:"Welche Zahl ist das?",vis:blocksSVG(z,e),a:n,ex:`${z} Zehner und ${e} Einer sind ${n}.`};},
  m_split(){const n=Math.random()<.3?R(1,9):R(10,99),Z=Math.floor(n/10),E=n%10,ask=Math.random()<.55?"Z":"E";
    return{type:"num",q:`Wie viele <mark>${ask==="Z"?"Zehner":"Einer"}</mark> hat die Zahl <b>${n}</b>?`,a:ask==="Z"?Z:E,ex:`${n} = ${Z} Zehner + ${E} Einer.`+(Z===0?" Unter 10 gibt es 0 Zehner.":"")};},
  m_plaet(){const z=R(1,8),e=R(1,8),n=10*z+e,dazu=Math.random()<.6,valid=dazu?[n+10,n+1]:[n-10,n-1],right=pick(valid);
    const pool=[10*e+z,dazu?n+2:n-2,dazu?n+11:n-11,dazu?n+20:n-20,n,dazu?n+9:n-9].filter(x=>x>=0&&x<=99&&!valid.includes(x));
    return{type:"choice",q:`Lege <mark>ein</mark> Plättchen <mark>${dazu?"dazu":"weg"}</mark>. Welche Zahl kann entstehen?`,vis:stwSVG(z,e),choices:[right].concat(shuffle([...new Set(pool)]).slice(0,3)).map(String),a:String(right),
      ex:`Gelegt ist ${n}. ${dazu?"Dazu":"Weg"} bei Z: ${valid[0]}. ${dazu?"Dazu":"Weg"} bei E: ${valid[1]}.`};},
  m_zehner(){const unit=Math.random()<.6?"Zehner":"Einer",plus=Math.random()<.55,k=R(1,4);let a,res;
    if(unit==="Zehner"){a=plus?R(11,99-10*k):R(10*k+1,98);res=plus?a+10*k:a-10*k;}else{a=plus?R(11,95-k):R(k+10,98);res=plus?a+k:a-k;}
    const op=plus?"+":"−",v=unit==="Zehner"?10*k:k;return{type:"num",q:`${a} ${op} ${k} <mark>${unit}</mark> = ?`,a:res,inv:{op:plus?"+":"-",y:v},ex:`${k} ${unit} sind ${v}. ${a} ${op} ${v} = ${res}.`};},
  m_mal(){let r=R(2,5),c=R(2,6);if(r===c)c=c===6?5:c+1;const ex=`${r} Reihen mit je ${c} Punkten: ${r} · ${c} = ${r*c}.`;
    if(Math.random()<.5){const right=`${r} · ${c}`;return{type:"choice",q:"Welche <mark>Malaufgabe</mark> passt zum Bild? Zähle die Reihen.",vis:fieldSVG(r,c),choices:[right,`${r} + ${c}`,`${r+1} · ${c}`,`${r} · ${c+1}`],a:right,probeText:"Zähle die Reihen und die Punkte in jeder Reihe noch einmal. Passt deine Malaufgabe genau zum Bild?",ex};}
    return{type:"num",q:"Wie viele Punkte sind es? Rechne mit <mark>mal</mark>.",vis:fieldSVG(r,c),a:r*c,probeText:`Rechne die Tauschaufgabe: ${c} · ${r} = ? Kommt dasselbe heraus wie bei deiner Antwort?`,ex};},
  m_rechnen(){const t=R(0,2);let a,b;
    if(t===0){do{a=R(12,88);b=R(3,9);}while(a%10+b<10||a+b>99);const s=10-a%10;return{type:"num",q:`${a} + ${b} = ?`,a:a+b,inv:{op:"+",y:b},ex:`Erst bis zum Zehner: ${a} + ${s} = ${a+s}. Dann noch ${b-s}: ${a+b}.`};}
    if(t===1){do{a=R(21,95);b=R(3,9);}while(a%10>=b);const s=a%10;return{type:"num",q:`${a} − ${b} = ?`,a:a-b,inv:{op:"-",y:b},ex:`Erst zum Zehner: ${a} − ${s} = ${a-s}. Dann noch ${b-s} weg: ${a-b}.`};}
    a=R(40,95);b=R(11,a-5);const bz=b-b%10;return{type:"num",q:`${a} − ${b} = ?`,a:a-b,inv:{op:"-",y:b},ex:`Erst die Zehner: ${a} − ${bz} = ${a-bz}. Dann die Einer: ${a-bz} − ${b%10} = ${a-b}.`};},
  d_wortart(){const k=R(0,2),w=pick([NOMEN,VERBEN,ADJ][k]),names=["Nomen","Verb","Adjektiv"];
    return{type:"choice",fixed:true,q:`Welche Wortart ist <b>${w[0]}</b>?`,choices:names,a:names[k],ex:`${names[k]}-Probe: „${w[1]}“ passt.`,hint:WA_HINT};},
  d_verl(){const v=pick(VERL);return{type:"choice",fixed:true,q:`Welcher Buchstabe fehlt? <b>${v[0].replace("_","<mark>_</mark>")}</b>`,choices:[v[1],v[2]].sort(),a:v[1],
    ex:`Verlängern: ${v[3]} → ${v[4]}. Da hörst du das ${v[1]}.`,hint:"Mach das Wort länger, zum Beispiel mit der Mehrzahl. Dann hörst du den Buchstaben."};},
  d_satz(){const p=pick(SAETZE),w1=p[0].split(" "),w=w1.concat(p[1].split(" "));
    return{type:"tap",q:"Wo ist der erste Satz zu Ende? Tippe auf das Wort, nach dem der <mark>Punkt</mark> kommt.",words:w,a:w1.length-1,ex:`Richtig ist: ${p[0]}. ${p[1]}.`,
      hint:"Lies laut. Wo deine Stimme nach unten geht, ist der Satz zu Ende. Nach dem Punkt geht es groß weiter.",tapLabel:"Punkt setzen!",mark:true};},
  // ---- Klasse 3 ----
  m3_rest(){const b=R(2,9),q=R(1,9),r=Math.random()<.8?R(1,b-1):0;return mk.rest(b*q+r,b);},
  m3_1x1(){const a=R(2,10),b=R(2,10);return mk.einmaleins(a,b,Math.random()>=.5);},
  m3_htz(){const n=R(101,999),H=Math.floor(n/100),Z=Math.floor(n/10)%10,E=n%10,t=R(0,2);
    if(t===2)return{type:"num",q:`${H} <mark>H</mark> + ${Z} <mark>Z</mark> + ${E} <mark>E</mark> = ?`,a:n,ex:`${H} Hunderter, ${Z} Zehner und ${E} Einer sind ${n}.`};
    const w=t===0?"Hunderter":"Zehner";return{type:"num",q:`Wie viele <mark>${w}</mark> stehen an der Stelle in <b>${n}</b>?`,a:t===0?H:Z,ex:`${n} = ${H} H + ${Z} Z + ${E} E.`};},
  m3_plus(){const t=R(0,3);let a,b;
    if(t===0){a=R(1,6)*100+R(0,9)*10;b=R(1,3)*100+R(0,9)*10;if(a+b>999)b=100;return{type:"num",q:`${a} + ${b} = ?`,a:a+b,inv:{op:"+",y:b},ex:`Erst die Hunderter, dann die Zehner: ${a} + ${b} = ${a+b}.`};}
    if(t===1){a=R(4,9)*100+R(0,9)*10;b=R(1,3)*100+R(0,9)*10;if(b>a)b=100;return{type:"num",q:`${a} − ${b} = ?`,a:a-b,inv:{op:"-",y:b},ex:`Erst die Hunderter weg, dann die Zehner: ${a} − ${b} = ${a-b}.`};}
    if(t===2){a=R(100,899);b=R(1,9)*10;return{type:"num",q:`${a} + ${b} = ?`,a:a+b,inv:{op:"+",y:b},ex:`${b/10} Zehner dazu: ${a} + ${b} = ${a+b}.`};}
    a=R(1,9)*100;b=R(1,9)*10+R(1,9);if(b>a)a+=100;return{type:"num",q:`${a} − ${b} = ?`,a:a-b,inv:{op:"-",y:b},ex:`Erst ${b-b%10} weg: ${a-(b-b%10)}. Dann noch ${b%10} weg: ${a-b}.`};},
  m3_sach(){const b=R(3,6);let q=R(3,8),r=R(1,b-1),a=b*q+r;
    const S1=[`${a} Kinder fahren zum Turnier. In ein Auto passen ${b} Kinder. Wie viele Autos braucht man?`,q+1,`${a} : ${b} = ${q} Rest ${r}. Die ${r} übrigen Kinder brauchen auch ein Auto, also ${q+1} Autos.`],
      S2=[`Emil verteilt ${a} Sticker gerecht an ${b} Freunde. Wie viele Sticker bekommt jeder?`,q,`${a} : ${b} = ${q} Rest ${r}. Jeder bekommt ${q}, ${r} Sticker bleiben übrig.`],
      S3=[`Für ${a} Bälle gibt es Netze. In ein Netz passen ${b} Bälle. Wie viele Netze werden ganz voll?`,q,`${a} : ${b} = ${q} Rest ${r}. ${q} Netze werden ganz voll. Im letzten Netz ${r===1?"liegt nur 1 Ball":"liegen nur "+r+" Bälle"}, das Netz ist nicht voll.`];
    const s=pick([S1,S2,S3]);return{type:"num",q:s[0],a:s[1],ex:s[2],hint:"Rechne erst mit Rest. Überlege dann: Braucht der Rest noch etwas extra oder bleibt er übrig?"};},
  d3_praet(){const v=pick(PRAET);const w=[v[1],v[2],v[0]].filter((x,i,a)=>a.indexOf(x)===i);
    return{type:"choice",q:`Heute: Emil <b>${v[0]}</b>.<br>Gestern: Emil <mark>___</mark>.`,choices:w,a:v[1],ex:`Heute: er ${v[0]}. Gestern: er ${v[1]}.`,hint:"Sprich den Satz laut: Gestern … Welche Form klingt richtig?"};},
  d3_fam(){const f=pick(FAM);return{type:"choice",q:`Welches Wort gehört <mark>nicht</mark> zur Wortfamilie <b>${f[0]}</b>?`,choices:f[1].concat([f[2]]),a:f[2],
    ex:`${f[1].join(", ")} haben alle den Wortstamm von „${f[0]}“. „${f[2]}“ klingt nur ähnlich.`,hint:"Wortfamilien haben denselben Wortstamm und etwas mit derselben Sache zu tun."};},
  d3_ie(){const w=pick(IE),full=w[0],gap=ieGap(w[0],w[1]);return{type:"choice",fixed:true,q:`i oder ie? <b>${gap.replace("_","<mark>_</mark>")}</b>`,choices:["i","ie"],a:w[1],
    ex:w[1]==="ie"?`${full}: Das i klingt lang, also schreibt man meistens ie.`:`${full}: Das i klingt kurz, also nur i.`,hint:"Sprich das Wort langsam. Klingt das i lang wie in Biene oder kurz wie in Kiste?"};},
  d3_doppel(){const w=pick(DOPPEL);return{type:"choice",q:"Welches Wort ist <mark>richtig</mark> geschrieben?",choices:[w[0],w[1]],a:w[0],
    ex:w[2]?`${w[0]}: Der Selbstlaut vor dem Mitlaut klingt kurz, deshalb kommt der Mitlaut doppelt.`:`${w[0]}: Der Selbstlaut klingt lang, deshalb bleibt der Mitlaut einfach.`,hint:"Klingt der Selbstlaut kurz, wird der Mitlaut danach oft verdoppelt: Kanne, Tasse."};},
  d3_satzglied(){const s=pick(SG),w=s[0].split(" "),subj=Math.random()<.5;
    return{type:"tap",q:subj?"Tippe auf das Nomen im <mark>Subjekt</mark>. Frag: Wer oder was?":"Tippe auf das <mark>Prädikat</mark>. Frag: Was tut jemand?",words:w,a:subj?s[1]:s[2],
      ex:subj?`Wer oder was ${w[s[2]]}? ${w[s[1]]}. Das ist das Subjekt.`:`Was tut jemand? ${w[s[2]]}. Das Prädikat ist das Verb im Satz.`,tapLabel:"Das ist es!",hint:"Subjekt: Wer oder was tut etwas? Prädikat: Was tut es? Das Prädikat ist immer ein Verb."};},
  // ---- Klasse 4 ----
  m4_stelle(){const n=R(10000,999999),names=[["Zehntausender",10000],["Tausender",1000],["Hunderter",100]],p=pick(names),dg=Math.floor(n/p[1])%10;
    return{type:"num",q:`Welche Ziffer steht an der <mark>${p[0]}</mark>-Stelle von <b>${fmt(n)}</b>?`,a:dg,ex:`In ${fmt(n)} steht an der ${p[0]}-Stelle die ${dg}.`,hint:"Von rechts: Einer, Zehner, Hunderter, Tausender, Zehntausender, Hunderttausender."};},
  m4_mult(){return mk.mult(R(12,99),R(3,9));},
  m4_div(){return mk.div(R(2,9),R(11,40));},
  m4_runden(){const n=R(1001,9989),down=Math.floor(n/100)*100,up=down+100,right=n%100>=50?up:down,wrong=right===up?down:up,z=Math.round(n/10)*10;
    const ch=[fmt(right),fmt(wrong)];if(z!==right&&z!==wrong)ch.push(fmt(z));
    return{type:"choice",q:`Runde <b>${fmt(n)}</b> auf <mark>Hunderter</mark>.`,choices:ch,a:fmt(right),ex:`Die Zehnerziffer ist ${Math.floor(n/10)%10}. ${n%100>=50?"Ab 5 wird aufgerundet":"Unter 5 wird abgerundet"}: ${fmt(right)}.`,hint:"Schau auf die Ziffer rechts neben den Hundertern. 0 bis 4: abrunden. 5 bis 9: aufrunden."};},
  d4_perfekt(){const v=pick(PERF);return{type:"choice",q:`Setze <b>${v[0]}</b> ins <mark>Perfekt</mark>.`,choices:[v[1],v[2],v[3]],a:v[1],ex:`Richtig: ${v[1]}.`,hint:"Perfekt: habe oder bin + ge…-Form. Bei Bewegungen von A nach B oft „bin“."};},
  d4_rede(){const r=pick(REDE),t=r[2],pz=r[3];const right=`${r[0]} ${r[1]}: „${t}${pz}“`,w1=`${r[0]} ${r[1]} „${t}${pz}“`,w2=`${r[0]} ${r[1]}: ${t}${pz}`,w3=`${r[0]} ${r[1]}: „${t.charAt(0).toLowerCase()+t.slice(1)}${pz}“`;
    return{type:"choice",q:"Welcher Satz ist mit <mark>wörtlicher Rede</mark> richtig geschrieben?",choices:[right,w1,w2,w3],a:right,small:true,ex:`Nach dem Begleitsatz kommt ein Doppelpunkt. Das Gesagte steht in Anführungszeichen und beginnt groß: ${right}`,hint:"Begleitsatz, Doppelpunkt, „Gesagtes mit großem Anfang und Satzzeichen“."};},
  d4_steigern(){const s=pick(STEIG),sup=Math.random()<.4;
    if(sup)return{type:"choice",q:`${s[0]} → ${s[1]} → <mark>___</mark>`,choices:[s[2],"am "+s[3],"am "+s[1]].filter((x,i,a)=>a.indexOf(x)===i),a:s[2],ex:`${s[0]}, ${s[1]}, ${s[2]}.`};
    return{type:"choice",q:`${s[0]} → <mark>___</mark> → ${s[2]}`,choices:[s[1],s[3],"mehr "+s[0]],a:s[1],ex:`${s[0]}, ${s[1]}, ${s[2]}.`};}
};

// Erster Tipp (Denkanstoß) für Aufgaben, die keinen eigenen hint haben. Verrät nie die Lösung.
const HINTS={
  m_read:"Zähle zuerst die Zehnerstangen. Jede Stange ist zehn wert. Dann zählst du die einzelnen Würfel dazu.",
  m_split:"Die linke Ziffer sind die Zehner. Die rechte Ziffer sind die Einer.",
  m_plaet:"Ein Plättchen bei Z macht die Zahl um zehn größer oder kleiner. Ein Plättchen bei E ändert sie um eins.",
  m_zehner:"Ein Zehner ist zehn, ein Einer ist eins. Rechne erst aus, wie viel das zusammen ist.",
  m_mal:"Zähle die Reihen und die Punkte in einer Reihe. Mal heißt: gleich viele, immer wieder.",
  m_rechnen:"Rechne in zwei Schritten. Erst zum vollen Zehner, dann den Rest.",
  m3_1x1:"Kennst du die Reihe? Zähle in Schritten oder nimm eine leichtere Aufgabe, die du schon weißt.",
  m3_htz:"H ist Hunderter, Z ist Zehner, E ist Einer. Schau dir jede Stelle einzeln an.",
  m3_plus:"Rechne Stelle für Stelle. Erst die Hunderter, dann die Zehner, dann die Einer.",
  d4_steigern:"Steigern heißt: warm, wärmer, am wärmsten. Sprich es laut. Welche Form klingt richtig?"
};
for(const t of Object.keys(HINTS)){const f=GEN[t];GEN[t]=()=>{const T=f();if(!T.hint)T.hint=HINTS[t];return T;};}

// Englisch und Sachkunde (neue Aufgabenarten): GEN[thema]({level}) , siehe tasks.js
Object.assign(GEN,TASKGEN);
