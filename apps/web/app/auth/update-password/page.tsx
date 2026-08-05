import Link from "next/link";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";

export const dynamic = "force-dynamic";

export default function UpdatePasswordPage() {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <Link className="brand-link" href="/">
          School Platform
        </Link>
        <div className="auth-copy">
          <p className="eyebrow">ACCOUNT RECOVERY</p>
          <h1>Choose a new password</h1>
          <p>Use at least eight characters.</p>
        </div>

        <UpdatePasswordForm />
      </section>
    </main>
  );
}
