'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SiteFooter, SiteHeader } from '@/components/layout/SiteChrome'
import ImageUploader from '@/components/post/ImageUploader'
import MarkdownPreview from '@/components/post/MarkdownPreview'
import ThemeToggle from '@/components/theme/ThemeToggle'
import IconButton from '@/components/ui/IconButton'
import SectionToggleButton from '@/components/ui/SectionToggleButton'
import { saveDraftToStorage } from '@/lib/draft-storage'
import {
  loadPageDraftFromStorage,
  removePageDraftFromStorage,
  savePageDraftToStorage,
} from '@/lib/page-draft-storage'
import {
  createQuickEntry,
  renderLiveEntries,
  type PageDraft,
  type QuickEntry,
} from '@/lib/page-file'
import {
  DEFAULT_SITE_SETTINGS,
  loadSiteSettingsFromStorage,
  type SiteSettings,
} from '@/lib/site-settings'
import { createEmptyDraft } from '@/lib/post-template'
import { useLanguage } from '@/lib/use-language'
import { useRequireAuth } from '@/lib/use-require-auth'
import type { DraftAsset } from '@/lib/types'

type PageConfigResponse = {
  ok: boolean
  pageConfig?: { filePath: string; mode: 'page' | 'live' } | null
  error?: string
}

type SlashTarget = 'entry' | 'body'

type SlashCommand = {
  key: string
  label: string
  keywords: string[]
  markdown: string
}

type SlashState = {
  open: boolean
  target: SlashTarget
  query: string
  start: number
  end: number
}

function isImageMarkdown(markdown: string) {
  const lines = markdown
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  return lines.length > 0 && lines.every((line) => /^!\[[^\]]*]\([^)]+\)$/.test(line))
}

function buildStandaloneImageBlock(markdown: string) {
  return `\n${markdown.trim()}\n`
}

function normalizeFolderName(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\\/]+/g, '-')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 7V5.8C9 4.81 9.81 4 10.8 4H13.2C14.19 4 15 4.81 15 5.8V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7.5 7L8.2 18.1C8.27 19.14 9.14 19.95 10.19 19.95H13.81C14.86 19.95 15.73 19.14 15.8 18.1L16.5 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

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

