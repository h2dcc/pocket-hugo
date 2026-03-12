const GITHUB_API_BASE = 'https://api.github.com'

type GithubContentFile = {
  name: string
  path: string
  sha: string
  size: number
  type: 'file'
  content?: string
  encoding?: string
  download_url?: string | null
}

type GithubContentDirItem = {
  name: string
  path: string
  sha: string
  size: number
  type: 'file' | 'dir'
  download_url?: string | null
}

function getGithubEnv() {
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO
  const branch = process.env.GITHUB_BRANCH || 'main'
  const token = process.env.GITHUB_TOKEN

  if (!owner || !repo || !token) {
    throw new Error('GitHub 环境变量未配置完整')
  }

  return { owner, repo, branch, token }
}

export async function getGithubFileContent(path: string): Promise<string> {
  const { owner, repo, branch, token } = getGithubEnv()

  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`

  const response = await fetch(`${url}?ref=${encodeURIComponent(branch)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
    cache: 'no-store',
  })

  const data = (await response.json()) as GithubContentFile & { message?: string }

  if (!response.ok) {
    throw new Error(data?.message || `读取 GitHub 文件失败: ${path}`)
  }

  if (!data.content || data.encoding !== 'base64') {
    throw new Error(`GitHub 文件内容为空或编码不支持: ${path}`)
  }

  return Buffer.from(data.content, 'base64').toString('utf-8')
}

export async function listGithubDir(path: string): Promise<GithubContentDirItem[]> {
  const { owner, repo, branch, token } = getGithubEnv()

  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`

  const response = await fetch(`${url}?ref=${encodeURIComponent(branch)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
    cache: 'no-store',
  })

  const data = (await response.json()) as (GithubContentDirItem[] & { message?: string })

  if (!response.ok) {
    throw new Error((data as unknown as { message?: string })?.message || `读取 GitHub 目录失败: ${path}`)
  }

  return data as GithubContentDirItem[]
}