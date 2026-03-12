'use client'

import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'

export default function PublishResultPage() {
  const params = useParams<{ folderName: string }>()
  const searchParams = useSearchParams()

  const folderName = params.folderName
  const path = searchParams.get('path') || ''
  const count = searchParams.get('count') || '0'

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1>发布成功</h1>

      <div style={{ marginTop: 24, display: 'grid', gap: 12 }}>
        <div>
          <b>文章目录：</b>{folderName}
        </div>
        <div>
          <b>仓库路径：</b>{path}
        </div>
        <div>
          <b>写入文件数：</b>{count}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <Link href="/new">继续新建文章</Link>
      </div>
    </main>
  )
}