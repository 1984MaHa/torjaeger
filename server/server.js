// Torjäger-Liga: kleiner Server ohne Zusatzpakete (Node 20, nur Bordmittel).
// Liefert die App aus (app/) und speichert die Stände als JSON-Dateien:
//   DATA_DIR/profiles/<id>.json   ein Stand je Konto
//   DATA_DIR/settings.json        globale Einstellungen (Eltern-PIN)
//   DATA_DIR/backups/             Tagessicherungen (30 Tage) und Sicherungen vor jedem Deploy
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");

const MAX_BODY = 2 * 1024 * 1024;
const KEEP_BACKUPS = 30;
const ID_RE = /^[a-z0-9][a-z0-9-]{2,39}$/; // Konto-ID: streng, keine Punkte, keine Schrägstriche
const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml",
  ".png": "image/png", ".ico": "image/x-icon", ".woff2": "font/woff2", ".ttf": "font/ttf", ".txt": "text/plain; charset=utf-8"
};

function createServer(opts = {}) {
  const APP_DIR = path.resolve(opts.appDir || path.join(__dirname, "..", "app"));
  const DATA_DIR = path.resolve(opts.dataDir || process.env.DATA_DIR || path.join(__dirname, "..", "data"));
  const PROFILES = path.join(DATA_DIR, "profiles");
  const SETTINGS = path.join(DATA_DIR, "settings.json");
  const BACKUPS = path.join(DATA_DIR, "backups");
  fs.mkdirSync(PROFILES, { recursive: true });
  fs.mkdirSync(BACKUPS, { recursive: true });

  const profileFile = id => path.join(PROFILES, id + ".json");

  function readJson(file) {
    try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { return null; }
  }
  // Atomar schreiben (erst .tmp, dann umbenennen), danach die Tagessicherung auffrischen.
  function writeJson(file, doc, backupName) {
    const tmp = file + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(doc));
    fs.renameSync(tmp, file);
    const day = new Date().toISOString().slice(0, 10);
    fs.copyFileSync(file, path.join(BACKUPS, backupName + "-" + day + ".json"));
    const mine = fs.readdirSync(BACKUPS).filter(f => f.startsWith(backupName + "-") && f.endsWith(".json")
      && /^\d{4}-\d{2}-\d{2}\.json$/.test(f.slice(backupName.length + 1))).sort();
    mine.slice(0, Math.max(0, mine.length - KEEP_BACKUPS)).forEach(f => fs.unlinkSync(path.join(BACKUPS, f)));
  }

  function send(res, code, body, type) {
    res.writeHead(code, { "Content-Type": type || "application/json; charset=utf-8", "Cache-Control": "no-store" });
    res.end(typeof body === "string" ? body : JSON.stringify(body));
  }

  function readBody(req, res, cb) {
    let size = 0, dead = false; const chunks = [];
    req.on("data", c => {
      if (dead) return;
      size += c.length;
      if (size > MAX_BODY) { dead = true; send(res, 413, { error: "too_large" }); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => {
      if (dead) return;
      let body;
      try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch (e) { return send(res, 400, { error: "bad_json" }); }
      if (!body || typeof body !== "object" || Array.isArray(body)) return send(res, 400, { error: "bad_json" });
      cb(body);
    });
  }

  const isVersion = v => Number.isInteger(v) && v >= 1;
  const profileSchema = state => state && state.meta && state.meta.schemaVersion;

  // Gemeinsame PUT-Logik: Revisionsprüfung (409) und Schutz vor älteren Schemaversionen (409).
  function putDoc(res, cur, body, payload, schema, save) {
    if (!Number.isInteger(body.baseRev) || body.baseRev < 0) return send(res, 400, { error: "bad_base_rev" });
    if (!payload || typeof payload !== "object" || Array.isArray(payload) || !isVersion(schema)) return send(res, 400, { error: "bad_state" });
    if (isVersion(cur.schemaVersion) && schema < cur.schemaVersion) {
      return send(res, 409, { error: "conflict", reason: "schema_too_old", storedSchemaVersion: cur.schemaVersion });
    }
    if (body.baseRev !== cur.rev) return send(res, 409, { error: "conflict", reason: "rev", current: cur });
    const next = save(cur.rev + 1);
    return send(res, 200, { rev: next.rev, savedAt: next.savedAt });
  }

  function api(req, res) {
    let url;
    try { url = new URL(req.url, "http://x"); } catch (e) { return send(res, 400, { error: "bad_url" }); }
    const p = url.pathname.replace(/\/+$/, "");
    const m = req.method;

    if (p === "/api/health") return send(res, 200, { ok: true, time: new Date().toISOString() });

    if (p === "/api/settings") {
      const cur = readJson(SETTINGS) || { rev: 0, schemaVersion: null, settings: null };
      if (m === "GET") return send(res, 200, cur);
      if (m === "PUT") return readBody(req, res, body => putDoc(res, cur, body, body.settings, body.settings && body.settings.schemaVersion, rev => {
        const next = { rev, savedAt: new Date().toISOString(), device: String(body.device || ""), schemaVersion: body.settings.schemaVersion, settings: body.settings };
        writeJson(SETTINGS, next, "settings"); return next;
      }));
      return send(res, 405, { error: "method_not_allowed" });
    }

    if (p === "/api/profiles") {
      if (m === "GET") {
        const list = fs.readdirSync(PROFILES).filter(f => f.endsWith(".json")).map(f => readJson(path.join(PROFILES, f)))
          .filter(d => d && d.id).map(d => ({ id: d.id, name: d.name || "", rev: d.rev, savedAt: d.savedAt || null, schemaVersion: d.schemaVersion || null }))
          .sort((a, b) => a.name.localeCompare(b.name, "de") || a.id.localeCompare(b.id));
        return send(res, 200, { profiles: list });
      }
      if (m === "POST") return readBody(req, res, body => {
        const name = typeof body.name === "string" ? body.name.trim().slice(0, 40) : "";
        if (!name) return send(res, 400, { error: "bad_name" });
        let id = body.id;
        if (id === undefined) { do { id = "k-" + Math.random().toString(36).slice(2, 10); } while (!ID_RE.test(id) || fs.existsSync(profileFile(id))); }
        if (typeof id !== "string" || !ID_RE.test(id)) return send(res, 400, { error: "bad_id" });
        if (fs.existsSync(profileFile(id))) return send(res, 409, { error: "exists" });
        const doc = { id, name, rev: 0, savedAt: new Date().toISOString(), device: "", schemaVersion: null, state: null };
        writeJson(profileFile(id), doc, "profile-" + id);
        return send(res, 201, { id, name, rev: 0 });
      });
      return send(res, 405, { error: "method_not_allowed" });
    }

    const pm = /^\/api\/profiles\/([^/]+)\/state$/.exec(p);
    if (pm) {
      let id;
      try { id = decodeURIComponent(pm[1]); } catch (e) { return send(res, 400, { error: "bad_id" }); }
      if (!ID_RE.test(id)) return send(res, 400, { error: "bad_id" });
      const cur = readJson(profileFile(id));
      if (!cur) return send(res, 404, { error: "unknown_profile" });
      if (m === "GET") return send(res, 200, { rev: cur.rev, savedAt: cur.savedAt, schemaVersion: cur.schemaVersion, state: cur.state });
      if (m === "PUT") return readBody(req, res, body => putDoc(res, cur, body, body.state, profileSchema(body.state), rev => {
        const name = body.state.profile && typeof body.state.profile.name === "string" ? body.state.profile.name.trim().slice(0, 40) : cur.name;
        const next = { id, name: name || cur.name, rev, savedAt: new Date().toISOString(), device: String(body.device || ""), schemaVersion: body.state.meta.schemaVersion, state: body.state };
        next.state.meta.rev = rev;
        writeJson(profileFile(id), next, "profile-" + id); return next;
      }));
      return send(res, 405, { error: "method_not_allowed" });
    }
    return send(res, 404, { error: "not_found" });
  }

  function staticFile(req, res) {
    let p;
    try { p = decodeURIComponent(req.url.split("?")[0]); } catch (e) { return send(res, 400, "Ungültige Adresse", "text/plain; charset=utf-8"); }
    if (p.endsWith("/")) p += "index.html";
    const file = path.normalize(path.join(APP_DIR, p));
    if (file !== APP_DIR && !file.startsWith(APP_DIR + path.sep)) return send(res, 403, "forbidden", "text/plain");
    fs.readFile(file, (err, data) => {
      if (err) return send(res, 404, "Nicht gefunden", "text/plain; charset=utf-8");
      const ext = path.extname(file).toLowerCase();
      // Code immer neu prüfen (der Service Worker liefert offline aus seinem Cache). Schriften und Icons dürfen lange liegen.
      const long = ext === ".woff2" || ext === ".png";
      res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream", "Cache-Control": long ? "public, max-age=86400" : "no-cache" });
      res.end(req.method === "HEAD" ? undefined : data);
    });
  }

  const server = http.createServer((req, res) => {
    if (req.url.startsWith("/api/")) return api(req, res);
    if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, "method_not_allowed", "text/plain");
    staticFile(req, res);
  });
  server.dataDir = DATA_DIR;
  return server;
}

module.exports = { createServer, ID_RE };

if (require.main === module) {
  const PORT = Number(process.env.PORT || 8080);
  const server = createServer();
  server.listen(PORT, () => console.log("Torjäger-Liga läuft auf Port " + PORT + ", Daten in " + server.dataDir));
}
