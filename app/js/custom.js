// Baukasten "Eigenes Trainingslager" (ab 1.7.3): Vorlagen, Aufgaben je Einheit und der Aufbau der Lager-Beschreibung. Reine Funktionen, kein DOM.
// Eine Vorlage gilt für alle Konten (global, wird abgeglichen), der Fortschritt steht je Konto in camps["c:<Vorlagen-Nr>"]. Beim ersten Abschluss
// einer Einheit friert das Konto die Vorlage ein (camps[...].def): Ändern die Eltern die Vorlage danach, bleibt das laufende Lager unverändert,
// bis sie es neu starten. Die Eltern-Grenze des Kontos (mul.js) gilt immer, eine Vorlage kann sie nur einengen.
import {pick,shuffle} from "./util.js";
import {GEN} from "./generators.js";
import {keyOf} from "./check.js";
import {rowTask,rowPackTasks,ROW_KINDS,ROW_KIND_NAMES} from "./rowtasks.js";
import {getMul,setMul,ALL_ROWS} from "./mul.js";
import {LIGEN,TOPICS,FACHER,isEng} from "./content.js";

export const KIND_PREFIX="kind:";
export const BONUS_KINDS=["penalty","wall","memory","dribble","surprise","none"];
export const BONUS_NAMES={penalty:"Elfmeterschießen",wall:"Torwand",memory:"Memory",dribble:"Dribbel-Parcours",surprise:"Überraschung",none:"Keine Nachspielzeit"};
export const HALF_CHOICES=[3,5,8,10,12,15,20]; // Aufgaben je Halbzeit (gilt auch für ein Päckchen im Lager)
export const UNIT_MIN=1,UNIT_MAX=5;
export const NAME_MAX=30;
export const PEN_N=5;                 // Schüsse im Elfmeterschießen
export const CUSTOM_PREFIX="c:";      // Lager-Nummer im Konto: "c:" + Vorlagen-Nr
export const TPL_ID_RE=/^[tb]-[a-z0-9]{3,12}$/;

// ---------- Aufgabenarten zur Auswahl ----------
// Jede Auswahl ist ein Thema (Kennung wie "m3_1x1") oder eine Reihen-Art ("kind:sacks"). Nach Fach geordnet für den Baukasten.
const TOPIC_FACH=[];
for(const [li,L] of LIGEN.entries())for(const f of Object.keys(FACHER))for(const t of L[f]||[])TOPIC_FACH.push({id:t,name:TOPICS[t],fach:f,li});
export const ITEM_LIST=TOPIC_FACH.map(x=>({id:x.id,name:x.name,fach:FACHER[x.fach],li:x.li}))
  .concat(ROW_KINDS.map(k=>({id:KIND_PREFIX+k,name:ROW_KIND_NAMES[k],fach:"Einmaleins-Reihen",li:1})));
export const ITEM_IDS=new Set(ITEM_LIST.map(x=>x.id));
export const itemName=id=>(ITEM_LIST.find(x=>x.id===id)||{name:id}).name;
const isKind=id=>String(id).startsWith(KIND_PREFIX);
const kindOf=id=>String(id).slice(KIND_PREFIX.length);

// ---------- Vorlagen bereinigen ----------
const cleanItems=a=>Array.isArray(a)?[...new Set(a.filter(x=>typeof x==="string"&&ITEM_IDS.has(x)))]:[];
const cleanRows=a=>{const r=Array.isArray(a)?[...new Set(a.filter(x=>Number.isInteger(x)&&x>=1&&x<=10))].sort((p,q)=>p-q):[];return r.length?r:null;};
export function normTemplate(o,now=0){
  const x=o&&typeof o==="object"&&!Array.isArray(o)?o:{};
  const units=Number.isInteger(x.units)?Math.min(UNIT_MAX,Math.max(UNIT_MIN,x.units)):3;
  let items=cleanItems(x.items);if(!items.length)items=["m3_1x1"];
  let plan=null;
  if(Array.isArray(x.plan)&&x.plan.length===units){
    const p=x.plan.map(cleanItems);
    if(p.every(l=>l.length))plan=p;
  }
  return{
    id:typeof x.id==="string"&&TPL_ID_RE.test(x.id)?x.id:"",
    name:String(x.name||"").replace(/[<>]/g,"").trim().slice(0,NAME_MAX)||"Trainingslager",
    items,rows:cleanRows(x.rows),zero:x.zero===true||x.zero===false?x.zero:null,
    units,half:HALF_CHOICES.includes(x.half)?x.half:10,bonus:BONUS_KINDS.includes(x.bonus)?x.bonus:"penalty",plan,
    t:Number.isFinite(x.t)?x.t:now,del:x.del===true?true:undefined,builtin:x.builtin===true?true:undefined
  };
}
export const campIdOf=t=>CUSTOM_PREFIX+t.id;
export const isCustomId=id=>String(id).startsWith(CUSTOM_PREFIX);
export const tplIdOfCamp=id=>String(id).slice(CUSTOM_PREFIX.length);
// Die eingefrorene Beschreibung für das Konto (ohne Löschmarke und Mitgeliefert-Merkmal)
export const defOf=t=>{const d=normTemplate(t);delete d.del;delete d.builtin;return d;};

