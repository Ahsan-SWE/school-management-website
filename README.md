# School Platform Starter

Production-oriented monorepo foundation for the approved multi-tenant School Management
Platform architecture.

## Included now

- Next.js 16 web shell
- Hono API with a working health endpoint
- Background worker shell
- Expo SDK 57 mobile shell
- Python/FastAPI timetable optimiser shell
- Prisma 7 PostgreSQL models and generated-client setup
- Initial tenant tables, RLS helpers, policies, audit and outbox migration
- Shared contracts, validation, permissions, events, observability and UI packages
- Supabase local configuration
- GitHub Actions CI, Dependabot and CODEOWNERS
- Playwright starter test
- Contractor backlog and architecture/runbook documentation
- Authentication, school-owner onboarding, protected dashboard, and academic setup workspace

## Requirements

- Node.js 22.13+
- Corepack
- Docker Desktop or compatible Docker runtime for local Supabase
- Python 3.12+ for the timetable optimiser

## Quick start

```bash
cp .env.example .env
corepack enable
pnpm install
pnpm supabase:start
# Copy the local Supabase keys printed by the CLI into .env
pnpm db:deploy
pnpm db:seed
pnpm dev
```

Local endpoints:

- Web: `http://localhost:3000`
- API: `http://localhost:3001/api/v1/health`
- Supabase Studio: shown by `pnpm supabase:status`

The first `pnpm install` generates Prisma Client. Commit the generated `pnpm-lock.yaml`
before accepting dependency changes in a real GitHub repository.

## Vercel projects

Create separate Vercel projects initially:

1. **school-platform-web** — Root Directory: `apps/web`
2. **school-platform-api** — Root Directory: `apps/api`

The Hono API exports its application as the default export from `src/index.ts`, matching
Hono's Vercel deployment convention. The worker can later become a Vercel Service or
dedicated queue consumer after infrastructure credentials are provisioned.

## Database safety

The starter migration enables RLS, but hosted deployment must use a runtime PostgreSQL role
that is not a table owner and does not have `BYPASSRLS`. Prisma migrations use `DIRECT_URL`;
runtime requests use `DATABASE_URL`.

## Next implementation slice

The repository now includes authentication, owner onboarding, tenant selection, and academic setup. Continue with:

1. People & Access: teacher/employee creation and scoped roles
2. Student profiles and guardian relationships
3. Enrollment and subject registration
4. Tenant-isolation integration tests using a non-owner runtime role
5. Audit/outbox relay worker
6. Admission vertical slice

See `docs/IMPLEMENTATION_BACKLOG.md`.


## Authentication and onboarding slice

After applying the latest source update:

```bash
pnpm install
pnpm db:deploy
pnpm check
pnpm build
pnpm dev
```

Then open `http://localhost:3000/auth/register`.

The onboarding transaction creates:

- a school tenant
- the first branch
- the owner person and membership
- the school-owner role and baseline permissions
- an audit event
- a `school.provisioned.v1` outbox event

The dashboard at `http://localhost:3000/app` is protected by Supabase Auth and verifies the
selected membership through the API before writing the active-membership cookie.

See `docs/AUTH_ONBOARDING_SLICE.md`.
