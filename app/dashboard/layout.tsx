import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/server-auth";
import { Sidebar } from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect("/login?from=/dashboard");

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#060610" }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
