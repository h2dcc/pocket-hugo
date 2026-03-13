import { DEFAULT_MAX_IMAGE_WIDTH, DEFAULT_WEBP_QUALITY } from './constants'
import { sanitizeAssetName } from './naming'
import type { DraftAsset } from './types'

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(img)
    }

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl)
      reject(err)
    }

    img.src = objectUrl
  })
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('图片导出失败'))
        return
      }
      resolve(blob)
    }, mimeType, quality)
  })
}

export async function compressImageToWebp(
  file: File,
  maxWidth: number = DEFAULT_MAX_IMAGE_WIDTH,
  quality: number = DEFAULT_WEBP_QUALITY,
): Promise<Blob> {
  const img = await loadImage(file)

  const targetWidth = Math.min(img.width, maxWidth)
  const targetHeight = Math.round((img.height * targetWidth) / img.width)

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('无法获取 canvas 上下文')
  }

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

  return canvasToBlob(canvas, 'image/webp', quality)
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('base64 转换失败'))
        return
      }

      const base64 = result.split(',')[1]
      resolve(base64)
    }

    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export function base64ToDataUrl(base64: string, mimeType: string): string {
  return `data:${mimeType};base64,${base64}`
}

export function restoreAssetPreviewUrls<
  T extends { contentBase64: string; mimeType: string; previewUrl: string },
>(assets: T[]): T[] {
  return assets.map((asset) => ({
    ...asset,
    previewUrl: asset.contentBase64
      ? base64ToDataUrl(asset.contentBase64, asset.mimeType)
      : asset.previewUrl || '',
  }))
}

export async function createDraftAssetFromImage(
  file: File,
  assetName: string,
  options?: {
    convertToWebp?: boolean
    maxWidth?: number
    quality?: number
  },
): Promise<DraftAsset> {
  const convertToWebp = options?.convertToWebp ?? true

  if (!convertToWebp) {
    const mimeType = file.type || 'application/octet-stream'
    const contentBase64 = await blobToBase64(file)
    const previewUrl = mimeType.startsWith('image/')
      ? base64ToDataUrl(contentBase64, mimeType)
      : ''

    return {
      name: sanitizeAssetName(assetName),
      mimeType,
      contentBase64,
      previewUrl,
    }
  }

  const webpBlob = await compressImageToWebp(
    file,
    options?.maxWidth ?? DEFAULT_MAX_IMAGE_WIDTH,
    options?.quality ?? DEFAULT_WEBP_QUALITY,
  )
  const contentBase64 = await blobToBase64(webpBlob)
  const previewUrl = base64ToDataUrl(contentBase64, 'image/webp')

  return {
    name: sanitizeAssetName(assetName.replace(/\.[^.]+$/i, '.webp')),
    mimeType: 'image/webp',
    contentBase64,
    previewUrl,
  }
}
