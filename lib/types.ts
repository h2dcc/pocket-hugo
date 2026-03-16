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

export type PostDraft = {
  folderName: string
  contentMode?: PostContentMode
  markdownFileName?: string
  frontmatter: Frontmatter
  body: string
  assets: DraftAsset[]
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
