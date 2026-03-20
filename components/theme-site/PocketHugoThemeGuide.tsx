'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import LanguageToggle from '@/components/language/LanguageToggle'
import PocketHugoThemeLogo from '@/components/layout/PocketHugoThemeLogo'
import { SiteFooter, SiteHeader } from '@/components/layout/SiteChrome'
import ThemeToggle from '@/components/theme/ThemeToggle'
import { useLanguage } from '@/lib/use-language'

const themeDemoUrl = 'https://theme.leftn.com'
const themeRepoUrl = 'https://github.com/h2dcc/pocket-hugo-theme'

type ThemeGuideSection = {
  titleEn: string
  titleZh: string
  bodyEn: string[]
  bodyZh: string[]
  codeEn?: string
  codeZh?: string
  images?: string[]
}

const guideSections: ThemeGuideSection[] = [
  {
    titleEn: 'Install the Theme',
    titleZh: '安装主题',
    bodyEn: [
      'The most direct installation method is to place the repository under your Hugo site `themes/` folder, then point `theme` to `pocket-hugo-theme`.',
      'This keeps the theme separate from your content and lets you update it independently later.',
    ],
    bodyZh: [
      '最直接的安装方式，就是把主题仓库放进 Hugo 站点的 `themes/` 目录，然后把 `theme` 指向 `pocket-hugo-theme`。',
      '这样主题和内容仓库是分开的，后面你要单独更新主题也会更方便。',
    ],
    codeEn: "git clone https://github.com/h2dcc/pocket-hugo-theme.git themes/pocket-hugo-theme",
    codeZh: "git clone https://github.com/h2dcc/pocket-hugo-theme.git themes/pocket-hugo-theme",
  },
  {
    titleEn: 'Minimal hugo.toml',
    titleZh: '最小 hugo.toml',
    bodyEn: [
      'A minimal site config only needs the theme name, base URL, title, default language, and a main content section.',
      'This is enough to let the theme render basic home, list, and single pages before you add richer options.',
    ],
    bodyZh: [
      '最小可运行配置里，至少要有主题名、站点地址、标题、默认语言，以及主要内容分区。',
      '先把这些基础项配好，主题就能先跑起首页、列表页和文章页，后面再逐步加细项。',
    ],
    codeEn: "baseURL = 'https://example.org/'\ntitle = 'Pocket Notes'\ntheme = 'pocket-hugo-theme'\nlanguageCode = 'en'\ndefaultContentLanguage = 'en'\nhasCJKLanguage = true\nenableRobotsTXT = true\nmainSections = ['posts']",
    codeZh: "baseURL = 'https://example.org/'\ntitle = 'Pocket Notes'\ntheme = 'pocket-hugo-theme'\nlanguageCode = 'zh-cn'\ndefaultContentLanguage = 'zh-cn'\nhasCJKLanguage = true\nenableRobotsTXT = true\nmainSections = ['posts']",
  },
  {
    titleEn: 'Theme Preview',
    titleZh: '主题预览',
    bodyEn: [
      'This screenshot shows the card rhythm, cover-first list style, and calmer reading feel the theme aims for.',
    ],
    bodyZh: [
      '这张截图可以直接看到主题的卡片节奏、封面图优先的列表风格，以及它想追求的那种更从容的阅读感。',
    ],
    images: ['/theme-preview/screenshot.png'],
  },
  {
    titleEn: 'Permalinks, feeds, and taxonomies',
    titleZh: '固定链接、feed 与分类体系',
    bodyEn: [
      'The example config defines article URLs, page URLs, RSS limits, talks JSON / RSS outputs, and the default taxonomy names.',
      'If you want the theme to expose a talks page that can also sync outward, these sections matter early.',
    ],
    bodyZh: [
      '示例配置里同时定义了文章和页面的 URL、RSS 条数、说说页的 JSON / RSS 输出，以及默认分类和标签名称。',
      '如果你希望主题里的说说页还能继续向外同步，这几块最好一开始就定下来。',
    ],
    codeEn: "[outputFormats.TalksRSS]\n  mediaType = 'application/rss+xml'\n  baseName = 'talks'\n  isPlainText = false\n  notAlternative = true\n\n[outputFormats.TalksJSON]\n  mediaType = 'application/feed+json'\n  baseName = 'talks'\n  isPlainText = true\n  notAlternative = true\n\n[permalinks]\n  posts = '/article/:slug/'\n  page = '/:slug/'\n\n[taxonomies]\n  tag = 'tags'\n  category = 'categories'",
    codeZh: "[outputFormats.TalksRSS]\n  mediaType = 'application/rss+xml'\n  baseName = 'talks'\n  isPlainText = false\n  notAlternative = true\n\n[outputFormats.TalksJSON]\n  mediaType = 'application/feed+json'\n  baseName = 'talks'\n  isPlainText = true\n  notAlternative = true\n\n[permalinks]\n  posts = '/article/:slug/'\n  page = '/:slug/'\n\n[taxonomies]\n  tag = 'tags'\n  category = 'categories'",
  },
  {
    titleEn: 'Languages and menus',
    titleZh: '多语言与导航菜单',
    bodyEn: [
      'The theme supports two-language sites as well as three or more languages. Each language can have its own sidebar subtitle and menu labels.',
      'When your site grows beyond two languages, the language switcher becomes more important, so it is worth setting languages and menu paths clearly.',
    ],
    bodyZh: [
      '这套主题既支持双语站，也支持三种以上语言。每种语言都可以单独定义侧边栏副标题和导航菜单文案。',
      '当语言数超过两种时，语言切换就会更重要，所以最好把语言项和菜单路径一开始就配清楚。',
    ],
    codeEn: "[languages.en]\n  languageName = 'English'\n  title = 'Pocket Notes'\n  weight = 1\n\n[languages.en.params.sidebar]\n  subtitle = 'A cover-driven theme for long-term personal writing'\n\n[languages.zh-cn]\n  languageName = 'Chinese'\n  title = 'Pocket Notes'\n  weight = 2\n\n[languages.zh-cn.params.sidebar]\n  subtitle = '一款适合个人长期写作的图文式主题'",
    codeZh: "[languages.zh-cn]\n  languageName = 'Chinese'\n  title = 'Pocket Notes'\n  weight = 1\n\n[languages.zh-cn.params.sidebar]\n  subtitle = '一款适合个人长期写作的图文式主题'\n\n[languages.en]\n  languageName = 'English'\n  title = 'Pocket Notes'\n  weight = 2\n\n[languages.en.params.sidebar]\n  subtitle = 'A cover-driven theme for long-term personal writing'",
  },
  {
    titleEn: 'Core [params] options',
    titleZh: '核心 [params] 选项',
    bodyEn: [
      'Most of the old hard-coded personal defaults have already been moved into `[params]`, so this is the section you will edit most often.',
      'Fields such as favicon, Apple touch icon, summary length, article word count, and back-to-top behavior all live here.',
    ],
    bodyZh: [
      '原来很多只适合作者自己博客的写死项，现在都已经抽到 `[params]` 里了，所以这也是你最常改的一块。',
      '像 favicon、Apple Touch Icon、摘要长度、文章字数统计和返回顶部等行为，都在这里控制。',
    ],
    codeEn: "[params]\n  featuredImageField = 'image'\n  favicon = '/img/logo-default.png'\n  appleTouchIcon = '/img/logo-default.png'\n  summaryLength = 0\n  articleWords = true\n  backToTop = true\n\n  [params.footer]\n    since = 2026",
    codeZh: "[params]\n  featuredImageField = 'image'\n  favicon = '/img/logo-default.png'\n  appleTouchIcon = '/img/logo-default.png'\n  summaryLength = 0\n  articleWords = true\n  backToTop = true\n\n  [params.footer]\n    since = 2026",
  },
  {
    titleEn: 'Sidebar, avatar, QR, and social links',
    titleZh: '侧边栏、头像、二维码和社交链接',
    bodyEn: [
      'This theme relies heavily on a complete site identity at the top of the page, so sidebar subtitle, avatar, QR code, and social links are all configurable.',
      'If you want a lighter personal site, you can keep QR disabled and only leave a few social items.',
    ],
    bodyZh: [
      '这套主题很依赖首页顶部的完整站点形象，所以侧边栏副标题、头像、二维码和社交链接都做成了配置项。',
      '如果你想让个人站更轻一些，也可以直接关闭二维码，只保留少量社交链接。',
    ],
    codeEn: "[params.sidebar]\n  subtitle = 'A cover-driven theme for long-term personal writing'\n\n  [params.sidebar.avatar]\n    enabled = true\n    local = true\n    src = 'img/avatar.webp'\n\n  [params.sidebar.qr]\n    enabled = false\n\n[[params.social]]\n  name = 'GitHub'\n  url = 'https://github.com/h2dcc/pocket-hugo-theme'\n  icon = 'brand-github'",
    codeZh: "[params.sidebar]\n  subtitle = '一款适合个人长期写作的图文式主题'\n\n  [params.sidebar.avatar]\n    enabled = true\n    local = true\n    src = 'img/avatar.webp'\n\n  [params.sidebar.qr]\n    enabled = false\n\n[[params.social]]\n  name = 'GitHub'\n  url = 'https://github.com/h2dcc/pocket-hugo-theme'\n  icon = 'brand-github'",
  },
  {
    titleEn: 'Article options',
    titleZh: '文章区设置',
    bodyEn: [
      'Article-level settings control reading time, table of contents, and whether article images should be height-limited.',
      'This is useful if your posts often contain tall screenshots or long mobile captures and you want them to stay visually stable in the article body.',
    ],
    bodyZh: [
      '文章区设置主要控制阅读时间、目录，以及正文图片是否限制高度。',
      '如果你的文章里经常放很长的截图或手机长图，这一块会比较有用，可以让正文视觉更稳定。',
    ],
    codeEn: "[params.article]\n  limitContentImageHeight = false\n  contentImageMaxHeight = '320px'\n  toc = true\n  readingTime = true",
    codeZh: "[params.article]\n  limitContentImageHeight = false\n  contentImageMaxHeight = '320px'\n  toc = true\n  readingTime = true",
  },
  {
    titleEn: 'Language switcher behavior',
    titleZh: '语言切换行为',
    bodyEn: [
      'The theme can switch between a direct icon and a richer selector depending on how many languages exist in the site.',
      'For bilingual sites this keeps the header lighter; for larger multilingual sites it becomes easier to navigate.',
    ],
    bodyZh: [
      '这套主题会根据站点里实际存在的语言数量，在简洁图标和更完整的选择器之间切换。',
      '对双语站来说，这样页头会更轻；对多语站来说，又能保证导航不至于太别扭。',
    ],
    codeEn: "[params.languageSwitcher]\n  headerSelectThreshold = 3",
    codeZh: "[params.languageSwitcher]\n  headerSelectThreshold = 3",
  },
  {
    titleEn: 'Comments',
    titleZh: '评论设置',
    bodyEn: [
      'Comments are optional. You can leave them off, or enable Giscus / Twikoo depending on your own deployment preference.',
      'Single posts and pages can still override the global default through front matter.',
    ],
    bodyZh: [
      '评论功能是可选的。你可以完全关闭，也可以按自己的部署偏好启用 Giscus 或 Twikoo。',
      '单篇文章或单个页面依然可以通过 front matter 覆盖全局默认值。',
    ],
    codeEn: "[params.comments]\n  enabled = true\n  provider = 'twikoo'\n\n  [params.comments.twikoo]\n    envId = 'https://twikoo.example.com'\n    lang = 'en-US'\n    path = 'theme'",
    codeZh: "[params.comments]\n  enabled = true\n  provider = 'twikoo'\n\n  [params.comments.twikoo]\n    envId = 'https://twikoo.example.com'\n    lang = 'zh-CN'\n    path = 'theme'",
  },
  {
    titleEn: 'Color scheme and widgets',
    titleZh: '配色与右边栏组件',
    bodyEn: [
      'The color scheme toggle and widget groups are both configurable. You can decide which widgets appear on the home page, static pages, and single posts.',
      'Widget title visibility is also separated out, which is useful if you want a lighter sidebar style.',
    ],
    bodyZh: [
      '配色切换和右边栏组件都是可配置的。你可以分别定义首页、静态页面和文章页出现哪些 widget。',
      'widget 标题显隐也被单独抽出来了，如果你想让边栏更轻一些，这一块会比较有用。',
    ],
    codeEn: "[params.colorScheme]\n  toggle = true\n  default = 'auto'\n\n[params.widgets]\n  homepage = [\n    { type = 'search', params = { limit = 0 } },\n    { type = 'archives', params = { limit = 3 } },\n    { type = 'categories', params = { limit = 10 } }\n  ]\n\n  [params.widgets.titleVisibility]\n    archives = false\n    categories = false\n    toc = true",
    codeZh: "[params.colorScheme]\n  toggle = true\n  default = 'auto'\n\n[params.widgets]\n  homepage = [\n    { type = 'search', params = { limit = 0 } },\n    { type = 'archives', params = { limit = 3 } },\n    { type = 'categories', params = { limit = 10 } }\n  ]\n\n  [params.widgets.titleVisibility]\n    archives = false\n    categories = false\n    toc = true",
  },
  {
    titleEn: 'Talks page and outward sync',
    titleZh: '说说页与外部同步',
    bodyEn: [
      'This is the part that connects especially well with PocketHugo quick page updates. Short thoughts can land in the talks page and then continue outward through JSON or RSS/XML feeds.',
      'That makes it easier to publish something quickly on mobile while still keeping a Hugo-native archive on your own site.',
    ],
    bodyZh: [
      '这也是和 PocketHugo 快速页面更新最契合的一块。短想法可以直接落进说说页里，然后继续通过 JSON 或 RSS/XML 输出同步到别的平台。',
      '这样你就可以在手机上很快发出一条想法，同时又把这些内容保留在自己的 Hugo 站点里。',
    ],
    codeEn: "[outputFormats.TalksRSS]\n  mediaType = 'application/rss+xml'\n  baseName = 'talks'\n\n[outputFormats.TalksJSON]\n  mediaType = 'application/feed+json'\n  baseName = 'talks'\n\n# talks page front matter\noutputs = ['HTML', 'TalksJSON', 'TalksRSS']",
    codeZh: "[outputFormats.TalksRSS]\n  mediaType = 'application/rss+xml'\n  baseName = 'talks'\n\n[outputFormats.TalksJSON]\n  mediaType = 'application/feed+json'\n  baseName = 'talks'\n\n# talks 页 front matter\noutputs = ['HTML', 'TalksJSON', 'TalksRSS']",
  },
  {
    titleEn: 'Markup and highlighting',
    titleZh: 'Markdown 渲染与代码高亮',
    bodyEn: [
      'The example config enables unsafe Goldmark rendering, table of contents options, and highlight settings, which helps the theme handle richer Markdown content.',
      'If your site contains code blocks, embedded HTML, or deeper article structure, this part is worth keeping close to the example.',
    ],
    bodyZh: [
      '示例配置里还启用了 Goldmark 的 unsafe 渲染、目录层级和代码高亮设置，这样主题才能更自然地承接丰富一些的 Markdown 内容。',
      '如果你的站点里有代码块、嵌入 HTML 或更复杂的文章结构，这一块最好尽量贴近示例配置。',
    ],
    codeEn: "[markup.goldmark.renderer]\n  unsafe = true\n\n[markup.tableOfContents]\n  startLevel = 2\n  endLevel = 4\n  ordered = true\n\n[markup.highlight]\n  noClasses = false\n  codeFences = true\n  guessSyntax = true",
    codeZh: "[markup.goldmark.renderer]\n  unsafe = true\n\n[markup.tableOfContents]\n  startLevel = 2\n  endLevel = 4\n  ordered = true\n\n[markup.highlight]\n  noClasses = false\n  codeFences = true\n  guessSyntax = true",
  },
]

