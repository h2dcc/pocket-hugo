const GITHUB_API_BASE = 'https://api.github.com'

export type GithubRepoSummary = {
  id: number
  name: string
  full_name: string
  private: boolean
  default_branch: string
  owner: {
    login: string
  }
  permissions?: {
    admin?: boolean
    push?: boolean
    pull?: boolean
  }
}

export type GithubContentFile = {
  name: string
  path: string
  sha: string
  size: number
  type: 'file'
  content?: string
  encoding?: string
  download_url?: string | null
}

export type GithubContentDirItem = {
  name: string
  path: string
  sha: string
  size: number
  type: 'file' | 'dir'
  download_url?: string | null
}

type RepoContext = {
  owner: string
  repo: string
  branch: string
}

type GithubErrorPayload = {
  message?: string
}

function buildHeaders(token: string, init?: HeadersInit): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'hugoweb',
    ...init,
  }
}

export async function githubRequest<T>(
  path: string,
  token: string,
  init?: RequestInit,
) {
  const response = await fetch(`${GITHUB_API_BASE}${path}`, {
    ...init,
    headers: buildHeaders(token, init?.headers),
    cache: 'no-store',
  })

  const data = (await response.json()) as T & GithubErrorPayload

  if (!response.ok) {
    throw new Error(data?.message || 'GitHub request failed.')
  }

  return data as T
}

export async function listUserRepos(token: string) {
  const repos = await githubRequest<GithubRepoSummary[]>(
    '/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member',
    token,
  )

  return repos.filter((repo) => repo.permissions?.push)
}

export async function getGithubUser(token: string) {
  return githubRequest<{
    login: string
    name: string | null
    avatar_url: string
  }>('/user', token)
}

function buildContentsPath(path: string, context: RepoContext) {
  const normalizedPath = path.trim().replace(/^\/+|\/+$/g, '')
  const encodedPath = encodeURIComponent(normalizedPath).replace(/%2F/g, '/')
  const suffix = encodedPath ? `/${encodedPath}` : ''
  return `/repos/${context.owner}/${context.repo}/contents${suffix}?ref=${encodeURIComponent(context.branch)}`
}

export async function getGithubFileContent(path: string, token: string, context: RepoContext) {
  const data = await githubRequest<GithubContentFile>(buildContentsPath(path, context), token)

  if (!data.content || data.encoding !== 'base64') {
    throw new Error(`GitHub file is empty or not base64 encoded: ${path}`)
  }

  return Buffer.from(data.content, 'base64').toString('utf-8')
}

export async function listGithubDir(path: string, token: string, context: RepoContext) {
  return githubRequest<GithubContentDirItem[]>(buildContentsPath(path, context), token)
}

export async function getExistingFileSha(path: string, token: string, context: RepoContext) {
  try {
    const data = await githubRequest<GithubContentFile>(buildContentsPath(path, context), token)
    return data.sha
  } catch (error) {
    if (error instanceof Error && error.message === 'Not Found') {
      return undefined
    }

    throw error
  }
}

export async function putGithubFile(input: {
  path: string
  contentBase64: string
  message: string
  token: string
  context: RepoContext
}) {
  const existingSha = await getExistingFileSha(input.path, input.token, input.context)
  const encodedPath = encodeURIComponent(input.path).replace(/%2F/g, '/')

  return githubRequest(
    `/repos/${input.context.owner}/${input.context.repo}/contents/${encodedPath}`,
    input.token,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: input.message,
        content: input.contentBase64,
        branch: input.context.branch,
        ...(existingSha ? { sha: existingSha } : {}),
      }),
    },
  )
}
