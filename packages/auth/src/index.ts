import type { TenantContext } from "@school-platform/contracts";

export type AuthenticatedActor = {
  authUserId: string;
  tenant: TenantContext;
  assuranceLevel: "aal1" | "aal2";
};

export class AuthenticationRequiredError extends Error {
  override name = "AuthenticationRequiredError";
}
