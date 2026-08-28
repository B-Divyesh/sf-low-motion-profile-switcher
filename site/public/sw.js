const CACHE = 'low-motion-site-v3';
const SHELL = ['/', '/demo/', '/privacy/', '/terms/'];

async function precacheShell() {
  const cache = await caches.open(CACHE);
  const responses = await Promise.all(SHELL.map(async (path) => [path, await fetch(path, { cache: 'reload' })]));
  const dependencies = new Set([
    '/assets/favicon.svg',
    '/assets/apple-touch-icon.png',
    '/assets/social-preview.png',
    '/assets/signal-landscape-768.avif',
    '/assets/signal-landscape.avif',
    '/assets/signal-landscape-768.webp',
    '/assets/signal-landscape.webp',
    '/fonts/inter-latin.woff2',
    '/fonts/ibm-plex-mono-latin.woff2',
  ]);
  for (const [path, response] of responses) {
    if (!response.ok) throw new Error(`Could not precache ${path}`);
    await cache.put(path, response.clone());
    const html = await response.text();
    for (const match of html.matchAll(/(?:href|src)="(\/[^"]+)"/g)) {
      const dependency = match[1];
      if (!dependency.includes('#') && !dependency.startsWith('/downloads/')) dependencies.add(dependency);
    }
  }
  await Promise.all([...dependencies].map(async (path) => {
    const response = await fetch(path, { cache: 'reload' });
    if (!response.ok) throw new Error(`Could not precache ${path}`);
    await cache.put(path, response);
  }));
}

self.addEventListener('install', (event) => event.waitUntil(precacheShell().then(() => self.skipWaiting())));
self.addEventListener('activate', (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (new URL(event.request.url).pathname === '/online-check.txt') {
    event.respondWith(fetch(event.request));
    return;
  }
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then((response) => {
      if (response.ok) caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
      return response;
    }).catch(() => caches.match(event.request).then((cached) => cached || caches.match('/'))));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok && new URL(event.request.url).origin === self.location.origin) caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
    return response;
  })));
});
