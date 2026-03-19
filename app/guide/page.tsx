'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import LanguageToggle from '@/components/language/LanguageToggle'
import { SiteFooter, SiteHeader } from '@/components/layout/SiteChrome'
import ThemeToggle from '@/components/theme/ThemeToggle'
import { useLanguage } from '@/lib/use-language'

type GuideSection = {
  title: string
  body: string[]
  images?: string[]
  kind?: 'default' | 'structure-examples'
}

const multilingualGuideSectionEn: GuideSection = {
  title: 'Create Multilingual Versions',
  body: [
    'In Multilingual Bundle mode, the preview panel also includes a multilingual Markdown area.',
    'You can review the raw Markdown, copy it with one click, send it to another AI tool for translation, then paste the translated result back into a new file such as `index.en.md` or `index.de.md`.',
    'PocketHugo also shows which Markdown files already exist in the current folder and blocks duplicate file names, helping avoid publishing conflicts when you add more language versions.',
  ],
  images: ['create-multi-versions.webp'],
}

const localRepoGuideSectionEn: GuideSection = {
  title: 'Local Repository Mode',
  body: [
    'PocketHugo also provides a local-only repository mode for desktop testing or personal local workflows.',
    'When `LOCAL_REPO_MODE=true`, the app reads and writes directly to the local repository defined by `LOCAL_REPO_ROOT`, without using GitHub sign-in or GitHub APIs.',
    'This is an additional local workflow only. Running PocketHugo locally does not disable the normal GitHub workflow. If local mode is off, the original GitHub sign-in and publishing flow still works in local development.',
  ],
}

const localRepoGuideSectionZh: GuideSection = {
  title: '本地仓库模式',
  body: [
    'PocketHugo 也提供一个仅用于本机的本地仓库模式，适合桌面端测试或个人本地写作流程。',
    '当 `LOCAL_REPO_MODE=true` 时，应用会直接读写 `LOCAL_REPO_ROOT` 指向的本地仓库，不再使用 GitHub 登录，也不会调用 GitHub API。',
    '这只是额外提供的一种本地工作流，并不是对原有 GitHub 方案的替代。即使你在本地运行 PocketHugo，只要关闭本地模式，仍然可以继续使用原来的 GitHub 登录和发布流程。',
  ],
}

const multilingualGuideSectionZh: GuideSection = {
  title: '创建多语言版本',
  body: [
    '在 Multilingual Bundle 模式下，预览页下方会出现多语言 Markdown 区域。',
    '你可以先查看原始 Markdown，一键复制后粘贴到其他 AI 工具里翻译，再把结果粘贴回新的文件，比如 `index.en.md` 或 `index.de.md`。',
    'PocketHugo 还会提示当前目录里已经存在的 Markdown 文件，并阻止重复文件名，减少新增多语言版本时的发布冲突。',
  ],
  images: ['create-multi-versions.webp'],
}

const structureExampleEn = `content/
└── posts/
    ├── article.md                # 1. Flat Markdown
    ├── my-post/                  # 2. Multilingual Bundle
    │   ├── index.md
    │   ├── index.en.md
    │   └── cover.jpg
    └── my-post-single/           # 3. Single-language Bundle
        ├── index.md
        └── cover.jpg`

const structureExampleZh = `content/
└── posts/
    ├── article.md                # 1. 单文件
    ├── my-post/                  # 2. 多语言 Bundle
    │   ├── index.md
    │   ├── index.en.md
    │   └── cover.jpg
    └── my-post-single/           # 3. 单语言 Bundle
        ├── index.md
        └── cover.jpg`

const structureTableEn = [
  ['Feature', 'Flat Markdown', 'Single-language Bundle', 'Multilingual Bundle'],
  ['Images', 'No', 'Yes', 'Yes'],
  ['Multilingual', 'No', 'No', 'Yes'],
  ['Typical use case', 'quick text-first notes', 'richer posts with local assets', 'localized content'],
]

const structureTableZh = [
  ['项目', '单文件', '单语言 Bundle', '多语言 Bundle'],
  ['配图', '❌', '✅', '✅'],
  ['多语言', '❌', '❌', '✅'],
  ['典型场景', '随手写的短文', '图文并茂的文章', '国际化内容'],
]

