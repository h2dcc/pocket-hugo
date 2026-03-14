'use client'

import { useId, useRef, useState } from 'react'
import { createDraftAssetFromImage } from '@/lib/image'
import {
  ensureUniqueAssetName,
  nextImageNameFromAssets,
  sanitizeAssetName,
} from '@/lib/naming'
import type { SiteSettings } from '@/lib/site-settings'
import { useLanguage } from '@/lib/use-language'
import type { DraftAsset } from '@/lib/types'

type Props = {
  existingAssets: DraftAsset[]
  settings: SiteSettings
  onUploaded: (asset: DraftAsset) => void
  onInsertMarkdown: (markdown: string) => void
}

export default function ImageUploader({
  existingAssets,
  settings,
  onUploaded,
  onInsertMarkdown,
}: Props) {
  const { isEnglish } = useLanguage()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const inputId = useId()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setError('')
    setUploading(true)

    try {
      const autoName = settings.imageConversionEnabled
        ? nextImageNameFromAssets(existingAssets)
        : ensureUniqueAssetName(sanitizeAssetName(file.name), existingAssets)

      const customName = ensureUniqueAssetName(
        sanitizeAssetName(
          settings.imageConversionEnabled
            ? file.name.replace(/\.[^.]+$/i, '.webp')
            : file.name,
        ),
        existingAssets,
      )

      const assetName = settings.autoImageNamingEnabled ? autoName : customName

      const asset = await createDraftAssetFromImage(file, assetName, {
        convertToWebp: settings.imageConversionEnabled,
        maxWidth: settings.imageMaxWidth,
        quality: settings.imageQuality,
      })

      onUploaded(asset)
      const altText = asset.name.replace(/\.[^.]+$/i, '')
      onInsertMarkdown(`![${altText}](${asset.name})`)
    } catch (err) {
      setError(err instanceof Error ? err.message : isEnglish ? 'Image processing failed.' : '图片处理失败')
    } finally {
      setUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        style={{ display: 'none' }}
      />

      <label
        htmlFor={inputId}
        style={{
          display: 'grid',
          gap: 8,
          padding: '16px 14px',
          borderRadius: 16,
          border: '1.5px dashed var(--border)',
          background: uploading ? 'var(--card)' : 'var(--card-muted)',
          cursor: uploading ? 'not-allowed' : 'pointer',
          textAlign: 'center',
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>
          {uploading
            ? isEnglish
              ? 'Processing image...'
              : '图片处理中...'
            : isEnglish
              ? 'Tap to Choose an Image'
              : '点按选择图片'}
        </span>
        <span style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
          {isEnglish ? 'Designed for easy mobile uploads.' : '支持手机直接点按上传。'}
          <br />
          {settings.imageConversionEnabled
            ? isEnglish
              ? 'Images will follow your current conversion settings.'
              : '当前会按你的偏好压缩并转换图片。'
            : isEnglish
              ? 'Images will keep their original format when uploaded.'
              : '当前会保留原图格式上传。'}
        </span>
      </label>

      {uploading ? (
        <div style={{ color: 'var(--muted)' }}>
          {settings.imageConversionEnabled
            ? isEnglish
              ? 'Compressing and converting image...'
              : '正在压缩并转换图片...'
            : isEnglish
              ? 'Reading original image...'
              : '正在读取原图...'}
        </div>
      ) : null}
      {error ? <div style={{ color: 'var(--danger)' }}>{error}</div> : null}
    </div>
  )
}
