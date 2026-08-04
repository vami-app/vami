import { requireAuthPage } from '@/lib/auth';
import AdminShell from '@/components/admin/AdminShell';

export default async function AdminLayout({ children }) {
  const adminInfo = await requireAuthPage();
  return <AdminShell permissions={adminInfo.permissions || []}>{children}</AdminShell>;
}
