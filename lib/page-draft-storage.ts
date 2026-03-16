import {
  loadStoredAssetsForDraftKey,
  removeStoredAssetsForDraftKey,
  syncStoredAssetsForDraftKey,
} from '@/lib/asset-db'
import { restoreAssetPreviewUrls } from '@/lib/image'
import type { DraftAsset } from '@/lib/types'
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
      contentBase64: '',
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

function mergeStoredAssets(
  assets: DraftAsset[],
  storedAssetMap: Map<string, { mimeType: string; contentBase64: string }>,
) {
  return assets.map((asset) => {
    if (asset.contentBase64.trim()) {
      return asset
    }

    const stored = storedAssetMap.get(asset.name)
    if (!stored?.contentBase64.trim()) {
      return asset
    }

    return {
      ...asset,
      mimeType: stored.mimeType || asset.mimeType,
      contentBase64: stored.contentBase64,
    }
  })
}

export async function savePageDraftToStorage(draft: PageDraft): Promise<PageDraftStorageSaveResult> {
  const storageKey = getStorageKey(draft.filePath)

  try {
    await syncStoredAssetsForDraftKey(storageKey, draft.assets)
    localStorage.setItem(
      storageKey,
      JSON.stringify(preparePageDraftForStorage(draft)),
    )
    return { ok: true }
  } catch (error) {
    return { ok: false, code: isQuotaExceededError(error) ? 'quota' : 'unknown' }
  }
}

export async function loadPageDraftFromStorage(filePath: string): Promise<PageDraft | null> {
  const storageKey = getStorageKey(filePath)
  const raw = localStorage.getItem(storageKey)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as PageDraft
    const storedAssetMap = await loadStoredAssetsForDraftKey(storageKey)
    return {
      ...parsed,
      assets: restoreAssetPreviewUrls(
        mergeStoredAssets(parsed.assets || [], storedAssetMap),
      ),
    }
  } catch {
    return null
  }
}

export async function removePageDraftFromStorage(filePath: string) {
  const storageKey = getStorageKey(filePath)
  localStorage.removeItem(storageKey)
  await removeStoredAssetsForDraftKey(storageKey)
}
