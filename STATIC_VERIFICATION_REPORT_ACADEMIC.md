# Academic setup static verification report

Generated while preparing the academic setup update.

## Passed

- All JSON files parsed successfully.
- All TOML files parsed successfully.
- Python source compiled successfully.
- TypeScript and TSX source parsed without syntax diagnostics.
- Workspace package references resolve to included packages.
- Academic migration contains all eight expected tables.
- Every new academic table enables and forces PostgreSQL RLS.
- No `.env`, Supabase local runtime secrets, or service-role values are included.
- Update and full-source archives use portable forward-slash paths.

## Requires execution on the project machine

- `pnpm db:generate`
- `pnpm db:deploy`
- `pnpm check`
- `pnpm build`
- Authenticated browser workflow against the running local Supabase stack
- Tenant-isolation test using a non-owner/non-`BYPASSRLS` runtime role

The included updater executes the first four commands when `-RunCommands` is supplied.
