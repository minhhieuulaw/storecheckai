import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/server-auth";
import { BillingDashboard } from "@/components/dashboard/BillingDashboard";

export default async function BillingPage() {
  const user = await getServerUser();
  if (!user) redirect("/login?from=/dashboard/billing");

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Billing & Plans</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your subscription and usage.</p>
      </div>
      <BillingDashboard
        plan={user.plan}
        checksRemaining={user.checksRemaining}
        billingPeriodEnd={user.billingPeriodEnd}
        hasStripeSubscription={!!user.stripeSubscriptionId}
      />
    </div>
  );
}
