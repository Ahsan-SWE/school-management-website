import "dotenv/config";
import { createDatabaseClient } from "../../packages/database/src/client";

const database = createDatabaseClient(process.env.DIRECT_URL ?? process.env.DATABASE_URL);

const demoSchoolId = "00000000-0000-4000-8000-000000000001";

async function main() {
  const school = await database.$transaction(async (transaction) => {
    await transaction.$executeRaw`
      SELECT set_config('app.school_id', ${demoSchoolId}, true)
    `;

    return transaction.school.upsert({
      where: { code: "DEMO-SCHOOL" },
      update: {},
      create: {
        id: demoSchoolId,
        code: "DEMO-SCHOOL",
        name: "Demo School",
        status: "ACTIVE",
        branches: {
          create: {
            code: "MAIN",
            name: "Main Campus",
            status: "ACTIVE",
          },
        },
      },
      include: { branches: true },
    });
  });

  console.log({
    schoolId: school.id,
    branchId: school.branches[0]?.id,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await database.$disconnect();
  });

