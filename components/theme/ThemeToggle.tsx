'use client'

import { useState } from 'react'
import { THEME_STORAGE_KEY, type ThemeMode } from '@/lib/theme'

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme
  localStorage.setItem(THEME_STORAGE_KEY, theme)
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') {
      return 'light'
    }

    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY)
    const nextTheme: ThemeMode = storedTheme === 'dark' ? 'dark' : 'light'
    applyTheme(nextTheme)
    return nextTheme
  })

  function handleToggle() {
    const nextTheme: ThemeMode = theme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
    applyTheme(nextTheme)
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      style={{
        padding: '10px 14px',
        borderRadius: 999,
        border: '1px solid var(--border)',
        background: 'var(--card)',
        color: 'var(--foreground)',
        cursor: 'pointer',
        fontSize: 14,
        fontWeight: 700,
      }}
    >
      {theme === 'light' ? '深色模式' : '浅色模式'}
    </button>
  )
}
