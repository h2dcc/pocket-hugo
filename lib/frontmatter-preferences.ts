export type ExtraBasicInfoField = {
  id: string
  key: string
  type: 'text' | 'list'
}

export type FrontmatterPreferences = {
  slugFieldEnabled: boolean
  categoriesFieldEnabled: boolean
  tagsFieldEnabled: boolean
  coverImageFieldEnabled: boolean
  slugFieldName: string
  categoriesFieldName: string
  tagsFieldName: string
  coverImageFieldName: string
  extraBasicInfoFields: ExtraBasicInfoField[]
}

export const DEFAULT_FRONTMATTER_PREFERENCES: FrontmatterPreferences = {
  slugFieldEnabled: true,
  categoriesFieldEnabled: true,
  tagsFieldEnabled: true,
  coverImageFieldEnabled: true,
  slugFieldName: 'slug',
  categoriesFieldName: 'categories',
  tagsFieldName: 'tags',
  coverImageFieldName: 'image',
  extraBasicInfoFields: [],
}

function normalizeFieldName(value: unknown, fallback: string) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '')
  return normalized || fallback
}

function normalizeExtraFieldName(value: unknown) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '')
  return normalized
}

function normalizeExtraBasicInfoFields(
  value: unknown,
): ExtraBasicInfoField[] {
  if (!Array.isArray(value)) {
    return []
  }

  const seen = new Set<string>()
  const fields: ExtraBasicInfoField[] = []

  for (let index = 0; index < value.length; index += 1) {
    const item = value[index] as Partial<ExtraBasicInfoField>
    const key = normalizeExtraFieldName(item?.key)
    if (!key || seen.has(key)) {
      continue
    }
    seen.add(key)

    fields.push({
      id:
        typeof item?.id === 'string' && item.id.trim()
          ? item.id
          : `extra-${index}-${key}`,
      key,
      type: item?.type === 'list' ? 'list' : 'text',
    })
  }

  return fields
}

export function normalizeFrontmatterPreferences(
  value: unknown,
): FrontmatterPreferences {
  const raw = (value || {}) as Partial<FrontmatterPreferences>

  return {
    slugFieldEnabled:
      typeof raw.slugFieldEnabled === 'boolean'
        ? raw.slugFieldEnabled
        : DEFAULT_FRONTMATTER_PREFERENCES.slugFieldEnabled,
    categoriesFieldEnabled:
      typeof raw.categoriesFieldEnabled === 'boolean'
        ? raw.categoriesFieldEnabled
        : DEFAULT_FRONTMATTER_PREFERENCES.categoriesFieldEnabled,
    tagsFieldEnabled:
      typeof raw.tagsFieldEnabled === 'boolean'
        ? raw.tagsFieldEnabled
        : DEFAULT_FRONTMATTER_PREFERENCES.tagsFieldEnabled,
    coverImageFieldEnabled:
      typeof raw.coverImageFieldEnabled === 'boolean'
        ? raw.coverImageFieldEnabled
        : DEFAULT_FRONTMATTER_PREFERENCES.coverImageFieldEnabled,
    slugFieldName: normalizeFieldName(
      raw.slugFieldName,
      DEFAULT_FRONTMATTER_PREFERENCES.slugFieldName,
    ),
    categoriesFieldName: normalizeFieldName(
      raw.categoriesFieldName,
      DEFAULT_FRONTMATTER_PREFERENCES.categoriesFieldName,
    ),
    tagsFieldName: normalizeFieldName(
      raw.tagsFieldName,
      DEFAULT_FRONTMATTER_PREFERENCES.tagsFieldName,
    ),
    coverImageFieldName: normalizeFieldName(
      raw.coverImageFieldName,
      DEFAULT_FRONTMATTER_PREFERENCES.coverImageFieldName,
    ),
    extraBasicInfoFields: normalizeExtraBasicInfoFields(raw.extraBasicInfoFields),
  }
}
