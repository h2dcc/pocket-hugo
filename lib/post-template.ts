import type { Frontmatter, PostDraft } from './types'

export function createDefaultFrontmatter(slug: string, date: string): Frontmatter {
  return {
    description: '',
    title: '',
    slug,
    date,
    categories: [],
    tags: [],
    image: '',
  }
}

export function createEmptyDraft(folderName: string, slug: string, date: string): PostDraft {
  return {
    folderName,
    frontmatter: createDefaultFrontmatter(slug, date),
    body: '',
    assets: [],
  }
}