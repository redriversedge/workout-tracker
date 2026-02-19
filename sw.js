var CACHE='rre-v18b';
var URLS=['/','/index.html','/manifest.json'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(URLS);}));self.skipWaiting();});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));}));self.clients.claim();});
self.addEventListener('fetch',function(e){
  // Never cache API calls
  if(e.request.url.includes('.netlify/functions/')){e.respondWith(fetch(e.request));return;}
  // Stale-while-revalidate for app assets
  e.respondWith(caches.match(e.request).then(function(cached){
    var fetchPromise=fetch(e.request).then(function(response){
      if(response&&response.status===200){
        var clone=response.clone();
        caches.open(CACHE).then(function(c){c.put(e.request,clone);});
      }
      return response;
    }).catch(function(){return cached||caches.match('/index.html');});
    return cached||fetchPromise;
  }));
});
