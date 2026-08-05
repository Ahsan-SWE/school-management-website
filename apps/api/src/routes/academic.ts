import {
  AcademicMutationResponseSchema,
  AcademicOverviewResponseSchema,
  AcademicPeriodCreateRequestSchema,
  AcademicYearCreateRequestSchema,
  ClassOfferingCreateRequestSchema,
  GradeLevelCreateRequestSchema,
  SectionOfferingCreateRequestSchema,
  SubjectMasterCreateRequestSchema,
  SubjectOfferingCreateRequestSchema,
  TeachingAssignmentCreateRequestSchema,
} from "@school-platform/contracts";
import type { Prisma } from "@school-platform/database";
import { Hono } from "hono";
import { getDatabase } from "../lib/database";
import { requireAuthentication } from "../middleware/authentication";
import {
  requireTenantPermission,
  type TenantAccess,
  type TenantVariables,
} from "../middleware/tenant-authorization";

type IdRow = { id: string };

type BranchRow = {
  id: string;
  code: string;
  name: string;
  status: string;
};

type AcademicYearRow = {
  id: string;
  code: string;
  name: string;
  start_date: string;
  end_date: string;
  status: "DRAFT" | "ACTIVE" | "CLOSED" | "ARCHIVED";
};

type AcademicPeriodRow = {
  id: string;
  academic_year_id: string;
  code: string;
  name: string;
  period_type: "TERM" | "SEMESTER" | "QUARTER" | "CUSTOM";
  sequence_number: number;
  start_date: string;
  end_date: string;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
};

type GradeLevelRow = {
  id: string;
  code: string;
  name: string;
  sequence_number: number;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
};

type ClassOfferingRow = {
  id: string;
  branch_id: string;
  academic_year_id: string;
  grade_level_id: string;
  code: string;
  name: string;
  capacity: number;
  status: "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";
  academic_year_name: string;
  grade_level_name: string;
  section_count: number;
};

type SectionOfferingRow = {
  id: string;
  class_offering_id: string;
  code: string;
  name: string;
  capacity: number;
  status: "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";
  class_offering_name: string;
};

type SubjectMasterRow = {
  id: string;
  code: string;
  name: string;
  short_name: string;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
};

type SubjectOfferingRow = {
  id: string;
  branch_id: string;
  academic_year_id: string;
  class_offering_id: string;
  subject_master_id: string;
  subject_code: string;
  subject_name: string;
  class_offering_name: string;
  compulsory: boolean;
  weekly_periods: number;
  status: "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";
};

type EligibleTeacherRow = {
  membership_id: string;
  branch_id: string | null;
  display_name: string;
  membership_type: string;
};

type TeachingAssignmentRow = {
  id: string;
  branch_id: string;
  subject_offering_id: string;
  section_offering_id: string;
  teacher_membership_id: string;
  teacher_name: string;
  subject_name: string;
  class_offering_name: string;
  section_name: string;
  role: "LEAD" | "ASSISTANT";
  effective_from: string;
  effective_to: string | null;
  status: "ACTIVE" | "INACTIVE" | "ENDED";
};

type DatabaseError = {
  code?: string;
  meta?: {
    code?: string;
    message?: string;
  };
};

async function setTenantContext(
  transaction: Prisma.TransactionClient,
  access: TenantAccess,
  requestId: string,
) {
  await transaction.$executeRaw`
    SELECT set_config('app.user_account_id', ${access.userAccountId}, true)
  `;
  await transaction.$executeRaw`
    SELECT set_config('app.membership_id', ${access.membershipId}, true)
  `;
  await transaction.$executeRaw`
    SELECT set_config('app.school_id', ${access.schoolId}, true)
  `;
  await transaction.$executeRaw`
    SELECT set_config('app.branch_id', ${access.branchId ?? ""}, true)
  `;
  await transaction.$executeRaw`
    SELECT set_config('app.request_id', ${requestId}, true)
  `;
}

