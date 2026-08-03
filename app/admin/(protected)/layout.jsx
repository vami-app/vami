import { requireAuthPage } from '@/lib/auth';
import AdminShell from '@/components/admin/AdminShell';

export default async function AdminLayout({ children }) {
  await requireAuthPage();
  return <AdminShell>{children}</AdminShell>;
}
