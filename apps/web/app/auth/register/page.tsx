import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export default function RegisterPage() {
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <Link className="brand-link" href="/">
          School Platform
        </Link>
        <div className="auth-copy">
          <p className="eyebrow">SCHOOL OWNER REGISTRATION</p>
          <h1>Create your account</h1>
          <p>After registration, you will create the first school and branch.</p>
        </div>

        <AuthForm googleEnabled={googleEnabled} mode="register" />

        <p className="auth-footer">
          Already registered? <Link href="/auth/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
