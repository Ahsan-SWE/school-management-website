# Contributing

1. Create a focused branch.
2. Add or update tests with every behaviour change.
3. Run `pnpm check` and `pnpm build`.
4. Database changes require a versioned SQL migration and RLS review.
5. API changes require contract updates.
6. Do not bypass tenant context, permissions, audit or idempotency.
7. Never commit credentials, personal data or production exports.
