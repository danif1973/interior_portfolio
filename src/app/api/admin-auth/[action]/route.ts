import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import Authentication from '@/lib/models/authentication';
import connectDB from '@/lib/mongodb/mongoDB';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

const PASSWORD_KEY = 'admin_password';
const PASSWORD_RULES = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{6,}$/;

async function getPasswordRecord() {
  await connectDB();
  return Authentication.findOne({ key: PASSWORD_KEY });
}

export async function GET(request: NextRequest, { params }: { params: { action: string } }) {
  const { action } = params;

  if (action === 'status') {
    const record = await getPasswordRecord();
    return NextResponse.json({ isSet: !!record });
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function POST(request: NextRequest, { params }: { params: { action: string } }) {
  const { action } = params;
  await connectDB();

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // SET INITIAL PASSWORD
  if (action === 'set') {
    logger.debug('[admin-auth/set] Start password set');
    const { password, confirmPassword } = body as { password: string; confirmPassword: string };
    logger.debug('[admin-auth/set] Input', { passwordPresent: !!password, confirmPasswordPresent: !!confirmPassword });
    try {
      const existing = await Authentication.findOne({ key: PASSWORD_KEY });
      logger.debug('[admin-auth/set] Existing record', { exists: !!existing });
      if (existing) {
        logger.warn('[admin-auth/set] Password already set');
        return NextResponse.json({ error: 'Password already set.' }, { status: 400 });
      }
      if (!password || !confirmPassword) {
        logger.warn('[admin-auth/set] Missing password or confirmation');
        return NextResponse.json({ error: 'Password and confirmation required.' }, { status: 400 });
      }
      if (password !== confirmPassword) {
        logger.warn('[admin-auth/set] Passwords do not match');
        return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 });
      }
      if (!PASSWORD_RULES.test(password)) {
        logger.warn('[admin-auth/set] Password does not meet complexity requirements');
        return NextResponse.json({ error: 'Password does not meet complexity requirements.' }, { status: 400 });
      }
      const hash = await bcrypt.hash(password, 12);
      logger.debug('[admin-auth/set] Password hashed', { hashLength: hash.length });
      const created = await Authentication.create({ key: PASSWORD_KEY, value: hash });
      logger.info('[admin-auth/set] Password hash stored', { id: created._id });
      return NextResponse.json({ success: true });
    } catch (err) {
      logger.error('[admin-auth/set] Error', { error: err instanceof Error ? err.message : String(err) });
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }

  // CHANGE PASSWORD
  if (action === 'change') {
    const { oldPassword, newPassword, confirmPassword } = body as { oldPassword: string; newPassword: string; confirmPassword: string };
    const record = await Authentication.findOne({ key: PASSWORD_KEY });
    if (!record) {
      return NextResponse.json({ error: 'No password set.' }, { status: 400 });
    }
    const isMatch = await bcrypt.compare(oldPassword, record.value);
    if (!isMatch) {
      return NextResponse.json({ error: 'Old password is incorrect.' }, { status: 401 });
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 });
    }
    if (!PASSWORD_RULES.test(newPassword)) {
      return NextResponse.json({ error: 'Password does not meet complexity requirements.' }, { status: 400 });
    }
    record.value = await bcrypt.hash(newPassword, 12);
    await record.save();
    return NextResponse.json({ success: true });
  }

  // LOGIN
  if (action === 'login') {
    const { password } = body as { password: string };
    const record = await Authentication.findOne({ key: PASSWORD_KEY });
    if (!record) {
      logger.warn('[Login] No password set');
      return NextResponse.json({ error: 'No password set.' }, { status: 400 });
    }
    const isMatch = await bcrypt.compare(password, record.value);
    if (!isMatch) {
      logger.warn('[Login] Invalid password attempt');
      return NextResponse.json({ error: 'Invalid password.' }, { status: 401 });
    }

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    logger.debug('[Login] Creating new session', {
      createdAt: now,
      expiresAt,
      tokenLength: sessionToken.length
    });

    // Store session token in DB with expiration
    if (!Array.isArray(record.sessions)) record.sessions = [];
    record.sessions.push({ 
      token: sessionToken, 
      createdAt: now,
      expiresAt: expiresAt
    });
    
    try {
      await record.save();
      logger.info('[Login] Session created successfully', {
        createdAt: now,
        expiresAt,
        activeSessions: record.sessions.length
      });
    } catch (error) {
      logger.error('[Login] Failed to save session', { error });
      return NextResponse.json({ error: 'Failed to create session.' }, { status: 500 });
    }
    
    // Set cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day to match session expiration
    });
    return response;
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
} 