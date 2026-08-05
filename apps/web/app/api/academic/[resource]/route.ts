import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireAuthenticatedSession } from "@/lib/auth";

const allowedResources = new Set([
  "years",
  "periods",
  "grades",
  "classes",
  "sections",
  "subjects",
  "subject-offerings",
  "teaching-assignments",
]);

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
}

export async function POST(request: Request, context: { params: Promise<{ resource: string }> }) {
  const { resource } = await context.params;

  if (!allowedResources.has(resource)) {
    return NextResponse.json(
      { title: "Unsupported academic resource", status: 404 },
      { status: 404 },
    );
  }

  const { accessToken } = await requireAuthenticatedSession();
  const cookieStore = await cookies();
  const membershipId = cookieStore.get("school-platform-active-membership")?.value;

  if (!membershipId) {
    return NextResponse.json(
      { title: "Select an active school membership", status: 400 },
      { status: 400 },
    );
  }

  const upstream = await fetch(`${getApiBaseUrl()}/api/v1/academic/${resource}`, {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-School-Membership-Id": membershipId,
    },
    body: await request.text(),
  });

  const body = await upstream.text();

  return new NextResponse(body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/json",
    },
  });
}