function slugifyHeading(value: string) {
  return value.toLowerCase().replace(/[`~!@#$%^&*()+=|{}[\]:;"'<>,.?/\\]+/g, '').replace(/\s+/g, '-').replace(/^-+|-+$/g, '')
}

export default function PocketHugoThemeGuide() {
  const { isEnglish } = useLanguage()
  const sections = useMemo(
    () => guideSections.map((section) => ({ title: isEnglish ? section.titleEn : section.titleZh, body: isEnglish ? section.bodyEn : section.bodyZh, code: isEnglish ? section.codeEn : section.codeZh, images: section.images })),
    [isEnglish],
  )
  const tocTitle = isEnglish ? 'On This Page' : '本页目录'

  return (
    <main style={{ padding: 16, maxWidth: 1120, margin: '0 auto', display: 'grid', gap: 16 }}>
      <SiteHeader href="/pocket-hugo-theme" title="PocketHugo Theme" badgeEn="Companion theme for PocketHugo" badgeZh="PocketHugo 的姊妹主题" subtitleEn="A companion theme for PocketHugo and long-term Hugo blogging." subtitleZh="PocketHugo 的姊妹主题，也是一套适合长期 Hugo 博客写作的主题。" icon={<PocketHugoThemeLogo size={32} />} />

      <section style={{ border: '1px solid var(--border)', borderRadius: 20, background: 'var(--card)', boxShadow: 'var(--shadow)', padding: 'clamp(20px, 4vw, 28px)', display: 'grid', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{isEnglish ? 'Theme Guide' : '主题指南'}</div>
            <h1 style={{ margin: 0, fontSize: 'clamp(24px, 5vw, 38px)', lineHeight: 1.1 }}>{isEnglish ? 'How to Install and Use PocketHugo Theme' : 'PocketHugo Theme 安装与使用说明'}</h1>
            <p style={{ margin: 0, color: 'var(--foreground)', lineHeight: 1.8, fontSize: 15, fontWeight: 600 }}>{isEnglish ? 'This guide follows the real exampleSite config and explains how the main hugo.toml options affect the theme.' : '这份指南尽量对照真实 exampleSite 配置来写，并重点解释 hugo.toml 里那些最常用、最影响主题效果的设置。'}</p>
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
                    return <a key={section.title} href={`#${sectionId}`} style={{ color: 'var(--foreground)', fontSize: 14, lineHeight: 1.5, textDecoration: 'none' }}>{section.title}</a>
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
                    {section.body.map((paragraph) => <p key={paragraph} style={{ margin: 0, color: 'var(--foreground)', lineHeight: 1.9, fontSize: 15 }}>{paragraph}</p>)}
                  </div>
                  {section.code ? <pre style={{ margin: 0, padding: 16, borderRadius: 16, border: '1px solid var(--border)', background: 'var(--card-muted)', overflowX: 'auto', lineHeight: 1.7, fontSize: 14, whiteSpace: 'pre' }}><code>{section.code}</code></pre> : null}
                  {section.images?.length ? <div style={{ display: 'grid', gap: 12, marginTop: 4 }}>{section.images.map((imagePath) => <img key={imagePath} src={imagePath} alt={imagePath.split('/').pop() ?? 'theme preview'} style={{ width: '100%', display: 'block', borderRadius: 16, border: '1px solid var(--border)', background: 'var(--card-muted)', boxShadow: 'var(--shadow)' }} />)}</div> : null}
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section style={{ border: '1px solid var(--border)', borderRadius: 20, background: 'var(--card)', boxShadow: 'var(--shadow)', padding: 'clamp(20px, 4vw, 28px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>{isEnglish ? 'Ready to try it on your own site?' : '准备把它挂到你自己的站点里？'}</h2>
          <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.8 }}>{isEnglish ? 'Open the live demo, then copy the example configuration into your own Hugo project and adjust it step by step.' : '可以先看看在线演示，再把这些示例配置逐步抄到你自己的 Hugo 项目里继续调整。'}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href={themeDemoUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--accent)', background: 'var(--accent)', color: 'var(--accent-contrast)', fontWeight: 700 }}>{isEnglish ? 'Open Theme Demo' : '打开主题演示'}</a>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card-muted)', fontWeight: 700 }}>{isEnglish ? 'Back to PocketHugo' : '返回 PocketHugo'}</Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
