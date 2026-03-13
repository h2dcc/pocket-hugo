import { NextResponse } from 'next/server'
import { getGithubSession } from '@/lib/github-session'

export async function GET() {
  const session = await getGithubSession()

  if (!session) {
    return NextResponse.json({ ok: true, authenticated: false })
  }

  return NextResponse.json({
    ok: true,
    authenticated: true,
    user: session.user,
    repoConfig: session.repoConfig,
    pageConfig: session.pageConfig,
  })
}
