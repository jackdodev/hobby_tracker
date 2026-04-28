import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const AUTH_PAGES = ['/login', '/signup']

export function middleware(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value
  const { pathname } = request.nextUrl

  const isAuthPage = AUTH_PAGES.includes(pathname)

  if (isAuthPage) {
    if (userId) return NextResponse.redirect(new URL('/', request.url))
    return NextResponse.next()
  }

  if (!userId) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
