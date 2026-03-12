'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DraftList from '@/components/post/DraftList'
import RemotePostPicker from '@/components/post/RemotePostPicker'
import type { PostDraft } from '@/lib/types'
import {
  listDraftsFromStorage,
  removeDraftFromStorage,
} from '@/lib/draft-storage'


export default function HomePage() {
  const router = useRouter()
  const [drafts, setDrafts] = useState<PostDraft[]>([])

  function refreshDrafts() {
    setDrafts(listDraftsFromStorage())
  }

  useEffect(() => {
    refreshDrafts()
  }, [])

  function handleDelete(folderName: string) {
    const confirmed = window.confirm(`确定删除草稿 ${folderName} 吗？`)
    if (!confirmed) return

    removeDraftFromStorage(folderName)
    refreshDrafts()
  }

  function handleRemoteLoaded(folderName: string) {
    refreshDrafts()
    router.push(`/editor/${folderName}`)
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
      <section
        style={{
          borderRadius: 20,
          padding: 20,
          background: 'linear-gradient(135deg, #111 0%, #333 100%)',
          color: '#fff',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 28 }}>hugoweb</h1>
        <p style={{ marginTop: 10, marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
          Hugo page bundle 手机优先发稿工具
        </p>
      </section>

      <section
        style={{
          display: 'grid',
          gap: 12,
        }}
      >
        <Link
          href="/new"
          style={{
            display: 'block',
            padding: '18px 20px',
            borderRadius: 16,
            background: '#111',
            color: '#fff',
            textDecoration: 'none',
            fontSize: 18,
            fontWeight: 700,
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}
        >
          + 新建文章
        </Link>
      </section>

      <RemotePostPicker onLoaded={handleRemoteLoaded} />

      <section
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 16,
          padding: 16,
          background: '#fff',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20 }}>本地草稿</h2>
        <div style={{ marginTop: 14 }}>
          <DraftList drafts={drafts} onDelete={handleDelete} />
        </div>
      </section>
    </main>
  )
}