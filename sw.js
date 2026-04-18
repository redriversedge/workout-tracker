var CACHE_VERSION = 'rre-v19.0.0';
var CACHE_FILES = [
  '/',
  '/index.html',
  '/css/rre.css',
  '/js/themes.js',
  '/js/core.js',
  '/js/programs.js',
  '/js/logging.js',
  '/js/analytics.js',
  '/js/red.js',
  '/js/onboarding.js',
  '/js/tabs.js',
  '/js/backup.js',
  '/manifest.json',
  '/assets/red-wolf.svg',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/assets/apple-touch-icon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE_VERSION).then(function (c) { return c.addAll(CACHE_FILES); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (k) {
      if (k !== CACHE_VERSION) return caches.delete(k);
    }));
  }));
  self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  var url = e.request.url;
  if (url.indexOf('/.netlify/') > -1 || url.indexOf('anthropic.com') > -1) return;
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      var fetched = fetch(e.request).then(function (resp) {
        if (resp && resp.status === 200 && e.request.method === 'GET') {
          var clone = resp.clone();
          caches.open(CACHE_VERSION).then(function (c) { c.put(e.request, clone); });
        }
        return resp;
      }).catch(function () { return cached; });
      return cached || fetched;
    })
  );
});
