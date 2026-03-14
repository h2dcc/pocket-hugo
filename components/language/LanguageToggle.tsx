'use client'

import IconButton from '@/components/ui/IconButton'
import { useLanguage } from '@/lib/use-language'

function LanguageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 6H14M9 4V6M6 6C6 10.2 8 13.9 11 16M8.6 12C9.7 10.8 10.6 9.2 11 7.4M13 18H20M16.5 6L20 18M13 18L16.5 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function LanguageToggle() {
  const { language, isEnglish, setLanguage } = useLanguage()

  function handleToggle() {
    setLanguage(language === 'en' ? 'zh' : 'en')
  }

  return (
    <IconButton
      label={isEnglish ? 'Switch language to Chinese' : '切换语言到 English'}
      onClick={handleToggle}
      icon={<LanguageIcon />}
      active={language === 'zh'}
    />
  )
}
