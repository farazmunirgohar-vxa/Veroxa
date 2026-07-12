# Service Plan Slug Audit — 2026-05-30

Current active public service plan slugs are:

- `essential`
- `growth`
- `premium`

Legacy/internal compatibility aliases may still appear in historical docs, audit recommendation logic, and already-created schema drafts/migrations:

- `google_optimization` → compatibility alias for Essential-style lead/audit recommendations
- `complete_online_presence` → compatibility alias for Growth-style lead/audit recommendations
- `complete_plus_ads` → compatibility alias for Premium-fit recommendations
- `ads_management_only` → compatibility alias for Premium-fit ad leads

## Remaining legacy slug locations

- `src/data/pricing/veroxaPricing.ts` keeps retired internal aliases so Free Audit and lead-scoring logic can map old recommendations to the active Essential/Growth/Premium model.
- `src/lib/audit/*` and `src/lib/leads/*` still accept legacy aliases for backward-compatible audit outputs; these are not public package labels.
- `supabase/archive/legacy_unapplied_migrations/20260601000000_m024a_first_client_metadata_schema.sql` defines legacy `service_plan` values but was never applied through the production migration ledger. Keep it as historical reference; do not reintroduce it to the active chain.
- `docs/sql_drafts/dev_test/m002/*`, `docs/sql_drafts/migrations_review/*`, and older schema drafts mention pre-current package slugs/prices as historical draft material.

## Future migration requirement before real client data

Before real client rows are created, add a deliberate non-destructive migration that:

1. Expands/changes `clients.service_plan` to support `essential`, `growth`, and `premium` as active values.
2. Preserves a safe compatibility mapping for legacy aliases if any existing development rows need migration.
3. Converts old values to the active slugs where appropriate.
4. Updates defaults away from `complete_online_presence` and toward the selected active launch default.
5. Keeps pricing and Premium readiness rules out of the database default logic unless explicitly needed later.

No production/auth/storage/publishing changes are included in this audit.
