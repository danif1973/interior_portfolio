import AdminSessionGuard from './AdminSessionGuard';
import AdminDashboardClient from './AdminDashboardClient';

export default function Page() {
  return (
    <AdminSessionGuard>
      <AdminDashboardClient />
    </AdminSessionGuard>
  );
} 