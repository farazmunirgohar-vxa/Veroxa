# Legacy unapplied Supabase SQL

These eight files are historical pre-production foundations. They were never
recorded in the connected production project's Supabase migration ledger and
must not be replayed by `supabase db push`.

The authoritative production migration chain starts with the five versioned
files under `supabase/migrations/` dated 2026-07-12. The current Momo-only
foundation owns its versioned `veroxa_*` tables, and the Restaurant Audit
Center owns its separate `audit_*` tables.

Some legacy tables may exist in production from earlier manual/demo work. They
are preserved, are not used by the current Sites application, and are covered
by conditional release hardening where relevant. Do not move these files back
into the active migration directory or mark them as applied without a new
schema inventory, explicit RR, and a verified migration plan.
