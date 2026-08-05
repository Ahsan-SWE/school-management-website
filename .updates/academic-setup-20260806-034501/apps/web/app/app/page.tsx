import { MembershipSwitcher } from "@/components/dashboard/membership-switcher";
import { getMemberships } from "@/lib/api";
import { requireAuthenticatedSession } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const modules = [
  {
    title: "People & access",
    detail: "Memberships, roles, guardians, students, and employees.",
    status: "Foundation",
  },
  {
    title: "Academic setup",
    detail: "Academic years, classes, sections, subjects, and sessions.",
    status: "Next",
  },
  {
    title: "Admission",
    detail: "Applicant lifecycle, documents, decisions, and conversion.",
    status: "Planned",
  },
  {
    title: "Attendance",
    detail: "Daily and period attendance with revision history.",
    status: "Planned",
  },
];

export default async function DashboardPage() {
  const { user, accessToken } = await requireAuthenticatedSession();
  const { memberships } = await getMemberships(accessToken);

  if (memberships.length === 0) {
    redirect("/onboarding");
  }

  const cookieStore = await cookies();
  const selectedMembershipId = cookieStore.get(
    "school-platform-active-membership",
  )?.value;

  const activeMembership =
    memberships.find(
      (membership) => membership.membershipId === selectedMembershipId,
    ) ?? memberships[0];

  if (!activeMembership) {
    redirect("/onboarding");
  }

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">PROTECTED WORKSPACE</p>
          <h1>{activeMembership.schoolName}</h1>
          <p>
            {activeMembership.branchName ?? "All branches"} ·{" "}
            {activeMembership.membershipType.replaceAll("_", " ")}
          </p>
        </div>

        <div className="dashboard-actions">
          <MembershipSwitcher
            activeMembershipId={activeMembership.membershipId}
            memberships={memberships}
          />
          <form action="/auth/signout" method="post">
            <button className="button button--secondary" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <section className="dashboard-welcome">
        <div>
          <span className="status-pill status-pill--success">Tenant active</span>
          <h2>Welcome, {activeMembership.personDisplayName}</h2>
          <p>
            Authentication, membership lookup, tenant selection, and server-side
            access validation are working.
          </p>
        </div>
        <dl className="dashboard-facts">
          <div>
            <dt>School code</dt>
            <dd>{activeMembership.schoolCode}</dd>
          </div>
          <div>
            <dt>Branch code</dt>
            <dd>{activeMembership.branchCode ?? "ALL"}</dd>
          </div>
          <div>
            <dt>Signed-in email</dt>
            <dd>{user.email}</dd>
          </div>
        </dl>
      </section>

      <section className="module-grid" aria-label="Implementation modules">
        {modules.map((module) => (
          <article className="module-card" key={module.title}>
            <span className="status-pill">{module.status}</span>
            <h2>{module.title}</h2>
            <p>{module.detail}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
