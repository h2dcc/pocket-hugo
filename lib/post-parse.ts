import matter from 'gray-matter'
import { normalizeFrontmatter } from '@/lib/frontmatter'
import type { PostContentMode } from '@/lib/site-settings'
import type { CustomFrontmatterField, Frontmatter, PostDraft } from '@/lib/types'

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean)
  }
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()]
  }
  return []
}

export function parseIndexMdToDraft(
  folderName: string,
  content: string,
  contentMode: PostContentMode = 'bundle_single',
  markdownFileName = 'index.md',
): PostDraft {
  const parsed = matter(content)
  const data = parsed.data || {}
  const slugKeys = ['slug'] as const
  const categoriesKeys = ['categories', 'category'] as const
  const tagsKeys = ['tags', 'tag'] as const
  const imageKeys = [
    'image',
    'featured-image',
    'featured_image',
    'cover',
    'cover-image',
    'cover_image',
  ] as const
  const draftKeys = ['draft'] as const
  const allKnownKeys = [
    'description',
    'title',
    'date',
    ...slugKeys,
    ...categoriesKeys,
    ...tagsKeys,
    ...imageKeys,
    ...draftKeys,
  ]
  const knownFields = new Set([
    ...allKnownKeys,
  ])

  function pickField<T = unknown>(keys: readonly string[]): T | undefined {
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        return data[key] as T
      }
    }
    return undefined
  }

  const customFields: CustomFrontmatterField[] = Object.entries(data)
    .filter(([key]) => !knownFields.has(key))
    .map(([key, value], index) => ({
      id: `custom-${index}-${key}`,
      key,
      type: Array.isArray(value) ? 'list' : 'text',
      value: Array.isArray(value)
        ? value.map((item) => String(item).trim()).filter(Boolean).join(', ')
        : String(value ?? ''),
    }))

  const frontmatter: Frontmatter = normalizeFrontmatter({
    description: typeof data.description === 'string' ? data.description : '',
    title: typeof data.title === 'string' ? data.title : '',
    draft:
      typeof pickField(draftKeys) === 'boolean'
        ? Boolean(pickField(draftKeys))
        : String(pickField(draftKeys) || '').toLowerCase() === 'true',
    slug: typeof pickField(slugKeys) === 'string' ? String(pickField(slugKeys)) : '',
    date: typeof data.date === 'string' ? data.date : '',
    categories: normalizeStringArray(pickField(categoriesKeys)),
    tags: normalizeStringArray(pickField(tagsKeys)),
    image: typeof pickField(imageKeys) === 'string' ? String(pickField(imageKeys)) : '',
    customFields,
  })

  return {
    folderName,
    contentMode,
    markdownFileName,
    repositoryMode: 'github',
    frontmatter,
    body: parsed.content.trim(),
    assets: [],
    localizedMarkdownFiles: [],
    remoteMarkdownFileNames: [],
    remoteAssetNames: [],
  }
}
