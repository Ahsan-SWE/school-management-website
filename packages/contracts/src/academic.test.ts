import { describe, expect, it } from "vitest";
import {
  AcademicPeriodCreateRequestSchema,
  AcademicYearCreateRequestSchema,
  TeachingAssignmentCreateRequestSchema,
} from "./academic";

describe("academic contracts", () => {
  it("accepts a valid academic year", () => {
    const result = AcademicYearCreateRequestSchema.parse({
      code: "AY-2026",
      name: "Academic Year 2026",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      status: "ACTIVE",
    });

    expect(result.code).toBe("AY-2026");
  });

  it("rejects a period whose end precedes its start", () => {
    const result = AcademicPeriodCreateRequestSchema.safeParse({
      academicYearId: "00000000-0000-4000-8000-000000000001",
      code: "TERM-1",
      name: "Term 1",
      periodType: "TERM",
      sequenceNumber: 1,
      startDate: "2026-06-01",
      endDate: "2026-05-01",
      status: "ACTIVE",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an assignment with an invalid effective range", () => {
    const result = TeachingAssignmentCreateRequestSchema.safeParse({
      branchId: "00000000-0000-4000-8000-000000000001",
      subjectOfferingId: "00000000-0000-4000-8000-000000000002",
      sectionOfferingId: "00000000-0000-4000-8000-000000000003",
      teacherMembershipId: "00000000-0000-4000-8000-000000000004",
      role: "LEAD",
      effectiveFrom: "2026-06-01",
      effectiveTo: "2026-05-01",
      status: "ACTIVE",
    });

    expect(result.success).toBe(false);
  });
});
