'use client'

import Link from 'next/link'
import type { PostDraft } from '@/lib/types'

type Props = {
  drafts: PostDraft[]
  onDelete: (folderName: string) => void
}

export default function DraftList({ drafts, onDelete }: Props) {
  if (!drafts.length) {
    return <p style={{ color: '#666' }}>暂无本地草稿。</p>
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {drafts.map((draft) => (
        <div
          key={draft.folderName}
          style={{
            border: '1px solid #ddd',
            borderRadius: 12,
            padding: 16,
            display: 'grid',
            gap: 8,
          }}
        >
          <div style={{ fontWeight: 600 }}>
            {draft.frontmatter.title || '(未命名文章)'}
          </div>

          <div style={{ color: '#666', wordBreak: 'break-all' }}>
            {draft.folderName}
          </div>

          <div style={{ color: '#666' }}>
            {draft.frontmatter.date || '无日期'}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href={`/editor/${draft.folderName}`}>继续编辑</Link>

            <button
              type="button"
              onClick={() => onDelete(draft.folderName)}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'crimson',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              删除草稿
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}