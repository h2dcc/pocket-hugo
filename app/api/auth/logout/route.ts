import { NextResponse } from 'next/server'
import { clearGithubSession } from '@/lib/github-session'

export async function POST() {
  await clearGithubSession()
  return NextResponse.json({ ok: true })
}
