import type { FrontmatterPreferences } from '@/lib/frontmatter-preferences'
import type { PostContentMode } from '@/lib/site-settings'

export type Frontmatter = {
  description: string
  title: string
  draft: boolean
  slug: string
  date: string
  categories: string[]
  tags: string[]
  image: string
  customFields: CustomFrontmatterField[]
}

export type DraftAsset = {
  name: string
  mimeType: string
  contentBase64: string
  previewUrl: string
}

export type LocalizedMarkdownFile = {
  id: string
  fileName: string
  targetLanguage?: string
  content: string
}

export type PostDraft = {
  folderName: string
  contentMode?: PostContentMode
  markdownFileName?: string
  frontmatter: Frontmatter
  body: string
  assets: DraftAsset[]
  localizedMarkdownFiles?: LocalizedMarkdownFile[]
  remoteMarkdownFileNames?: string[]
  remoteAssetNames?: string[]
  frontmatterPreferences?: FrontmatterPreferences
  autoCommitCount?: number
}

export type CustomFrontmatterField = {
  id: string
  key: string
  type: 'text' | 'list'
  value: string
}

export function createLocalizedMarkdownId() {
  return `localized-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function normalizeLocalizedMarkdownFiles(
  value: unknown,
): LocalizedMarkdownFile[] {
  if (!Array.isArray(value)) return []

  return value.map((item, index) => {
    const current = (item || {}) as Partial<LocalizedMarkdownFile>
    return {
      id:
        typeof current.id === 'string' && current.id.trim()
          ? current.id
          : `localized-${index}`,
      fileName: typeof current.fileName === 'string' ? current.fileName : '',
      targetLanguage:
        typeof current.targetLanguage === 'string' ? current.targetLanguage : '',
      content: typeof current.content === 'string' ? current.content : '',
    }
  })
}