async function recordMutation(
  transaction: Prisma.TransactionClient,
  access: TenantAccess,
  requestId: string,
  resource: string,
  id: string,
  eventType: string,
) {
  await transaction.$executeRaw`
    INSERT INTO audit_events (
      school_id,
      actor_id,
      membership_id,
      action,
      resource_type,
      resource_id,
      outcome,
      request_id,
      metadata
    )
    VALUES (
      ${access.schoolId}::uuid,
      ${access.userAccountId}::uuid,
      ${access.membershipId}::uuid,
      ${`${resource}.created`},
      ${resource},
      ${id}::uuid,
      'SUCCESS',
      ${requestId},
      jsonb_build_object('source', 'academic_setup')
    )
  `;

  await transaction.$executeRaw`
    INSERT INTO outbox_events (
      school_id,
      event_type,
      aggregate_type,
      aggregate_id,
      payload,
      correlation_id
    )
    VALUES (
      ${access.schoolId}::uuid,
      ${eventType},
      ${resource},
      ${id}::uuid,
      jsonb_build_object('schoolId', ${access.schoolId}, 'id', ${id}),
      ${requestId}
    )
  `;
}

function mapDatabaseError(error: unknown) {
  const databaseError = error as DatabaseError;
  const message =
    error instanceof Error
      ? error.message
      : (databaseError.meta?.message ?? "Academic setup operation failed");

  const uniqueViolation =
    (databaseError.code === "P2010" && databaseError.meta?.code === "23505") ||
    message.includes("duplicate key") ||
    message.includes("already exists") ||
    message.includes("no_overlapping_active");

  const invalidReference =
    (databaseError.code === "P2010" && databaseError.meta?.code === "23503") ||
    message.includes("foreign key constraint") ||
    message.includes("not found") ||
    message.includes("must match") ||
    message.includes("scope is inconsistent") ||
    message.includes("must be inside") ||
    message.includes("not an active teacher");

  if (uniqueViolation) {
    return {
      status: 409 as const,
      body: {
        type: "https://school-platform.local/problems/academic-conflict",
        title: "An academic record with the same scope already exists",
        status: 409,
      },
    };
  }

  if (invalidReference) {
    return {
      status: 400 as const,
      body: {
        type: "https://school-platform.local/problems/academic-validation",
        title: message,
        status: 400,
      },
    };
  }

  return null;
}

export const academicRoutes = new Hono<{ Variables: TenantVariables }>();

academicRoutes.use("*", requireAuthentication);

