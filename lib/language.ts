export type LanguageMode = 'en' | 'zh'

export const LANGUAGE_STORAGE_KEY = 'hugoweb-language'
export const LANGUAGE_CHANGE_EVENT = 'hugoweb-language-change'

export function getStoredLanguage(): LanguageMode {
  if (typeof window === 'undefined') {
    return 'en'
  }

  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  return stored === 'zh' ? 'zh' : 'en'
}

export function applyLanguage(language: LanguageMode) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'
  window.dispatchEvent(new CustomEvent(LANGUAGE_CHANGE_EVENT, { detail: language }))
}