const guideSections: { en: GuideSection[]; zh: GuideSection[] } = {
  en: [
    {
      title: 'What PocketHugo Is',
      body: [
        'PocketHugo is a browser-first publishing tool built around Hugo workflows and GitHub-hosted Markdown content.',
        'Pocket publishing for Hugo across desktop, tablet, and phone.',
        'It is strongest on desktop browsers, but still usable on tablet and phone when you need to continue writing or publishing away from your main machine.',
      ],
    },
    {
      title: 'Where to Start',
      body: [
        'Open the landing page at `https://leftn.com`, then enter the app from `https://leftn.com/app`.',
        'That `leftn.com` entry is also the recommended public domain because it is bound to the Workers deployment and uses stricter SSL handling.',
        'After signing in with GitHub, configure your repository, posts path, page editor path, and publishing preferences on the home screen.',
      ],
      images: ['where-to-start.webp'],
    },
    {
      title: 'Local Repository Mode',
      body: [
        'PocketHugo also provides a local-only repository mode for desktop testing or personal local workflows.',
        'When `LOCAL_REPO_MODE=true`, the app reads and writes directly to the local repository defined by `LOCAL_REPO_ROOT`, without using GitHub sign-in or GitHub APIs.',
        'This is an additional local workflow only. Running PocketHugo locally does not disable the normal GitHub workflow. If local mode is off, the original GitHub sign-in and publishing flow still works in local development.',
      ],
    },
    {
      title: 'Post Structure Mode',
      body: [
        'PocketHugo currently supports three content layouts.',
        '1. Bundle / Single index: one folder per post, with `index.md` and images in the same folder.',
        '2. Bundle / Multilingual: one folder per post, with `index.md`, `index.en.md`, `index.de.md`, and shared assets in the same folder.',
        '3. Flat Markdown: standalone `.md` files directly under the posts path.',
        'This is now the most important publishing preference because it affects how new posts are created, how published posts are listed, and how content is published back to GitHub.',
      ],
      images: ['post-structure .webp'],
    },
    {
      title: 'Structure Examples',
      body: [
        'Here is a quick visual summary of the three supported structures.',
      ],
      kind: 'structure-examples',
    },
    {
      title: 'Repository Setup',
      body: [
        'The repository section tells PocketHugo which GitHub repository, branch, and posts path should be used.',
        'Once this is saved, the post editor, published-post loader, and publishing flow all use this repository configuration by default.',
      ],
      images: ['repo-setting.webp'],
    },
    {
      title: 'Page Editor Setup',
      body: [
        'The page section is for standalone pages and Quick Timeline.',
        'You choose a page file and mode here, then PocketHugo can load that page, keep a local draft, publish updates, or turn timeline content into a post draft.',
      ],
      images: ['page-setting.webp'],
    },
    {
      title: 'Publishing Preferences',
      body: [
        'Publishing preferences control post structure mode, image conversion, image naming, timezone handling, category presets, and frontmatter field mapping.',
        'Image conversion now uses a higher-efficiency WebP pipeline with WASM-backed encoding where supported, and browser-safe fallbacks when not.',
        'If you want PocketHugo to match your existing Hugo project conventions, this is one of the most important sections to configure carefully.',
      ],
      images: ['preferences-setting.webp'],
    },
    {
      title: 'Writing Posts',
      body: [
        'The post editor is divided into Basic Info, Images, Body, and Frontmatter sections.',
        'In bundle modes, image upload and asset management are enabled. In Flat Markdown mode, the image section is intentionally hidden because PocketHugo does not manage separated asset folders for you.',
      ],
      images: ['writing-posts.webp'],
    },
    {
      title: '创建多语言版本',
      body: [
        '在 Multilingual Bundle 模式下，预览页下方会出现多语言 Markdown 区域。',
        '你可以先查看原始 Markdown，一键复制后粘贴到其他 AI 工具里翻译，再把结果粘贴回新的文件，比如 `index.en.md` 或 `index.de.md`。',
        'PocketHugo 还会提示当前目录里已经存在的 Markdown 文件，并阻止重复文件名，减少新增多语言版本时的发布冲突。',
      ],
      images: ['create-multi-versions.webp'],
    },
    {
      title: 'Create Multilingual Versions',
      body: [
        'In Multilingual Bundle mode, the preview panel also includes a multilingual Markdown area.',
        'You can review the raw Markdown, copy it with one click, send it to another AI tool for translation, then paste the translated result back into a new file such as `index.en.md` or `index.de.md`.',
        'PocketHugo also shows which Markdown files already exist in the current folder and blocks duplicate file names, helping avoid publishing conflicts when you add more language versions.',
      ],
      images: ['create-multi-versions.webp'],
    },
    {
      title: 'Image Workflow',
      body: [
        'PocketHugo supports image upload, compression, conversion, auto naming, preview, copy filename, insert Markdown, cover selection, and deletion.',
        'The current upload pipeline prioritizes higher-efficiency WebP compression in the browser, helping reduce oversized screenshot uploads from phones and tablets.',
        'Batch upload supports up to 9 images. They are processed one by one to reduce peak memory pressure on iPhone and other mobile browsers, then inserted into the editor in one Markdown block.',
        'This image workflow is designed for bundle-style content where Markdown and assets stay together.',
      ],
      images: ['images-flow.webp'],
    },
    {
      title: 'Publishing to GitHub',
      body: [
        'When you publish a post, PocketHugo commits the current Markdown file and, when applicable, the assets in the same post folder back to GitHub.',
        'The result page shows repository, branch, path, file count, and the list of changed files.',
      ],
      images: ['published-uccessfully.webp'],
    },
    {
      title: 'Page Editor and Quick Timeline',
      body: [
        'PocketHugo is not limited to posts. It also supports page editing, Quick Timeline, quick status publishing, and turning a page into a post draft.',
      ],
      images: ['page-editor.webp', 'quick-timeline.webp', 'transfer-to-draft.webp'],
    },
    {
      title: 'Other SSGs',
      body: [
        'PocketHugo is designed for Hugo first, but it can also work for some Astro, Hexo, or other static site projects if they follow one of the three supported structures and use regular frontmatter-based Markdown files.',
        'It is not a good fit for workflows that keep text and images in separate places, depend on a global media library, or require automatic management of a dedicated image archive outside the post location.',
      ],
    },
    {
      title: 'Important Limitation',
      body: [
        'PocketHugo does not support separated text-and-media image management.',
        'If your project stores Markdown files in one place but keeps images in another global folder such as `/images/2026/...`, PocketHugo will not manage that image workflow for you.',
      ],
    },
  ],
  zh: [
    {
      title: 'PocketHugo 是什么',
      body: [
        'PocketHugo 是一个围绕 Hugo 工作流设计的浏览器优先发布工具，适合管理托管在 GitHub 上的 Markdown 内容。',
        'Pocket publishing for Hugo across desktop, tablet, and phone.',
        '它在桌面浏览器上的体验最好，但在需要时，也可以在平板和手机上继续接力写作和发布。',
      ],
    },
    {
      title: '从哪里开始',
      body: [
        '先访问 `https://leftn.com`，再从 `https://leftn.com/app` 进入应用。',
        '登录 GitHub 后，在首页完成仓库、文章目录、页面编辑路径和发布偏好配置，就可以开始使用。',
      ],
      images: ['where-to-start.webp'],
    },
    {
      title: '文章结构模式',
      body: [
        'PocketHugo 目前支持 3 种内容结构。',
        '1. Bundle / Single index：每篇文章一个目录，目录里是 `index.md` 和同目录图片。',
        '2. Bundle / Multilingual：每篇文章一个目录，目录里可包含 `index.md`、`index.en.md`、`index.de.md` 以及共享资源。',
        '3. Flat Markdown：文章直接作为 `.md` 文件放在 posts 路径下。',
        '这是现在最重要的发布偏好之一，因为它会影响新建文章、已发布文章列表，以及最终发布回 GitHub 的方式。',
      ],
      images: ['post-structure .webp'],
    },
    {
      title: '结构示例',
      body: ['下面这张示意和对比表，可以更直观看出这 3 种结构的区别。'],
      kind: 'structure-examples',
    },
    {
      title: '仓库配置',
      body: [
        '仓库配置决定了 PocketHugo 应该把内容发布到哪个 GitHub 仓库、分支和文章路径。',
        '保存之后，文章编辑、已发布文章读取和发布流程都会默认使用这套仓库配置。',
      ],
      images: ['repo-setting.webp'],
    },
    {
      title: '页面编辑配置',
      body: [
        '页面配置用于 Standalone Page 和 Quick Timeline。',
        '你可以在这里指定页面文件和模式，之后 PocketHugo 就能载入页面、保存本地草稿、发布页面更新，或者把时间线内容一键转成文章草稿。',
      ],
      images: ['page-setting.webp'],
    },
    {
      title: '发布偏好',
      body: [
        '发布偏好会控制文章结构模式、图片转换、图片命名、时区、分类预设和 frontmatter 字段映射等行为。',
        '图片转换现在会优先使用更高效的 WebP 压缩链路，在支持时走 WASM 编码，不支持时再回退到浏览器安全方案。',
        '如果你希望 PocketHugo 尽量贴合你现有的 Hugo 项目习惯，这里是最值得认真配置的区域。',
      ],
      images: ['preferences-setting.webp'],
    },
    {
      title: '文章写作',
      body: [
        '文章编辑器主要分成 Basic Info、Images、Body 和 Frontmatter 几个区域。',
        '在 bundle 模式下，图片上传和资源管理会启用；在 Flat Markdown 模式下，图片区域会被直接隐藏，因为 PocketHugo 不负责图文分离式的资源目录管理。',
      ],
      images: ['writing-posts.webp'],
    },
    {
      title: '图片工作流',
      body: [
        'PocketHugo 支持图片上传、压缩、转换、自动命名、预览、复制文件名、插入 Markdown、设为封面和删除。',
        '当前上传链路会优先使用更高效的 WebP 压缩方案，尤其适合降低手机截图这类大图的体积。',
        '现在支持一次最多批量上传 9 张图片。图片会逐张处理，以降低 iPhone 等移动端浏览器的峰值内存压力，然后在最后一次性插入 Markdown。',
        '这套图片工作流主要面向 Markdown 和资源文件放在一起的 bundle 结构。',
      ],
      images: ['images-flow.webp'],
    },
    {
      title: '发布到 GitHub',
      body: [
        '发布文章时，PocketHugo 会把当前 Markdown 文件以及适用时的同目录资源一起提交回 GitHub。',
        '发布结果页会显示仓库、分支、路径、文件数和本次改动文件列表。',
      ],
      images: ['published-uccessfully.webp'],
    },
    {
      title: '页面编辑与 Quick Timeline',
      body: [
        'PocketHugo 不只支持文章，也支持页面编辑、Quick Timeline、快速发布说说，以及页面一键转文章草稿。',
      ],
      images: ['page-editor.webp', 'quick-timeline.webp', 'transfer-to-draft.webp'],
    },
    {
      title: '其他静态站点生成器',
      body: [
        'PocketHugo 主要为 Hugo 设计，但如果 Astro、Hexo 或其他静态站点项目也符合这 3 种结构之一，并且使用常见的 frontmatter + Markdown 文件，同样可能适用。',
        '如果你的站点依赖全局媒体库、图文分离目录，或者必须自动管理文章目录之外的图片归档，那就不适合用 PocketHugo。',
      ],
    },
    {
      title: '重要限制',
      body: [
        'PocketHugo 不支持图文分离模式的图片管理。',
        '如果你的 Markdown 文件和图片分别放在不同路径，比如文章在一个目录、图片统一放在 `/images/2026/...` 这类目录中，PocketHugo 不会替你管理这套图片工作流。',
      ],
    },
  ],
}

