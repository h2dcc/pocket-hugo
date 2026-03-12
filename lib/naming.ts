export function buildFolderName(datePrefix: string, slugSuffix: string) {
  return `${datePrefix}-${slugSuffix}`
}

export function nextImageNameFromAssets(
  assets: Array<{ name: string }>,
) {
  const maxNumber = assets.reduce((max, asset) => {
    const match = asset.name.match(/^(\d+)\.webp$/i)
    if (!match) return max

    const num = Number(match[1])
    if (Number.isNaN(num)) return max

    return Math.max(max, num)
  }, 0)

  return `${maxNumber + 1}.webp`
}