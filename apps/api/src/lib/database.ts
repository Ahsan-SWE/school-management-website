import { getApiEnvironment } from "@school-platform/configuration";
import { createDatabaseClient } from "@school-platform/database";

const globalDatabase = globalThis as typeof globalThis & {
  schoolPlatformDatabase?: ReturnType<typeof createDatabaseClient>;
};

export function getDatabase() {
  if (!globalDatabase.schoolPlatformDatabase) {
    const environment = getApiEnvironment();
    globalDatabase.schoolPlatformDatabase = createDatabaseClient(environment.DATABASE_URL);
  }

  return globalDatabase.schoolPlatformDatabase;
}
