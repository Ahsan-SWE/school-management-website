# Agent Instructions

## Next.js

This repository targets Next.js 16. Before editing the web application, read the installed
documentation in `apps/web/node_modules/next/dist/docs/` after dependencies are installed.
Do not assume older Next.js API behaviour.

## Architecture rules

- Browser and mobile code never import Prisma.
- Tenant identity is derived on the server, not trusted from request bodies.
- Tenant-scoped database work must use `withTenantTransaction`.
- RLS migrations are reviewed as security-sensitive changes.
- Business transactions write audit/outbox records in the same transaction where required.
- Do not add certificate, certification, or digital credential features.
