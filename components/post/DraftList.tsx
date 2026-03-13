'use client'

import Link from 'next/link'
import type { PostDraft } from '@/lib/types'

type Props = {
  drafts: PostDraft[]
  onDelete: (folderName: string) => void
}

const actionButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: 'var(--card)',
  color: 'var(--foreground)',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
  textDecoration: 'none',
}

export default function DraftList({ drafts, onDelete }: Props) {
  if (!drafts.length) {
    return <p style={{ color: 'var(--muted)' }}>暂无本地草稿。</p>
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {drafts.map((draft) => (
        <div
          key={draft.folderName}
          style={{
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 16,
            display: 'grid',
            gap: 8,
            background: 'var(--card-muted)',
          }}
        >
          <div style={{ fontWeight: 600 }}>
            {draft.frontmatter.title || '(未命名文章)'}
          </div>

          <div style={{ color: 'var(--muted)', wordBreak: 'break-all' }}>{draft.folderName}</div>

          <div style={{ color: 'var(--muted)' }}>{draft.frontmatter.date || '无日期'}</div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href={`/editor/${draft.folderName}`} style={actionButtonStyle}>
              继续编辑
            </Link>

            <button
              type="button"
              onClick={() => onDelete(draft.folderName)}
              style={{
                ...actionButtonStyle,
                border: '1px solid #ef4444',
                color: '#ef4444',
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
