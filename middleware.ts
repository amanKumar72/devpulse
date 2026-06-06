import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl

  // Check if it's a protected page or API route
  const isProtectedRoute = pathname.startsWith('/bookmarks') || pathname.startsWith('/submit') || pathname.startsWith('/profile')
  const isProtectedApiRoute = pathname.startsWith('/api/bookmarks')

  if (isProtectedRoute && !token) {
    const signinUrl = new URL('/signin', request.url)
    signinUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signinUrl)
  }

  if (isProtectedApiRoute && !token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.next()
}

// Config to limit middleware execution
export const config = {
  matcher: ['/bookmarks/:path*', '/submit/:path*', '/profile/:path*', '/api/bookmarks/:path*'],
}
