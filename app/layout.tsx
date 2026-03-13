import type { Metadata } from 'next'
import { LANGUAGE_STORAGE_KEY } from '@/lib/language'
import { THEME_STORAGE_KEY } from '@/lib/theme'
import './globals.css'

const appUrl = process.env.APP_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'PocketHugo',
    template: '%s | PocketHugo',
  },
  description: 'Write, manage, and publish Hugo posts from your phone or browser.',
  applicationName: 'PocketHugo',
  keywords: [
    'Hugo',
    'Markdown editor',
    'GitHub publishing',
    'mobile publishing',
    'Hugo CMS',
    'page bundle',
  ],
  authors: [{ name: 'PocketHugo' }],
  creator: 'PocketHugo',
  publisher: 'PocketHugo',
  category: 'technology',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'PocketHugo',
    title: 'PocketHugo',
    description: 'Write, manage, and publish Hugo posts from your phone or browser.',
    images: [
      {
        url: '/icon.svg',
        width: 512,
        height: 512,
        alt: 'PocketHugo logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'PocketHugo',
    description: 'Write, manage, and publish Hugo posts from your phone or browser.',
    images: ['/icon.svg'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-icon.svg', type: 'image/svg+xml' }],
    shortcut: ['/favicon.ico'],
  },
  appleWebApp: {
    capable: true,
    title: 'PocketHugo',
    statusBarStyle: 'default',
  },
}

const themeScript = `
(() => {
  try {
    const storedTheme = localStorage.getItem('${THEME_STORAGE_KEY}');
    const theme = storedTheme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
  } catch (_) {
    document.documentElement.dataset.theme = 'light';
  }
})();
`

const languageScript = `
(() => {
  try {
    const storedLanguage = localStorage.getItem('${LANGUAGE_STORAGE_KEY}');
    document.documentElement.lang = storedLanguage === 'zh' ? 'zh-CN' : 'en';
  } catch (_) {
    document.documentElement.lang = 'en';
  }
})();
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: languageScript }} />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  )
}
