'use client'

import { useSyncExternalStore } from 'react'
import {
  LANGUAGE_CHANGE_EVENT,
  applyLanguage,
  getStoredLanguage,
  type LanguageMode,
} from '@/lib/language'

export function useLanguage() {
  const language = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener(LANGUAGE_CHANGE_EVENT, onStoreChange)
      window.addEventListener('storage', onStoreChange)
      return () => {
        window.removeEventListener(LANGUAGE_CHANGE_EVENT, onStoreChange)
        window.removeEventListener('storage', onStoreChange)
      }
    },
    getStoredLanguage,
    () => 'en',
  )

  function setLanguage(next: LanguageMode) {
    applyLanguage(next)
  }

  return { language, setLanguage, isEnglish: language === 'en' }
}
