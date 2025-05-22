import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import Authentication from '@/lib/models/authentication';
import { redirect } from 'next/navigation';
import { logger } from '@/lib/logger';
import connectDB from '@/lib/mongodb/mongoDB';
import mongoose from 'mongoose';

interface Props {
  children: ReactNode;
}

const CONNECTION_STATES: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting'
} as const;

async function ensureDatabaseConnection() {
  try {
    // Check if we already have a connection
    if (mongoose.connection.readyState === 1) {
      logger.debug('[AdminSessionGuard] Database already connected', { 
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        name: mongoose.connection.name 
      });
      return;
    }

    logger.debug('[AdminSessionGuard] Establishing database connection...', {
      readyState: mongoose.connection.readyState,
      state: CONNECTION_STATES[mongoose.connection.readyState] || 'unknown'
    });

    // Connect to database with timeout
    const connectionPromise = connectDB();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database connection timeout')), 5000);
    });

    await Promise.race([connectionPromise, timeoutPromise]);
    
    logger.debug('[AdminSessionGuard] Database connection established', {
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name
    });
  } catch (error) {
    logger.error('[AdminSessionGuard] Database connection failed', { 
      error,
      readyState: mongoose.connection.readyState,
      state: CONNECTION_STATES[mongoose.connection.readyState] || 'unknown'
    });
    throw error;
  }
}

export default async function AdminSessionGuard({ children }: Props) {
  try {
    // Ensure database connection is ready before proceeding
    await ensureDatabaseConnection();
    
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('admin_session')?.value;
    logger.debug('[AdminSessionGuard] Session token from cookie', { sessionToken });

    if (!sessionToken) {
      logger.warn('[AdminSessionGuard] No session token found, redirecting');
      redirect('/admin/login');
    }

    // Set a shorter timeout for the session check
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Session check timed out')), 5000);
    });

    const sessionCheckPromise = Authentication.findOne(
      { key: 'admin_password', 'sessions.token': sessionToken },
      { maxTimeMS: 5000 } // Set MongoDB operation timeout to 5 seconds
    );

    const record = await Promise.race([sessionCheckPromise, timeoutPromise])
      .catch((error) => {
        logger.error('[AdminSessionGuard] Session check failed', { 
          error,
          readyState: mongoose.connection.readyState,
          state: CONNECTION_STATES[mongoose.connection.readyState] || 'unknown'
        });
        redirect('/admin/login?error=timeout');
      });

    if (!record) {
      logger.warn('[AdminSessionGuard] Session not found in database, redirecting');
      redirect('/admin/login?error=invalid_session');
    }

    logger.debug('[AdminSessionGuard] Session validated successfully', {
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name
    });
    return <>{children}</>;
  } catch (error) {
    logger.error('[AdminSessionGuard] Error validating session', { 
      error,
      readyState: mongoose.connection.readyState,
      state: CONNECTION_STATES[mongoose.connection.readyState] || 'unknown'
    });
    redirect('/admin/login?error=server_error');
  }
} 