# Veroxa — Supabase / PostgreSQL Implementation Plan

## Status

Planning only. No database has been connected. No client, credentials, or environment variables exist yet.

---

## Recommended database: Supabase PostgreSQL

### Why relational fits Veroxa

Every operational object in Veroxa — media assets, content concepts, draft sets, draft variants, posts, reports, notifications, activity logs — carries a `client_id` foreign key. This makes a relational model a natural fit:

- Strong referential integrity across the content pipeline.
- Row Level Security (RLS) can scope all queries to `client_id` automatically.
- Enum types enforce status consistency at the database level.
- Supabase's built-in Auth integrates cleanly with RLS policies.
- Supabase Storage handles media uploads without a separate service.

### Source of truth during planning

The TypeScript contracts in `src/lib/database/` define the canonical shape of every entity. During planning, these files are the source of truth. The SQL schema must map to them, not diverge from them without a deliberate decision.

### Pre-connection checklist

Before connecting a real database:

- [ ] SQL schema reviewed and approved
- [ ] Enum types finalised
- [ ] RLS policy plan reviewed (`RLS_PLAN.md`)
- [ ] Migration rules confirmed (`MIGRATION_NOTES.md`)
- [ ] Supabase project created and scoped
- [ ] Service role key stored in environment secrets (never committed)

Auth must not be implemented until the database tables and RLS plan are approved.

---

## Phased Implementation Order

| Phase | Description |
|-------|-------------|
| **1** | SQL schema planning — draft `CREATE TABLE` statements from TypeScript contracts |
| **2** | Migrations — apply schema to Supabase dev project |
| **3** | Seed data import — port typed demo data from `src/lib/demo-data/` to SQL seed scripts |
| **4** | Read-only API layer — Express routes returning Supabase query results (GET only) |
| **5** | Role-based API permissions — apply `src/lib/permissions/` rules in API middleware |
| **6** | Authentication — Supabase Auth + JWT, RLS policies enforced |
| **7** | Uploads / Storage — Supabase Storage for media assets, replace `demo://` URLs |
| **8** | Automation jobs — scheduled jobs for health scoring, report generation, alerts |
| **9** | AI integrations — media quality review, caption generation, concept suggestion |
| **10** | Publishing / reporting integrations — Instagram, Facebook, Google Business Profile |
