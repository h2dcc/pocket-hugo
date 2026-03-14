'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { SiteFooter, SiteHeader } from '@/components/layout/SiteChrome'
import { useLanguage } from '@/lib/use-language'

function PagePublishResultContent() {
  const { isEnglish } = useLanguage()
  const searchParams = useSearchParams()

  const path = searchParams.get('path') || ''
  const fileCount = searchParams.get('files') || '0'
  const commitCount = searchParams.get('commitCount') || '1'
  const repo = searchParams.get('repo') || ''
  const branch = searchParams.get('branch') || ''
  const changesParam = searchParams.get('changes') || '[]'
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
      <section style={{ ...cardStyle, display: 'grid', gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: 14 }}>
          {isEnglish ? 'Page Published Successfully' : '页面发布成功'}
        </h1>
        <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.7 }}>
          {isEnglish
            ? 'Your standalone page or quick timeline file has been written to GitHub.'
            : '你的独立页面或生活记录页面文件已经成功写入 GitHub。'}
        </p>
      </section>

      <section style={{ ...cardStyle, display: 'grid', gap: 12 }}>
        <div style={{ display: 'grid', gap: 10, fontSize: 14 }}>
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
            <strong>{isEnglish ? 'Page File: ' : '页面文件：'}</strong>
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
              <strong>{isEnglish ? 'Files changed in this publish:' : '本次写入的文件：'}</strong>
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

      <section style={{ ...cardStyle, display: 'grid', gap: 12 }}>
        <div style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
          {isEnglish
            ? 'You can jump back into this workflow anytime from the Page Editor button on the home page.'
            : '后续如果还要继续编辑这个页面，可以随时回到首页，通过“页面编辑”按钮重新进入。'}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
          }}
        >
          <Link href="/" style={actionStyle}>
            {isEnglish ? 'Home' : '返回首页'}
          </Link>
          <Link
            href="/page-editor"
            style={{
              ...actionStyle,
              border: '1px solid var(--accent)',
              background: 'var(--accent)',
              color: 'var(--accent-contrast)',
            }}
          >
            {isEnglish ? 'Continue Editing Page' : '继续编辑页面'}
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

export default function PagePublishResultPage() {
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
        <PagePublishResultContent />
      </Suspense>
      <SiteFooter />
    </main>
  )
}
