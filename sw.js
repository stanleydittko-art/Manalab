/* Service Worker ManaLab — cache hors-ligne complet.
   RÈGLE : incrémenter CACHE_NAME à chaque ajout/suppression/modification notable de fichier. */
const CACHE_NAME = 'manalab-cache-v6';
const FILES = [
  "./",
  "index.html",
  "styles.css",
  "manifest.json",
  "icons/icon.svg",
  "icons/icon-180.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "js/1-config.js",
  "js/2-data.js",
  "js/2-exercises.js",
  "js/2-tips.js",
  "js/3-state.js",
  "js/4-utils.js",
  "js/5-engine.js",
  "js/5-engine-progress.js",
  "js/6-bridge.js",
  "js/7-fx.js",
  "js/8-ui.js",
  "js/8-ui-tabs.js",
  "js/8-ui-modals.js",
  "js/8-ui-progress.js",
  "js/8-ui-settings.js",
  "js/8-ui-events.js",
  "js/9-main.js"
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true })
      .then((hit) => hit || fetch(e.request).catch(() => caches.match('./index.html')))
  );
});
