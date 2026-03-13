import { NextRequest, NextResponse } from 'next/server'
import { renderIndexMd, stringToBase64 } from '@/lib/markdown'
import { publishPostToGithub } from '@/lib/github'
import type { PostDraft } from '@/lib/types'

function validateDraft(draft: PostDraft): string | null {
  if (!draft.folderName?.trim()) return 'Missing folderName.'
  if (!draft.frontmatter.title?.trim()) return 'Title is required.'
  if (!draft.frontmatter.slug?.trim()) return 'Slug is required.'
  if (!draft.frontmatter.date?.trim()) return 'Date is required.'
  return null
}

export async function POST(request: NextRequest) {
  try {
    const draft = (await request.json()) as PostDraft

    const validationError = validateDraft(draft)
    if (validationError) {
      return NextResponse.json(
        { ok: false, error: validationError },
        { status: 400 },
      )
    }

    const indexMd = renderIndexMd(draft.frontmatter, draft.body)
    const indexMdBase64 = stringToBase64(indexMd)
    const changedAssets = draft.assets.filter(
      (asset) => typeof asset.contentBase64 === 'string' && asset.contentBase64.trim().length > 0,
    )
    const removedAssetNames = (draft.remoteAssetNames || []).filter(
      (name) => !draft.assets.some((asset) => asset.name === name),
    )

    const result = await publishPostToGithub({
      folderName: draft.folderName,
      indexMdBase64,
      assets: changedAssets.map((asset) => ({
        name: asset.name,
        contentBase64: asset.contentBase64,
      })),
      removedAssetNames,
    })

    return NextResponse.json({
      ok: true,
      path: result.path,
      commitCount: result.commitCount,
      fileCount: result.fileCount,
      fileChanges: result.fileChanges,
      commitSha: result.commitSha,
      repo: result.repo,
      branch: result.branch,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Publish failed.',
      },
      { status: 500 },
    )
  }
}
