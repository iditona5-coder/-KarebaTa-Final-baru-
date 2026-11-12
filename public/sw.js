const CACHE_NAME = 'karebata-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Standard pass-through fetch handler ensuring PWA installability across Chromium browsers
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Let network handle requests directly, falling back to cache if offline
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
