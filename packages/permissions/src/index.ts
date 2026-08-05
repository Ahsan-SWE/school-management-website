export type PermissionDecision =
  | { allowed: true; reason: "role" | "override" | "ownership" }
  | { allowed: false; reason: "missing_permission" | "scope_mismatch" | "suspended" };

export function assertAllowed(
  decision: PermissionDecision,
  permission: string,
): asserts decision is Extract<PermissionDecision, { allowed: true }> {
  if (!decision.allowed) {
    throw new Error(`Permission denied: ${permission} (${decision.reason})`);
  }
}
