'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SiteFooter, SiteHeader } from '@/components/layout/SiteChrome'
import { buildFolderName } from '@/lib/naming'
import { createEmptyDraft } from '@/lib/post-template'
import { loadSiteSettingsFromStorage } from '@/lib/site-settings'
import { saveDraftToStorage } from '@/lib/draft-storage'
import { useLanguage } from '@/lib/use-language'
import { useRequireAuth } from '@/lib/use-require-auth'

function getDatePartsWithOffset(offsetHours: number) {
  const now = new Date()
  const utcMillis = now.getTime() + now.getTimezoneOffset() * 60_000
  const targetMillis = utcMillis + offsetHours * 60 * 60_000
  const target = new Date(targetMillis)
  const year = target.getUTCFullYear()
  const month = String(target.getUTCMonth() + 1).padStart(2, '0')
  const day = String(target.getUTCDate()).padStart(2, '0')
  const hours = String(target.getUTCHours()).padStart(2, '0')
  const minutes = String(target.getUTCMinutes()).padStart(2, '0')
  const seconds = String(target.getUTCSeconds()).padStart(2, '0')
  return { year, month, day, hours, minutes, seconds }
}

function getTodayPrefixByOffset(offsetHours: number) {
  const { year, month, day } = getDatePartsWithOffset(offsetHours)
  return `${year}-${month}-${day}`
}

function getCurrentDateTime(offsetHours: number) {
  const { year, month, day, hours, minutes, seconds } = getDatePartsWithOffset(offsetHours)
  const sign = offsetHours >= 0 ? '+' : '-'
  const absOffset = Math.abs(offsetHours)
  const offsetHourText = String(absOffset).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offsetHourText}:00`
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
  const checkingAuth = useRequireAuth('/new')
  const [useDatePrefix, setUseDatePrefix] = useState(true)
  const [datePrefix, setDatePrefix] = useState(() =>
    getTodayPrefixByOffset(loadSiteSettingsFromStorage().timezoneOffsetHours ?? 8),
  )
  const [slugInput, setSlugInput] = useState('')
  const [error, setError] = useState('')

  const normalizedSlug = useMemo(() => normalizeSlugSuffix(slugInput), [slugInput])

  const folderName = useMemo(() => {
    if (!normalizedSlug) return ''
    return useDatePrefix ? buildFolderName(datePrefix, normalizedSlug) : normalizedSlug
  }, [datePrefix, normalizedSlug, useDatePrefix])

  function handleCreate() {
    if (useDatePrefix && !datePrefix) {
      setError(isEnglish ? 'Please enter a date prefix.' : '请填写日期前缀')
      return
    }
    if (!normalizedSlug) {
      setError(isEnglish ? 'Please enter a slug.' : '请填写 slug')
      return
    }

    const settings = loadSiteSettingsFromStorage()
    const timezoneOffsetHours = settings.timezoneOffsetHours ?? 8
    const draft = createEmptyDraft(
      folderName,
      normalizedSlug,
      getCurrentDateTime(timezoneOffsetHours),
      settings.frontmatterPreferences,
    )
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
    fontSize: 14,
    background: 'var(--card)',
    color: 'var(--foreground)',
  }

  if (checkingAuth) {
    return null
  }

  return (
    <main style={{ padding: 'clamp(16px, 3vw, 28px)', maxWidth: 1080, margin: '0 auto' }}>
      <SiteHeader />

      <div style={{ display: 'grid', gap: 16, marginTop: 24 }}>
        <div style={{ color: 'var(--foreground)', fontSize: 14, fontWeight: 700 }}>
          {isEnglish ? 'Create New Post' : '新建文章'}
        </div>
        <div style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
          {isEnglish
            ? 'Set up the basic post info first, then continue writing and uploading images in the editor.'
            : '先填写文章基础信息，创建后再进入编辑页继续写作和上传图片。'}
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          <div style={labelTitleStyle}>{isEnglish ? 'Use Date Prefix' : '启用日期前缀'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button
              type="button"
              onClick={() => setUseDatePrefix(true)}
              style={{
                padding: '11px 12px',
                borderRadius: 10,
                border: useDatePrefix ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: useDatePrefix ? 'var(--accent)' : 'var(--card)',
                color: useDatePrefix ? 'var(--accent-contrast)' : 'var(--foreground)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {isEnglish ? 'Enabled' : '启用'}
            </button>
            <button
              type="button"
              onClick={() => setUseDatePrefix(false)}
              style={{
                padding: '11px 12px',
                borderRadius: 10,
                border: !useDatePrefix ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: !useDatePrefix ? 'var(--accent)' : 'var(--card)',
                color: !useDatePrefix ? 'var(--accent-contrast)' : 'var(--foreground)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {isEnglish ? 'Disabled' : '关闭'}
            </button>
          </div>
        </div>

        {useDatePrefix ? (
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
        ) : null}

        <label>
          <div style={labelTitleStyle}>{useDatePrefix ? (isEnglish ? 'Slug Suffix' : 'Slug 后缀') : (isEnglish ? 'Full Slug' : '完整 Slug')}</div>
          <input
            type="text"
            value={slugInput}
            onChange={(e) => {
              setSlugInput(normalizeSlugSuffix(e.target.value))
              setError('')
            }}
            placeholder={useDatePrefix ? 'three-body-problem-reading-notes' : 'my-post-slug'}
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
          {slugInput && slugInput !== normalizedSlug ? (
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
              fontSize: 14,
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
            fontSize: 14,
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
