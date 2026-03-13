'use client'

import Link from 'next/link'
import BrandMark from '@/components/layout/BrandMark'
import { useLanguage } from '@/lib/use-language'

export function SiteHeader() {
  const { isEnglish } = useLanguage()

  return (
    <section
      style={{
        borderRadius: 20,
        padding: 22,
        background:
          'linear-gradient(145deg, color-mix(in srgb, var(--hero-start) 90%, white 10%) 0%, color-mix(in srgb, var(--hero-end) 82%, white 18%) 100%)',
        color: 'var(--hero-text)',
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--hero-border)',
        display: 'grid',
        gap: 10,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 'auto -30px -40px auto',
          width: 160,
          height: 160,
          borderRadius: '50%',
          background: 'var(--hero-orb)',
          filter: 'blur(8px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'inline-flex',
          alignItems: 'center',
          width: 'fit-content',
          padding: '6px 10px',
          borderRadius: 999,
          background: 'var(--hero-chip)',
          color: 'var(--hero-chip-text)',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 0.3,
        }}
      >
        {isEnglish ? 'Mobile-first Hugo workflow' : '手机优先 Hugo 工作流'}
      </div>
      <Link
        href="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          color: 'inherit',
          textDecoration: 'none',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <BrandMark size={42} />
        <h1 style={{ margin: 0, fontSize: 30, letterSpacing: -0.6 }}>PocketHugo</h1>
      </Link>
      <p
        style={{
          marginTop: 0,
          marginBottom: 0,
          color: 'var(--hero-subtitle)',
          maxWidth: 640,
          lineHeight: 1.7,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {isEnglish
          ? 'Write, manage, and publish Hugo posts from your phone or browser.'
          : '在手机或浏览器上写作、管理并发布 Hugo 文章。'}
      </p>
    </section>
  )
}

export function SiteFooter() {
  const { isEnglish } = useLanguage()

  return (
    <footer
      style={{
        marginTop: 8,
        padding: '18px 16px 8px',
        color: 'var(--muted)',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 1.7,
      }}
    >
      <div>© 2026 All rights reserved.</div>
      <div>
        <a
          href="https://github.com/h2dcc/pocket-hugo"
          target="_blank"
          rel="noreferrer"
          aria-label={isEnglish ? 'GitHub project repository' : 'GitHub 项目仓库'}
          style={{
            color: 'inherit',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.48 2 2 6.58 2 12.23C2 16.75 4.87 20.58 8.84 21.93C9.34 22.02 9.52 21.71 9.52 21.44C9.52 21.2 9.51 20.4 9.5 19.55C6.73 20.17 6.14 18.36 6.14 18.36C5.68 17.16 5.03 16.84 5.03 16.84C4.12 16.2 5.1 16.21 5.1 16.21C6.1 16.28 6.63 17.27 6.63 17.27C7.52 18.84 8.97 18.39 9.54 18.12C9.63 17.46 9.89 17.01 10.18 16.76C7.97 16.5 5.65 15.61 5.65 11.64C5.65 10.51 6.04 9.58 6.69 8.84C6.59 8.58 6.24 7.54 6.79 6.13C6.79 6.13 7.63 5.85 9.5 7.15C10.29 6.92 11.15 6.8 12 6.8C12.85 6.8 13.71 6.92 14.5 7.15C16.37 5.85 17.21 6.13 17.21 6.13C17.76 7.54 17.41 8.58 17.31 8.84C17.96 9.58 18.35 10.51 18.35 11.64C18.35 15.62 16.02 16.49 13.8 16.75C14.17 17.08 14.5 17.74 14.5 18.75C14.5 20.19 14.49 21.08 14.49 21.44C14.49 21.71 14.67 22.03 15.18 21.93C19.15 20.58 22 16.75 22 12.23C22 6.58 17.52 2 12 2Z" />
          </svg>
        </a>
      </div>
    </footer>
  )
}
