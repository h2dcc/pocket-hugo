import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const GITHUB_SESSION_COOKIE = 'hugoweb_github_session'

function isAuthenticated(request: NextRequest) {
  return Boolean(request.cookies.get(GITHUB_SESSION_COOKIE)?.value)
}

export function middleware(request: NextRequest) {
  if (isAuthenticated(request)) {
    return NextResponse.next()
  }

  const url = request.nextUrl.clone()
  url.pathname = '/'
  url.searchParams.set('auth', 'required')
  url.searchParams.set('from', request.nextUrl.pathname)

  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/new', '/editor/:path*', '/publish/:path*'],
}
