import {
  DEFAULT_FRONTMATTER_PREFERENCES,
  normalizeFrontmatterPreferences,
  type FrontmatterPreferences,
} from '@/lib/frontmatter-preferences'

export type PostContentMode =
  | 'bundle_single'
  | 'bundle_multilingual'
  | 'flat_markdown'

export type SiteSettings = {
  postContentMode: PostContentMode
  imageConversionEnabled: boolean
  imageMaxWidth: number
  imageQuality: number
  autoImageNamingEnabled: boolean
  timezoneOffsetHours: number
  categoriesPreset: string[]
  frontmatterPreferences: FrontmatterPreferences
}

export const SITE_SETTINGS_STORAGE_KEY = 'site:settings'

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  postContentMode: 'bundle_single',
  imageConversionEnabled: true,
  imageMaxWidth: 1080,
  imageQuality: 0.82,
  autoImageNamingEnabled: true,
  timezoneOffsetHours: 8,
  categoriesPreset: [],
  frontmatterPreferences: DEFAULT_FRONTMATTER_PREFERENCES,
}

function normalizeNumber(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const result: string[] = []
  for (const item of value) {
    const normalized = String(item ?? '').trim()
    if (!normalized) continue
    const key = normalized.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(normalized)
  }
  return result
}

export function normalizePostContentMode(value: unknown): PostContentMode {
  if (value === 'bundle_multilingual' || value === 'flat_markdown') {
    return value
  }
  return DEFAULT_SITE_SETTINGS.postContentMode
}

export function normalizePostMarkdownFileName(value: unknown): string {
  const fallback = 'index.md'
  const raw = String(value ?? '').trim().replace(/\\/g, '/')
  const baseName = raw.split('/').pop()?.trim() || ''

  if (!baseName) {
    return fallback
  }

  const sanitized = baseName.replace(/[\r\n\t]/g, '').trim()
  if (!sanitized) {
    return fallback
  }

  const withExtension = /\.md$/i.test(sanitized) ? sanitized : `${sanitized}.md`
  return withExtension === '.md' ? fallback : withExtension
}

export function isBundleMode(mode: PostContentMode): boolean {
  return mode !== 'flat_markdown'
}

export function normalizeSiteSettings(value: unknown): SiteSettings {
  const raw = (value || {}) as Partial<SiteSettings>

  return {
    postContentMode: normalizePostContentMode(raw.postContentMode),
    imageConversionEnabled:
      typeof raw.imageConversionEnabled === 'boolean'
        ? raw.imageConversionEnabled
        : DEFAULT_SITE_SETTINGS.imageConversionEnabled,
    imageMaxWidth: Math.max(
      320,
      Math.round(normalizeNumber(raw.imageMaxWidth, DEFAULT_SITE_SETTINGS.imageMaxWidth)),
    ),
    imageQuality: Math.min(
      1,
      Math.max(0.1, normalizeNumber(raw.imageQuality, DEFAULT_SITE_SETTINGS.imageQuality)),
    ),
    autoImageNamingEnabled:
      typeof raw.autoImageNamingEnabled === 'boolean'
        ? raw.autoImageNamingEnabled
        : DEFAULT_SITE_SETTINGS.autoImageNamingEnabled,
    timezoneOffsetHours: Math.min(
      14,
      Math.max(
        -12,
        Math.round(
          normalizeNumber(raw.timezoneOffsetHours, DEFAULT_SITE_SETTINGS.timezoneOffsetHours),
        ),
      ),
    ),
    categoriesPreset: normalizeStringList(raw.categoriesPreset),
    frontmatterPreferences: normalizeFrontmatterPreferences(raw.frontmatterPreferences),
  }
}

export function loadSiteSettingsFromStorage(): SiteSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SITE_SETTINGS
  }

  const raw = localStorage.getItem(SITE_SETTINGS_STORAGE_KEY)
  if (!raw) {
    return DEFAULT_SITE_SETTINGS
  }

  try {
    return normalizeSiteSettings(JSON.parse(raw))
  } catch {
    return DEFAULT_SITE_SETTINGS
  }
}

export function saveSiteSettingsToStorage(settings: SiteSettings) {
  localStorage.setItem(
    SITE_SETTINGS_STORAGE_KEY,
    JSON.stringify(normalizeSiteSettings(settings)),
  )
}
