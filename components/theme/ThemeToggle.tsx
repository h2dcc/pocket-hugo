'use client'

import { useSyncExternalStore } from 'react'
import IconButton from '@/components/ui/IconButton'
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
        d="M20 15.2A7.2 7.2 0 1 1 12.8 4 5.8 5.8 0 0 0 20 15.2Z"
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
    <IconButton
      label={
        theme === 'light'
          ? isEnglish
            ? 'Switch to dark mode'
            : '切换到深色模式'
          : isEnglish
            ? 'Switch to light mode'
            : '切换到浅色模式'
      }
      onClick={handleToggle}
      icon={<ThemeIcon />}
      active={theme === 'dark'}
    />
  )
}
