import { normalizePostsBasePath, requireGithubSession } from '@/lib/github-session'

export async function requireGithubRepoContext() {
  const session = await requireGithubSession()

  if (!session.repoConfig) {
    throw new Error('Please choose a GitHub repository and posts path first.')
  }

  return {
    token: session.accessToken,
    repoConfig: {
      owner: session.repoConfig.owner,
      repo: session.repoConfig.repo,
      branch: session.repoConfig.branch,
      postsBasePath: normalizePostsBasePath(session.repoConfig.postsBasePath),
    },
    user: session.user,
  }
}