function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .replace(/[`~!@#$%^&*()+=|{}[\]:;"'<>,.?/\\]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function GuidePage() {
  const { isEnglish } = useLanguage()
  const sections = useMemo(() => {
    const insertAfterTitle = (
      items: GuideSection[],
      extraSection: GuideSection,
      anchorTitle: string,
    ) => {
      const baseSections = items.filter((section) => section.title !== extraSection.title)
      const anchorIndex = baseSections.findIndex(
        (section) => section.title === anchorTitle,
      )

      if (anchorIndex < 0) {
        return [...baseSections, extraSection]
      }

      return [
        ...baseSections.slice(0, anchorIndex + 1),
        extraSection,
        ...baseSections.slice(anchorIndex + 1),
      ]
    }

    if (isEnglish) {
      return insertAfterTitle(
        insertAfterTitle(
          guideSections.en.filter(
            (section) => section.title !== multilingualGuideSectionZh.title,
          ),
          localRepoGuideSectionEn,
          'Where to Start',
        ),
        multilingualGuideSectionEn,
        'Writing Posts',
      )
    }

    return insertAfterTitle(
      insertAfterTitle(
        guideSections.zh,
        localRepoGuideSectionZh,
        '浠庡摢閲屽紑濮?',
      )
      ,
      multilingualGuideSectionZh,
      '鏂囩珷鍐欎綔',
    )
  }, [isEnglish])
  const tocTitle = isEnglish ? 'On This Page' : '本页目录'

  return (
    <main
      style={{
        padding: 16,
        maxWidth: 1120,
        margin: '0 auto',
        display: 'grid',
        gap: 16,
      }}
    >
      <SiteHeader />

      <section
        style={{
          border: '1px solid var(--border)',
          borderRadius: 20,
          background: 'var(--card)',
          boxShadow: 'var(--shadow)',
          padding: 'clamp(20px, 4vw, 28px)',
          display: 'grid',
          gap: 14,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'grid', gap: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
              {isEnglish ? 'Guide' : '使用指南'}
            </div>
            <h1 style={{ margin: 0, fontSize: 'clamp(24px, 5vw, 38px)', lineHeight: 1.1 }}>
              {isEnglish ? 'How to Use PocketHugo' : 'PocketHugo 使用说明'}
            </h1>
            <p style={{ margin: 0, color: 'var(--foreground)', lineHeight: 1.8, fontSize: 15, fontWeight: 600 }}>
              Pocket publishing for Hugo across desktop, tablet, and phone.
            </p>
            <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.8, fontSize: 14 }}>
              {isEnglish
                ? 'Version 1.0.4 - Multilingual drafting helpers and local repository mode'
                : '版本 1.0.4 - 多语言草稿辅助与本地仓库模式'}
            </p>
            <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.8, fontSize: 13 }}>
              {isEnglish
                ? 'Project author: Lawtee - https://lawtee.com'
                : '项目作者：Lawtee - https://lawtee.com'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <LanguageToggle />
            <ThemeToggle />
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 14px',
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'var(--card-muted)',
                fontWeight: 700,
              }}
            >
              {isEnglish ? 'Back to Home' : '返回首页'}
            </Link>
          </div>
        </div>
      </section>

      <section
        style={{
          border: '1px solid var(--border)',
          borderRadius: 20,
          background: 'var(--card)',
          boxShadow: 'var(--shadow)',
          padding: 'clamp(20px, 4vw, 28px)',
          display: 'grid',
          gap: 22,
        }}
      >
        <div className="guide-layout">
          <aside className="guide-toc" style={{ display: 'grid', gap: 12 }}>
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: 16,
                background: 'var(--card-muted)',
                padding: 14,
                display: 'grid',
                gap: 10,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{tocTitle}</div>
              <nav aria-label={tocTitle}>
                <div style={{ display: 'grid', gap: 8 }}>
                  {sections.map((section) => {
                    const sectionId = slugifyHeading(section.title)

                    return (
                      <a
                        key={section.title}
                        href={`#${sectionId}`}
                        style={{
                          color: 'var(--foreground)',
                          fontSize: 14,
                          lineHeight: 1.5,
                          textDecoration: 'none',
                        }}
                      >
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
                <article
                  id={sectionId}
                  key={section.title}
                  style={{
                    display: 'grid',
                    gap: 10,
                    paddingTop: index === 0 ? 0 : 18,
                    marginTop: index === 0 ? 0 : 18,
                    borderTop: index === 0 ? 'none' : '1px solid var(--border)',
                    scrollMarginTop: 24,
                  }}
                >
                  <h2 style={{ margin: 0, fontSize: 20, lineHeight: 1.25 }}>{section.title}</h2>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {section.body.map((paragraph) => (
                      <p
                        key={paragraph}
                        style={{
                          margin: 0,
                          color: 'var(--foreground)',
                          lineHeight: 1.85,
                          fontSize: 15,
                        }}
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  {section.kind === 'structure-examples' ? (
                    <div style={{ display: 'grid', gap: 14 }}>
                      <pre
                        style={{
                          margin: 0,
                          padding: 16,
                          borderRadius: 16,
                          border: '1px solid var(--border)',
                          background: 'var(--card-muted)',
                          overflowX: 'auto',
                          lineHeight: 1.7,
                          fontSize: 14,
                          whiteSpace: 'pre',
                        }}
                      >
                        <code>{isEnglish ? structureExampleEn : structureExampleZh}</code>
                      </pre>
                      <div
                        style={{
                          overflowX: 'auto',
                          borderRadius: 16,
                          border: '1px solid var(--border)',
                          background: 'var(--card-muted)',
                        }}
                      >
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
                          <tbody>
                            {(isEnglish ? structureTableEn : structureTableZh).map((row, rowIndex) => (
                              <tr key={row[0]}>
                                {row.map((cell, cellIndex) => {
                                  const isHeader = rowIndex === 0
                                  const Tag = isHeader ? 'th' : 'td'

                                  return (
                                    <Tag
                                      key={`${row[0]}-${cellIndex}`}
                                      style={{
                                        padding: '12px 14px',
                                        borderBottom:
                                          rowIndex === (isEnglish ? structureTableEn : structureTableZh).length - 1
                                            ? 'none'
                                            : '1px solid var(--border)',
                                        textAlign: cellIndex === 0 ? 'left' : 'center',
                                        fontSize: 14,
                                        lineHeight: 1.6,
                                        fontWeight: isHeader ? 700 : 500,
                                        color: isHeader ? 'var(--foreground)' : 'var(--muted)',
                                        background:
                                          isHeader && cellIndex === 0 ? 'color-mix(in srgb, var(--card) 70%, transparent)' : 'transparent',
                                      }}
                                    >
                                      {cell}
                                    </Tag>
                                  )
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}
                  {section.images?.length ? (
                    <div style={{ display: 'grid', gap: 12, marginTop: 4 }}>
                      {section.images.map((imageName) => (
                        <img
                          key={imageName}
                          src={`/guide/${imageName}`}
                          alt={imageName.replace(/\.[^.]+$/i, '').replace(/-/g, ' ')}
                          style={{
                            width: '100%',
                            display: 'block',
                            borderRadius: 16,
                            border: '1px solid var(--border)',
                            background: 'var(--card-muted)',
                            boxShadow: 'var(--shadow)',
                          }}
                        />
                      ))}
                    </div>
                  ) : null}
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section
        style={{
          border: '1px solid var(--border)',
          borderRadius: 20,
          background: 'var(--card)',
          boxShadow: 'var(--shadow)',
          padding: 'clamp(20px, 4vw, 28px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'grid', gap: 6 }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>
            {isEnglish ? 'Ready to try it?' : '准备开始试用？'}
          </h2>
          <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.8 }}>
            {isEnglish
              ? 'Open the app and test the full workflow with your own GitHub repository.'
              : '打开应用，用你自己的 GitHub 仓库测试完整工作流。'}
          </p>
        </div>
        <Link
          href="/app"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 16px',
            borderRadius: 12,
            border: '1px solid var(--accent)',
            background: 'var(--accent)',
            color: 'var(--accent-contrast)',
            fontWeight: 700,
          }}
        >
          {isEnglish ? 'Open PocketHugo' : '打开 PocketHugo'}
        </Link>
      </section>

      <SiteFooter />
    </main>
  )
}
