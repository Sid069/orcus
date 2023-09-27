// Define a unique version for your service worker
const cacheName = 'Orcus-pwa-cache-v1';

// List of assets and routes to cache
const assetsToCache = [
  '/',
  '/home',
  '/start-riddle',
  '/profile',
  "/views/partials",
  '/views/index.ejs',
  '/views/home.ejs',
  '/views/start-riddle.ejs',
  '/views/profile.ejs',
  '/public/css/styles.css',
  '/public/script.js',
  '/public/assets/icon.png',
  '/public/assets/', // Cache the entire "assets" folder
];

// Install event: Cache the specified assets and routes when the service worker is installed
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(cacheName).then((cache) => {
      return cache.addAll(assetsToCache);
    })
  );
});

// Fetch event: Serve cached assets and routes when offline, otherwise fetch from the network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});

// Activate event: Remove outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== cacheName) {
            return caches.delete(name);
          }
        })
      );
    })
  );
});
