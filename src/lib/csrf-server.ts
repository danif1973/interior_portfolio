import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';
import { devWarning, checkServerComponentUsage } from './dev-utils';

// CSRF token cookie name
export const CSRF_TOKEN_COOKIE = 'csrf_token';
// CSRF token header name
export const CSRF_TOKEN_HEADER = 'X-CSRF-Token';
// Maximum age for CSRF tokens (1 hour)
export const CSRF_TOKEN_MAX_AGE = 3600;
// Maximum number of failed attempts before rate limiting
export const MAX_FAILED_ATTEMPTS = 10;
// Rate limit window in seconds
export const RATE_LIMIT_WINDOW = 300;

// In-memory store for rate limiting (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; timestamp: number; isAuthenticated: boolean }>();

// Generate a new CSRF token using Web Crypto API
export async function generateCSRFToken(): Promise<string> {
  // Generate 32 random bytes using Web Crypto API
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);
  
  // Convert to hex string
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Get CSRF token from cookies (server-side only)
export function getCSRFToken(): string | undefined {
  checkServerComponentUsage('getCSRFToken');
  const cookieStore = cookies();
  return cookieStore.get(CSRF_TOKEN_COOKIE)?.value;
}

// Set CSRF token in cookies (server-side only)
export function setCSRFToken(token: string, response?: NextResponse): void {
  if (!response) {
    devWarning('cookie', 'Setting CSRF token cookie directly in server component');
    checkServerComponentUsage('setCSRFToken');
  }

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: CSRF_TOKEN_MAX_AGE
  };

  if (response) {
    // Set cookie in response for middleware
    response.cookies.set(CSRF_TOKEN_COOKIE, token, cookieOptions);
  } else {
    // Set cookie directly for server components (with warning in dev)
    const cookieStore = cookies();
    cookieStore.set(CSRF_TOKEN_COOKIE, token, cookieOptions);
  }
}

// Check rate limiting with special handling for authenticated users
export function checkRateLimit(request: NextRequest): boolean {
  const ip = request.ip || 'unknown';
  const now = Date.now();
  const windowStart = now - (RATE_LIMIT_WINDOW * 1000);
  const isAuthenticated = !!request.cookies.get('session_token');
  
  // Clean up old entries
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.timestamp < windowStart) {
      rateLimitStore.delete(key);
    }
  }
  
  const entry = rateLimitStore.get(ip) || { 
    count: 0, 
    timestamp: now,
    isAuthenticated: isAuthenticated
  };

  // Reset count if window has passed or authentication status changed
  if (entry.timestamp < windowStart || entry.isAuthenticated !== isAuthenticated) {
    entry.count = 0;
    entry.timestamp = now;
    entry.isAuthenticated = isAuthenticated;
  }
  
  entry.count++;
  rateLimitStore.set(ip, entry);
  
  // Different limits for authenticated vs unauthenticated users
  const maxAttempts = isAuthenticated ? MAX_FAILED_ATTEMPTS * 2 : MAX_FAILED_ATTEMPTS;
  const isAllowed = entry.count <= maxAttempts;

  // Log rate limit check
  logger.debug('Rate limit check', {
    ip,
    count: entry.count,
    maxAttempts,
    isAuthenticated,
    isAllowed,
    path: request.nextUrl.pathname,
    method: request.method
  }, request);

  if (!isAllowed) {
    logger.warn('Rate limit exceeded', { 
      ip, 
      count: entry.count,
      isAuthenticated,
      path: request.nextUrl.pathname,
      method: request.method
    }, request);
  }
  
  return isAllowed;
}

// Validate CSRF token
export function validateCSRFToken(request: NextRequest): { valid: boolean; reason?: string } {
  const cookieToken = request.cookies.get(CSRF_TOKEN_COOKIE)?.value;
  const headerToken = request.headers.get(CSRF_TOKEN_HEADER);
  const isAuthenticated = !!request.cookies.get('session_token');

  // Log validation attempt with more context
  logger.debug('CSRF validation attempt', {
    path: request.nextUrl.pathname,
    method: request.method,
    hasCookieToken: !!cookieToken,
    hasHeaderToken: !!headerToken,
    isAuthenticated,
    cookieTokenLength: cookieToken?.length,
    headerTokenLength: headerToken?.length
  }, request);

  // Check rate limiting
  if (!checkRateLimit(request)) {
    const message = isAuthenticated 
      ? 'Too many failed attempts. Please try again in a few minutes.'
      : 'Too many failed attempts. Please try again later.';
    
    logger.security('CSRF rate limit exceeded', { 
      ip: request.ip,
      isAuthenticated,
      path: request.nextUrl.pathname
    }, request);
    
    return { 
      valid: false, 
      reason: message
    };
  }

  if (!cookieToken || !headerToken) {
    logger.warn('Missing CSRF token', {
      hasCookieToken: !!cookieToken,
      hasHeaderToken: !!headerToken,
      isAuthenticated,
      path: request.nextUrl.pathname
    }, request);
    return { 
      valid: false, 
      reason: 'Missing CSRF token' 
    };
  }

  const isValid = cookieToken === headerToken;
  if (!isValid) {
    logger.security('CSRF token mismatch', {
      cookieTokenLength: cookieToken.length,
      headerTokenLength: headerToken.length,
      isAuthenticated,
      path: request.nextUrl.pathname
    }, request);
  }

  return { 
    valid: isValid,
    reason: isValid ? undefined : 'Invalid CSRF token'
  };
}

// CSRF middleware
export async function csrfMiddleware(request: NextRequest): Promise<NextResponse | null> {
  // Skip CSRF check for GET requests
  if (request.method === 'GET') {
    return null;
  }

  // Skip CSRF check for public API routes
  if (request.nextUrl.pathname === '/api/contact') {
    logger.debug('Skipping CSRF check for public route', {
      path: request.nextUrl.pathname
    }, request);
    return null;
  }

  // For admin routes, ensure we have a valid token
  if (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/api')) {
    const { valid, reason } = validateCSRFToken(request);
    
    if (!valid) {
      // Generate a new token for the next attempt
      const newToken = await generateCSRFToken();
      logger.security('CSRF validation failed', { reason }, request);
      
      const response = new NextResponse(
        JSON.stringify({ 
          error: 'CSRF validation failed',
          details: reason || 'Please refresh the page and try again.'
        }),
        { 
          status: 403,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache'
          }
        }
      );
      setCSRFToken(newToken, response);
      return response;
    }
  }

  return null;
} 