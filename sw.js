/**
 * FLOWSTATE - Service Worker for Offline Mobile Support
 */

const CACHE_NAME = 'flowstate-cache-v10';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.html',
  './preview.html',
  './manifest.json',
  './css/style.css',
  './js/auth.js',
  './js/audio.js',
  './js/timer.js',
  './js/tasks.js',
  './js/planner.js',
  './js/stats.js',
  './js/cloud.js',
  './js/app.js',
  './assets/apple-touch-icon.png',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// Network-First with Cache Fallback for instant updates
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match('./index.html');
        });
      })
  );
});
