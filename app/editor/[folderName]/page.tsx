'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ImageUploader from '@/components/post/ImageUploader'
import MarkdownComposer from '@/components/post/MarkdownComposer'
import { SiteFooter, SiteHeader } from '@/components/layout/SiteChrome'
import MarkdownPreview from '@/components/post/MarkdownPreview'
import ThemeToggle from '@/components/theme/ThemeToggle'
import IconButton from '@/components/ui/IconButton'
import SectionToggleButton from '@/components/ui/SectionToggleButton'
import {
  loadDraftFromStorage,
  removeDraftFromStorage,
  saveDraftToStorage,
} from '@/lib/draft-storage'
import { normalizeFrontmatter } from '@/lib/frontmatter'
import { restoreAssetPreviewUrls } from '@/lib/image'
import { renderIndexMd } from '@/lib/markdown'
import {
  DEFAULT_FRONTMATTER_PREFERENCES,
  normalizeFrontmatterPreferences,
  type FrontmatterPreferences,
} from '@/lib/frontmatter-preferences'
import {
  DEFAULT_SITE_SETTINGS,
  loadSiteSettingsFromStorage,
  type SiteSettings,
} from '@/lib/site-settings'
import { useLanguage } from '@/lib/use-language'
import { useRequireAuth } from '@/lib/use-require-auth'
import type { DraftAsset, PostDraft } from '@/lib/types'

