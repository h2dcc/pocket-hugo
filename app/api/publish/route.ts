import { NextRequest, NextResponse } from 'next/server'
import { renderIndexMd, stringToBase64 } from '@/lib/markdown'
import { publishPostToGithub } from '@/lib/github'
import {
  DEFAULT_FRONTMATTER_PREFERENCES,
  normalizeFrontmatterPreferences,
} from '@/lib/frontmatter-preferences'
import {
  isBundleMode,
  normalizePostContentMode,
  normalizePostMarkdownFileName,
} from '@/lib/site-settings'
import type { PostDraft } from '@/lib/types'

function validateDraft(draft: PostDraft): string | null {
  const preferences = normalizeFrontmatterPreferences(
    draft.frontmatterPreferences || DEFAULT_FRONTMATTER_PREFERENCES,
  )
  if (!draft.folderName?.trim()) return 'Missing folderName.'
  if (!draft.frontmatter.title?.trim()) return 'Title is required.'
  if (preferences.slugFieldEnabled && !draft.frontmatter.slug?.trim()) return 'Slug is required.'
  if (!draft.frontmatter.date?.trim()) return 'Date is required.'
  return null
}

export async function POST(request: NextRequest) {
  try {
    const draft = (await request.json()) as PostDraft
    const contentMode = normalizePostContentMode(draft.contentMode)

    const validationError = validateDraft(draft)
    if (validationError) {
      return NextResponse.json(
        { ok: false, error: validationError },
        { status: 400 },
      )
    }

    const markdownFileName = normalizePostMarkdownFileName(draft.markdownFileName)
    const markdownContent = renderIndexMd(
      draft.frontmatter,
      draft.body,
      draft.frontmatterPreferences,
    )
    const markdownContentBase64 = stringToBase64(markdownContent)
    const changedAssets = isBundleMode(contentMode)
      ? draft.assets.filter(
      (asset) => typeof asset.contentBase64 === 'string' && asset.contentBase64.trim().length > 0,
        )
      : []
    const removedAssetNames = isBundleMode(contentMode)
      ? (draft.remoteAssetNames || []).filter(
          (name) => !draft.assets.some((asset) => asset.name === name),
        )
      : []

    const result = await publishPostToGithub({
      folderName: draft.folderName,
      contentMode,
      markdownFileName,
      markdownContentBase64,
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
