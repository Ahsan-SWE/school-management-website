import { StatusCard } from "@school-platform/ui-web";

const modules = [
  "Tenant and identity",
  "Academic core",
  "Admission",
  "Attendance",
  "Fees and accounting",
  "Exams and results",
];

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">WP-001 FOUNDATION</p>
        <h1>School Platform</h1>
        <p className="lead">
          The deployable monorepo foundation is ready. Authentication, tenant provisioning, and the
          first academic vertical slice come next.
        </p>
      </section>

      <section className="grid" aria-label="Foundation status">
        <StatusCard title="Web" status="Ready" detail="Next.js 16 App Router" />
        <StatusCard title="API" status="Ready" detail="Hono REST foundation" />
        <StatusCard title="Database" status="Ready" detail="Prisma + PostgreSQL RLS" />
        <StatusCard title="Mobile" status="Ready" detail="Expo SDK 57 shell" />
      </section>

      <section className="panel">
        <h2>First implementation sequence</h2>
        <ol>
          {modules.map((module) => (
            <li key={module}>{module}</li>
          ))}
        </ol>
      </section>
    </main>
  );
}
