# Static verification report

Generated during repository creation.

## Checks

- JSON files parsed successfully.
- TOML files parsed successfully.
- Python source compiled successfully.
- Workspace package names are unique.
- Workspace dependency references resolve to included packages.

## Not executed

- `pnpm install`
- Prisma client generation
- TypeScript compilation
- Next.js/Expo builds
- Unit or E2E tests

These require downloading dependencies. Run `pnpm install && pnpm check && pnpm build` after extraction.
