import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getMembershipContext } from "@/lib/api";
import { requireAuthenticatedSession } from "@/lib/auth";

const ActiveMembershipRequestSchema = z.object({
  membershipId: z.uuid(),
});

export async function POST(request: Request) {
  const { accessToken } = await requireAuthenticatedSession();
  const parsedBody = ActiveMembershipRequestSchema.safeParse(await request.json());

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        title: "A valid membership ID is required",
        status: 400,
      },
      { status: 400 },
    );
  }

  await getMembershipContext(accessToken, parsedBody.data.membershipId);

  const cookieStore = await cookies();
  cookieStore.set("school-platform-active-membership", parsedBody.data.membershipId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return NextResponse.json({ selected: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("school-platform-active-membership");
  return NextResponse.json({ selected: false });
}
