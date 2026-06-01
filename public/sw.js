const CACHE_NAME = 'medminder-cache-v1';

// These are the files the phone will download and save locally
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/auth.html',
  '/css/style.css',
  '/js/app.js',
  '/js/auth.js',
  '/logo/medminder_logo.svg',
  '/logo/medminder_favicon.png'
];

// 1. Install the Service Worker and Cache Files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Intercept internet requests and serve from Cache first
self.addEventListener('fetch', (event) => {
  // We don't want to cache API database calls, only UI files!
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});