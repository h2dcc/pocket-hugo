'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { buildFolderName } from '@/lib/naming'
import { createEmptyDraft } from '@/lib/post-template'
import { saveDraftToStorage } from '@/lib/draft-storage'

function getTodayPrefix() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getCurrentDateTime() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')

  const offsetMinutes = -now.getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMinutes)
  const offsetHours = String(Math.floor(abs / 60)).padStart(2, '0')
  const offsetMins = String(abs % 60).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offsetHours}:${offsetMins}`
}

function normalizeSlugSuffix(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function NewPostPage() {
  const router = useRouter()
  const [datePrefix, setDatePrefix] = useState(getTodayPrefix())
  const [slugSuffix, setSlugSuffix] = useState('')
  const [error, setError] = useState('')

  const normalizedSlug = useMemo(() => normalizeSlugSuffix(slugSuffix), [slugSuffix])

  const folderName = useMemo(() => {
    if (!normalizedSlug) return ''
    return buildFolderName(datePrefix, normalizedSlug)
  }, [datePrefix, normalizedSlug])

  function handleCreate() {
    if (!datePrefix) {
      setError('请填写日期前缀')
      return
    }
    if (!normalizedSlug) {
      setError('请填写 slug 后缀')
      return
    }

    const draft = createEmptyDraft(folderName, normalizedSlug, getCurrentDateTime())
    saveDraftToStorage(draft)
    router.push(`/editor/${folderName}`)
  }

  const labelTitleStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: '#374151',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    marginTop: 8,
    borderRadius: 10,
    border: '1px solid #d1d5db',
    fontSize: 16,
    background: '#fff',
  }

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <section
        style={{
          borderRadius: 20,
          padding: '24px 32px',
          background: 'linear-gradient(135deg, #111 0%, #333 100%)',
          color: '#fff',
          marginBottom: 32,
          textAlign: 'center',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>新建文章</h1>
        <p style={{ marginTop: 10, color: 'rgba(255,255,255,0.85)', fontSize: 16 }}>
          在这里创建并发布您的新文章。填写文章的相关信息后即可开始编辑内容。
        </p>
      </section>

      <div style={{ display: 'grid', gap: 16, marginTop: 24 }}>
        <label>
          <div style={labelTitleStyle}>日期前缀</div>
          <input
            type="text"
            value={datePrefix}
            onChange={(e) => setDatePrefix(e.target.value)}
            placeholder="2026-03-12"
            style={inputStyle}
          />
        </label>

        <label>
          <div style={labelTitleStyle}>Slug 后缀</div>
          <input
            type="text"
            value={slugSuffix}
            onChange={(e) => setSlugSuffix(e.target.value)}
            placeholder="three-body-problem-reading-notes"
            style={inputStyle}
          />
        </label>

        <div>
          <div style={labelTitleStyle}>最终文件夹名</div>
          <div
            style={{
              marginTop: 8,
              padding: 12,
              background: '#f5f5f5',
              borderRadius: 8,
              wordBreak: 'break-all',
              fontSize: 16,
            }}
          >
            {folderName || '请先输入 slug 后缀'}
          </div>
        </div>

        {error ? (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 8,
              background: '#fff1f0',
              color: '#cf1322',
              border: '1px solid #ffa39e',
              fontSize: 14,
            }}
          >
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleCreate}
          style={{
            padding: '12px 16px',
            cursor: 'pointer',
            background: '#1677ff',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 600,
            width: '100%',
            marginTop: 16,
          }}
        >
          创建文章
        </button>
      </div>
    </main>
  )
}