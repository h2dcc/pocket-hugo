'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ImageUploader from '@/components/post/ImageUploader'
import { SiteFooter, SiteHeader } from '@/components/layout/SiteChrome'
import MarkdownPreview from '@/components/post/MarkdownPreview'
import ThemeToggle from '@/components/theme/ThemeToggle'
import {
  loadDraftFromStorage,
  removeDraftFromStorage,
  saveDraftToStorage,
} from '@/lib/draft-storage'
import { normalizeFrontmatter } from '@/lib/frontmatter'
import { restoreAssetPreviewUrls } from '@/lib/image'
import { renderIndexMd } from '@/lib/markdown'
import {
  DEFAULT_SITE_SETTINGS,
  loadSiteSettingsFromStorage,
  type SiteSettings,
} from '@/lib/site-settings'
import { useLanguage } from '@/lib/use-language'
import type { DraftAsset, PostDraft } from '@/lib/types'

function createCustomFieldId() {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function getAssetAltText(assetName: string) {
  return assetName.replace(/\.[^.]+$/i, '')
}

function findCoverAsset(draft: PostDraft | null) {
  if (!draft?.frontmatter.image) return null
  return draft.assets.find((asset) => asset.name === draft.frontmatter.image) || null
}

type MarkdownToolbarAction = {
  key: string
  label: string
  onClick: () => void
}

export default function EditorPage() {
  const { isEnglish } = useLanguage()
  const params = useParams<{ folderName: string }>()
  const folderName = params.folderName
  const router = useRouter()
  const bodyTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState('')
  const [draft, setDraft] = useState<PostDraft | null>(null)
  const [status, setStatus] = useState('')
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS)
  const [basicInfoOpen, setBasicInfoOpen] = useState(true)
  const [imagesOpen, setImagesOpen] = useState(true)
  const [bodyOpen, setBodyOpen] = useState(true)
  const [markdownToolsOpen, setMarkdownToolsOpen] = useState(false)
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false)
  const [previewAsset, setPreviewAsset] = useState<DraftAsset | null>(null)

  const cardStyle: React.CSSProperties = {
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: 14,
    background: 'var(--card)',
    boxShadow: 'var(--shadow)',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    marginTop: 8,
    borderRadius: 10,
    border: '1px solid var(--border)',
    outline: 'none',
    fontSize: 16,
    background: 'var(--card)',
    color: 'var(--foreground)',
  }

  const labelTitleStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--foreground)',
  }

  const sectionTitleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
  }

  useEffect(() => {
    setSiteSettings(loadSiteSettingsFromStorage())
  }, [])

  useEffect(() => {
    if (!folderName) return

    const parsed = loadDraftFromStorage(folderName)
    if (!parsed) return

    setDraft({
      ...parsed,
      frontmatter: normalizeFrontmatter(parsed.frontmatter),
      assets: restoreAssetPreviewUrls(parsed.assets || []),
    })
  }, [folderName])

  useEffect(() => {
    if (!draft) return
    saveDraftToStorage(draft)
    setStatus(isEnglish ? 'Saved locally' : '已保存到本地')
  }, [draft, folderName, isEnglish])

  useEffect(() => {
    const textarea = bodyTextareaRef.current
    if (!textarea) return

    textarea.style.height = '0px'
    textarea.style.height = `${Math.max(320, textarea.scrollHeight)}px`
  }, [draft?.body, activeTab, bodyOpen])

  const markdownOutput = useMemo(() => {
    if (!draft) return ''
    return renderIndexMd(draft.frontmatter, draft.body)
  }, [draft])

  const coverAsset = useMemo(() => findCoverAsset(draft), [draft])

  function updateFrontmatter<K extends keyof PostDraft['frontmatter']>(
    key: K,
    value: PostDraft['frontmatter'][K],
  ) {
    setDraft((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        frontmatter: {
          ...prev.frontmatter,
          [key]: value,
        },
      }
    })
  }

  function updateCustomField(
    fieldId: string,
    patch: Partial<PostDraft['frontmatter']['customFields'][number]>,
  ) {
    setDraft((prev) => {
      if (!prev) return prev

      return {
        ...prev,
        frontmatter: {
          ...prev.frontmatter,
          customFields: prev.frontmatter.customFields.map((field) =>
            field.id === fieldId ? { ...field, ...patch } : field,
          ),
        },
      }
    })
  }

  function addCustomField() {
    setDraft((prev) => {
      if (!prev) return prev

      return {
        ...prev,
        frontmatter: {
          ...prev.frontmatter,
          customFields: [
            ...prev.frontmatter.customFields,
            {
              id: createCustomFieldId(),
              key: '',
              type: 'text',
              value: '',
            },
          ],
        },
      }
    })
  }

  function removeCustomField(fieldId: string) {
    setDraft((prev) => {
      if (!prev) return prev

      return {
        ...prev,
        frontmatter: {
          ...prev.frontmatter,
          customFields: prev.frontmatter.customFields.filter((field) => field.id !== fieldId),
        },
      }
    })
  }

  function insertMarkdownAtCursor(markdown: string) {
    const textarea = bodyTextareaRef.current

    setDraft((prev) => {
      if (!prev) return prev

      if (!textarea) {
        return {
          ...prev,
          body: prev.body ? `${prev.body}\n\n${markdown}` : markdown,
        }
      }

      const selectionStart = textarea.selectionStart ?? prev.body.length
      const selectionEnd = textarea.selectionEnd ?? prev.body.length
      const nextBody =
        prev.body.slice(0, selectionStart) + markdown + prev.body.slice(selectionEnd)

      const nextCursor = selectionStart + markdown.length

      requestAnimationFrame(() => {
        textarea.focus()
        textarea.setSelectionRange(nextCursor, nextCursor)
      })

      return {
        ...prev,
        body: nextBody,
      }
    })
  }

  function wrapSelection(prefix: string, suffix = prefix, placeholder = '') {
    const textarea = bodyTextareaRef.current

    setDraft((prev) => {
      if (!prev) return prev

      if (!textarea) {
        const fallback = `${prefix}${placeholder}${suffix}`
        return {
          ...prev,
          body: prev.body ? `${prev.body}\n\n${fallback}` : fallback,
        }
      }

      const selectionStart = textarea.selectionStart ?? prev.body.length
      const selectionEnd = textarea.selectionEnd ?? prev.body.length
      const selectedText = prev.body.slice(selectionStart, selectionEnd) || placeholder
      const wrappedText = `${prefix}${selectedText}${suffix}`
      const nextBody =
        prev.body.slice(0, selectionStart) + wrappedText + prev.body.slice(selectionEnd)
      const nextStart = selectionStart + prefix.length
      const nextEnd = nextStart + selectedText.length

      requestAnimationFrame(() => {
        textarea.focus()
        textarea.setSelectionRange(nextStart, nextEnd)
      })

      return {
        ...prev,
        body: nextBody,
      }
    })
  }

  function prefixSelection(prefix: string, placeholder: string) {
    const textarea = bodyTextareaRef.current

    setDraft((prev) => {
      if (!prev) return prev

      if (!textarea) {
        return {
          ...prev,
          body: prev.body ? `${prev.body}\n${prefix}${placeholder}` : `${prefix}${placeholder}`,
        }
      }

      const selectionStart = textarea.selectionStart ?? prev.body.length
      const selectionEnd = textarea.selectionEnd ?? prev.body.length
      const selectedText = prev.body.slice(selectionStart, selectionEnd) || placeholder
      const nextText = selectedText
        .split('\n')
        .map((line) => `${prefix}${line || placeholder}`)
        .join('\n')
      const nextBody =
        prev.body.slice(0, selectionStart) + nextText + prev.body.slice(selectionEnd)

      requestAnimationFrame(() => {
        textarea.focus()
        textarea.setSelectionRange(selectionStart, selectionStart + nextText.length)
      })

      return {
        ...prev,
        body: nextBody,
      }
    })
  }

  function handleAssetUploaded(asset: DraftAsset) {
    setDraft((prev) => {
      if (!prev) return prev

      return {
        ...prev,
        assets: [...prev.assets, asset],
      }
    })
  }

  function handleDeleteAsset(assetName: string) {
    setDraft((prev) => {
      if (!prev) return prev

      return {
        ...prev,
        assets: prev.assets.filter((asset) => asset.name !== assetName),
        frontmatter: {
          ...prev.frontmatter,
          image: prev.frontmatter.image === assetName ? '' : prev.frontmatter.image,
        },
      }
    })
  }

  function validateBeforePublish() {
    if (!draft) return false

    if (!draft.frontmatter.title.trim()) {
      setPublishError(isEnglish ? 'Please enter a title first.' : '请先填写标题')
      return false
    }

    if (!draft.frontmatter.slug.trim()) {
      setPublishError(isEnglish ? 'Please enter a slug first.' : '请先填写 slug')
      return false
    }

    if (!draft.frontmatter.date.trim()) {
      setPublishError(isEnglish ? 'Please enter a date first.' : '请先填写日期')
      return false
    }

    setPublishError('')
    return true
  }

  function handlePublishClick() {
    if (!validateBeforePublish()) return
    setPublishConfirmOpen(true)
  }

  function handleManualSave() {
    if (!draft) return
    saveDraftToStorage(draft)
    setStatus(`${isEnglish ? 'Saved manually' : '已手动保存'} ${new Date().toLocaleTimeString()}`)
  }

  async function handleConfirmPublish() {
    if (!draft) return

    setPublishing(true)
    setPublishError('')

    try {
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draft),
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.error || '发布失败')
      }

      removeDraftFromStorage(draft.folderName)
      setPublishConfirmOpen(false)
      router.push(
        `/publish/${draft.folderName}?path=${encodeURIComponent(result.path)}&files=${result.fileCount}&commitCount=${result.commitCount}&repo=${encodeURIComponent(result.repo || '')}&branch=${encodeURIComponent(result.branch || '')}&changes=${encodeURIComponent(JSON.stringify(result.fileChanges || []))}`,
      )
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : '发布失败')
      setPublishConfirmOpen(false)
    } finally {
      setPublishing(false)
    }
  }

  function setAsCover(assetName: string) {
    updateFrontmatter('image', assetName)
  }

  const toolbarActions: MarkdownToolbarAction[] = [
    {
      key: 'heading',
      label: isEnglish ? 'H2' : '标题',
      onClick: () => prefixSelection('## ', isEnglish ? 'Section Title' : '小节标题'),
    },
    {
      key: 'bold',
      label: isEnglish ? 'Bold' : '加粗',
      onClick: () => wrapSelection('**', '**', isEnglish ? 'bold text' : '加粗文字'),
    },
    {
      key: 'italic',
      label: isEnglish ? 'Italic' : '斜体',
      onClick: () => wrapSelection('*', '*', isEnglish ? 'italic text' : '斜体文字'),
    },
    {
      key: 'link',
      label: isEnglish ? 'Link' : '链接',
      onClick: () =>
        wrapSelection('[', '](https://example.com)', isEnglish ? 'link text' : '链接文字'),
    },
    {
      key: 'code',
      label: isEnglish ? 'Code' : '代码',
      onClick: () => wrapSelection('`', '`', isEnglish ? 'code' : '代码'),
    },
    {
      key: 'codeblock',
      label: isEnglish ? 'Code Block' : '代码块',
      onClick: () =>
        insertMarkdownAtCursor(
          isEnglish
            ? '\n```ts\nconst example = true\n```\n'
            : '\n```ts\nconst 示例 = true\n```\n',
        ),
    },
    {
      key: 'quote',
      label: isEnglish ? 'Quote' : '引用',
      onClick: () => prefixSelection('> ', isEnglish ? 'Quoted text' : '引用内容'),
    },
    {
      key: 'list',
      label: isEnglish ? 'List' : '列表',
      onClick: () => prefixSelection('- ', isEnglish ? 'List item' : '列表项'),
    },
    {
      key: 'table',
      label: isEnglish ? 'Table' : '表格',
      onClick: () =>
        insertMarkdownAtCursor(
          isEnglish
            ? '\n| Column 1 | Column 2 |\n| --- | --- |\n| Value A | Value B |\n'
            : '\n| 列 1 | 列 2 |\n| --- | --- |\n| 内容 A | 内容 B |\n',
        ),
    },
  ]

  if (!draft) {
    return (
      <main style={{ padding: 'clamp(16px, 3vw, 28px)', maxWidth: 1080, margin: '0 auto', display: 'grid', gap: 16 }}>
        <SiteHeader />
        <h1>{isEnglish ? 'Edit Post' : '编辑文章'}</h1>
        <p>{isEnglish ? 'Loading draft, or the draft could not be found.' : '正在加载草稿，或草稿不存在。'}</p>
        <SiteFooter />
      </main>
    )
  }

  return (
    <main
      style={{
        padding: 16,
        maxWidth: 1080,
        margin: '0 auto',
        display: 'grid',
        gap: 16,
      }}
    >
      <SiteHeader />

      <div style={{ display: 'grid', gap: 6 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>{isEnglish ? 'Edit Post' : '编辑文章'}</h1>
        <div style={{ color: 'var(--muted)', fontSize: 15, wordBreak: 'break-all', fontWeight: 500 }}>
          {isEnglish ? 'Folder: ' : '文件夹：'}
          {draft.folderName}
        </div>
        <div style={{ color: 'var(--muted)', fontSize: 15, fontWeight: 500 }}>{status}</div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab(activeTab === 'edit' ? 'preview' : 'edit')}
          style={{
            padding: '12px 14px',
            borderRadius: 12,
            border: '1px solid var(--border)',
            background: activeTab === 'edit' ? 'var(--card)' : 'var(--accent)',
            color: activeTab === 'edit' ? 'var(--foreground)' : 'var(--accent-contrast)',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          {activeTab === 'edit' ? (isEnglish ? 'Preview' : '预览') : isEnglish ? 'Edit' : '编辑'}
        </button>

        <button
          type="button"
          onClick={handleManualSave}
          style={{
            padding: '12px 14px',
            borderRadius: 12,
            border: '1px solid var(--border)',
            background: 'var(--card)',
            color: 'var(--foreground)',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          {isEnglish ? 'Save' : '保存'}
        </button>

        <button
          type="button"
          onClick={handlePublishClick}
          disabled={publishing}
          style={{
            padding: '12px 14px',
            borderRadius: 12,
            border: '1px solid var(--accent)',
            background: 'var(--accent)',
            color: 'var(--accent-contrast)',
            cursor: publishing ? 'not-allowed' : 'pointer',
            opacity: publishing ? 0.7 : 1,
            fontWeight: 700,
          }}
        >
          {publishing ? (isEnglish ? 'Publishing...' : '发布中...') : isEnglish ? 'Publish' : '发布'}
        </button>

        <ThemeToggle />
      </div>

      {publishError ? (
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: '#fff1f0',
            color: '#cf1322',
            border: '1px solid #ffa39e',
            fontSize: 14,
          }}
        >
          {publishError}
        </div>
      ) : null}

      {activeTab === 'edit' ? (
        <div style={{ display: 'grid', gap: 24 }}>
          <section style={cardStyle}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <h2 style={sectionTitleStyle}>{isEnglish ? 'Basic Info' : '基本信息'}</h2>
              <button
                type="button"
                onClick={() => setBasicInfoOpen((prev) => !prev)}
                style={{
                  minWidth: 88,
                  padding: '10px 14px',
                  borderRadius: 999,
                  border: '1px solid var(--border)',
                  background: basicInfoOpen ? 'var(--accent)' : 'var(--card)',
                  color: basicInfoOpen ? 'var(--accent-contrast)' : 'var(--foreground)',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {basicInfoOpen ? (isEnglish ? 'Collapse' : '收起') : isEnglish ? 'Expand' : '展开'}
              </button>
            </div>

            {basicInfoOpen ? (
              <div style={{ display: 'grid', gap: 14, marginTop: 14 }}>
                <label>
                  <div style={labelTitleStyle}>{isEnglish ? 'Title' : '标题'}</div>
                  <input
                    type="text"
                    value={draft.frontmatter.title}
                    onChange={(e) => updateFrontmatter('title', e.target.value)}
                    style={inputStyle}
                  />
                </label>

                <label>
                  <div style={labelTitleStyle}>{isEnglish ? 'Description' : '摘要'}</div>
                  <textarea
                    value={draft.frontmatter.description}
                    onChange={(e) => updateFrontmatter('description', e.target.value)}
                    rows={4}
                    style={{
                      ...inputStyle,
                      resize: 'vertical',
                      minHeight: 100,
                    }}
                  />
                </label>

                <label>
                  <div style={labelTitleStyle}>Slug</div>
                  <input
                    type="text"
                    value={draft.frontmatter.slug}
                    onChange={(e) => updateFrontmatter('slug', e.target.value)}
                    style={inputStyle}
                  />
                </label>

                <label>
                  <div style={labelTitleStyle}>{isEnglish ? 'Date' : '日期'}</div>
                  <input
                    type="text"
                    value={draft.frontmatter.date}
                    onChange={(e) => updateFrontmatter('date', e.target.value)}
                    style={inputStyle}
                  />
                </label>

                <label>
                  <div style={labelTitleStyle}>{isEnglish ? 'Categories (comma-separated)' : '分类（逗号分隔）'}</div>
                  <input
                    type="text"
                    value={draft.frontmatter.categories.join(', ')}
                    onChange={(e) =>
                      updateFrontmatter(
                        'categories',
                        e.target.value.split(',').map((item) => item.trim()).filter(Boolean),
                      )
                    }
                    style={inputStyle}
                  />
                </label>

                <label>
                  <div style={labelTitleStyle}>{isEnglish ? 'Tags (comma-separated)' : '标签（逗号分隔）'}</div>
                  <input
                    type="text"
                    value={draft.frontmatter.tags.join(', ')}
                    onChange={(e) =>
                      updateFrontmatter(
                        'tags',
                        e.target.value.split(',').map((item) => item.trim()).filter(Boolean),
                      )
                    }
                    style={inputStyle}
                  />
                </label>

                <label>
                  <div style={labelTitleStyle}>{isEnglish ? 'Cover Image' : '封面图'}</div>
                  <input
                    type="text"
                    value={draft.frontmatter.image}
                    onChange={(e) => updateFrontmatter('image', e.target.value)}
                    style={inputStyle}
                  />
                </label>

                <div style={{ display: 'grid', gap: 10 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div style={labelTitleStyle}>{isEnglish ? 'Custom Frontmatter Fields' : '自定义 Frontmatter 字段'}</div>
                    <button
                      type="button"
                      onClick={addCustomField}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 999,
                        border: '1px solid var(--accent)',
                        background: 'var(--accent)',
                        color: 'var(--accent-contrast)',
                        cursor: 'pointer',
                        fontSize: 20,
                        lineHeight: 1,
                      }}
                    >
                      +
                    </button>
                  </div>

                  {draft.frontmatter.customFields.map((field) => (
                    <div
                      key={field.id}
                      style={{
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                        padding: 12,
                        display: 'grid',
                        gap: 10,
                        background: 'var(--card-muted)',
                      }}
                    >
                      <input
                        type="text"
                        value={field.key}
                        onChange={(e) => updateCustomField(field.id, { key: e.target.value })}
                        placeholder={isEnglish ? 'Field name, for example aliases' : '字段名，例如 aliases'}
                        style={{
                          ...inputStyle,
                          marginTop: 0,
                        }}
                      />
                      <select
                        value={field.type}
                        onChange={(e) =>
                          updateCustomField(field.id, {
                            type: e.target.value === 'list' ? 'list' : 'text',
                          })
                        }
                        style={{
                          ...inputStyle,
                          marginTop: 0,
                        }}
                      >
                        <option value="text">{isEnglish ? 'Text' : '文本'}</option>
                        <option value="list">{isEnglish ? 'List (comma-separated)' : '列表（逗号分隔）'}</option>
                      </select>
                      <textarea
                        value={field.value}
                        onChange={(e) => updateCustomField(field.id, { value: e.target.value })}
                        placeholder={
                          field.type === 'list'
                            ? isEnglish
                              ? 'Separate multiple values with commas'
                              : '多个值请用逗号分隔'
                            : isEnglish
                              ? 'Field value'
                              : '字段值'
                        }
                        rows={field.type === 'list' ? 3 : 2}
                        style={{
                          ...inputStyle,
                          marginTop: 0,
                          resize: 'vertical',
                          minHeight: field.type === 'list' ? 88 : 68,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeCustomField(field.id)}
                        style={{
                          justifySelf: 'start',
                          padding: '8px 12px',
                          borderRadius: 10,
                          border: '1px solid #ef4444',
                          background: 'var(--card)',
                          color: '#ef4444',
                          cursor: 'pointer',
                        }}
                      >
                        {isEnglish ? 'Remove Field' : '删除字段'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <section style={cardStyle}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'grid', gap: 4 }}>
                <h2 style={sectionTitleStyle}>{isEnglish ? 'Images' : '图片'}</h2>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {isEnglish ? `${draft.assets.length} item(s)` : `共 ${draft.assets.length} 张`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setImagesOpen((prev) => !prev)}
                style={{
                  minWidth: 88,
                  padding: '10px 14px',
                  borderRadius: 999,
                  border: '1px solid var(--border)',
                  background: imagesOpen ? 'var(--accent)' : 'var(--card)',
                  color: imagesOpen ? 'var(--accent-contrast)' : 'var(--foreground)',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {imagesOpen ? (isEnglish ? 'Collapse' : '收起') : isEnglish ? 'Expand' : '展开'}
              </button>
            </div>

            {imagesOpen ? (
              <>
                <div style={{ marginTop: 14 }}>
                  <ImageUploader
                    existingAssets={draft.assets}
                    settings={siteSettings}
                    onUploaded={handleAssetUploaded}
                    onInsertMarkdown={insertMarkdownAtCursor}
                  />
                </div>

                <div style={{ marginTop: 10, fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                  {isEnglish ? 'Current settings: ' : '当前设置：'}
                  {siteSettings.imageConversionEnabled
                    ? isEnglish
                      ? `Convert to WebP, max width ${siteSettings.imageMaxWidth}px, quality ${siteSettings.imageQuality}`
                      : `默认压缩并转 webp，最大宽度 ${siteSettings.imageMaxWidth}px，质量 ${siteSettings.imageQuality}`
                    : isEnglish
                      ? 'Keep original image format'
                      : '保留原图格式'}
                  {isEnglish ? '. ' : '；'}
                  {siteSettings.autoImageNamingEnabled
                    ? isEnglish
                      ? 'Auto-number file names.'
                      : '自动编号命名。'
                    : isEnglish
                      ? 'Keep original file names.'
                      : '保留原始文件名。'}
                </div>

                <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
                  {draft.assets.map((asset) => {
                    const isCover = draft.frontmatter.image === asset.name

                    return (
                      <div
                        key={asset.name}
                        style={{
                          border: '1px solid var(--border)',
                          borderRadius: 12,
                          padding: 10,
                          display: 'grid',
                          gridTemplateColumns: '64px 1fr auto',
                          gap: 10,
                          alignItems: 'center',
                          background: 'var(--card-muted)',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setPreviewAsset(asset)}
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: 10,
                            overflow: 'hidden',
                            background: 'var(--card)',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          {asset.previewUrl ? (
                            <img
                              src={asset.previewUrl}
                              alt={asset.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                              }}
                            />
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{isEnglish ? 'No preview' : '无预览'}</span>
                          )}
                        </button>

                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 14,
                              wordBreak: 'break-all',
                              lineHeight: 1.4,
                            }}
                          >
                            {asset.name}
                          </div>

                          <div
                            style={{
                              marginTop: 4,
                              fontSize: 12,
                              color: isCover ? 'var(--accent-soft-text)' : 'var(--muted)',
                            }}
                          >
                            {isCover ? (isEnglish ? 'Current cover image' : '当前封面图') : isEnglish ? 'Regular image' : '普通图片'}
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            gap: 8,
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setAsCover(asset.name)}
                            style={{
                              padding: '10px 14px',
                              cursor: 'pointer',
                              borderRadius: 10,
                              border: isCover
                                ? '1px solid var(--accent)'
                                : '1px solid var(--border)',
                              background: isCover ? 'var(--accent)' : 'var(--card)',
                              color: isCover ? 'var(--accent-contrast)' : 'var(--foreground)',
                              fontSize: 14,
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {isEnglish ? 'Cover' : '封面'}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              insertMarkdownAtCursor(`![${getAssetAltText(asset.name)}](${asset.name})`)
                            }
                            style={{
                              padding: '10px 14px',
                              cursor: 'pointer',
                              borderRadius: 10,
                              border: '1px solid var(--border)',
                              background: 'var(--card)',
                              color: 'var(--foreground)',
                              fontSize: 14,
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {isEnglish ? 'Insert' : '插入'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteAsset(asset.name)}
                            style={{
                              padding: '10px 14px',
                              cursor: 'pointer',
                              borderRadius: 10,
                              border: '1px solid #ef4444',
                              background: 'var(--card)',
                              color: '#ef4444',
                              fontSize: 14,
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {isEnglish ? 'Delete' : '删除'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : null}
          </section>

          <section style={cardStyle}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <h2 style={sectionTitleStyle}>{isEnglish ? 'Body' : '正文'}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {draft.body.length} {isEnglish ? 'characters' : '字符'}
                </div>
                <button
                  type="button"
                  onClick={() => setBodyOpen((prev) => !prev)}
                  style={{
                    minWidth: 88,
                    padding: '10px 14px',
                    borderRadius: 999,
                    border: '1px solid var(--border)',
                    background: bodyOpen ? 'var(--accent)' : 'var(--card)',
                    color: bodyOpen ? 'var(--accent-contrast)' : 'var(--foreground)',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                    {bodyOpen ? (isEnglish ? 'Collapse' : '收起') : isEnglish ? 'Expand' : '展开'}
                </button>
              </div>
            </div>

            {bodyOpen ? (
              <>
                <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setMarkdownToolsOpen((prev) => !prev)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 12,
                      border: '1px solid var(--border)',
                      background: 'var(--card-muted)',
                      color: 'var(--foreground)',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    <span>{isEnglish ? 'Markdown Tools' : 'Markdown 工具'}</span>
                    <span
                      style={{
                        fontSize: 16,
                        transform: markdownToolsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 160ms ease',
                      }}
                    >
                      ▼
                    </span>
                  </button>

                  {markdownToolsOpen ? (
                    <>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(92px, 1fr))',
                          gap: 10,
                        }}
                      >
                        {toolbarActions.map((action) => (
                          <button
                            key={action.key}
                            type="button"
                            onClick={action.onClick}
                            title={action.label}
                            aria-label={action.label}
                            style={{
                              padding: '10px 12px',
                              borderRadius: 12,
                              border: '1px solid var(--border)',
                              background: 'var(--card-muted)',
                              color: 'var(--foreground)',
                              cursor: 'pointer',
                              fontSize: 14,
                              fontWeight: 700,
                              minHeight: 44,
                            }}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>

                      <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                        {isEnglish
                          ? 'Select text first to format it, or tap a button to insert a Markdown snippet at the cursor.'
                          : '先选中文字可直接套用格式；未选中时会在光标处插入一段 Markdown 模板。'}
                      </div>
                    </>
                  ) : null}
                </div>

                <textarea
                  ref={bodyTextareaRef}
                  value={draft.body}
                  onChange={(e) =>
                    setDraft((prev) => {
                      if (!prev) return prev
                      return {
                        ...prev,
                        body: e.target.value,
                      }
                    })
                  }
                  rows={12}
                  style={{
                    ...inputStyle,
                    marginTop: 14,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    minHeight: 320,
                    resize: 'none',
                    overflow: 'hidden',
                    lineHeight: 1.6,
                  }}
                />
              </>
            ) : null}
          </section>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 24 }}>
          <section style={cardStyle}>
            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'grid', gap: 6 }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)', letterSpacing: 1 }}>
                    {isEnglish ? 'PREVIEW' : '预览'}
                  </div>
                <h2 style={{ margin: 0, fontSize: 28, lineHeight: 1.25 }}>
                  {draft.frontmatter.title || (isEnglish ? 'Untitled Post' : '未填写标题')}
                </h2>
              </div>

              {coverAsset ? (
                <div style={{ display: 'grid', gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>
                    {isEnglish ? 'Cover Image' : '封面图'}
                  </div>
                  <div
                    style={{
                      borderRadius: 16,
                      overflow: 'hidden',
                      border: '1px solid var(--border)',
                      background: 'var(--card-muted)',
                    }}
                  >
                    <img
                      src={coverAsset.previewUrl}
                      alt={coverAsset.name}
                      style={{
                        width: '100%',
                        display: 'block',
                        objectFit: 'cover',
                        maxHeight: 320,
                      }}
                    />
                  </div>
                </div>
              ) : null}

              <MarkdownPreview body={draft.body} assets={draft.assets} />
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>index.md</h2>
            <pre
              style={{
                marginTop: 14,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: 13,
                lineHeight: 1.6,
                background: 'var(--markdown-code-bg)',
                padding: 12,
                borderRadius: 12,
                border: '1px solid var(--border)',
                overflowX: 'auto',
              }}
            >
              {markdownOutput}
            </pre>
          </section>
        </div>
      )}

      {publishConfirmOpen ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: 12,
            zIndex: 120,
          }}
          onClick={() => {
            if (!publishing) {
              setPublishConfirmOpen(false)
            }
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 820,
              background: 'var(--card)',
              borderRadius: 20,
              padding: 18,
              boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
              display: 'grid',
              gap: 12,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {isEnglish ? 'Publish to GitHub?' : '确认发布到 GitHub？'}
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
              {isEnglish
                ? 'This will commit `index.md` together with the images and other assets in the current article folder.'
                : '本次会将 `index.md` 和当前文章目录下的图片等资源文件一起提交到 GitHub。'}
              <br />
              {isEnglish ? 'Article folder: ' : '文章目录：'}
              {draft.folderName}
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              <button
                type="button"
                onClick={handleConfirmPublish}
                disabled={publishing}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 14,
                  border: '1px solid var(--accent)',
                  background: 'var(--accent)',
                  color: 'var(--accent-contrast)',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: publishing ? 'not-allowed' : 'pointer',
                  opacity: publishing ? 0.75 : 1,
                }}
              >
                {publishing ? (isEnglish ? 'Submitting to GitHub...' : '正在提交到 GitHub...') : isEnglish ? 'Confirm Publish' : '确认发布'}
              </button>
              <button
                type="button"
                onClick={() => setPublishConfirmOpen(false)}
                disabled={publishing}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 14,
                  border: '1px solid var(--border)',
                  background: 'var(--card)',
                  color: 'var(--foreground)',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: publishing ? 'not-allowed' : 'pointer',
                }}
              >
                {isEnglish ? 'Cancel' : '取消'}
              </button>
            </div>
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
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    wordBreak: 'break-all',
                  }}
                >
                  {previewAsset.name}
                </div>
                <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(255,255,255,0.72)' }}>
                  {isEnglish ? 'Tap outside to close' : '点空白处关闭'}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewAsset(null)}
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
                {isEnglish ? 'Close' : '关闭'}
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
