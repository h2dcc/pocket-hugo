import { NextRequest, NextResponse } from 'next/server'
import { getGithubFileContent } from '@/lib/github-read'
import { createEmptyPageDraft, parsePageFileContent, type PageEditorMode } from '@/lib/page-file'
import { requireGithubRepoContext } from '@/lib/github-context'
import { listGithubDir } from '@/lib/github-read'

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
    const body = (await request.json()) as {
      filePath?: string
      mode?: string
    }
    const filePath = String(body.filePath || '').trim()
    const mode: PageEditorMode = body.mode === 'live' ? 'live' : 'page'

    if (!filePath) {
      return NextResponse.json({ ok: false, error: 'Missing filePath.' }, { status: 400 })
    }

    const { repoConfig } = await requireGithubRepoContext()
    const directoryPath = filePath.includes('/') ? filePath.split('/').slice(0, -1).join('/') : ''

    try {
      const content = await getGithubFileContent(filePath)
      const draft = parsePageFileContent(filePath, mode, content)
      const dirItems = await listGithubDir(directoryPath)
      const remoteAssets = dirItems
        .filter((item) => item.type === 'file')
        .map((item) => ({
          item,
          mimeType: getImageMimeType(item.name),
        }))
        .filter((entry) => Boolean(entry.mimeType))
        .map((entry) => ({
          name: entry.item.name,
          mimeType: entry.mimeType as string,
          contentBase64: '',
          previewUrl: entry.item.download_url || '',
        }))

      return NextResponse.json({
        ok: true,
        draft: {
          ...draft,
          assets: remoteAssets,
          remoteAssetNames: remoteAssets.map((asset) => asset.name),
        },
        repo: `${repoConfig.owner}/${repoConfig.repo}`,
        branch: repoConfig.branch,
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'Not Found') {
        return NextResponse.json({
          ok: true,
          draft: createEmptyPageDraft(filePath, mode),
          repo: `${repoConfig.owner}/${repoConfig.repo}`,
          branch: repoConfig.branch,
        })
      }

      throw error
    }
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to load page.',
      },
      { status: 500 },
    )
  }
}
