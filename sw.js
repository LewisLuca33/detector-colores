// Copia sin conexión con «red primero»: siempre se intenta cargar la versión más nueva y,
// si no hay conexión (o tarda más de 4 s), se usa la copia guardada.
const CACHE = 'colores-v41';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(u => new Request(u, { cache:'reload' })))));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const red = fetch(req, { cache:'no-cache' }).then(res => {
    if (res.ok) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
    return res;
  });
  const limite = new Promise((_, no) => setTimeout(no, 4000));
  e.respondWith(Promise.race([red, limite]).catch(() =>
    caches.match(req, { ignoreSearch:true }).then(hit => hit || caches.match('./index.html'))));
});
