import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'hugoweb',
  description: 'Mobile-first Hugo publishing tool with GitHub sync',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
