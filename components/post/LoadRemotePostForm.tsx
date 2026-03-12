'use client'

import { useState } from 'react'

type Props = {
  onLoaded: (folderName: string) => void
}

export default function LoadRemotePostForm({ onLoaded }: Props) {
  const [folderName, setFolderName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLoad() {
    if (!folderName.trim()) {
      setError('请输入 folderName')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/load-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderName: folderName.trim() }),
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.error || '读取失败')
      }

      localStorage.setItem(`draft:${folderName.trim()}`, JSON.stringify(result.draft))
      onLoaded(folderName.trim())
    } catch (error) {
      setError(error instanceof Error ? error.message : '读取失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16, display: 'grid', gap: 12 }}>
      <h3 style={{ margin: 0 }}>读取已发布文章</h3>

      <input
        type="text"
        value={folderName}
        onChange={(e) => setFolderName(e.target.value)}
        placeholder="例如：2026-03-12-three-body-problem-reading-notes"
        style={{ width: '100%', padding: 10 }}
      />

      <button
        type="button"
        onClick={handleLoad}
        disabled={loading}
        style={{ padding: '10px 14px', cursor: 'pointer' }}
      >
        {loading ? '读取中...' : '读取并进入编辑'}
      </button>

      {error ? <div style={{ color: 'crimson' }}>{error}</div> : null}
    </div>
  )
}