// ---------- Mitgelieferte Vorlagen (nur lesen, aber kopierbar) ----------
// "9er Reihe" nach Emils Hausaufgabe (ab 1.7.4): fünf Einheiten, je eine Aufgabenart, Nachspielzeit Elfmeterschießen, ausgeschaltet (die Eltern schalten sie je Konto ein).
// Teilen mit Rest ist ein fest eingebautes Lager (camp.js) und steht hier nicht.
export const BUILTIN_TEMPLATES=[
  {id:"b-9er",name:"9er Reihe",items:["kind:sacks","kind:chain","kind:wheel","kind:wheelback","kind:pack"],rows:[9],zero:null,units:5,half:5,bonus:"penalty",
    plan:[["kind:sacks"],["kind:chain"],["kind:wheel"],["kind:wheelback"],["kind:pack"]],t:0}
];

// ---------- Vorlagenliste im globalen Stand ----------
// g.templates: Liste {id, name, items, rows, zero, units, half, bonus, plan, t, del?}. Gelöschte bleiben als Löschmarke (del) stehen,
// damit das Löschen beim Abgleich auf allen Geräten ankommt.
export const templatesOf=g=>Array.isArray(g&&g.templates)?g.templates.filter(x=>x&&typeof x==="object"&&TPL_ID_RE.test(String(x.id))).map(x=>normTemplate(x)):[];
export const liveTemplates=g=>templatesOf(g).filter(t=>!t.del);
export const allTemplates=g=>BUILTIN_TEMPLATES.map(t=>Object.assign(normTemplate(t),{builtin:true})).concat(liveTemplates(g));
export const findTemplate=(g,id)=>allTemplates(g).find(t=>t.id===id)||null;
const stamp=(g,ctx)=>{g.updatedAt=ctx.now;};
function newId(taken){
  const ch="abcdefghijklmnopqrstuvwxyz0123456789";
  for(;;){let s="t-";for(let i=0;i<8;i++)s+=ch[Math.floor(Math.random()*ch.length)];if(!taken.has(s))return s;}
}
// Speichert eine Vorlage neu (id leer) oder ersetzt sie. Mitgelieferte lassen sich nicht ändern. Gibt die gespeicherte Vorlage zurück oder null.
export function saveTemplate(g,ctx,tpl){
  const list=templatesOf(g),n=normTemplate(tpl,ctx.now);
  if(BUILTIN_TEMPLATES.some(b=>b.id===n.id))return null;
  if(!n.id)n.id=newId(new Set(list.map(t=>t.id).concat(BUILTIN_TEMPLATES.map(b=>b.id))));
  n.t=ctx.now;delete n.del;delete n.builtin;
  const i=list.findIndex(t=>t.id===n.id);
  if(i>=0)list[i]=n;else list.push(n);
  g.templates=list;stamp(g,ctx);return n;
}
// Kopie für eine andere Reihe (ab 1.7.4): dieselbe Vorlage mit der gewählten Reihe, der Name passt sich an ("9er Reihe" wird "7er Reihe")
export function copyForRow(g,ctx,id,row){
  const src=findTemplate(g,id);if(!src||!Number.isInteger(row)||row<1||row>10)return null;
  const old=src.rows&&src.rows.length===1?src.rows[0]:null;
  const re=old!==null?new RegExp(`(^|\\s)${old}er(?=\\s|$)`):null;
  const name=re&&re.test(src.name)?src.name.replace(re,`$1${row}er`):`${src.name} (${row}er Reihe)`;
  const c=Object.assign(JSON.parse(JSON.stringify(defOf(src))),{id:"",name,rows:[row]});
  return saveTemplate(g,ctx,c);
}
// Kopie mit eigenem Namen (auch von einer mitgelieferten Vorlage)
export function copyTemplate(g,ctx,id,name){
  const src=findTemplate(g,id);if(!src)return null;
  const c=Object.assign(JSON.parse(JSON.stringify(defOf(src))),{id:"",name:String(name||src.name+" (Kopie)")});
  return saveTemplate(g,ctx,c);
}
export function renameTemplate(g,ctx,id,name){
  const t=liveTemplates(g).find(x=>x.id===id);if(!t)return null;
  return saveTemplate(g,ctx,Object.assign({},t,{name}));
}
// Löschen: bleibt als Löschmarke. Lager, die ein Konto schon begonnen hat, bleiben dort mit der eingefrorenen Beschreibung.
export function deleteTemplate(g,ctx,id){
  const list=templatesOf(g),i=list.findIndex(t=>t.id===id);if(i<0)return false;
  list[i]=Object.assign({},list[i],{del:true,t:ctx.now});g.templates=list;stamp(g,ctx);return true;
}

