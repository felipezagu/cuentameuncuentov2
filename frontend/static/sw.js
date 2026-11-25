/**
 * Service worker de Cuéntame un Cuento.
 * - Páginas y API de cuentos: red primero; sin conexión, lo último guardado.
 * - CSS/JS: se sirve lo guardado y se actualiza en segundo plano.
 * - Ilustraciones y sync.json: se guardan al verlos (los cuentos ya abiertos se ven sin internet).
 * - MP3, admin, herramientas y anuncios: siempre red (no se cachean).
 */
const VERSION = "v3";
const STATIC_CACHE = "cuc-static-" + VERSION;
const PAGES_CACHE = "cuc-pages-" + VERSION;
const MEDIA_CACHE = "cuc-media-" + VERSION;
const MEDIA_MAX = 250;

const PRECACHE = [
  "/",
  "/static/css/styles.css",
  "/static/css/tailwind.css",
  "/static/js/rewards.js",
  "/static/js/main.js",
  "/static/img/logo.webp",
  "/static/img/icon-192.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((c) => c.addAll(PRECACHE)).catch(() => {}).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  const keep = [STATIC_CACHE, PAGES_CACHE, MEDIA_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => keep.indexOf(k) === -1).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(request);
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  } catch (e) {
    const cached = await cache.match(request, { ignoreSearch: request.mode === "navigate" });
    if (cached) return cached;
    if (request.mode === "navigate") {
      const home = await caches.match("/");
      if (home) return home;
    }
    throw e;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  const update = fetch(request)
    .then((res) => {
      if (res && res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || update;
}

async function cacheFirst(request) {
  const cache = await caches.open(MEDIA_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res && res.ok) {
    cache.put(request, res.clone());
    trimCache(MEDIA_CACHE, MEDIA_MAX);
  }
  return res;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const p = url.pathname;
  if (p.startsWith("/admin") || p.startsWith("/tools") || p.startsWith("/api/admin")) return;
  if (/\.(mp3|mp4)$/i.test(p)) return;

  if (req.mode === "navigate" || p.startsWith("/api/stories")) {
    event.respondWith(networkFirst(req, PAGES_CACHE));
  } else if (p.startsWith("/static/")) {
    event.respondWith(staleWhileRevalidate(req));
  } else if (p.startsWith("/imagenes/") && /\.(webp|png|jpe?g|json)$/i.test(p)) {
    event.respondWith(cacheFirst(req));
  }
});
