import { requireAuthPage } from '@/lib/auth';
import { AdminShellTemplate } from '@/components/templates/admin-shell';

export default async function AdminLayout({ children }) {
  const adminInfo = await requireAuthPage();
  return <AdminShellTemplate permissions={adminInfo.permissions || []}>{children}</AdminShellTemplate>;
}
