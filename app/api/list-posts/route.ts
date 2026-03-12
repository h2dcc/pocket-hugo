import { NextResponse } from 'next/server'
import { listGithubDir } from '@/lib/github-read'

export async function GET() {
  try {
    const basePath = process.env.GITHUB_POSTS_BASE_PATH || 'content/posts'
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
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : '读取文章列表失败',
      },
      { status: 500 },
    )
  }
}