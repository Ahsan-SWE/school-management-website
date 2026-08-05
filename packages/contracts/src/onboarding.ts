import { z } from "zod";

const CodeSchema = z
  .string()
  .trim()
  .min(2)
  .max(40)
  .regex(/^[A-Z0-9][A-Z0-9-]*$/, "Use uppercase letters, numbers, and hyphens only");

export const MembershipSummarySchema = z.object({
  membershipId: z.uuid(),
  schoolId: z.uuid(),
  schoolCode: z.string(),
  schoolName: z.string(),
  schoolStatus: z.string(),
  branchId: z.uuid().nullable(),
  branchCode: z.string().nullable(),
  branchName: z.string().nullable(),
  membershipType: z.string(),
  membershipStatus: z.string(),
  personDisplayName: z.string(),
});

export const MembershipListResponseSchema = z.object({
  memberships: z.array(MembershipSummarySchema),
});

export const SchoolOnboardingRequestSchema = z.object({
  ownerDisplayName: z.string().trim().min(2).max(200),
  schoolName: z.string().trim().min(2).max(200),
  schoolCode: CodeSchema,
  branchName: z.string().trim().min(2).max(200),
  branchCode: CodeSchema,
});

export const SchoolOnboardingResponseSchema = z.object({
  schoolId: z.uuid(),
  branchId: z.uuid(),
  membershipId: z.uuid(),
  schoolCode: z.string(),
  schoolName: z.string(),
  branchCode: z.string(),
  branchName: z.string(),
});

export const MembershipContextResponseSchema = MembershipSummarySchema;

export type MembershipSummary = z.infer<typeof MembershipSummarySchema>;
export type MembershipListResponse = z.infer<typeof MembershipListResponseSchema>;
export type SchoolOnboardingRequest = z.infer<typeof SchoolOnboardingRequestSchema>;
export type SchoolOnboardingResponse = z.infer<typeof SchoolOnboardingResponseSchema>;
