import { getAdminStats, getMaintenanceMode } from "@/lib/admin";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [stats, maintenance] = await Promise.all([
    getAdminStats(),
    getMaintenanceMode(),
  ]);

  return <AdminDashboard stats={stats} maintenance={maintenance} />;
}
