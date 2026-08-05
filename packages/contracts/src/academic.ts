import { z } from "zod";

const AcademicCodeSchema = z
  .string()
  .trim()
  .min(1)
  .max(40)
  .regex(/^[A-Z0-9][A-Z0-9-]*$/, "Use uppercase letters, numbers, and hyphens only");

const NameSchema = z.string().trim().min(2).max(200);
const DateSchema = z.iso.date();

export const AcademicYearStatusSchema = z.enum(["DRAFT", "ACTIVE", "CLOSED", "ARCHIVED"]);
export const AcademicPeriodTypeSchema = z.enum(["TERM", "SEMESTER", "QUARTER", "CUSTOM"]);
export const AcademicRecordStatusSchema = z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]);
export const AcademicOfferingStatusSchema = z.enum(["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"]);
export const TeachingAssignmentRoleSchema = z.enum(["LEAD", "ASSISTANT"]);
export const TeachingAssignmentStatusSchema = z.enum(["ACTIVE", "INACTIVE", "ENDED"]);

export const AcademicYearCreateRequestSchema = z
  .object({
    code: AcademicCodeSchema,
    name: NameSchema,
    startDate: DateSchema,
    endDate: DateSchema,
    status: AcademicYearStatusSchema.default("DRAFT"),
  })
  .refine((value) => value.startDate <= value.endDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

export const AcademicPeriodCreateRequestSchema = z
  .object({
    academicYearId: z.uuid(),
    code: AcademicCodeSchema,
    name: NameSchema,
    periodType: AcademicPeriodTypeSchema,
    sequenceNumber: z.coerce.number().int().min(1).max(20),
    startDate: DateSchema,
    endDate: DateSchema,
    status: AcademicRecordStatusSchema.default("ACTIVE"),
  })
  .refine((value) => value.startDate <= value.endDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

export const GradeLevelCreateRequestSchema = z.object({
  code: AcademicCodeSchema,
  name: NameSchema,
  sequenceNumber: z.coerce.number().int().min(1).max(1000),
  status: AcademicRecordStatusSchema.default("ACTIVE"),
});

export const ClassOfferingCreateRequestSchema = z.object({
  branchId: z.uuid(),
  academicYearId: z.uuid(),
  gradeLevelId: z.uuid(),
  code: AcademicCodeSchema,
  name: NameSchema,
  capacity: z.coerce.number().int().min(1).max(5000),
  status: AcademicOfferingStatusSchema.default("DRAFT"),
});

export const SectionOfferingCreateRequestSchema = z.object({
  classOfferingId: z.uuid(),
  code: AcademicCodeSchema,
  name: NameSchema,
  capacity: z.coerce.number().int().min(1).max(1000),
  status: AcademicOfferingStatusSchema.default("DRAFT"),
});

export const SubjectMasterCreateRequestSchema = z.object({
  code: AcademicCodeSchema,
  name: NameSchema,
  shortName: z.string().trim().min(1).max(40),
  status: AcademicRecordStatusSchema.default("ACTIVE"),
});

export const SubjectOfferingCreateRequestSchema = z.object({
  branchId: z.uuid(),
  academicYearId: z.uuid(),
  classOfferingId: z.uuid(),
  subjectMasterId: z.uuid(),
  compulsory: z.boolean().default(true),
  weeklyPeriods: z.coerce.number().int().min(1).max(30),
  status: AcademicOfferingStatusSchema.default("DRAFT"),
});

export const TeachingAssignmentCreateRequestSchema = z
  .object({
    branchId: z.uuid(),
    subjectOfferingId: z.uuid(),
    sectionOfferingId: z.uuid(),
    teacherMembershipId: z.uuid(),
    role: TeachingAssignmentRoleSchema.default("LEAD"),
    effectiveFrom: DateSchema,
    effectiveTo: DateSchema.nullable().optional(),
    status: TeachingAssignmentStatusSchema.default("ACTIVE"),
  })
  .refine((value) => !value.effectiveTo || value.effectiveFrom <= value.effectiveTo, {
    message: "Effective end date must be on or after the start date",
    path: ["effectiveTo"],
  });

export const AcademicMutationResponseSchema = z.object({
  id: z.uuid(),
  resource: z.string().min(1),
});

export const AcademicBranchSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  name: z.string(),
  status: z.string(),
});