function getCurrentDateTime(offsetHours: number) {
  const { year, month, day, hours, minutes, seconds } = getDatePartsWithOffset(offsetHours)
  const sign = offsetHours >= 0 ? '+' : '-'
  const absOffset = Math.abs(offsetHours)
  const offsetHourText = String(absOffset).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offsetHourText}:00`
}

function estimateSlashMenuPosition(
  textarea: HTMLTextAreaElement,
  value: string,
  cursor: number,
) {
  const rect = textarea.getBoundingClientRect()
  const before = value.slice(0, cursor)
  const lines = before.split('\n')
  const line = lines[lines.length - 1] || ''
  const lineHeight = 26
  const charWidth = 8.2

  const rawLeft = rect.left + 14 + line.length * charWidth
  const maxLeft = Math.max(rect.left + 12, rect.right - 260)
  const left = Math.min(rawLeft, maxLeft)
  const top = Math.max(12, rect.top + 12 + (lines.length - 1) * lineHeight - 10)

  return { top, left }
}

function mergeDrafts(remoteDraft: PageDraft, localDraft: PageDraft | null) {
  if (!localDraft) return remoteDraft
  return {
    ...remoteDraft,
    frontmatterRaw: (localDraft.frontmatterRaw || '').trim()
      ? localDraft.frontmatterRaw
      : remoteDraft.frontmatterRaw,
    frontmatterFence: localDraft.frontmatterFence || remoteDraft.frontmatterFence,
    body: localDraft.mode === 'page' && localDraft.body.trim() ? localDraft.body : remoteDraft.body,
    entries:
      localDraft.mode === 'live' && localDraft.entries.length
        ? localDraft.entries
        : remoteDraft.entries,
    assets: [
      ...remoteDraft.assets.filter(
        (remoteAsset) => !(localDraft.assets || []).some((asset) => asset.name === remoteAsset.name),
      ),
      ...(localDraft.assets || []),
    ],
    remoteAssetNames: remoteDraft.remoteAssetNames || [],
  }
}

export default function PageEditorPage() {
  const { isEnglish } = useLanguage()
  const router = useRouter()
  const checkingAuth = useRequireAuth('/page-editor')
  const bodyRef = useRef<HTMLTextAreaElement | null>(null)
  const entryRef = useRef<HTMLTextAreaElement | null>(null)

  const [draft, setDraft] = useState<PageDraft | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [newEntryContent, setNewEntryContent] = useState('## ')
  const [publishing, setPublishing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [imagesOpen, setImagesOpen] = useState(true)
  const [entriesOpen, setEntriesOpen] = useState(true)
  const [pageContentOpen, setPageContentOpen] = useState(true)
  const [frontmatterOpen, setFrontmatterOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS)
  const [copiedAssetName, setCopiedAssetName] = useState('')
  const [previewAsset, setPreviewAsset] = useState<DraftAsset | null>(null)
  const [transferFolderName, setTransferFolderName] = useState('')
  const [transferError, setTransferError] = useState('')
  const [transferStatus, setTransferStatus] = useState('')
  const [transferring, setTransferring] = useState(false)
  const [slashState, setSlashState] = useState<SlashState>({
    open: false,
    target: 'body',
    query: '',
    start: 0,
    end: 0,
  })
  const [slashMenuPos, setSlashMenuPos] = useState({ top: 0, left: 0 })

  const card: React.CSSProperties = {
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: 'clamp(12px, 3vw, 14px)',
    background: 'var(--card)',
    boxShadow: 'var(--shadow)',
  }

  const input: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 12,
    border: '1px solid var(--border)',
    background: 'var(--card)',
    color: 'var(--foreground)',
    fontSize: 14,
  }

  useEffect(() => {
    setSettings(loadSiteSettingsFromStorage())
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadPage() {
      if (checkingAuth) {
        return
      }
      setLoading(true)
      setError('')

      try {
        const configResponse = await fetch('/api/github/page-config', { cache: 'no-store' })
        const config = (await configResponse.json()) as PageConfigResponse

        if (!configResponse.ok || !config.ok || !config.pageConfig?.filePath) {
          throw new Error(
            isEnglish
              ? 'Please set up Page Editor on the home page first.'
              : '请先在首页完成页面编辑配置。',
          )
        }

        const response = await fetch('/api/load-page', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config.pageConfig),
        })
        const result = await response.json()

        if (!response.ok || !result.ok) {
          throw new Error(result.error || (isEnglish ? 'Failed to load page.' : '页面加载失败。'))
        }

        if (!cancelled) {
          const remoteDraft = {
            ...(result.draft as PageDraft),
            filePath: config.pageConfig.filePath,
            mode: config.pageConfig.mode,
            assets: (result.draft as PageDraft).assets || [],
            remoteAssetNames: (result.draft as PageDraft).remoteAssetNames || [],
          }
          const localDraft = await loadPageDraftFromStorage(config.pageConfig.filePath)
          setDraft(mergeDrafts(remoteDraft, localDraft))
          if (config.pageConfig.mode === 'live') {
            setNewEntryContent('## ')
          }
          setStatus(
            localDraft
              ? isEnglish
                ? 'Loaded from GitHub and merged with your local draft'
                : '已从 GitHub 载入，并合并本地草稿'
              : isEnglish
                ? 'Loaded from GitHub'
                : '已从 GitHub 载入',
          )
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error
              ? e.message
              : isEnglish
                ? 'Failed to load page.'
                : '页面加载失败。',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadPage()
    return () => {
      cancelled = true
    }
  }, [checkingAuth, isEnglish])

  useEffect(() => {
    if (!draft) return

    let cancelled = false
    const currentDraft = draft

    async function persistDraft() {
      const saveResult = await savePageDraftToStorage(currentDraft)
      if (cancelled) return

      setStatus(
        saveResult.ok
          ? isEnglish
            ? 'Saved locally'
            : '已保存到本地'
          : saveResult.code === 'quota'
            ? isEnglish
              ? 'Local storage is full. This page draft is no longer being fully saved on this device.'
              : '本地存储空间已满，当前设备已无法完整保存这个页面草稿。'
            : isEnglish
              ? 'Local save failed on this device.'
              : '当前设备本地保存失败。',
      )
    }

    void persistDraft()
    return () => {
      cancelled = true
    }
  }, [draft, isEnglish])

  useEffect(() => {
    const textarea = bodyRef.current
    if (!textarea || draft?.mode !== 'page') return
    textarea.style.height = '0px'
    textarea.style.height = `${Math.max(320, textarea.scrollHeight)}px`
  }, [draft?.body, draft?.mode, activeTab])

  const previewBody = useMemo(() => {
    if (!draft) return ''
    return draft.mode === 'live' ? renderLiveEntries(draft.entries) : draft.body
  }, [draft])

  function updateDraft(updater: (current: PageDraft) => PageDraft) {
    setDraft((current) => (current ? updater(current) : current))
  }

  function updateBody(body: string) {
    updateDraft((current) => ({ ...current, body }))
  }

  function insertInto(
    textarea: HTMLTextAreaElement | null,
    current: string,
    content: string,
    apply: (next: string) => void,
    options?: { imageBlock?: boolean },
  ) {
    const isImageBlock = options?.imageBlock ?? false
    const insertionText = isImageBlock ? buildStandaloneImageBlock(content) : content

    if (!textarea) {
      apply(current ? `${current}${isImageBlock ? insertionText : `\n\n${content}`}` : content)
      return
    }
    const start = textarea.selectionStart ?? current.length
    const end = textarea.selectionEnd ?? current.length
    const insertionStart = isImageBlock
      ? (current.indexOf('\n', end) === -1 ? current.length : current.indexOf('\n', end))
      : start
    const insertionEnd = isImageBlock ? insertionStart : end
    const next = current.slice(0, insertionStart) + insertionText + current.slice(insertionEnd)
    apply(next)
    requestAnimationFrame(() => {
      textarea.focus()
      const cursor = insertionStart + insertionText.length
      textarea.setSelectionRange(cursor, cursor)
    })
  }

  function insertImageMarkdown(markdown: string) {
    if (!draft) return
    const imageBlock = isImageMarkdown(markdown)
    if (draft.mode === 'live') {
      insertInto(entryRef.current, newEntryContent, markdown, setNewEntryContent, { imageBlock })
      return
    }
    insertInto(bodyRef.current, draft.body, markdown, updateBody, { imageBlock })
  }

  async function copyAssetName(assetName: string) {
    try {
      await navigator.clipboard.writeText(assetName)
      setCopiedAssetName(assetName)
      setTimeout(() => setCopiedAssetName(''), 1200)
    } catch {
      setStatus(
        isEnglish ? 'Unable to copy file name on this device' : '当前设备无法复制文件名',
      )
    }
  }

  function updateSlashState(target: SlashTarget, value: string, cursor: number) {
    const textarea = target === 'entry' ? entryRef.current : bodyRef.current
    const textBeforeCursor = value.slice(0, cursor)
    const slashIndex = textBeforeCursor.lastIndexOf('/')
    if (slashIndex < 0) {
      setSlashState((prev) => ({ ...prev, open: false, query: '', start: 0, end: 0 }))
      return
    }

    const prefixChar = slashIndex === 0 ? ' ' : textBeforeCursor[slashIndex - 1]
    const commandText = textBeforeCursor.slice(slashIndex + 1)
    const isLineBreakInside = commandText.includes('\n')
    const hasSpaceInside = /\s/.test(commandText)
    const validPrefix = /\s/.test(prefixChar)

    if (!validPrefix || isLineBreakInside || hasSpaceInside) {
      setSlashState((prev) => ({ ...prev, open: false, query: '', start: 0, end: 0 }))
      return
    }

    setSlashState({
      open: true,
      target,
      query: commandText.toLowerCase(),
      start: slashIndex,
      end: cursor,
    })
    if (textarea) {
      setSlashMenuPos(estimateSlashMenuPosition(textarea, value, cursor))
    }
  }

  function replaceSlashToken(markdown: string) {
    if (!draft) return

    if (slashState.target === 'entry') {
      const textarea = entryRef.current
      const nextValue =
        newEntryContent.slice(0, slashState.start) +
        markdown +
        newEntryContent.slice(slashState.end)
      const nextCursor = slashState.start + markdown.length
      setNewEntryContent(nextValue)
      requestAnimationFrame(() => {
        if (!textarea) return
        textarea.focus()
        textarea.setSelectionRange(nextCursor, nextCursor)
      })
    } else {
      const textarea = bodyRef.current
      const currentBody = draft.body
      const nextValue =
        currentBody.slice(0, slashState.start) +
        markdown +
        currentBody.slice(slashState.end)
      const nextCursor = slashState.start + markdown.length
      updateBody(nextValue)
      requestAnimationFrame(() => {
        if (!textarea) return
        textarea.focus()
        textarea.setSelectionRange(nextCursor, nextCursor)
      })
    }

    setSlashState((prev) => ({ ...prev, open: false, query: '', start: 0, end: 0 }))
  }

  function addEntry() {
    const content = newEntryContent.trim()
    if (!content) return

    const firstLine = content.split('\n').find((line) => line.trim())
    const headingMatch = firstLine?.trim().match(/^##\s+(.+)$/)

    if (!headingMatch) {
      setError(
        isEnglish
          ? 'Please start a new quick entry with a `##` heading.'
          : '新增生活记录时，请先写一个 `##` 二级标题。',
      )
      return
    }

    const title = headingMatch[1].trim()
    const body = content.replace(/^##\s+.+$/m, '').trim()

    updateDraft((current) => ({
      ...current,
      entries: [createQuickEntry(body, title), ...current.entries],
    }))
    setNewEntryContent('## ')
    setError('')
    setStatus(isEnglish ? 'New entry added' : '已添加新记录')
  }

  function updateEntry(entryId: string, patch: Partial<QuickEntry>) {
    updateDraft((current) => ({
      ...current,
      entries: current.entries.map((entry) =>
        entry.id === entryId ? { ...entry, ...patch } : entry,
      ),
    }))
  }

  function deleteEntry(entryId: string) {
    updateDraft((current) => ({
      ...current,
      entries: current.entries.filter((entry) => entry.id !== entryId),
    }))
  }

  function addAsset(asset: DraftAsset) {
    updateDraft((current) => ({
      ...current,
      assets: [...current.assets.filter((item) => item.name !== asset.name), asset],
    }))
  }

  function deleteAsset(assetName: string) {
    updateDraft((current) => ({
      ...current,
      assets: current.assets.filter((asset) => asset.name !== assetName),
    }))
  }

  async function handleManualSave() {
    if (!draft) return
    const saveResult = await savePageDraftToStorage(draft)
    setStatus(
      saveResult.ok
        ? `${isEnglish ? 'Saved manually' : '已手动保存'} ${new Date().toLocaleTimeString()}`
        : saveResult.code === 'quota'
          ? isEnglish
            ? 'Local storage is full. Manual save could not be completed.'
            : '本地存储空间已满，手动保存未能完成。'
          : isEnglish
            ? 'Manual save failed on this device.'
            : '当前设备手动保存失败。',
    )
  }
  async function transferCurrentPageToPost() {
    if (!draft) return
    if (draft.mode !== 'live') return
    const normalizedFolderName = normalizeFolderName(transferFolderName)
    if (!normalizedFolderName) {
      setTransferError(isEnglish ? 'Please enter a target post folder name.' : '请填写文章目录名。')
      return
    }

    setTransferring(true)
    setTransferError('')
    setTransferStatus('')
    try {
      const response = await fetch('/api/github/transfer-page-to-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceFilePath: draft.filePath,
          targetFolderName: normalizedFolderName,
          mode: draft.mode,
        }),
      })
      const result = await response.json()
      if (!response.ok || !result.ok) {
        throw new Error(
          result.error || (isEnglish ? 'Failed to transfer page to post.' : '转移失败。'),
        )
      }
      const settingsTimezone = settings.timezoneOffsetHours ?? 8
      const postDraft = createEmptyDraft(
        normalizedFolderName,
        normalizedFolderName.replace(/^\d{4}-\d{2}-\d{2}-/, ''),
        getCurrentDateTime(settingsTimezone),
        settings.frontmatterPreferences,
      )
      postDraft.frontmatter.title = isEnglish ? 'Transferred From Page' : '一键转移页面'
      postDraft.body = String(result.body || '').trim()
      postDraft.assets = (result.assets || []) as DraftAsset[]
      postDraft.remoteAssetNames = []
      if (postDraft.assets[0]?.name) {
        postDraft.frontmatter.image = postDraft.assets[0].name
      }
      const saveResult = await saveDraftToStorage(postDraft)
      if (!saveResult.ok) {
        throw new Error(
          saveResult.code === 'quota'
            ? isEnglish
              ? 'Local storage is full. The transferred draft could not be saved on this device.'
              : '本地存储空间已满，转移后的草稿无法保存在当前设备。'
            : isEnglish
              ? 'Failed to save the transferred draft locally.'
              : '转移后的草稿保存到本地失败。',
        )
      }
      setTransferStatus(
        isEnglish
          ? `Draft created: ${normalizedFolderName} (${result.loadedAssetCount || 0} assets)`
          : `草稿已创建：${normalizedFolderName}（${result.loadedAssetCount || 0} 张图片）`,
      )
      router.push(`/editor/${normalizedFolderName}`)
    } catch (error) {
      setTransferError(
        error instanceof Error ? error.message : isEnglish ? 'Failed to transfer page to post.' : '转移失败。',
      )
    } finally {
      setTransferring(false)
    }
  }

  async function publish() {
    if (!draft) return

    if (draft.mode === 'live' && draft.entries.length === 0) {
      setError(isEnglish ? 'Add at least one entry first.' : '请先至少添加一条记录。')
      return
    }

    if (draft.mode === 'page' && !draft.body.trim()) {
      setError(isEnglish ? 'Please enter page content first.' : '请先填写页面内容。')
      return
    }

    setPublishing(true)
    setError('')

    try {
      const response = await fetch('/api/publish-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.error || (isEnglish ? 'Failed to publish page.' : '页面发布失败。'))
      }

      await removePageDraftFromStorage(draft.filePath)
      router.push(
        `/page-publish?path=${encodeURIComponent(result.path)}&files=${result.fileCount}&commitCount=${result.commitCount}&repo=${encodeURIComponent(result.repo || '')}&branch=${encodeURIComponent(result.branch || '')}&changes=${encodeURIComponent(JSON.stringify(result.fileChanges || []))}`,
      )
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : isEnglish
            ? 'Failed to publish page.'
            : '页面发布失败。',
      )
    } finally {
      setPublishing(false)
      setShowConfirm(false)
    }
  }

  const slashCommands: SlashCommand[] = [
    {
      key: 'h2',
      label: isEnglish ? 'Heading' : '标题',
      keywords: ['h2', 'heading', 'title'],
      markdown: isEnglish ? '## Section Title' : '## 小节标题',
    },
    {
      key: 'bold',
      label: isEnglish ? 'Bold' : '加粗',
      keywords: ['bold', 'strong'],
      markdown: isEnglish ? '**bold text**' : '**加粗文字**',
    },
    {
      key: 'italic',
      label: isEnglish ? 'Italic' : '斜体',
      keywords: ['italic'],
      markdown: isEnglish ? '*italic text*' : '*斜体文字*',
    },
    {
      key: 'link',
      label: isEnglish ? 'Link' : '链接',
      keywords: ['link', 'url'],
      markdown: isEnglish ? '[link text](https://example.com)' : '[链接文字](https://example.com)',
    },
    {
      key: 'code',
      label: isEnglish ? 'Code' : '代码',
      keywords: ['code', 'inline'],
      markdown: isEnglish ? '`code`' : '`代码`',
    },
    {
      key: 'codeblock',
      label: isEnglish ? 'Code Block' : '代码块',
      keywords: ['codeblock', 'block'],
      markdown: '\n```ts\nconst example = true\n```\n',
    },
    {
      key: 'quote',
      label: isEnglish ? 'Quote' : '引用',
      keywords: ['quote'],
      markdown: isEnglish ? '> quoted text' : '> 引用内容',
    },
    {
      key: 'list',
      label: isEnglish ? 'List' : '列表',
      keywords: ['list', 'ul'],
      markdown: isEnglish ? '- list item' : '- 列表项',
    },
    {
      key: 'table',
      label: isEnglish ? 'Table' : '表格',
      keywords: ['table'],
      markdown: '\n| Column 1 | Column 2 |\n| --- | --- |\n| Value A | Value B |\n',
    },
  ]

  const filteredSlashCommands = slashState.query
    ? slashCommands.filter((command) =>
        [command.label, command.key, ...command.keywords]
          .join(' ')
          .toLowerCase()
          .includes(slashState.query),
      )
    : slashCommands

  if (checkingAuth || loading || !draft) {
    return (
      <main style={{ padding: 'clamp(12px, 3vw, 20px)', maxWidth: 1080, margin: '0 auto', display: 'grid', gap: 16 }}>
        <SiteHeader />
        <section style={card}>
          {checkingAuth
            ? isEnglish
              ? 'Checking sign-in status...'
              : '正在检查登录状态...'
            : loading
              ? isEnglish
                ? 'Loading page editor...'
                : '正在加载页面编辑器...'
              : error}
        </section>
        <SiteFooter />
      </main>
    )
  }

  return (
    <main style={{ padding: 'clamp(12px, 3vw, 20px)', maxWidth: 1080, margin: '0 auto', display: 'grid', gap: 16 }}>
      <SiteHeader />

      <div style={{ display: 'grid', gap: 6 }}>
        <h1 style={{ margin: 0, fontSize: 14 }}>
          {draft.mode === 'live' ? (isEnglish ? 'Quick Timeline' : '生活记录') : (isEnglish ? 'Page Editor' : '页面编辑')}
        </h1>
          <div style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 500, wordBreak: 'break-all' }}>
          {isEnglish ? 'Target file: ' : '目标文件：'}
          {draft.filePath}
        </div>
        <div style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 500 }}>{status}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
        <button type="button" onClick={() => setActiveTab(activeTab === 'edit' ? 'preview' : 'edit')} style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border)', background: activeTab === 'edit' ? 'var(--card)' : 'var(--accent)', color: activeTab === 'edit' ? 'var(--foreground)' : 'var(--accent-contrast)', fontWeight: 700, fontSize: 14 }}>
          {activeTab === 'edit' ? (isEnglish ? 'Preview' : '预览') : (isEnglish ? 'Edit' : '编辑')}
        </button>
        <button type="button" onClick={() => { void handleManualSave() }} style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', fontWeight: 700, fontSize: 14 }}>
          {isEnglish ? 'Save' : '保存'}
        </button>
        <button type="button" onClick={() => setShowConfirm(true)} disabled={publishing} style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--accent)', background: 'var(--accent)', color: 'var(--accent-contrast)', fontWeight: 700, fontSize: 14 }}>
          {publishing ? (isEnglish ? 'Publishing...' : '发布中...') : (isEnglish ? 'Publish' : '发布')}
        </button>
        <ThemeToggle />
      </div>

      {error ? <div style={{ padding: 12, borderRadius: 12, background: 'color-mix(in srgb, var(--danger) 8%, var(--card) 92%)', color: 'var(--danger)', border: '1px solid color-mix(in srgb, var(--danger) 24%, var(--border) 76%)', fontSize: 14 }}>{error}</div> : null}

      {activeTab === 'edit' ? (
        <div style={{ display: 'grid', gap: 20 }}>
          {draft.mode === 'live' ? (
            <section style={card}>
              <h2 style={{ margin: 0, fontSize: 14 }}>{isEnglish ? 'Quick Entry' : '快速记录'}</h2>
              <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
                <textarea
                  ref={entryRef}
                  value={newEntryContent}
                  onChange={(event) => {
                    const nextValue = event.target.value
                    const cursor = event.target.selectionStart ?? nextValue.length
                    setNewEntryContent(nextValue)
                    updateSlashState('entry', nextValue, cursor)
                  }}
                  onKeyDown={(event) => {
                    if (!(slashState.open && slashState.target === 'entry')) return
                    if (event.key === 'Escape') {
                      event.preventDefault()
                      setSlashState((prev) => ({ ...prev, open: false, query: '', start: 0, end: 0 }))
                      return
                    }
                    if (event.key === 'Enter' || event.key === 'Tab') {
                      const first = filteredSlashCommands[0]
                      if (!first) return
                      event.preventDefault()
                      replaceSlashToken(first.markdown)
                    }
                  }}
                  rows={5}
                  style={{ ...input, minHeight: 140, resize: 'vertical', lineHeight: 1.7 }}
                />
                {slashState.open && slashState.target === 'entry' ? (
                  <div style={{ position: 'fixed', top: slashMenuPos.top, left: slashMenuPos.left, width: 240, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--card)', boxShadow: 'var(--shadow)', overflow: 'hidden', zIndex: 150 }}>
                    <div style={{ fontSize: 12, color: 'var(--muted)', padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
                      {isEnglish ? 'Slash commands: type after "/" and press Enter' : 'Slash 命令：输入 "/" 后继续输入关键词，按 Enter 选择'}
                    </div>
                    <div style={{ display: 'grid' }}>
                      {filteredSlashCommands.slice(0, 6).map((command) => (
                        <button
                          key={`entry-${command.key}`}
                          type="button"
                          onClick={() => replaceSlashToken(command.markdown)}
                          style={{ textAlign: 'left', padding: '10px 12px', border: 'none', borderTop: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
                        >
                          /{command.key} - {command.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                  {isEnglish ? 'A timestamp tag will be added automatically. Keep the first line as `## Your Title`.' : '会自动附带时间戳标签。请保持第一行是 `## 标题`。'}
                </div>
                <IconButton label={isEnglish ? 'Add new entry' : '添加新记录'} icon={<PlusIcon />} onClick={addEntry} active />
              </div>
            </section>
          ) : null}

          <section style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: 14 }}>{isEnglish ? 'Images' : '图片'}</h2>
              <SectionToggleButton open={imagesOpen} onClick={() => setImagesOpen((prev) => !prev)} label={imagesOpen ? (isEnglish ? 'Collapse images section' : '收起图片区域') : (isEnglish ? 'Expand images section' : '展开图片区域')} />
            </div>
            {imagesOpen ? (
              <div style={{ marginTop: 14, display: 'grid', gap: 14 }}>
                <ImageUploader existingAssets={draft.assets} settings={settings} onUploaded={addAsset} onInsertMarkdown={insertImageMarkdown} />
                {draft.assets.map((asset) => (
                  <div key={asset.name} style={{ padding: 10, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--card-muted)', display: 'grid', gridTemplateColumns: '56px minmax(0, 1fr) 34px 34px', gap: 6, alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setPreviewAsset(asset)}
                      style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--card)', padding: 0, cursor: 'pointer' }}
                    >
                      {asset.previewUrl ? <img src={asset.previewUrl} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : null}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyAssetName(asset.name)}
                      title={asset.name}
                      style={{
                        minWidth: 0,
                        width: '100%',
                        padding: '7px 10px',
                        borderRadius: 10,
                        border: '1px dashed var(--border)',
                        background: 'var(--card)',
                        color: 'var(--foreground)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                    >
                      <span style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {asset.name}
                      </span>
                      <span style={{ fontSize: 12, color: copiedAssetName === asset.name ? 'var(--accent-soft-text)' : 'var(--muted)', flexShrink: 0 }}>
                        {copiedAssetName === asset.name ? (isEnglish ? 'Copied' : '已复制') : (isEnglish ? 'Copy' : '复制')}
                      </span>
                    </button>
                    <button type="button" onClick={() => insertImageMarkdown(`![${asset.name.replace(/\.[^.]+$/i, '')}](${asset.name})`)} title={isEnglish ? 'Insert image link' : '插入图片链接'} aria-label={isEnglish ? 'Insert image link' : '插入图片链接'} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteAsset(asset.name)}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 8,
                          border: '1px solid color-mix(in srgb, var(--danger) 36%, var(--border) 64%)',
                          background: 'var(--card)',
                          color: 'var(--danger)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                        title={isEnglish ? 'Delete' : '删除'}
                        aria-label={isEnglish ? 'Delete' : '删除'}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M4 7H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          <path d="M9 7V5.8C9 4.81 9.81 4 10.8 4H13.2C14.19 4 15 4.81 15 5.8V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          <path d="M7.5 7L8.2 18.1C8.27 19.14 9.14 19.95 10.19 19.95H13.81C14.86 19.95 15.73 19.14 15.8 18.1L16.5 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          <path d="M10 10.5V16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          <path d="M14 10.5V16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                      </button>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <section style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: 14 }}>
                {draft.mode === 'live' ? (isEnglish ? 'Entries' : '记录列表') : (isEnglish ? 'Page Content' : '页面内容')}
              </h2>
              <SectionToggleButton open={draft.mode === 'live' ? entriesOpen : pageContentOpen} onClick={() => draft.mode === 'live' ? setEntriesOpen((prev) => !prev) : setPageContentOpen((prev) => !prev)} label={(draft.mode === 'live' ? entriesOpen : pageContentOpen) ? (isEnglish ? 'Collapse content section' : '收起内容区域') : (isEnglish ? 'Expand content section' : '展开内容区域')} />
            </div>
            {draft.mode === 'live' ? (
              entriesOpen ? (
                <div style={{ marginTop: 14, display: 'grid', gap: 12 }}>
                  {draft.entries.map((entry) => (
                    <div key={entry.id} style={{ padding: 12, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--card-muted)', display: 'grid', gap: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0, flex: 1 }}>
                          <input type="text" value={entry.title} onChange={(event) => updateEntry(entry.id, { title: event.target.value })} style={{ minWidth: 160, flex: '1 1 220px', padding: '7px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', fontSize: 13, fontWeight: 700 }} />
                          <input type="text" value={entry.timestamp || ''} onChange={(event) => updateEntry(entry.id, { timestamp: event.target.value })} placeholder={isEnglish ? 'Timestamp' : '时间'} style={{ minWidth: 118, flex: '0 1 160px', padding: '7px 10px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--accent-soft)', color: 'var(--accent-soft-text)', fontSize: 12, fontWeight: 700 }} />
                        </div>
                        <IconButton label={isEnglish ? 'Delete entry' : '删除记录'} icon={<TrashIcon />} onClick={() => deleteEntry(entry.id)} style={{ color: 'var(--danger)', border: '1px solid color-mix(in srgb, var(--danger) 36%, var(--border) 64%)' }} />
                      </div>
                      <textarea value={entry.content} onChange={(event) => updateEntry(entry.id, { content: event.target.value })} rows={5} style={{ ...input, minHeight: 150, resize: 'vertical', lineHeight: 1.7 }} />
                    </div>
                  ))}
                </div>
              ) : null
            ) : (
              pageContentOpen ? (
                <>
                  <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
                    <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                      {isEnglish ? 'Mobile tip: type `/` in the editor to open Markdown commands near the cursor.' : '手机提示：在正文中输入 `/` 可快速唤起 Markdown 命令。'}
                    </div>
                  </div>
                  <textarea
                    ref={bodyRef}
                    value={draft.body}
                    onChange={(event) => {
                      const nextValue = event.target.value
                      const cursor = event.target.selectionStart ?? nextValue.length
                      updateBody(nextValue)
                      updateSlashState('body', nextValue, cursor)
                    }}
                    onKeyDown={(event) => {
                      if (!(slashState.open && slashState.target === 'body')) return
                      if (event.key === 'Escape') {
                        event.preventDefault()
                        setSlashState((prev) => ({ ...prev, open: false, query: '', start: 0, end: 0 }))
                        return
                      }
                      if (event.key === 'Enter' || event.key === 'Tab') {
                        const first = filteredSlashCommands[0]
                        if (!first) return
                        event.preventDefault()
                        replaceSlashToken(first.markdown)
                      }
                    }}
                    rows={12}
                    style={{ ...input, marginTop: 14, minHeight: 320, resize: 'none', overflow: 'hidden', lineHeight: 1.7 }}
                  />
                  {slashState.open && slashState.target === 'body' ? (
                    <div style={{ position: 'fixed', top: slashMenuPos.top, left: slashMenuPos.left, width: 240, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--card)', boxShadow: 'var(--shadow)', overflow: 'hidden', zIndex: 150 }}>
                      <div style={{ fontSize: 12, color: 'var(--muted)', padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
                        {isEnglish ? 'Slash commands: type after "/" and press Enter' : 'Slash 命令：输入 "/" 后继续输入关键词，按 Enter 选择'}
                      </div>
                      <div style={{ display: 'grid' }}>
                        {filteredSlashCommands.slice(0, 6).map((command) => (
                          <button
                            key={`body-${command.key}`}
                            type="button"
                            onClick={() => replaceSlashToken(command.markdown)}
                            style={{ textAlign: 'left', padding: '10px 12px', border: 'none', borderTop: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
                          >
                            /{command.key} - {command.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              ) : null
            )}
          </section>

          <section style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: 14 }}>{isEnglish ? 'Frontmatter' : 'Frontmatter 设置'}</h2>
              <SectionToggleButton open={frontmatterOpen} onClick={() => setFrontmatterOpen((prev) => !prev)} label={frontmatterOpen ? (isEnglish ? 'Collapse frontmatter section' : '收起 Frontmatter 区域') : (isEnglish ? 'Expand frontmatter section' : '展开 Frontmatter 区域')} />
            </div>
            {frontmatterOpen ? (
              <>
                <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.7, color: 'var(--muted)' }}>
                  {isEnglish
                    ? 'Only edit the fields here. Do not type the wrapping --- or +++ lines manually.'
                    : '这里只需要填写字段内容，不要手动输入外层的 --- 或 +++ 横杠。'}
                </div>
                <textarea value={draft.frontmatterRaw} onChange={(event) => updateDraft((current) => ({ ...current, frontmatterRaw: event.target.value }))} rows={8} style={{ ...input, marginTop: 14, minHeight: 180, resize: 'vertical', lineHeight: 1.6 }} />
              </>
            ) : null}
          </section>

          {draft.mode === 'live' ? (
            <section style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: 14 }}>{isEnglish ? 'Transfer To Draft' : '一键转移页面为文章草稿'}</h2>
                <SectionToggleButton open={transferOpen} onClick={() => setTransferOpen((prev) => !prev)} label={transferOpen ? (isEnglish ? 'Collapse transfer section' : '收起转移区域') : (isEnglish ? 'Expand transfer section' : '展开转移区域')} />
              </div>
              {transferOpen ? (
                <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
                  <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
                    {isEnglish
                      ? 'Copy this quick timeline Markdown and related images into a new post draft. The original page remains unchanged.'
                      : '将当前生活记录页面的 Markdown 与相关图片复制为新的文章草稿，原页面内容会保留。'}
                  </div>
                  <input
                    type="text"
                    value={transferFolderName}
                    onChange={(event) => setTransferFolderName(event.target.value)}
                    placeholder={isEnglish ? 'New post folder name, e.g. 2026-03-14-moments' : '新文章目录名，例如 2026-03-14-moments'}
                    style={input}
                  />
                  {transferError ? <div style={{ color: 'var(--danger)', fontSize: 14 }}>{transferError}</div> : null}
                  {transferStatus ? <div style={{ color: 'var(--accent-soft-text)', fontSize: 14 }}>{transferStatus}</div> : null}
                  <button
                    type="button"
                    onClick={() => {
                      void transferCurrentPageToPost()
                    }}
                    disabled={transferring}
                    style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid var(--accent)', background: 'var(--accent)', color: 'var(--accent-contrast)', fontWeight: 700, opacity: transferring ? 0.7 : 1 }}
                  >
                    {transferring ? (isEnglish ? 'Transferring...' : '转移中...') : (isEnglish ? 'Create Post Draft' : '生成文章草稿')}
                  </button>
                </div>
              ) : null}
            </section>
          ) : null}
        </div>
      ) : (
        <section style={card}>
          <MarkdownPreview body={previewBody} assets={draft.assets} />
        </section>
      )}

      {showConfirm ? (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 12, zIndex: 120 }} onClick={() => !publishing && setShowConfirm(false)}>
          <div style={{ width: '100%', maxWidth: 820, background: 'var(--card)', borderRadius: 18, padding: 14, boxShadow: '0 20px 40px rgba(0,0,0,0.18)', display: 'grid', gap: 10 }} onClick={(event) => event.stopPropagation()}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{isEnglish ? 'Publish this page to GitHub?' : '确认将这个页面发布到 GitHub？'}</div>
            <div style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>{isEnglish ? 'Target file: ' : '目标文件：'}{draft.filePath}</div>
            <button type="button" onClick={publish} disabled={publishing} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--accent)', background: 'var(--accent)', color: 'var(--accent-contrast)', fontSize: 14, fontWeight: 700 }}>
              {publishing ? (isEnglish ? 'Submitting to GitHub...' : '正在提交到 GitHub...') : (isEnglish ? 'Confirm Publish' : '确认发布')}
            </button>
            <button type="button" onClick={() => setShowConfirm(false)} disabled={publishing} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', fontSize: 14, fontWeight: 600 }}>
              {isEnglish ? 'Cancel' : '取消'}
            </button>
          </div>
        </div>
      ) : null}

      {previewAsset ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.78)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 130,
          }}
          onClick={() => setPreviewAsset(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 960,
              maxHeight: '100%',
              display: 'grid',
              gap: 12,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 14,
                background: 'rgba(12, 18, 28, 0.72)',
                color: '#fff',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, wordBreak: 'break-all' }}>
                  {previewAsset.name}
                </div>
                <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(255,255,255,0.72)', textAlign: 'center' }}>
                  {isEnglish ? 'Tap outside to close' : '点空白处关闭'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => copyAssetName(previewAsset.name)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}
              >
                {isEnglish ? 'Copy Name' : '复制标题'}
              </button>
            </div>

            <div
              style={{
                borderRadius: 18,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(12, 18, 28, 0.72)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 280,
                maxHeight: 'calc(100vh - 160px)',
              }}
            >
              <img
                src={previewAsset.previewUrl}
                alt={previewAsset.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: 'calc(100vh - 180px)',
                  width: 'auto',
                  height: 'auto',
                  display: 'block',
                  objectFit: 'contain',
                }}
              />
            </div>
          </div>
        </div>
      ) : null}

      <SiteFooter />
    </main>
  )
}









