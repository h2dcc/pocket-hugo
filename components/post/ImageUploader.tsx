'use client'

import { useRef, useState } from 'react'
import { createDraftAssetFromImage } from '@/lib/image'
import { nextImageNameFromAssets } from '@/lib/naming'
import type { DraftAsset } from '@/lib/types'

type Props = {
  existingAssets: DraftAsset[]
  onUploaded: (asset: DraftAsset) => void
  onInsertMarkdown: (markdown: string) => void
}

export default function ImageUploader({
  existingAssets,
  onUploaded,
  onInsertMarkdown,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    console.log('existingAssets.length =', existingAssets.length)

    setError('')
    setUploading(true)

    try {
      const assetName = nextImageNameFromAssets(existingAssets)
      const asset = await createDraftAssetFromImage(file, assetName)

      onUploaded(asset)
      const altText = asset.name.replace(/\.webp$/i, '')
      onInsertMarkdown(`![${altText}](${asset.name})`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '图片处理失败')
    } finally {
      setUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </div>

      {uploading ? <div>正在压缩并转换为 webp...</div> : null}
      {error ? <div style={{ color: 'crimson' }}>{error}</div> : null}
    </div>
  )
}