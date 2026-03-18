import type { Frontmatter, PostDraft } from './types'
import { normalizeFrontmatter } from './frontmatter'
import type { FrontmatterPreferences } from './frontmatter-preferences'
import type { PostContentMode } from './site-settings'

export function createDefaultFrontmatter(slug: string, date: string): Frontmatter {
  return normalizeFrontmatter({
    description: '',
    title: '',
    draft: false,
    slug,
    date,
    categories: [],
    tags: [],
    image: '',
    customFields: [],
  })
}

export function createEmptyDraft(
  folderName: string,
  slug: string,
  date: string,
  contentMode?: PostContentMode,
  markdownFileName?: string,
  frontmatterPreferences?: FrontmatterPreferences,
): PostDraft {
  return {
    folderName,
    contentMode,
    markdownFileName,
    frontmatter: createDefaultFrontmatter(slug, date),
    body: '',
    assets: [],
    localizedMarkdownFiles: [],
    remoteMarkdownFileNames: [],
    remoteAssetNames: [],
    frontmatterPreferences,
  }
}
