# ADR-0002: Shared PostgreSQL with mandatory tenant RLS

## Status

Accepted.

## Decision

Use a shared PostgreSQL schema with `school_id`, composite tenant foreign keys, server-derived
tenant context, and PostgreSQL Row-Level Security.

## Security requirements

- Runtime role is not a table owner.
- Runtime role has no `BYPASSRLS`.
- All tenant database work uses `withTenantTransaction`.
- Request body school identifiers never override authenticated context.
- Cross-tenant negative tests are release-blocking.
