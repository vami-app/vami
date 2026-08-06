import { getDashboardStats } from '@/modules/admin';
import { DashboardPageFeature } from '@/features/admin/dashboard-page';

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  return <DashboardPageFeature stats={stats} />;
}
