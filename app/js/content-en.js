// Inhalte Englisch (Kreisliga, Klasse 3). Reine Daten, keine Logik.
// Wort: [englisch, deutsch, Bild, falsche Schreibweise 1, falsche Schreibweise 2].
// Bild: Emoji (Unicode bis 13), "#rrggbb" für einen Farbkasten oder "#7" für eine große Ziffer (Zahlen).
// Falsche Schreibweisen sind keine echten englischen Wörter (ein Test prüft sie gegen die Wortliste).
// Unsicher markierte Bilder stehen in UNSURE und in docs/Inhalte-Englisch-Sachkunde.md.
export const EN_TOPICS={
  en_farben:{name:"Farben",words:[
    ["red","rot","#e53935","redd","raed"],["blue","blau","#1e66d0","blou","bloo"],["green","grün","#2e9e44","grean","gren"],
    ["yellow","gelb","#f9d71c","yelow","yellou"],["orange","orange","#f28c28","orenge","oranje"],["pink","rosa","#f48fb1","pinc","pynk"],
    ["purple","lila","#8e44ad","purpel","perple"],["brown","braun","#7b4a2d","broun","brawen"],["black","schwarz","#222222","blak","blakc"],
    ["white","weiß","#ffffff","wite","whyte"],["grey","grau","#9e9e9e","grai","greay"]]},
  en_zahlen:{name:"Zahlen 0 bis 12",words:[
    ["zero","null","#0","zeru","zeroh"],["one","eins","#1","wun","oan"],["two","zwei","#2","twu","towo"],["three","drei","#3","thre","threee"],
    ["four","vier","#4","foure","fuor"],["five","fünf","#5","fiev","fyve"],["six","sechs","#6","sikx","sixe"],["seven","sieben","#7","sevven","sevan"],
    ["eight","acht","#8","eigth","eihgt"],["nine","neun","#9","nyne","nien"],["ten","zehn","#10","tenn","tehn"],["eleven","elf","#11","elleven","eleavn"],
    ["twelve","zwölf","#12","twelv","twelfe"]]},
  en_koerper:{name:"Körper",words:[
    ["eye","Auge","\u{1F441}️","eyi","eey"],["ear","Ohr","\u{1F442}","eer","eare"],["nose","Nase","\u{1F443}","noze","nos"],["mouth","Mund","\u{1F444}","mouf","mowth"],
    ["hand","Hand","✋","hend","handd"],["foot","Fuß","\u{1F9B6}","fut","foott"],["arm","Arm","\u{1F4AA}","aarm","arrm"],["leg","Bein","\u{1F9B5}","lek","legg"],
    ["tooth","Zahn","\u{1F9B7}","tuth","toothe"],["tongue","Zunge","\u{1F445}","tung","tonge"],["brain","Gehirn","\u{1F9E0}","braen","brayn"]]},
  en_kleidung:{name:"Kleidung",words:[
    ["T-shirt","T-Shirt","\u{1F455}","T-shurt","T-shirte"],["trousers","lange Hose","\u{1F456}","trowsers","trousirs"],["dress","Kleid","\u{1F457}","dres","dresss"],
    ["shoes","Schuhe","\u{1F45F}","shues","shoez"],["socks","Socken","\u{1F9E6}","sokks","sockz"],["cap","Kappe","\u{1F9E2}","kap","capp"],
    ["coat","Mantel","\u{1F9E5}","cote","koat"],["scarf","Schal","\u{1F9E3}","scharf","skarf"],["gloves","Handschuhe","\u{1F9E4}","glovs","gluves"],
    ["shorts","kurze Hose","\u{1FA73}","shorz","schorts"],["glasses","Brille","\u{1F453}","glases","glasess"],["boots","Stiefel","\u{1F97E}","buuts","bootz"]]},
  en_familie:{name:"Familie",words:[
    ["mother","Mutter","\u{1F469}","mothur","mudder"],["father","Vater","\u{1F468}","fahter","fathur"],["sister","Schwester","\u{1F467}","sistar","sisster"],
    ["brother","Bruder","\u{1F466}","bruther","brothar"],["baby","Baby","\u{1F476}","baiby","bayby"],["grandmother","Oma","\u{1F475}","grandmuther","granmother"],
    ["grandfather","Opa","\u{1F474}","grandfahter","granfather"],["family","Familie","\u{1F46A}","famly","familly"],["friend","Freund","\u{1F9D1}‍\u{1F91D}‍\u{1F9D1}","freind","frend"],
    ["home","Zuhause","\u{1F3E0}","hoem","hom"]]},
  en_schule:{name:"Schulsachen",words:[
    ["book","Buch","\u{1F4D5}","buk","boock"],["pencil","Bleistift","✏️","pensil","pencel"],["pen","Stift","\u{1F58A}️","penn","pehn"],
    ["ruler","Lineal","\u{1F4CF}","rooler","rular"],["scissors","Schere","✂️","sissors","scisors"],["bag","Schultasche","\u{1F392}","bagg","beg"],
    ["school","Schule","\u{1F3EB}","skool","schol"],["teacher","Lehrer","\u{1F9D1}‍\u{1F3EB}","teecher","techer"],["computer","Computer","\u{1F4BB}","computa","compooter"],
    ["paper","Papier","\u{1F4C4}","paiper","pappa"]]},
  en_essen:{name:"Essen und Trinken",words:[
    ["apple","Apfel","\u{1F34E}","appel","aple"],["banana","Banane","\u{1F34C}","bananna","banena"],["bread","Brot","\u{1F35E}","bredd","braed"],
    ["cheese","Käse","\u{1F9C0}","chease","cheeze"],["egg","Ei","\u{1F95A}","eg","eeg"],["milk","Milch","\u{1F95B}","melk","milc"],
    ["juice","Saft","\u{1F9C3}","joos","juise"],["pizza","Pizza","\u{1F355}","pitza","pizzah"],["cake","Kuchen","\u{1F370}","caik","kake"],
    ["chocolate","Schokolade","\u{1F36B}","chokolate","chocolat"],["tomato","Tomate","\u{1F345}","tomatoe","tomahto"],["carrot","Möhre","\u{1F955}","carrott","karrot"]]},
  en_tiere:{name:"Tiere",words:[
    ["dog","Hund","\u{1F436}","dok","dogg"],["cat","Katze","\u{1F431}","kat","catt"],["horse","Pferd","\u{1F434}","hors","horce"],["cow","Kuh","\u{1F42E}","kow","couw"],
    ["pig","Schwein","\u{1F437}","pigg","pik"],["sheep","Schaf","\u{1F411}","sheap","shep"],["bird","Vogel","\u{1F426}","burd","berd"],["fish","Fisch","\u{1F41F}","fich","fisch"],
    ["rabbit","Kaninchen","\u{1F430}","rabit","rabbitt"],["mouse","Maus","\u{1F42D}","mous","mowse"],["duck","Ente","\u{1F986}","duk","dack"],["frog","Frosch","\u{1F438}","frogg","frok"],
    ["elephant","Elefant","\u{1F418}","elefant","elephent"],["lion","Löwe","\u{1F981}","lyon","liown"]]},
  en_hobbys:{name:"Hobbys",words:[
    ["football","Fußball","⚽","futball","footbal"],["basketball","Basketball","\u{1F3C0}","basketbal","baskitball"],["tennis","Tennis","\u{1F3BE}","tenis","tennes"],
    ["swimming","Schwimmen","\u{1F3CA}","swiming","swimmin"],["bike","Fahrrad","\u{1F6B2}","baik","byke"],["guitar","Gitarre","\u{1F3B8}","gitar","guiter"],
    ["music","Musik","\u{1F3B5}","musik","muzic"],["painting","Malen","\u{1F3A8}","paiting","paintin"],["dancing","Tanzen","\u{1F483}","dansing","dancin"],
    ["game","Videospiel","\u{1F3AE}","gaim","gayme"]]},
  en_wetter:{name:"Wetter und Jahreszeiten",words:[
    ["sun","Sonne","☀️","sunn","sunne"],["rain","Regen","\u{1F327}️","rayn","rane"],["snow","Schnee","❄️","snoe","snou"],["cloud","Wolke","☁️","clowd","claud"],
    ["wind","Wind","\u{1F4A8}","wynd","wint"],["storm","Gewitter","⛈️","stoorm","starm"],["rainbow","Regenbogen","\u{1F308}","raynbow","rainbo"],
    ["spring","Frühling","\u{1F337}","spriing","spreng"],["summer","Sommer","\u{1F3D6}️","sumer","summar"],["autumn","Herbst","\u{1F342}","autum","awtumn"],
    ["winter","Winter","⛄","vinter","wintar"],["hot","heiß","\u{1F975}","hott","hoat"],["cold","kalt","\u{1F976}","coald","kold"]]}
};
// Bilder, bei denen die Zuordnung nicht ganz eindeutig ist (Marco prüft sie).
export const UNSURE={mother:"Frau-Symbol steht für Mutter",father:"Mann-Symbol steht für Vater",sister:"Mädchen-Symbol",brother:"Jungen-Symbol",friend:"zwei Personen halten Hände",
  home:"Haus-Symbol steht für Zuhause",arm:"Muskelarm",spring:"Tulpe steht für Frühling",summer:"Strand steht für Sommer",autumn:"Herbstlaub",winter:"Schneemann steht für Winter",
  hot:"Gesicht mit Hitze",cold:"Gesicht mit Kälte",storm:"Gewitterwolke",game:"Spielcontroller",painting:"Farbpalette",music:"Note",teacher:"Person an der Tafel"};
