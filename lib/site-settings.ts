export type SiteSettings = {
  imageConversionEnabled: boolean
  imageMaxWidth: number
  imageQuality: number
  autoImageNamingEnabled: boolean
}

export const SITE_SETTINGS_STORAGE_KEY = 'site:settings'

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  imageConversionEnabled: true,
  imageMaxWidth: 1280,
  imageQuality: 0.82,
  autoImageNamingEnabled: true,
}

function normalizeNumber(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function normalizeSiteSettings(value: unknown): SiteSettings {
  const raw = (value || {}) as Partial<SiteSettings>

  return {
    imageConversionEnabled:
      typeof raw.imageConversionEnabled === 'boolean'
        ? raw.imageConversionEnabled
        : DEFAULT_SITE_SETTINGS.imageConversionEnabled,
    imageMaxWidth: Math.max(320, Math.round(normalizeNumber(raw.imageMaxWidth, DEFAULT_SITE_SETTINGS.imageMaxWidth))),
    imageQuality: Math.min(
      1,
      Math.max(0.1, normalizeNumber(raw.imageQuality, DEFAULT_SITE_SETTINGS.imageQuality)),
    ),
    autoImageNamingEnabled:
      typeof raw.autoImageNamingEnabled === 'boolean'
        ? raw.autoImageNamingEnabled
        : DEFAULT_SITE_SETTINGS.autoImageNamingEnabled,
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
