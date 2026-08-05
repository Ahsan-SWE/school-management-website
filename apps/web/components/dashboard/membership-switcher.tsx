"use client";

import type { MembershipSummary } from "@school-platform/contracts";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  activeMembershipId: string;
  memberships: MembershipSummary[];
};

export function MembershipSwitcher({ activeMembershipId, memberships }: Props) {
  const router = useRouter();
  const [changing, setChanging] = useState(false);

  async function changeMembership(membershipId: string) {
    setChanging(true);

    const response = await fetch("/api/active-membership", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ membershipId }),
    });

    if (response.ok) {
      router.refresh();
      return;
    }

    setChanging(false);
  }

  return (
    <label className="membership-switcher">
      <span className="sr-only">Active school</span>
      <select
        aria-label="Active school"
        disabled={changing}
        onChange={(event) => changeMembership(event.target.value)}
        value={activeMembershipId}
      >
        {memberships.map((membership) => (
          <option key={membership.membershipId} value={membership.membershipId}>
            {membership.schoolName}
            {membership.branchName ? ` — ${membership.branchName}` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
