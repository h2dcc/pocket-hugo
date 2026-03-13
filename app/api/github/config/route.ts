import { NextRequest, NextResponse } from 'next/server'
import { listUserRepos } from '@/lib/github-api'
import {
  saveGithubRepoConfigPreference,
  normalizePostsBasePath,
  requireGithubSession,
  saveGithubSession,
} from '@/lib/github-session'

export async function GET() {
  try {
    const session = await requireGithubSession()
    return NextResponse.json({
      ok: true,
      repoConfig: session.repoConfig,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to load config.',
      },
      { status: 401 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireGithubSession()
    const body = (await request.json()) as {
      owner?: string
      repo?: string
      branch?: string
      postsBasePath?: string
    }

    const owner = String(body.owner || '').trim()
    const repo = String(body.repo || '').trim()
    const branch = String(body.branch || '').trim()
    const postsBasePath = normalizePostsBasePath(String(body.postsBasePath || ''))

    if (!owner || !repo || !branch || !postsBasePath) {
      return NextResponse.json(
        { ok: false, error: 'owner, repo, branch, and postsBasePath are required.' },
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

    const repoConfig = {
      owner,
      repo,
      branch,
      postsBasePath,
    }

    await saveGithubSession({
      ...session,
      repoConfig,
    })
    await saveGithubRepoConfigPreference(repoConfig)

    return NextResponse.json({
      ok: true,
      repoConfig,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to save config.',
      },
      { status: 500 },
    )
  }
}
