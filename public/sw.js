const CACHE_NAME = 'lumenai-v3';
const SHELL_URL = '/';
const STATIC_ASSETS = [
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png',
];

// Precache the app shell plus every hashed JS/CSS/font file it references, so the
// installed app can start without touching the network at all.
async function precache() {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(STATIC_ASSETS);

    const response = await fetch(SHELL_URL, { cache: 'no-cache' });
    if (!response.ok) return;
    const html = await response.clone().text();
    await cache.put(SHELL_URL, response);

    const assets = new Set(html.match(/\/_next\/static\/[^"'\s)]+/g) || []);
    await Promise.all([...assets].map((url) => cache.add(url).catch(() => { })));
}

self.addEventListener('install', (event) => {
    event.waitUntil(precache());
    self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Content-hashed build output and icons never change under the same URL.
function isImmutable(url) {
    return url.pathname.startsWith('/_next/static/') ||
        url.pathname.startsWith('/_next/image') ||
        /^\/(icon|apple-icon)[^/]*\.png$/.test(url.pathname);
}

function putInCache(request, response) {
    if (response.status === 200) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
    }
    return response;
}

self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    // Skip API requests (always go to network)
    if (url.pathname.startsWith('/api/')) return;

    if (isImmutable(url)) {
        event.respondWith(
            caches.match(event.request).then((cached) =>
                cached || fetch(event.request).then((response) => putInCache(event.request, response))
            )
        );
        return;
    }

    // Page loads: serve the cached shell instantly and refresh it in the background
    // (stale-while-revalidate). A new deploy shows up on the next launch.
    if (event.request.mode === 'navigate' && url.pathname === SHELL_URL) {
        const network = fetch(event.request).then((response) => putInCache(SHELL_URL, response));
        event.waitUntil(network.catch(() => { }));
        event.respondWith(
            caches.match(SHELL_URL).then((cached) => cached || network)
        );
        return;
    }

    // Everything else (manifest, ...) - network first, fall back to cache
    event.respondWith(
        fetch(event.request)
            .then((response) => putInCache(event.request, response))
            .catch(() => caches.match(event.request))
    );
});
