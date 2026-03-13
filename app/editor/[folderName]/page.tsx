'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ImageUploader from '@/components/post/ImageUploader'
import MarkdownPreview from '@/components/post/MarkdownPreview'
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

export default function EditorPage() {
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
    setStatus('已保存到本地')
  }, [draft, folderName])

  useEffect(() => {
    const textarea = bodyTextareaRef.current
    if (!textarea) return

    textarea.style.height = '0px'
    textarea.style.height = `${Math.max(320, textarea.scrollHeight)}px`
  }, [draft?.body, activeTab])

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

  function handleAssetUploaded(asset: DraftAsset) {
    setDraft((prev) => {
      if (!prev) return prev

      return {
        ...prev,
        assets: [...prev.assets, asset],
      }
    })
  }

  async function handlePublish() {
    if (!draft) return

    if (!draft.frontmatter.title.trim()) {
      setPublishError('请先填写标题')
      return
    }

    if (!draft.frontmatter.slug.trim()) {
      setPublishError('请先填写 slug')
      return
    }

    if (!draft.frontmatter.date.trim()) {
      setPublishError('请先填写日期')
      return
    }

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
      router.push(
        `/publish/${draft.folderName}?path=${encodeURIComponent(result.path)}&count=${result.commitCount}&repo=${encodeURIComponent(result.repo || '')}&branch=${encodeURIComponent(result.branch || '')}`,
      )
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : '发布失败')
    } finally {
      setPublishing(false)
    }
  }

  function setAsCover(assetName: string) {
    updateFrontmatter('image', assetName)
  }

  if (!draft) {
    return (
      <main style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
        <h1>编辑文章</h1>
        <p>正在加载草稿，或草稿不存在。</p>
      </main>
    )
  }

  return (
    <main
      style={{
        padding: 16,
        maxWidth: 720,
        margin: '0 auto',
        display: 'grid',
        gap: 16,
      }}
    >
      <div style={{ display: 'grid', gap: 6 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>编辑文章</h1>
        <div style={{ color: 'var(--muted)', fontSize: 13, wordBreak: 'break-all' }}>
          文件夹：{draft.folderName}
        </div>
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>{status}</div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 12,
        }}
      >
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 14px',
            borderRadius: 12,
            border: '1px solid var(--border)',
            textDecoration: 'none',
            color: 'var(--foreground)',
            background: 'var(--card)',
          }}
        >
          首页
        </Link>

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
          {activeTab === 'edit' ? '预览' : '编辑'}
        </button>

        <button
          type="button"
          onClick={handlePublish}
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
          {publishing ? '发布中...' : '发布'}
        </button>
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
              <h2 style={sectionTitleStyle}>基本信息</h2>
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
                {basicInfoOpen ? '收起' : '展开'}
              </button>
            </div>

            {basicInfoOpen ? (
              <div style={{ display: 'grid', gap: 14, marginTop: 14 }}>
                <label>
                  <div style={labelTitleStyle}>标题</div>
                  <input
                    type="text"
                    value={draft.frontmatter.title}
                    onChange={(e) => updateFrontmatter('title', e.target.value)}
                    style={inputStyle}
                  />
                </label>

                <label>
                  <div style={labelTitleStyle}>摘要</div>
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
                  <div style={labelTitleStyle}>日期</div>
                  <input
                    type="text"
                    value={draft.frontmatter.date}
                    onChange={(e) => updateFrontmatter('date', e.target.value)}
                    style={inputStyle}
                  />
                </label>

                <label>
                  <div style={labelTitleStyle}>分类（逗号分隔）</div>
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
                  <div style={labelTitleStyle}>标签（逗号分隔）</div>
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
                  <div style={labelTitleStyle}>封面图</div>
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
                    <div style={labelTitleStyle}>自定义 Frontmatter 字段</div>
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
                        placeholder="字段名，例如 aliases"
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
                        <option value="text">文本</option>
                        <option value="list">列表（逗号分隔）</option>
                      </select>
                      <textarea
                        value={field.value}
                        onChange={(e) => updateCustomField(field.id, { value: e.target.value })}
                        placeholder={field.type === 'list' ? '多个值请用逗号分隔' : '字段值'}
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
                        删除字段
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
                <h2 style={sectionTitleStyle}>图片</h2>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>共 {draft.assets.length} 张</div>
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
                {imagesOpen ? '收起' : '展开'}
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
                  当前设置：
                  {siteSettings.imageConversionEnabled
                    ? `默认压缩并转 webp，最大宽度 ${siteSettings.imageMaxWidth}px，质量 ${siteSettings.imageQuality}`
                    : '保留原图格式'}
                  ，
                  {siteSettings.autoImageNamingEnabled ? '自动编号命名' : '保留原始文件名'}。
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
                        <div
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
                            <span style={{ fontSize: 12, color: 'var(--muted)' }}>无预览</span>
                          )}
                        </div>

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
                              color: isCover ? '#1677ff' : 'var(--muted)',
                            }}
                          >
                            {isCover ? '当前封面图' : '普通图片'}
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
                              border: isCover ? '1px solid #1677ff' : '1px solid var(--border)',
                              background: isCover ? '#e6f4ff' : 'var(--card)',
                              color: 'var(--foreground)',
                              fontSize: 14,
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            封面
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
                            插入
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
              <h2 style={sectionTitleStyle}>正文</h2>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{draft.body.length} 字符</div>
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
          </section>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 24 }}>
          <section style={cardStyle}>
            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'grid', gap: 6 }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', letterSpacing: 1 }}>PREVIEW</div>
                <h2 style={{ margin: 0, fontSize: 28, lineHeight: 1.25 }}>
                  {draft.frontmatter.title || '未填写标题'}
                </h2>
              </div>

              {coverAsset ? (
                <div style={{ display: 'grid', gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>
                    封面图
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
    </main>
  )
}
