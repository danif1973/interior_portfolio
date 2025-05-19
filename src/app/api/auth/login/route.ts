import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { password } = data;

    // Log login attempt (without sensitive data)
    logger.info('Admin login attempt', {
      ip: request.ip,
      userAgent: request.headers.get('user-agent')
    }, request);

    // In a real application, you would validate against a secure backend
    // and use proper password hashing
    if (password === process.env.ADMIN_PASSWORD) {
      // Set a session cookie
      const cookieStore = cookies();
      cookieStore.set('session_token', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60 // 1 day
      });

      logger.info('Admin login successful', {
        ip: request.ip
      }, request);

      return NextResponse.json({ message: 'Login successful' });
    } else {
      logger.warn('Admin login failed - invalid password', {
        ip: request.ip
      }, request);

      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }
  } catch (error) {
    logger.error('Login error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: request.ip
    }, request);

    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
} 