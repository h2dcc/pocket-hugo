import { NextRequest, NextResponse } from 'next/server'
import { getGithubUser, listUserRepos } from '@/lib/github-api'
import {
  consumeGithubOauthState,
  getGithubPageConfigPreference,
  getGithubRepoConfigPreference,
  saveGithubSession,
} from '@/lib/github-session'

function getBaseUrl(request: NextRequest) {
  return process.env.APP_URL || request.nextUrl.origin
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code') || ''
  const state = request.nextUrl.searchParams.get('state') || ''
  const expectedState = await consumeGithubOauthState()

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL('/app?error=github_oauth_state', getBaseUrl(request)))
  }

  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/app?error=github_oauth_config', getBaseUrl(request)))
  }

  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'hugoweb',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: `${getBaseUrl(request)}/api/auth/callback`,
    }),
    cache: 'no-store',
  })

  const tokenData = (await tokenResponse.json()) as {
    access_token?: string
    error?: string
    error_description?: string
  }

  if (!tokenResponse.ok || !tokenData.access_token) {
    const errorCode = tokenData.error || 'github_oauth_exchange'
    return NextResponse.redirect(
      new URL(`/app?error=${encodeURIComponent(errorCode)}`, getBaseUrl(request)),
    )
  }

  const githubUser = await getGithubUser(tokenData.access_token)
  const savedRepoConfig = await getGithubRepoConfigPreference()
  const savedPageConfig = await getGithubPageConfigPreference()
  let repoConfig = null

  if (savedRepoConfig) {
    const repos = await listUserRepos(tokenData.access_token)
    const matchedRepo = repos.find(
      (repo) =>
        repo.owner.login === savedRepoConfig.owner &&
        repo.name === savedRepoConfig.repo,
    )

    if (matchedRepo) {
      repoConfig = {
        ...savedRepoConfig,
        branch: savedRepoConfig.branch || matchedRepo.default_branch,
      }
    }
  }

  await saveGithubSession({
    accessToken: tokenData.access_token,
    user: {
      login: githubUser.login,
      name: githubUser.name || githubUser.login,
      avatarUrl: githubUser.avatar_url,
    },
    repoConfig,
    pageConfig: savedPageConfig,
  })

  return NextResponse.redirect(new URL('/app', getBaseUrl(request)))
}
