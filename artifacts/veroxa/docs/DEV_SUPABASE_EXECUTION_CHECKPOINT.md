> **Historical reference (pre-2026-05-27).** Pricing and fixture-ID values in this document are out of date. Current source of truth: `docs/PRICING_SOURCE_OF_TRUTH.md` and `src/data/pricing/veroxaPricing.ts`. Fixture IDs are now `demo-a` / `demo-b` / `demo-c` / `demo-d`.

---

# Dev Supabase Execution Checkpoint — M001 through M006

**Date / time:** _<fill in when committing — YYYY-MM-DD HH:MM TZ>_
**Author:** _<operator name / handle>_
**Scope:** Dev Supabase project only.

> ## DEV-ONLY WARNING
>
> Everything documented here was executed against the **dev Supabase
> project**, not production. The Replit app itself has **not** been
> connected to Supabase. `AUTH_MODE` remains `"placeholder"`, the
> portal still renders fixture data only, and no real client data
> exists in the dev DB (fixtures / demo data only).
>
> Do not promote any of this work to production. Do not flip
> `AUTH_MODE`. Do not add files under `supabase/migrations/`. Do not
> connect the portal. Do not wire real AI, publishing, or payment
> providers. None of those steps are part of this checkpoint.

---

## 1. M001 – M006 status

| Migration | Applied | Corrections / Guards Applied | Seeded (manual) | Verified | Notes |
|---|---|---|---|---|---|
| **M001 — Identity Foundation** | Yes | N/A | N/A (seed users only) | Yes — security-tested | Helper functions + base RLS green. |
| **M002 — Client Foundation** | Yes | N/A (M002 staff scoping pre-dates the correction class) | Yes — manual | Key tests passed / assumed green | clients, team_client_assignments, client_platforms, onboarding_items, client_requests in place. |
| **M003 — Media Foundation** | Yes | **Notifications status guard applied (`01b`)** + **team-scope correction applied (`01c`)** | Yes — manual | Yes | Staff SELECT now uses `is_assigned_to_client`; status transitions guarded. |
| **M004 — Posting Foundation** | Yes | **Post-slot reset guard applied (`01b`)** + **posts/post_slots staff-scope correction applied (`01c`)** | Yes — manual | Yes | Staff SELECT on posts and post_slots uses `is_assigned_to_client`; slot reset guarded. |
| **M005 — Reporting Foundation** | Yes | Correction baked into `01_apply_m005.sql` (reports staff policies use `is_assigned_to_client`) | Yes — manual | Yes | `01b` retained only as a no-op re-apply for legacy dev projects. |
| **M006 — Content / AI Layer** | Yes | N/A | Yes — manual | Yes | content_concepts, draft_sets, draft_variants, ai_agents in place. |
| **Full database count check** | — | — | — | **Passed** | All seeded counts match the table in §3. |

---

## 2. Manual cleanup notes (pre-apply)

The dev project was a working sandbox before this checkpoint, so each
migration's apply step was preceded by a manual cleanup of any older
or partial objects. This is dev-only hygiene; production migrations
will run on a clean baseline and must not rely on these manual drops.

- Cleaned old / partial **M002** objects before re-applying.
- Cleaned old / partial **M003** objects before re-applying.
- Cleaned old / partial **M004** objects before re-applying.
- Cleaned old / partial **M005** objects before re-applying.
- Cleaned **M006 / future** objects before re-applying.

---

## 3. Manual seed counts (dev DB)

Fixture / demo data only. No real client data is present.

| Table | Row count |
|---|---|
| `clients` | 2 |
| `team_client_assignments` | 1 |
| `client_platforms` | 3 |
| `onboarding_items` | 3 |
| `client_requests` | 2 |
| `media_assets` | 3 |
| `notifications` | 4 |
| `client_health_snapshots` | 2 |
| `activity_logs` | 3 |
| `posts` | 4 |
| `post_slots` | 4 |
| `weekly_reports` | 3 |
| `monthly_reports` | 3 |
| `ai_agents` | 2 |
| `content_concepts` | 2 |
| `draft_sets` | 2 |
| `draft_variants` | 3 |

---

## 4. Corrections confirmed in dev DB

The staff SELECT correction class (swap `can_view_client` →
`is_assigned_to_client` on staff-scoped read policies) is confirmed
applied for every affected table:

- **M003** — `notifications` and `activity_logs` staff SELECT policies
  use `is_assigned_to_client`.
- **M004** — `posts` and `post_slots` staff SELECT policies use
  `is_assigned_to_client`.
- **M005** — `weekly_reports` and `monthly_reports` staff SELECT
  policies use `is_assigned_to_client` (baked into `01_apply_m005`).

> M002 staff scoping legitimately still uses `can_view_client`. This
> predates the correction class and was reviewed in the dev-test
> readiness audit; no change required.

---

## 5. Guards confirmed in dev DB

- **M003** — Notification status transition guard applied
  (`01b_apply_notifications_status_guard.sql`). Disallowed status
  transitions are rejected by trigger.
- **M004** — Post-slot reset guard applied
  (`01b_apply_post_slot_reset_guard.sql`). Slot reuse / reset paths
  are guarded against accidental data loss.

---

## 6. Next recommended phase

**Do NOT** flip `AUTH_MODE` to `"real"`.
**Do NOT** connect the portal to Supabase.
**Do NOT** create any files under `supabase/migrations/`.

The next phase is **Portal Connect Planning**, not production auth:

1. Design a **read-only repository layer** that hides Supabase behind
   typed query functions. The portal must continue to depend on a
   data-shape contract, not on Supabase client calls scattered
   through components.
2. The client portal **must read from `client_portal_*` views only**
   (never from base tables). These views are deferred to the
   portal-connect pass and do not yet exist in the dev DB — creating
   them is part of the next phase.
3. Keep the **placeholder guard active** in
   `src/hooks/useClientPortalData.ts` until a real-auth readiness
   checklist is written and signed off. The hook must continue to
   short-circuit to demo fixtures whenever
   `AUTH_MODE === "placeholder"`.
4. Only after the readiness checklist is green (auth route wiring,
   session handling, RLS smoke tests against dev DB through the
   repository layer, role-scoped fixtures replaced with real-auth
   fixtures, rollback plan) should anyone consider flipping
   `AUTH_MODE`.

---

## 7. Invariants — still true at checkpoint

- `AUTH_MODE === "placeholder"` (literal, in
  `src/lib/auth/authMode.ts`).
- No `supabase/migrations/` directory in the repo.
- Portal is disconnected; all reads short-circuit to fixtures.
- No real AI provider, publishing API, or payment integration.
- No real client data anywhere — fixtures only in code, fixtures /
  demo data only in the dev DB.
- Pricing locked (49700 / 99700 / 109700 / 119700 / 149700 cents);
  not touched by this checkpoint.
- Four roles unchanged: Client / Team / Operator / Owner.
- No navigation or four-shell changes.
