import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <Link className="brand-link" href="/">
          School Platform
        </Link>
        <div className="auth-copy">
          <p className="eyebrow">ACCOUNT RECOVERY</p>
          <h1>Reset your password</h1>
          <p>Enter the email address used for your account.</p>
        </div>

        <ForgotPasswordForm />

        <p className="auth-footer">
          <Link href="/auth/login">Back to sign in</Link>
        </p>
      </section>
    </main>
  );
}
