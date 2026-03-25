'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import LanguageToggle from '@/components/language/LanguageToggle'
import PocketHugoThemeLogo from '@/components/layout/PocketHugoThemeLogo'
import { SiteHeader } from '@/components/layout/SiteChrome'
import ThemeSiteFooter from '@/components/theme-site/ThemeSiteFooter'
import ThemeToggle from '@/components/theme/ThemeToggle'
import { useLanguage } from '@/lib/use-language'

const themeDemoUrl = 'https://theme.leftn.com'
const themeRepoUrl = 'https://github.com/h2dcc/pocket-hugo-theme'

type ThemeGuideLink = {
  labelEn: string
  labelZh: string
  href: string
}

type ThemeGuideSection = {
  titleEn: string
  titleZh: string
  bodyEn: string[]
  bodyZh: string[]
  codeEn?: string
  codeZh?: string
  images?: string[]
  links?: ThemeGuideLink[]
}

const guideSections: ThemeGuideSection[] = [
  {
    titleEn: 'Install the Theme',
    titleZh: '安装主题',
    bodyEn: [
      'The most direct installation method is to clone the repository into your Hugo site `themes/` directory, then point `theme` to `pocket-hugo-theme`.',
      'This keeps theme code separate from your content and makes it easier to update the theme later without touching posts or page bundles.',
    ],
    bodyZh: [
      '最直接的安装方式，就是把仓库克隆到 Hugo 站点的 `themes/` 目录，然后把 `theme` 指向 `pocket-hugo-theme`。',
      '这样主题代码和内容仓库是分开的，后面你要单独升级主题时，不容易碰到文章和 bundle 资源。',
    ],
    codeEn: "git clone https://github.com/h2dcc/pocket-hugo-theme.git themes/pocket-hugo-theme",
    codeZh: "git clone https://github.com/h2dcc/pocket-hugo-theme.git themes/pocket-hugo-theme",
  },
  {
    titleEn: 'Minimal hugo.toml',
    titleZh: '最小 hugo.toml',
    bodyEn: [
      'A minimal site config only needs the theme name, base URL, title, default language, and a main content section.',
      'That is enough to render a working home page, list pages, and single pages before you add richer theme options.',
    ],
    bodyZh: [
      '最小可运行配置里，至少要有主题名、站点地址、标题、默认语言，以及主要内容分区。',
      '先把这些基础项配好，主题就能先跑起首页、列表页和文章页，后面再逐步加更细的配置。',
    ],
    codeEn: "baseURL = 'https://example.org/'\ntitle = 'Pocket Notes'\ntheme = 'pocket-hugo-theme'\nlanguageCode = 'en'\ndefaultContentLanguage = 'en'\nhasCJKLanguage = true\nenableRobotsTXT = true\nmainSections = ['posts']",
    codeZh: "baseURL = 'https://example.org/'\ntitle = 'Pocket Notes'\ntheme = 'pocket-hugo-theme'\nlanguageCode = 'zh-cn'\ndefaultContentLanguage = 'zh-cn'\nhasCJKLanguage = true\nenableRobotsTXT = true\nmainSections = ['posts']",
  },
  {
    titleEn: 'Preview and design direction',
    titleZh: '预览与视觉方向',
    bodyEn: [
      'The demo screenshot shows the theme direction clearly: stronger title-card presentation, calmer cover rhythm, and a cleaner two-column reading balance on desktop.',
      'The theme is not trying to mimic a bare documentation skin. It aims for a more lived-in personal publishing feel.',
    ],
    bodyZh: [
      '演示截图体现了这套主题的视觉方向：更强调标题卡片、更从容的封面节奏，以及桌面端更平衡的双栏阅读结构。',
      '它并不是想做成一套极简文档皮肤，而是希望更像一个长期经营的个人写作站点。',
    ],
    images: ['/theme-preview/screenshot.png'],
  },
  {
    titleEn: 'Core site metadata and base params',
    titleZh: '基础站点信息与核心参数',
    bodyEn: [
      'Most site identity settings now live in `[params]`, including favicon, Apple touch icon, summary length, article word count, and back-to-top behavior.',
      'This is also where you define the featured image field name used by posts and page bundles.',
    ],
    bodyZh: [
      '现在大多数站点身份类设置都已经收进 `[params]`，包括 favicon、Apple Touch Icon、摘要长度、字数统计和返回顶部等。',
      '文章和页面 bundle 使用哪个 front matter 字段作为封面图，也是从这里控制。',
    ],
    codeEn: "[params]\n  featuredImageField = 'image'\n  favicon = '/img/logo-default.png'\n  appleTouchIcon = '/img/logo-default.png'\n  summaryLength = 0\n  articleWords = true\n  backToTop = true\n\n  [params.footer]\n    since = 2026",
    codeZh: "[params]\n  featuredImageField = 'image'\n  favicon = '/img/logo-default.png'\n  appleTouchIcon = '/img/logo-default.png'\n  summaryLength = 0\n  articleWords = true\n  backToTop = true\n\n  [params.footer]\n    since = 2026",
  },
  {
    titleEn: 'Cover images, title cards, and social fallback',
    titleZh: '封面图、标题卡片与社交分享回退',
    bodyEn: [
      'The theme supports two fallback cover modes when a page has no image: use `default-cover`, or generate a gradient title card automatically.',
      'You can keep title cards as the default site behavior, still use `default-cover` as the Open Graph image, and also choose whether list cards should keep their outer title when the page already has a generated title card.',
      'For single pages, front matter can force a title card with `coverCard`. The simplest form is one letter: `a` to `h` for the 8 light presets, `A` to `H` for the 8 dark presets, and any other value for automatic random selection.',
    ],
    bodyZh: [
      '现在主题已经支持两种缺图回退模式：要么继续使用 `default-cover`，要么自动生成一张渐变标题卡片。',
      '你可以把标题卡片设成站点默认行为，同时继续让 `default-cover` 作为 Open Graph 分享图输出，并且决定列表页里要不要继续显示卡片外部标题。',
      '对单页来说，front matter 还可以直接强制使用标题卡片。最简单的写法就是一个字母：`a` 到 `h` 表示 8 套浅色，`A` 到 `H` 表示 8 套深色，其他任意值则自动随机。',
    ],
    codeEn: "[params.images.cover]\n  useFill = false\n  cardFill = '640x300 Center q85'\n  taxonomyFill = '640x300 Center q85'\n  openGraphVariant = 'card'\n  useDefault = true\n  fallbackMode = 'gradient'\n  openGraphUseDefault = true\n  default = '/img/default-cover.webp'\n\n[params.article]\n  listTitle = true\n\n# front matter\ncoverCard: 'G'\nlistTitle: false",
    codeZh: "[params.images.cover]\n  useFill = false\n  cardFill = '640x300 Center q85'\n  taxonomyFill = '640x300 Center q85'\n  openGraphVariant = 'card'\n  useDefault = true\n  fallbackMode = 'gradient'\n  openGraphUseDefault = true\n  default = '/img/default-cover.webp'\n\n[params.article]\n  listTitle = true\n\n# front matter\ncoverCard: 'G'\nlistTitle: false",
  },
  {
    titleEn: 'Sidebar, avatar, QR, and social links',
    titleZh: '侧边栏、头像、二维码与社交链接',
    bodyEn: [
      'The theme relies on a complete site identity at the top of the page, so sidebar subtitle, avatar, QR code, and social links are all configurable.',
      'If you prefer a lighter personal site, you can keep QR disabled and only leave a few social items.',
    ],
    bodyZh: [
      '这套主题很依赖站点头部的完整形象，所以侧边栏副标题、头像、二维码和社交链接都做成了配置项。',
      '如果你想让个人站更轻一点，也可以直接关闭二维码，只保留少量社交链接。',
    ],
    codeEn: "[params.sidebar]\n  subtitle = 'A cover-driven theme for long-term personal writing'\n\n  [params.sidebar.avatar]\n    enabled = true\n    local = true\n    src = 'img/avatar.webp'\n\n  [params.sidebar.qr]\n    enabled = false\n\n[[params.social]]\n  name = 'GitHub'\n  url = 'https://github.com/h2dcc/pocket-hugo-theme'\n  icon = 'brand-github'",
    codeZh: "[params.sidebar]\n  subtitle = '一款适合个人长期写作的图文式主题'\n\n  [params.sidebar.avatar]\n    enabled = true\n    local = true\n    src = 'img/avatar.webp'\n\n  [params.sidebar.qr]\n    enabled = false\n\n[[params.social]]\n  name = 'GitHub'\n  url = 'https://github.com/h2dcc/pocket-hugo-theme'\n  icon = 'brand-github'",
  },
  {
    titleEn: 'Article options and image pipeline',
    titleZh: '文章区设置与图片处理',
    bodyEn: [
      'Article settings cover table of contents, reading time, article words, page descriptions, and whether list summaries should appear under card titles.',
      'The theme also exposes content-image height controls and a Hugo image pipeline with responsive widths, output format, and quality settings.',
      'This matters if your site contains tall mobile screenshots, wide visuals, or content that should stay visually stable across devices.',
    ],
    bodyZh: [
      '文章区设置主要控制目录、阅读时间、字数统计、页面 description，以及列表页卡片下方要不要显示摘要。',
      '主题还提供了正文图片限高和 Hugo 图片 pipeline 的相关参数，包括响应式宽度、输出格式和质量。',
      '如果你的站点经常放手机长截图、大图或对多端视觉稳定性要求比较高，这一块会很有用。',
    ],
    codeEn: "[params.article]\n  showListSummary = true\n  showPageDescription = true\n  toc = true\n  readingTime = true\n\n[params.images.content]\n  enableMaxHeight = true\n  limitHeight = false\n  unifiedMaxHeight = '320px'\n  mobileMaxHeight = '160px'\n  tabletMaxHeight = '250px'\n  desktopMaxHeight = '350px'\n  fullWidthFit = 'cover'\n\n[params.images.pipeline]\n  responsive = true\n  format = 'webp'\n  quality = 85\n  coverWidths = [480, 720, 960, 1280]\n  contentWidths = [640, 960, 1400]",
    codeZh: "[params.article]\n  showListSummary = true\n  showPageDescription = true\n  toc = true\n  readingTime = true\n\n[params.images.content]\n  enableMaxHeight = true\n  limitHeight = false\n  unifiedMaxHeight = '320px'\n  mobileMaxHeight = '160px'\n  tabletMaxHeight = '250px'\n  desktopMaxHeight = '350px'\n  fullWidthFit = 'cover'\n\n[params.images.pipeline]\n  responsive = true\n  format = 'webp'\n  quality = 85\n  coverWidths = [480, 720, 960, 1280]\n  contentWidths = [640, 960, 1400]",
  },
  {
    titleEn: 'Languages, menus, and language switcher',
    titleZh: '多语言、菜单与语言切换器',
    bodyEn: [
      'The theme supports two-language sites as well as larger multilingual sites, and each language can have its own sidebar subtitle and menu labels.',
      'The language switcher can stay light on bilingual sites or expand into a fuller selector on sites with more languages.',
    ],
    bodyZh: [
      '这套主题既支持双语站，也支持更多语言的多语站点，并且每种语言都可以有独立的侧边栏副标题和菜单文案。',
      '语言切换器在双语站时可以保持轻量，在多语站时则会自然切换成更完整的选择器。',
    ],
    codeEn: "[languages.en]\n  languageName = 'English'\n  title = 'Pocket Hugo'\n  weight = 1\n\n[languages.en.params.sidebar]\n  subtitle = 'A cover-driven theme for long-term personal writing'\n\n[languages.zh-cn]\n  languageName = 'Chinese'\n  title = 'Pocket Hugo'\n  weight = 2\n\n[languages.zh-cn.params.sidebar]\n  subtitle = '一款适合个人长期写作的图文式主题'\n\n[params.languageSwitcher]\n  headerSelectThreshold = 3",
    codeZh: "[languages.zh-cn]\n  languageName = 'Chinese'\n  title = 'Pocket Hugo'\n  weight = 1\n\n[languages.zh-cn.params.sidebar]\n  subtitle = '一款适合个人长期写作的图文式主题'\n\n[languages.en]\n  languageName = 'English'\n  title = 'Pocket Hugo'\n  weight = 2\n\n[languages.en.params.sidebar]\n  subtitle = 'A cover-driven theme for long-term personal writing'\n\n[params.languageSwitcher]\n  headerSelectThreshold = 3",
  },
  {
    titleEn: 'Talks, links, and publishing flows',
    titleZh: '说说页、友链页与发布流程',
    bodyEn: [
      'The theme includes dedicated talks and links page patterns, and talks pages can output standalone RSS and JSON feeds.',
      'That works especially well with PocketHugo quick updates: short thoughts can land in the talks page and continue outward through XML or JSON feed consumers.',
    ],
    bodyZh: [
      '主题内置了说说页和友链页这类固定页面模式，而且说说页还可以单独输出 RSS 和 JSON feed。',
      '这一点和 PocketHugo 的快速更新功能很契合：短想法可以先落进说说页，再继续通过 XML 或 JSON 被外部消费。',
    ],
    codeEn: "[outputFormats.TalksRSS]\n  mediaType = 'application/rss+xml'\n  baseName = 'talks'\n  isPlainText = false\n  notAlternative = true\n\n[outputFormats.TalksJSON]\n  mediaType = 'application/feed+json'\n  baseName = 'talks'\n  isPlainText = true\n  notAlternative = true\n\n# talks page front matter\noutputs = ['HTML', 'TalksJSON', 'TalksRSS']",
    codeZh: "[outputFormats.TalksRSS]\n  mediaType = 'application/rss+xml'\n  baseName = 'talks'\n  isPlainText = false\n  notAlternative = true\n\n[outputFormats.TalksJSON]\n  mediaType = 'application/feed+json'\n  baseName = 'talks'\n  isPlainText = true\n  notAlternative = true\n\n# talks 页 front matter\noutputs = ['HTML', 'TalksJSON', 'TalksRSS']",
  },
  {
    titleEn: 'Search, comments, widgets, and color systems',
    titleZh: '搜索、评论、边栏组件与配色系统',
    bodyEn: [
      'Beyond the page layouts, the theme also exposes search provider settings, comments, widget groups, and a larger color-system configuration for both light and dark use.',
      'The title-card system lets the theme adapt one card design across multiple palette pairs instead of treating cover fallback as a single static image.',
    ],
    bodyZh: [
      '除了页面布局本身，主题还把搜索、评论、边栏组件和整套配色系统都开放成了配置项。',
      '标题卡片让缺图回退不再是一张固定图片，而是可以在多套浅色/深色配色之间适配。',
    ],
    codeEn: "[params.search]\n  provider = 'local'\n  fullText = false\n\n[params.comments]\n  enabled = true\n  provider = 'twikoo'\n\n[params.colorScheme]\n  toggle = true\n  default = 'auto'\n\n[params.widgets]\n  homepage = [\n    { type = 'search', params = { limit = 0 } },\n    { type = 'archives', params = { limit = 3 } },\n    { type = 'categories', params = { limit = 10 } }\n  ]",
    codeZh: "[params.search]\n  provider = 'local'\n  fullText = false\n\n[params.comments]\n  enabled = true\n  provider = 'twikoo'\n\n[params.colorScheme]\n  toggle = true\n  default = 'auto'\n\n[params.widgets]\n  homepage = [\n    { type = 'search', params = { limit = 0 } },\n    { type = 'archives', params = { limit = 3 } },\n    { type = 'categories', params = { limit = 10 } }\n  ]",
  },
  {
    titleEn: 'Modern Hugo features already covered',
    titleZh: '已经覆盖的现代 Hugo 功能',
    bodyEn: [
      'The current theme is no longer just a visual skin. It already covers responsive images, multilingual navigation, content adapters, title-card fallback, talks feeds, shortcode examples, markup settings, and experimental View Transitions support.',
      'That makes the guide worth reading even if you already know Hugo well, because many of the practical defaults are tied directly to how the demo site is structured.',
    ],
    bodyZh: [
      '现在这套主题已经不只是一个视觉外壳了。它已经覆盖响应式图片、多语言导航、Content Adapter、标题卡片回退、说说页 feed、shortcode 示例、Markdown 渲染设置，以及实验性的 View Transitions 支持。',
      '所以即使你已经很熟 Hugo，这份指南依然值得看，因为很多比较实用的默认值其实都和示例站当前的结构直接相关。',
    ],
    codeEn: "[params]\n  viewTransitions = false\n\n[params.images.pipeline]\n  responsive = true\n\n[params.projects.remoteDemo]\n  enabled = false\n  source = 'github-issues'\n\n[markup.goldmark.renderer]\n  unsafe = true",
    codeZh: "[params]\n  viewTransitions = false\n\n[params.images.pipeline]\n  responsive = true\n\n[params.projects.remoteDemo]\n  enabled = false\n  source = 'github-issues'\n\n[markup.goldmark.renderer]\n  unsafe = true",
  },
  {
    titleEn: 'Demo content worth opening',
    titleZh: '值得打开看的示例文章',
    bodyEn: [
      'The example site is more than placeholder content. Several demo pages explain real theme behavior directly.',
      'Open these pages to see title cards, image settings, content adapters, and built-in static page patterns in action.',
    ],
    bodyZh: [
      '示例站不只是占位内容，里面有几篇页面会直接解释主题本身的真实行为。',
      '下面这些页面可以直接看到标题卡片、图片设置、Content Adapter，以及内置固定页面模式的实际效果。',
    ],
    links: [
      { labelEn: 'Title Card Guide', labelZh: '标题卡片使用说明', href: `${themeDemoUrl}/article/title-card-guide/` },
      { labelEn: 'Image Configuration Reference', labelZh: '图片配置参考', href: `${themeDemoUrl}/article/image-config-reference/` },
      { labelEn: 'Responsive Image Pipeline', labelZh: '响应式图片管线', href: `${themeDemoUrl}/article/responsive-image-pipeline/` },
      { labelEn: 'Content Adapter Demo', labelZh: 'Content Adapter 示例', href: `${themeDemoUrl}/article/content-adapter-demo/` },
      { labelEn: 'Quick Note', labelZh: '快速笔记', href: `${themeDemoUrl}/article/quick-note/` },
      { labelEn: 'Links', labelZh: '友链页', href: `${themeDemoUrl}/links/` },
      { labelEn: 'Talks', labelZh: '说说页', href: `${themeDemoUrl}/talks/` },
    ],
  },
]

