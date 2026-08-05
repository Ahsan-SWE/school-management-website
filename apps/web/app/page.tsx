import Link from "next/link";

const capabilities = [
  "Multi-school and multi-branch tenancy",
  "PostgreSQL RLS and server-verified memberships",
  "Supabase authentication and secure session refresh",
  "Audit and event-driven provisioning foundation",
];

export default function HomePage() {
  return (
    <main className="landing-shell">
      <nav className="landing-nav">
        <strong>School Platform</strong>
        <div>
          <Link className="nav-link" href="/auth/login">
            Sign in
          </Link>
          <Link className="button button--primary" href="/auth/register">
            Create account
          </Link>
        </div>
      </nav>

      <section className="landing-hero">
        <div>
          <p className="eyebrow">MULTI-TENANT SCHOOL OPERATIONS</p>
          <h1>One secure platform for the whole school.</h1>
          <p className="lead">
            The foundation now includes authentication, tenant onboarding, owner membership,
            protected navigation, and a server-validated dashboard.
          </p>
          <div className="hero-actions">
            <Link className="button button--primary" href="/auth/register">
              Start school setup
            </Link>
            <Link className="button button--secondary" href="/auth/login">
              Open workspace
            </Link>
          </div>
        </div>

        <aside className="landing-panel">
          <p className="eyebrow">CURRENT SLICE</p>
          <h2>Identity and tenant onboarding</h2>
          <ul>
            {capabilities.map((capability) => (
              <li key={capability}>{capability}</li>
            ))}
          </ul>
        </aside>
      </section>
    </main>
  );
}
