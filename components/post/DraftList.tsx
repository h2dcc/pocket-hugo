'use client'

import Link from 'next/link'
import { useLanguage } from '@/lib/use-language'
import type { PostDraft } from '@/lib/types'

type Props = {
  drafts: PostDraft[]
  onDelete: (folderName: string) => void
}

const iconActionStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: 'var(--card)',
  color: 'var(--foreground)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  textDecoration: 'none',
  flexShrink: 0,
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 20H8L18.5 9.5C19.3 8.7 19.3 7.3 18.5 6.5L17.5 5.5C16.7 4.7 15.3 4.7 14.5 5.5L4 16V20Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M13.5 6.5L17.5 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 7H19M9 7V5H15V7M8 7L9 19H15L16 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function DraftList({ drafts, onDelete }: Props) {
  const { isEnglish } = useLanguage()

  if (!drafts.length) {
    return <p style={{ color: 'var(--muted)' }}>{isEnglish ? 'No local drafts yet.' : '暂无本地草稿。'}</p>
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
            background: 'var(--card-muted)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <Link
              href={`/editor/${draft.folderName}`}
              style={{
                display: 'grid',
                gap: 8,
                minWidth: 0,
                flex: 1,
                color: 'inherit',
                textDecoration: 'none',
              }}
              aria-label={isEnglish ? 'Open draft editor' : '打开草稿编辑页'}
              title={isEnglish ? 'Open draft editor' : '打开草稿编辑页'}
            >
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                {draft.frontmatter.title || (isEnglish ? '(Untitled article)' : '（未命名文章）')}
              </div>
              <div style={{ color: 'var(--muted)', wordBreak: 'break-all', fontSize: 13 }}>
                {draft.folderName}
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                {draft.frontmatter.date || (isEnglish ? 'No date' : '无日期')}
              </div>
            </Link>

            <div style={{ display: 'grid', gap: 8, flexShrink: 0 }}>
              <Link
                href={`/editor/${draft.folderName}`}
                style={iconActionStyle}
                aria-label={isEnglish ? 'Continue editing draft' : '继续编辑草稿'}
                title={isEnglish ? 'Continue editing draft' : '继续编辑草稿'}
              >
                <EditIcon />
              </Link>

              <button
                type="button"
                onClick={() => onDelete(draft.folderName)}
                style={{
                  ...iconActionStyle,
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  cursor: 'pointer',
                }}
                aria-label={isEnglish ? 'Delete draft' : '删除草稿'}
                title={isEnglish ? 'Delete draft' : '删除草稿'}
              >
                <TrashIcon />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
