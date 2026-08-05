# Contractor implementation backlog

## Foundation

- **WP-001** Repository bootstrap — included in this archive.
- **WP-002** Environment and secret management.
- **WP-003** CI/CD and preview database automation.
- **WP-004** Database baseline, runtime role and RLS verification.
- **WP-005** OpenTelemetry, Sentry and alerting.

## First production vertical slice

- **WP-010** Supabase authentication and session handling — implemented in the first auth slice.
- **WP-011** School and branch tenant context — onboarding and active-membership selection implemented; full runtime RLS context remains.
- **WP-012** People and membership — school-owner path implemented; guardian relationships remain.
- **WP-013** Scoped permission engine.
- **WP-014** Audit and transactional outbox.
- **WP-015** Private file service and malware scanning.
- **WP-016** Typed tenant configuration.
- **WP-500** School registration and verification.
- **WP-510** Tenant provisioning and owner onboarding.

## Academic operating core

- **WP-100** Academic years, periods, grade/class/section masters, subjects, and teacher assignments — implemented in the academic setup slice.
- **WP-110** Enrollment and subject registration.
- **WP-120** Admission lifecycle.
- **WP-130** Daily/period attendance.
- **WP-140** Manual and optimised timetable.
- **WP-150** Examination and results.
- **WP-160** Learning content, assignments and quizzes.

## Finance, people and operations

- **WP-200–270** Accounting, fees, procurement, assets, HR, leave, payroll and performance.
- **WP-300–360** Communication, library, transport, hostel, events and helpdesk.
- **WP-400–450** Restricted student services.
- **WP-520–550** Subscription, platform billing, usage and tenant lifecycle.
- **WP-600–670** Import, reporting, search, warehouse, integrations and privacy.

## Immediate acceptance criteria

1. A user can authenticate.
2. The user can select only an active membership.
3. Tenant A cannot read or mutate Tenant B.
4. A school owner can complete school/branch setup.
5. Every privileged mutation writes an audit event.
6. Background effects use an idempotent outbox consumer.
