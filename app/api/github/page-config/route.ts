import { NextRequest, NextResponse } from 'next/server'
import {
  normalizePageFilePath,
  requireGithubSession,
  saveGithubPageConfigPreference,
  saveGithubSession,
  type GithubPageConfig,
} from '@/lib/github-session'

export async function GET() {
  try {
    const session = await requireGithubSession()

    return NextResponse.json({
      ok: true,
      pageConfig: session.pageConfig,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to load page config.',
      },
      { status: 401 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireGithubSession()
    const body = (await request.json()) as {
      filePath?: string
      mode?: string
    }

    const filePath = normalizePageFilePath(String(body.filePath || ''))
    const mode: GithubPageConfig['mode'] = body.mode === 'live' ? 'live' : 'page'

    if (!filePath) {
      return NextResponse.json(
        { ok: false, error: 'filePath is required.' },
        { status: 400 },
      )
    }

    const pageConfig: GithubPageConfig = {
      filePath,
      mode,
    }

    await saveGithubSession({
      ...session,
      pageConfig,
    })
    await saveGithubPageConfigPreference(pageConfig)

    return NextResponse.json({
      ok: true,
      pageConfig,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to save page config.',
      },
      { status: 500 },
    )
  }
}
