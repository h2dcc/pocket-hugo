import { posix as pathPosix } from 'node:path'
import { NextRequest, NextResponse } from 'next/server'
import {
  getGithubFileBase64,
  getGithubFileContent,
  listGithubDir,
  type GithubContentDirItem,
} from '@/lib/github-api'
import { requireGithubRepoContext } from '@/lib/github-context'
import { normalizePageFilePath } from '@/lib/github-session'
import { parsePageFileContent } from '@/lib/page-file'

const IMAGE_EXT_RE = /\.(webp|png|jpe?g|gif|avif|svg)$/i

function normalizeTargetFolderName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\\/g, '/')
    .replace(/[^a-z0-9/_-]+/g, '-')
    .replace(/\/+/g, '/')
    .replace(/^-+|-+$/g, '')
    .replace(/^\/+|\/+$/g, '')
}

function parseLocalImageLinks(markdown: string) {
  const links: string[] = []
  const re = /!\[[^\]]*]\(([^)]+)\)/g
  for (const match of markdown.matchAll(re)) {
    const raw = String(match[1] || '').trim()
    if (!raw) continue
    const withoutTitle = raw.split(/\s+/)[0]?.replace(/^<|>$/g, '') || ''
    if (!withoutTitle) continue
    if (
      withoutTitle.startsWith('http://') ||
      withoutTitle.startsWith('https://') ||
      withoutTitle.startsWith('data:') ||
      withoutTitle.startsWith('#') ||
      withoutTitle.startsWith('/')
    ) {
      continue
    }
    try {
      links.push(decodeURIComponent(withoutTitle))
    } catch {
      links.push(withoutTitle)
    }
  }
  return links
}

export async function POST(request: NextRequest) {
  try {
    const { token, repoConfig } = await requireGithubRepoContext()
    const body = (await request.json()) as {
      sourceFilePath?: string
      targetFolderName?: string
      mode?: string
    }

    const sourceFilePath = normalizePageFilePath(String(body.sourceFilePath || ''))
    const targetFolderName = normalizeTargetFolderName(String(body.targetFolderName || ''))
    const mode = body.mode === 'live' ? 'live' : 'page'

    if (!sourceFilePath) {
      return NextResponse.json({ ok: false, error: 'sourceFilePath is required.' }, { status: 400 })
    }
    if (!/\.(md|markdown)$/i.test(sourceFilePath)) {
      return NextResponse.json({ ok: false, error: 'Only Markdown files can be transferred.' }, { status: 400 })
    }
    if (!targetFolderName || targetFolderName.includes('..')) {
      return NextResponse.json({ ok: false, error: 'Please enter a valid target folder name.' }, { status: 400 })
    }

    const sourceDirectory = sourceFilePath.includes('/')
      ? sourceFilePath.split('/').slice(0, -1).join('/')
      : ''

    const sourceMarkdown = await getGithubFileContent(sourceFilePath, token, {
      owner: repoConfig.owner,
      repo: repoConfig.repo,
      branch: repoConfig.branch,
    })
    const parsed = parsePageFileContent(sourceFilePath, mode, sourceMarkdown)
    const sourceBody = parsed.body

    const map = new Map<string, string>()
    let dirItems: GithubContentDirItem[] = []
    try {
      dirItems = await listGithubDir(sourceDirectory, token, {
        owner: repoConfig.owner,
        repo: repoConfig.repo,
        branch: repoConfig.branch,
      })
    } catch {
      dirItems = []
    }

    for (const item of dirItems) {
      if (item.type !== 'file') continue
      if (!IMAGE_EXT_RE.test(item.name)) continue
      map.set(item.name, item.path)
    }

    const linkedImages = parseLocalImageLinks(sourceBody)
    for (const link of linkedImages) {
      const normalizedSourceAssetPath = pathPosix.normalize(
        sourceDirectory ? pathPosix.join(sourceDirectory, link) : link,
      )
      const relativeToSource = pathPosix.normalize(
        sourceDirectory ? pathPosix.relative(sourceDirectory, normalizedSourceAssetPath) : normalizedSourceAssetPath,
      )
      if (!relativeToSource || relativeToSource.startsWith('..')) {
        continue
      }
      if (!IMAGE_EXT_RE.test(relativeToSource)) continue
      map.set(relativeToSource, normalizedSourceAssetPath)
    }

    const loadedAssets: Array<{ name: string; mimeType: string; contentBase64: string }> = []
    for (const [relativeAssetPath, sourceAssetPath] of map.entries()) {
      try {
        const contentBase64 = await getGithubFileBase64(sourceAssetPath, token, {
          owner: repoConfig.owner,
          repo: repoConfig.repo,
          branch: repoConfig.branch,
        })
        const lower = relativeAssetPath.toLowerCase()
        const mimeType = lower.endsWith('.webp')
          ? 'image/webp'
          : lower.endsWith('.png')
            ? 'image/png'
            : lower.endsWith('.jpg') || lower.endsWith('.jpeg')
              ? 'image/jpeg'
              : lower.endsWith('.gif')
                ? 'image/gif'
                : lower.endsWith('.avif')
                  ? 'image/avif'
                  : lower.endsWith('.svg')
                    ? 'image/svg+xml'
                    : 'application/octet-stream'
        loadedAssets.push({
          name: relativeAssetPath,
          mimeType,
          contentBase64,
        })
      } catch {
        // Skip missing images so transfer can still proceed with available assets.
      }
    }

    return NextResponse.json({
      ok: true,
      targetFolderName,
      sourceFilePath,
      body: sourceBody,
      assets: loadedAssets.map((asset) => ({
        ...asset,
        previewUrl: '',
      })),
      loadedAssetCount: loadedAssets.length,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to transfer page to post.',
      },
      { status: 500 },
    )
  }
}
