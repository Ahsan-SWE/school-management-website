-- Run this script with a non-owner runtime role after applying migrations.
-- It documents the minimum RLS smoke test expected in CI/staging.

BEGIN;

SELECT set_config(
  'app.school_id',
  '00000000-0000-0000-0000-000000000001',
  true
);

-- Expected: only the selected school is visible.
SELECT id, code, name FROM schools;

-- Expected: only rows with the selected school_id are visible.
SELECT id, school_id, code, name FROM branches;

ROLLBACK;
