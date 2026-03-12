import type { Frontmatter } from './types'

function renderYamlList(items: string[]) {
  if (!items.length) {
    return ' - '
  }
  return items.map((item) => ` - ${item}`).join('\n')
}

export function renderIndexMd(frontmatter: Frontmatter, body: string) {
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
---

${body}`
}

export function stringToBase64(value: string): string {
  if (typeof window === 'undefined') {
    return Buffer.from(value, 'utf-8').toString('base64')
  }
  return btoa(unescape(encodeURIComponent(value)))
}