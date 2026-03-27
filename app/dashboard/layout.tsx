import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/server-auth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect("/login?from=/dashboard");

  return (
    <DashboardShell>
      {children}
    </DashboardShell>
  );
}
