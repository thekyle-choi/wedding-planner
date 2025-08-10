const CACHE_NAME = 'wp-cache-v1'
const ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/logo.png'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  event.respondWith(
    caches.match(request).then((cached) =>
      cached || fetch(request).then((resp) => {
        const respClone = resp.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, respClone))
        return resp
      }).catch(() => cached)
    )
  )
})
