import { NextResponse } from 'next/server'
import { requireGithubRepoContext } from '@/lib/github-context'
import { listGithubDir } from '@/lib/github-read'
import { normalizePostContentMode } from '@/lib/site-settings'

function isMarkdownFileName(name: string) {
  return /\.md$/i.test(name)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const contentMode = normalizePostContentMode(searchParams.get('mode'))
    const { repoConfig } = await requireGithubRepoContext()
    const basePath = repoConfig.postsBasePath
    const items = await listGithubDir(basePath)

    const posts =
      contentMode === 'flat_markdown'
        ? items
            .filter((item) => item.type === 'file' && isMarkdownFileName(item.name))
            .map((item) => ({
              name: item.name,
              path: item.path,
              kind: 'file' as const,
              markdownFiles: [item.name],
            }))
            .sort((a, b) => b.name.localeCompare(a.name))
        : (await Promise.all(
            items
              .filter((item) => item.type === 'dir')
              .map(async (item) => {
                const folderItems = await listGithubDir(item.path)
                const markdownFiles = folderItems
                  .filter((folderItem) => folderItem.type === 'file' && isMarkdownFileName(folderItem.name))
                  .map((folderItem) => folderItem.name)
                  .sort((a, b) => a.localeCompare(b))

                return {
                  name: item.name,
                  path: item.path,
                  kind: 'folder' as const,
                  markdownFiles,
                }
              }),
          )).sort((a, b) => b.name.localeCompare(a.name))

    return NextResponse.json({
      ok: true,
      posts,
      repo: `${repoConfig.owner}/${repoConfig.repo}`,
      branch: repoConfig.branch,
      basePath,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Not Found') {
      return NextResponse.json({
        ok: true,
        posts: [],
      })
    }

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to load posts.',
      },
      { status: 500 },
    )
  }
}
