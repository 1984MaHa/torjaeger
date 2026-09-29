// Torjäger-Liga: kleiner Server ohne Zusatzpakete.
// Liefert die App aus (app/) und speichert den Spielstand als JSON-Datei (DATA_DIR/state.json).
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 8080);
const APP_DIR = path.resolve(__dirname, "..", "app");
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, "..", "data"));
const STATE = path.join(DATA_DIR, "state.json");
const BACKUP_DIR = path.join(DATA_DIR, "backups");
const MAX_BODY = 2 * 1024 * 1024;
const KEEP_BACKUPS = 30;

fs.mkdirSync(BACKUP_DIR, { recursive: true });

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml",
  ".png": "image/png", ".ico": "image/x-icon", ".woff2": "font/woff2", ".ttf": "font/ttf", ".txt": "text/plain; charset=utf-8"
};

function readState() {
  try { return JSON.parse(fs.readFileSync(STATE, "utf8")); } catch (e) { return null; }
}

function writeState(doc) {
  const tmp = STATE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(doc));
  fs.renameSync(tmp, STATE);
  // Tagessicherung: eine Kopie pro Tag, die letzten KEEP_BACKUPS bleiben.
  const day = new Date().toISOString().slice(0, 10);
  fs.copyFileSync(STATE, path.join(BACKUP_DIR, "state-" + day + ".json"));
  const files = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith("state-")).sort();
  files.slice(0, Math.max(0, files.length - KEEP_BACKUPS)).forEach(f => fs.unlinkSync(path.join(BACKUP_DIR, f)));
}

function send(res, code, body, type) {
  res.writeHead(code, { "Content-Type": type || "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(typeof body === "string" ? body : JSON.stringify(body));
}

function api(req, res) {
  if (req.url === "/api/health") return send(res, 200, { ok: true, time: new Date().toISOString() });
  if (req.url !== "/api/state") return send(res, 404, { error: "not_found" });

  if (req.method === "GET") {
    const doc = readState();
    return send(res, 200, doc || { rev: 0, state: null });
  }
  if (req.method === "PUT") {
    let size = 0; const chunks = [];
    req.on("data", c => { size += c.length; if (size > MAX_BODY) { req.destroy(); } else chunks.push(c); });
    req.on("end", () => {
      let body;
      try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch (e) { return send(res, 400, { error: "bad_json" }); }
      const cur = readState() || { rev: 0, state: null };
      // Optimistische Sperre: Der Client schickt die Revision, auf der er aufbaut.
      if (typeof body.baseRev === "number" && body.baseRev !== cur.rev) {
        return send(res, 409, { error: "conflict", current: cur });
      }
      const next = { rev: cur.rev + 1, savedAt: new Date().toISOString(), device: String(body.device || ""), state: body.state };
      try { writeState(next); } catch (e) { return send(res, 500, { error: "write_failed" }); }
      return send(res, 200, { rev: next.rev, savedAt: next.savedAt });
    });
    return;
  }
  return send(res, 405, { error: "method_not_allowed" });
}

function staticFile(req, res) {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  const file = path.normalize(path.join(APP_DIR, p));
  if (!file.startsWith(APP_DIR)) return send(res, 403, "forbidden", "text/plain");
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, "Nicht gefunden", "text/plain; charset=utf-8");
    const ext = path.extname(file).toLowerCase();
    const noCache = ext === ".html" || path.basename(file) === "sw.js" || ext === ".webmanifest";
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream", "Cache-Control": noCache ? "no-cache" : "public, max-age=86400" });
    res.end(data);
  });
}

http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) return api(req, res);
  if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, "method_not_allowed", "text/plain");
  staticFile(req, res);
}).listen(PORT, () => console.log("Torjäger-Liga läuft auf Port " + PORT + ", Daten in " + DATA_DIR));
