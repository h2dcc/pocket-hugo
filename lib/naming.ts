export function buildFolderName(datePrefix: string, slugSuffix: string) {
  return `${datePrefix}-${slugSuffix}`
}

export function nextImageNameFromAssets(assets: Array<{ name: string }>) {
  const maxNumber = assets.reduce((max, asset) => {
    const match = asset.name.match(/^(\d+)\.(?:webp|jpg|jpeg|png|gif|avif)$/i)
    if (!match) return max

    const num = Number(match[1])
    if (Number.isNaN(num)) return max

    return Math.max(max, num)
  }, 0)

  return `${maxNumber + 1}.webp`
}

export function sanitizeAssetName(filename: string) {
  const normalized = filename
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return normalized || 'asset'
}

export function ensureUniqueAssetName(
  assetName: string,
  assets: Array<{ name: string }>,
) {
  const existingNames = new Set(assets.map((asset) => asset.name.toLowerCase()))
  if (!existingNames.has(assetName.toLowerCase())) {
    return assetName
  }

  const lastDotIndex = assetName.lastIndexOf('.')
  const baseName = lastDotIndex >= 0 ? assetName.slice(0, lastDotIndex) : assetName
  const extension = lastDotIndex >= 0 ? assetName.slice(lastDotIndex) : ''

  let index = 2
  let candidate = `${baseName}-${index}${extension}`

  while (existingNames.has(candidate.toLowerCase())) {
    index += 1
    candidate = `${baseName}-${index}${extension}`
  }

  return candidate
}
