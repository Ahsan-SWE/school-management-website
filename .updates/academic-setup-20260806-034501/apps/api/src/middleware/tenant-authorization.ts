import type { MiddlewareHandler } from "hono";
import { z } from "zod";
import { getDatabase } from "../lib/database";
import type { AuthVariables } from "./authentication";

const MembershipIdSchema = z.uuid();

type AuthorizationRow = {
  user_account_id: string;
  membership_id: string;
  school_id: string;
  branch_id: string | null;
  membership_type: string;
  person_display_name: string;
  permission_granted: boolean;
};

export type TenantAccess = {
  userAccountId: string;
  membershipId: string;
  schoolId: string;
  branchId: string | null;
  membershipType: string;
  personDisplayName: string;
};

export type TenantVariables = AuthVariables & {
  tenantAccess: TenantAccess;
};

export function requireTenantPermission(
  permissionKey: string,
): MiddlewareHandler<{ Variables: TenantVariables }> {
  return async (context, next) => {
    const authUser = context.get("authUser");
    const parsedMembershipId = MembershipIdSchema.safeParse(
      context.req.header("x-school-membership-id"),
    );

    if (!parsedMembershipId.success) {
      return context.json(
        {
          type: "https://school-platform.local/problems/membership-required",
          title: "An active school membership is required",
          status: 400,
        },
        400,
      );
    }

    const database = getDatabase();
    const rows = await database.$queryRaw<AuthorizationRow[]>`
      SELECT *
      FROM app_private.get_membership_authorization(
        ${authUser.id}::uuid,
        ${parsedMembershipId.data}::uuid,
        ${permissionKey}
      )
    `;

    const authorization = rows[0];

    if (!authorization) {
      return context.json(
        {
          type: "https://school-platform.local/problems/membership-forbidden",
          title: "The selected membership is not available",
          status: 403,
        },
        403,
      );
    }

    if (!authorization.permission_granted) {
      return context.json(
        {
          type: "https://school-platform.local/problems/permission-denied",
          title: "You do not have permission to perform this action",
          status: 403,
          permission: permissionKey,
        },
        403,
      );
    }

    context.set("tenantAccess", {
      userAccountId: authorization.user_account_id,
      membershipId: authorization.membership_id,
      schoolId: authorization.school_id,
      branchId: authorization.branch_id,
      membershipType: authorization.membership_type,
      personDisplayName: authorization.person_display_name,
    });

    await next();
  };
}
