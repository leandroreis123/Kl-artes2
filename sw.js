// Sempre que eu (Claude) atualizar o app, o número da versão abaixo muda.
// Isso força o celular a jogar fora o cache antigo e buscar a versão nova.
const CACHE = 'kl-artes-v3';
const ARQUIVOS = [
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ARQUIVOS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* HTML (a página em si): sempre tenta buscar a versão mais nova na internet
   primeiro. Só usa a copia salva se estiver sem internet.
   Isso evita o app "travar" numa versão antiga pra sempre. */
self.addEventListener('fetch', e => {
  const ehPagina = e.request.mode === 'navigate' || e.request.url.endsWith('index.html');

  if(ehPagina){
    e.respondWith(
      fetch(e.request)
        .then(resp => {
          const copia = resp.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, copia));
          return resp;
        })
        .catch(() => caches.match(e.request).then(c => c || caches.match('./index.html')))
    );
    return;
  }

  // Outros arquivos (ícones, manifest, jsPDF): usa cache pra ser rápido,
  // mas atualiza o cache em segundo plano.
  e.respondWith(
    caches.match(e.request).then(cached => {
      const buscaRede = fetch(e.request).then(resp => {
        const copia = resp.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, copia));
        return resp;
      }).catch(() => cached);
      return cached || buscaRede;
    })
  );
});
