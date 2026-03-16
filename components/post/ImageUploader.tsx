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

const MAX_BATCH_UPLOAD_COUNT = 9

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
  const [progressText, setProgressText] = useState('')

  function getNextAssetName(file: File, assets: DraftAsset[]) {
    const autoName = settings.imageConversionEnabled
      ? nextImageNameFromAssets(assets)
      : ensureUniqueAssetName(sanitizeAssetName(file.name), assets)

    const customName = ensureUniqueAssetName(
      sanitizeAssetName(
        settings.imageConversionEnabled
          ? file.name.replace(/\.[^.]+$/i, '.webp')
          : file.name,
      ),
      assets,
    )

    return settings.autoImageNamingEnabled ? autoName : customName
  }

  function resetInput() {
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  function waitForNextTurn() {
    return new Promise<void>((resolve) => {
      window.setTimeout(resolve, 0)
    })
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files || []).filter((file) =>
      file.type.startsWith('image/'),
    )
    if (!selectedFiles.length) return

    const files = selectedFiles.slice(0, MAX_BATCH_UPLOAD_COUNT)

    setError('')
    setUploading(true)
    setProgressText('')

    try {
      const workingAssets = [...existingAssets]
      const markdowns: string[] = []

      if (selectedFiles.length > MAX_BATCH_UPLOAD_COUNT) {
        setError(
          isEnglish
            ? `You selected ${selectedFiles.length} images. Only the first ${MAX_BATCH_UPLOAD_COUNT} will be processed this time.`
            : `你选择了 ${selectedFiles.length} 张图片，本次只会处理前 ${MAX_BATCH_UPLOAD_COUNT} 张。`,
        )
      }

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index]

        setProgressText(
          isEnglish
            ? `Processing image ${index + 1} of ${files.length}...`
            : `正在处理第 ${index + 1}/${files.length} 张图片...`,
        )

        const assetName = getNextAssetName(file, workingAssets)
        const asset = await createDraftAssetFromImage(file, assetName, {
          convertToWebp: settings.imageConversionEnabled,
          maxWidth: settings.imageMaxWidth,
          quality: settings.imageQuality,
        })
        const finalAsset = {
          ...asset,
          name: ensureUniqueAssetName(asset.name, workingAssets),
        }

        workingAssets.push(finalAsset)
        onUploaded(finalAsset)

        const altText = finalAsset.name.replace(/\.[^.]+$/i, '')
        markdowns.push(`![${altText}](${finalAsset.name})`)

        // Process files sequentially to keep peak memory usage lower on iPhone and other mobile browsers.
        await waitForNextTurn()
      }

      if (markdowns.length) {
        onInsertMarkdown(markdowns.join('\n'))
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEnglish
            ? 'Image processing failed.'
            : '图片处理失败。',
      )
    } finally {
      setUploading(false)
      setProgressText('')
      resetInput()
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
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
              ? 'Processing images...'
              : '图片处理中...'
            : isEnglish
              ? 'Tap to Choose Images'
              : '点击选择图片'}
        </span>
        <span style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
          {isEnglish
            ? `Upload up to ${MAX_BATCH_UPLOAD_COUNT} images at a time. They will be processed one by one for better mobile stability.`
            : `一次最多上传 ${MAX_BATCH_UPLOAD_COUNT} 张图片，并会逐张处理以提升手机端稳定性。`}
          <br />
          {settings.imageConversionEnabled
            ? isEnglish
              ? 'Images will follow your current conversion settings.'
              : '图片会按你当前的转换设置处理。'
            : isEnglish
              ? 'Images will keep their original format when uploaded.'
              : '图片上传时会保留原始格式。'}
        </span>
      </label>

      {uploading ? (
        <div style={{ color: 'var(--muted)' }}>
          {progressText ||
            (settings.imageConversionEnabled
              ? isEnglish
                ? 'Compressing and converting images...'
                : '正在压缩并转换图片...'
              : isEnglish
                ? 'Reading original images...'
                : '正在读取原始图片...')}
        </div>
      ) : null}
      {error ? <div style={{ color: 'var(--danger)' }}>{error}</div> : null}
    </div>
  )
}
