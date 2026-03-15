'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type SessionResponse = {
  ok: boolean
  authenticated?: boolean
}

export function useRequireAuth(fromPath: string) {
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/session', { cache: 'no-store' })
        const result = (await response.json()) as SessionResponse
        if (!response.ok || !result.ok || !result.authenticated) {
          const target = `/app?auth=required&from=${encodeURIComponent(fromPath)}`
          router.replace(target)
          return
        }
        if (!cancelled) {
          setCheckingAuth(false)
        }
      } catch {
        const target = `/app?auth=required&from=${encodeURIComponent(fromPath)}`
        router.replace(target)
      }
    }

    void checkAuth()

    return () => {
      cancelled = true
    }
  }, [fromPath, router])

  return checkingAuth
}
