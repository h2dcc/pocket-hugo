'use client'

import { useLanguage } from '@/lib/use-language'

type LandingFooterProps = {
  projectName: string
}

export default function LandingFooter({ projectName }: LandingFooterProps) {
  const { isEnglish } = useLanguage()
  const blogUrl = isEnglish ? 'http://lawtee.com/en' : 'https://lawtee.com'

  return (
    <footer
      style={{
        marginTop: 8,
        padding: '18px 16px 8px',
        color: 'var(--muted)',
        fontSize: 13,
        lineHeight: 1.8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        flexWrap: 'wrap',
        textAlign: 'center',
      }}
    >
      <span>{`© 2026 ${projectName}. by Lawtee.`}</span>
      <a
        href={blogUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={isEnglish ? 'Visit Lawtee blog' : '访问老T博客'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 20,
          height: 20,
          borderRadius: 999,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <img
          src="https://lawtee.com/favicon.ico"
          alt=""
          width="14"
          height="14"
          style={{ display: 'block', width: 14, height: 14 }}
        />
      </a>
    </footer>
  )
}
