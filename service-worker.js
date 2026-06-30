// service-worker.js — cacheo offline básico de la PWA.
//
// Estrategia: Cache First para los assets propios (la app es la misma
// hasta que se actualice la versión de caché). Network First para las
// fuentes de Google Fonts, para que se actualicen si Google las cambia,
// pero sigan disponibles offline una vez descargadas.

const NOMBRE_CACHE = 'em-cache-v1';

const ASSETS_PROPIOS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/reset.css',
  '/css/tokens.css',
  '/css/app.css',
  '/js/app.js',
  '/js/router.js',
  '/js/storage.js',
  '/js/timer.js',
  '/js/screens/morning.js',
  '/js/screens/midday.js',
  '/js/screens/threshold.js',
  '/js/screens/night.js',
  '/js/screens/history.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(NOMBRE_CACHE).then((cache) => cache.addAll(ASSETS_PROPIOS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((claves) =>
      Promise.all(
        claves
          .filter((clave) => clave !== NOMBRE_CACHE)
          .map((clave) => caches.delete(clave))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (evento) => {
  const url = new URL(evento.request.url);
  const esFuenteGoogle =
    url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

  evento.respondWith(esFuenteGoogle ? networkFirst(evento.request) : cacheFirst(evento.request));
});

async function cacheFirst(request) {
  const cacheado = await caches.match(request);
  if (cacheado) return cacheado;

  try {
    const respuesta = await fetch(request);
    if (respuesta.ok) {
      const cache = await caches.open(NOMBRE_CACHE);
      cache.put(request, respuesta.clone());
    }
    return respuesta;
  } catch (error) {
    // Sin red y sin caché: si era una navegación, mostrar el index
    // cacheado para que la app siga funcionando offline.
    if (request.mode === 'navigate') {
      return caches.match('/index.html');
    }
    throw error;
  }
}

async function networkFirst(request) {
  try {
    const respuesta = await fetch(request);
    if (respuesta.ok) {
      const cache = await caches.open(NOMBRE_CACHE);
      cache.put(request, respuesta.clone());
    }
    return respuesta;
  } catch (error) {
    const cacheado = await caches.match(request);
    if (cacheado) return cacheado;
    throw error;
  }
}
