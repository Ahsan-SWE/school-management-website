import { constants } from "node:fs";
import { access, copyFile } from "node:fs/promises";

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

if (!(await exists(".env"))) {
  await copyFile(".env.example", ".env");
  console.log("Created .env from .env.example");
} else {
  console.log(".env already exists");
}

console.log("Next: corepack enable && pnpm install && pnpm supabase:start");