// ---------- Aufbau der Lager-Beschreibung (CAMPS-Eintrag) ----------
const unitItems=(def,n)=>def.plan?def.plan[n-1]:def.items;
export const isPackUnitDef=(def,n)=>{const l=unitItems(def,n);return !!l&&l.length===1&&l[0]===KIND_PREFIX+"pack";};
function unitTexts(def,n){
  const l=unitItems(def,n),names=l.map(itemName);
  const title=l.length===1?names[0]:`Einheit ${n}: Mix`;
  const text=l.length===1?(isPackUnitDef(def,n)?"Ein Päckchen pro Halbzeit. Kontrolliere es mit der Probe.":"Aufgaben zu diesem Thema."):"Aufgaben aus: "+names.join(", ")+".";
  return{n,title,text:text.length>110?text.slice(0,107)+"...":text};
}
// li: Liga des Kontos (für Verlauf und Statistik des Spiels)
export function buildCamp(def,li,id=campIdOf(def)){
  return{id,name:def.name,title:"Trainingslager: "+def.name,li,badge:"Profi: "+def.name,custom:true,def,half:def.half,bonus:def.bonus,
    packUnits:[...Array(def.units).keys()].map(i=>i+1).filter(n=>isPackUnitDef(def,n)),
    units:[...Array(def.units).keys()].map(i=>unitTexts(def,i+1))};
}

