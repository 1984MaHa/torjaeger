// Service Worker: App-Dateien aus dem Cache (cache-first), /api immer direkt ans Netz.
// Neue Auslieferung: VERSION erhöhen (gleichzeitig js/version.js). Der Worker berührt nie IndexedDB.
const VERSION = "1.6.2";
const CACHE = "torjaeger-app-" + VERSION;
const FILES = [
  "index.html", "manifest.webmanifest", "css/style.css",
  "js/app.js", "js/admin.js", "js/adminapi.js", "js/audio.js", "js/avatar.js", "js/avatardraw.js", "js/avatarui.js", "js/camp.js", "js/campviews.js", "js/check.js", "js/coach.js", "js/content.js", "js/content-en.js", "js/content-su.js", "js/figdata.js", "js/figures.js", "js/generators.js", "js/icons.js", "js/inputs.js", "js/merge.js", "js/model.js", "js/pin.js",
  "js/rules.js", "js/speech.js", "js/stickers.js", "js/store.js", "js/svg.js", "js/sync.js", "js/tasks.js", "js/util.js", "js/version.js", "js/views.js",
  "fonts/andika-400.woff2", "fonts/andika-700.woff2", "fonts/lilita-one-400.woff2",
  "img/fig-emil-front.png", "img/fig-emil-front-layer.png", "img/fig-emil-back.png", "img/fig-emil-back-layer.png",
  "img/fig-trainer-front.png", "img/fig-trainer-front-layer.png", "img/fig-trainer-back.png", "img/fig-trainer-back-layer.png", "img/fig-trainerin-back.png", "img/fig-trainerin-back-layer.png", "img/fig-trainerin-front.png", "img/fig-trainerin-front-layer.png",
  "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png"
];

self.addEventListener("install", e => {
  // "reload" umgeht den HTTP-Cache, damit wirklich der neue Stand im Cache landet.
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: "reload" })))));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("torjaeger-app-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", e => { if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting(); });

self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      if (hit) return hit;
      if (req.mode === "navigate") return caches.match("index.html");
      return fetch(req);
    })
  );
});
