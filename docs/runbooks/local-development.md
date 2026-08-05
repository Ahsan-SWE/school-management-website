# Local development runbook

1. Install Node 22.13+, Corepack, Docker and Python 3.12.
2. Run `pnpm bootstrap`.
3. Run `corepack enable && pnpm install`.
4. Run `pnpm supabase:start`.
5. Copy local Supabase keys into `.env`.
6. Run `pnpm db:deploy && pnpm db:seed`.
7. Run `pnpm dev`.

## Database reset

Use the Supabase CLI reset command only in local development. Never run destructive reset
commands against staging or production.

## Troubleshooting

- Prisma generation needs a syntactically valid connection URL but does not require a live
  database for normal client generation.
- If RLS tests unexpectedly pass for all tenants, verify the test connection is not the table
  owner and does not have `BYPASSRLS`.
