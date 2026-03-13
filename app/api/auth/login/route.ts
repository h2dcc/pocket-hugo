import { NextRequest, NextResponse } from 'next/server'
import { generateOauthState, setGithubOauthState } from '@/lib/github-session'

function getBaseUrl(request: NextRequest) {
  return process.env.APP_URL || request.nextUrl.origin
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID

  if (!clientId) {
    return NextResponse.json(
      { ok: false, error: 'Missing GITHUB_CLIENT_ID' },
      { status: 500 },
    )
  }

  const state = generateOauthState()
  await setGithubOauthState(state)

  const callbackUrl = `${getBaseUrl(request)}/api/auth/callback`
  const url = new URL('https://github.com/login/oauth/authorize')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', callbackUrl)
  url.searchParams.set('scope', 'repo read:user')
  url.searchParams.set('state', state)

  return NextResponse.redirect(url)
}
