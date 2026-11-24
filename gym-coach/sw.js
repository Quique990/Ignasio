// Service worker: la app funciona sin conexión en el gimnasio.
const VERSION = 'gymcoach-v1';
const SHELL = [
  './', './index.html', './css/styles.css', './manifest.webmanifest',
  './js/app.js', './js/exercises.js', './js/program.js', './js/storage.js', './js/charts.js',
  './icons/icon.svg', './icons/icon-180.png', './icons/icon-192.png',
];
const IMG_CACHE = 'gymcoach-img-v1';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k !== VERSION && k !== IMG_CACHE).map(k => caches.delete(k))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.hostname === 'api.github.com') return; // la sincronización nunca se cachea

  // Fotos de ejercicios: primero caché, si no, red y se guardan.
  if (url.hostname === 'raw.githubusercontent.com') {
    e.respondWith(caches.open(IMG_CACHE).then(async c => {
      const hit = await c.match(e.request);
      if (hit) return hit;
      try {
        const res = await fetch(e.request);
        if (res.ok) c.put(e.request, res.clone());
        return res;
      } catch { return new Response('', { status: 504 }); }
    }));
    return;
  }

  // Archivos de la app: red primero (para recibir actualizaciones), caché si no hay conexión.
  if (url.origin === location.origin) {
    e.respondWith(fetch(e.request).then(res => {
      if (res.ok) caches.open(VERSION).then(c => c.put(e.request, res.clone()));
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
  }
});
