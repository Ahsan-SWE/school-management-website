import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">AUTHENTICATION ERROR</p>
        <h1>The sign-in link could not be completed</h1>
        <p className="lead-small">The link may have expired or already been used.</p>
        <Link className="button button--primary" href="/auth/login">
          Return to sign in
        </Link>
      </section>
    </main>
  );
}
