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
    titleEn: 'Title cards instead of empty covers',
    titleZh: '缺图时直接生成标题卡片',
    bodyEn:
      'PocketHugo Theme can automatically turn a missing cover into a generated title card, so notes, docs, and lightweight posts still look complete without preparing a separate image asset.',
    bodyZh:
      'PocketHugo Theme 在文章缺图时可以直接生成标题卡片，所以笔记、文档页和轻量内容也能保持完整的视觉呈现，不用额外准备封面图。',
  },
  {
    titleEn: 'Multiple palette pairs built in',
    titleZh: '内置多套浅色与深色卡片方案',
    bodyEn:
      'The title-card system is not a single fallback image. It can adapt across multiple palette pairs, and pages can force a specific preset from front matter when needed.',
    bodyZh:
      '标题卡片不是一张固定回退图，而是可以在多套浅色/深色方案间切换，必要时还能在 front matter 里直接指定某个预设。',
  },
  {
    titleEn: 'Made for current Hugo workflows',
    titleZh: '面向当前 Hugo 工作流设计',
    bodyEn:
      'Responsive image pipeline, multilingual navigation, talks feeds, content adapters, shortcode demos, and modern markup settings are already covered in the theme and example site.',
    bodyZh:
      '响应式图片、多语言导航、说说页 feed、Content Adapter、shortcode 示例，以及现代 Markdown 渲染设置，都已经被纳入主题和示例站。',
  },
  {
    titleEn: 'More natural on phones',
    titleZh: '手机端也更自然',
    bodyEn:
      'Spacing, card density, and image handling are tuned so the theme stays readable and composed on phones instead of collapsing into a cramped technical page.',
    bodyZh:
      '间距、卡片密度和图片处理都尽量围绕手机阅读体验来调，避免缩到小屏幕后退化成一页局促的技术说明。',
  },
]

const titleCardSamples = [
  { code: 'a', titleEn: 'Golden Summer Fields', titleZh: '金色夏野', tone: 'light', background: 'linear-gradient(135deg, #e9edc9 0%, #faedcd 100%)', color: '#4f4736' },
  { code: 'C', titleEn: 'Black Gold Elegance', titleZh: '黑金经典', tone: 'dark', background: 'linear-gradient(135deg, #14213d 0%, #3d2a08 100%)', color: '#f7f7f7' },
  { code: 'G', titleEn: 'Deep Sea Blue', titleZh: '深海蓝调', tone: 'dark', background: 'linear-gradient(135deg, #001845 0%, #33415c 100%)', color: '#eef3fb' },
  { code: 'h', titleEn: 'Monochrome Core', titleZh: '黑白极简', tone: 'light', background: 'linear-gradient(135deg, #ffffff 0%, #e3e3e3 100%)', color: '#111111' },
]

