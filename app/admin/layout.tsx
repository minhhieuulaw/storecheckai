import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/server-auth";
import { isAdminEmail } from "@/lib/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect("/login?from=/admin");
  if (!isAdminEmail(session.email)) redirect("/dashboard");

  return (
    <div className="min-h-screen" style={{ background: "#060610" }}>
      {children}
    </div>
  );
}
