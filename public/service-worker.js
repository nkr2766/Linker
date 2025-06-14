const CACHE = 'linker-v2';
const ASSETS = [
  '/', '/index.html', '/style.css', '/app.js',
  '/icon-192.png', '/favicon.ico',
  '/images/73294b6e-8bc4-428f-ad24-a303947fb853.png'
];
self.addEventListener('install', e => e.waitUntil(
  caches.open(CACHE).then(c => c.addAll(ASSETS))
));
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
