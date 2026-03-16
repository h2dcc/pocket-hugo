import { NextRequest, NextResponse } from 'next/server'
import { requireGithubRepoContext } from '@/lib/github-context'
import { buildPostGithubAssetProxyUrl } from '@/lib/github-asset-url'
import { getGithubFileContent, listGithubDir } from '@/lib/github-read'
import { parseIndexMdToDraft } from '@/lib/post-parse'
import {
  isBundleMode,
  normalizePostContentMode,
  normalizePostMarkdownFileName,
} from '@/lib/site-settings'

function getImageMimeType(filename: string) {
  const lowerName = filename.toLowerCase()

  if (lowerName.endsWith('.webp')) return 'image/webp'
  if (lowerName.endsWith('.png')) return 'image/png'
  if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) return 'image/jpeg'
  if (lowerName.endsWith('.gif')) return 'image/gif'
  if (lowerName.endsWith('.avif')) return 'image/avif'
  if (lowerName.endsWith('.svg')) return 'image/svg+xml'

  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const folderName = String(body.folderName || '').trim()
    const contentMode = normalizePostContentMode(body.contentMode)
    const markdownFileName = normalizePostMarkdownFileName(body.markdownFileName)

    if (!folderName) {
      return NextResponse.json({ ok: false, error: 'Missing folderName.' }, { status: 400 })
    }

    const { repoConfig } = await requireGithubRepoContext()
    const basePath = repoConfig.postsBasePath
    const postPath = isBundleMode(contentMode) ? `${basePath}/${folderName}` : basePath

    const markdownContent = await getGithubFileContent(`${postPath}/${markdownFileName}`)
    const draftKey = isBundleMode(contentMode) ? folderName : markdownFileName
    const draft = parseIndexMdToDraft(draftKey, markdownContent, contentMode, markdownFileName)

    const remoteAssets = isBundleMode(contentMode)
      ? (await listGithubDir(postPath))
          .filter((item) => item.type === 'file')
          .map((item) => ({
            item,
            mimeType: getImageMimeType(item.name),
          }))
          .filter((entry) => Boolean(entry.mimeType))
          .map((item) => ({
            name: item.item.name,
            mimeType: item.mimeType as string,
            contentBase64: '',
            previewUrl: buildPostGithubAssetProxyUrl(
              folderName,
              item.item.name,
              contentMode,
              item.mimeType as string,
            ),
          }))
      : []

    return NextResponse.json({
      ok: true,
      draft: {
        ...draft,
        assets: remoteAssets,
        remoteAssetNames: remoteAssets.map((asset) => asset.name),
      },
      repo: `${repoConfig.owner}/${repoConfig.repo}`,
      branch: repoConfig.branch,
      basePath,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to load post.',
      },
      { status: 500 },
    )
  }
}