academicRoutes.get("/overview", requireTenantPermission("academic.read"), async (context) => {
  const access = context.get("tenantAccess");
  const database = getDatabase();

  const overview = await database.$transaction(async (transaction) => {
    await setTenantContext(transaction, access, context.get("requestId"));

    const branches = await transaction.$queryRaw<BranchRow[]>`
        SELECT
          id,
          code,
          name,
          status::text AS status
        FROM branches
        WHERE school_id = ${access.schoolId}::uuid
          AND status = 'ACTIVE'::"BranchStatus"
          AND (${access.branchId}::uuid IS NULL OR id = ${access.branchId}::uuid)
        ORDER BY name
      `;

    const academicYears = await transaction.$queryRaw<AcademicYearRow[]>`
        SELECT
          id,
          code,
          name,
          to_char(start_date, 'YYYY-MM-DD') AS start_date,
          to_char(end_date, 'YYYY-MM-DD') AS end_date,
          status::text AS status
        FROM academic_years
        WHERE school_id = ${access.schoolId}::uuid
        ORDER BY start_date DESC, code
      `;

    const academicPeriods = await transaction.$queryRaw<AcademicPeriodRow[]>`
        SELECT
          id,
          academic_year_id,
          code,
          name,
          period_type::text AS period_type,
          sequence_number,
          to_char(start_date, 'YYYY-MM-DD') AS start_date,
          to_char(end_date, 'YYYY-MM-DD') AS end_date,
          status::text AS status
        FROM academic_periods
        WHERE school_id = ${access.schoolId}::uuid
        ORDER BY academic_year_id, sequence_number
      `;

    const gradeLevels = await transaction.$queryRaw<GradeLevelRow[]>`
        SELECT
          id,
          code,
          name,
          sequence_number,
          status::text AS status
        FROM grade_level_masters
        WHERE school_id = ${access.schoolId}::uuid
        ORDER BY sequence_number, name
      `;

    const classOfferings = await transaction.$queryRaw<ClassOfferingRow[]>`
        SELECT
          class_offering.id,
          class_offering.branch_id,
          class_offering.academic_year_id,
          class_offering.grade_level_id,
          class_offering.code,
          class_offering.name,
          class_offering.capacity,
          class_offering.status::text AS status,
          academic_year.name AS academic_year_name,
          grade_level.name AS grade_level_name,
          count(section.id)::int AS section_count
        FROM class_offerings class_offering
        JOIN academic_years academic_year
          ON academic_year.school_id = class_offering.school_id
         AND academic_year.id = class_offering.academic_year_id
        JOIN grade_level_masters grade_level
          ON grade_level.school_id = class_offering.school_id
         AND grade_level.id = class_offering.grade_level_id
        LEFT JOIN section_offerings section
          ON section.school_id = class_offering.school_id
         AND section.class_offering_id = class_offering.id
        WHERE class_offering.school_id = ${access.schoolId}::uuid
          AND (${access.branchId}::uuid IS NULL OR class_offering.branch_id = ${access.branchId}::uuid)
        GROUP BY
          class_offering.id,
          academic_year.name,
          academic_year.start_date,
          grade_level.name,
          grade_level.sequence_number
        ORDER BY academic_year.start_date DESC, grade_level.sequence_number
      `;

    const sectionOfferings = await transaction.$queryRaw<SectionOfferingRow[]>`
        SELECT
          section.id,
          section.class_offering_id,
          section.code,
          section.name,
          section.capacity,
          section.status::text AS status,
          class_offering.name AS class_offering_name
        FROM section_offerings section
        JOIN class_offerings class_offering
          ON class_offering.school_id = section.school_id
         AND class_offering.id = section.class_offering_id
        WHERE section.school_id = ${access.schoolId}::uuid
          AND (${access.branchId}::uuid IS NULL OR class_offering.branch_id = ${access.branchId}::uuid)
        ORDER BY class_offering.name, section.code
      `;

    const subjectMasters = await transaction.$queryRaw<SubjectMasterRow[]>`
        SELECT
          id,
          code,
          name,
          short_name,
          status::text AS status
        FROM subject_masters
        WHERE school_id = ${access.schoolId}::uuid
        ORDER BY name
      `;

    const subjectOfferings = await transaction.$queryRaw<SubjectOfferingRow[]>`
        SELECT
          subject_offering.id,
          subject_offering.branch_id,
          subject_offering.academic_year_id,
          subject_offering.class_offering_id,
          subject_offering.subject_master_id,
          subject.code AS subject_code,
          subject.name AS subject_name,
          class_offering.name AS class_offering_name,
          subject_offering.compulsory,
          subject_offering.weekly_periods,
          subject_offering.status::text AS status
        FROM subject_offerings subject_offering
        JOIN subject_masters subject
          ON subject.school_id = subject_offering.school_id
         AND subject.id = subject_offering.subject_master_id
        JOIN class_offerings class_offering
          ON class_offering.school_id = subject_offering.school_id
         AND class_offering.id = subject_offering.class_offering_id
        WHERE subject_offering.school_id = ${access.schoolId}::uuid
          AND (
            ${access.branchId}::uuid IS NULL
            OR subject_offering.branch_id = ${access.branchId}::uuid
          )
        ORDER BY class_offering.name, subject.name
      `;

    const eligibleTeachers = await transaction.$queryRaw<EligibleTeacherRow[]>`
        SELECT
          membership.id AS membership_id,
          membership.branch_id,
          person.display_name,
          membership.membership_type
        FROM memberships membership
        JOIN school_people person
          ON person.school_id = membership.school_id
         AND person.id = membership.school_person_id
        WHERE membership.school_id = ${access.schoolId}::uuid
          AND membership.status = 'ACTIVE'::"MembershipStatus"
          AND membership.membership_type IN ('TEACHER', 'EMPLOYEE')
          AND (
            ${access.branchId}::uuid IS NULL
            OR membership.branch_id IS NULL
            OR membership.branch_id = ${access.branchId}::uuid
          )
        ORDER BY person.display_name
      `;

    const teachingAssignments = await transaction.$queryRaw<TeachingAssignmentRow[]>`
        SELECT
          assignment.id,
          assignment.branch_id,
          assignment.subject_offering_id,
          assignment.section_offering_id,
          assignment.teacher_membership_id,
          person.display_name AS teacher_name,
          subject.name AS subject_name,
          class_offering.name AS class_offering_name,
          section.name AS section_name,
          assignment.role::text AS role,
          to_char(assignment.effective_from, 'YYYY-MM-DD') AS effective_from,
          CASE
            WHEN assignment.effective_to IS NULL THEN NULL
            ELSE to_char(assignment.effective_to, 'YYYY-MM-DD')
          END AS effective_to,
          assignment.status::text AS status
        FROM teaching_assignments assignment
        JOIN memberships membership
          ON membership.school_id = assignment.school_id
         AND membership.id = assignment.teacher_membership_id
        JOIN school_people person
          ON person.school_id = membership.school_id
         AND person.id = membership.school_person_id
        JOIN subject_offerings subject_offering
          ON subject_offering.school_id = assignment.school_id
         AND subject_offering.id = assignment.subject_offering_id
        JOIN subject_masters subject
          ON subject.school_id = subject_offering.school_id
         AND subject.id = subject_offering.subject_master_id
        JOIN class_offerings class_offering
          ON class_offering.school_id = subject_offering.school_id
         AND class_offering.id = subject_offering.class_offering_id
        JOIN section_offerings section
          ON section.school_id = assignment.school_id
         AND section.id = assignment.section_offering_id
        WHERE assignment.school_id = ${access.schoolId}::uuid
          AND (${access.branchId}::uuid IS NULL OR assignment.branch_id = ${access.branchId}::uuid)
        ORDER BY class_offering.name, section.name, subject.name, person.display_name
      `;

    return AcademicOverviewResponseSchema.parse({
      branches: branches.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        status: row.status,
      })),
      academicYears: academicYears.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        startDate: row.start_date,
        endDate: row.end_date,
        status: row.status,
      })),
      academicPeriods: academicPeriods.map((row) => ({
        id: row.id,
        academicYearId: row.academic_year_id,
        code: row.code,
        name: row.name,
        periodType: row.period_type,
        sequenceNumber: row.sequence_number,
        startDate: row.start_date,
        endDate: row.end_date,
        status: row.status,
      })),
      gradeLevels: gradeLevels.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        sequenceNumber: row.sequence_number,
        status: row.status,
      })),
      classOfferings: classOfferings.map((row) => ({
        id: row.id,
        branchId: row.branch_id,
        academicYearId: row.academic_year_id,
        gradeLevelId: row.grade_level_id,
        code: row.code,
        name: row.name,
        capacity: row.capacity,
        status: row.status,
        academicYearName: row.academic_year_name,
        gradeLevelName: row.grade_level_name,
        sectionCount: row.section_count,
      })),
      sectionOfferings: sectionOfferings.map((row) => ({
        id: row.id,
        classOfferingId: row.class_offering_id,
        code: row.code,
        name: row.name,
        capacity: row.capacity,
        status: row.status,
        classOfferingName: row.class_offering_name,
      })),
      subjectMasters: subjectMasters.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        shortName: row.short_name,
        status: row.status,
      })),
      subjectOfferings: subjectOfferings.map((row) => ({
        id: row.id,
        branchId: row.branch_id,
        academicYearId: row.academic_year_id,
        classOfferingId: row.class_offering_id,
        subjectMasterId: row.subject_master_id,
        subjectCode: row.subject_code,
        subjectName: row.subject_name,
        classOfferingName: row.class_offering_name,
        compulsory: row.compulsory,
        weeklyPeriods: row.weekly_periods,
        status: row.status,
      })),
      eligibleTeachers: eligibleTeachers.map((row) => ({
        membershipId: row.membership_id,
        branchId: row.branch_id,
        displayName: row.display_name,
        membershipType: row.membership_type,
      })),
      teachingAssignments: teachingAssignments.map((row) => ({
        id: row.id,
        branchId: row.branch_id,
        subjectOfferingId: row.subject_offering_id,
        sectionOfferingId: row.section_offering_id,
        teacherMembershipId: row.teacher_membership_id,
        teacherName: row.teacher_name,
        subjectName: row.subject_name,
        classOfferingName: row.class_offering_name,
        sectionName: row.section_name,
        role: row.role,
        effectiveFrom: row.effective_from,
        effectiveTo: row.effective_to,
        status: row.status,
      })),
    });
  });

  return context.json(overview);
});

