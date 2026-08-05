# Bootstrap status

## Completed

- WP-001 repository layout
- Web, API, worker, mobile, and timetable optimiser shells
- Database schema and initial RLS migration
- Local Supabase setup
- Email/password authentication pages
- Supabase SSR cookie refresh for Next.js 16
- Password reset flow
- Authenticated API token validation
- School-owner onboarding
- Tenant, branch, owner membership, role, audit, and outbox provisioning
- Protected dashboard and active-membership selection
- Academic setup vertical slice: years, periods, grades, class offerings, sections, subjects, and teacher assignments

## Partially completed

- WP-011 tenant context: membership selection exists; all business repositories must still use
  `withTenantTransaction`.
- WP-012 people: school-owner person exists; students, guardians, employees, and relationship
  verification remain.
- WP-013 permissions: owner baseline permissions exist; dynamic resolver and field permissions
  remain.
- WP-014 events: transactional outbox records exist; durable relay/consumer remains.

## Requires external credentials or accounts

- GitHub repository and push
- Vercel projects
- Hosted Supabase project
- Google OAuth client
- AWS S3/KMS/Secrets Manager
- Upstash Redis
- Sentry
- Provider sandboxes
