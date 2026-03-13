import { getGithubFileContent as getFileContent, listGithubDir as listDir } from '@/lib/github-api'
import { requireGithubRepoContext } from '@/lib/github-context'

export async function getGithubFileContent(path: string): Promise<string> {
  const { token, repoConfig } = await requireGithubRepoContext()

  return getFileContent(path, token, {
    owner: repoConfig.owner,
    repo: repoConfig.repo,
    branch: repoConfig.branch,
  })
}

export async function listGithubDir(path: string) {
  const { token, repoConfig } = await requireGithubRepoContext()

  return listDir(path, token, {
    owner: repoConfig.owner,
    repo: repoConfig.repo,
    branch: repoConfig.branch,
  })
}
