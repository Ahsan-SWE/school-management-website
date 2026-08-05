"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AuthFormProps = {
  mode: "login" | "register";
  googleEnabled: boolean;
};

function safeNextPath() {
  const next = new URLSearchParams(window.location.search).get("next");
  return next?.startsWith("/") ? next : "/app";
}

export function AuthForm({ mode, googleEnabled }: AuthFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);

    const supabase = createClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setStatus({ type: "error", message: error.message });
        setSubmitting(false);
        return;
      }

      router.push(safeNextPath());
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/app`,
      },
    });

    if (error) {
      setStatus({ type: "error", message: error.message });
      setSubmitting(false);
      return;
    }

    if (data.session) {
      router.push("/onboarding");
      router.refresh();
      return;
    }

    setStatus({
      type: "success",
      message: "Check your email to confirm the account, then sign in.",
    });
    setSubmitting(false);
  }

  async function signInWithGoogle() {
    setSubmitting(true);
    setStatus(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/app`,
      },
    });

    if (error) {
      setStatus({ type: "error", message: error.message });
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {mode === "register" ? (
        <label className="field">
          <span>Full name</span>
          <input
            autoComplete="name"
            minLength={2}
            onChange={(event) => setFullName(event.target.value)}
            required
            value={fullName}
          />
        </label>
      ) : null}

      <label className="field">
        <span>Email</span>
        <input
          autoComplete="email"
          inputMode="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </label>

      <label className="field">
        <span>Password</span>
        <input
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={8}
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>

      {mode === "login" ? (
        <div className="field-help">
          <Link href="/auth/forgot-password">Forgot password?</Link>
        </div>
      ) : null}

      {status ? (
        <p
          className={`form-message form-message--${status.type}`}
          role={status.type === "error" ? "alert" : "status"}
        >
          {status.message}
        </p>
      ) : null}

      <button className="button button--primary button--full" disabled={submitting} type="submit">
        {submitting ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
      </button>

      {googleEnabled ? (
        <>
          <div className="auth-divider">
            <span>or</span>
          </div>
          <button
            className="button button--secondary button--full"
            disabled={submitting}
            onClick={signInWithGoogle}
            type="button"
          >
            Continue with Google
          </button>
        </>
      ) : null}
    </form>
  );
}
