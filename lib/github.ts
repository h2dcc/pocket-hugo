import { putGithubFile } from '@/lib/github-api'
import { requireGithubRepoContext } from '@/lib/github-context'

export async function publishPostToGithub(input: {
  folderName: string
  indexMdBase64: string
  assets: Array<{
    name: string
    contentBase64: string
  }>
}) {
  const { token, repoConfig } = await requireGithubRepoContext()
  const postPath = `${repoConfig.postsBasePath}/${input.folderName}`
  const commits = []

  commits.push(
    await putGithubFile({
      path: `${postPath}/index.md`,
      contentBase64: input.indexMdBase64,
      message: `Publish post: ${input.folderName}`,
      token,
      context: {
        owner: repoConfig.owner,
        repo: repoConfig.repo,
        branch: repoConfig.branch,
      },
    }),
  )

  for (const asset of input.assets) {
    commits.push(
      await putGithubFile({
        path: `${postPath}/${asset.name}`,
        contentBase64: asset.contentBase64,
        message: `Upload asset for post: ${input.folderName}`,
        token,
        context: {
          owner: repoConfig.owner,
          repo: repoConfig.repo,
          branch: repoConfig.branch,
        },
      }),
    )
  }

  return {
    path: `${postPath}/`,
    commits,
    repo: `${repoConfig.owner}/${repoConfig.repo}`,
    branch: repoConfig.branch,
  }
}
