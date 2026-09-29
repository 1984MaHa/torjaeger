// Lädt die Schriften Andika (400, 700) und Lilita One (400) einmalig als woff2 (Latin) nach app/fonts/
// und legt die OFL-Lizenztexte dazu. Nur nötig, wenn app/fonts/ leer ist: node tools/fetch-fonts.js
"use strict";
const fs = require("fs");
const path = require("path");
const OUT = path.join(__dirname, "..", "app", "fonts");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const CSS = "https://fonts.googleapis.com/css2?family=Andika:wght@400;700&family=Lilita+One&display=swap";
const WANT = [["Andika", "400", "andika-400.woff2"], ["Andika", "700", "andika-700.woff2"], ["Lilita One", "400", "lilita-one-400.woff2"]];
const LICENSES = [["Andika", "https://raw.githubusercontent.com/google/fonts/main/ofl/andika/OFL.txt"], ["Lilita One", "https://raw.githubusercontent.com/google/fonts/main/ofl/lilitaone/OFL.txt"]];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const css = await (await fetch(CSS, { headers: { "User-Agent": UA } })).text();
  const blocks = [...css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g)];
  for (const [family, weight, file] of WANT) {
    const b = blocks.find(x => x[1] === "latin" && x[2].includes(`'${family}'`) && x[2].includes("font-weight: " + weight + ";"));
    if (!b) throw new Error("Kein Latin-Block für " + family + " " + weight);
    const url = /url\(([^)]+\.woff2)\)/.exec(b[2])[1];
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
    fs.writeFileSync(path.join(OUT, file), buf);
    console.log(file, buf.length, "Bytes");
  }
  let lic = "Die Schriften Andika und Lilita One stehen unter der SIL Open Font License 1.1.\nQuelle: https://github.com/google/fonts (Ordner ofl/andika und ofl/lilitaone)\n";
  for (const [name, url] of LICENSES) lic += "\n\n==================== " + name + " ====================\n\n" + await (await fetch(url)).text();
  fs.writeFileSync(path.join(OUT, "OFL.txt"), lic.replace(/\r\n/g, "\n"));
  console.log("OFL.txt geschrieben");
})().catch(e => { console.error("Fehler:", e.message); process.exit(1); });
