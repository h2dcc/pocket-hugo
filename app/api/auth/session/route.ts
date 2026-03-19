import { NextResponse } from 'next/server'
import { getGithubRepoConfigPreference, getGithubSession } from '@/lib/github-session'
import { getLocalRepoSession, isLocalRepoMode } from '@/lib/local-repo'

export async function GET() {
  if (isLocalRepoMode()) {
    const repoConfigPreference = await getGithubRepoConfigPreference()
    const session = getLocalRepoSession()
    return NextResponse.json({
      ok: true,
      ...session,
      mode: 'local',
      repoConfig: repoConfigPreference || session.repoConfig,
    })
  }

  const session = await getGithubSession()

  if (!session) {
    return NextResponse.json({ ok: true, authenticated: false })
  }

  return NextResponse.json({
    ok: true,
    mode: 'github',
    authenticated: true,
    user: session.user,
    repoConfig: session.repoConfig,
    pageConfig: session.pageConfig,
  })
}
