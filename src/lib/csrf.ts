import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';

// CSRF token cookie name
export const CSRF_TOKEN_COOKIE = 'csrf_token';
// CSRF token header name
export const CSRF_TOKEN_HEADER = 'X-CSRF-Token';
// Maximum age for CSRF tokens (1 hour)
export const CSRF_TOKEN_MAX_AGE = 3600;
// Maximum number of failed attempts before rate limiting
export const MAX_FAILED_ATTEMPTS = 5;
// Rate limit window in seconds
export const RATE_LIMIT_WINDOW = 300; // 5 minutes

// In-memory store for rate limiting (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; timestamp: number }>();

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

// Get CSRF token from cookies
export function getCSRFToken(): string | undefined {
  const cookieStore = cookies();
  return cookieStore.get(CSRF_TOKEN_COOKIE)?.value;
}

// Set CSRF token in cookies
export function setCSRFToken(token: string, response?: NextResponse): void {
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
    // Set cookie directly for server components
    const cookieStore = cookies();
    cookieStore.set(CSRF_TOKEN_COOKIE, token, cookieOptions);
  }
}

// Check rate limiting
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - (RATE_LIMIT_WINDOW * 1000);
  
  // Clean up old entries
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.timestamp < windowStart) {
      rateLimitStore.delete(key);
    }
  }
  
  const entry = rateLimitStore.get(ip) || { count: 0, timestamp: now };
  if (entry.timestamp < windowStart) {
    entry.count = 0;
    entry.timestamp = now;
  }
  
  entry.count++;
  rateLimitStore.set(ip, entry);
  
  const isAllowed = entry.count <= MAX_FAILED_ATTEMPTS;
  if (!isAllowed) {
    logger.warn('Rate limit exceeded', { ip, count: entry.count }, undefined);
  }
  
  return isAllowed;
}

// Validate CSRF token
export function validateCSRFToken(request: NextRequest): { valid: boolean; reason?: string } {
  const cookieToken = request.cookies.get(CSRF_TOKEN_COOKIE)?.value;
  const headerToken = request.headers.get(CSRF_TOKEN_HEADER);
  const ip = request.ip || 'unknown';

  // Log validation attempt
  logger.debug('CSRF validation attempt', {
    path: request.nextUrl.pathname,
    method: request.method,
    hasCookieToken: !!cookieToken,
    hasHeaderToken: !!headerToken
  }, request);

  // Check rate limiting
  if (!checkRateLimit(ip)) {
    logger.security('CSRF rate limit exceeded', { ip }, request);
    return { 
      valid: false, 
      reason: 'Too many failed attempts. Please try again later.' 
    };
  }

  if (!cookieToken || !headerToken) {
    logger.warn('Missing CSRF token', {
      hasCookieToken: !!cookieToken,
      hasHeaderToken: !!headerToken
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
      headerTokenLength: headerToken.length
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