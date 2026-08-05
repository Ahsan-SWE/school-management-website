# Authentication and school-owner onboarding slice

## Delivered

- Supabase SSR clients for Next.js 16
- Cookie refresh through `proxy.ts`
- Email/password registration and sign-in
- Password reset and password update flow
- Optional Google OAuth button behind `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED`
- API bearer-token validation through Supabase Auth
- Authenticated membership list and membership-context endpoints
- Idempotent school-owner provisioning database function
- School, branch, person, membership, role, permission, audit, and outbox creation
- HttpOnly active-membership selection
- Protected onboarding and dashboard pages

## Local update commands

```powershell
pnpm install
pnpm db:deploy
pnpm check
pnpm build
pnpm dev
```

Open:

- Registration: `http://localhost:3000/auth/register`
- Sign in: `http://localhost:3000/auth/login`
- Protected dashboard: `http://localhost:3000/app`

## Local email behaviour

The local Supabase configuration currently disables email confirmation, so a new account
receives a session immediately. Hosted environments may require email confirmation.

## Google OAuth

Google login remains hidden until the provider is configured in Supabase and the environment
contains:

```env
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true
```

Do not enable the UI before configuring the provider and redirect URLs.

## Production database role

The local environment connects as `postgres`. Before production deployment, create a dedicated
runtime database role, grant only the required table/function privileges, and preserve the
non-owner/non-`BYPASSRLS` runtime requirement. Provisioning function execution must be granted
explicitly to the deployment runtime role.
