import { NextRequest, NextResponse } from 'next/server'
import { getGithubFileBase64 } from '@/lib/github-read'
import { requireGithubRepoContext } from '@/lib/github-context'
import { isBundleMode, normalizePostContentMode } from '@/lib/site-settings'

function normalizeMimeType(path: string, mimeType: string | null) {
  if (mimeType?.trim()) {
    return mimeType.trim()
  }

  const lowerPath = path.toLowerCase()
  if (lowerPath.endsWith('.webp')) return 'image/webp'
  if (lowerPath.endsWith('.png')) return 'image/png'
  if (lowerPath.endsWith('.jpg') || lowerPath.endsWith('.jpeg')) return 'image/jpeg'
  if (lowerPath.endsWith('.gif')) return 'image/gif'
  if (lowerPath.endsWith('.avif')) return 'image/avif'
  if (lowerPath.endsWith('.svg')) return 'image/svg+xml'

  return 'application/octet-stream'
}

export async function GET(request: NextRequest) {
  try {
    const directAssetPath = request.nextUrl.searchParams.get('assetPath')?.trim() || ''
    const scope = request.nextUrl.searchParams.get('scope')?.trim() || ''
    const folderName = request.nextUrl.searchParams.get('folderName')?.trim() || ''
    const assetName = request.nextUrl.searchParams.get('assetName')?.trim() || ''
    const filePath = request.nextUrl.searchParams.get('filePath')?.trim() || ''
    const assetPath = (() => {
      if (directAssetPath) return directAssetPath

      if (scope === 'post' && folderName && assetName) {
        return null
      }

      if (scope === 'page' && filePath && assetName) {
        const directoryPath = filePath.includes('/')
          ? filePath.split('/').slice(0, -1).join('/')
          : ''
        return directoryPath ? `${directoryPath}/${assetName}` : assetName
      }

      return ''
    })()

    let resolvedAssetPath = assetPath
    if (resolvedAssetPath === null) {
      const { repoConfig } = await requireGithubRepoContext()
      const contentMode = normalizePostContentMode(
        request.nextUrl.searchParams.get('contentMode'),
      )
      resolvedAssetPath = isBundleMode(contentMode)
        ? `${repoConfig.postsBasePath}/${folderName}/${assetName}`
        : `${repoConfig.postsBasePath}/${assetName}`
    }

    if (!resolvedAssetPath) {
      return NextResponse.json({ ok: false, error: 'Missing assetPath.' }, { status: 400 })
    }

    const mimeType = normalizeMimeType(
      resolvedAssetPath,
      request.nextUrl.searchParams.get('mimeType'),
    )
    const contentBase64 = await getGithubFileBase64(resolvedAssetPath)
    const buffer = Buffer.from(contentBase64, 'base64')

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'private, max-age=300, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to load GitHub asset.',
      },
      { status: 500 },
    )
  }
}