function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .replace(/[`~!@#$%^&*()+=|{}[\]:;"'<>,.?/\\]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function PocketHugoThemeGuide() {
  const { isEnglish } = useLanguage()
  const sections = useMemo(
    () =>
      guideSections.map((section) => ({
        title: isEnglish ? section.titleEn : section.titleZh,
        body: isEnglish ? section.bodyEn : section.bodyZh,
        code: isEnglish ? section.codeEn : section.codeZh,
        images: section.images,
        links: section.links?.map((link) => ({
          label: isEnglish ? link.labelEn : link.labelZh,
          href: link.href,
        })),
      })),
    [isEnglish],
  )
  const tocTitle = isEnglish ? 'On This Page' : '本页目录'

  return (
    <main style={{ padding: 16, maxWidth: 1120, margin: '0 auto', display: 'grid', gap: 16 }}>
      <SiteHeader
        href="/pocket-hugo-theme"
        title="PocketHugo Theme"
        badgeEn="Companion theme for PocketHugo"
        badgeZh="PocketHugo 的姊妹主题"
        subtitleEn="A companion theme for PocketHugo and long-term Hugo blogging."
        subtitleZh="PocketHugo 的姊妹主题，也是一套适合长期 Hugo 博客写作的主题。"
        icon={<PocketHugoThemeLogo size={32} />}
      />

      <section style={{ border: '1px solid var(--border)', borderRadius: 20, background: 'var(--card)', boxShadow: 'var(--shadow)', padding: 'clamp(20px, 4vw, 28px)', display: 'grid', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{isEnglish ? 'Theme Guide' : '主题指南'}</div>
            <h1 style={{ margin: 0, fontSize: 'clamp(24px, 5vw, 38px)', lineHeight: 1.1 }}>{isEnglish ? 'How to Install and Configure PocketHugo Theme' : 'PocketHugo Theme 安装与配置指南'}</h1>
            <p style={{ margin: 0, color: 'var(--foreground)', lineHeight: 1.8, fontSize: 15, fontWeight: 600 }}>{isEnglish ? 'This guide brings together the main hugo.toml settings, fallback title cards, multilingual structure, demo content, and Hugo features available in the theme.' : '这份指南整理了 hugo.toml 里的主要设置、标题卡片回退、多语言结构、示例内容，以及主题提供的 Hugo 功能。'}</p>
            <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.8, fontSize: 13 }}>{isEnglish ? 'Project author: Lawtee - https://lawtee.com' : '项目作者：Lawtee - https://lawtee.com'}</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
              <a href={themeDemoUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, width: 'fit-content', padding: '8px 12px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--card-muted)', color: 'var(--foreground)', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
                <PocketHugoThemeLogo size={24} />
                <span>{isEnglish ? 'PocketHugo Theme Demo' : 'PocketHugo Theme 演示'}</span>
              </a>
              <a href={themeRepoUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 'fit-content', padding: '8px 12px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--card-muted)', color: 'var(--foreground)', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>GitHub</a>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <LanguageToggle />
            <ThemeToggle />
            <Link href="/pocket-hugo-theme" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card-muted)', fontWeight: 700 }}>{isEnglish ? 'Theme Home' : '主题首页'}</Link>
          </div>
        </div>
      </section>

      <section style={{ border: '1px solid var(--border)', borderRadius: 20, background: 'var(--card)', boxShadow: 'var(--shadow)', padding: 'clamp(20px, 4vw, 28px)', display: 'grid', gap: 22 }}>
        <div className="guide-layout">
          <aside className="guide-toc" style={{ display: 'grid', gap: 12 }}>
            <div style={{ border: '1px solid var(--border)', borderRadius: 16, background: 'var(--card-muted)', padding: 14, display: 'grid', gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{tocTitle}</div>
              <nav aria-label={tocTitle}>
                <div style={{ display: 'grid', gap: 8 }}>
                  {sections.map((section) => {
                    const sectionId = slugifyHeading(section.title)
                    return (
                      <a key={section.title} href={`#${sectionId}`} style={{ color: 'var(--foreground)', fontSize: 14, lineHeight: 1.5, textDecoration: 'none' }}>
                        {section.title}
                      </a>
                    )
                  })}
                </div>
              </nav>
            </div>
          </aside>

          <div style={{ display: 'grid', gap: 0 }}>
            {sections.map((section, index) => {
              const sectionId = slugifyHeading(section.title)
              return (
                <article id={sectionId} key={section.title} style={{ display: 'grid', gap: 12, paddingTop: index === 0 ? 0 : 20, marginTop: index === 0 ? 0 : 20, borderTop: index === 0 ? 'none' : '1px solid var(--border)', scrollMarginTop: 24 }}>
                  <h2 style={{ margin: 0, fontSize: 21, lineHeight: 1.25 }}>{section.title}</h2>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {section.body.map((paragraph) => (
                      <p key={paragraph} style={{ margin: 0, color: 'var(--foreground)', lineHeight: 1.9, fontSize: 15 }}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  {section.code ? (
                    <pre style={{ margin: 0, padding: 16, borderRadius: 16, border: '1px solid var(--border)', background: 'var(--card-muted)', overflowX: 'auto', lineHeight: 1.7, fontSize: 14, whiteSpace: 'pre' }}>
                      <code>{section.code}</code>
                    </pre>
                  ) : null}
                  {section.images?.length ? (
                    <div style={{ display: 'grid', gap: 12, marginTop: 4 }}>
                      {section.images.map((imagePath) => (
                        <img key={imagePath} src={imagePath} alt={imagePath.split('/').pop() ?? 'theme preview'} style={{ width: '100%', display: 'block', borderRadius: 16, border: '1px solid var(--border)', background: 'var(--card-muted)', boxShadow: 'var(--shadow)' }} />
                      ))}
                    </div>
                  ) : null}
                  {section.links?.length ? (
                    <div style={{ display: 'grid', gap: 10, marginTop: 4 }}>
                      {section.links.map((link) => (
                        <a key={link.href} href={link.href} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--card-muted)', color: 'var(--foreground)', textDecoration: 'none', fontSize: 14.5, fontWeight: 700 }}>
                          <span>{link.label}</span>
                          <span style={{ color: 'var(--muted)', fontWeight: 600 }}>theme.leftn.com</span>
                        </a>
                      ))}
                    </div>
                  ) : null}
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section style={{ border: '1px solid var(--border)', borderRadius: 20, background: 'var(--card)', boxShadow: 'var(--shadow)', padding: 'clamp(20px, 4vw, 28px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>{isEnglish ? 'Ready to try it on your own site?' : '准备把它接到你自己的站点里？'}</h2>
          <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.8 }}>{isEnglish ? 'Open the live demo, then apply the configuration pieces you need in your own Hugo project section by section.' : '可以先打开在线演示，再把你需要的配置按模块应用到自己的 Hugo 项目里。'}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href={themeDemoUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--accent)', background: 'var(--accent)', color: 'var(--accent-contrast)', fontWeight: 700 }}>{isEnglish ? 'Open Theme Demo' : '打开主题演示'}</a>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card-muted)', fontWeight: 700 }}>{isEnglish ? 'Back to PocketHugo' : '返回 PocketHugo'}</Link>
        </div>
      </section>

      <ThemeSiteFooter />
    </main>
  )
}
