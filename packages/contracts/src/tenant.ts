import { z } from "zod";

export const TenantContextSchema = z.object({
  userAccountId: z.uuid(),
  membershipId: z.uuid(),
  schoolId: z.uuid(),
  branchId: z.uuid().nullable(),
  requestId: z.string().min(1),
});

export type TenantContext = z.infer<typeof TenantContextSchema>;
