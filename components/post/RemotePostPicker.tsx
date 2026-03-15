'use client'

import { useEffect, useMemo, useState } from 'react'
import { saveDraftToStorage } from '@/lib/draft-storage'
import { loadSiteSettingsFromStorage, type PostContentMode } from '@/lib/site-settings'
import { useLanguage } from '@/lib/use-language'

type RemotePostItem = {
  name: string
  path: string
  kind: 'folder' | 'file'
  markdownFiles: string[]
}

type Props = {
  enabled: boolean
  reloadKey: string
  onLoaded: (draftFolderName: string) => void
}

function getModeDescription(isEnglish: boolean, mode: PostContentMode) {
  if (mode === 'bundle_multilingual') {
    return isEnglish
      ? 'Current mode uses multilingual bundles. Open a folder first, then choose the Markdown file inside it.'
      : '当前模式使用多语言 bundle。先展开文章目录，再选择其中的 Markdown 文件。'
  }

  if (mode === 'flat_markdown') {
    return isEnglish
      ? 'Current mode uses flat Markdown files. Each item below is a file under your posts path.'
      : '当前模式使用扁平 Markdown 文件。下面每一项都是 posts 路径下的独立文件。'
  }

  return isEnglish
    ? 'Current mode uses single-file bundles, so clicking a folder opens its index.md directly.'
    : '当前模式使用单文件 bundle，点击目录会直接打开其中的 index.md。'
}

