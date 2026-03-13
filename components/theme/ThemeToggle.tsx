'use client'

import { useSyncExternalStore } from 'react'
import { THEME_CHANGE_EVENT, THEME_STORAGE_KEY, type ThemeMode } from '@/lib/theme'
import { useLanguage } from '@/lib/use-language'

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme
  localStorage.setItem(THEME_STORAGE_KEY, theme)
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: theme }))
}

function ThemeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3V5M12 19V21M4.9 4.9L6.3 6.3M17.7 17.7L19.1 19.1M3 12H5M19 12H21M4.9 19.1L6.3 17.7M17.7 6.3L19.1 4.9M16 12A4 4 0 1 1 8 12A4 4 0 0 1 16 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function ThemeToggle() {
  const { isEnglish } = useLanguage()
  const theme = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener(THEME_CHANGE_EVENT, onStoreChange)
      window.addEventListener('storage', onStoreChange)
      return () => {
        window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange)
        window.removeEventListener('storage', onStoreChange)
      }
    },
    () => {
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY)
      return storedTheme === 'dark' ? 'dark' : 'light'
    },
    () => 'light',
  )

  function handleToggle() {
    const nextTheme: ThemeMode = theme === 'light' ? 'dark' : 'light'
    applyTheme(nextTheme)
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
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
      <ThemeIcon />
      <span>
        {theme === 'light'
          ? isEnglish
            ? 'Dark Mode'
            : '深色模式'
          : isEnglish
            ? 'Light Mode'
            : '浅色模式'}
      </span>
    </button>
  )
}
