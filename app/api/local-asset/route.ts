import { NextRequest, NextResponse } from 'next/server'
import {
  buildLocalPostAssetPath,
  getResolvedLocalRepoSession,
  isLocalRepoMode,
  readLocalRepoBase64,
} from '@/lib/local-repo'
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
    if (!isLocalRepoMode()) {
      return NextResponse.json({ ok: false, error: 'Local repository mode is disabled.' }, { status: 404 })
    }
    const localSession = await getResolvedLocalRepoSession()

    const directAssetPath = request.nextUrl.searchParams.get('assetPath')?.trim() || ''
    const scope = request.nextUrl.searchParams.get('scope')?.trim() || ''
    const folderName = request.nextUrl.searchParams.get('folderName')?.trim() || ''
    const assetName = request.nextUrl.searchParams.get('assetName')?.trim() || ''
    const contentMode = normalizePostContentMode(
      request.nextUrl.searchParams.get('contentMode'),
    )
    const assetPath = (() => {
      if (directAssetPath) return directAssetPath
      if (scope === 'post' && folderName && assetName) {
        return buildLocalPostAssetPath(
          folderName,
          assetName,
          contentMode,
          localSession.repoConfig.postsBasePath,
        )
      }
      if (scope === 'post' && assetName && !isBundleMode(contentMode)) {
        return buildLocalPostAssetPath(
          folderName,
          assetName,
          contentMode,
          localSession.repoConfig.postsBasePath,
        )
      }
      return ''
    })()

    if (!assetPath) {
      return NextResponse.json({ ok: false, error: 'Missing assetPath.' }, { status: 400 })
    }

    const mimeType = normalizeMimeType(assetPath, request.nextUrl.searchParams.get('mimeType'))
    const contentBase64 = await readLocalRepoBase64(assetPath)
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
        error: error instanceof Error ? error.message : 'Failed to load local asset.',
      },
      { status: 500 },
    )
  }
}