academicRoutes.use("*", requireTenantPermission("academic.manage"));

academicRoutes.post("/years", async (context) => {
  const access = context.get("tenantAccess");
  const body = AcademicYearCreateRequestSchema.safeParse(
    await context.req.json().catch(() => null),
  );

  if (!body.success) {
    return context.json(
      {
        type: "https://school-platform.local/problems/validation-error",
        title: "The academic year is invalid",
        status: 400,
        errors: body.error.flatten(),
      },
      400,
    );
  }

  try {
    const id = await getDatabase().$transaction(async (transaction) => {
      await setTenantContext(transaction, access, context.get("requestId"));
      const rows = await transaction.$queryRaw<IdRow[]>`
        INSERT INTO academic_years (
          school_id,
          code,
          name,
          start_date,
          end_date,
          status
        )
        VALUES (
          ${access.schoolId}::uuid,
          ${body.data.code},
          ${body.data.name},
          ${body.data.startDate}::date,
          ${body.data.endDate}::date,
          ${body.data.status}::"AcademicYearStatus"
        )
        RETURNING id
      `;
      const created = rows[0];
      if (!created) throw new Error("Academic year was not created");
      await recordMutation(
        transaction,
        access,
        context.get("requestId"),
        "academic_year",
        created.id,
        "academic.year.created.v1",
      );
      return created.id;
    });

    return context.json(
      AcademicMutationResponseSchema.parse({ id, resource: "academic-year" }),
      201,
    );
  } catch (error) {
    const mapped = mapDatabaseError(error);
    if (mapped) return context.json(mapped.body, mapped.status);
    throw error;
  }
});

