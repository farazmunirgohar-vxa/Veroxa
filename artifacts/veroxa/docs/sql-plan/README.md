# SQL Planning Folder

**Planning files only. These are not active migrations.**

Files in this folder describe future Supabase schema, RLS, and write
function contracts for Veroxa's first real client. They live here
intentionally so they are reviewable and version-controlled without
being executed.

## Rules

- Do **not** move these into `supabase/migrations/`.
- Do **not** run them against any database from this folder.
- Actual migrations require owner approval and a separate prompt
  (M023C / M024 or later).
- No real writes are enabled by anything in this folder.

## Contents

- `M023A_FIRST_CLIENT_SCHEMA_PLAN.sql.txt` — proposed tables, columns,
  index hints, audit fields. Plain text on purpose.
- `M023A_RLS_POLICY_PLAN.md` — narrative RLS plan.
- `M023B_WRITE_FUNCTION_SPEC.md` — TypeScript write function contracts
  (purpose, inputs, outputs, safety, failure modes).

## Reminders

- No Supabase service role key in the frontend.
- Real auth strategy is still `AUTH_MODE=placeholder`; this must be
  finalized before production writes are turned on.
- All errors from future writes must be transformed into safe,
  client-facing messages — never raw DB errors.
