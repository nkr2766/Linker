const CACHE = 'linker-v1', ASSETS = ['/', '/index.html', '/style.css', '/app.js'];
self.addEventListener('install', e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('fetch', e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
