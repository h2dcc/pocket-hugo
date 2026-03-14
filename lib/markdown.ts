import type { Frontmatter } from './types'
import {
  DEFAULT_FRONTMATTER_PREFERENCES,
  normalizeFrontmatterPreferences,
  type FrontmatterPreferences,
} from './frontmatter-preferences'

function renderYamlList(items: string[]) {
  if (!items.length) {
    return ' - '
  }
  return items.map((item) => ` - ${item}`).join('\n')
}

function renderCustomFields(frontmatter: Frontmatter, reservedKeys: Set<string>) {
  return frontmatter.customFields
    .filter((field) => {
      const key = field.key.trim()
      return key && !reservedKeys.has(key)
    })
    .map((field) => {
      if (field.type === 'list') {
        const items = field.value
          .split(/[，,]/)
          .map((item) => item.trim())
          .filter(Boolean)

        return `${field.key.trim()}:\n${renderYamlList(items)}`
      }

      return `${field.key.trim()}: ${JSON.stringify(field.value)}`
    })
    .join('\n')
}

export function renderIndexMd(
  frontmatter: Frontmatter,
  body: string,
  preferences?: FrontmatterPreferences,
) {
  const mapped = normalizeFrontmatterPreferences(
    preferences || DEFAULT_FRONTMATTER_PREFERENCES,
  )
  const reservedKeys = new Set<string>(['description', 'title', 'draft', 'date'])

  if (mapped.slugFieldEnabled) reservedKeys.add(mapped.slugFieldName)
  if (mapped.categoriesFieldEnabled) reservedKeys.add(mapped.categoriesFieldName)
  if (mapped.tagsFieldEnabled) reservedKeys.add(mapped.tagsFieldName)
  if (mapped.coverImageFieldEnabled) reservedKeys.add(mapped.coverImageFieldName)

  const customFields = renderCustomFields(frontmatter, reservedKeys)
  const optionalLines: string[] = []

  if (mapped.slugFieldEnabled) {
    optionalLines.push(`${mapped.slugFieldName}: ${JSON.stringify(frontmatter.slug)}`)
  }
  if (mapped.categoriesFieldEnabled) {
    optionalLines.push(
      `${mapped.categoriesFieldName}:`,
      renderYamlList(frontmatter.categories),
    )
  }
  if (mapped.tagsFieldEnabled) {
    optionalLines.push(`${mapped.tagsFieldName}:`, renderYamlList(frontmatter.tags))
  }
  if (mapped.coverImageFieldEnabled) {
    optionalLines.push(
      `${mapped.coverImageFieldName}: ${JSON.stringify(frontmatter.image)}`,
    )
  }

  return `---
description: ${JSON.stringify(frontmatter.description)}
title: ${JSON.stringify(frontmatter.title)}
draft: ${frontmatter.draft ? 'true' : 'false'}
date: ${JSON.stringify(frontmatter.date)}
${optionalLines.join('\n')}
${customFields ? `${customFields}\n` : ''}---

${body}`
}

export function stringToBase64(value: string): string {
  if (typeof window === 'undefined') {
    return Buffer.from(value, 'utf-8').toString('base64')
  }
  return btoa(unescape(encodeURIComponent(value)))
}
