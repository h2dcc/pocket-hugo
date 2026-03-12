import type { PostDraft } from '@/lib/types'

const DRAFT_PREFIX = 'draft:'

export function getDraftStorageKey(folderName: string) {
  return `${DRAFT_PREFIX}${folderName}`
}

export function saveDraftToStorage(draft: PostDraft) {
  localStorage.setItem(getDraftStorageKey(draft.folderName), JSON.stringify(draft))
}

export function loadDraftFromStorage(folderName: string): PostDraft | null {
  const raw = localStorage.getItem(getDraftStorageKey(folderName))
  if (!raw) return null

  try {
    return JSON.parse(raw) as PostDraft
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

  return drafts.sort((a, b) => {
    const aDate = new Date(a.frontmatter.date || 0).getTime()
    const bDate = new Date(b.frontmatter.date || 0).getTime()
    return bDate - aDate
  })
}