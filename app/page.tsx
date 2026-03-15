import { headers } from 'next/headers'
import AppHome from '@/components/home/AppHome'
import MarketingLanding from '@/components/home/MarketingLanding'

function getLandingHosts() {
  const defaultHosts = ['leftn.com', 'www.leftn.com']

  if (process.env.NODE_ENV !== 'production') {
    defaultHosts.push('localhost', '127.0.0.1')
  }

  const raw = process.env.LANDING_PAGE_HOSTS || defaultHosts.join(',')

  return new Set(
    raw
      .split(',')
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean),
  )
}

function normalizeHost(rawHost: string | null) {
  if (!rawHost) return ''

  return rawHost.split(',')[0].trim().toLowerCase().replace(/:\d+$/, '')
}

export default async function RootPage() {
  const headerStore = await headers()
  const requestHost = normalizeHost(
    headerStore.get('x-forwarded-host') || headerStore.get('host'),
  )
  const shouldShowLanding = getLandingHosts().has(requestHost)

  return shouldShowLanding ? <MarketingLanding /> : <AppHome />
}
