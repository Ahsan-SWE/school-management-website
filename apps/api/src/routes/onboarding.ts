import {
  SchoolOnboardingRequestSchema,
  SchoolOnboardingResponseSchema,
} from "@school-platform/contracts";
import { Hono } from "hono";
import { getDatabase } from "../lib/database";
import { type AuthVariables, requireAuthentication } from "../middleware/authentication";

type ProvisionedSchoolRow = {
  school_id: string;
  branch_id: string;
  membership_id: string;
  school_code: string;
  school_name: string;
  branch_code: string;
  branch_name: string;
};

type DatabaseError = {
  code?: string;
  meta?: {
    code?: string;
    message?: string;
  };
};

export const onboardingRoutes = new Hono<{ Variables: AuthVariables }>();

onboardingRoutes.use("*", requireAuthentication);

onboardingRoutes.post("/schools", async (context) => {
  const authUser = context.get("authUser");
  const requestBody = await context.req.json().catch(() => null);
  const parsedBody = SchoolOnboardingRequestSchema.safeParse(requestBody);

  if (!parsedBody.success) {
    return context.json(
      {
        type: "https://school-platform.local/problems/validation-error",
        title: "The onboarding request is invalid",
        status: 400,
        errors: parsedBody.error.flatten(),
      },
      400,
    );
  }

  const database = getDatabase();
  const email = authUser.email ?? null;

  try {
    const rows = await database.$queryRaw<ProvisionedSchoolRow[]>`
      SELECT *
      FROM app_private.provision_school_owner(
        ${authUser.id}::uuid,
        ${email},
        ${parsedBody.data.ownerDisplayName},
        ${parsedBody.data.schoolName},
        ${parsedBody.data.schoolCode},
        ${parsedBody.data.branchName},
        ${parsedBody.data.branchCode}
      )
    `;

    const school = rows[0];

    if (!school) {
      throw new Error("Provisioning did not return a school");
    }

    return context.json(
      SchoolOnboardingResponseSchema.parse({
        schoolId: school.school_id,
        branchId: school.branch_id,
        membershipId: school.membership_id,
        schoolCode: school.school_code,
        schoolName: school.school_name,
        branchCode: school.branch_code,
        branchName: school.branch_name,
      }),
      201,
    );
  } catch (error) {
    const databaseError = error as DatabaseError;
    const message =
      error instanceof Error
        ? error.message
        : (databaseError.meta?.message ?? "Unknown provisioning error");

    const isUniqueViolation =
      (databaseError.code === "P2010" && databaseError.meta?.code === "23505") ||
      message.includes("schools_code_key") ||
      message.includes("already exists");

    if (isUniqueViolation) {
      return context.json(
        {
          type: "https://school-platform.local/problems/school-code-conflict",
          title: "That school code is already in use",
          status: 409,
        },
        409,
      );
    }

    throw error;
  }
});
