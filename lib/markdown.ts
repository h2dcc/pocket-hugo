import type { Frontmatter } from './types'

function renderYamlList(items: string[]) {
  if (!items.length) {
    return ' - '
  }
  return items.map((item) => ` - ${item}`).join('\n')
}

function renderCustomFields(frontmatter: Frontmatter) {
  return frontmatter.customFields
    .filter((field) => field.key.trim())
    .map((field) => {
      if (field.type === 'list') {
        const items = field.value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)

        return `${field.key.trim()}:\n${renderYamlList(items)}`
      }

      return `${field.key.trim()}: ${JSON.stringify(field.value)}`
    })
    .join('\n')
}

export function renderIndexMd(frontmatter: Frontmatter, body: string) {
  const customFields = renderCustomFields(frontmatter)

  return `---
description: ${JSON.stringify(frontmatter.description)}
title: ${JSON.stringify(frontmatter.title)}
slug: ${JSON.stringify(frontmatter.slug)}
date: ${JSON.stringify(frontmatter.date)}
categories:
${renderYamlList(frontmatter.categories)}
tags:
${renderYamlList(frontmatter.tags)}
image: ${JSON.stringify(frontmatter.image)}
${customFields ? `${customFields}\n` : ''}---

${body}`
}

export function stringToBase64(value: string): string {
  if (typeof window === 'undefined') {
    return Buffer.from(value, 'utf-8').toString('base64')
  }
  return btoa(unescape(encodeURIComponent(value)))
}
