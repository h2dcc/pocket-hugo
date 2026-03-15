'use client'

import Link from 'next/link'
import LanguageToggle from '@/components/language/LanguageToggle'
import { SiteFooter, SiteHeader } from '@/components/layout/SiteChrome'
import { useLanguage } from '@/lib/use-language'

const guideSections = {
  en: [
    {
      title: 'What PocketHugo Is',
      body: [
        'PocketHugo is a browser-first publishing tool for Hugo users who keep content in GitHub repositories.',
        'It is designed to preserve Hugo-native structure while reducing the friction of writing, image handling, and publishing from desktop, tablet, or phone.',
      ],
    },
    {
      title: 'Where to Start',
      body: [
        'Open the landing page at `https://leftn.com` and enter the app from `https://leftn.com/app`.',
        'After signing in with GitHub, configure your repository, branch, and content path on the home screen. Once that is done, you can start writing and publishing immediately.',
      ],
    },
    {
      title: 'Home Screen Overview',
      body: [
        'The home screen is the control center for PocketHugo.',
        'From there you can connect a GitHub repo, configure page editing, manage publishing preferences, reopen local drafts, and load already published posts back from GitHub for further editing.',
      ],
    },
    {
      title: 'Home Setup: Repository',
      body: [
        'The repository section tells PocketHugo where your Hugo posts live in GitHub.',
        'You choose the target repository, branch, and posts path here. In most cases, the posts path should point to the folder where your article bundles are stored, such as `content/posts` or a similar directory in your Hugo project.',
        'Once saved, this configuration becomes the default target for post creation, loading published posts, and publishing edited drafts back to GitHub.',
      ],
    },
    {
      title: 'Home Setup: Page Editor',
      body: [
        'The page section is used when you want to edit a standalone page or use Quick Timeline.',
        'You choose the page file path and the mode here. Standalone Page is suitable for a normal Hugo page, while Quick Timeline is better for short updates, logs, or status-style content.',
        'After the page path is configured, the Page Editor can load that file, save local page drafts, publish page updates, and support converting a timeline page into a post draft.',
      ],
    },
    {
      title: 'Home Setup: Publishing Preferences',
      body: [
        'The preferences section controls how writing and publishing behave across the app.',
        'This includes image conversion, image max width, image quality, auto image naming, timezone handling, frontmatter field mapping, cover field key, category presets, and other writing preferences.',
        'If you want PocketHugo to better match your existing Hugo project conventions, this is one of the most important places to configure carefully.',
      ],
    },
    {
      title: 'Writing Posts',
      body: [
        'The post editor is divided into Basic Info, Images, Body, and Frontmatter sections.',
        'You can edit title, date, slug, draft status, categories, tags, cover image, and custom fields while keeping the final output compatible with your Hugo frontmatter structure.',
      ],
    },
    {
      title: 'Image Workflow',
      body: [
        'PocketHugo supports image upload, compression, conversion, auto naming, preview, copy filename, insert Markdown, cover selection, and deletion.',
        'Batch upload supports up to 9 images at a time. Images are processed one by one to reduce peak memory pressure on iPhone and other mobile browsers, then inserted into the editor in one Markdown block at the end.',
        'The goal is not only convenience, but also lower repository storage usage and lower site build overhead.',
      ],
    },
    {
      title: 'Body Editing and Markdown Helpers',
      body: [
        'The body editor supports autosave, manual save, preview mode, and slash commands triggered with `/`.',
        'Slash commands help you insert common Markdown patterns quickly, especially when writing on touch devices.',
      ],
    },
    {
      title: 'Frontmatter Editing',
      body: [
        'PocketHugo lets you edit frontmatter through structured fields and also through a dedicated frontmatter area.',
        'You only edit the field content itself, without manually maintaining the wrapping `---` or `+++` lines.',
      ],
    },
    {
      title: 'Publishing to GitHub',
      body: [
        'When you publish a post, PocketHugo commits `index.md` together with the article assets back to GitHub.',
        'The publish result page shows the target repository, branch, path, commit count, and the list of files written during that publish.',
      ],
    },
    {
      title: 'Re-editing Published Posts',
      body: [
        'PocketHugo can load already published posts back from GitHub so you can continue editing and republishing them from the browser.',
        'This makes it useful not only for creating new content, but also for maintaining an existing Hugo site.',
      ],
    },
    {
      title: 'Local Drafts and Browser Storage',
      body: [
        'PocketHugo is local-first. Drafts and preferences are stored in the browser, and the app avoids maintaining a separate content database on the server.',
        'The storage logic has also been optimized to reduce browser storage pressure from large local image drafts.',
      ],
    },
    {
      title: 'Page Editor and Quick Timeline',
      body: [
        'PocketHugo is not limited to posts. It also includes a page editor with two modes: Standalone Page and Quick Timeline.',
        'Standalone Page is useful for regular pages such as About or Notes. Quick Timeline is useful for short status-style updates or daily records.',
      ],
    },
    {
      title: 'Quick Status Publishing',
      body: [
        'Quick Timeline works well as a fast publishing flow for short updates.',
        'You do not need to open a full article workflow every time if you just want to record and publish small pieces of content.',
      ],
    },
    {
      title: 'Turn Pages Into Posts',
      body: [
        'A timeline page can be turned into a post draft with one click.',
        'This is useful when a short note grows into something that deserves a full article with richer metadata and structure.',
      ],
    },
    {
      title: 'Language, Theme, and Device Flexibility',
      body: [
        'PocketHugo supports Chinese and English, plus light and dark theme switching.',
        'The experience is strongest on desktop browsers, but the workflow is still usable on tablets and phones when needed.',
      ],
    },
    {
      title: 'Summary',
      body: [
        'PocketHugo is best thought of as a browser publishing layer for Hugo, not as a CMS that replaces your content structure.',
        'It keeps the GitHub-based Hugo workflow intact while making writing, image handling, page editing, and publishing much easier to manage from the browser.',
      ],
    },
  ],
  zh: [
    {
      title: 'PocketHugo 是什么',
      body: [
        'PocketHugo 是一个浏览器优先的 Hugo 发布工具，适合把内容托管在 GitHub 仓库中的用户。',
        '它的目标是在尽量保留 Hugo 原生结构的前提下，减少写作、配图、发布时的操作负担，并兼顾电脑、平板和手机使用。',
      ],
    },
    {
      title: '从哪里开始',
      body: [
        '你可以先访问项目首页 `https://leftn.com`，应用入口是 `https://leftn.com/app`。',
        '登录 GitHub 后，在首页完成仓库、分支和内容目录配置，就可以直接开始写作和发布。',
      ],
    },
    {
      title: '首页能做什么',
      body: [
        '首页是 PocketHugo 的控制台。',
        '你可以在这里配置 GitHub 仓库、页面编辑路径、发布偏好，继续打开本地草稿，或从 GitHub 载入已经发布的文章继续编辑。',
      ],
    },
    {
      title: '首页配置：仓库',
      body: [
        '仓库配置决定了 PocketHugo 应该把文章发布到 GitHub 的什么位置。',
        '这里需要选择目标仓库、分支，以及文章目录路径。通常文章目录应当指向 Hugo 站点里存放文章 page bundle 的位置，例如 `content/posts` 之类的目录。',
        '保存之后，新建文章、读取已发布文章、以及把草稿重新发布回 GitHub，都会默认使用这套仓库配置。',
      ],
    },
    {
      title: '首页配置：页面编辑',
      body: [
        '页面配置用于独立页面和 Quick Timeline 的编辑工作流。',
        '这里需要指定页面文件路径和模式。Standalone Page 适合 About、Notes 这类固定页面，Quick Timeline 更适合短更新、记录或“说说”类内容。',
        '页面路径配置完成后，页面编辑器才能正确加载该文件、本地保存页面草稿、发布页面更新，以及支持一键转文章。',
      ],
    },
    {
      title: '首页配置：发布偏好',
      body: [
        '发布偏好会影响整个应用中的写作和发布行为。',
        '这里包括图片是否转换、图片最大宽度、图片质量、是否自动命名、时区设置、Frontmatter 字段映射、封面字段名、分类预设等。',
        '如果你希望 PocketHugo 更贴合你现有的 Hugo 项目结构和写作习惯，这一部分是最值得认真配置的地方。',
      ],
    },
    {
      title: '文章写作流程',
      body: [
        '文章编辑器主要分为 Basic Info、Images、Body 和 Frontmatter 四个区域。',
        '你可以编辑标题、日期、slug、draft 状态、分类、标签、封面图和自定义字段，同时保持最终输出仍然适配 Hugo 的 frontmatter 结构。',
      ],
    },
    {
      title: '图片工作流',
      body: [
        'PocketHugo 支持图片上传、压缩、转换、自动命名、预览、复制文件名、插入 Markdown、设置封面和删除。',
        '现在支持一次最多批量上传 9 张图片。为了降低 iPhone 等移动端浏览器的峰值内存压力，图片会逐张处理，但会在最后一次性插入图片 Markdown。',
        '这套设计的重点不仅是方便上传，更是为了减少仓库存储占用和网站构建负担。',
      ],
    },
    {
      title: '正文编辑与 Markdown 辅助',
      body: [
        '正文编辑区支持自动保存、手动保存、预览模式，以及输入 `/` 触发的 Slash 命令。',
        'Slash 命令可以帮助你快速插入常见 Markdown 结构，尤其适合在触屏设备上编辑。',
      ],
    },
    {
      title: 'Frontmatter 编辑',
      body: [
        '除了结构化字段填写，PocketHugo 也提供了单独的 Frontmatter 编辑区域。',
        '你只需要编辑字段内容本身，不需要手动维护外围的 `---` 或 `+++`。',
      ],
    },
    {
      title: '发布到 GitHub',
      body: [
        '发布文章时，PocketHugo 会把 `index.md` 和当前文章目录中的图片等资源一起提交回 GitHub。',
        '发布成功页会展示目标仓库、分支、路径、提交次数，以及本次写入的文件列表。',
      ],
    },
    {
      title: '重新编辑已发布文章',
      body: [
        'PocketHugo 可以从 GitHub 拉回已经发布过的文章，再次进入编辑器继续修改。',
        '这意味着它不仅适合写新文章，也很适合维护一个长期更新中的 Hugo 站点。',
      ],
    },
    {
      title: '本地草稿与浏览器存储',
      body: [
        'PocketHugo 是本地优先的。草稿和偏好更多保存在浏览器里，服务端不会维护一套单独的内容数据库。',
        '同时，项目也对大图草稿带来的浏览器存储压力做了优化，尽量让恢复草稿的过程更稳定。',
      ],
    },
    {
      title: '页面编辑器与 Quick Timeline',
      body: [
        'PocketHugo 不只支持文章，也支持页面编辑器，两种模式分别是 Standalone Page 和 Quick Timeline。',
        'Standalone Page 适合 About、Notes 这类独立页面，Quick Timeline 则适合短内容、说说或日常记录。',
      ],
    },
    {
      title: '快速发布说说',
      body: [
        'Quick Timeline 很适合拿来快速发布简短动态。',
        '如果你只是想记录和发布一些较短内容，就不必每次都进入完整文章流程。',
      ],
    },
    {
      title: '页面一键转文章',
      body: [
        '时间线页面可以一键转成文章草稿。',
        '当一条简短记录值得继续扩写时，就可以直接切到文章工作流中完善它。',
      ],
    },
    {
      title: '语言、主题与多设备使用',
      body: [
        'PocketHugo 支持中英切换，也支持浅色和深色模式切换。',
        '它在桌面浏览器上的体验最强，但平板和手机在需要时也可以顺畅接力使用。',
      ],
    },
    {
      title: '总结',
      body: [
        'PocketHugo 更适合被理解为 Hugo 的浏览器发布层，而不是一个替代内容结构的 CMS。',
        '它保留了 GitHub + Hugo 的原生工作流，同时把写作、配图、页面编辑和发布整合得更轻、更顺手。',
      ],
    },
  ],
} as const

