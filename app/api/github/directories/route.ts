import { NextRequest, NextResponse } from 'next/server'
import { listGithubDir, listUserRepos } from '@/lib/github-api'
import { requireGithubSession } from '@/lib/github-session'

function normalizePath(input: string) {
  return input.trim().replace(/^\/+|\/+$/g, '')
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireGithubSession()
    const owner = String(request.nextUrl.searchParams.get('owner') || '').trim()
    const repo = String(request.nextUrl.searchParams.get('repo') || '').trim()
    const branch = String(request.nextUrl.searchParams.get('branch') || '').trim()
    const path = normalizePath(String(request.nextUrl.searchParams.get('path') || ''))

    if (!owner || !repo || !branch) {
      return NextResponse.json(
        { ok: false, error: 'owner, repo, and branch are required.' },
        { status: 400 },
      )
    }

    const repos = await listUserRepos(session.accessToken)
    const matchedRepo = repos.find(
      (item) => item.owner.login === owner && item.name === repo,
    )

    if (!matchedRepo) {
      return NextResponse.json(
        { ok: false, error: 'Selected repository is not available for this account.' },
        { status: 400 },
      )
    }

    const items = await listGithubDir(path, session.accessToken, {
      owner,
      repo,
      branch,
    })

    return NextResponse.json({
      ok: true,
      path,
      directories: items
        .filter((item) => item.type === 'dir')
        .map((item) => ({
          name: item.name,
          path: item.path,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to load directories.',
      },
      { status: 500 },
    )
  }
}
