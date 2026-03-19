import { NextRequest, NextResponse } from 'next/server'
import { renderIndexMd, stringToBase64 } from '@/lib/markdown'
import { autoCommitPostToGithub, publishPostToGithub } from '@/lib/github'
import {
  DEFAULT_FRONTMATTER_PREFERENCES,
  normalizeFrontmatterPreferences,
} from '@/lib/frontmatter-preferences'
import {
  isBundleMode,
  normalizePostContentMode,
  normalizePostMarkdownFileName,
} from '@/lib/site-settings'
import { normalizeLocalizedMarkdownFiles, type PostDraft } from '@/lib/types'
import {
  getResolvedLocalRepoSession,
  isLocalRepoMode,
  removeLocalRepoPath,
  writeLocalRepoBase64,
  writeLocalRepoText,
} from '@/lib/local-repo'

function validateDraftForPublish(draft: PostDraft): string | null {
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
    const body = (await request.json()) as {
      mode?: 'publish' | 'auto_commit'
      draft: PostDraft
    } | PostDraft
    const mode =
      typeof body === 'object' && body && 'draft' in body && body.mode === 'auto_commit'
        ? 'auto_commit'
        : 'publish'
    const draft = (typeof body === 'object' && body && 'draft' in body
      ? body.draft
      : body) as PostDraft
    const contentMode = normalizePostContentMode(draft.contentMode)

    const validationError = mode === 'publish'
      ? validateDraftForPublish(draft)
      : (!draft.folderName?.trim() ? 'Missing folderName.' : null)
    if (validationError) {
      return NextResponse.json(
        { ok: false, error: validationError },
        { status: 400 },
      )
    }

    const markdownFileName = normalizePostMarkdownFileName(draft.markdownFileName)
    const localizedMarkdownFiles = normalizeLocalizedMarkdownFiles(
      draft.localizedMarkdownFiles,
    ).filter((file) => file.fileName.trim() && file.content.trim())
    const markdownContent = renderIndexMd(
      mode === 'auto_commit'
        ? {
            ...draft.frontmatter,
            draft: true,
          }
        : draft.frontmatter,
      draft.body,
      draft.frontmatterPreferences,
    )
    const markdownContentBase64 = stringToBase64(markdownContent)
    const changedAssets = isBundleMode(contentMode)
      ? draft.assets.filter(
          (asset) => typeof asset.contentBase64 === 'string' && asset.contentBase64.trim().length > 0,
        )
      : []

    const localizedFiles = localizedMarkdownFiles.map((file) => ({
      fileName: normalizePostMarkdownFileName(file.fileName),
      contentBase64: stringToBase64(file.content),
      content: file.content,
    }))
    const removedAssetNames = isBundleMode(contentMode)
      ? (draft.remoteAssetNames || []).filter(
          (name) => !draft.assets.some((asset) => asset.name === name),
        )
      : []

    const result = isLocalRepoMode()
      ? await (async () => {
          const { repoConfig } = await getResolvedLocalRepoSession()
          const postPath = isBundleMode(contentMode)
            ? `${repoConfig.postsBasePath}/${draft.folderName}`
            : repoConfig.postsBasePath
          const markdownPath = isBundleMode(contentMode)
            ? `${postPath}/${markdownFileName}`
            : `${repoConfig.postsBasePath}/${markdownFileName}`

          await writeLocalRepoText(markdownPath, markdownContent)

          for (const file of localizedFiles) {
            const filePath = isBundleMode(contentMode)
              ? `${postPath}/${file.fileName}`
              : `${repoConfig.postsBasePath}/${file.fileName}`
            await writeLocalRepoText(filePath, file.content)
          }

          for (const asset of changedAssets) {
            await writeLocalRepoBase64(`${postPath}/${asset.name}`, asset.contentBase64)
          }

          if (mode === 'publish') {
            for (const assetName of removedAssetNames) {
              await removeLocalRepoPath(`${postPath}/${assetName}`)
            }
          }

          const fileChanges = [
            { path: markdownPath, action: 'updated' as const },
            ...localizedFiles.map((file) => ({
              path: isBundleMode(contentMode)
                ? `${postPath}/${file.fileName}`
                : `${repoConfig.postsBasePath}/${file.fileName}`,
              action: 'updated' as const,
            })),
            ...changedAssets.map((asset) => ({
              path: `${postPath}/${asset.name}`,
              action: 'updated' as const,
            })),
            ...(mode === 'publish'
              ? removedAssetNames.map((assetName) => ({
                  path: `${postPath}/${assetName}`,
                  action: 'deleted' as const,
                }))
              : []),
          ]

          return {
            path: `${postPath}/`,
            commitCount: 1,
            fileCount: fileChanges.length,
            fileChanges,
            commitSha: '',
            repo: `local/${repoConfig.repo}`,
            branch: repoConfig.branch,
          }
        })()
      : mode === 'auto_commit'
        ? await autoCommitPostToGithub({
            folderName: draft.folderName,
            contentMode,
            markdownFileName,
            markdownContentBase64,
            localizedMarkdownFiles: localizedFiles.map((file) => ({
              fileName: file.fileName,
              contentBase64: file.contentBase64,
            })),
            assets: changedAssets.map((asset) => ({
              name: asset.name,
              contentBase64: asset.contentBase64,
            })),
          })
        : await publishPostToGithub({
            folderName: draft.folderName,
            contentMode,
            markdownFileName,
            markdownContentBase64,
            localizedMarkdownFiles: localizedFiles.map((file) => ({
              fileName: file.fileName,
              contentBase64: file.contentBase64,
            })),
            assets: changedAssets.map((asset) => ({
              name: asset.name,
              contentBase64: asset.contentBase64,
            })),
            removedAssetNames,
          })

    return NextResponse.json({
      ok: true,
      mode,
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
