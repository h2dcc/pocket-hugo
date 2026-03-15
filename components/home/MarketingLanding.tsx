'use client'

import Link from 'next/link'
import BrandMark from '@/components/layout/BrandMark'
import LanguageToggle from '@/components/language/LanguageToggle'
import { useLanguage } from '@/lib/use-language'

const githubRepoUrl = 'https://github.com/h2dcc/pocket-hugo'

const structureModes = [
  {
    titleEn: 'Flat Markdown',
    titleZh: '单文件',
    example: 'content/posts/article.md',
  },
  {
    titleEn: 'Single-language Bundle',
    titleZh: '单语言 Bundle',
    example: 'content/posts/my-post-single/index.md',
  },
  {
    titleEn: 'Multilingual Bundle',
    titleZh: '多语言 Bundle',
    example: 'content/posts/my-post/index.en.md',
  },
]

const featureCards = [
  {
    titleEn: 'GitHub Publishing',
    titleZh: 'GitHub 登录发布',
    bodyEn:
      'Sign in with GitHub, choose a repo, branch, and content path, then publish Hugo content directly.',
    bodyZh: '登录 GitHub 后选择仓库、分支和文章目录，直接完成 Hugo 发布流程。',
    icon: (
      <path
        d="M12 2C6.48 2 2 6.58 2 12.23C2 16.75 4.87 20.58 8.84 21.93C9.34 22.02 9.52 21.71 9.52 21.44C9.52 21.2 9.51 20.4 9.5 19.55C6.73 20.17 6.14 18.36 6.14 18.36C5.68 17.16 5.03 16.84 5.03 16.84C4.12 16.2 5.1 16.21 5.1 16.21C6.1 16.28 6.63 17.27 6.63 17.27C7.52 18.84 8.97 18.39 9.54 18.12C9.63 17.46 9.89 17.01 10.18 16.76C7.97 16.5 5.65 15.61 5.65 11.64C5.65 10.51 6.04 9.58 6.69 8.84C6.59 8.58 6.24 7.54 6.79 6.13C6.79 6.13 7.63 5.85 9.5 7.15C10.29 6.92 11.15 6.8 12 6.8C12.85 6.8 13.71 6.92 14.5 7.15C16.37 5.85 17.21 6.13 17.21 6.13C17.76 7.54 17.41 8.58 17.31 8.84C17.96 9.58 18.35 10.51 18.35 11.64C18.35 15.62 16.02 16.49 13.8 16.75C14.17 17.08 14.5 17.74 14.5 18.75C14.5 20.19 14.49 21.08 14.49 21.44C14.49 21.71 14.67 22.03 15.18 21.93C19.15 20.58 22 16.75 22 12.23C22 6.58 17.52 2 12 2Z"
        fill="currentColor"
      />
    ),
  },
  {
    titleEn: 'Native Hugo Structure',
    titleZh: '适配 3 种 Hugo 结构',
    bodyEn:
      'Supports single-file bundles, multilingual bundles, and flat Markdown posts, while staying close to Hugo-friendly Git workflows.',
    bodyZh: '支持单文件 bundle、多语言 bundle 和扁平 Markdown 这 3 种 Hugo 兼容结构，尽量保持接近 Hugo 的 Git 工作流。',
    icon: (
      <>
        <path
          d="M7 4.5H13.8L18 8.7V19.5A1.5 1.5 0 0 1 16.5 21H7.5A1.5 1.5 0 0 1 6 19.5V6A1.5 1.5 0 0 1 7.5 4.5H7Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M13 5V9H17"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  },
  {
    titleEn: 'Image Compression',
    titleZh: '图片压缩与命名',
    bodyEn:
      'Compress, convert, and auto-name images during upload to reduce repository storage and site build overhead.',
    bodyZh: '上传图片时可以自动压缩、转换和命名，减少网站仓库存储和构建负担。',
    icon: (
      <>
        <rect
          x="4"
          y="6"
          width="16"
          height="12"
          rx="2.5"
          stroke="currentColor"
          strokeWidth="1.8"
          fill="none"
        />
        <circle cx="9" cy="10" r="1.4" fill="currentColor" />
        <path
          d="M6.5 16L10.5 12L13.5 15L16.5 11.5L19 14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  },
  {
    titleEn: 'Local Draft Recovery',
    titleZh: '本地草稿续写',
    bodyEn:
      'Drafts and preferences stay in the browser so you can come back and continue anytime.',
    bodyZh: '草稿和偏好保存在浏览器里，断开后回来也能继续写。',
    icon: (
      <>
        <path
          d="M6 5.5A2.5 2.5 0 0 1 8.5 3H15.5A2.5 2.5 0 0 1 18 5.5V18.5A2.5 2.5 0 0 1 15.5 21H8.5A2.5 2.5 0 0 1 6 18.5V5.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          fill="none"
        />
        <path
          d="M9 8.5H15M9 12H15M9 15.5H12.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </>
    ),
  },
  {
    titleEn: 'Re-edit Published Posts',
    titleZh: '已发布文章回读',
    bodyEn:
      'Load already published content back from GitHub, edit it again, and publish updates cleanly.',
    bodyZh: '可以从 GitHub 拉回已经发布的内容，继续编辑后再发回仓库。',
    icon: (
      <>
        <path
          d="M20 12A8 8 0 1 1 17.66 6.34"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M20 4V9H15"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  },
  {
    titleEn: 'Page Editing Modes',
    titleZh: '页面编辑模式',
    bodyEn:
      'Edit standalone pages directly, or use Quick Timeline for short entries and lightweight updates.',
    bodyZh: '除了文章，还可以编辑独立页面，或使用 Quick Timeline 快速记录。',
    icon: (
      <>
        <rect
          x="4"
          y="5"
          width="16"
          height="14"
          rx="2.5"
          stroke="currentColor"
          strokeWidth="1.8"
          fill="none"
        />
        <path
          d="M8 9H16M8 13H14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </>
    ),
  },
  {
    titleEn: 'Quick Status Publishing',
    titleZh: '快速发布说说',
    bodyEn:
      'Use Quick Timeline to post short updates fast, without opening a full article workflow every time.',
    bodyZh: '使用 Quick Timeline 快速发布简短动态，不必每次都进入完整文章流程。',
    icon: (
      <>
        <path
          d="M6 7.5A2.5 2.5 0 0 1 8.5 5H15.5A2.5 2.5 0 0 1 18 7.5V12.5A2.5 2.5 0 0 1 15.5 15H10L6.5 18V15.5A2.5 2.5 0 0 1 6 14V7.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M9 9.5H15M9 12H13"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </>
    ),
  },
  {
    titleEn: 'Turn Pages Into Posts',
    titleZh: '页面一键转文章',
    bodyEn:
      'Convert a timeline page into a post draft with one click when a quick note deserves a full article.',
    bodyZh: '当一条记录值得展开时，可以把页面内容一键转成文章草稿继续写。',
    icon: (
      <>
        <rect
          x="4"
          y="5"
          width="16"
          height="14"
          rx="2.5"
          stroke="currentColor"
          strokeWidth="1.8"
          fill="none"
        />
        <path
          d="M8 9H16M8 13H14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </>
    ),
  },
]

function FeatureIcon({ children }: { children: React.ReactNode }) {
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

export default function MarketingLanding() {
  const { isEnglish } = useLanguage()
  const blogUrl = isEnglish ? 'http://lawtee.com/en' : 'https://lawtee.com'

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '24px 16px 48px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1120,
          margin: '0 auto',
          display: 'grid',
          gap: 20,
        }}
      >
        <section
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 28,
            padding: 'clamp(24px, 5vw, 48px)',
            background:
              'linear-gradient(140deg, color-mix(in srgb, var(--hero-start) 92%, white 8%) 0%, color-mix(in srgb, var(--hero-end) 84%, white 16%) 100%)',
            border: '1px solid var(--hero-border)',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: '-30px auto auto -50px',
              width: 220,
              height: 220,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.24)',
              filter: 'blur(18px)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 'auto -40px -70px auto',
              width: 260,
              height: 260,
              borderRadius: '50%',
              background: 'var(--hero-orb)',
              filter: 'blur(16px)',
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'grid',
              gap: 18,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <BrandMark size={44} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--hero-chip-text)' }}>
                    PocketHugo
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--hero-subtitle)' }}>
                    {isEnglish ? 'Browser-first Hugo workflow' : '浏览器优先的 Hugo 工作流'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <LanguageToggle />
                <Link
                  href="/guide"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 42,
                    padding: '0 16px',
                    borderRadius: 999,
                    border: '1px solid var(--border)',
                    background: 'rgba(255,255,255,0.6)',
                    fontWeight: 600,
                  }}
                >
                  {isEnglish ? 'Guide' : '使用指南'}
                </Link>
                <Link
                  href="/app"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 42,
                    padding: '0 16px',
                    borderRadius: 999,
                    background: 'var(--foreground)',
                    color: 'var(--card)',
                    fontWeight: 700,
                  }}
                >
                  {isEnglish ? 'Open App' : '进入应用'}
                </Link>
                <a
                  href={githubRepoUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 42,
                    padding: '0 16px',
                    borderRadius: 999,
                    border: '1px solid var(--border)',
                    background: 'rgba(255,255,255,0.6)',
                    fontWeight: 600,
                  }}
                >
                  GitHub
                </a>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 12, maxWidth: 760 }}>
              <div
                style={{
                  display: 'inline-flex',
                  width: 'fit-content',
                  alignItems: 'center',
                  padding: '6px 10px',
                  borderRadius: 999,
                  background: 'var(--hero-chip)',
                  color: 'var(--hero-chip-text)',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {isEnglish
                  ? 'Pocket publishing for Hugo across desktop, tablet, and phone'
                  : '适用于电脑、平板与手机的 Pocket Hugo 发布工具'}
              </div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 'clamp(30px, 7vw, 56px)',
                  lineHeight: 1.04,
                  letterSpacing: -1.2,
                  color: 'var(--hero-text)',
                }}
              >
                {isEnglish
                  ? 'Write, manage, and publish Hugo content in your browser.'
                  : '在浏览器里写作、配图并发布 Hugo 内容。'}
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: 'clamp(15px, 2.6vw, 18px)',
                  lineHeight: 1.7,
                  color: 'var(--hero-subtitle)',
                  maxWidth: 660,
                }}
              >
                {isEnglish
                  ? 'Supports three Hugo-compatible content structures, while combining GitHub publishing, local drafts, image handling, and page editing into one browser tool with a stronger desktop experience and solid mobile usability.'
                  : '围绕 3 种 Hugo 兼容内容结构，把 GitHub 发布、本地草稿、图片处理和页面编辑整合到一个桌面体验更强、同时兼顾手机可用性的浏览器工具里。'}
              </p>
            </div>
          </div>
        </section>

        <section
          style={{
            borderRadius: 24,
            border: '1px solid var(--border)',
            background: 'var(--card)',
            padding: 'clamp(18px, 3vw, 24px)',
            boxShadow: 'var(--shadow)',
            display: 'grid',
            gap: 18,
          }}
        >
          <div style={{ display: 'grid', gap: 8, maxWidth: 760 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
              {isEnglish ? 'Post Structure Modes' : '文章结构模式'}
            </div>
            <h2 style={{ margin: 0, fontSize: 'clamp(24px, 4vw, 34px)', lineHeight: 1.15 }}>
              {isEnglish
                ? 'Built for Hugo, and compatible with Hexo, Astro, and similar Markdown workflows.'
                : '为 Hugo 而生，也兼容 Hexo、Astro 等相近的 Markdown 工作流。'}
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 14,
            }}
          >
            {structureModes.map((mode) => (
              <article
                key={mode.titleEn}
                style={{
                  borderRadius: 18,
                  border: '1px solid var(--border)',
                  background: 'var(--card-muted)',
                  padding: 16,
                  display: 'grid',
                  gap: 10,
                }}
              >
                <div style={{ display: 'grid', gap: 4 }}>
                  <h3 style={{ margin: 0, fontSize: 17 }}>
                    {isEnglish ? mode.titleEn : mode.titleZh}
                  </h3>
                  <code
                    style={{
                      display: 'inline-block',
                      width: 'fit-content',
                      padding: '4px 8px',
                      borderRadius: 999,
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      fontSize: 12,
                    }}
                  >
                    {mode.example}
                  </code>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
          }}
        >
          {featureCards.map((item) => (
            <article
              key={item.titleEn}
              style={{
                borderRadius: 22,
                border: '1px solid var(--border)',
                background: 'var(--card)',
                padding: 18,
                boxShadow: 'var(--shadow)',
                display: 'grid',
                gap: 12,
              }}
            >
              <FeatureIcon>{item.icon}</FeatureIcon>
              <div style={{ display: 'grid', gap: 8 }}>
                <h2 style={{ margin: 0, fontSize: 17 }}>
                  {isEnglish ? item.titleEn : item.titleZh}
                </h2>
                <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.7 }}>
                  {isEnglish ? item.bodyEn : item.bodyZh}
                </p>
              </div>
            </article>
          ))}
        </section>

        <section
          style={{
            borderRadius: 24,
            border: '1px solid var(--border)',
            background: 'var(--card)',
            padding: 'clamp(18px, 3vw, 24px)',
            boxShadow: 'var(--shadow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'grid', gap: 6, maxWidth: 640 }}>
            <h2 style={{ margin: 0, fontSize: 'clamp(22px, 4vw, 30px)' }}>
              {isEnglish ? 'Start Right Away' : '直接开始使用'}
            </h2>
            <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.8 }}>
              {isEnglish
                ? 'Ready to use out of the box. Sign in with GitHub and start writing or publishing without a complicated setup.'
                : '开箱即用，登录 GitHub 后即可开始写作和发布，不需要复杂配置。'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link
              href="/guide"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 44,
                padding: '0 18px',
                borderRadius: 999,
                border: '1px solid var(--border)',
                background: 'var(--card-muted)',
                fontWeight: 600,
              }}
            >
              {isEnglish ? 'Read the Guide' : '阅读指南'}
            </Link>
            <Link
              href="/app"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 44,
                padding: '0 18px',
                borderRadius: 999,
                background: 'var(--foreground)',
                color: 'var(--card)',
                fontWeight: 700,
              }}
            >
              {isEnglish ? 'Open PocketHugo' : '打开 PocketHugo'}
            </Link>
            <a
              href={githubRepoUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 44,
                padding: '0 18px',
                borderRadius: 999,
                border: '1px solid var(--border)',
                background: 'var(--card-muted)',
                fontWeight: 600,
              }}
            >
              {isEnglish ? 'View Source' : '查看源码'}
            </a>
          </div>
        </section>

        <footer
          style={{
            padding: '8px 4px 0',
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
          <span>
            {isEnglish ? '© 2026 PocketHugo. by Lawtee.' : '© 2026 PocketHugo. by Lawtee.'}
          </span>
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
      </div>
    </main>
  )
}
