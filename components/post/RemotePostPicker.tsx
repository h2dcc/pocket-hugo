'use client'

import { useEffect, useMemo, useState } from 'react'

type RemotePostItem = {
  name: string
  path: string
}

type Props = {
  onLoaded: (folderName: string) => void
}

export default function RemotePostPicker({ onLoaded }: Props) {
  const [posts, setPosts] = useState<RemotePostItem[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingPost, setLoadingPost] = useState('')
  const [error, setError] = useState('')
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch('/api/list-posts')
        const result = await response.json()

        if (!response.ok || !result.ok) {
          throw new Error(result.error || '读取文章列表失败')
        }

        setPosts(result.posts || [])
      } catch (error) {
        setError(error instanceof Error ? error.message : '读取文章列表失败')
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  const filteredPosts = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    if (!q) return posts
    return posts.filter((post) => post.name.toLowerCase().includes(q))
  }, [posts, keyword])

  async function handleLoad(folderName: string) {
    setLoadingPost(folderName)
    setError('')

    try {
      const response = await fetch('/api/load-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderName }),
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.error || '读取失败')
      }

      localStorage.setItem(`draft:${folderName}`, JSON.stringify(result.draft))
      onLoaded(folderName)
    } catch (error) {
      setError(error instanceof Error ? error.message : '读取失败')
    } finally {
      setLoadingPost('')
    }
  }

  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 16,
        padding: 16,
        background: '#fff',
      }}
    >
      <h3 style={{ margin: 0, fontSize: 18 }}>已发布文章</h3>

      <div style={{ marginTop: 12 }}>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索 folderName"
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 12,
            border: '1px solid #d1d5db',
            fontSize: 16,
          }}
        />
      </div>

      {loading ? <div style={{ marginTop: 12 }}>正在读取文章列表...</div> : null}
      {error ? <div style={{ marginTop: 12, color: 'crimson' }}>{error}</div> : null}

      <div style={{ display: 'grid', gap: 10, marginTop: 14, maxHeight: 360, overflowY: 'auto' }}>
        {filteredPosts.map((post) => (
          <button
            key={post.name}
            type="button"
            onClick={() => handleLoad(post.name)}
            disabled={loadingPost === post.name}
            style={{
              textAlign: 'left',
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              background: '#fafafa',
              cursor: 'pointer',
            }}
          >
            {loadingPost === post.name ? '读取中...' : post.name}
          </button>
        ))}

        {!loading && !filteredPosts.length ? (
          <div style={{ color: '#666', fontSize: 14 }}>没有匹配的文章</div>
        ) : null}
      </div>
    </div>
  )
}