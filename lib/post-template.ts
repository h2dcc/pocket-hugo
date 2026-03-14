import type { Frontmatter, PostDraft } from './types'
import { normalizeFrontmatter } from './frontmatter'
import type { FrontmatterPreferences } from './frontmatter-preferences'

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
  frontmatterPreferences?: FrontmatterPreferences,
): PostDraft {
  return {
    folderName,
    frontmatter: createDefaultFrontmatter(slug, date),
    body: '',
    assets: [],
    remoteAssetNames: [],
    frontmatterPreferences,
  }
}
