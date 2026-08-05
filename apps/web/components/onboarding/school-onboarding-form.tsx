"use client";

import {
  type SchoolOnboardingRequest,
  SchoolOnboardingResponseSchema,
} from "@school-platform/contracts";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  defaultOwnerName: string;
};

function toCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function SchoolOnboardingForm({ defaultOwnerName }: Props) {
  const router = useRouter();
  const [ownerDisplayName, setOwnerDisplayName] = useState(defaultOwnerName);
  const [schoolName, setSchoolName] = useState("");
  const [schoolCode, setSchoolCode] = useState("");
  const [branchName, setBranchName] = useState("Main Campus");
  const [branchCode, setBranchCode] = useState("MAIN");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setErrorMessage("Your session expired. Sign in again.");
      setSubmitting(false);
      return;
    }

    const payload: SchoolOnboardingRequest = {
      ownerDisplayName,
      schoolName,
      schoolCode,
      branchName,
      branchCode,
    };

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/v1/onboarding/schools`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    const responseBody = (await response.json()) as unknown;

    if (!response.ok) {
      const problem =
        typeof responseBody === "object" &&
        responseBody !== null &&
        "title" in responseBody &&
        typeof responseBody.title === "string"
          ? responseBody.title
          : "School setup failed";

      setErrorMessage(problem);
      setSubmitting(false);
      return;
    }

    const school = SchoolOnboardingResponseSchema.parse(responseBody);

    const selectResponse = await fetch("/api/active-membership", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ membershipId: school.membershipId }),
    });

    if (!selectResponse.ok) {
      setErrorMessage("School was created, but the active school could not be selected.");
      setSubmitting(false);
      return;
    }

    router.push("/app");
    router.refresh();
  }

  return (
    <form className="onboarding-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label className="field field--wide">
          <span>Your display name</span>
          <input
            minLength={2}
            onChange={(event) => setOwnerDisplayName(event.target.value)}
            required
            value={ownerDisplayName}
          />
        </label>

        <label className="field">
          <span>School name</span>
          <input
            minLength={2}
            onBlur={() => {
              if (!schoolCode) setSchoolCode(toCode(schoolName));
            }}
            onChange={(event) => setSchoolName(event.target.value)}
            placeholder="Example Model School"
            required
            value={schoolName}
          />
        </label>

        <label className="field">
          <span>School code</span>
          <input
            maxLength={40}
            onChange={(event) => setSchoolCode(toCode(event.target.value))}
            pattern="[A-Z0-9][A-Z0-9-]*"
            placeholder="EXAMPLE-SCHOOL"
            required
            value={schoolCode}
          />
        </label>

        <label className="field">
          <span>First branch</span>
          <input
            minLength={2}
            onChange={(event) => setBranchName(event.target.value)}
            required
            value={branchName}
          />
        </label>

        <label className="field">
          <span>Branch code</span>
          <input
            maxLength={40}
            onChange={(event) => setBranchCode(toCode(event.target.value))}
            pattern="[A-Z0-9][A-Z0-9-]*"
            required
            value={branchCode}
          />
        </label>
      </div>

      {errorMessage ? (
        <p className="form-message form-message--error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <button className="button button--primary" disabled={submitting} type="submit">
        {submitting ? "Creating school…" : "Create school workspace"}
      </button>
    </form>
  );
}
