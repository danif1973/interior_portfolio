import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Skip authentication check for the login page
  if (request.nextUrl.pathname === '/admin/login') {
    return NextResponse.next();
  }

  // Check if the request is for the admin page
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Get the session token from cookies
    const sessionToken = request.cookies.get('admin_session')?.value;

    // If no session token exists, redirect to login
    if (!sessionToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: '/admin/:path*',
}; 