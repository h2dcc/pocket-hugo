import { DEFAULT_MAX_IMAGE_WIDTH, DEFAULT_WEBP_QUALITY } from './constants'
import { sanitizeAssetName } from './naming'
import type { DraftAsset } from './types'

let webpEncodePromise: Promise<
  (data: ImageData, options?: { quality?: number; alpha_quality?: number; method?: number }) => Promise<ArrayBuffer>
> | null = null

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

function extensionForMimeType(mimeType: string) {
  if (mimeType === 'image/webp') return '.webp'
  if (mimeType === 'image/jpeg') return '.jpg'
  if (mimeType === 'image/png') return '.png'
  return ''
}

function replaceAssetExtension(assetName: string, mimeType: string) {
  const extension = extensionForMimeType(mimeType)
  if (!extension) return sanitizeAssetName(assetName)
  return sanitizeAssetName(assetName.replace(/\.[^.]+$/i, extension))
}

function canvasHasTransparency(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const { data } = ctx.getImageData(0, 0, width, height)

  for (let index = 3; index < data.length; index += 4) {
    if (data[index] !== 255) {
      return true
    }
  }

  return false
}

async function getWebpEncoder() {
  if (!webpEncodePromise) {
    webpEncodePromise = import('@jsquash/webp')
      .then((module) => module.encode)
      .catch((error) => {
        webpEncodePromise = null
        throw error
      })
  }

  return webpEncodePromise
}

async function encodeCanvasToWebpWithJsquash(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  quality: number,
) {
  const encode = await getWebpEncoder()
  const imageData = ctx.getImageData(0, 0, width, height)
  const qualityPercent = Math.max(1, Math.min(100, Math.round(quality * 100)))
  const buffer = await encode(imageData, {
    quality: qualityPercent,
    alpha_quality: qualityPercent,
    method: 6,
  })

  return new Blob([buffer], { type: 'image/webp' })
}

export async function compressImageToWebp(
  file: File,
  maxWidth: number = DEFAULT_MAX_IMAGE_WIDTH,
  quality: number = DEFAULT_WEBP_QUALITY,
): Promise<{ blob: Blob; mimeType: string }> {
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

  try {
    const webpBlob = await encodeCanvasToWebpWithJsquash(ctx, targetWidth, targetHeight, quality)
    if (webpBlob.size > 0 && webpBlob.type === 'image/webp') {
      return {
        blob: webpBlob,
        mimeType: 'image/webp',
      }
    }
  } catch {
    // Fall back to browser-native encoders if the wasm codec cannot load.
  }

  const webpBlob = await canvasToBlob(canvas, 'image/webp', quality)
  if (webpBlob.type === 'image/webp') {
    return {
      blob: webpBlob,
      mimeType: 'image/webp',
    }
  }

  if (!canvasHasTransparency(ctx, targetWidth, targetHeight)) {
    const jpegBlob = await canvasToBlob(canvas, 'image/jpeg', quality)
    if (jpegBlob.type === 'image/jpeg') {
      return {
        blob: jpegBlob,
        mimeType: 'image/jpeg',
      }
    }
  }

  return {
    blob: webpBlob,
    mimeType: webpBlob.type || 'image/png',
  }
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

  const converted = await compressImageToWebp(
    file,
    options?.maxWidth ?? DEFAULT_MAX_IMAGE_WIDTH,
    options?.quality ?? DEFAULT_WEBP_QUALITY,
  )
  const contentBase64 = await blobToBase64(converted.blob)
  const previewUrl = base64ToDataUrl(contentBase64, converted.mimeType)

  return {
    name: replaceAssetExtension(assetName, converted.mimeType),
    mimeType: converted.mimeType,
    contentBase64,
    previewUrl,
  }
}
