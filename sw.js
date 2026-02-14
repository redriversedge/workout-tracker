var CACHE_NAME = 'rre-v10';
var urlsToCache = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', function(event) {
  // Don't cache API calls
  if (event.request.url.includes('.netlify/functions/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request).then(function(fetchRes) {
        if (fetchRes && fetchRes.status === 200) {
          var resClone = fetchRes.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, resClone);
          });
        }
        return fetchRes;
      });
    }).catch(function() {
      return caches.match('/index.html');
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(name) { return name !== CACHE_NAME; })
          .map(function(name) { return caches.delete(name); })
      );
    })
  );
  self.clients.claim();
});
