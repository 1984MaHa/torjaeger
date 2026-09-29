// Erzeugt die App-Icons (Fußball auf Rasen) ohne Zusatzpakete: node tools/make-icons.js
// Ausgabe: app/icons/icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png (180)
"use strict";
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const OUT = path.join(__dirname, "..", "app", "icons");
const GREEN = [29, 115, 55], GREEN2 = [33, 128, 64], INK = [22, 39, 28], WHITE = [255, 255, 255];
const PENTA = [[20, 12], [27, 17], [24.5, 25], [15.5, 25], [13, 17]];
const SEAMS = [[[20, 12], [20, 3]], [[27, 17], [36, 14]], [[24.5, 25], [30, 33]], [[15.5, 25], [10, 33]], [[13, 17], [4, 14]]];

function inPoly(p, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) c = !c;
  }
  return c;
}
function distSeg(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}
// Farbe an einem Punkt (x, y in 0..1). ballR = Radius des Balls in 0..1.
function colorAt(x, y, ballR) {
  const u = 20 + (x - 0.5) * (19.25 / ballR), v = 20 + (y - 0.5) * (19.25 / ballR);
  const p = [u, v], d = Math.hypot(u - 20, v - 20);
  if (d <= 19.25) {
    if (d >= 16.75) return INK;
    if (inPoly(p, PENTA)) return INK;
    if (SEAMS.some(s => distSeg(p, s[0], s[1]) <= 1.25)) return INK;
    return WHITE;
  }
  return Math.floor(x * 8) % 2 ? GREEN2 : GREEN;
}
function render(size, ballR) {
  const SS = 3, raw = Buffer.alloc((size * 3 + 1) * size);
  for (let py = 0; py < size; py++) {
    raw[py * (size * 3 + 1)] = 0;
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const c = colorAt((px + (sx + .5) / SS) / size, (py + (sy + .5) / SS) / size, ballR);
        r += c[0]; g += c[1]; b += c[2];
      }
      const o = py * (size * 3 + 1) + 1 + px * 3, n = SS * SS;
      raw[o] = Math.round(r / n); raw[o + 1] = Math.round(g / n); raw[o + 2] = Math.round(b / n);
    }
  }
  return png(size, raw);
}
const CRC = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = buf => { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, raw) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "icon-192.png"), render(192, 0.36));
fs.writeFileSync(path.join(OUT, "icon-512.png"), render(512, 0.36));
fs.writeFileSync(path.join(OUT, "icon-maskable-512.png"), render(512, 0.26)); // Ball in der sicheren Zone (80 %)
fs.writeFileSync(path.join(OUT, "apple-touch-icon.png"), render(180, 0.36));
console.log("Icons geschrieben nach", OUT);
