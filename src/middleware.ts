import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { csrfMiddleware } from './lib/csrf-server';
import { logger } from './lib/logger';

export async function middleware(request: NextRequest) {
  // Log the current request path and method
  logger.debug('Middleware processing', {
    path: request.nextUrl.pathname,
    method: request.method
  }, request);

  // Handle CSRF protection
  const csrfResponse = await csrfMiddleware(request);
  if (csrfResponse) {
    logger.debug('CSRF middleware response', {
      status: csrfResponse.status
    }, request);
    return csrfResponse;
  }

  // Check if the request is for the admin page (excluding login)
  if (request.nextUrl.pathname.startsWith('/admin') && 
      !request.nextUrl.pathname.startsWith('/admin/login')) {
    // Get the session token from cookies
    const sessionToken = request.cookies.get('admin_session')?.value;
    logger.debug('Session check', {
      hasToken: !!sessionToken,
      path: request.nextUrl.pathname
    }, request);

    // If no session token exists, redirect to login
    if (!sessionToken) {
      logger.info('Redirecting to login', {
        from: request.nextUrl.pathname
      }, request);
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