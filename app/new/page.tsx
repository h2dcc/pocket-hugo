'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SiteFooter, SiteHeader } from '@/components/layout/SiteChrome'
import { buildFolderName } from '@/lib/naming'
import { createEmptyDraft } from '@/lib/post-template'
import { saveDraftToStorage } from '@/lib/draft-storage'
import { useLanguage } from '@/lib/use-language'

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
  const { isEnglish } = useLanguage()
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
      setError(isEnglish ? 'Please enter a date prefix.' : '请填写日期前缀')
      return
    }
    if (!normalizedSlug) {
      setError(isEnglish ? 'Please enter a slug suffix.' : '请填写 slug 后缀')
      return
    }

    const draft = createEmptyDraft(folderName, normalizedSlug, getCurrentDateTime())
    saveDraftToStorage(draft)
    router.push(`/editor/${folderName}`)
  }

  const labelTitleStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--foreground)',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    marginTop: 8,
    borderRadius: 10,
    border: '1px solid var(--border)',
    fontSize: 16,
    background: 'var(--card)',
    color: 'var(--foreground)',
  }

  return (
    <main style={{ padding: 'clamp(16px, 3vw, 28px)', maxWidth: 1080, margin: '0 auto' }}>
      <SiteHeader />

      <div style={{ display: 'grid', gap: 16, marginTop: 24 }}>
        <div style={{ color: 'var(--foreground)', fontSize: 18, fontWeight: 700 }}>
          {isEnglish ? 'Create New Post' : '新建文章'}
        </div>
        <div style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
          {isEnglish
            ? 'Set up the basic post info first, then continue writing and uploading images in the editor.'
            : '先填写文章基础信息，创建后再进入编辑页继续写作和上传图片。'}
        </div>
        <label>
          <div style={labelTitleStyle}>{isEnglish ? 'Date Prefix' : '日期前缀'}</div>
          <input
            type="text"
            value={datePrefix}
            onChange={(e) => setDatePrefix(e.target.value)}
            placeholder="2026-03-12"
            style={inputStyle}
          />
        </label>

        <label>
          <div style={labelTitleStyle}>{isEnglish ? 'Slug Suffix' : 'Slug 后缀'}</div>
          <input
            type="text"
            value={slugSuffix}
            onChange={(e) => {
              setSlugSuffix(normalizeSlugSuffix(e.target.value))
              setError('')
            }}
            placeholder="three-body-problem-reading-notes"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            style={inputStyle}
          />
          <div style={{ marginTop: 8, fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
            {isEnglish
              ? 'An English slug is recommended. Invalid URL or file-path symbols are removed automatically, keeping only lowercase letters, numbers, and `-`.'
              : '建议使用英文 slug。系统会自动过滤不适合网页 URL 和文件路径的符号，只保留小写字母、数字和 `-`。'}
          </div>
          {slugSuffix && slugSuffix !== normalizedSlug ? (
            <div style={{ marginTop: 6, fontSize: 13, color: '#1677ff' }}>
              {isEnglish ? 'Normalized to: ' : '已自动规范为：'}
              {normalizedSlug}
            </div>
          ) : null}
        </label>

        <div>
          <div style={labelTitleStyle}>{isEnglish ? 'Final Folder Name' : '最终文件夹名'}</div>
          <div
            style={{
              marginTop: 8,
              padding: 12,
              background: 'var(--card-muted)',
              borderRadius: 12,
              wordBreak: 'break-all',
              fontSize: 16,
              border: '1px solid var(--border)',
            }}
          >
            {folderName || (isEnglish ? 'Enter a slug suffix first.' : '请先输入 slug 后缀')}
          </div>
        </div>

        {error ? (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 10,
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
            padding: '14px 16px',
            cursor: 'pointer',
            background: 'var(--accent)',
            color: 'var(--accent-contrast)',
            border: 'none',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 700,
            width: '100%',
            marginTop: 10,
          }}
        >
          {isEnglish ? 'Create Post' : '创建文章'}
        </button>
      </div>

      <SiteFooter />
    </main>
  )
}
