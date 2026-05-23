# Veroxa — Database Documentation

## Purpose

This folder contains planning documentation for the Veroxa real database implementation.

**No database has been connected. This is planning only.**

The app is currently a static React/Vite demo. All data is hardcoded in `src/lib/demo-data/`. These documents describe how the real database will be structured when the project moves to Phase 4 and beyond.

---

## Files

| File | Purpose |
|------|---------|
| `SUPABASE_IMPLEMENTATION_PLAN.md` | Why Supabase/PostgreSQL, pre-connection checklist, phased build order |
| `TABLE_MAP.md` | TypeScript model → PostgreSQL table column-by-column mapping |
| `ENUM_MAP.md` | TypeScript enum → PostgreSQL `CREATE TYPE AS ENUM` mapping |
| `RLS_PLAN.md` | Draft Row Level Security policies per role |
| `MIGRATION_NOTES.md` | Critical rules for ID migration, locking, soft delete, append-only logs |

---

## Current build position

| Step | Description | Status |
|------|-------------|--------|
| 1 | Schema contracts (`src/lib/database/`) | ✓ Complete |
| 2 | Seed / demo data (`src/lib/demo-data/`) | ✓ Complete |
| 3 | Role permission contracts (`src/lib/permissions/`) | ✓ Complete |
| **4** | **Real database connection** | ← Next — pending SQL review |
| 5 | API layer | Planned |
| 6 | Authentication | Planned |
| 7 | Uploads / Storage | Planned |
| 8 | Automation engine | Planned |
| 9 | AI integration | Planned |
| 10 | Publishing / reporting integrations | Planned |

---

## Next step after review

Once this documentation has been reviewed and approved:

1. Create a Supabase project (dev environment only).
2. Draft `CREATE TYPE` statements for all enums (see `ENUM_MAP.md`).
3. Draft `CREATE TABLE` statements from `TABLE_MAP.md`.
4. Apply migrations to the dev Supabase project.
5. Import seed data from `src/lib/demo-data/` as SQL seed scripts.
6. Build the read-only API layer.

Do not connect the database, add credentials, or build auth until the SQL schema has been reviewed.
