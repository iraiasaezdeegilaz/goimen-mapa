self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('ekoizleak-v1').then((cache) => {
      return cache.addAll([
        './index.html',
        './data/Ekoizle potentzialak.xlsx'
      ]);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});