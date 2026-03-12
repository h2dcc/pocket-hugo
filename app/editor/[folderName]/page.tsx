'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { renderIndexMd } from '@/lib/markdown'
import MarkdownPreview from '@/components/post/MarkdownPreview'
import { restoreAssetPreviewUrls } from '@/lib/image'
import type { DraftAsset, PostDraft } from '@/lib/types'
import ImageUploader from '@/components/post/ImageUploader'
import {
  loadDraftFromStorage,
  saveDraftToStorage,
  removeDraftFromStorage,
} from '@/lib/draft-storage'
import Link from 'next/link'

export default function EditorPage() {
  const params = useParams<{ folderName: string }>()
  const folderName = params.folderName
  const router = useRouter()
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState('')
  const [draft, setDraft] = useState<PostDraft | null>(null)
  const [status, setStatus] = useState('')
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const cardStyle: React.CSSProperties = {
    border: '1px solid #e5e7eb',
    borderRadius: 16,
    padding: 14,
    background: '#fff',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    marginTop: 8,
    borderRadius: 10,
    border: '1px solid #d1d5db',
    outline: 'none',
    fontSize: 16,
    background: '#fff',
  }

  const labelTitleStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
  }

  const sectionTitleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
  }

  useEffect(() => {
    if (!folderName) return

    const parsed = loadDraftFromStorage(folderName)
    if (!parsed) return

    setDraft({
      ...parsed,
      assets: restoreAssetPreviewUrls(parsed.assets || []),
    })
  }, [folderName])

  useEffect(() => {
    if (!draft) return
    saveDraftToStorage(draft)
    setStatus('已保存到本地')
  }, [draft, folderName])

  const markdownOutput = useMemo(() => {
    if (!draft) return ''
    return renderIndexMd(draft.frontmatter, draft.body)
  }, [draft])

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

  function appendMarkdown(markdown: string) {
    setDraft((prev) => {
      if (!prev) return prev

      const nextBody = prev.body
        ? `${prev.body}\n\n${markdown}`
        : markdown

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
        `/publish/${draft.folderName}?path=${encodeURIComponent(result.path)}&count=${result.commitCount}`,
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
        paddingBottom: 96,
        maxWidth: 720,
        margin: '0 auto',
      }}
    >
      <div style={{ display: 'grid', gap: 6 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>编辑文章</h1>
        <div style={{ color: '#666', fontSize: 13, wordBreak: 'break-all' }}>
          文件夹：{draft.folderName}
        </div>
        <div style={{ color: '#666', fontSize: 13 }}>{status}</div>
      </div>

      {publishError ? (
        <div
          style={{
            marginTop: 12,
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

      <div
        style={{
          marginTop: 16,
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('edit')}
          style={{
            padding: '10px 14px',
            cursor: 'pointer',
            borderRadius: 8,
            border: '1px solid #ccc',
            background: activeTab === 'edit' ? '#111' : '#fff',
            color: activeTab === 'edit' ? '#fff' : '#111',
          }}
        >
          编辑
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          style={{
            padding: '10px 14px',
            cursor: 'pointer',
            borderRadius: 8,
            border: '1px solid #ccc',
            background: activeTab === 'preview' ? '#111' : '#fff',
            color: activeTab === 'preview' ? '#fff' : '#111',
          }}
        >
          预览
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 24,
          marginTop: 24,
        }}
      >
        {activeTab === 'edit' ? (
          <>
            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>基本信息</h2>

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
              </div>
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
                <h2 style={sectionTitleStyle}>图片</h2>
                <div style={{ fontSize: 12, color: '#666' }}>
                  共 {draft.assets.length} 张
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <ImageUploader
                  existingAssets={draft.assets}
                  onUploaded={handleAssetUploaded}
                  onInsertMarkdown={appendMarkdown}
                />
              </div>

              <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
                {draft.assets.map((asset) => {
                  const isCover = draft.frontmatter.image === asset.name

                  return (
                    <div
                      key={asset.name}
                      style={{
                        border: '1px solid #eee',
                        borderRadius: 12,
                        padding: 10,
                        display: 'grid',
                        gridTemplateColumns: '64px 1fr auto',
                        gap: 10,
                        alignItems: 'center',
                        background: '#fafafa',
                      }}
                    >
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 10,
                          overflow: 'hidden',
                          background: '#f3f4f6',
                          border: '1px solid #e5e7eb',
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
                          <span style={{ fontSize: 12, color: '#999' }}>无预览</span>
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
                            color: isCover ? '#1677ff' : '#6b7280',
                          }}
                        >
                          {isCover ? '当前封面图' : '普通图片'}
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gap: 6,
                          justifyItems: 'end',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setAsCover(asset.name)}
                          style={{
                            padding: '7px 10px',
                            cursor: 'pointer',
                            borderRadius: 8,
                            border: isCover ? '1px solid #1677ff' : '1px solid #d1d5db',
                            background: isCover ? '#e6f4ff' : '#fff',
                            color: '#111',
                            fontSize: 12,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          封面
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            appendMarkdown(`![${asset.name.replace(/\.webp$/i, '')}](${asset.name})`)
                          }
                          style={{
                            padding: '7px 10px',
                            cursor: 'pointer',
                            borderRadius: 8,
                            border: '1px solid #d1d5db',
                            background: '#fff',
                            color: '#111',
                            fontSize: 12,
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
                <div style={{ fontSize: 12, color: '#666' }}>
                  {draft.body.length} 字符
                </div>
              </div>

              <textarea
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
                rows={18}
                style={{
                  ...inputStyle,
                  marginTop: 14,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  minHeight: 320,
                  resize: 'vertical',
                  lineHeight: 1.6,
                }}
              />
            </section>
          </>
        ) : (
          <>

            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>预览</h2>
              <div style={{ marginTop: 14 }}>
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
                  background: '#f9fafb',
                  padding: 12,
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                  overflowX: 'auto',
                }}
              >
                {markdownOutput}
              </pre>
            </section>
            
          </>
        )}
      </div>
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          background: '#fff',
          borderTop: '1px solid #ddd',
          padding: '12px 16px',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
        }}
      >
        <div
          style={{
            maxWidth: 1000,
            margin: '0 auto',
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
              borderRadius: 10,
              border: '1px solid #ccc',
              textDecoration: 'none',
              color: '#111',
              background: '#fff',
            }}
          >
            首页
          </Link>

          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'edit' ? 'preview' : 'edit')}
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid #ccc',
              background: '#fff',
              color: '#111',
              cursor: 'pointer',
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
              borderRadius: 10,
              border: '1px solid #111',
              background: '#111',
              color: '#fff',
              cursor: publishing ? 'not-allowed' : 'pointer',
              opacity: publishing ? 0.7 : 1,
            }}
          >
            {publishing ? '发布中' : '发布'}
          </button>
        </div>
      </div>
    </main>
  )
}