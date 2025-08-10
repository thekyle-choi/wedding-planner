"use client"

import { useEffect } from "react"

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const register = async () => {
        try {
          await navigator.serviceWorker.register("/sw.js")
        } catch (e) {
          console.error("SW register failed", e)
        }
      }
      register()
    }
  }, [])

  return null
}
