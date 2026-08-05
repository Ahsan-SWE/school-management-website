import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <Link className="brand-link" href="/">
          School Platform
        </Link>
        <div className="auth-copy">
          <p className="eyebrow">WELCOME BACK</p>
          <h1>Sign in to your school workspace</h1>
          <p>Use your school account to continue.</p>
        </div>

        <AuthForm googleEnabled={googleEnabled} mode="login" />

        <p className="auth-footer">
          New to the platform? <Link href="/auth/register">Create an account</Link>
        </p>
      </section>
    </main>
  );
}
