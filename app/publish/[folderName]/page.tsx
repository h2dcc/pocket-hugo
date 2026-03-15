'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { SiteFooter, SiteHeader } from '@/components/layout/SiteChrome'
import { useLanguage } from '@/lib/use-language'
import { useRequireAuth } from '@/lib/use-require-auth'

function PublishResultContent() {
  const { isEnglish } = useLanguage()
  const params = useParams<{ folderName: string }>()
  const searchParams = useSearchParams()

  const folderName = params.folderName
  const path = searchParams.get('path') || ''
  const fileCount = searchParams.get('files') || searchParams.get('count') || '0'
  const commitCount = searchParams.get('commitCount') || '1'
  const changesParam = searchParams.get('changes') || '[]'
  const repo = searchParams.get('repo') || ''
  const branch = searchParams.get('branch') || ''
  const fileChanges = (() => {
    try {
      return JSON.parse(changesParam) as Array<{ path: string; action: 'updated' | 'deleted' }>
    } catch {
      return []
    }
  })()
  const githubUrl =
    repo && branch
      ? `https://github.com/${repo}/tree/${encodeURIComponent(branch)}${path ? `/${path.replace(/^\/+|\/+$/g, '')}` : ''}`
      : repo
        ? `https://github.com/${repo}`
        : ''

  const cardStyle: React.CSSProperties = {
    border: '1px solid var(--border)',
    borderRadius: 18,
    background: 'var(--card)',
    boxShadow: 'var(--shadow)',
    padding: 18,
  }

  const actionStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 16px',
    borderRadius: 12,
    border: '1px solid var(--border)',
    background: 'var(--card)',
    color: 'var(--foreground)',
    textDecoration: 'none',
    fontWeight: 700,
  }

  return (
    <>
      <section
        style={{
          border: '1px solid var(--border)',
          borderRadius: 18,
          background: 'var(--card)',
          boxShadow: 'var(--shadow)',
          padding: 18,
          display: 'grid',
          gap: 8,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 14 }}>{isEnglish ? 'Published Successfully' : '发布成功'}</h1>
        <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
          {isEnglish
            ? 'The article and all related files from this publish have been committed to GitHub.'
            : '文章和本次涉及的资源文件已经一并提交到 GitHub。'}
        </p>
      </section>

      <section style={{ ...cardStyle, display: 'grid', gap: 12 }}>
        <div style={{ display: 'grid', gap: 10, fontSize: 14 }}>
          <div>
            <strong>{isEnglish ? 'Post Folder: ' : '文章目录：'}</strong>
            {folderName}
          </div>
          {repo ? (
            <div>
              <strong>{isEnglish ? 'Repository: ' : '目标仓库：'}</strong>
              {repo}
            </div>
          ) : null}
          {branch ? (
            <div>
              <strong>{isEnglish ? 'Branch: ' : '目标分支：'}</strong>
              {branch}
            </div>
          ) : null}
          <div>
            <strong>{isEnglish ? 'Repository Path: ' : '仓库路径：'}</strong>
            <span style={{ wordBreak: 'break-all' }}>{path}</span>
          </div>
          <div>
            <strong>{isEnglish ? 'Commit Count: ' : '提交次数：'}</strong>
            {commitCount}
          </div>
          <div>
            <strong>{isEnglish ? 'Files Written: ' : '本次写入文件数：'}</strong>
            {fileCount}
          </div>
          {fileChanges.length ? (
            <div style={{ display: 'grid', gap: 8 }}>
              <strong>{isEnglish ? 'Files changed in this publish:' : '本次写入（编辑）的文件：'}</strong>
              <div
                style={{
                  display: 'grid',
                  gap: 8,
                  padding: 12,
                  borderRadius: 14,
                  border: '1px solid var(--border)',
                  background: 'var(--card-muted)',
                }}
              >
                {fileChanges.map((file) => (
                  <div
                    key={`${file.action}:${file.path}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr',
                      gap: 10,
                      alignItems: 'start',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 68,
                        padding: '4px 8px',
                        borderRadius: 999,
                        background: file.action === 'deleted' ? '#fef2f2' : 'var(--accent-soft)',
                        color: file.action === 'deleted' ? '#b42318' : 'var(--accent-soft-text)',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {file.action === 'deleted'
                        ? isEnglish
                          ? 'Deleted'
                          : '已删除'
                        : isEnglish
                          ? 'Updated'
                          : '已写入'}
                    </span>
                    <span style={{ wordBreak: 'break-all' }}>{file.path}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section
        style={{
          ...cardStyle,
          display: 'grid',
          gap: 12,
        }}
      >
        <div style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
          {isEnglish
            ? 'To edit this article again, return to the home page and pick it from Published Posts.'
            : '如需重新编辑刚才发布的文章，可回到首页，在“已发布文章”中选择对应文章继续编辑。'}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
          }}
        >
          <Link href="/app" style={actionStyle}>
            {isEnglish ? 'Home' : '返回首页'}
          </Link>
          <Link
            href="/new"
            style={{
              ...actionStyle,
              border: '1px solid var(--accent)',
              background: 'var(--accent)',
              color: 'var(--accent-contrast)',
            }}
          >
            {isEnglish ? 'Create Another Post' : '继续新建文章'}
          </Link>
          {githubUrl ? (
            <a href={githubUrl} target="_blank" rel="noreferrer" style={actionStyle}>
              {isEnglish ? 'View GitHub Repository' : '查看 GitHub 仓库'}
            </a>
          ) : null}
        </div>
      </section>
    </>
  )
}

export default function PublishResultPage() {
  const checkingAuth = useRequireAuth('/publish')

  if (checkingAuth) {
    return null
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
      <Suspense fallback={null}>
        <PublishResultContent />
      </Suspense>
      <SiteFooter />
    </main>
  )
}
