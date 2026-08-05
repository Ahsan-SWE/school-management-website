import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AcademicSetupWorkspace } from "@/components/academic/academic-setup-workspace";
import { getAcademicOverview, getMemberships } from "@/lib/api";
import { requireAuthenticatedSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AcademicSetupPage() {
  const { accessToken } = await requireAuthenticatedSession();
  const { memberships } = await getMemberships(accessToken);

  if (memberships.length === 0) {
    redirect("/onboarding");
  }

  const cookieStore = await cookies();
  const selectedMembershipId = cookieStore.get("school-platform-active-membership")?.value;

  const activeMembership =
    memberships.find((membership) => membership.membershipId === selectedMembershipId) ??
    memberships[0];

  if (!activeMembership) {
    redirect("/onboarding");
  }

  const overview = await getAcademicOverview(accessToken, activeMembership.membershipId);

  return (
    <main className="dashboard-shell academic-shell">
      <header className="dashboard-header">
        <div>
          <Link className="back-link" href="/app">
            ← Dashboard
          </Link>
          <p className="eyebrow">ACADEMIC SETUP</p>
          <h1>{activeMembership.schoolName}</h1>
          <p>{activeMembership.branchName ?? "All branches"} · Academic configuration</p>
        </div>
      </header>

      <AcademicSetupWorkspace branchId={activeMembership.branchId} overview={overview} />
    </main>
  );
}
