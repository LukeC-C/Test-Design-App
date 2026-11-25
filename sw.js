// Offline-first service worker for the app shell.
const VERSION = 'atelier-v6';
const SHELL = [
  './', './index.html', './manifest.webmanifest', './css/app.css', './assets/icon.svg',
  './js/main.js', './js/project.js',
  './js/lib/dom.js', './js/lib/store.js', './js/lib/color.js', './js/lib/image.js',
  './js/data/catalog.js', './js/data/materials.js',
  './js/garments/render.js', './js/garments/geometry.js', './js/garments/top.js', './js/garments/bottom.js',
  './js/garments/hat.js', './js/garments/shoe.js', './js/garments/textures.js', './js/garments/custom.js',
  './assets/garments/manifest.json',
  './js/views/home.js', './js/views/wizard.js', './js/views/designer.js',
  './js/components/methods.js', './js/components/add-artwork.js', './js/components/image-search.js',
  './js/editor/editor.js', './js/editor/filters.js', './js/editor/vectorize.js', './js/editor/selection.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()).catch(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // never cache third-party (image search)
  // network-first so updates show up, cache fallback for offline
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(VERSION).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
  );
});
