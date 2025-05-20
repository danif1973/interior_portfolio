import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { csrfMiddleware, generateCSRFToken, setCSRFToken } from './lib/csrf-server';
import { logger } from './lib/logger';

export async function middleware(request: NextRequest) {
  // Log the current request path and method
  logger.debug('Middleware processing', {
    path: request.nextUrl.pathname,
    method: request.method
  }, request);

  // Generate and set CSRF token if it doesn't exist
  if (!request.cookies.get('csrf_token')) {
    try {
      const token = await generateCSRFToken();
      const response = NextResponse.next();
      setCSRFToken(token, response);
      return response;
    } catch (error) {
      logger.error('Failed to generate CSRF token:', error);
      return NextResponse.next();
    }
  }

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

// Configure middleware to run on all paths except static files and api routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 