export default function RemotePostPicker({ enabled, reloadKey, onLoaded }: Props) {
  const { isEnglish } = useLanguage()
  const contentMode = loadSiteSettingsFromStorage().postContentMode
  const [posts, setPosts] = useState<RemotePostItem[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingPost, setLoadingPost] = useState('')
  const [error, setError] = useState('')
  const [keyword, setKeyword] = useState('')
  const [repoLabel, setRepoLabel] = useState('')
  const [expandedItemName, setExpandedItemName] = useState('')

  useEffect(() => {
    if (!enabled) {
      setPosts([])
      setError('')
      setRepoLabel('')
      setExpandedItemName('')
      return
    }

    async function fetchPosts() {
      setLoading(true)
      setError('')

      try {
        const query = new URLSearchParams({ mode: contentMode })
        const response = await fetch(`/api/list-posts?${query.toString()}`, {
          cache: 'no-store',
        })
        const result = await response.json()

        if (!response.ok || !result.ok) {
          throw new Error(
            result.error ||
              (isEnglish ? 'Failed to load published posts' : '读取已发布文章失败'),
          )
        }

        setPosts(result.posts || [])
        setRepoLabel(result.repo && result.basePath ? `${result.repo} / ${result.basePath}` : '')
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : isEnglish
              ? 'Failed to load published posts'
              : '读取已发布文章失败',
        )
      } finally {
        setLoading(false)
      }
    }

    void fetchPosts()
  }, [contentMode, enabled, isEnglish, reloadKey])

  const filteredPosts = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    if (!q) return posts
    return posts.filter((post) => post.name.toLowerCase().includes(q))
  }, [posts, keyword])

  async function handleLoad(folderName: string, markdownFileName: string) {
    const loadingKey = `${folderName}/${markdownFileName}`
    setLoadingPost(loadingKey)
    setError('')

    try {
      const response = await fetch('/api/load-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderName,
          contentMode,
          markdownFileName,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.error || (isEnglish ? 'Failed to load post' : '读取文章失败'))
      }

      const saveResult = await saveDraftToStorage(result.draft)
      if (!saveResult.ok) {
        throw new Error(
          saveResult.code === 'quota'
            ? isEnglish
              ? 'Local storage is full. This post could not be saved on this device.'
              : '本地存储空间已满，这篇文章无法保存在当前设备。'
            : isEnglish
              ? 'Failed to save the post locally.'
              : '文章保存到本地失败。',
        )
      }

      onLoaded(result.draft.folderName)
    } catch (error) {
      setError(
        error instanceof Error ? error.message : isEnglish ? 'Failed to load post' : '读取文章失败',
      )
    } finally {
      setLoadingPost('')
    }
  }

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 14,
        background: 'var(--card-muted)',
      }}
    >
      <h3 style={{ margin: 0, fontSize: 14 }}>{isEnglish ? 'Published Posts' : '已发布文章'}</h3>

      {!enabled ? (
        <div style={{ marginTop: 12, color: 'var(--muted)', fontSize: 13, lineHeight: 1.6 }}>
          {isEnglish
            ? 'Sign in to GitHub and save a repository config to browse remote posts here.'
            : '登录 GitHub 并保存仓库配置后，这里会显示远程文章列表。'}
        </div>
      ) : null}

      {repoLabel ? (
        <div style={{ marginTop: 8, color: 'var(--muted)', fontSize: 12, wordBreak: 'break-all' }}>
          {isEnglish ? 'Current source: ' : '当前来源：'}
          {repoLabel}
        </div>
      ) : null}

      {enabled ? (
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
          {getModeDescription(isEnglish, contentMode)}
        </div>
      ) : null}

      <div style={{ marginTop: 12 }}>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder={
            contentMode === 'flat_markdown'
              ? isEnglish
                ? 'Search file name'
                : '搜索文件名'
              : isEnglish
                ? 'Search folder name'
                : '搜索目录名'
          }
          disabled={!enabled}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 12,
            border: '1px solid var(--border)',
            fontSize: 14,
            background: 'var(--card)',
            color: 'var(--foreground)',
            opacity: enabled ? 1 : 0.6,
          }}
        />
      </div>

      {loading ? (
        <div style={{ marginTop: 12, color: 'var(--muted)' }}>
          {isEnglish ? 'Loading published posts...' : '正在读取文章列表...'}
        </div>
      ) : null}
      {error ? <div style={{ marginTop: 12, color: 'var(--danger)' }}>{error}</div> : null}

      <div style={{ display: 'grid', gap: 8, marginTop: 14, maxHeight: 420, overflowY: 'auto' }}>
        {filteredPosts.map((post) => {
          const directFileName =
            contentMode === 'flat_markdown'
              ? post.name
              : contentMode === 'bundle_single'
                ? 'index.md'
                : ''

          return (
            <div
              key={`${post.kind}:${post.name}`}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 12,
                background: 'var(--card)',
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  if (directFileName) {
                    void handleLoad(post.name, directFileName)
                    return
                  }

                  setExpandedItemName((current) => (current === post.name ? '' : post.name))
                }}
                disabled={!enabled || loadingPost === `${post.name}/${directFileName}`}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--foreground)',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {loadingPost === `${post.name}/${directFileName}`
                  ? isEnglish
                    ? 'Loading...'
                    : '读取中...'
                  : post.name}
              </button>

              {contentMode === 'bundle_multilingual' && expandedItemName === post.name ? (
                <div
                  style={{
                    display: 'grid',
                    gap: 8,
                    padding: 12,
                    borderTop: '1px solid var(--border)',
                    background: 'var(--card-muted)',
                  }}
                >
                  {post.markdownFiles.length ? (
                    post.markdownFiles.map((fileName) => {
                      const loadingKey = `${post.name}/${fileName}`

                      return (
                        <button
                          key={loadingKey}
                          type="button"
                          onClick={() => {
                            void handleLoad(post.name, fileName)
                          }}
                          disabled={!enabled || loadingPost === loadingKey}
                          style={{
                            textAlign: 'left',
                            padding: '9px 11px',
                            borderRadius: 10,
                            border: '1px solid var(--border)',
                            background: 'var(--card)',
                            color: 'var(--foreground)',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          {loadingPost === loadingKey
                            ? isEnglish
                              ? 'Loading...'
                              : '读取中...'
                            : fileName}
                        </button>
                      )
                    })
                  ) : (
                    <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                      {isEnglish
                        ? 'No Markdown files were found in this folder.'
                        : '这个目录下没有找到 Markdown 文件。'}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )
        })}

        {enabled && !loading && !filteredPosts.length ? (
          <div
            style={{
              color: 'var(--muted)',
              fontSize: 13,
              lineHeight: 1.6,
              padding: 12,
              borderRadius: 12,
              border: '1px dashed var(--border)',
              background: 'var(--card)',
            }}
          >
            {isEnglish ? 'No matching posts were found under the current path.' : '当前路径下没有匹配的文章。'}
          </div>
        ) : null}
      </div>
    </div>
  )
}