const featureGroups = [
  {
    titleEn: 'Configuration highlights',
    titleZh: '配置亮点',
    itemsEn: ['fallbackMode / openGraphUseDefault', 'coverCard letter presets', 'listTitle for generated title cards', 'sidebar, QR, widgets, and color controls'],
    itemsZh: ['fallbackMode / openGraphUseDefault', 'coverCard 字母预设', '针对标题卡片的 listTitle', '侧边栏、二维码、widgets 与配色控制'],
  },
  {
    titleEn: 'Demo pages included',
    titleZh: '内置示例页面',
    itemsEn: ['Title Card Guide', 'Image Configuration Reference', 'Responsive Image Pipeline', 'Content Adapter Demo, Links, and Talks'],
    itemsZh: ['标题卡片使用说明', '图片配置参考', '响应式图片管线', 'Content Adapter、Links 与 Talks 页面'],
  },
  {
    titleEn: 'Modern Hugo support',
    titleZh: '现代 Hugo 能力',
    itemsEn: ['multilingual menus and switchers', 'responsive image pipeline', 'talks RSS / JSON feeds', 'markup and embedded HTML settings'],
    itemsZh: ['多语言菜单与切换器', '响应式图片管线', '说说页 RSS / JSON feed', 'Markdown 与嵌入 HTML 设置'],
  },
]

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

            <div style={{ display: 'grid', gap: 14, maxWidth: 860 }}>
              <div style={{ display: 'inline-flex', width: 'fit-content', alignItems: 'center', padding: '6px 10px', borderRadius: 999, background: 'var(--hero-chip)', color: 'var(--hero-chip-text)', fontSize: 12, fontWeight: 700 }}>
                {isEnglish ? 'The companion theme for PocketHugo' : 'PocketHugo 的姊妹主题项目'}
              </div>
              <h1 style={{ margin: 0, fontSize: 'clamp(30px, 7vw, 56px)', lineHeight: 1.08, letterSpacing: -1.2, color: 'var(--hero-text)' }}>
                {isEnglish ? 'A more visual Hugo theme with generated title cards, richer color systems, and modern Hugo support.' : '一款更强调标题卡片、多套配色系统，并且面向现代 Hugo 能力的视觉型主题。'}
              </h1>
              <p style={{ margin: 0, fontSize: 'clamp(16px, 2.8vw, 19px)', lineHeight: 1.9, color: 'var(--hero-subtitle)', maxWidth: 760 }}>
                {isEnglish ? 'PocketHugo Theme grows out of real Hugo blogging habits: stronger cover image presentation, automatic title-card fallback, multilingual structure, talks pages, content adapters, and a reading rhythm that stays calm on phones as well as desktop.' : 'PocketHugo Theme 来自真实的 Hugo 博客写作习惯：更醒目的封面图、自动标题卡片回退、多语言结构、说说页、Content Adapter，以及在手机和桌面端都更从容的阅读节奏。'}
              </p>
            </div>
          </div>
        </section>

        <section style={{ borderRadius: 24, border: '1px solid var(--border)', background: 'var(--card)', padding: 'clamp(20px, 3.4vw, 28px)', boxShadow: 'var(--shadow)' }}>
          <div className="theme-preview-grid">
            <div style={{ maxWidth: 420, width: '100%' }}>
              <img src="/theme-preview/tn.png" alt="PocketHugo Theme thumbnail" style={{ width: '100%', display: 'block', borderRadius: 18, border: '1px solid var(--border)', background: 'var(--card-muted)', boxShadow: 'var(--shadow)' }} />
            </div>
            <div className="theme-preview-copy" style={{ display: 'grid', gap: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
                {isEnglish ? 'Theme preview' : '主题预览'}
              </div>
              <h2 style={{ margin: 0, fontSize: 'clamp(24px, 4vw, 34px)', lineHeight: 1.18 }}>
                {isEnglish ? 'The theme centers title cards, cover-led lists, and a more deliberate visual rhythm.' : '这套主题以标题卡片、封面优先的列表，以及更有节奏感的整体视觉为核心。'}
              </h2>
              <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.95, fontSize: 15.5 }}>
                {isEnglish ? 'The demo and guide document not just the theme look, but the actual config surface you can use in a live Hugo site.' : '演示和指南展示的不只是主题截图，而是可以直接落到真实 Hugo 站点里的那套配置能力。'}
              </p>
            </div>
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
          {sellingPoints.map((point) => (
            <article key={point.titleEn} style={{ borderRadius: 24, border: '1px solid var(--border)', background: 'var(--card)', padding: 24, minHeight: 220, boxShadow: 'var(--shadow)', display: 'grid', alignContent: 'start', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-soft)', color: 'var(--accent-soft-text)', border: '1px solid var(--border)', fontWeight: 800, fontSize: 16 }}>{point.titleEn[0]}</div>
              <h2 style={{ margin: 0, fontSize: 20, lineHeight: 1.35 }}>{isEnglish ? point.titleEn : point.titleZh}</h2>
              <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.95, fontSize: 15.5 }}>{isEnglish ? point.bodyEn : point.bodyZh}</p>
            </article>
          ))}
        </section>

        <section style={{ borderRadius: 24, border: '1px solid var(--border)', background: 'var(--card)', padding: 'clamp(20px, 3.4vw, 28px)', boxShadow: 'var(--shadow)', display: 'grid', gap: 18 }}>
          <div style={{ display: 'grid', gap: 8, maxWidth: 780 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{isEnglish ? 'Generated title cards' : '生成式标题卡片'}</div>
            <h2 style={{ margin: 0, fontSize: 'clamp(24px, 4vw, 34px)', lineHeight: 1.18 }}>{isEnglish ? 'Missing cover images no longer have to collapse into a single default picture.' : '缺图时不再只能退回一张默认封面图。'}</h2>
            <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.95, fontSize: 15.5 }}>{isEnglish ? 'PocketHugo Theme can generate a title card directly from the page title, let the site fall back to random presets automatically, or let the author force a specific preset with one front-matter letter.' : 'PocketHugo Theme 可以直接根据页面标题生成卡片，也可以让站点在缺图时自动随机分配预设，或者由作者在 front matter 里用一个字母指定某个方案。'}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
            {titleCardSamples.map((sample) => (
              <article key={sample.code} style={{ borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--card-muted)' }}>
                <div style={{ minHeight: 150, display: 'grid', placeItems: 'center', padding: 18, background: sample.background, color: sample.color }}>
                  <div style={{ textAlign: 'center', display: 'grid', gap: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.75 }}>{sample.code}</div>
                    <div style={{ fontSize: 24, lineHeight: 1.15, fontWeight: 900 }}>{isEnglish ? sample.titleEn : sample.titleZh}</div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>{sample.tone === 'light' ? (isEnglish ? 'Light preset' : '浅色预设') : isEnglish ? 'Dark preset' : '深色预设'}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section style={{ borderRadius: 24, border: '1px solid var(--border)', background: 'linear-gradient(135deg, color-mix(in srgb, var(--card) 88%, var(--hero-start) 12%) 0%, color-mix(in srgb, var(--card) 82%, var(--hero-end) 18%) 100%)', padding: 'clamp(20px, 3.4vw, 28px)', boxShadow: 'var(--shadow)', display: 'grid', gap: 18 }}>
          <div style={{ display: 'grid', gap: 8, maxWidth: 760 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{isEnglish ? 'Built around current Hugo features' : '围绕当前 Hugo 能力构建'}</div>
            <h2 style={{ margin: 0, fontSize: 'clamp(22px, 4vw, 30px)', lineHeight: 1.25 }}>{isEnglish ? 'The theme guide covers real config, demo content, and feature combinations instead of staying at the screenshot level.' : '主题指南不只停留在截图层面，而是把真实配置、示例内容和能力组合一起讲清楚。'}</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {featureGroups.map((group) => (
              <article key={group.titleEn} style={{ borderRadius: 18, border: '1px solid var(--border)', background: 'var(--card)', padding: 18, display: 'grid', gap: 12 }}>
                <h3 style={{ margin: 0, fontSize: 18 }}>{isEnglish ? group.titleEn : group.titleZh}</h3>
                <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--muted)', lineHeight: 1.8, fontSize: 14.5 }}>
                  {(isEnglish ? group.itemsEn : group.itemsZh).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section style={{ borderRadius: 24, border: '1px solid var(--border)', background: 'linear-gradient(135deg, color-mix(in srgb, var(--card) 88%, var(--hero-start) 12%) 0%, color-mix(in srgb, var(--card) 82%, var(--hero-end) 18%) 100%)', padding: 'clamp(20px, 3.4vw, 28px)', boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ display: 'grid', gap: 8, maxWidth: 720 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{isEnglish ? 'Learn the full setup' : '继续看完整配置'}</div>
            <h2 style={{ margin: 0, fontSize: 'clamp(22px, 4vw, 30px)', lineHeight: 1.25 }}>{isEnglish ? 'The guide covers title cards, demo pages, comments, feeds, multilingual menus, and image settings.' : 'Guide 页面整理了标题卡片、示例页面、评论、feed、多语言菜单和图片设置等内容。'}</h2>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/pocket-hugo-theme/guide" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, padding: '0 18px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--card-muted)', fontWeight: 700 }}>{isEnglish ? 'Open Theme Guide' : '打开主题指南'}</Link>
            <a href={themeDemoUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, padding: '0 18px', borderRadius: 999, background: 'var(--foreground)', color: 'var(--card)', fontWeight: 700 }}>{isEnglish ? 'Open Theme Demo' : '打开主题演示'}</a>
          </div>
        </section>

        <ThemeSiteFooter />
      </div>
    </main>
  )
}





