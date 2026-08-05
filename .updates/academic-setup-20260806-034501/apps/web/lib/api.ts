import {
  MembershipContextResponseSchema,
  MembershipListResponseSchema,
  type MembershipListResponse,
  type MembershipSummary,
} from "@school-platform/contracts";

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
}

async function apiRequest(
  path: string,
  accessToken: string,
  init: RequestInit = {},
) {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${accessToken}`);

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    cache: "no-store",
    headers,
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json() as Promise<unknown>;
}

export async function getMemberships(
  accessToken: string,
): Promise<MembershipListResponse> {
  const response = await apiRequest("/api/v1/me/memberships", accessToken);
  return MembershipListResponseSchema.parse(response);
}

export async function getMembershipContext(
  accessToken: string,
  membershipId: string,
): Promise<MembershipSummary> {
  const response = await apiRequest(
    `/api/v1/me/memberships/${membershipId}`,
    accessToken,
  );
  return MembershipContextResponseSchema.parse(response);
}
