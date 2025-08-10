// 캐시 완전 비활성화용 서비스 워커
// 동작:
// - install: 즉시 대기 해제
// - activate: 모든 캐시 삭제 후, 자기 자신을 unregister 하고 클라이언트 claim
// - fetch: 항상 네트워크 우선(no-store), 캐시에 아무것도 저장하지 않음

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
    } catch (_) {}
    try {
      await self.registration.unregister()
    } catch (_) {}
    try {
      await self.clients.claim()
    } catch (_) {}
  })())
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  event.respondWith(fetch(request, { cache: 'no-store' }))
})
