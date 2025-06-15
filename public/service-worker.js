const CACHE = 'linker-v2';
const ASSETS = [
  '/', '/index.html', '/style.css', '/app.js',
  '/linker-icon-192.png', '/linker-icon-512.png', '/favicon.ico',
  '/images/logo.png'
];
self.addEventListener('install', e => e.waitUntil(
  caches.open(CACHE).then(c => c.addAll(ASSETS))
));
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
