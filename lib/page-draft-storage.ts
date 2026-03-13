import type { PageDraft } from '@/lib/page-file'

const PAGE_DRAFT_PREFIX = 'page-draft:'

function getStorageKey(filePath: string) {
  return `${PAGE_DRAFT_PREFIX}${filePath}`
}

export function savePageDraftToStorage(draft: PageDraft) {
  localStorage.setItem(getStorageKey(draft.filePath), JSON.stringify(draft))
}

export function loadPageDraftFromStorage(filePath: string): PageDraft | null {
  const raw = localStorage.getItem(getStorageKey(filePath))
  if (!raw) return null

  try {
    return JSON.parse(raw) as PageDraft
  } catch {
    return null
  }
}

export function removePageDraftFromStorage(filePath: string) {
  localStorage.removeItem(getStorageKey(filePath))
}
