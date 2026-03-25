import { getMaintenanceMode } from "@/lib/admin";
import { WrenchIcon, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const maintenance = await getMaintenanceMode();
  const endsAt = maintenance.endsAt ? new Date(maintenance.endsAt) : null;
  const endsFormatted = endsAt
    ? endsAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
    : null;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
      style={{ background: "#060610" }}>

      {/* Mesh bg */}
      <div className="pointer-events-none fixed inset-0 -z-10"
        style={{ background: "radial-gradient(ellipse 70% 50% at 50% 20%, rgba(99,102,241,0.15) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(139,92,246,0.1) 0%, transparent 55%)" }} />

      <div className="max-w-lg w-full">

        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl"
          style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))", border: "1px solid rgba(99,102,241,0.25)" }}>
          <WrenchIcon className="h-9 w-9" style={{ color: "#818cf8" }} />
        </div>

        {/* Badge */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
          style={{ background: "rgba(99,102,241,0.12)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.25)" }}>
          Scheduled Maintenance
        </div>

        <h1 className="text-3xl font-bold text-white sm:text-4xl mb-4">
          We&apos;ll be right back
        </h1>

        <p className="text-gray-400 leading-relaxed mb-6">
          {maintenance.message}
        </p>

        {endsFormatted && (
          <div className="flex items-center justify-center gap-2 rounded-2xl px-5 py-3 mx-auto w-fit mb-8"
            style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}>
            <Clock className="h-4 w-4" style={{ color: "#818cf8" }} />
            <span className="text-sm text-gray-400">
              Expected back by{" "}
              <span className="font-semibold text-gray-200">{endsFormatted}</span>
            </span>
          </div>
        )}

        <p className="text-xs text-gray-700">
          StorecheckAI · In the meantime, follow us for updates.
        </p>
      </div>
    </div>
  );
}
