import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto'
import { cookies } from 'next/headers'
import {
  GITHUB_PAGE_CONFIG_COOKIE,
  GITHUB_REPO_CONFIG_COOKIE,
  GITHUB_OAUTH_STATE_COOKIE,
  GITHUB_SESSION_COOKIE,
} from '@/lib/github-cookie'

export type GithubRepoConfig = {
  owner: string
  repo: string
  branch: string
  postsBasePath: string
}

export type GithubSession = {
  accessToken: string
  user: {
    login: string
    name: string
    avatarUrl: string
  }
  repoConfig: GithubRepoConfig | null
  pageConfig: GithubPageConfig | null
}

export type GithubPageConfig = {
  filePath: string
  mode: 'page' | 'live'
}

function getSessionSecret() {
  const secret = process.env.APP_SESSION_SECRET

  if (!secret) {
    throw new Error('Missing APP_SESSION_SECRET')
  }

  return secret
}

function getSessionKey() {
  return createHash('sha256').update(getSessionSecret()).digest()
}

function encodePayload<T>(value: T) {
  return Buffer.from(JSON.stringify(value), 'utf-8').toString('base64url')
}

function decodePayload<T>(payload: string) {
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as T
}

function serializeEncryptedValue<T>(value: T) {
  const payload = encodePayload(value)
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getSessionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(payload, 'utf-8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return [iv.toString('base64url'), encrypted.toString('base64url'), tag.toString('base64url')].join('.')
}

function deserializeEncryptedValue<T>(rawValue: string) {
  const [ivPart, encryptedPart, tagPart] = rawValue.split('.')

  if (!ivPart || !encryptedPart || !tagPart) {
    return null
  }

  try {
    const decipher = createDecipheriv(
      'aes-256-gcm',
      getSessionKey(),
      Buffer.from(ivPart, 'base64url'),
    )
    decipher.setAuthTag(Buffer.from(tagPart, 'base64url'))

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedPart, 'base64url')),
      decipher.final(),
    ]).toString('utf-8')

    return decodePayload<T>(decrypted)
  } catch {
    return null
  }
}

export async function getGithubSession() {
  const cookieStore = await cookies()
  const rawValue = cookieStore.get(GITHUB_SESSION_COOKIE)?.value

  if (!rawValue) {
    return null
  }

  return deserializeEncryptedValue<GithubSession>(rawValue)
}

export async function requireGithubSession() {
  const session = await getGithubSession()

  if (!session) {
    throw new Error('Please sign in with GitHub first.')
  }

  return session
}

export async function saveGithubSession(session: GithubSession) {
  const cookieStore = await cookies()

  cookieStore.set(GITHUB_SESSION_COOKIE, serializeEncryptedValue(session), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function getGithubPageConfigPreference() {
  const cookieStore = await cookies()
  const rawValue = cookieStore.get(GITHUB_PAGE_CONFIG_COOKIE)?.value

  if (!rawValue) {
    return null
  }

  return deserializeEncryptedValue<GithubPageConfig>(rawValue)
}

export async function saveGithubPageConfigPreference(pageConfig: GithubPageConfig) {
  const cookieStore = await cookies()

  cookieStore.set(GITHUB_PAGE_CONFIG_COOKIE, serializeEncryptedValue(pageConfig), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 180,
  })
}

export async function getGithubRepoConfigPreference() {
  const cookieStore = await cookies()
  const rawValue = cookieStore.get(GITHUB_REPO_CONFIG_COOKIE)?.value

  if (!rawValue) {
    return null
  }

  return deserializeEncryptedValue<GithubRepoConfig>(rawValue)
}

export async function saveGithubRepoConfigPreference(repoConfig: GithubRepoConfig) {
  const cookieStore = await cookies()

  cookieStore.set(GITHUB_REPO_CONFIG_COOKIE, serializeEncryptedValue(repoConfig), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 180,
  })
}

export async function clearGithubSession() {
  const cookieStore = await cookies()
  cookieStore.set(GITHUB_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
}

export async function setGithubOauthState(state: string) {
  const cookieStore = await cookies()
  cookieStore.set(GITHUB_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 10,
  })
}

export async function consumeGithubOauthState() {
  const cookieStore = await cookies()
  const state = cookieStore.get(GITHUB_OAUTH_STATE_COOKIE)?.value || ''
  cookieStore.set(GITHUB_OAUTH_STATE_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
  return state
}

export function generateOauthState() {
  return randomBytes(24).toString('base64url')
}

export function normalizePostsBasePath(input: string) {
  return input.trim().replace(/^\/+|\/+$/g, '')
}

export function normalizePageFilePath(input: string) {
  return input.trim().replace(/^\/+|\/+$/g, '')
}
