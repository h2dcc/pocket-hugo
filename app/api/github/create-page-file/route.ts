import { NextRequest, NextResponse } from 'next/server'
import { commitGithubFiles, getExistingFileSha } from '@/lib/github-api'
import { requireGithubRepoContext } from '@/lib/github-context'
import {
  normalizePageFilePath,
  requireGithubSession,
  saveGithubPageConfigPreference,
  saveGithubSession,
  type GithubPageConfig,
} from '@/lib/github-session'
import { stringToBase64 } from '@/lib/markdown'

function normalizeFileName(value: string) {
  const trimmed = value.trim().replace(/^\/+|\/+$/g, '')
  if (!trimmed) return ''
  return /\.(md|markdown)$/i.test(trimmed) ? trimmed : `${trimmed}.md`
}

function buildPageTemplate(mode: GithubPageConfig['mode']) {
  if (mode === 'live') {
    return `---
title: "Moments"
slug: "moments"
---

## First Entry

> ${new Date().toISOString().slice(0, 16).replace('T', ' ')}

Write your first quick timeline entry here.
`
  }

  return `---
title: ""
slug: ""
---

`
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireGithubSession()
    const { token, repoConfig } = await requireGithubRepoContext()
    const body = (await request.json()) as {
      directoryPath?: string
      fileName?: string
      mode?: string
    }

    const directoryPath = normalizePageFilePath(String(body.directoryPath || ''))
    const fileName = normalizeFileName(String(body.fileName || ''))
    const mode: GithubPageConfig['mode'] = body.mode === 'live' ? 'live' : 'page'

    if (!fileName) {
      return NextResponse.json({ ok: false, error: 'fileName is required.' }, { status: 400 })
    }

    const filePath = directoryPath ? `${directoryPath}/${fileName}` : fileName
    const existingSha = await getExistingFileSha(filePath, token, {
      owner: repoConfig.owner,
      repo: repoConfig.repo,
      branch: repoConfig.branch,
    })

    if (existingSha) {
      return NextResponse.json(
        { ok: false, error: 'The target file already exists.' },
        { status: 400 },
      )
    }

    const contentBase64 = stringToBase64(buildPageTemplate(mode))
    const commit = await commitGithubFiles({
      files: [{ path: filePath, contentBase64 }],
      message: `Create page: ${filePath}`,
      token,
      context: {
        owner: repoConfig.owner,
        repo: repoConfig.repo,
        branch: repoConfig.branch,
      },
    })

    const pageConfig: GithubPageConfig = { filePath, mode }
    await saveGithubSession({
      ...session,
      pageConfig,
    })
    await saveGithubPageConfigPreference(pageConfig)

    return NextResponse.json({
      ok: true,
      filePath,
      pageConfig,
      commitSha: commit.sha,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to create page file.',
      },
      { status: 500 },
    )
  }
}

