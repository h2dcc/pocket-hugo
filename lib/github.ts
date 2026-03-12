const GITHUB_API_BASE = 'https://api.github.com'

type PutFileInput = {
  path: string
  contentBase64: string
  message: string
}

type GithubContentResponse = {
  sha?: string
  message?: string
}

async function getExistingFileSha(path: string): Promise<string | undefined> {
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO
  const branch = process.env.GITHUB_BRANCH || 'main'
  const token = process.env.GITHUB_TOKEN

  if (!owner || !repo || !token) {
    throw new Error('GitHub 环境变量未配置完整')
  }

  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`

  const response = await fetch(`${url}?ref=${encodeURIComponent(branch)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
    cache: 'no-store',
  })

  if (response.status === 404) {
    return undefined
  }

  const data = (await response.json()) as GithubContentResponse

  if (!response.ok) {
    throw new Error(data?.message || `读取 GitHub 文件失败: ${path}`)
  }

  return data.sha
}

async function putFile({
  path,
  contentBase64,
  message,
}: PutFileInput) {
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO
  const branch = process.env.GITHUB_BRANCH || 'main'
  const token = process.env.GITHUB_TOKEN

  if (!owner || !repo || !token) {
    throw new Error('GitHub 环境变量未配置完整')
  }

  const existingSha = await getExistingFileSha(path)

  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      content: contentBase64,
      branch,
      ...(existingSha ? { sha: existingSha } : {}),
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.message || `GitHub 文件写入失败: ${path}`)
  }

  return data
}

export async function publishPostToGithub(input: {
  folderName: string
  indexMdBase64: string
  assets: Array<{
    name: string
    contentBase64: string
  }>
}) {
  const basePath = process.env.GITHUB_POSTS_BASE_PATH || 'content/posts'
  const postPath = `${basePath}/${input.folderName}`

  const results = []

  results.push(
    await putFile({
      path: `${postPath}/index.md`,
      contentBase64: input.indexMdBase64,
      message: `Publish post: ${input.folderName}`,
    }),
  )

  for (const asset of input.assets) {
    results.push(
      await putFile({
        path: `${postPath}/${asset.name}`,
        contentBase64: asset.contentBase64,
        message: `Upload asset for post: ${input.folderName}`,
      }),
    )
  }

  return {
    path: `${postPath}/`,
    commits: results,
  }
}