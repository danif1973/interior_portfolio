import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { logger } from '@/lib/logger';
import LoginForm from './LoginForm';

export default async function AdminLoginPage() {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get('session_token');

  // If already logged in, redirect to admin dashboard
  if (sessionToken) {
    logger.info('Admin already logged in, redirecting to dashboard');
    redirect('/admin');
  }

  return <LoginForm />;
} 