academicRoutes.post("/periods", async (context) => {
  const access = context.get("tenantAccess");
  const body = AcademicPeriodCreateRequestSchema.safeParse(
    await context.req.json().catch(() => null),
  );

  if (!body.success) {
    return context.json(
      {
        type: "https://school-platform.local/problems/validation-error",
        title: "The academic period is invalid",
        status: 400,
        errors: body.error.flatten(),
      },
      400,
    );
  }

  try {
    const id = await getDatabase().$transaction(async (transaction) => {
      await setTenantContext(transaction, access, context.get("requestId"));
      const rows = await transaction.$queryRaw<IdRow[]>`
        INSERT INTO academic_periods (
          school_id,
          academic_year_id,
          code,
          name,
          period_type,
          sequence_number,
          start_date,
          end_date,
          status
        )
        VALUES (
          ${access.schoolId}::uuid,
          ${body.data.academicYearId}::uuid,
          ${body.data.code},
          ${body.data.name},
          ${body.data.periodType}::"AcademicPeriodType",
          ${body.data.sequenceNumber},
          ${body.data.startDate}::date,
          ${body.data.endDate}::date,
          ${body.data.status}::"AcademicRecordStatus"
        )
        RETURNING id
      `;
      const created = rows[0];
      if (!created) throw new Error("Academic period was not created");
      await recordMutation(
        transaction,
        access,
        context.get("requestId"),
        "academic_period",
        created.id,
        "academic.period.created.v1",
      );
      return created.id;
    });

    return context.json(
      AcademicMutationResponseSchema.parse({ id, resource: "academic-period" }),
      201,
    );
  } catch (error) {
    const mapped = mapDatabaseError(error);
    if (mapped) return context.json(mapped.body, mapped.status);
    throw error;
  }
});

