# Veroxa — Draft SQL Migrations

## Status

**These are draft files only. Nothing has been applied to any database.**

No Supabase project is connected. No credentials exist. These files are for review before any real database work begins.

---

## Files

| File | Purpose |
|------|---------|
| `000_enable_extensions.sql` | Enables `pgcrypto` extension required for `gen_random_uuid()` |
| `001_create_enums.sql` | All PostgreSQL `CREATE TYPE AS ENUM` declarations |
| `002_create_tables.sql` | All 13 `CREATE TABLE` statements with PKs, FKs, constraints, and forward-reference FK fixes |
| `003_create_indexes.sql` | Performance indexes on `client_id` columns, status fields, date fields, and reuse-lock check columns |
| `004_create_triggers.sql` | `set_updated_at()` trigger on all mutable tables, post lock guard, report snapshot guard, activity_logs append-only guard |

---

## Source of truth

These SQL drafts are derived from:

- `src/lib/database/enums.ts` — enum values
- `src/lib/database/models.ts` — table columns and types
- `src/lib/database/relationships.ts` — foreign keys and integrity rules
- `src/lib/database/derivedMetrics.ts` — informs which columns are computed by system jobs
- `docs/database/TABLE_MAP.md` — column-by-column planning notes
- `docs/database/ENUM_MAP.md` — enum-to-SQL mapping
- `docs/database/MIGRATION_NOTES.md` — lock rules, soft delete, append-only, UUID strategy

---

## Application order

If and when these are applied, run them in sequence:

```
000_enable_extensions.sql
001_create_enums.sql
002_create_tables.sql
003_create_indexes.sql
004_create_triggers.sql
```

Do not skip or reorder. Extensions must be enabled first. Enums must exist before tables. Tables must exist before indexes and triggers.

---

## What is not yet included

These files intentionally omit:

- **RLS policies** — drafted in `docs/database/RLS_PLAN.md`; applied after auth is set up
- **`auth.users` foreign keys** — referenced as `UUID` columns in the drafts; the FK constraint is added after Supabase Auth is configured
- **Seed data** — the demo data in `src/lib/demo-data/` will become SQL `INSERT` seed scripts in a future step
- **Soft delete columns** — `deleted_at TIMESTAMPTZ` should be added to key tables before production use (see `MIGRATION_NOTES.md`)
- **`team_client_assignments` junction table** — planned for multi-team support, not yet drafted

---

## Next step after review

1. Review all five SQL files against `docs/database/TABLE_MAP.md` and `MIGRATION_NOTES.md`.
2. Create a Supabase dev project.
3. Apply migrations to the dev project.
4. Verify table structure in Supabase Table Editor.
5. Draft SQL seed scripts from `src/lib/demo-data/`.
6. Build the read-only API layer.

Do not apply to a production project or add credentials until the dev migration is verified.
