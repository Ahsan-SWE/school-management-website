import { redirect } from "next/navigation";
import { SchoolOnboardingForm } from "@/components/onboarding/school-onboarding-form";
import { getMemberships } from "@/lib/api";
import { requireAuthenticatedSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { user, accessToken } = await requireAuthenticatedSession();
  const { memberships } = await getMemberships(accessToken);

  if (memberships.length > 0) {
    redirect("/app");
  }

  const defaultOwnerName =
    typeof user.user_metadata.full_name === "string"
      ? user.user_metadata.full_name
      : (user.email?.split("@")[0] ?? "");

  return (
    <main className="onboarding-shell">
      <section className="onboarding-card">
        <div>
          <p className="eyebrow">FIRST WORKSPACE</p>
          <h1>Create your school</h1>
          <p className="lead-small">
            This creates the tenant, first branch, owner membership, baseline permissions, audit
            event, and provisioning event in one transaction.
          </p>
        </div>

        <SchoolOnboardingForm defaultOwnerName={defaultOwnerName} />
      </section>
    </main>
  );
}