function createCustomFieldId() {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function getAssetAltText(assetName: string) {
  return assetName.replace(/\.[^.]+$/i, '')
}

function buildAssetMarkdown(assetName: string) {
  return `![${getAssetAltText(assetName)}](${assetName})`
}

function findCoverAsset(draft: PostDraft | null) {
  if (!draft?.frontmatter.image) return null
  return draft.assets.find((asset) => asset.name === draft.frontmatter.image) || null
}

function consumeCustomField(
  customFields: PostDraft['frontmatter']['customFields'],
  keys: string[],
) {
  const normalizedKeys = keys
    .map((key) => key.trim().toLowerCase())
    .filter(Boolean)
  const index = customFields.findIndex((field) =>
    normalizedKeys.includes(field.key.trim().toLowerCase()),
  )
  if (index < 0) return null

  const [found] = customFields.splice(index, 1)
  return found
}

function parseListValue(field: { type: 'text' | 'list'; value: string } | null) {
  if (!field) return []
  return field.value
    .split(/[，,]/)
    .map((item) => item.trim())
    .filter(Boolean)
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

function normalizeFieldKey(value: string) {
  return value.trim().toLowerCase()
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function TextStatsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 12H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 17H12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function parseEnglishCommaList(value: string) {
  return value
    .replace(/，/g, ',')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function isTouchLikeViewport() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0
}

function applyFrontmatterPreferencesToDraft(
  draft: PostDraft,
  preferences: FrontmatterPreferences,
): PostDraft {
  const frontmatter = normalizeFrontmatter(draft.frontmatter)
  const customFields = [...frontmatter.customFields]
  const mappedPreferences = normalizeFrontmatterPreferences(preferences)

  const slugField = consumeCustomField(customFields, [mappedPreferences.slugFieldName])
  const categoriesField = consumeCustomField(customFields, [
    mappedPreferences.categoriesFieldName,
  ])
  const tagsField = consumeCustomField(customFields, [mappedPreferences.tagsFieldName])
  const coverField = consumeCustomField(customFields, [
    mappedPreferences.coverImageFieldName,
    'featured-image',
    'featured_image',
    'cover',
    'cover-image',
    'cover_image',
  ])

  if (!frontmatter.slug.trim() && slugField) {
    frontmatter.slug = slugField.value.trim()
  }
  if (!frontmatter.categories.length) {
    frontmatter.categories = parseListValue(categoriesField)
  }
  if (!frontmatter.tags.length) {
    frontmatter.tags = parseListValue(tagsField)
  }
  if (!frontmatter.image.trim() && coverField) {
    frontmatter.image = coverField.value.trim()
  }

  for (const extraField of mappedPreferences.extraBasicInfoFields) {
    const exists = customFields.some(
      (field) => normalizeFieldKey(field.key) === normalizeFieldKey(extraField.key),
    )
    if (!exists && extraField.key.trim()) {
      customFields.push({
        id: `pref-${extraField.id}`,
        key: extraField.key.trim(),
        type: extraField.type,
        value: '',
      })
    }
  }

  frontmatter.customFields = customFields

  return {
    ...draft,
    frontmatter,
    frontmatterPreferences: mappedPreferences,
  }
}

export default function EditorPage() {
  const { isEnglish } = useLanguage()
  const params = useParams<{ folderName: string }>()
  const folderName = params.folderName
  const router = useRouter()
  const checkingAuth = useRequireAuth(folderName ? `/editor/${folderName}` : '/editor')
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
  const [bodyEditorHeight, setBodyEditorHeight] = useState(640)
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false)
  const [previewAsset, setPreviewAsset] = useState<DraftAsset | null>(null)
  const [copiedAssetName, setCopiedAssetName] = useState('')
  const [categoryInput, setCategoryInput] = useState('')
  const [tagInput, setTagInput] = useState('')

  const cardStyle: React.CSSProperties = {
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: 'clamp(12px, 3vw, 14px)',
    background: 'var(--card)',
    boxShadow: 'var(--shadow)',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    marginTop: 8,
    borderRadius: 10,
    border: '1px solid var(--border)',
    outline: 'none',
    fontSize: 14,
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
    fontSize: 14,
    fontWeight: 700,
  }

  const bodyHeightButtonStyle: React.CSSProperties = {
    minWidth: 36,
    height: 30,
    padding: '0 10px',
    borderRadius: 999,
    border: '1px solid var(--border)',
    background: 'var(--card-muted)',
    color: 'var(--foreground)',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  }

  useEffect(() => {
    const loadedSettings = loadSiteSettingsFromStorage()
    setSiteSettings(loadedSettings)

    if (isTouchLikeViewport()) {
      setBodyEditorHeight(380)
    }

    if (!folderName) return

    let cancelled = false

    async function loadDraft() {
      const parsed = await loadDraftFromStorage(folderName)
      if (!parsed || cancelled) return

      const restoredDraft: PostDraft = {
        ...parsed,
        frontmatter: normalizeFrontmatter(parsed.frontmatter),
        assets: restoreAssetPreviewUrls(parsed.assets || []),
      }

      setDraft(
        applyFrontmatterPreferencesToDraft(
          restoredDraft,
          loadedSettings.frontmatterPreferences,
        ),
      )
    }

    void loadDraft()
    return () => {
      cancelled = true
    }
  }, [folderName])

  useEffect(() => {
    if (!draft) return

    let cancelled = false
    const currentDraft = draft

    async function persistDraft() {
      const saveResult = await saveDraftToStorage(currentDraft)
      if (cancelled) return

      setStatus(
        saveResult.ok
          ? isEnglish
            ? 'Saved locally'
            : '已保存到本地'
          : saveResult.code === 'quota'
            ? isEnglish
              ? 'Local storage is full. This draft is no longer being fully saved on this device.'
              : '本地存储空间已满，当前设备已无法完整保存这篇草稿。'
            : isEnglish
              ? 'Local save failed on this device.'
              : '当前设备本地保存失败。',
      )
    }

    void persistDraft()
    return () => {
      cancelled = true
    }
  }, [draft, folderName, isEnglish])

  const markdownOutput = useMemo(() => {
    if (!draft) return ''
    return renderIndexMd(draft.frontmatter, draft.body, draft.frontmatterPreferences)
  }, [draft])
  const isFlatMarkdownMode = draft?.contentMode === 'flat_markdown'
  const markdownFileName = draft?.markdownFileName || 'index.md'

  const coverAsset = useMemo(() => findCoverAsset(draft), [draft])
  const frontmatterPreferences = useMemo(
    () =>
      normalizeFrontmatterPreferences(
        draft?.frontmatterPreferences ||
          siteSettings.frontmatterPreferences ||
          DEFAULT_FRONTMATTER_PREFERENCES,
      ),
    [draft?.frontmatterPreferences, siteSettings.frontmatterPreferences],
  )
  const configuredExtraFields = frontmatterPreferences.extraBasicInfoFields.filter((field) =>
    field.key.trim(),
  )
  const configuredExtraFieldKeySet = useMemo(
    () =>
      new Set(
        configuredExtraFields.map((field) => normalizeFieldKey(field.key)),
      ),
    [configuredExtraFields],
  )
  const manualCustomFields = useMemo(
    () =>
      (draft?.frontmatter.customFields || []).filter(
        (field) => !configuredExtraFieldKeySet.has(normalizeFieldKey(field.key)),
      ),
    [draft?.frontmatter.customFields, configuredExtraFieldKeySet],
  )
  const categoryOptions = useMemo(() => {
    const set = new Set<string>()
    for (const item of siteSettings.categoriesPreset || []) {
      const normalized = String(item || '').trim()
      if (normalized) set.add(normalized)
    }
    for (const item of draft?.frontmatter.categories || []) {
      const normalized = String(item || '').trim()
      if (normalized) set.add(normalized)
    }
    return Array.from(set)
  }, [siteSettings.categoriesPreset, draft?.frontmatter.categories])

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

  function toggleCategory(category: string) {
    const target = category.trim()
    if (!target) return
    setDraft((prev) => {
      if (!prev) return prev
      const exists = prev.frontmatter.categories.some((item) => item === target)
      const nextCategories = exists
        ? prev.frontmatter.categories.filter((item) => item !== target)
        : [...prev.frontmatter.categories, target]
      return {
        ...prev,
        frontmatter: {
          ...prev.frontmatter,
          categories: nextCategories,
        },
      }
    })
  }

  function addCategoryFromInput() {
    const next = categoryInput.trim()
    if (!next) return
    setDraft((prev) => {
      if (!prev) return prev
      const exists = prev.frontmatter.categories.some(
        (item) => item.toLowerCase() === next.toLowerCase(),
      )
      if (exists) return prev
      return {
        ...prev,
        frontmatter: {
          ...prev.frontmatter,
          categories: [...prev.frontmatter.categories, next],
        },
      }
    })
    setCategoryInput('')
  }

  function addTagsFromInput() {
    const parsed = parseEnglishCommaList(tagInput)
    if (!parsed.length) return
    setDraft((prev) => {
      if (!prev) return prev
      const existing = new Set(prev.frontmatter.tags.map((item) => item.toLowerCase()))
      const nextTags = [...prev.frontmatter.tags]
      for (const item of parsed) {
        const key = item.toLowerCase()
        if (existing.has(key)) continue
        existing.add(key)
        nextTags.push(item)
      }
      return {
        ...prev,
        frontmatter: {
          ...prev.frontmatter,
          tags: nextTags,
        },
      }
    })
    setTagInput('')
  }

  function removeTag(tag: string) {
    setDraft((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        frontmatter: {
          ...prev.frontmatter,
          tags: prev.frontmatter.tags.filter((item) => item !== tag),
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

  function updateConfiguredExtraFieldValue(
    fieldKey: string,
    fieldType: 'text' | 'list',
    value: string,
  ) {
    setDraft((prev) => {
      if (!prev) return prev
      const normalizedKey = normalizeFieldKey(fieldKey)
      const current = [...prev.frontmatter.customFields]
      const index = current.findIndex(
        (field) => normalizeFieldKey(field.key) === normalizedKey,
      )

      if (index >= 0) {
        current[index] = {
          ...current[index],
          key: fieldKey,
          type: fieldType,
          value,
        }
      } else {
        current.push({
          id: `pref-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          key: fieldKey,
          type: fieldType,
          value,
        })
      }

      return {
        ...prev,
        frontmatter: {
          ...prev.frontmatter,
          customFields: current,
        },
      }
    })
  }

  function insertMarkdownAtCursor(markdown: string) {
    const textarea = bodyTextareaRef.current

    setDraft((prev) => {
      if (!prev) return prev

      const shouldInsertImageBlock = isImageMarkdown(markdown)

      if (!textarea) {
        return {
          ...prev,
          body: prev.body
            ? `${prev.body}${shouldInsertImageBlock ? buildStandaloneImageBlock(markdown) : `\n\n${markdown}`}`
            : shouldInsertImageBlock
              ? markdown
              : markdown,
        }
      }

      const selectionStart = textarea.selectionStart ?? prev.body.length
      const selectionEnd = textarea.selectionEnd ?? prev.body.length
      const insertionText = shouldInsertImageBlock
        ? buildStandaloneImageBlock(markdown)
        : markdown
      const insertionStart = shouldInsertImageBlock
        ? (prev.body.indexOf('\n', selectionEnd) === -1 ? prev.body.length : prev.body.indexOf('\n', selectionEnd))
        : selectionStart
      const nextBody =
        prev.body.slice(0, insertionStart) +
        insertionText +
        prev.body.slice(shouldInsertImageBlock ? insertionStart : selectionEnd)

      const nextCursor = insertionStart + insertionText.length
      const scrollTop = textarea.scrollTop

      requestAnimationFrame(() => {
        textarea.focus()
        textarea.scrollTop = scrollTop
        textarea.setSelectionRange(nextCursor, nextCursor)
      })

      return {
        ...prev,
        body: nextBody,
      }
    })
  }

  async function copyAssetName(assetName: string) {
    try {
      await navigator.clipboard.writeText(buildAssetMarkdown(assetName))
      setCopiedAssetName(assetName)
      setTimeout(() => setCopiedAssetName(''), 1200)
    } catch {
      setStatus(
        isEnglish
          ? 'Unable to copy image Markdown on this device'
          : '当前设备无法复制图片 Markdown 链接',
      )
    }
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

    if (frontmatterPreferences.slugFieldEnabled && !draft.frontmatter.slug.trim()) {
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

  async function handleManualSave() {
    if (!draft) return
    const saveResult = await saveDraftToStorage(draft)
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

      await removeDraftFromStorage(draft.folderName)
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

  if (checkingAuth || !draft) {
    return (
      <main style={{ padding: 'clamp(12px, 3vw, 24px)', maxWidth: 1080, margin: '0 auto', display: 'grid', gap: 16 }}>
        <SiteHeader />
        <h1>{isEnglish ? 'Edit Post' : '编辑文章'}</h1>
        <p>
          {checkingAuth
            ? isEnglish
              ? 'Checking sign-in status...'
              : '正在检查登录状态...'
            : isEnglish
              ? 'Loading draft, or the draft could not be found.'
              : '正在加载草稿，或草稿不存在。'}
        </p>
        <SiteFooter />
      </main>
    )
  }

  return (
      <main
      style={{
        padding: 'clamp(12px, 3vw, 20px)',
        maxWidth: 1080,
        margin: '0 auto',
        display: 'grid',
        gap: 16,
      }}
    >
      <SiteHeader />

      <div style={{ display: 'grid', gap: 6 }}>
        <h1 style={{ margin: 0, fontSize: 14 }}>{isEnglish ? 'Edit Post' : '编辑文章'}</h1>
        <div style={{ color: 'var(--muted)', fontSize: 12, wordBreak: 'break-all', fontWeight: 500 }}>
          {isEnglish ? 'Folder: ' : '文件夹：'}
          {draft.folderName}
        </div>
        <div style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 500 }}>{status}</div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 10,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab(activeTab === 'edit' ? 'preview' : 'edit')}
          style={{
            padding: '10px 12px',
            borderRadius: 12,
            border: '1px solid var(--border)',
            background: activeTab === 'edit' ? 'var(--card)' : 'var(--accent)',
            color: activeTab === 'edit' ? 'var(--foreground)' : 'var(--accent-contrast)',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {activeTab === 'edit' ? (isEnglish ? 'Preview' : '预览') : isEnglish ? 'Edit' : '编辑'}
        </button>

        <button
          type="button"
          onClick={handleManualSave}
          style={{
            padding: '10px 12px',
            borderRadius: 12,
            border: '1px solid var(--border)',
            background: 'var(--card)',
            color: 'var(--foreground)',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {isEnglish ? 'Save' : '保存'}
        </button>

        <button
          type="button"
          onClick={handlePublishClick}
          disabled={publishing}
          style={{
            padding: '10px 12px',
            borderRadius: 12,
            border: '1px solid var(--accent)',
            background: 'var(--accent)',
            color: 'var(--accent-contrast)',
            cursor: publishing ? 'not-allowed' : 'pointer',
            opacity: publishing ? 0.7 : 1,
            fontWeight: 700,
            fontSize: 14,
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
              <SectionToggleButton open={basicInfoOpen} onClick={() => setBasicInfoOpen((prev) => !prev)} label={basicInfoOpen ? (isEnglish ? 'Collapse basic info section' : '收起基本信息区域') : (isEnglish ? 'Expand basic info section' : '展开基本信息区域')} />
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
                  <div style={labelTitleStyle}>{isEnglish ? 'Date' : '日期'}</div>
                  <input
                    type="text"
                    value={draft.frontmatter.date}
                    onChange={(e) => updateFrontmatter('date', e.target.value)}
                    style={inputStyle}
                  />
                </label>

                <div style={{ display: 'grid', gap: 8 }}>
                  <div style={labelTitleStyle}>{isEnglish ? 'Draft' : '草稿'}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => updateFrontmatter('draft', false)}
                      style={{
                        padding: '11px 12px',
                        borderRadius: 10,
                        border: draft.frontmatter.draft ? '1px solid var(--border)' : '1px solid var(--accent)',
                        background: draft.frontmatter.draft ? 'var(--card)' : 'var(--accent)',
                        color: draft.frontmatter.draft ? 'var(--foreground)' : 'var(--accent-contrast)',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {isEnglish ? 'False' : '否'}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateFrontmatter('draft', true)}
                      style={{
                        padding: '11px 12px',
                        borderRadius: 10,
                        border: draft.frontmatter.draft ? '1px solid var(--accent)' : '1px solid var(--border)',
                        background: draft.frontmatter.draft ? 'var(--accent)' : 'var(--card)',
                        color: draft.frontmatter.draft ? 'var(--accent-contrast)' : 'var(--foreground)',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {isEnglish ? 'True' : '是'}
                    </button>
                  </div>
                </div>

                {frontmatterPreferences.slugFieldEnabled ? (
                  <label>
                    <div style={labelTitleStyle}>
                      {isEnglish
                        ? `Slug (${frontmatterPreferences.slugFieldName})`
                        : `Slug（${frontmatterPreferences.slugFieldName}）`}
                    </div>
                    <input
                      type="text"
                      value={draft.frontmatter.slug}
                      onChange={(e) => updateFrontmatter('slug', e.target.value)}
                      style={inputStyle}
                    />
                  </label>
                ) : null}

                {frontmatterPreferences.categoriesFieldEnabled ? (
                  <div>
                    <div style={labelTitleStyle}>
                      {isEnglish
                        ? `Categories (${frontmatterPreferences.categoriesFieldName})`
                        : `分类（${frontmatterPreferences.categoriesFieldName}）`}
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        display: 'flex',
                        gap: 8,
                        overflowX: 'auto',
                        paddingBottom: 2,
                      }}
                    >
                      {categoryOptions.length ? (
                        categoryOptions.map((item) => {
                          const active = draft.frontmatter.categories.includes(item)
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => toggleCategory(item)}
                              style={{
                                whiteSpace: 'nowrap',
                                padding: '9px 12px',
                                borderRadius: 999,
                                border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                                background: active ? 'var(--accent)' : 'var(--card)',
                                color: active ? 'var(--accent-contrast)' : 'var(--foreground)',
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontSize: 13,
                                flex: '0 0 auto',
                              }}
                            >
                              {item}
                            </button>
                          )
                        })
                      ) : (
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                          {isEnglish ? 'No preset categories yet.' : '还没有固定分类，请先到首页发布偏好添加。'}
                        </div>
                      )}
                    </div>
                    {draft.frontmatter.categories.length ? (
                      <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {draft.frontmatter.categories.map((item) => (
                          <span
                            key={`selected-${item}`}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 999,
                              border: '1px solid var(--accent)',
                              background: 'var(--accent-soft)',
                              color: 'var(--accent-soft-text)',
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <div
                      style={{
                        marginTop: 8,
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1fr) auto',
                        gap: 8,
                      }}
                    >
                      <input
                        type="text"
                        value={categoryInput}
                        onChange={(e) => setCategoryInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addCategoryFromInput()
                          }
                        }}
                        placeholder={isEnglish ? 'Add custom category' : '添加自定义分类'}
                        style={inputStyle}
                      />
                      <IconButton label={isEnglish ? 'Add category' : '添加分类'} icon={<PlusIcon />} onClick={addCategoryFromInput} active style={{ marginTop: 8 }} />
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                      {isEnglish ? 'Tap categories to select/unselect on mobile.' : '手机端可直接点按分类进行选中/取消。'}
                    </div>
                  </div>
                ) : null}

                {frontmatterPreferences.tagsFieldEnabled ? (
                  <div>
                    <div style={labelTitleStyle}>
                      {isEnglish
                        ? `Tags (${frontmatterPreferences.tagsFieldName})`
                        : `标签（${frontmatterPreferences.tagsFieldName}）`}
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1fr) auto',
                        gap: 8,
                      }}
                    >
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value.replace(/，/g, ','))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addTagsFromInput()
                          }
                        }}
                        placeholder={isEnglish ? 'Enter tag, use comma for multiple' : '输入标签，多个请用英文逗号'}
                        style={inputStyle}
                      />
                      <IconButton label={isEnglish ? 'Add tags' : '添加标签'} icon={<PlusIcon />} onClick={addTagsFromInput} active style={{ marginTop: 8 }} />
                    </div>
                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {draft.frontmatter.tags.length ? (
                        draft.frontmatter.tags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => removeTag(tag)}
                            style={{
                              padding: '7px 10px',
                              borderRadius: 999,
                              border: '1px solid var(--border)',
                              background: 'var(--card)',
                              color: 'var(--foreground)',
                              fontSize: 13,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                            title={isEnglish ? 'Tap to remove' : '点击删除'}
                          >
                            {tag} ×
                          </button>
                        ))
                      ) : (
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                          {isEnglish ? 'No tags yet.' : '暂无标签。'}
                        </div>
                      )}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                      {isEnglish ? 'Only English comma is used as separator.' : '仅使用英文逗号作为分隔符。'}
                    </div>
                  </div>
                ) : null}

                {frontmatterPreferences.coverImageFieldEnabled ? (
                  <label>
                    <div style={labelTitleStyle}>
                      {isEnglish
                        ? `Cover Image (${frontmatterPreferences.coverImageFieldName})`
                        : `封面图（${frontmatterPreferences.coverImageFieldName}）`}
                    </div>
                    <input
                      type="text"
                      value={draft.frontmatter.image}
                      onChange={(e) => updateFrontmatter('image', e.target.value)}
                      style={inputStyle}
                    />
                  </label>
                ) : null}

                {configuredExtraFields.length ? (
                  <div style={{ display: 'grid', gap: 12 }}>
                    {configuredExtraFields.map((field) => {
                      const currentValue =
                        draft.frontmatter.customFields.find(
                          (item) =>
                            normalizeFieldKey(item.key) === normalizeFieldKey(field.key),
                        )?.value || ''

                      return (
                        <label key={field.id}>
                          <div style={labelTitleStyle}>
                            {isEnglish
                              ? `${field.key} (${field.type === 'list' ? 'comma-separated' : 'text'})`
                              : `${field.key}（${field.type === 'list' ? '逗号分隔' : '文本'}）`}
                          </div>
                          <input
                            type="text"
                            value={currentValue}
                            onChange={(e) =>
                              updateConfiguredExtraFieldValue(
                                field.key,
                                field.type,
                                e.target.value,
                              )
                            }
                            style={inputStyle}
                          />
                        </label>
                      )
                    })}
                  </div>
                ) : null}

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
                    <IconButton label={isEnglish ? 'Add custom field' : '添加自定义字段'} icon={<PlusIcon />} onClick={addCustomField} active />
                  </div>

                  {manualCustomFields.map((field) => (
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

          {!isFlatMarkdownMode ? (
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
              <SectionToggleButton open={imagesOpen} onClick={() => setImagesOpen((prev) => !prev)} label={imagesOpen ? (isEnglish ? 'Collapse images section' : '收起图片区域') : (isEnglish ? 'Expand images section' : '展开图片区域')} />
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
                    const copied = copiedAssetName === asset.name

                    return (
                      <div
                        key={asset.name}
                        style={{
                          border: '1px solid var(--border)',
                          borderRadius: 12,
                          padding: 10,
                          display: 'grid',
                          gridTemplateColumns: '56px minmax(0, 1fr) 34px 34px 34px',
                          gap: 6,
                          alignItems: 'center',
                          background: 'var(--card-muted)',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setPreviewAsset(asset)}
                          style={{
                            width: 56,
                            height: 56,
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
                            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                              {isEnglish ? 'No preview' : '无预览'}
                            </span>
                          )}
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
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: 13,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {asset.name}
                          </span>
                          <span style={{ fontSize: 12, color: copied ? 'var(--accent-soft-text)' : 'var(--muted)', flexShrink: 0 }}>
                            {copied ? (isEnglish ? 'Copied' : '已复制') : (isEnglish ? 'Copy' : '复制')}
                          </span>
                        </button>

                          <button
                            type="button"
                            onClick={() => setAsCover(asset.name)}
                            style={{
                              width: 34,
                              height: 34,
                              cursor: 'pointer',
                              borderRadius: 8,
                              border: isCover
                                ? '1px solid var(--accent)'
                                : '1px solid var(--border)',
                              background: isCover ? 'var(--accent)' : 'var(--card)',
                              color: isCover ? 'var(--accent-contrast)' : 'var(--foreground)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title={isEnglish ? 'Set as cover' : '设为封面'}
                            aria-label={isEnglish ? 'Set as cover' : '设为封面'}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                              <path d="M12 3.8L14.6 9.2L20.5 10L16.2 14.1L17.3 20L12 17.1L6.7 20L7.8 14.1L3.5 10L9.4 9.2L12 3.8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                            </svg>
                          </button>

                          <button
                            type="button"
                              onClick={() => insertMarkdownAtCursor(buildAssetMarkdown(asset.name))}
                            style={{
                              width: 34,
                              height: 34,
                              cursor: 'pointer',
                              borderRadius: 8,
                              border: '1px solid var(--border)',
                              background: 'var(--card)',
                              color: 'var(--foreground)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title={isEnglish ? 'Insert image link' : '插入图片链接'}
                            aria-label={isEnglish ? 'Insert image link' : '插入图片链接'}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
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
                              width: 34,
                              height: 34,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
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
                    )
                  })}
                </div>
              </>
            ) : null}
            </section>
          ) : null}

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
                <div
                  title={isEnglish ? 'Character count' : '字符统计'}
                  aria-label={isEnglish ? 'Character count' : '字符统计'}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}
                >
                  <TextStatsIcon />
                  <span>{draft.body.length}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setBodyEditorHeight((current) => Math.max(180, current - 80))}
                    style={bodyHeightButtonStyle}
                    title={isEnglish ? 'Shorter' : '减小'}
                    aria-label={isEnglish ? 'Shorter' : '减小'}
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => setBodyEditorHeight(isTouchLikeViewport() ? 380 : 640)}
                    style={{ ...bodyHeightButtonStyle, minWidth: 54 }}
                    title={isEnglish ? 'Reset height' : '恢复默认高度'}
                    aria-label={isEnglish ? 'Reset height' : '恢复默认高度'}
                  >
                    {isEnglish ? 'Fit' : '默认'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBodyEditorHeight((current) => Math.min(960, current + 80))}
                    style={bodyHeightButtonStyle}
                    title={isEnglish ? 'Taller' : '增大'}
                    aria-label={isEnglish ? 'Taller' : '增大'}
                  >
                    +
                  </button>
                </div>
                <SectionToggleButton open={bodyOpen} onClick={() => setBodyOpen((prev) => !prev)} label={bodyOpen ? (isEnglish ? 'Collapse body section' : '收起正文区域') : (isEnglish ? 'Expand body section' : '展开正文区域')} />
              </div>
            </div>

            {bodyOpen ? (
              <>
                <div style={{ marginTop: 14 }}>
                  <MarkdownComposer
                    textareaRef={bodyTextareaRef}
                    value={draft.body}
                    onChange={(nextValue) => {
                      setDraft((prev) => {
                        if (!prev) return prev
                        return {
                          ...prev,
                          body: nextValue,
                        }
                      })
                    }}
                    minHeight={640}
                    editorHeight={bodyEditorHeight}
                    onEditorHeightChange={setBodyEditorHeight}
                    showHeightControls={false}
                  />
                </div>
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
                <h2 style={{ margin: 0, fontSize: 14, lineHeight: 1.35 }}>
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
            <h2 style={sectionTitleStyle}>{markdownFileName}</h2>
            <pre
              style={{
                marginTop: 14,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
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
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              {isEnglish ? 'Publish to GitHub?' : '确认发布到 GitHub？'}
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
              {isEnglish
                ? isFlatMarkdownMode
                  ? `This will commit \`${markdownFileName}\` directly under your posts path.`
                  : `This will commit \`${markdownFileName}\` together with the images and other assets in the current article folder.`
                : isFlatMarkdownMode
                  ? `本次会将 \`${markdownFileName}\` 直接提交到 posts 路径下。`
                  : `本次会将 \`${markdownFileName}\` 和当前文章目录下的图片等资源文件一起提交到 GitHub。`}
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
                  fontSize: 14,
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
                  fontSize: 14,
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
                  <div style={{ textAlign: 'center' }}>{isEnglish ? 'Tap outside to close' : '点空白处关闭'}</div>
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
                  {isEnglish ? 'Copy Markdown' : '复制 Markdown'}
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








