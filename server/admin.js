// Admin-Aktionen der Eltern. Der Server prüft die Eltern-PIN bei jedem Aufruf selbst (Hash und Salz aus data/settings.json),
// die Prüfung in der App allein reicht nicht. Nichts wird hart gelöscht: Löschen verschiebt nach data/trash/,
// Zurücksetzen und Wiederherstellen legen vorher eine Sicherung in data/backups/manual/ an.
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PIN_RE = /^\d{4}$/;
const STAMP_RE = "\\d{8}-\\d{6}";
const KEEP_MANUAL = 100;
const FAIL_LIMIT = 5;          // so viele falsche PINs hintereinander ...
const LOCK_MS = 60 * 1000;     // ... dann eine Minute Pause

const stampOf = d => d.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "").replace("T", "-"); // 20260929-195805
const isoOfStamp = s => `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(9, 11)}:${s.slice(11, 13)}:${s.slice(13, 15)}Z`;
const isoOfDeployStamp = s => `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(9, 11)}:${s.slice(11, 13)}:00Z`; // 20260929-1200, Ortszeit des Servers
const clone = o => JSON.parse(JSON.stringify(o));

// Alt-Hash aus dem Prototyp (siehe app/js/pin.js)
function djb2(p) { let h = 5381; const s = "torjaeger:" + p; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return "h" + h.toString(36); }
const sha256 = t => crypto.createHash("sha256").update(t).digest("hex");
function sameText(a, b) { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); }

