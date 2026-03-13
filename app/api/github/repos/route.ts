import { NextResponse } from 'next/server'
import { listUserRepos } from '@/lib/github-api'
import { requireGithubSession } from '@/lib/github-session'

export async function GET() {
  try {
    const session = await requireGithubSession()
    const repos = await listUserRepos(session.accessToken)

    return NextResponse.json({
      ok: true,
      repos: repos.map((repo) => ({
        id: repo.id,
        owner: repo.owner.login,
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
        defaultBranch: repo.default_branch,
      })),
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to load repositories.',
      },
      { status: 500 },
    )
  }
}