academicRoutes.post("/grades", async (context) => {
  const access = context.get("tenantAccess");
  const body = GradeLevelCreateRequestSchema.safeParse(await context.req.json().catch(() => null));

  if (!body.success) {
    return context.json(
      {
        type: "https://school-platform.local/problems/validation-error",
        title: "The grade level is invalid",
        status: 400,
        errors: body.error.flatten(),
      },
      400,
    );
  }

  try {
    const id = await getDatabase().$transaction(async (transaction) => {
      await setTenantContext(transaction, access, context.get("requestId"));
      const rows = await transaction.$queryRaw<IdRow[]>`
        INSERT INTO grade_level_masters (
          school_id,
          code,
          name,
          sequence_number,
          status
        )
        VALUES (
          ${access.schoolId}::uuid,
          ${body.data.code},
          ${body.data.name},
          ${body.data.sequenceNumber},
          ${body.data.status}::"AcademicRecordStatus"
        )
        RETURNING id
      `;
      const created = rows[0];
      if (!created) throw new Error("Grade level was not created");
      await recordMutation(
        transaction,
        access,
        context.get("requestId"),
        "grade_level",
        created.id,
        "academic.grade-level.created.v1",
      );
      return created.id;
    });

    return context.json(AcademicMutationResponseSchema.parse({ id, resource: "grade-level" }), 201);
  } catch (error) {
    const mapped = mapDatabaseError(error);
    if (mapped) return context.json(mapped.body, mapped.status);
    throw error;
  }
});

academicRoutes.post("/classes", async (context) => {
  const access = context.get("tenantAccess");
  const body = ClassOfferingCreateRequestSchema.safeParse(
    await context.req.json().catch(() => null),
  );

  if (!body.success) {
    return context.json(
      {
        type: "https://school-platform.local/problems/validation-error",
        title: "The class offering is invalid",
        status: 400,
        errors: body.error.flatten(),
      },
      400,
    );
  }

  if (access.branchId && access.branchId !== body.data.branchId) {
    return context.json(
      {
        type: "https://school-platform.local/problems/branch-scope",
        title: "The selected membership cannot manage that branch",
        status: 403,
      },
      403,
    );
  }

  try {
    const id = await getDatabase().$transaction(async (transaction) => {
      await setTenantContext(transaction, access, context.get("requestId"));
      const rows = await transaction.$queryRaw<IdRow[]>`
        INSERT INTO class_offerings (
          school_id,
          branch_id,
          academic_year_id,
          grade_level_id,
          code,
          name,
          capacity,
          status
        )
        VALUES (
          ${access.schoolId}::uuid,
          ${body.data.branchId}::uuid,
          ${body.data.academicYearId}::uuid,
          ${body.data.gradeLevelId}::uuid,
          ${body.data.code},
          ${body.data.name},
          ${body.data.capacity},
          ${body.data.status}::"AcademicOfferingStatus"
        )
        RETURNING id
      `;
      const created = rows[0];
      if (!created) throw new Error("Class offering was not created");
      await recordMutation(
        transaction,
        access,
        context.get("requestId"),
        "class_offering",
        created.id,
        "academic.class-offering.created.v1",
      );
      return created.id;
    });

    return context.json(
      AcademicMutationResponseSchema.parse({ id, resource: "class-offering" }),
      201,
    );
  } catch (error) {
    const mapped = mapDatabaseError(error);
    if (mapped) return context.json(mapped.body, mapped.status);
    throw error;
  }
});

