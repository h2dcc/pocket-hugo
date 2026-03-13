import type { Metadata } from 'next'
import { THEME_STORAGE_KEY } from '@/lib/theme'
import './globals.css'

export const metadata: Metadata = {
  title: 'hugoweb',
  description: 'Mobile-first Hugo publishing tool with GitHub sync',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" data-theme="light">
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  )
}
