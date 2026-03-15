'use client'

import Link from 'next/link'
import { SiteFooter, SiteHeader } from '@/components/layout/SiteChrome'
import { useLanguage } from '@/lib/use-language'

export default function NotFound() {
  const { isEnglish } = useLanguage()

  const cardStyle: React.CSSProperties = {
    border: '1px solid var(--border)',
    borderRadius: 20,
    background: 'var(--card)',
    boxShadow: 'var(--shadow)',
    padding: 'clamp(20px, 4vw, 28px)',
    display: 'grid',
    gap: 14,
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
    <main
      style={{
        padding: 16,
        maxWidth: 960,
        margin: '0 auto',
        minHeight: '100vh',
        display: 'grid',
        gap: 16,
        alignContent: 'start',
      }}
    >
      <SiteHeader />

      <section style={cardStyle}>
        <div
          style={{
            display: 'inline-flex',
            width: 'fit-content',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px 10px',
            borderRadius: 999,
            background: 'var(--accent-soft)',
            color: 'var(--accent-soft-text)',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          404
        </div>

        <h1 style={{ margin: 0, fontSize: 'clamp(22px, 5vw, 34px)', lineHeight: 1.15 }}>
          {isEnglish ? 'This page could not be found.' : '这个页面不存在。'}
        </h1>

        <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.8, fontSize: 14 }}>
          {isEnglish
            ? 'The path may be incorrect, outdated, or no longer available. You can go back to the app entry or return to the landing page.'
            : '这个路径可能填写错误、已经过期，或对应内容已不存在。你可以返回应用入口，或回到介绍页。'}
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            marginTop: 4,
          }}
        >
          <Link
            href="/app"
            style={{
              ...actionStyle,
              border: '1px solid var(--accent)',
              background: 'var(--accent)',
              color: 'var(--accent-contrast)',
            }}
          >
            {isEnglish ? 'Open App' : '进入应用'}
          </Link>
          <Link href="/" style={actionStyle}>
            {isEnglish ? 'Go to Landing Page' : '回到介绍页'}
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