academicRoutes.post("/sections", async (context) => {
  const access = context.get("tenantAccess");
  const body = SectionOfferingCreateRequestSchema.safeParse(
    await context.req.json().catch(() => null),
  );

  if (!body.success) {
    return context.json(
      {
        type: "https://school-platform.local/problems/validation-error",
        title: "The section offering is invalid",
        status: 400,
        errors: body.error.flatten(),
      },
      400,
    );
  }

  try {
    const id = await getDatabase().$transaction(async (transaction) => {
      await setTenantContext(transaction, access, context.get("requestId"));
      const rows = await transaction.$queryRaw<IdRow[]>`
        INSERT INTO section_offerings (
          school_id,
          class_offering_id,
          code,
          name,
          capacity,
          status
        )
        SELECT
          ${access.schoolId}::uuid,
          class_offering.id,
          ${body.data.code},
          ${body.data.name},
          ${body.data.capacity},
          ${body.data.status}::"AcademicOfferingStatus"
        FROM class_offerings class_offering
        WHERE class_offering.school_id = ${access.schoolId}::uuid
          AND class_offering.id = ${body.data.classOfferingId}::uuid
          AND (${access.branchId}::uuid IS NULL OR class_offering.branch_id = ${access.branchId}::uuid)
        RETURNING id
      `;
      const created = rows[0];
      if (!created) throw new Error("Class offering not found");
      await recordMutation(
        transaction,
        access,
        context.get("requestId"),
        "section_offering",
        created.id,
        "academic.section-offering.created.v1",
      );
      return created.id;
    });

    return context.json(
      AcademicMutationResponseSchema.parse({ id, resource: "section-offering" }),
      201,
    );
  } catch (error) {
    const mapped = mapDatabaseError(error);
    if (mapped) return context.json(mapped.body, mapped.status);
    throw error;
  }
});

academicRoutes.post("/subjects", async (context) => {
  const access = context.get("tenantAccess");
  const body = SubjectMasterCreateRequestSchema.safeParse(
    await context.req.json().catch(() => null),
  );

  if (!body.success) {
    return context.json(
      {
        type: "https://school-platform.local/problems/validation-error",
        title: "The subject is invalid",
        status: 400,
        errors: body.error.flatten(),
      },
      400,
    );
  }

  try {
    const id = await getDatabase().$transaction(async (transaction) => {
      await setTenantContext(transaction, access, context.get("requestId"));
      const rows = await transaction.$queryRaw<IdRow[]>`
        INSERT INTO subject_masters (
          school_id,
          code,
          name,
          short_name,
          status
        )
        VALUES (
          ${access.schoolId}::uuid,
          ${body.data.code},
          ${body.data.name},
          ${body.data.shortName},
          ${body.data.status}::"AcademicRecordStatus"
        )
        RETURNING id
      `;
      const created = rows[0];
      if (!created) throw new Error("Subject was not created");
      await recordMutation(
        transaction,
        access,
        context.get("requestId"),
        "subject_master",
        created.id,
        "academic.subject.created.v1",
      );
      return created.id;
    });

    return context.json(AcademicMutationResponseSchema.parse({ id, resource: "subject" }), 201);
  } catch (error) {
    const mapped = mapDatabaseError(error);
    if (mapped) return context.json(mapped.body, mapped.status);
    throw error;
  }
});

