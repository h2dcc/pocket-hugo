import type { DraftAsset } from '@/lib/types'

export type PageEditorMode = 'page' | 'live'

export type QuickEntry = {
  id: string
  title: string
  timestamp: string
  content: string
}

type LegacyQuickEntry = {
  id?: string
  title?: string
  timestamp?: string
  createdAt?: string
  content?: string
}

export type PageDraft = {
  filePath: string
  mode: PageEditorMode
  frontmatterRaw: string
  frontmatterFence: '---' | '+++'
  body: string
  entries: QuickEntry[]
  assets: DraftAsset[]
  remoteAssetNames?: string[]
}

function toLocalTimestamp(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

function buildEntryId(seed: string, index: number) {
  return `entry-${seed.replace(/[^\dA-Za-z]/g, '')}-${index}`
}

function normalizeQuickEntry(entry: LegacyQuickEntry, index: number): QuickEntry | null {
  const title = String(entry.title || entry.createdAt || '').trim()
  const timestamp = String(entry.timestamp || '').trim()
  const content = String(entry.content || '').trim()

  if (!title || !content) {
    return null
  }

  return {
    id: String(entry.id || buildEntryId(`${title}-${timestamp || index}`, index)),
    title,
    timestamp,
    content,
  }
}

export function createEmptyPageDraft(filePath: string, mode: PageEditorMode): PageDraft {
  return {
    filePath,
    mode,
    frontmatterRaw:
      mode === 'live'
        ? 'title: "Live"\nslug: "live"'
        : 'title: ""\nslug: ""',
    frontmatterFence: '---',
    body: '',
    entries: [],
    assets: [],
    remoteAssetNames: [],
  }
}

function extractFrontmatter(rawContent: string) {
  const normalized = rawContent.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')

  for (const fence of ['---', '+++'] as const) {
    if (!normalized.startsWith(`${fence}\n`) && normalized !== fence) {
      continue
    }

    const lines = normalized.split('\n')
    const frontmatterLines: string[] = []
    let closingLineIndex = -1

    for (let index = 1; index < lines.length; index += 1) {
      const line = lines[index].trim()

      if (line === fence) {
        if (frontmatterLines.length === 0) {
          continue
        }
        closingLineIndex = index
        break
      }

      frontmatterLines.push(lines[index])
    }

    if (closingLineIndex === -1) {
      break
    }

    const frontmatterRaw = frontmatterLines.join('\n').trim()
    const bodyLines = lines.slice(closingLineIndex + 1)

    while (bodyLines[0]?.trim() === fence) {
      bodyLines.shift()
    }

    const body = bodyLines.join('\n').trim()

    return { frontmatterFence: fence, frontmatterRaw, body }
  }

  return {
    frontmatterFence: '---' as const,
    frontmatterRaw: '',
    body: normalized.trim(),
  }
}

function sanitizeFrontmatterRaw(frontmatterRaw: string, fence: '---' | '+++') {
  return frontmatterRaw
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(new RegExp(`^(?:${escapeRegExp(fence)}\\s*\\n)+`), '')
    .replace(new RegExp(`(?:\\n${escapeRegExp(fence)}\\s*)+$`), '')
    .trim()
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function parsePageFileContent(
  filePath: string,
  mode: PageEditorMode,
  rawContent: string,
): PageDraft {
  const { frontmatterFence, frontmatterRaw, body } = extractFrontmatter(rawContent)

  return {
    filePath,
    mode,
    frontmatterRaw,
    frontmatterFence,
    body,
    entries: mode === 'live' ? parseLiveEntries(body) : [],
    assets: [],
    remoteAssetNames: [],
  }
}

export function parseLiveEntries(body: string): QuickEntry[] {
  const normalizedBody = body.trim()
  if (!normalizedBody) {
    return []
  }

  const sections = normalizedBody.split(/^##\s+/m).filter(Boolean)

  return sections
    .map((section, index) => {
      const [firstLine = '', ...restLines] = section.split('\n')
      const title = firstLine.trim()
      const remainingLines = [...restLines]
      let timestamp = ''

      while (remainingLines.length > 0 && !remainingLines[0].trim()) {
        remainingLines.shift()
      }

      if (remainingLines[0]?.trim().startsWith('> ')) {
        timestamp = remainingLines[0].trim().replace(/^>\s*/, '')
        remainingLines.shift()
      }

      const content = remainingLines.join('\n').trim()

      if (!title || !content) {
        return null
      }

      return normalizeQuickEntry(
        {
          id: buildEntryId(title || timestamp || `entry-${index}`, index),
          title,
          timestamp,
          content,
        },
        index,
      )
    })
    .filter((entry): entry is QuickEntry => Boolean(entry))
}

export function renderLiveEntries(entries: QuickEntry[]) {
  return entries
    .map((entry, index) => normalizeQuickEntry(entry, index))
    .filter((entry): entry is QuickEntry => Boolean(entry))
    .map((entry) => {
      const title = entry.title.trim()
      const timestamp = entry.timestamp.trim()
      const content = entry.content.trim()
      return `## ${title}\n${timestamp ? `\n> ${timestamp}\n` : '\n'}\n${content}`
    })
    .join('\n\n')
    .trim()
}

export function renderPageFile(draft: PageDraft) {
  const body = draft.mode === 'live' ? renderLiveEntries(draft.entries) : draft.body.trim()
  const fence = draft.frontmatterFence || '---'
  const frontmatter = sanitizeFrontmatterRaw(draft.frontmatterRaw, fence)

  if (!frontmatter) {
    return `${body}\n`
  }

  return `${fence}\n${frontmatter}\n${fence}\n\n${body}\n`
}

export function createQuickEntry(content = '', title = 'New Entry'): QuickEntry {
  const timestamp = toLocalTimestamp()
  return {
    id: buildEntryId(`${title}-${timestamp}`, Math.floor(Math.random() * 1000)),
    title,
    timestamp,
    content,
  }
}
