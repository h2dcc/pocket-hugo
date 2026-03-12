import { NextRequest, NextResponse } from 'next/server'
import { getGithubFileContent, listGithubDir } from '@/lib/github-read'
import { parseIndexMdToDraft } from '@/lib/post-parse'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const folderName = String(body.folderName || '').trim()

    if (!folderName) {
      return NextResponse.json(
        { ok: false, error: '缺少 folderName' },
        { status: 400 },
      )
    }

    const basePath = process.env.GITHUB_POSTS_BASE_PATH || 'content/posts'
    const postPath = `${basePath}/${folderName}`

    const indexContent = await getGithubFileContent(`${postPath}/index.md`)
    const draft = parseIndexMdToDraft(folderName, indexContent)

    const dirItems = await listGithubDir(postPath)
    const remoteAssets = dirItems
      .filter((item) => item.type === 'file' && item.name !== 'index.md')
      .map((item) => ({
        name: item.name,
        mimeType: item.name.toLowerCase().endsWith('.webp')
          ? 'image/webp'
          : item.name.toLowerCase().endsWith('.png')
            ? 'image/png'
            : item.name.toLowerCase().endsWith('.jpg') || item.name.toLowerCase().endsWith('.jpeg')
              ? 'image/jpeg'
              : 'application/octet-stream',
        contentBase64: '',
        previewUrl: item.download_url || '',
      }))

    return NextResponse.json({
      ok: true,
      draft: {
        ...draft,
        assets: remoteAssets,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : '读取文章失败',
      },
      { status: 500 },
    )
  }
}