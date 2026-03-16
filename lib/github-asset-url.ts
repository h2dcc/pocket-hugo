import { type PostContentMode } from '@/lib/site-settings'

export function buildGithubAssetProxyUrl(path: string, mimeType?: string) {
  const params = new URLSearchParams({
    assetPath: path,
  })

  if (mimeType?.trim()) {
    params.set('mimeType', mimeType)
  }

  return `/api/github?${params.toString()}`
}

export function buildPostGithubAssetProxyUrl(
  folderName: string,
  assetName: string,
  contentMode: PostContentMode | undefined,
  mimeType?: string,
) {
  const params = new URLSearchParams({
    scope: 'post',
    folderName,
    assetName,
    contentMode: contentMode || 'bundle_single',
  })

  if (mimeType?.trim()) {
    params.set('mimeType', mimeType)
  }

  return `/api/github?${params.toString()}`
}

export function buildPageGithubAssetProxyUrl(
  filePath: string,
  assetName: string,
  mimeType?: string,
) {
  const params = new URLSearchParams({
    scope: 'page',
    filePath,
    assetName,
  })

  if (mimeType?.trim()) {
    params.set('mimeType', mimeType)
  }

  return `/api/github?${params.toString()}`
}
