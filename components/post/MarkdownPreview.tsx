'use client'

import ReactMarkdown from 'react-markdown'
import type { DraftAsset } from '@/lib/types'

type Props = {
  body: string
  assets: DraftAsset[]
}

export default function MarkdownPreview({ body, assets }: Props) {
  const assetMap = new Map(assets.map((asset) => [asset.name, asset]))

  return (
    <div className="markdown-preview">
      <ReactMarkdown
        components={{
          img: ({ src = '', alt = '' }) => {
            const normalizedSrc = typeof src === 'string' ? src : ''
            const asset = assetMap.get(normalizedSrc)
            const finalSrc = asset?.previewUrl || normalizedSrc

            return (
              <img
                src={finalSrc}
                alt={alt}
                style={{
                  borderRadius: 8,
                  margin: '12px 0',
                  width: '100%',
                }}
              />
            )
          },
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  )
}
