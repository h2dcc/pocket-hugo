import { restoreAssetPreviewUrls } from '@/lib/image'
import type { PageDraft } from '@/lib/page-file'

const PAGE_DRAFT_PREFIX = 'page-draft:'

export type PageDraftStorageSaveResult =
  | { ok: true }
  | { ok: false; code: 'quota' | 'unknown' }

function getStorageKey(filePath: string) {
  return `${PAGE_DRAFT_PREFIX}${filePath}`
}

function preparePageDraftForStorage(draft: PageDraft): PageDraft {
  return {
    ...draft,
    assets: draft.assets.map((asset) => ({
      ...asset,
      previewUrl: asset.contentBase64 ? '' : asset.previewUrl,
    })),
  }
}

function isQuotaExceededError(error: unknown) {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  )
}

export function savePageDraftToStorage(draft: PageDraft): PageDraftStorageSaveResult {
  try {
    localStorage.setItem(
      getStorageKey(draft.filePath),
      JSON.stringify(preparePageDraftForStorage(draft)),
    )
    return { ok: true }
  } catch (error) {
    return { ok: false, code: isQuotaExceededError(error) ? 'quota' : 'unknown' }
  }
}

export function loadPageDraftFromStorage(filePath: string): PageDraft | null {
  const raw = localStorage.getItem(getStorageKey(filePath))
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as PageDraft
    return {
      ...parsed,
      assets: restoreAssetPreviewUrls(parsed.assets || []),
    }
  } catch {
    return null
  }
}

export function removePageDraftFromStorage(filePath: string) {
  localStorage.removeItem(getStorageKey(filePath))
}
