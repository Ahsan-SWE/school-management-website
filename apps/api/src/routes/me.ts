import {
  MembershipContextResponseSchema,
  MembershipListResponseSchema,
} from "@school-platform/contracts";
import { Hono } from "hono";
import { z } from "zod";
import { getDatabase } from "../lib/database";
import { type AuthVariables, requireAuthentication } from "../middleware/authentication";

type MembershipRow = {
  membership_id: string;
  school_id: string;
  school_code: string;
  school_name: string;
  school_status: string;
  branch_id: string | null;
  branch_code: string | null;
  branch_name: string | null;
  membership_type: string;
  membership_status: string;
  person_display_name: string;
};

const MembershipIdSchema = z.uuid();

function mapMembership(row: MembershipRow) {
  return {
    membershipId: row.membership_id,
    schoolId: row.school_id,
    schoolCode: row.school_code,
    schoolName: row.school_name,
    schoolStatus: row.school_status,
    branchId: row.branch_id,
    branchCode: row.branch_code,
    branchName: row.branch_name,
    membershipType: row.membership_type,
    membershipStatus: row.membership_status,
    personDisplayName: row.person_display_name,
  };
}

export const meRoutes = new Hono<{ Variables: AuthVariables }>();

meRoutes.use("*", requireAuthentication);

meRoutes.get("/memberships", async (context) => {
  const authUser = context.get("authUser");
  const database = getDatabase();

  const rows = await database.$queryRaw<MembershipRow[]>`
    SELECT *
    FROM app_private.list_user_memberships(${authUser.id}::uuid)
  `;

  return context.json(
    MembershipListResponseSchema.parse({
      memberships: rows.map(mapMembership),
    }),
  );
});

meRoutes.get("/memberships/:membershipId", async (context) => {
  const authUser = context.get("authUser");
  const parsedMembershipId = MembershipIdSchema.safeParse(context.req.param("membershipId"));

  if (!parsedMembershipId.success) {
    return context.json(
      {
        type: "https://school-platform.local/problems/validation-error",
        title: "A valid membership ID is required",
        status: 400,
      },
      400,
    );
  }

  const database = getDatabase();
  const rows = await database.$queryRaw<MembershipRow[]>`
    SELECT *
    FROM app_private.get_user_membership_context(
      ${authUser.id}::uuid,
      ${parsedMembershipId.data}::uuid
    )
  `;

  const membership = rows[0];

  if (!membership) {
    return context.json(
      {
        type: "https://school-platform.local/problems/membership-not-found",
        title: "Membership not found",
        status: 404,
      },
      404,
    );
  }

  return context.json(MembershipContextResponseSchema.parse(mapMembership(membership)));
});
