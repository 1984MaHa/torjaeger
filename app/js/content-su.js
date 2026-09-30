// Inhalte Sachkunde (Kreisliga, Klasse 3, Lehrplan Sachsen Sachunterricht). Reine Daten, keine Logik.
// Aufgabenarten (k):
//  match  pairs [[links, rechts]], n [min,max] Paare; lk = Art der linken Seite: "txt" (Vorgabe), "emo" (großes Emoji), "col" (Farbkasten)
//  sort   baskets [Korbnamen], cards [[Karte, Korbnummer]], n [min,max] Karten (jeder Korb bekommt mindestens eine)
//  order  steps [Schritte in richtiger Reihenfolge], win [min,max] Anzahl aufeinanderfolgender Schritte
//  choice right, wrong [falsche Antworten]
//  pic    tiles [[Emoji, Name]], right = Nummer der richtigen Kachel
//  rose   Kompassrose mit Pfeil (Himmelsrichtung ablesen)
// late (Thema oder Aufgabe): Stoff war in der Schule vielleicht noch nicht dran. Kommt seltener dran, eine falsche Antwort zählt nicht.
// hint verrät die Lösung nie, ex erklärt sie nach der Antwort. unsure: Marco soll besonders prüfen.
export const SU_TOPICS={
  su_sinne:{name:"Sinne und Sinnesorgane",tasks:[
    {k:"match",q:"Welches Sinnesorgan gehört zu welchem Sinn?",pairs:[["Augen","sehen"],["Ohren","hören"],["Nase","riechen"],["Zunge","schmecken"],["Haut","fühlen"]],n:[4,5],
      hint:"Überlege bei jedem Sinnesorgan: Was kannst du damit wahrnehmen?",ex:"Mit den Augen sehen wir, mit den Ohren hören wir, mit der Nase riechen wir, mit der Zunge schmecken wir und mit der Haut fühlen wir."},
    {k:"match",q:"Was nimmst du womit wahr? Ordne zu.",pairs:[["Ein Vogel singt.","hören"],["Eine Blume duftet.","riechen"],["Eine Zitrone ist sauer.","schmecken"],["Die Herdplatte ist heiß.","fühlen"],["Ein Regenbogen leuchtet.","sehen"]],n:[4,5],
      hint:"Denke an das Sinnesorgan, das du dafür brauchst.",ex:"Singen hörst du, Duft riechst du, sauer schmeckst du, Hitze fühlst du und Farben siehst du."},
    {k:"sort",q:"Schützt das die Sinne oder schadet es ihnen?",baskets:["Schützt","Schadet"],cards:[["Sonnenbrille bei grellem Licht",0],["Ohrenschutz bei sehr lauter Musik",0],["Nicht direkt in die Sonne schauen",0],["Handschuhe bei Frost",0],
      ["Mit der Taschenlampe in die Augen leuchten",1],["Kopfhörer ganz laut stellen",1],["Stäbchen tief ins Ohr stecken",1],["Die Hand auf die heiße Herdplatte legen",1]],n:[6,8],
      hint:"Frage dich: Tut es dem Sinnesorgan gut oder kann es wehtun?",ex:"Brille, Ohrenschutz und Handschuhe schützen. Grelles Licht, sehr laute Töne und spitze Dinge im Ohr schaden."},
    {k:"pic",q:"Womit hörst du? Tippe auf das Sinnesorgan.",tiles:[["\u{1F442}","Ohr"],["\u{1F441}️","Auge"],["\u{1F443}","Nase"],["\u{1F445}","Zunge"]],right:0,
      hint:"Stell dir vor, jemand ruft dich. Womit nimmst du es wahr?",ex:"Mit den Ohren hören wir."},
    {k:"pic",q:"Womit riechst du? Tippe auf das Sinnesorgan.",tiles:[["\u{1F443}","Nase"],["\u{1F442}","Ohr"],["\u{1F441}️","Auge"],["\u{1F445}","Zunge"]],right:0,
      hint:"Denke an den Duft von frischem Brot.",ex:"Mit der Nase riechen wir."},
    {k:"choice",q:"Was schützt deine Augen bei sehr hellem Sonnenlicht?",right:"Eine Sonnenbrille",wrong:["Ein Schal","Ohrenschutz","Handschuhe"],
      hint:"Es wird getragen und macht das Licht weniger hell.",ex:"Eine Sonnenbrille macht das Licht für die Augen weicher."}]},
  su_tiere:{name:"Pflanzen, Tiere und Lebensräume",tasks:[
    {k:"match",q:"Welches Tier lebt wo? Ordne den Lebensraum zu.",pairs:[["\u{1F98C} Reh","Wald"],["\u{1F438} Frosch","Teich"],["\u{1F41D} Biene","Wiese"],["\u{1F994} Igel","Garten"],["\u{1F414} Huhn","Bauernhof"]],n:[4,5],
      hint:"Überlege, wo das Tier Futter und ein Versteck findet.",ex:"Das Reh lebt im Wald, der Frosch am Teich, die Biene auf der Wiese, der Igel im Garten und das Huhn auf dem Bauernhof.",unsure:"Igel und Reh leben auch an anderen Orten, hier ist der typische Lebensraum gemeint."},
    {k:"sort",q:"Ist das eine Pflanze oder ein Tier?",baskets:["Pflanze","Tier"],cards:[["Eiche",0],["Rose",0],["Tulpe",0],["Löwenzahn",0],["Fichte",0],["Fuchs",1],["Igel",1],["Biene",1],["Frosch",1],["Specht",1]],n:[6,8],
      hint:"Pflanzen wachsen an einem Ort fest. Tiere können sich selbst fortbewegen.",ex:"Eiche, Rose, Tulpe, Löwenzahn und Fichte sind Pflanzen. Fuchs, Igel, Biene, Frosch und Specht sind Tiere."},
    {k:"sort",q:"In welchen Lebensraum gehört das?",baskets:["Wald","Wiese","Teich"],cards:[["Fichte",0],["Reh",0],["Specht",0],["Fuchs",0],["Gänseblümchen",1],["Biene",1],["Schmetterling",1],["Hase",1],["Frosch",2],["Seerose",2],["Ente",2],["Libelle",2]],n:[6,8],
      hint:"Überlege, wo du das Tier oder die Pflanze meistens findest.",ex:"Fichte, Reh, Specht und Fuchs leben im Wald. Gänseblümchen, Biene, Schmetterling und Hase findest du auf der Wiese. Frosch, Seerose, Ente und Libelle gehören an den Teich.",unsure:"Hase und Fuchs kommen auch an anderen Orten vor."},
    {k:"choice",q:"Was braucht eine Pflanze zum Wachsen?",right:"Licht, Wasser und Nährstoffe aus dem Boden",wrong:["Nur Dunkelheit","Nur Zucker","Sand ohne Wasser"],
      hint:"Denke daran, was du einer Blume am Fenster gibst.",ex:"Pflanzen brauchen Licht, Wasser und Nährstoffe aus dem Boden."},
    {k:"pic",q:"Welches Tier lebt im Wasser?",tiles:[["\u{1F41F}","Fisch"],["\u{1F98C}","Reh"],["\u{1F414}","Huhn"],["\u{1F994}","Igel"]],right:0,
      hint:"Dieses Tier hat Flossen und atmet im Wasser.",ex:"Fische leben im Wasser."}]},
  su_getreide:{name:"Getreide",tasks:[
    {k:"match",q:"Welches Getreide hat welchen Fruchtstand?",pairs:[["Ähre","Weizen"],["Rispe","Hafer"],["Kolben","Mais"]],n:[3,3],
      hint:"Die Körner einer Ähre sitzen dicht an einer Achse. Ein Kolben ist dick und hat große Körner.",ex:"Weizen wächst in Ähren, Hafer in Rispen und Mais in Kolben."},
    {k:"match",q:"Was wird aus welchem Getreide gemacht?",pairs:[["Weizen","Brötchen"],["Hafer","Haferflocken"],["Mais","Popcorn"],["Reis","Milchreis"]],n:[3,4],
      hint:"Denke an das Frühstück und an den Kinoabend.",ex:"Aus Weizen backt man Brötchen, aus Hafer macht man Haferflocken, aus Mais Popcorn und aus Reis Milchreis."},
    {k:"order",q:"Vom Korn zum Brot. Bringe die Schritte in die richtige Reihenfolge.",steps:["Das Korn wird gesät.","Das Getreide wächst und reift.","Der Mähdrescher erntet das Getreide.","In der Mühle wird das Korn zu Mehl gemahlen.","Der Bäcker backt aus dem Mehl Brot."],win:[4,5],
      hint:"Erst muss etwas wachsen, dann wird geerntet, dann verarbeitet.",ex:"Das Korn wird gesät, es wächst, der Mähdrescher erntet es, die Mühle mahlt Mehl und der Bäcker backt Brot."},
    {k:"choice",q:"Wie heißt der Fruchtstand beim Mais?",right:"Kolben",wrong:["Ähre","Rispe","Zapfen"],
      hint:"Er ist dick und länglich und sitzt seitlich am Stängel.",ex:"Beim Mais sitzen die Körner an einem Kolben."},
    {k:"choice",q:"Wo wird aus Körnern Mehl gemahlen?",right:"In der Mühle",wrong:["In der Molkerei","Im Kuhstall","In der Gärtnerei"],
      hint:"Früher trieb oft Wasser oder Wind ein großes Rad an.",ex:"In der Mühle werden die Körner zu Mehl gemahlen."}]},
  su_kartoffel:{name:"Kartoffel",tasks:[
    {k:"match",q:"Welcher Teil der Kartoffelpflanze ist das?",pairs:[["Knolle","wächst unter der Erde und wird gegessen"],["Kraut","grüne Blätter und Stängel über der Erde"],["Wurzel","nimmt Wasser aus dem Boden auf"]],n:[3,3],
      hint:"Überlege: Was sieht man über der Erde, was liegt darunter?",ex:"Die Knolle ist der essbare Teil unter der Erde. Das Kraut wächst oben. Die Wurzeln holen Wasser aus dem Boden."},
    {k:"order",q:"Von der Pflanzkartoffel bis zur Ernte. Bringe die Schritte in die richtige Reihenfolge.",steps:["Im Frühjahr werden Kartoffeln in die Erde gelegt.","Die Pflanze wächst und wird angehäufelt.","Die Pflanze blüht.","Das Kraut welkt und wird braun.","Die Kartoffeln werden geerntet."],win:[4,5],
      hint:"Denke an die Jahreszeiten: Frühling, Sommer, Herbst.",ex:"Kartoffeln werden im Frühjahr gelegt, sie wachsen, blühen, das Kraut welkt und im Herbst wird geerntet."},
    {k:"sort",q:"Wo wächst der Teil der Kartoffelpflanze?",baskets:["Über der Erde","Unter der Erde"],cards:[["Blüte",0],["Kraut",0],["Stängel",0],["Blätter",0],["Knolle",1],["Wurzel",1]],n:[5,6],
      hint:"Was siehst du, wenn du die Pflanze im Beet anschaust? Was musst du ausgraben?",ex:"Blüte, Kraut, Stängel und Blätter wachsen über der Erde. Knolle und Wurzel liegen unter der Erde."},
    {k:"choice",q:"Wie heißt der essbare Teil der Kartoffel?",right:"Knolle",wrong:["Ähre","Rispe","Schote"],
      hint:"Er wächst verdickt im Boden und speichert Nährstoffe.",ex:"Die Kartoffel ist eine Knolle."},
    {k:"choice",q:"Wann werden Kartoffeln bei uns meistens geerntet?",right:"Im Herbst",wrong:["Im Frühling","Mitten im Winter","Im Dezember"],
      hint:"Das Kraut ist dann schon verwelkt.",ex:"Die Kartoffelernte ist im Spätsommer und im Herbst."}]},
  su_wasser:{name:"Wasser",tasks:[
    {k:"sort",q:"In welchem Zustand ist das Wasser?",baskets:["fest","flüssig","gasförmig"],cards:[["Eis",0],["Eiswürfel",0],["Schnee",0],["Hagel",0],["Regen",1],["Pfütze",1],["Tautropfen",1],["Flusswasser",1],["Wasserdampf",2]],n:[6,8],
      hint:"Fest kannst du anfassen und es bleibt in Form. Flüssig fließt. Gasförmig ist unsichtbar.",ex:"Eis, Schnee und Hagel sind fest. Regen, Pfützen und Tau sind flüssig. Wasserdampf ist ein Gas.",need:[2]},
    {k:"order",q:"Der Wasserkreislauf. Bringe die Schritte in die richtige Reihenfolge.",steps:["Die Sonne erwärmt das Wasser, es verdunstet.","Der Wasserdampf steigt auf und kühlt ab.","Es entstehen Wolken.","Es regnet oder schneit.","Das Wasser fließt in Bäche, Flüsse und Meere."],win:[4,5],
      hint:"Beginne dort, wo die Sonne das Wasser wärmt. Was passiert dann?",ex:"Wasser verdunstet, steigt auf, kühlt ab, bildet Wolken, fällt als Regen oder Schnee und fließt zurück ins Meer."},
    {k:"sort",q:"Spart das Wasser oder verschwendet es Wasser?",baskets:["Spart Wasser","Verschwendet Wasser"],cards:[["Duschen statt Vollbad",0],["Beim Zähneputzen den Hahn zudrehen",0],["Regenwasser zum Gießen sammeln",0],["Tropfenden Wasserhahn reparieren",0],
      ["Beim Zähneputzen das Wasser laufen lassen",1],["Das Auto jeden Tag mit dem Schlauch waschen",1],["Den Hahn ohne Grund laufen lassen",1],["Die Toilettenspülung immer wieder drücken",1]],n:[6,8],
      hint:"Frage dich: Wird dabei viel oder wenig Wasser gebraucht?",ex:"Duschen, Hahn zudrehen, Regenwasser nutzen und Tropfen reparieren sparen Wasser. Wasser laufen lassen verschwendet es."},
    {k:"match",q:"Wie verändert sich das Wasser?",pairs:[["gefrieren","Wasser wird zu Eis"],["schmelzen","Eis wird zu Wasser"],["verdunsten","Wasser wird zu Wasserdampf"],["kondensieren","Wasserdampf wird wieder flüssig"]],n:[3,4],
      hint:"Überlege bei jedem Wort: Wird es wärmer oder kälter?",ex:"Gefrieren: Wasser wird zu Eis. Schmelzen: Eis wird zu Wasser. Verdunsten: Wasser wird zu Dampf. Kondensieren: Dampf wird wieder flüssig."},
    {k:"choice",q:"Bei wie viel Grad Celsius gefriert Wasser?",right:"0 Grad",wrong:["10 Grad","50 Grad","100 Grad"],
      hint:"Es ist der Punkt, an dem draußen im Winter Pfützen zu Eis werden.",ex:"Wasser gefriert bei 0 Grad Celsius. Bei 100 Grad kocht es."}]},
  su_himmel:{name:"Himmelsrichtungen und Karte",late:true,tasks:[
    {k:"rose",q:"Der rote Pfeil zeigt in eine Himmelsrichtung. Welche ist es?",
      hint:"Lies die Buchstaben an der Kompassrose. Oben steht N, die Buchstaben gehen im Uhrzeigersinn weiter.",ex:"Der Pfeil zeigt dorthin, wo der Buchstabe an der Kompassrose steht."},
    {k:"compass"},
    {k:"choice",q:"In welcher Himmelsrichtung geht die Sonne auf?",right:"Osten",wrong:["Westen","Süden","Norden"],
      hint:"Denke an den Morgen. Von wo kommt das erste Licht? Am Abend geht die Sonne auf der Gegenseite unter.",ex:"Die Sonne geht im Osten auf und im Westen unter."},
    {k:"choice",q:"Wo steht die Sonne mittags bei uns am höchsten?",right:"Im Süden",wrong:["Im Norden","Im Osten","Im Westen"],
      hint:"Denke an die Mittagszeit und an den Schatten.",ex:"Bei uns steht die Sonne mittags im Süden am höchsten."},
    {k:"choice",q:"Wohin zeigt die Nadel eines Kompasses?",right:"Nach Norden",wrong:["Nach Süden","Zur Sonne","Nach Westen"],
      hint:"Die Nadel zeigt immer in dieselbe Richtung, egal wie du dich drehst.",ex:"Die Kompassnadel zeigt nach Norden."},
    {k:"match",q:"Was bedeutet dieses Zeichen auf der Karte?",lk:"emo",pairs:[["⛪","Kirche"],["\u{1F689}","Bahnhof"],["\u{1F3EB}","Schule"],["\u{1F3E5}","Krankenhaus"],["\u{1F3CA}","Schwimmbad"]],n:[4,5],
      hint:"Schau das Bild genau an. Was zeigt es?",ex:"Die Zeichen sind kleine Bilder für Orte: Kirche, Bahnhof, Schule, Krankenhaus und Schwimmbad.",unsure:"Echte Kartenzeichen sehen anders aus, hier stehen Emoji als Bild."},
    {k:"match",q:"Welche Farbe auf der Karte bedeutet was?",lk:"col",pairs:[["#3b82d6","Fluss oder See"],["#3f9b4a","Wald und Wiese"],["#8b5a2b","Berge"],["#e7d85c","Felder"]],n:[3,4],
      hint:"Denke an die Farben in der Natur.",ex:"Blau ist Wasser, Grün sind Wald und Wiese, Braun sind Berge und Gelb sind Felder.",unsure:"Kartenfarben unterscheiden sich je nach Karte (Schulatlas)."},
    {k:"choice",q:"Wie heißt die Erklärung der Zeichen am Rand einer Karte?",right:"Legende",wrong:["Überschrift","Stempel","Lineal"],
      hint:"Dort steht, was jedes Zeichen bedeutet.",ex:"Die Legende erklärt die Zeichen der Karte."}]},
  su_verkehr:{name:"Sicher im Straßenverkehr",tasks:[
    {k:"sort",q:"Ist das sicher oder gefährlich?",baskets:["Sicher","Gefährlich"],cards:[["Am Zebrastreifen anhalten und schauen",0],["Den Fahrradhelm aufsetzen",0],["Vor dem Abbiegen nach hinten schauen",0],["Helle Kleidung im Dunkeln tragen",0],
      ["Zwischen parkenden Autos hervorlaufen",1],["Bei Rot über die Straße rennen",1],["Mit dem Handy in der Hand Rad fahren",1],["Dem Ball auf die Straße nachlaufen",1]],n:[6,8],
      hint:"Frage dich: Kann mich ein Auto dabei übersehen?",ex:"Anhalten, schauen, Helm und helle Kleidung sind sicher. Hervorlaufen, bei Rot rennen, Handy beim Radeln und dem Ball nachlaufen sind gefährlich."},
    {k:"order",q:"So gehst du sicher über die Straße. Bringe die Schritte in die richtige Reihenfolge.",steps:["Am Bordstein stehen bleiben.","Nach links, nach rechts und noch einmal nach links schauen.","Warten, bis kein Auto mehr kommt.","Zügig geradeaus über die Straße gehen."],win:[4,4],
      hint:"Erst anhalten, dann schauen und warten, dann gehen.",ex:"Stehen bleiben, schauen, warten und dann zügig gehen, ohne zu rennen."},
    {k:"match",q:"Was bedeutet das Zeichen?",lk:"emo",pairs:[["\u{1F6D1}","Halt, anhalten"],["\u{1F6B8}","Hier können Kinder über die Straße laufen"],["\u{1F6A6}","Sie zeigt Rot, Gelb oder Grün"],["\u{1F6B2}","Hier ist ein Weg für Fahrräder"]],n:[3,4],
      hint:"Schau genau auf das Bild und überlege, wo du es schon gesehen hast.",ex:"Das Stoppschild heißt anhalten, das Kinderzeichen warnt vor Kindern, die Ampel regelt den Verkehr und das Fahrrad zeigt einen Radweg.",unsure:"Emoji statt echter Verkehrszeichen."},
    {k:"choice",q:"Was bedeutet Rot an der Fußgängerampel?",right:"Stehen bleiben",wrong:["Losgehen","Schneller gehen","Langsam weitergehen"],
      hint:"Die Autos dürfen dann fahren.",ex:"Bei Rot bleibst du stehen und wartest auf Grün."},
    {k:"choice",q:"Wo überquerst du die Straße am besten?",right:"Am Zebrastreifen oder an der Ampel",wrong:["Hinter einem parkenden Bus","In der Kurve","Zwischen zwei Autos"],
      hint:"Dort werden dich die Autofahrer gut sehen und halten an.",ex:"Am Zebrastreifen oder an der Ampel bist du am besten zu sehen."},
    {k:"choice",q:"Was gehört beim Radfahren auf den Kopf?",right:"Ein Fahrradhelm",wrong:["Eine Mütze ohne Schutz","Ein Schal","Eine Sonnenbrille"],
      hint:"Er schützt bei einem Sturz den Kopf.",ex:"Ein Fahrradhelm schützt deinen Kopf, wenn du stürzt."}]}
};
