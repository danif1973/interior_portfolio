import { NextResponse } from 'next/server';

/**
 * @deprecated This API route is no longer used. CSRF token generation has been moved to middleware.
 * See src/middleware.ts for the current implementation.
 */
export async function GET() {
  console.warn('Deprecated: Using /api/csrf endpoint. CSRF token generation has been moved to middleware.');
  return NextResponse.json(
    { 
      success: false, 
      error: 'This endpoint is deprecated. CSRF token generation has been moved to middleware.',
      message: 'Please update your client code to rely on the middleware for CSRF token generation.'
    },
    { status: 410 } // 410 Gone
  );
} 