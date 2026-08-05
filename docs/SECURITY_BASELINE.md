# Security baseline

- Server-derived tenant context.
- PostgreSQL RLS and composite tenant foreign keys.
- MFA for privileged roles.
- No plaintext application/provider secrets in PostgreSQL.
- Private object storage and short-lived signed downloads.
- Idempotency for payments, imports, webhooks and worker effects.
- Immutable audit events.
- Restricted schemas excluded from generic APIs/search/warehouse.
- Production credentials unavailable in preview environments.
- Cross-tenant exposure, auth bypass and financial corruption cannot be waived.
