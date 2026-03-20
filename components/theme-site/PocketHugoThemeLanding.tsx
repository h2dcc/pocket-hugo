'use client'

import Link from 'next/link'
import LanguageToggle from '@/components/language/LanguageToggle'
import PocketHugoThemeLogo from '@/components/layout/PocketHugoThemeLogo'
import ThemeSiteFooter from '@/components/theme-site/ThemeSiteFooter'
import ThemeToggle from '@/components/theme/ThemeToggle'
import { useLanguage } from '@/lib/use-language'

const themeDemoUrl = 'https://theme.leftn.com'

const sellingPoints = [
  {
    titleEn: 'Image-led by default',
    titleZh: '默认就是图文一体',
    bodyEn:
      'PocketHugo Theme is built around covers, cards, and visual rhythm, so home lists, taxonomy pages, and post entries all feel more complete before a reader even opens the post.',
    bodyZh:
      'PocketHugo Theme 从一开始就把封面图、卡片和视觉节奏放在中心位置，所以首页列表、分类页和文章入口在点开之前就已经有比较完整的图文呈现。',
    icon: (
      <>
        <rect x="4" y="6" width="16" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" fill="none" />
        <circle cx="9" cy="10" r="1.4" fill="currentColor" />
        <path d="M6.5 16L10.5 12L13.5 15L16.5 11.5L19 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    titleEn: 'Calmer on phones',
    titleZh: '在手机上也更从容',
    bodyEn:
      'Spacing, card density, and image handling are tuned so the theme still feels composed on a phone instead of collapsing into a cramped or overly technical reading surface.',
    bodyZh:
      '间距、卡片密度和图片处理都尽量往手机端阅读体验上靠，避免到了小屏幕就显得局促、发紧，或者一下子退化成那种只剩文字的技术说明页。',
    icon: (
      <>
        <rect x="7" y="3.5" width="10" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
        <path d="M10 7.5H14M10 11H14M10 14.5H12.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
  },
  {
    titleEn: 'Made for long-term personal publishing',
    titleZh: '更适合长期个人发布',
    bodyEn:
      'It is designed for blogs, notes, links, talks, and longer posts that need both structure and personality, giving a Hugo site a clearer publishing mood instead of just another skin.',
    bodyZh:
      '它更适合博客、笔记、链接页、说说和长文这类长期个人发布内容，在保留结构感的同时，也尽量让站点有更明确的发布气质，而不是简单再换一张皮。',
    icon: (
      <>
        <path d="M7 4.5H13.8L18 8.7V19.5A1.5 1.5 0 0 1 16.5 21H7.5A1.5 1.5 0 0 1 6 19.5V6A1.5 1.5 0 0 1 7.5 4.5H7Z" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13 5V9H17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
]
function CardIcon({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 14,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--accent-soft)',
        color: 'var(--accent-soft-text)',
        border: '1px solid var(--border)',
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        {children}
      </svg>
    </div>
  )
}

function HeroTopBar({ isEnglish }: { isEnglish: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
        <PocketHugoThemeLogo size={44} />
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--hero-chip-text)' }}>PocketHugo Theme</div>
          <div style={{ fontSize: 12, color: 'var(--hero-subtitle)' }}>
            {isEnglish ? 'A cover-driven theme for long-term personal writing' : '一款适合个人长期写作的图文式主题'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <LanguageToggle />
        <ThemeToggle />
        <Link href="/pocket-hugo-theme/guide" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 42, padding: '0 16px', borderRadius: 999, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
          {isEnglish ? 'Guide' : '使用指南'}
        </Link>
        <a href={themeDemoUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 42, padding: '0 16px', borderRadius: 999, background: 'var(--foreground)', color: 'var(--card)', fontWeight: 700 }}>
          {isEnglish ? 'View Demo' : '查看演示'}
        </a>
        <Link href="/" aria-label={isEnglish ? 'PocketHugo Home' : 'PocketHugo 首页'} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 42, minWidth: 42, height: 42, borderRadius: 999, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.6)' }}>
          <img src="/pocket-hugo-logo.svg" alt="" width="22" height="22" style={{ display: 'block', width: 22, height: 22 }} />
        </Link>
      </div>
    </div>
  )
}

export default function PocketHugoThemeLanding() {
  const { isEnglish } = useLanguage()

  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px 48px' }}>
      <div style={{ width: '100%', maxWidth: 1120, margin: '0 auto', display: 'grid', gap: 20 }}>
        <section style={{ position: 'relative', overflow: 'hidden', borderRadius: 28, padding: 'clamp(24px, 5vw, 48px)', background: 'linear-gradient(140deg, color-mix(in srgb, var(--hero-start) 92%, white 8%) 0%, color-mix(in srgb, var(--hero-end) 84%, white 16%) 100%)', border: '1px solid var(--hero-border)', boxShadow: 'var(--shadow)' }}>
          <div style={{ position: 'absolute', inset: '-30px auto auto -50px', width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.24)', filter: 'blur(18px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 'auto -40px -70px auto', width: 260, height: 260, borderRadius: '50%', background: 'var(--hero-orb)', filter: 'blur(16px)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1, display: 'grid', gap: 18 }}>
            <HeroTopBar isEnglish={isEnglish} />

            <div style={{ display: 'grid', gap: 14, maxWidth: 800 }}>
              <div style={{ display: 'inline-flex', width: 'fit-content', alignItems: 'center', padding: '6px 10px', borderRadius: 999, background: 'var(--hero-chip)', color: 'var(--hero-chip-text)', fontSize: 12, fontWeight: 700 }}>
                {isEnglish ? 'The companion theme for PocketHugo' : 'PocketHugo 的姊妹主题项目'}
              </div>
              <h1 style={{ margin: 0, fontSize: 'clamp(30px, 7vw, 56px)', lineHeight: 1.08, letterSpacing: -1.2, color: 'var(--hero-text)' }}>
                {isEnglish ? 'A more visual, cover-led Hugo theme for personal writing and modern publishing.' : '一款更有现代感、更强调图文一体的 Hugo 个人写作主题。'}
              </h1>
              <p style={{ margin: 0, fontSize: 'clamp(16px, 2.8vw, 19px)', lineHeight: 1.9, color: 'var(--hero-subtitle)', maxWidth: 720 }}>
                {isEnglish ? 'PocketHugo Theme grows out of real Hugo blogging habits: stronger cover image presentation, calmer card rhythm, more natural mobile reading, and a layout that feels more like a living personal site than a stripped-down text page.' : 'PocketHugo Theme 来自真实的 Hugo 博客写作习惯：更醒目的封面图、更舒展的卡片节奏、更自然的手机阅读体验，以及一种更像真实个人站点、而不是纯文字说明页的整体布局。'}
              </p>
            </div>
          </div>
        </section>

        <section style={{ borderRadius: 24, border: '1px solid var(--border)', background: 'var(--card)', padding: 'clamp(20px, 3.4vw, 28px)', boxShadow: 'var(--shadow)' }}>
          <div className="theme-preview-grid">
            <div style={{ maxWidth: 420, width: '100%' }}>
              <img src="/theme-preview/tn.png" alt="PocketHugo Theme thumbnail" style={{ width: '100%', display: 'block', borderRadius: 18, border: '1px solid var(--border)', background: 'var(--card-muted)', boxShadow: 'var(--shadow)' }} />
            </div>
            <div className="theme-preview-copy">
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
                {isEnglish ? 'A calmer visual rhythm' : '一种更从容的视觉节奏'}
              </div>
              <h2 style={{ margin: 0, fontSize: 'clamp(24px, 4vw, 34px)', lineHeight: 1.18 }}>
                {isEnglish ? 'PocketHugo Theme is designed to feel comfortable on both desktop and phone, with covers and cards doing more of the talking.' : 'PocketHugo Theme 从一开始就很在意电脑和手机两端的阅读体验，让封面图和卡片本身去承担更多表达。'}
              </h2>
              <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.95, fontSize: 15.5 }}>
                {isEnglish ? 'Even its name comes from that idea: a theme meant to stay light in the hand, compact on small screens, but still modern and visual instead of becoming a flat wall of text.' : '从这个名字里其实也能看出它最初的想法，就是希望它在手机上也依然轻巧、顺手、有呼吸感，而不是一缩到小屏幕就变成一堵呆板的文字墙。'}
              </p>
            </div>
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
          {sellingPoints.map((point) => (
            <article key={point.titleEn} style={{ borderRadius: 24, border: '1px solid var(--border)', background: 'var(--card)', padding: 24, minHeight: 220, boxShadow: 'var(--shadow)', display: 'grid', alignContent: 'start', gap: 14 }}>
              <CardIcon>{point.icon}</CardIcon>
              <h2 style={{ margin: 0, fontSize: 20, lineHeight: 1.35 }}>{isEnglish ? point.titleEn : point.titleZh}</h2>
              <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.95, fontSize: 15.5 }}>{isEnglish ? point.bodyEn : point.bodyZh}</p>
            </article>
          ))}
        </section>

        <section style={{ borderRadius: 24, border: '1px solid var(--border)', background: 'linear-gradient(135deg, color-mix(in srgb, var(--card) 88%, var(--hero-start) 12%) 0%, color-mix(in srgb, var(--card) 82%, var(--hero-end) 18%) 100%)', padding: 'clamp(20px, 3.4vw, 28px)', boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ display: 'grid', gap: 8, maxWidth: 700 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{isEnglish ? 'Quick updates and talks' : '快速更新与说说'}</div>
            <h2 style={{ margin: 0, fontSize: 'clamp(22px, 4vw, 30px)', lineHeight: 1.25 }}>{isEnglish ? 'PocketHugo quick page updates can feed naturally into the talks page of this theme.' : 'PocketHugo 的快速页面更新功能，和这套主题里的说说页可以很自然地配合起来。'}</h2>
            <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.9, fontSize: 15.5 }}>{isEnglish ? 'PocketHugo is a Hugo editing and publishing tool, while PocketHugo Theme is a standalone Hugo theme. The strongest overlap between them is the quick page update workflow: short thoughts published from PocketHugo can land directly in the theme\'s talks page and continue flowing outward through JSON or XML feeds.' : 'PocketHugo 是一个 Hugo 文章编辑发布工具，而 PocketHugo Theme 只是一个独立的 Hugo 主题。它们之间最契合的地方，是 PocketHugo 的快速页面更新功能可以和主题里的说说页无缝衔接，让你像发朋友圈或推特一样，在手机上快速记录想法，并继续通过 JSON 或 XML 输出同步到别的平台。'}</p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, padding: '0 18px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--card-muted)', fontWeight: 600 }}>{isEnglish ? 'PocketHugo Home' : 'PocketHugo 首页'}</Link>
            <Link href="/pocket-hugo-theme/guide" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, padding: '0 18px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--card-muted)', fontWeight: 600 }}>{isEnglish ? 'Theme Guide' : '主题指南'}</Link>
            <a href={themeDemoUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, padding: '0 18px', borderRadius: 999, background: 'var(--foreground)', color: 'var(--card)', fontWeight: 700 }}>{isEnglish ? 'Open Theme Demo' : '打开主题演示'}</a>
          </div>
        </section>

        <ThemeSiteFooter />
      </div>
    </main>
  )
}





