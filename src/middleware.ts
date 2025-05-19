import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { csrfMiddleware } from './lib/csrf';

export async function middleware(request: NextRequest) {
  // Log the current request path and method
  console.log(`Middleware processing: ${request.method} ${request.nextUrl.pathname}`);

  // Handle CSRF protection
  const csrfResponse = await csrfMiddleware(request);
  if (csrfResponse) {
    console.log('CSRF middleware response:', csrfResponse.status);
    return csrfResponse;
  }

  // Check if the request is for the admin page
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Get the session token from cookies
    const sessionToken = request.cookies.get('admin_session')?.value;
    console.log('Session token present:', !!sessionToken);

    // If no session token exists, redirect to login
    if (!sessionToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/:path*'
  ]
}; 