const CACHE = 'fiquebem-v4';
const ASSETS = ['/', '/index.html', '/icon-192.png', '/icon-512.png', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting(); // ativa imediatamente sem esperar fechar
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim(); // assume controle de todas as abas abertas
});

self.addEventListener('fetch', e => {
  // Nunca cacheia chamadas de API
  if (e.request.url.includes('/api/')) return;

  // Para o index.html: sempre busca na rede primeiro (network-first)
  if (e.request.url.endsWith('/') || e.request.url.includes('index.html')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Para os demais assets: cache-first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