export const AcademicPeriodSchema = z.object({
  id: z.uuid(),
  academicYearId: z.uuid(),
  code: z.string(),
  name: z.string(),
  periodType: AcademicPeriodTypeSchema,
  sequenceNumber: z.number().int(),
  startDate: DateSchema,
  endDate: DateSchema,
  status: AcademicRecordStatusSchema,
});

export const AcademicYearSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  name: z.string(),
  startDate: DateSchema,
  endDate: DateSchema,
  status: AcademicYearStatusSchema,
});

export const GradeLevelSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  name: z.string(),
  sequenceNumber: z.number().int(),
  status: AcademicRecordStatusSchema,
});

export const ClassOfferingSchema = z.object({
  id: z.uuid(),
  branchId: z.uuid(),
  academicYearId: z.uuid(),
  gradeLevelId: z.uuid(),
  code: z.string(),
  name: z.string(),
  capacity: z.number().int(),
  status: AcademicOfferingStatusSchema,
  academicYearName: z.string(),
  gradeLevelName: z.string(),
  sectionCount: z.number().int().nonnegative(),
});

export const SectionOfferingSchema = z.object({
  id: z.uuid(),
  classOfferingId: z.uuid(),
  code: z.string(),
  name: z.string(),
  capacity: z.number().int(),
  status: AcademicOfferingStatusSchema,
  classOfferingName: z.string(),
});

export const SubjectMasterSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  name: z.string(),
  shortName: z.string(),
  status: AcademicRecordStatusSchema,
});

export const SubjectOfferingSchema = z.object({
  id: z.uuid(),
  branchId: z.uuid(),
  academicYearId: z.uuid(),
  classOfferingId: z.uuid(),
  subjectMasterId: z.uuid(),
  subjectCode: z.string(),
  subjectName: z.string(),
  classOfferingName: z.string(),
  compulsory: z.boolean(),
  weeklyPeriods: z.number().int(),
  status: AcademicOfferingStatusSchema,
});

export const EligibleTeacherSchema = z.object({
  membershipId: z.uuid(),
  branchId: z.uuid().nullable(),
  displayName: z.string(),
  membershipType: z.string(),
});

export const TeachingAssignmentSchema = z.object({
  id: z.uuid(),
  branchId: z.uuid(),
  subjectOfferingId: z.uuid(),
  sectionOfferingId: z.uuid(),
  teacherMembershipId: z.uuid(),
  teacherName: z.string(),
  subjectName: z.string(),
  classOfferingName: z.string(),
  sectionName: z.string(),
  role: TeachingAssignmentRoleSchema,
  effectiveFrom: DateSchema,
  effectiveTo: DateSchema.nullable(),
  status: TeachingAssignmentStatusSchema,
});

export const AcademicOverviewResponseSchema = z.object({
  branches: z.array(AcademicBranchSchema),
  academicYears: z.array(AcademicYearSchema),
  academicPeriods: z.array(AcademicPeriodSchema),
  gradeLevels: z.array(GradeLevelSchema),
  classOfferings: z.array(ClassOfferingSchema),
  sectionOfferings: z.array(SectionOfferingSchema),
  subjectMasters: z.array(SubjectMasterSchema),
  subjectOfferings: z.array(SubjectOfferingSchema),
  eligibleTeachers: z.array(EligibleTeacherSchema),
  teachingAssignments: z.array(TeachingAssignmentSchema),
});

export type AcademicOverviewResponse = z.infer<typeof AcademicOverviewResponseSchema>;
export type AcademicMutationResponse = z.infer<typeof AcademicMutationResponseSchema>;
