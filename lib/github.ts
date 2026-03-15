import { isBundleMode, type PostContentMode } from '@/lib/site-settings'
import { commitGithubFiles } from '@/lib/github-api'
import { requireGithubRepoContext } from '@/lib/github-context'

export async function publishPostToGithub(input: {
  folderName: string
  contentMode: PostContentMode
  markdownFileName: string
  markdownContentBase64: string
  assets: Array<{
    name: string
    contentBase64: string
  }>
  removedAssetNames?: string[]
}) {
  const { token, repoConfig } = await requireGithubRepoContext()
  const bundleMode = isBundleMode(input.contentMode)
  const postPath = bundleMode
    ? `${repoConfig.postsBasePath}/${input.folderName}`
    : repoConfig.postsBasePath
  const assetFiles = input.assets.filter(
    (asset) => typeof asset.contentBase64 === 'string' && asset.contentBase64.trim().length > 0,
  )

  const files = [
    {
      path: bundleMode
        ? `${postPath}/${input.markdownFileName}`
        : `${repoConfig.postsBasePath}/${input.markdownFileName}`,
      contentBase64: input.markdownContentBase64,
    },
    ...assetFiles.map((asset) => ({
      path: `${postPath}/${asset.name}`,
      contentBase64: asset.contentBase64,
    })),
  ]
  const deletedPaths = (input.removedAssetNames || []).map((name) => `${postPath}/${name}`)
  const fileChanges = [
    ...files.map((file) => ({ path: file.path, action: 'updated' as const })),
    ...deletedPaths.map((path) => ({ path, action: 'deleted' as const })),
  ]

  const commit = await commitGithubFiles({
    files,
    deletePaths: deletedPaths,
    message: `Publish post: ${input.folderName}`,
    token,
    context: {
      owner: repoConfig.owner,
      repo: repoConfig.repo,
      branch: repoConfig.branch,
    },
  })

  return {
    path: `${postPath}/`,
    commitCount: 1,
    fileCount: files.length + deletedPaths.length,
    fileChanges,
    commitSha: commit.sha,
    repo: `${repoConfig.owner}/${repoConfig.repo}`,
    branch: repoConfig.branch,
  }
}
