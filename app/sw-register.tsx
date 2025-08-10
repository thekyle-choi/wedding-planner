"use client"

import { useEffect } from "react"

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return

    // 캐시 완전 비활성화: 기존 서비스 워커 해제 + 모든 캐시 삭제
    const disableServiceWorkerAndClearCaches = async () => {
      try {
        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations()
          await Promise.all(regs.map((r) => r.unregister()))
        }

        if ("caches" in window) {
          const keys = await caches.keys()
          await Promise.all(keys.map((k) => caches.delete(k)))
        }
      } catch (e) {
        console.error("SW disable/clear failed", e)
      }
    }

    disableServiceWorkerAndClearCaches()
  }, [])

  return null
}
