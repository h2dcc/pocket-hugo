import {
  loadStoredAssetsForDraftKey,
  removeStoredAssetsForDraftKey,
  syncStoredAssetsForDraftKey,
} from '@/lib/asset-db'
import { restoreAssetPreviewUrls } from '@/lib/image'
import { normalizeFrontmatter } from '@/lib/frontmatter'
import { buildPostGithubAssetProxyUrl } from '@/lib/github-asset-url'
import {
  normalizePostContentMode,
  normalizePostMarkdownFileName,
} from '@/lib/site-settings'
import type { DraftAsset, PostDraft } from '@/lib/types'

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

export async function saveDraftToStorage(draft: PostDraft): Promise<DraftStorageSaveResult> {
  const draftKey = getDraftStorageKey(draft.folderName)

  try {
    await syncStoredAssetsForDraftKey(draftKey, draft.assets)
    localStorage.setItem(
      draftKey,
      JSON.stringify(prepareDraftForStorage(draft)),
    )
    return { ok: true }
  } catch (error) {
    return { ok: false, code: isQuotaExceededError(error) ? 'quota' : 'unknown' }
  }
}

export async function loadDraftFromStorage(folderName: string): Promise<PostDraft | null> {
  const draftKey = getDraftStorageKey(folderName)
  const raw = localStorage.getItem(draftKey)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as PostDraft
    const storedAssetMap = await loadStoredAssetsForDraftKey(draftKey)
    const normalizedContentMode = normalizePostContentMode(parsed.contentMode)
    return {
      ...parsed,
      contentMode: normalizedContentMode,
      markdownFileName: normalizePostMarkdownFileName(parsed.markdownFileName),
      frontmatter: normalizeFrontmatter(parsed.frontmatter),
      assets: restoreAssetPreviewUrls(
        mergeStoredAssets(parsed.assets || [], storedAssetMap).map((asset) =>
          asset.contentBase64.trim()
            ? asset
            : {
                ...asset,
                previewUrl: buildPostGithubAssetProxyUrl(
                  parsed.folderName,
                  asset.name,
                  normalizedContentMode,
                  asset.mimeType,
                ),
              },
        ),
      ),
    }
  } catch {
    return null
  }
}

export async function removeDraftFromStorage(folderName: string) {
  const draftKey = getDraftStorageKey(folderName)
  localStorage.removeItem(draftKey)
  await removeStoredAssetsForDraftKey(draftKey)
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
      contentMode: normalizePostContentMode(draft.contentMode),
      markdownFileName: normalizePostMarkdownFileName(draft.markdownFileName),
      frontmatter: normalizeFrontmatter(draft.frontmatter),
    }))
    .sort((a, b) => {
      const aDate = new Date(a.frontmatter.date || 0).getTime()
      const bDate = new Date(b.frontmatter.date || 0).getTime()
      return bDate - aDate
    })
}
