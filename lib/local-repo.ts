import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  getGithubPageConfigPreference,
  getGithubRepoConfigPreference,
  normalizePostsBasePath,
} from '@/lib/github-session'
import type { PostContentMode } from '@/lib/site-settings'

export type LocalRepoConfig = {
  enabled: boolean
  rootPath: string
  postsBasePath: string
}

type LocalDirItem = {
  name: string
  path: string
  type: 'file' | 'dir'
}

function normalizeRelativePath(input: string) {
  return input.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '')
}

export function getLocalRepoConfig(): LocalRepoConfig {
  const enabled = String(process.env.LOCAL_REPO_MODE || '').trim().toLowerCase() === 'true'
  const rootPath = String(process.env.LOCAL_REPO_ROOT || '').trim()
  const postsBasePath = normalizePostsBasePath(
    String(process.env.LOCAL_POSTS_BASE_PATH || 'content/posts'),
  )

  return {
    enabled,
    rootPath,
    postsBasePath,
  }
}

export function isLocalRepoMode() {
  const config = getLocalRepoConfig()
  return config.enabled && Boolean(config.rootPath)
}

export function requireLocalRepoConfig() {
  const config = getLocalRepoConfig()

  if (!config.enabled) {
    throw new Error('Local repository mode is disabled.')
  }

  if (!config.rootPath) {
    throw new Error('Missing LOCAL_REPO_ROOT.')
  }

  return config
}

export function getLocalRepoSession() {
  const config = requireLocalRepoConfig()
  const repoName = path.basename(config.rootPath.replace(/[\\/]+$/, '')) || 'local-repo'

  return {
    authenticated: true,
    user: {
      login: 'local',
      name: 'Local Repository',
      avatarUrl: '',
    },
    repoConfig: {
      owner: 'local',
      repo: repoName,
      branch: 'local',
      postsBasePath: config.postsBasePath,
    },
    pageConfig: null,
  }
}

export async function getResolvedLocalRepoSession() {
  const session = getLocalRepoSession()
  const repoConfigPreference = await getGithubRepoConfigPreference()
  const pageConfigPreference = await getGithubPageConfigPreference()

  return {
    ...session,
    repoConfig: repoConfigPreference || session.repoConfig,
    pageConfig: pageConfigPreference || null,
  }
}

function resolveInsideRoot(rootPath: string, relativePath: string) {
  const resolvedRoot = path.resolve(rootPath)
  const normalizedRelative = normalizeRelativePath(relativePath)
  const resolvedPath = path.resolve(resolvedRoot, normalizedRelative)
  const relativeToRoot = path.relative(resolvedRoot, resolvedPath)

  if (
    relativeToRoot.startsWith('..') ||
    path.isAbsolute(relativeToRoot)
  ) {
    throw new Error('Path escapes the local repository root.')
  }

  return resolvedPath
}

export function resolveLocalRepoPath(relativePath: string) {
  const config = requireLocalRepoConfig()
  return resolveInsideRoot(config.rootPath, relativePath)
}

export async function readLocalRepoText(relativePath: string) {
  const fullPath = resolveLocalRepoPath(relativePath)
  return readFile(fullPath, 'utf-8')
}

export async function readLocalRepoBase64(relativePath: string) {
  const fullPath = resolveLocalRepoPath(relativePath)
  const buffer = await readFile(fullPath)
  return buffer.toString('base64')
}

export async function listLocalRepoDir(relativePath: string): Promise<LocalDirItem[]> {
  const fullPath = resolveLocalRepoPath(relativePath)
  const entries = await readdir(fullPath, { withFileTypes: true })

  return entries.map((entry) => ({
    name: entry.name,
    path: normalizeRelativePath(path.posix.join(normalizeRelativePath(relativePath), entry.name)),
    type: entry.isDirectory() ? 'dir' : 'file',
  }))
}

export async function ensureLocalRepoDir(relativePath: string) {
  const fullPath = resolveLocalRepoPath(relativePath)
  await mkdir(fullPath, { recursive: true })
}

export async function writeLocalRepoBase64(relativePath: string, contentBase64: string) {
  const fullPath = resolveLocalRepoPath(relativePath)
  await mkdir(path.dirname(fullPath), { recursive: true })
  await writeFile(fullPath, Buffer.from(contentBase64, 'base64'))
}

export async function writeLocalRepoText(relativePath: string, content: string) {
  const fullPath = resolveLocalRepoPath(relativePath)
  await mkdir(path.dirname(fullPath), { recursive: true })
  await writeFile(fullPath, content, 'utf-8')
}

export async function removeLocalRepoPath(relativePath: string) {
  const fullPath = resolveLocalRepoPath(relativePath)
  await rm(fullPath, { force: true, recursive: true })
}

export async function localRepoPathExists(relativePath: string) {
  try {
    const fullPath = resolveLocalRepoPath(relativePath)
    await stat(fullPath)
    return true
  } catch {
    return false
  }
}

export function buildLocalPostAssetPath(
  folderName: string,
  assetName: string,
  contentMode: PostContentMode | undefined,
  postsBasePathOverride?: string,
) {
  const config = requireLocalRepoConfig()
  const normalizedBase = normalizeRelativePath(
    postsBasePathOverride || config.postsBasePath,
  )

  if (contentMode === 'flat_markdown') {
    return normalizeRelativePath(path.posix.join(normalizedBase, assetName))
  }

  return normalizeRelativePath(path.posix.join(normalizedBase, folderName, assetName))
}
