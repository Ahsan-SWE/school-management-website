import { randomUUID } from "node:crypto";

export function createTenantFixture() {
  return {
    userAccountId: randomUUID(),
    membershipId: randomUUID(),
    schoolId: randomUUID(),
    branchId: randomUUID(),
    requestId: randomUUID(),
  };
}