function createAdmin(env) {
  const { DATA_DIR, PROFILES, SETTINGS, BACKUPS, TRASH, MANUAL, DEVICES, ID_RE, profileFile, readJson, writeJson, writeAtomic, send, readBody, loadModel } = env;
  fs.mkdirSync(TRASH, { recursive: true });
  fs.mkdirSync(MANUAL, { recursive: true });
  const idPart = "([a-z0-9][a-z0-9-]{2,39})";
  const RE = {
    daily: new RegExp(`^profile-${idPart}-(\\d{4}-\\d{2}-\\d{2})\\.json$`),
    dailySettings: /^settings-(\d{4}-\d{2}-\d{2})\.json$/,
    deploy: /^pre-deploy-(\d{8}-\d{4})$/,
    manual: new RegExp(`^profile-${idPart}-(${STAMP_RE})-([a-z-]+)\\.json$`),
    trash: new RegExp(`^${idPart}-(${STAMP_RE})\\.json$`)
  };

  // ---------- PIN ----------
  let fails = 0, lockedUntil = 0;
  function pinRecord() { const cur = readJson(SETTINGS); return cur && cur.settings && cur.settings.pin || null; }
  function pinOk(pin) {
    const rec = pinRecord();
    if (!rec || typeof pin !== "string" || !PIN_RE.test(pin)) return false;
    if (rec.algo === "legacy-djb2") return sameText(djb2(pin), rec.hash);
    return sameText(sha256(rec.salt + ":" + pin), rec.hash);
  }
  // Der Alt-Hash des Prototyps wird beim ersten richtigen Eingeben auf dem Server aufgewertet (die App darf die PIN nicht mehr über den normalen Abgleich ändern).
  function upgradeLegacyPin(pin) {
    const cur = readJson(SETTINGS);
    if (!cur || !cur.settings || !cur.settings.pin || cur.settings.pin.algo !== "legacy-djb2") return;
    const ts = Date.now(), salt = crypto.randomBytes(8).toString("hex");
    const settings = Object.assign({}, cur.settings, { pin: { algo: "sha256-salt", salt, hash: sha256(salt + ":" + pin), t: ts }, updatedAt: ts });
    writeJson(SETTINGS, { rev: cur.rev + 1, savedAt: new Date(ts).toISOString(), device: "admin", schemaVersion: settings.schemaVersion || cur.schemaVersion, settings }, "settings");
  }
  // true = weiter, sonst wurde schon geantwortet
  function auth(res, body) {
    const t = Date.now();
    if (t < lockedUntil) { send(res, 429, { error: "too_many", retryAfter: Math.ceil((lockedUntil - t) / 1000) }); return false; }
    if (!pinRecord()) { send(res, 403, { error: "no_pin" }); return false; }
    if (pinOk(body.pin)) { fails = 0; upgradeLegacyPin(body.pin); return true; }
    if (++fails >= FAIL_LIMIT) { lockedUntil = t + LOCK_MS; fails = 0; }
    send(res, 403, { error: "bad_pin" });
    return false;
  }

  // ---------- Papierkorb und Sicherungen ----------
  const trashFiles = () => fs.readdirSync(TRASH).map(f => ({ f, m: RE.trash.exec(f) })).filter(x => x.m);
  const isTrashed = id => trashFiles().some(x => x.m[1] === id);

  function pruneManual() {
    const files = fs.readdirSync(MANUAL).filter(f => RE.manual.test(f)).sort();
    files.slice(0, Math.max(0, files.length - KEEP_MANUAL)).forEach(f => fs.unlinkSync(path.join(MANUAL, f)));
  }
  // Kopie des aktuellen Konto-Stands nach data/backups/manual/ (vor Zurücksetzen und Wiederherstellen)
  function saveManual(id, reason) {
    const src = profileFile(id);
    if (!fs.existsSync(src)) return null;
    const name = `profile-${id}-${stampOf(new Date())}-${reason}.json`;
    fs.copyFileSync(src, path.join(MANUAL, name));
    pruneManual();
    return name;
  }
  const dirSize = d => fs.readdirSync(d, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? dirSize(path.join(d, e.name)) : fs.statSync(path.join(d, e.name)).size), 0);

  function profileNames() {
    const names = {};
    for (const f of fs.readdirSync(PROFILES).filter(x => x.endsWith(".json"))) { const d = readJson(path.join(PROFILES, f)); if (d && d.id) names[d.id] = d.name || ""; }
    for (const x of trashFiles()) { if (names[x.m[1]] === undefined) { const d = readJson(path.join(TRASH, x.f)); names[x.m[1]] = d && d.name || ""; } }
    return names;
  }

  function listBackups() {
    const names = profileNames(), out = [], nm = id => names[id] || id;
    for (const f of fs.readdirSync(BACKUPS)) {
      const full = path.join(BACKUPS, f);
      let m;
      if ((m = RE.daily.exec(f))) { const st = fs.statSync(full); out.push({ kind: "daily", key: "daily:" + f, profileId: m[1], profileName: nm(m[1]), date: st.mtime.toISOString(), size: st.size }); }
      else if ((m = RE.dailySettings.exec(f))) { const st = fs.statSync(full); out.push({ kind: "daily-settings", date: st.mtime.toISOString(), size: st.size }); }
      else if ((m = RE.deploy.exec(f)) && fs.statSync(full).isDirectory()) {
        const items = [], pdir = path.join(full, "profiles");
        if (fs.existsSync(pdir)) for (const pf of fs.readdirSync(pdir)) {
          const pm = /^([a-z0-9][a-z0-9-]{2,39})\.json$/.exec(pf);
          if (pm) items.push({ key: `pre:${f}:${pm[1]}`, profileId: pm[1], profileName: nm(pm[1]), size: fs.statSync(path.join(pdir, pf)).size });
        }
        out.push({ kind: "pre-deploy", name: f, date: isoOfDeployStamp(m[1]), size: dirSize(full), items });
      }
    }
    for (const f of fs.readdirSync(MANUAL)) {
      const m = RE.manual.exec(f);
      if (m) out.push({ kind: "manual", key: "manual:" + f, profileId: m[1], profileName: nm(m[1]), date: isoOfStamp(m[2]), size: fs.statSync(path.join(MANUAL, f)).size, note: m[3] });
    }
    for (const x of trashFiles()) out.push({ kind: "trash", key: "trash:" + x.f, profileId: x.m[1], profileName: nm(x.m[1]), date: isoOfStamp(x.m[2]), size: fs.statSync(path.join(TRASH, x.f)).size });
    return out.sort((a, b) => b.date.localeCompare(a.date));
  }

  // Schlüssel aus der Liste in eine Datei auflösen. Nur bekannte Formen, keine freien Pfade.
  function resolveKey(key) {
    if (typeof key !== "string") return null;
    let m;
    if (key.startsWith("daily:") && (m = RE.daily.exec(key.slice(6)))) return { type: "daily", id: m[1], file: path.join(BACKUPS, key.slice(6)) };
    if (key.startsWith("manual:") && (m = RE.manual.exec(key.slice(7)))) return { type: "manual", id: m[1], file: path.join(MANUAL, key.slice(7)) };
    if (key.startsWith("trash:") && (m = RE.trash.exec(key.slice(6)))) return { type: "trash", id: m[1], file: path.join(TRASH, key.slice(6)) };
    if (key.startsWith("pre:")) {
      const parts = key.split(":");
      if (parts.length === 3 && RE.deploy.test(parts[1]) && ID_RE.test(parts[2])) return { type: "pre", id: parts[2], file: path.join(BACKUPS, parts[1], "profiles", parts[2] + ".json") };
    }
    return null;
  }

  // ---------- Geräte ----------
  function deviceKind(ua) {
    ua = String(ua || "");
    if (/iPhone/.test(ua)) return "iPhone";
    if (/iPad/.test(ua)) return "iPad";
    if (/Macintosh/.test(ua)) return "Mac oder iPad";
    if (/Windows/.test(ua)) return "Windows-PC";
    if (/Android/.test(ua)) return "Android";
    return "Gerät";
  }
  const readDevices = () => { const d = readJson(DEVICES); return d && d.devices && typeof d.devices === "object" ? d : { version: 1, devices: {} }; };
  const seenAt = new Map();
  // Jeder Aufruf der App meldet ihre Geräte-Kennung (Header X-Device). Geschrieben wird höchstens einmal pro Minute.
  function touchDevice(req, push) {
    const id = req.headers["x-device"];
    if (typeof id !== "string" || !/^[A-Za-z0-9_-]{3,40}$/.test(id)) return;
    const now = Date.now(), last = seenAt.get(id) || 0;
    if (now - last < 60000 && !push) return;
    const doc = readDevices(), cur = doc.devices[id] || { name: "", firstSeen: new Date(now).toISOString() };
    cur.kind = deviceKind(req.headers["user-agent"]);
    cur.lastSeen = new Date(now).toISOString();
    if (push) cur.lastPush = cur.lastSeen;
    doc.devices[id] = cur;
    try { writeAtomic(DEVICES, doc); seenAt.set(id, now); } catch (e) { /* Geräteliste ist nur eine Hilfe, sie darf nie den Abgleich stören */ }
  }
  const deviceList = () => Object.entries(readDevices().devices).map(([id, d]) => ({ id, name: d.name || "", kind: d.kind || "Gerät", firstSeen: d.firstSeen || null, lastSeen: d.lastSeen || null, lastPush: d.lastPush || null }))
    .sort((a, b) => String(b.lastSeen).localeCompare(String(a.lastSeen)));

  // ---------- Aktionen ----------
  async function restore(res, key) {
    const r = resolveKey(key);
    if (!r || !fs.existsSync(r.file)) return send(res, 404, { error: "unknown_backup" });
    if (r.type === "trash") {
      if (fs.existsSync(profileFile(r.id))) return send(res, 409, { error: "exists" });
      fs.renameSync(r.file, profileFile(r.id));
      return send(res, 200, { ok: true, id: r.id, from: "trash" });
    }
    const src = readJson(r.file);
    if (!src || src.id !== r.id || !src.state) return send(res, 409, { error: "bad_backup" });
    const { model } = await loadModel();
    let st;
    try { st = model.migrateProfile(clone(src.state), { id: r.id }); } catch (e) { return send(res, 409, { error: "bad_backup", detail: String(e.message) }); }
    const cur = readJson(profileFile(r.id));
    const saved = saveManual(r.id, "vor-wiederherstellen");
    // resetAt und updatedAt = jetzt: Alle Geräte übernehmen diesen Stand vollständig (siehe Zusammenführen in SPEC.md).
    const ts = Date.now(), rev = (cur ? cur.rev : 0) + 1;
    st.meta.resetAt = ts; st.meta.updatedAt = ts; st.meta.rev = rev;
    const next = { id: r.id, name: st.profile && st.profile.name || src.name || (cur && cur.name) || r.id, rev, savedAt: new Date(ts).toISOString(), device: "admin", schemaVersion: st.meta.schemaVersion, state: st };
    writeJson(profileFile(r.id), next, "profile-" + r.id);
    return send(res, 200, { ok: true, id: r.id, rev, safety: saved });
  }

  async function reset(res, id) {
    const cur = readJson(profileFile(id));
    if (!cur) return send(res, 404, { error: "unknown_profile" });
    if (!cur.state) return send(res, 409, { error: "no_state" });
    const { model, rules } = await loadModel();
    let st;
    try { st = model.migrateProfile(clone(cur.state), { id }); } catch (e) { return send(res, 409, { error: "bad_state", detail: String(e.message) }); }
    const saved = saveManual(id, "vor-zuruecksetzen");
    const ts = Date.now(), rev = cur.rev + 1;
    const fresh = rules.applyReset(st, { deviceId: "server", now: ts });
    fresh.meta.rev = rev; fresh.meta.updatedAt = ts;
    const next = { id, name: cur.name, rev, savedAt: new Date(ts).toISOString(), device: "admin", schemaVersion: fresh.meta.schemaVersion, state: fresh };
    writeJson(profileFile(id), next, "profile-" + id);
    return send(res, 200, { ok: true, rev, safety: saved });
  }

  function remove(res, id) {
    const file = profileFile(id);
    if (!fs.existsSync(file)) return send(res, 404, { error: "unknown_profile" });
    const name = `${id}-${stampOf(new Date())}.json`;
    fs.renameSync(file, path.join(TRASH, name));
    return send(res, 200, { ok: true, trash: "trash:" + name });
  }

  function changePin(res, body) {
    if (typeof body.newPin !== "string" || !PIN_RE.test(body.newPin)) return send(res, 400, { error: "bad_new_pin" });
    const cur = readJson(SETTINGS);
    const ts = Date.now(), salt = crypto.randomBytes(8).toString("hex");
    const settings = Object.assign({}, cur.settings, { pin: { algo: "sha256-salt", salt, hash: sha256(salt + ":" + body.newPin), t: ts }, updatedAt: ts });
    const next = { rev: cur.rev + 1, savedAt: new Date(ts).toISOString(), device: "admin", schemaVersion: settings.schemaVersion || cur.schemaVersion, settings };
    writeJson(SETTINGS, next, "settings");
    fails = 0; lockedUntil = 0;
    return send(res, 200, { ok: true, rev: next.rev });
  }

  function renameDevice(res, id, body) {
    const name = typeof body.name === "string" ? body.name.replace(/[<>]/g, "").trim().slice(0, 30) : "";
    const doc = readDevices();
    if (!doc.devices[id]) return send(res, 404, { error: "unknown_device" });
    doc.devices[id].name = name;
    writeAtomic(DEVICES, doc);
    return send(res, 200, { ok: true });
  }

  // ---------- Verteiler ----------
  function handle(req, res, p, m) {
    if (m !== "POST") return send(res, 405, { error: "method_not_allowed" });
    let action, id;
    let mm;
    if (p === "/api/admin/verify") action = "verify";
    else if (p === "/api/admin/backups") action = "backups";
    else if (p === "/api/admin/devices") action = "devices";
    else if (p === "/api/admin/restore") action = "restore";
    else if (p === "/api/admin/pin") action = "pin";
    else if ((mm = /^\/api\/admin\/profiles\/([^/]+)\/(delete|reset)$/.exec(p))) { action = mm[2]; id = decodeURIComponent(mm[1]); if (!ID_RE.test(id)) return send(res, 400, { error: "bad_id" }); }
    else if ((mm = /^\/api\/admin\/devices\/([^/]+)\/rename$/.exec(p))) { action = "rename"; id = decodeURIComponent(mm[1]); if (!/^[A-Za-z0-9_-]{3,40}$/.test(id)) return send(res, 400, { error: "bad_id" }); }
    else return send(res, 404, { error: "not_found" });
    return readBody(req, res, async body => {
      try {
        if (!auth(res, body)) return;
        if (action === "verify") return send(res, 200, { ok: true });
        if (action === "backups") return send(res, 200, { backups: listBackups() });
        if (action === "devices") return send(res, 200, { devices: deviceList() });
        if (action === "rename") return renameDevice(res, id, body);
        if (action === "restore") return await restore(res, body.key);
        if (action === "reset") return await reset(res, id);
        if (action === "delete") return remove(res, id);
        if (action === "pin") return changePin(res, body);
      } catch (e) {
        console.error("Admin-Fehler:", e);
        if (!res.headersSent) send(res, 500, { error: "internal" });
      }
    });
  }

  return { handle, touchDevice, isTrashed, pinOk };
}

module.exports = { createAdmin };
