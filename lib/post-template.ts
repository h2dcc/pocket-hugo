import type { Frontmatter, PostDraft } from './types'
import { normalizeFrontmatter } from './frontmatter'

export function createDefaultFrontmatter(slug: string, date: string): Frontmatter {
  return normalizeFrontmatter({
    description: '',
    title: '',
    slug,
    date,
    categories: [],
    tags: [],
    image: '',
    customFields: [],
  })
}

export function createEmptyDraft(folderName: string, slug: string, date: string): PostDraft {
  return {
    folderName,
    frontmatter: createDefaultFrontmatter(slug, date),
    body: '',
    assets: [],
  }
}