// ---------- Aufgaben ----------
// Eingeengte Grenze: Konto-Reihen und Vorlagen-Reihen schneiden sich (nie erweitern; ist der Schnitt leer, gilt die Grenze des Kontos),
// 0 nur, wenn das Konto es erlaubt und die Vorlage es nicht ausschaltet.
export function narrowedMul(def){
  const base=getMul(),rows=def.rows?base.rows.filter(r=>def.rows.includes(r)):base.rows;
  return{rows:rows.length?rows:base.rows,zero:base.zero&&def.zero!==false};
}
function withMul(def,fn){const base=getMul();setMul(narrowedMul(def));try{return fn();}finally{setMul(base);}}
const levelOf=(def,n)=>Math.min(3,Math.max(1,Math.ceil(n*3/def.units)));
// Eine Aufgabe zu einer Auswahl (Thema oder Reihen-Art)
function taskOfItem(id,level){
  if(isKind(id)){
    const k=kindOf(id);
    if(k==="pack")return Object.assign({topic:"m3_1x1"},pick(rowPackTasks()));
    return Object.assign({topic:"m3_1x1"},rowTask(k));
  }
  return Object.assign({topic:id},GEN[id](isEng(id)?{level}:undefined));
}
// Alle Auswahlen kommen in jeder Halbzeit vor (wenn genug Aufgaben da sind), danach mischt der Zufall, mit leichtem Schwerpunkt auf der Auswahl der Einheit.
function itemSequence(items,n,count){
  const out=shuffle(items).slice(0,count),focus=items[(n-1)%items.length];
  while(out.length<count)out.push(Math.random()<.4?focus:pick(items));
  return shuffle(out);
}
// Eine einzelne Aufgabe der Einheit n (für die Nachspielzeit-Mini-Spiele und zum Testen)
export const customTask=(def,n)=>withMul(def,()=>taskOfItem(pick(unitItems(def,n)),levelOf(def,n)));
// Eine Aufgabe, die noch nicht vorkam. Ist der Vorrat einer kleinen Auswahl erschöpft (zum Beispiel 16 Wörter bei i oder ie), kommt eine andere Auswahl dran.
function freshTask(id,items,lv,seen){
  for(const x of [id].concat(shuffle(items.filter(y=>y!==id)))){
    for(let tries=0;tries<(x===id?60:25);tries++){const c=taskOfItem(x,lv);if(!seen.has(keyOf(c)))return c;}
  }
  return taskOfItem(id,lv); // alles erschöpft: Fülltext, damit immer genug da sind
}
// Eine Halbzeit: def.half Aufgaben, untereinander verschieden (seen = schon benutzte Aufgaben der Einheit). Reine Päckchen-Einheit: ein Päckchen der Reihe.
export function customHalf(def,n,seen=new Set()){
  return withMul(def,()=>{
    const count=def.half;
    if(isPackUnitDef(def,n)){
      for(let tries=0;tries<30;tries++){
        const tasks=rowPackTasks(undefined,count).map(T=>Object.assign({topic:"m3_1x1"},T)); // so viele Aufgaben wie je Halbzeit eingestellt
        if(!tasks.some(T=>seen.has(keyOf(T)))||tries===29){tasks.forEach(T=>seen.add(keyOf(T)));return tasks;}
      }
    }
    const items=unitItems(def,n),out=[],plan=itemSequence(items,n,count),lv=levelOf(def,n);
    for(const id of plan){const T=freshTask(id,items,lv,seen);seen.add(keyOf(T));out.push(T);}
    return out;
  });
}
// Nachspielzeit Elfmeterschießen: PEN_N neue Aufgaben (nie dieselben wie in den Halbzeiten). Andere Nachspielzeiten brauchen hier keine Aufgaben.
export function customPen(def,n,seen=new Set()){
  if(def.bonus!=="penalty")return[];
  return withMul(def,()=>{
    const items=unitItems(def,n),lv=levelOf(def,n),out=[];
    while(out.length<PEN_N){const T=freshTask(pick(items),items,lv,seen);seen.add(keyOf(T));out.push(T);}
    return out;
  });
}
export {ALL_ROWS};

// ---------- Baukasten im Eltern-Bereich ----------
// Entwurf (so, wie die Eltern ihn bearbeiten) und Vorlage ineinander umwandeln
export const newDraft=()=>({id:"",name:"",items:["m3_1x1"],rows:[],zero:"inherit",units:3,half:10,bonus:"penalty",plan:null});
export const draftOf=t=>({id:t.id,name:t.name,items:t.items.slice(),rows:(t.rows||[]).slice(),zero:t.zero===false?"off":"inherit",units:t.units,half:t.half,bonus:t.bonus,plan:t.plan?t.plan.map(l=>l.slice()):null});
export const templateOfDraft=d=>({id:d.id,name:d.name,items:d.items,rows:d.rows&&d.rows.length?d.rows:null,zero:d.zero==="off"?false:null,units:d.units,half:d.half,bonus:d.bonus,plan:d.plan});
// Der Ablauf je Einheit (plan) passt nur zur Zahl der Einheiten und zu den Themen der Vorlage: ändern die Eltern das, gilt wieder "alle Einheiten mischen alles".
export const draftSummary=t=>`${t.units} ${t.units===1?"Einheit":"Einheiten"}, ${t.half} Aufgaben je Halbzeit, ${BONUS_NAMES[t.bonus]}${t.rows?`, Reihen ${t.rows.join(", ")}`:""}`;
// Alle Vorlagen für die Liste: Teilen mit Rest (fest eingebaut), mitgelieferte, eigene. campId = Schlüssel im Konto.
export const SPECIAL_ENTRY={id:"m3_rest",campId:"m3_rest",name:"Teilen mit Rest",builtin:true,special:true,summary:"5 Einheiten, je 2 Halbzeiten und Elfmeterschießen"};
export function entriesOf(g){
  return [SPECIAL_ENTRY].concat(allTemplates(g).map(t=>({id:t.id,campId:campIdOf(t),name:t.name,builtin:!!t.builtin,special:false,summary:draftSummary(t),half:t.half,rows1:t.rows&&t.rows.length===1?t.rows[0]:0})));
}
