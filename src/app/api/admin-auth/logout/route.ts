import { NextRequest, NextResponse } from 'next/server';
import Authentication from '@/lib/models/authentication';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get('admin_session')?.value;
  logger.debug('[Logout] Session token from cookie', { sessionToken });

  if (!sessionToken) {
    // No session to log out
    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    logger.info('[Logout] No session token found, nothing to remove');
    return response;
  }
  // Remove session from DB
  const result = await Authentication.updateOne(
    { key: 'admin_password' },
    { $pull: { sessions: { token: sessionToken } } }
  );
  logger.info('[Logout] Session removal result', { result });
  // Clear cookie
  const response = NextResponse.json({ success: true });
  response.cookies.set('admin_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
} 