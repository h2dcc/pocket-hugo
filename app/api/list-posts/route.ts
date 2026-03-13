import { NextResponse } from 'next/server'
import { requireGithubRepoContext } from '@/lib/github-context'
import { listGithubDir } from '@/lib/github-read'

export async function GET() {
  try {
    const { repoConfig } = await requireGithubRepoContext()
    const basePath = repoConfig.postsBasePath
    const items = await listGithubDir(basePath)

    const folders = items
      .filter((item) => item.type === 'dir')
      .map((item) => ({
        name: item.name,
        path: item.path,
      }))
      .sort((a, b) => b.name.localeCompare(a.name))

    return NextResponse.json({
      ok: true,
      posts: folders,
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
