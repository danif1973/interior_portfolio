import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import Authentication from '@/lib/models/authentication';
import { redirect } from 'next/navigation';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
}

export default async function AdminSessionGuard({ children }: Props) {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get('admin_session')?.value;
  logger.debug('[AdminSessionGuard] Session token from cookie', { sessionToken });
  const record = await Authentication.findOne({ key: 'admin_password', 'sessions.token': sessionToken });
  logger.debug('[AdminSessionGuard] DB record found', { found: !!record, record });
  if (!sessionToken || !record) {
    logger.warn('[AdminSessionGuard] Invalid or missing session, redirecting', { sessionToken });
    redirect('/admin/login');
  }
  return <>{children}</>;
} 