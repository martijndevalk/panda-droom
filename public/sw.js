/**
 * Service Worker for Panda's Getallenreis PWA.
 *
 * Strategy: Cache-first for static assets, network-first for navigation.
 * This enables offline play after first load.
 */

const CACHE_NAME = 'panda-droom-v1';

// Install: pre-cache shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll([
        '/panda-droom/',
        '/panda-droom/favicon.svg',
        '/panda-droom/panda-icon-512.png',
      ])
    )
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for assets, network-first for pages
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET and external requests (like ElevenLabs API)
  if (request.method !== 'GET') return;
  if (!request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          // Only cache valid responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });

          return response;
        })
        .catch(() => {
          // If offline and not cached, return the cached index page for navigation
          if (request.mode === 'navigate') {
            return caches.match('/panda-droom/');
          }
          return new Response('Offline', { status: 503 });
        });
    })
  );
});
