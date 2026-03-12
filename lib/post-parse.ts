import matter from 'gray-matter'
import type { Frontmatter, PostDraft } from '@/lib/types'

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean)
  }
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()]
  }
  return []
}

export function parseIndexMdToDraft(folderName: string, content: string): PostDraft {
  const parsed = matter(content)
  const data = parsed.data || {}

  const frontmatter: Frontmatter = {
    description: typeof data.description === 'string' ? data.description : '',
    title: typeof data.title === 'string' ? data.title : '',
    slug: typeof data.slug === 'string' ? data.slug : '',
    date: typeof data.date === 'string' ? data.date : '',
    categories: normalizeStringArray(data.categories),
    tags: normalizeStringArray(data.tags),
    image: typeof data.image === 'string' ? data.image : '',
  }

  return {
    folderName,
    frontmatter,
    body: parsed.content.trim(),
    assets: [],
  }
}