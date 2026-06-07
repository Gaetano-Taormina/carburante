const CACHE_NAME = 'fuelfinder-cache-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './assets/css/style.css',
  './assets/css/tailwind.css',
  './assets/js/script.js',
  './assets/js/auto_translator.js',
  './assets/libs/leaflet.css',
  './assets/libs/leaflet.js',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Per il file dati.json: Network First (vogliamo sempre i prezzi aggiornati)
  if (url.pathname.endsWith('dati.json')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Per tutti gli altri file (HTML, CSS, JS): Cache First
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request).then(fetchResponse => {
          const resClone = fetchResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
          return fetchResponse;
        });
      })
    );
  }
});
