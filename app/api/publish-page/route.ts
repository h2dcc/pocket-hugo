import { NextRequest, NextResponse } from 'next/server'
import { commitGithubFiles } from '@/lib/github-api'
import { requireGithubRepoContext } from '@/lib/github-context'
import { renderPageFile, type PageDraft } from '@/lib/page-file'
import { stringToBase64 } from '@/lib/markdown'

function joinPath(basePath: string, fileName: string) {
  const trimmedBase = basePath.replace(/^\/+|\/+$/g, '')
  const trimmedName = fileName.replace(/^\/+|\/+$/g, '')
  return trimmedBase ? `${trimmedBase}/${trimmedName}` : trimmedName
}

export async function POST(request: NextRequest) {
  try {
    const draft = (await request.json()) as PageDraft

    if (!draft.filePath?.trim()) {
      return NextResponse.json({ ok: false, error: 'Missing filePath.' }, { status: 400 })
    }

    const fileContent = renderPageFile(draft)
    const contentBase64 = stringToBase64(fileContent)
    const { token, repoConfig } = await requireGithubRepoContext()
    const pageDirectory = draft.filePath.includes('/')
      ? draft.filePath.split('/').slice(0, -1).join('/')
      : ''
    const assetFiles = (draft.assets || [])
      .filter((asset) => asset.contentBase64)
      .map((asset) => ({
        path: joinPath(pageDirectory, asset.name),
        contentBase64: asset.contentBase64,
      }))
    const deletePaths = (draft.remoteAssetNames || [])
      .filter((name) => !(draft.assets || []).some((asset) => asset.name === name))
      .map((name) => joinPath(pageDirectory, name))
    const files = [
      {
        path: draft.filePath,
        contentBase64,
      },
      ...assetFiles,
    ]

    const commit = await commitGithubFiles({
      files,
      deletePaths,
      message: `Publish page: ${draft.filePath}`,
      token,
      context: {
        owner: repoConfig.owner,
        repo: repoConfig.repo,
        branch: repoConfig.branch,
      },
    })

    return NextResponse.json({
      ok: true,
      path: draft.filePath,
      fileCount: files.length,
      commitCount: 1,
      commitSha: commit.sha,
      repo: `${repoConfig.owner}/${repoConfig.repo}`,
      branch: repoConfig.branch,
      fileChanges: [
        ...files.map((file) => ({ path: file.path, action: 'updated' as const })),
        ...deletePaths.map((path) => ({ path, action: 'deleted' as const })),
      ],
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to publish page.',
      },
      { status: 500 },
    )
  }
}
