import { isBundleMode, type PostContentMode } from '@/lib/site-settings'
import { commitGithubFiles } from '@/lib/github-api'
import { requireGithubRepoContext } from '@/lib/github-context'

type CommitPostToGithubInput = {
  folderName: string
  contentMode: PostContentMode
  markdownFileName: string
  markdownContentBase64: string
  localizedMarkdownFiles?: Array<{
    fileName: string
    contentBase64: string
  }>
  assets: Array<{
    name: string
    contentBase64: string
  }>
  removedAssetNames?: string[]
  message: string
  preserveExistingAssets?: boolean
}

async function commitPostToGithub(input: CommitPostToGithubInput) {
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
    ...(
      input.localizedMarkdownFiles?.filter(
        (file) => typeof file.contentBase64 === 'string' && file.contentBase64.trim().length > 0,
      ) || []
    ).map((file) => ({
      path: bundleMode
        ? `${postPath}/${file.fileName}`
        : `${repoConfig.postsBasePath}/${file.fileName}`,
      contentBase64: file.contentBase64,
    })),
    ...assetFiles.map((asset) => ({
      path: `${postPath}/${asset.name}`,
      contentBase64: asset.contentBase64,
    })),
  ]
  const deletedPaths = input.preserveExistingAssets
    ? []
    : (input.removedAssetNames || []).map((name) => `${postPath}/${name}`)
  const fileChanges = [
    ...files.map((file) => ({ path: file.path, action: 'updated' as const })),
    ...deletedPaths.map((path) => ({ path, action: 'deleted' as const })),
  ]

  const commit = await commitGithubFiles({
    files,
    deletePaths: deletedPaths,
    message: input.message,
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

export async function publishPostToGithub(input: Omit<CommitPostToGithubInput, 'message' | 'preserveExistingAssets'>) {
  return commitPostToGithub({
    ...input,
    message: `Publish post: ${input.folderName}`,
  })
}

export async function autoCommitPostToGithub(input: Omit<CommitPostToGithubInput, 'message' | 'preserveExistingAssets' | 'removedAssetNames'>) {
  return commitPostToGithub({
    ...input,
    removedAssetNames: [],
    message: `Auto-save draft: ${input.folderName}`,
    preserveExistingAssets: true,
  })
}
