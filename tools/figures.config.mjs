// Regeln der Bild-Aufbereitung je Quelle und Figur. Koordinaten sind Punkte im Originalbild.
// bust (Fenster des Brustbildes) und field (Rückenfeld für Name und Nummer) sind Bildpunkte der fertigen Figur (links oben = 0/0).
// chest: kleine Nummer auf der Brust, Mitte und Grundlinie in Punkten des Originalbildes (dort, wo das Logo übermalt wurde).
// Ein Bereich ist eine Funktion ctx => Maske. Die erste Regel gewinnt, wenn sich Bereiche überlappen.
import * as L from "./fig-lib.mjs";

const blue=(r,g,b)=>b-r>35&&b-g>15;                                  // Trikotblau und dunkles Blau der Ärmelbündchen
const darkNeutral=(r,g,b)=>L.lumOf(r,g,b)<95&&Math.abs(b-r)<34;    // schwarze Hose und Stutzen (auch Linien)
const whitish=(r,g,b)=>L.lumOf(r,g,b)>150&&Math.max(r,g,b)-Math.min(r,g,b)<45;

// Hose oder Stutzen: dunkle Fläche um einen Startpunkt, innen verkleinert, damit die Kontur im Grundbild bleibt
const darkArea=(seed,rect,erodeBy=3)=>ctx=>{
  const m=L.box(ctx.f,L.maskOf(ctx.f,darkNeutral),rect);
  return L.erode(ctx.f,L.flood(ctx.f,m,[seed]),erodeBy);
};

const DBG=[[0,{}],
  [1,{trikot:[200,40,40],streifen:[250,220,60],hose:[250,250,250],stutzen:[60,160,70]}],
  [2,{trikot:[250,250,250],streifen:[30,30,120],hose:[30,30,120],stutzen:[250,250,250]}]];

function emil(view,o){
  return{id:"emil-"+view,use:true,view,debugColors:DBG,holes:o.holes,bust:o.bust,field:o.field,chest:o.chest,logo:o.logo,
    regions:[
      {id:"streifen",label:"Streifen",mask:ctx=>{ // weiße Streifen an Schultern und Ärmeln (ohne das Logo)
        const m=L.box(ctx.f,L.maskOf(ctx.f,whitish),o.stripeBox);
        return o.logoBox?L.andNot(m,L.dilate(ctx.f,L.box(ctx.f,m,o.logoBox),3)):m;}},
      {id:"trikot",label:"Trikot",flat:o.logoBox?[o.logoBox]:[],mask:ctx=>{
        let m=L.box(ctx.f,L.maskOf(ctx.f,blue),o.shirtBox);
        if(o.logoBox)m=L.or(m,L.dilate(ctx.f,L.box(ctx.f,L.maskOf(ctx.f,whitish),o.logoBox),3)); // Markenlogo wird übermalt
        return m;}},
      {id:"hose",label:"Hose",mask:darkArea(o.shortsSeed,o.shortsBox)},
      {id:"stutzen",label:"Stutzen",flat:o.sockFlat||[],mask:ctx=>L.or(darkArea(o.sockSeeds[0],o.sockBox)(ctx),darkArea(o.sockSeeds[1],o.sockBox)(ctx))}
    ]};
}

// Trainerteam: Polo (dunkelblau), Hose und Stutzen (schwarz). Hose und Stutzen sind fast neutral, das Polo hat einen Blaustich.
const DBG_T=[[0,{}],[1,{polo:[200,40,40],hose:[240,240,240],stutzen:[60,160,70]}],[2,{polo:[250,200,50],hose:[40,60,150],stutzen:[250,250,250]}]];
const poloT=(r,g,b)=>b-r>=11&&b-g>=5&&L.lumOf(r,g,b)<140;
const darkT=(r,g,b)=>L.lumOf(r,g,b)<100&&b-r<11&&b-r>-8;
function coach(id,view,o={}){
  const area=(rect,test,er,cl=3)=>ctx=>L.erode(ctx.f,L.close(ctx.f,L.box(ctx.f,L.maskOf(ctx.f,test),rect),cl),er);
  return{id,use:true,view,debugColors:DBG_T,holes:o.holes,bust:o.bust,chest:o.chest,field:o.field,regions:[
    {id:"polo",label:"Polo",mask:area([0,165,900,400],poloT,0)},
    {id:"hose",label:"Hose",mask:area([0,355,900,470],darkT,1)},
    {id:"stutzen",label:"Stutzen",mask:area([0,462,900,560],darkT,1)}
  ]};
}

export default{sources:[
  {key:"emil",jpg:"assets-src/emil-avatar.jpg",ink:[43,31,30],bgLum:255,
    bgTest:(r,g,b)=>r>=236&&g>=236&&b>=232&&Math.max(r,g,b)-Math.min(r,g,b)<16,
    figures:[
      emil("front",{bust:[-20,-6,402,416],chest:{cx:173,y:512,size:88,width:104},logo:[138,456,208,508],holes:[[352,708]],stripeBox:[0,360,460,640],shirtBox:[0,355,460,800],logoBox:[138,456,208,508],shortsSeed:[230,830],shortsBox:[90,750,400,930],
        sockSeeds:[[165,1040],[305,1040]],sockBox:[100,950,400,1130],sockFlat:[[133,1004,184,1042],[286,1006,337,1042]]}),
      emil("back",{field:{x0:108,x1:276,y0:372,y1:655},holes:[[561,722],[801,719]],stripeBox:[456,370,896,640],shirtBox:[456,360,896,800],shortsSeed:[600,840],shortsBox:[540,760,850,930],
        sockSeeds:[[610,1050],[750,1050]],sockBox:[540,950,850,1140]})
    ]},
  {key:"team",jpg:"assets-src/trainer-team.jpg",ink:[44,33,32],bgLum:229,
    bgTest:(r,g,b)=>L.lumOf(r,g,b)>165&&Math.max(r,g,b)-Math.min(r,g,b)<16,
    figures:[coach("trainerin-front","front",{bust:[-14,-4,206,216],chest:{cx:60,y:252,size:14,width:52,local:true},holes:[[190,362],[77,363]]}),coach("trainerin-back","back",{field:{x0:55,x1:140,y0:176,y1:236}}),coach("trainer-front","front",{bust:[-14,-4,222,232],chest:{cx:66,y:250,size:14,width:56,local:true}}),coach("trainer-back","back",{field:{x0:58,x1:150,y0:180,y1:240}})]}
]};
