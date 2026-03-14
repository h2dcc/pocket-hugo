import { restoreAssetPreviewUrls } from '@/lib/image'
import { normalizeFrontmatter } from '@/lib/frontmatter'
import type { PostDraft } from '@/lib/types'

const DRAFT_PREFIX = 'draft:'

export type DraftStorageSaveResult =
  | { ok: true }
  | { ok: false; code: 'quota' | 'unknown' }

export function getDraftStorageKey(folderName: string) {
  return `${DRAFT_PREFIX}${folderName}`
}

function prepareDraftForStorage(draft: PostDraft): PostDraft {
  return {
    ...draft,
    assets: draft.assets.map((asset) => ({
      ...asset,
      // Only drop duplicated data URLs for locally uploaded images.
      // Remote GitHub assets rely on previewUrl because they do not have base64 content.
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

export function saveDraftToStorage(draft: PostDraft): DraftStorageSaveResult {
  try {
    localStorage.setItem(
      getDraftStorageKey(draft.folderName),
      JSON.stringify(prepareDraftForStorage(draft)),
    )
    return { ok: true }
  } catch (error) {
    return { ok: false, code: isQuotaExceededError(error) ? 'quota' : 'unknown' }
  }
}

export function loadDraftFromStorage(folderName: string): PostDraft | null {
  const raw = localStorage.getItem(getDraftStorageKey(folderName))
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as PostDraft
    return {
      ...parsed,
      frontmatter: normalizeFrontmatter(parsed.frontmatter),
      assets: restoreAssetPreviewUrls(parsed.assets || []),
    }
  } catch {
    return null
  }
}

export function removeDraftFromStorage(folderName: string) {
  localStorage.removeItem(getDraftStorageKey(folderName))
}

export function listDraftsFromStorage(): PostDraft[] {
  const drafts: PostDraft[] = []

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i)
    if (!key || !key.startsWith(DRAFT_PREFIX)) continue

    const raw = localStorage.getItem(key)
    if (!raw) continue

    try {
      const parsed = JSON.parse(raw) as PostDraft
      drafts.push(parsed)
    } catch {
      // ignore broken draft
    }
  }

  return drafts
    .map((draft) => ({
      ...draft,
      frontmatter: normalizeFrontmatter(draft.frontmatter),
      assets: restoreAssetPreviewUrls(draft.assets || []),
    }))
    .sort((a, b) => {
      const aDate = new Date(a.frontmatter.date || 0).getTime()
      const bDate = new Date(b.frontmatter.date || 0).getTime()
      return bDate - aDate
    })
}
