import type { TenantContext } from "@school-platform/contracts";
import type { DatabaseClient } from "./client";
import type { Prisma } from "./generated/prisma/client";

export type TenantTransactionClient = Prisma.TransactionClient;

export async function withTenantTransaction<T>(
  database: DatabaseClient,
  context: TenantContext,
  work: (transaction: TenantTransactionClient) => Promise<T>,
): Promise<T> {
  return database.$transaction(async (transaction) => {
    await transaction.$executeRaw`
      SELECT set_config('app.user_account_id', ${context.userAccountId}, true)
    `;
    await transaction.$executeRaw`
      SELECT set_config('app.membership_id', ${context.membershipId}, true)
    `;
    await transaction.$executeRaw`
      SELECT set_config('app.school_id', ${context.schoolId}, true)
    `;
    await transaction.$executeRaw`
      SELECT set_config('app.branch_id', ${context.branchId ?? ""}, true)
    `;
    await transaction.$executeRaw`
      SELECT set_config('app.request_id', ${context.requestId}, true)
    `;

    return work(transaction);
  });
}