academicRoutes.post("/subject-offerings", async (context) => {
  const access = context.get("tenantAccess");
  const body = SubjectOfferingCreateRequestSchema.safeParse(
    await context.req.json().catch(() => null),
  );

  if (!body.success) {
    return context.json(
      {
        type: "https://school-platform.local/problems/validation-error",
        title: "The subject offering is invalid",
        status: 400,
        errors: body.error.flatten(),
      },
      400,
    );
  }

  if (access.branchId && access.branchId !== body.data.branchId) {
    return context.json(
      {
        type: "https://school-platform.local/problems/branch-scope",
        title: "The selected membership cannot manage that branch",
        status: 403,
      },
      403,
    );
  }

  try {
    const id = await getDatabase().$transaction(async (transaction) => {
      await setTenantContext(transaction, access, context.get("requestId"));
      const rows = await transaction.$queryRaw<IdRow[]>`
        INSERT INTO subject_offerings (
          school_id,
          branch_id,
          academic_year_id,
          class_offering_id,
          subject_master_id,
          compulsory,
          weekly_periods,
          status
        )
        VALUES (
          ${access.schoolId}::uuid,
          ${body.data.branchId}::uuid,
          ${body.data.academicYearId}::uuid,
          ${body.data.classOfferingId}::uuid,
          ${body.data.subjectMasterId}::uuid,
          ${body.data.compulsory},
          ${body.data.weeklyPeriods},
          ${body.data.status}::"AcademicOfferingStatus"
        )
        RETURNING id
      `;
      const created = rows[0];
      if (!created) throw new Error("Subject offering was not created");
      await recordMutation(
        transaction,
        access,
        context.get("requestId"),
        "subject_offering",
        created.id,
        "academic.subject-offering.created.v1",
      );
      return created.id;
    });

    return context.json(
      AcademicMutationResponseSchema.parse({ id, resource: "subject-offering" }),
      201,
    );
  } catch (error) {
    const mapped = mapDatabaseError(error);
    if (mapped) return context.json(mapped.body, mapped.status);
    throw error;
  }
});

academicRoutes.post("/teaching-assignments", async (context) => {
  const access = context.get("tenantAccess");
  const body = TeachingAssignmentCreateRequestSchema.safeParse(
    await context.req.json().catch(() => null),
  );

  if (!body.success) {
    return context.json(
      {
        type: "https://school-platform.local/problems/validation-error",
        title: "The teaching assignment is invalid",
        status: 400,
        errors: body.error.flatten(),
      },
      400,
    );
  }

  if (access.branchId && access.branchId !== body.data.branchId) {
    return context.json(
      {
        type: "https://school-platform.local/problems/branch-scope",
        title: "The selected membership cannot manage that branch",
        status: 403,
      },
      403,
    );
  }

  try {
    const id = await getDatabase().$transaction(async (transaction) => {
      await setTenantContext(transaction, access, context.get("requestId"));
      const rows = await transaction.$queryRaw<IdRow[]>`
        INSERT INTO teaching_assignments (
          school_id,
          branch_id,
          subject_offering_id,
          section_offering_id,
          teacher_membership_id,
          role,
          effective_from,
          effective_to,
          status
        )
        VALUES (
          ${access.schoolId}::uuid,
          ${body.data.branchId}::uuid,
          ${body.data.subjectOfferingId}::uuid,
          ${body.data.sectionOfferingId}::uuid,
          ${body.data.teacherMembershipId}::uuid,
          ${body.data.role}::"TeachingAssignmentRole",
          ${body.data.effectiveFrom}::date,
          ${body.data.effectiveTo ?? null}::date,
          ${body.data.status}::"TeachingAssignmentStatus"
        )
        RETURNING id
      `;
      const created = rows[0];
      if (!created) throw new Error("Teaching assignment was not created");
      await recordMutation(
        transaction,
        access,
        context.get("requestId"),
        "teaching_assignment",
        created.id,
        "academic.teaching-assignment.created.v1",
      );
      return created.id;
    });

    return context.json(
      AcademicMutationResponseSchema.parse({ id, resource: "teaching-assignment" }),
      201,
    );
  } catch (error) {
    const mapped = mapDatabaseError(error);
    if (mapped) return context.json(mapped.body, mapped.status);
    throw error;
  }
});
