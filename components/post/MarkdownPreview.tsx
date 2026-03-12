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
    <div style={{ lineHeight: 1.7 }}>
      <ReactMarkdown
        components={{
          img: ({ src = '', alt = '' }) => {
            const asset = assetMap.get(src)
            const finalSrc = asset?.previewUrl || src

            return (
              <img
                src={finalSrc}
                alt={alt}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  borderRadius: 8,
                  margin: '12px 0',
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