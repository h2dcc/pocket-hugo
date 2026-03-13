'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SiteFooter, SiteHeader } from '@/components/layout/SiteChrome'
import ImageUploader from '@/components/post/ImageUploader'
import MarkdownPreview from '@/components/post/MarkdownPreview'
import ThemeToggle from '@/components/theme/ThemeToggle'
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
import { useLanguage } from '@/lib/use-language'
import type { DraftAsset } from '@/lib/types'

type PageConfigResponse = {
  ok: boolean
  pageConfig?: { filePath: string; mode: 'page' | 'live' } | null
  error?: string
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
  const [showTools, setShowTools] = useState(false)
  const [imagesOpen, setImagesOpen] = useState(true)
  const [entriesOpen, setEntriesOpen] = useState(true)
  const [pageContentOpen, setPageContentOpen] = useState(true)
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS)

  const card: React.CSSProperties = {
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: 14,
    background: 'var(--card)',
    boxShadow: 'var(--shadow)',
  }

  const input: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 12,
    border: '1px solid var(--border)',
    background: 'var(--card)',
    color: 'var(--foreground)',
    fontSize: 16,
  }

  const sectionToggleStyle = (open: boolean): React.CSSProperties => ({
    minWidth: 88,
    padding: '10px 14px',
    borderRadius: 999,
    border: '1px solid var(--border)',
    background: open ? 'var(--accent)' : 'var(--card)',
    color: open ? 'var(--accent-contrast)' : 'var(--foreground)',
    fontWeight: 700,
  })

  useEffect(() => {
    setSettings(loadSiteSettingsFromStorage())
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadPage() {
      setLoading(true)
      setError('')

      try {
        const configResponse = await fetch('/api/github/page-config', { cache: 'no-store' })
        const config = (await configResponse.json()) as PageConfigResponse

        if (!configResponse.ok || !config.ok || !config.pageConfig?.filePath) {
          throw new Error(
            isEnglish
              ? 'Please set up Page Editor on the home page first.'
              : '请先回首页完成页面编辑配置。',
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
          const localDraft = loadPageDraftFromStorage(config.pageConfig.filePath)
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

    loadPage()
    return () => {
      cancelled = true
    }
  }, [isEnglish])

  useEffect(() => {
    if (!draft) return
    savePageDraftToStorage(draft)
    setStatus(isEnglish ? 'Saved locally' : '已保存到本地')
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
  ) {
    if (!textarea) {
      apply(current ? `${current}\n\n${content}` : content)
      return
    }
    const start = textarea.selectionStart ?? current.length
    const end = textarea.selectionEnd ?? current.length
    const next = current.slice(0, start) + content + current.slice(end)
    apply(next)
    requestAnimationFrame(() => {
      textarea.focus()
      const cursor = start + content.length
      textarea.setSelectionRange(cursor, cursor)
    })
  }

  function insertMarkdown(markdown: string) {
    if (!draft) return
    if (draft.mode === 'live') {
      insertInto(entryRef.current, newEntryContent, markdown, setNewEntryContent)
      return
    }
    insertInto(bodyRef.current, draft.body, markdown, updateBody)
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

      removePageDraftFromStorage(draft.filePath)
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

  const tools = [
    { key: 'h2', label: 'H2', onClick: () => insertMarkdown('## Section Title') },
    { key: 'bold', label: isEnglish ? 'Bold' : '加粗', onClick: () => insertMarkdown('**bold text**') },
    { key: 'italic', label: isEnglish ? 'Italic' : '斜体', onClick: () => insertMarkdown('*italic text*') },
    { key: 'link', label: isEnglish ? 'Link' : '链接', onClick: () => insertMarkdown('[link text](https://example.com)') },
    { key: 'code', label: isEnglish ? 'Code' : '代码', onClick: () => insertMarkdown('`code`') },
    { key: 'codeblock', label: isEnglish ? 'Code Block' : '代码块', onClick: () => insertMarkdown('\n```ts\nconst example = true\n```\n') },
    { key: 'quote', label: isEnglish ? 'Quote' : '引用', onClick: () => insertMarkdown('> quoted text') },
    { key: 'list', label: isEnglish ? 'List' : '列表', onClick: () => insertMarkdown('- list item') },
    { key: 'table', label: isEnglish ? 'Table' : '表格', onClick: () => insertMarkdown('\n| Column 1 | Column 2 |\n| --- | --- |\n| Value A | Value B |\n') },
  ]

  if (loading || !draft) {
    return (
      <main style={{ padding: 16, maxWidth: 1080, margin: '0 auto', display: 'grid', gap: 16 }}>
        <SiteHeader />
        <section style={card}>
          {loading ? (isEnglish ? 'Loading page editor...' : '正在加载页面编辑器...') : error}
        </section>
        <SiteFooter />
      </main>
    )
  }

  return (
    <main style={{ padding: 16, maxWidth: 1080, margin: '0 auto', display: 'grid', gap: 16 }}>
      <SiteHeader />

      <div style={{ display: 'grid', gap: 6 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>
          {draft.mode === 'live' ? (isEnglish ? 'Quick Timeline' : '生活记录') : (isEnglish ? 'Page Editor' : '页面编辑')}
        </h1>
        <div style={{ color: 'var(--muted)', fontSize: 15, fontWeight: 500, wordBreak: 'break-all' }}>
          {isEnglish ? 'Target file: ' : '目标文件：'}
          {draft.filePath}
        </div>
        <div style={{ color: 'var(--muted)', fontSize: 15, fontWeight: 500 }}>{status}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
        <button type="button" onClick={() => setActiveTab(activeTab === 'edit' ? 'preview' : 'edit')} style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: activeTab === 'edit' ? 'var(--card)' : 'var(--accent)', color: activeTab === 'edit' ? 'var(--foreground)' : 'var(--accent-contrast)', fontWeight: 700 }}>
          {activeTab === 'edit' ? (isEnglish ? 'Preview' : '预览') : (isEnglish ? 'Edit' : '编辑')}
        </button>
        <button type="button" onClick={() => { savePageDraftToStorage(draft); setStatus(`${isEnglish ? 'Saved manually' : '已手动保存'} ${new Date().toLocaleTimeString()}`) }} style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', fontWeight: 700 }}>
          {isEnglish ? 'Save' : '保存'}
        </button>
        <button type="button" onClick={() => setShowConfirm(true)} disabled={publishing} style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid var(--accent)', background: 'var(--accent)', color: 'var(--accent-contrast)', fontWeight: 700 }}>
          {publishing ? (isEnglish ? 'Publishing...' : '发布中...') : (isEnglish ? 'Publish' : '发布')}
        </button>
        <ThemeToggle />
      </div>

      {error ? <div style={{ padding: 12, borderRadius: 12, background: 'color-mix(in srgb, var(--danger) 8%, var(--card) 92%)', color: 'var(--danger)', border: '1px solid color-mix(in srgb, var(--danger) 24%, var(--border) 76%)', fontSize: 14 }}>{error}</div> : null}

      {activeTab === 'edit' ? (
        <div style={{ display: 'grid', gap: 20 }}>
          {draft.mode === 'live' ? (
            <section style={card}>
              <h2 style={{ margin: 0, fontSize: 18 }}>{isEnglish ? 'Quick Entry' : '快速记录'}</h2>
              <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
                <textarea ref={entryRef} value={newEntryContent} onChange={(event) => setNewEntryContent(event.target.value)} rows={5} style={{ ...input, minHeight: 140, resize: 'vertical', lineHeight: 1.7 }} />
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                  {isEnglish ? 'A timestamp tag will be added automatically. Keep the first line as `## Your Title`.' : '会自动附带时间戳标签。请保持第一行是 `## 标题`。'}
                </div>
                <button type="button" onClick={addEntry} style={{ padding: '13px 16px', borderRadius: 12, border: '1px solid var(--accent)', background: 'var(--accent)', color: 'var(--accent-contrast)', fontWeight: 700 }}>
                  {isEnglish ? 'Add New Entry' : '添加新记录'}
                </button>
              </div>
            </section>
          ) : null}

          <section style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>{isEnglish ? 'Images' : '图片'}</h2>
              <button type="button" onClick={() => setImagesOpen((prev) => !prev)} style={sectionToggleStyle(imagesOpen)}>
                {imagesOpen ? (isEnglish ? 'Collapse' : '收起') : (isEnglish ? 'Expand' : '展开')}
              </button>
            </div>
            {imagesOpen ? (
              <div style={{ marginTop: 14, display: 'grid', gap: 14 }}>
                <ImageUploader existingAssets={draft.assets} settings={settings} onUploaded={addAsset} onInsertMarkdown={insertMarkdown} />
                {draft.assets.map((asset) => (
                  <div key={asset.name} style={{ padding: 12, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--card-muted)', display: 'grid', gap: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '72px minmax(0, 1fr)', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 72, height: 72, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--card)' }}>
                        {asset.previewUrl ? <img src={asset.previewUrl} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : null}
                      </div>
                      <div style={{ fontWeight: 700, wordBreak: 'break-all' }}>{asset.name}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                      <button type="button" onClick={() => insertMarkdown(`![${asset.name.replace(/\.[^.]+$/i, '')}](${asset.name})`)} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', fontWeight: 700 }}>
                        {isEnglish ? 'Insert' : '插入'}
                      </button>
                      <button type="button" onClick={() => deleteAsset(asset.name)} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid color-mix(in srgb, var(--danger) 36%, var(--border) 64%)', background: 'var(--card)', color: 'var(--danger)', fontWeight: 700 }}>
                        {isEnglish ? 'Delete' : '删除'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <section style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>
                {draft.mode === 'live' ? (isEnglish ? 'Entries' : '记录列表') : (isEnglish ? 'Page Content' : '页面内容')}
              </h2>
              <button type="button" onClick={() => draft.mode === 'live' ? setEntriesOpen((prev) => !prev) : setPageContentOpen((prev) => !prev)} style={sectionToggleStyle(draft.mode === 'live' ? entriesOpen : pageContentOpen)}>
                {(draft.mode === 'live' ? entriesOpen : pageContentOpen) ? (isEnglish ? 'Collapse' : '收起') : (isEnglish ? 'Expand' : '展开')}
              </button>
            </div>
            {draft.mode === 'live' ? (
              entriesOpen ? (
                <div style={{ marginTop: 14, display: 'grid', gap: 12 }}>
                  {draft.entries.map((entry) => (
                    <div key={entry.id} style={{ padding: 12, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--card-muted)', display: 'grid', gap: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0, flex: 1 }}>
                          <input type="text" value={entry.title} onChange={(event) => updateEntry(entry.id, { title: event.target.value })} style={{ minWidth: 180, flex: '1 1 220px', padding: '8px 10px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', fontSize: 14, fontWeight: 700 }} />
                          {entry.timestamp ? <div style={{ padding: '6px 10px', borderRadius: 999, background: 'var(--accent-soft)', color: 'var(--accent-soft-text)', fontSize: 12, fontWeight: 700 }}>{entry.timestamp}</div> : null}
                        </div>
                        <button type="button" onClick={() => deleteEntry(entry.id)} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid color-mix(in srgb, var(--danger) 36%, var(--border) 64%)', background: 'var(--card)', color: 'var(--danger)', fontWeight: 700 }}>
                          {isEnglish ? 'Delete' : '删除'}
                        </button>
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
                    <button type="button" onClick={() => setShowTools((prev) => !prev)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card-muted)', color: 'var(--foreground)', fontWeight: 700 }}>
                      <span>{isEnglish ? 'Markdown Tools' : 'Markdown 工具'}</span>
                      <span>{showTools ? '▲' : '▼'}</span>
                    </button>
                    {showTools ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(92px, 1fr))', gap: 10 }}>{tools.map((tool) => <button key={tool.key} type="button" onClick={tool.onClick} style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card-muted)', color: 'var(--foreground)', fontWeight: 700 }}>{tool.label}</button>)}</div> : null}
                  </div>
                  <textarea ref={bodyRef} value={draft.body} onChange={(event) => updateBody(event.target.value)} rows={12} style={{ ...input, marginTop: 14, minHeight: 320, resize: 'none', overflow: 'hidden', lineHeight: 1.7, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }} />
                </>
              ) : null
            )}
          </section>

          <section style={card}>
            <h2 style={{ margin: 0, fontSize: 18 }}>{isEnglish ? 'Frontmatter' : 'Frontmatter 设置'}</h2>
            <textarea value={draft.frontmatterRaw} onChange={(event) => updateDraft((current) => ({ ...current, frontmatterRaw: event.target.value }))} rows={8} style={{ ...input, marginTop: 14, minHeight: 180, resize: 'vertical', lineHeight: 1.6, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }} />
          </section>
        </div>
      ) : (
        <section style={card}>
          <MarkdownPreview body={previewBody} assets={draft.assets} />
        </section>
      )}

      {showConfirm ? (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 12, zIndex: 120 }} onClick={() => !publishing && setShowConfirm(false)}>
          <div style={{ width: '100%', maxWidth: 820, background: 'var(--card)', borderRadius: 20, padding: 18, boxShadow: '0 20px 40px rgba(0,0,0,0.18)', display: 'grid', gap: 12 }} onClick={(event) => event.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{isEnglish ? 'Publish this page to GitHub?' : '确认将这个页面发布到 GitHub？'}</div>
            <div style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>{isEnglish ? 'Target file: ' : '目标文件：'}{draft.filePath}</div>
            <button type="button" onClick={publish} disabled={publishing} style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: '1px solid var(--accent)', background: 'var(--accent)', color: 'var(--accent-contrast)', fontSize: 16, fontWeight: 700 }}>
              {publishing ? (isEnglish ? 'Submitting to GitHub...' : '正在提交到 GitHub...') : (isEnglish ? 'Confirm Publish' : '确认发布')}
            </button>
            <button type="button" onClick={() => setShowConfirm(false)} disabled={publishing} style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', fontSize: 16, fontWeight: 600 }}>
              {isEnglish ? 'Cancel' : '取消'}
            </button>
          </div>
        </div>
      ) : null}

      <SiteFooter />
    </main>
  )
}
