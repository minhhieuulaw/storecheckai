import { getAdminUsers } from "@/lib/admin";
import { AdminUsers } from "@/components/admin/AdminUsers";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const sp     = await searchParams;
  const search = sp.search || undefined;
  const page   = Math.max(1, parseInt(sp.page || "1", 10));

  const { users, total } = await getAdminUsers(search, page, 20);

  return <AdminUsers users={users} total={total} search={search ?? ""} page={page} />;
}
