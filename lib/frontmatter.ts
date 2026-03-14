import type { Frontmatter } from '@/lib/types'

export function normalizeFrontmatter(
  frontmatter: Partial<Frontmatter> | undefined,
): Frontmatter {
  return {
    description: typeof frontmatter?.description === 'string' ? frontmatter.description : '',
    title: typeof frontmatter?.title === 'string' ? frontmatter.title : '',
    draft: typeof frontmatter?.draft === 'boolean' ? frontmatter.draft : false,
    slug: typeof frontmatter?.slug === 'string' ? frontmatter.slug : '',
    date: typeof frontmatter?.date === 'string' ? frontmatter.date : '',
    categories: Array.isArray(frontmatter?.categories)
      ? frontmatter.categories.map((item) => String(item).trim()).filter(Boolean)
      : [],
    tags: Array.isArray(frontmatter?.tags)
      ? frontmatter.tags.map((item) => String(item).trim()).filter(Boolean)
      : [],
    image: typeof frontmatter?.image === 'string' ? frontmatter.image : '',
    customFields: Array.isArray(frontmatter?.customFields)
      ? frontmatter.customFields.map((field, index) => ({
          id: typeof field?.id === 'string' && field.id ? field.id : `custom-${index}`,
          key: typeof field?.key === 'string' ? field.key : '',
          type: field?.type === 'list' ? 'list' : 'text',
          value: typeof field?.value === 'string' ? field.value : '',
        }))
      : [],
  }
}