const guideSectionImages: Array<string[]> = [
  [],
  ['where-to-start.webp'],
  [],
  ['repo-setting.webp'],
  ['page-setting.webp'],
  ['preferences-setting.webp'],
  ['writing-posts.webp'],
  ['images-flow.webp'],
  [],
  [],
  ['published-uccessfully.webp'],
  [],
  [],
  ['page-editor.webp'],
  ['quick-timeline.webp'],
  ['transfer-to-draft.webp'],
  [],
  [],
]

function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .replace(/[`~!@#$%^&*()+=|{}[\]:;"'<>,.?/\\]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function GuidePage() {
  const { isEnglish } = useLanguage()
  const sections = isEnglish ? guideSections.en : guideSections.zh
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
              {isEnglish
                ? 'How to Use PocketHugo'
                : 'PocketHugo 完整使用说明'}
            </h1>
            <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.8, fontSize: 14 }}>
              {isEnglish
                ? 'Version 1.0.1 - Written on March 15, 2026'
                : '\u7248\u672c 1.0.1 \u00b7 \u5199\u4e8e 2026 \u5e74 3 \u6708 15 \u65e5'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <LanguageToggle />
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
          <aside
            className="guide-toc"
            style={{
              display: 'grid',
              gap: 12,
            }}
          >
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
              const sectionImages = guideSectionImages[index] || []

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
                  {sectionImages.length ? (
                    <div
                      style={{
                        display: 'grid',
                        gap: 12,
                        marginTop: 4,
                      }}
                    >
                      {sectionImages.map((imageName) => (
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
              ? 'Open the app and go through the full workflow with your GitHub repository.'
              : '打开应用，用你自己的 GitHub 仓库走一遍完整流程。'}
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
