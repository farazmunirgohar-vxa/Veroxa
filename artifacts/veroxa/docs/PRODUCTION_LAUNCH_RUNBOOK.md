# Veroxa Production Launch Runbook

> **Docs only.** Staged plan for moving Veroxa from a demo platform to a
> production system. **No stage past Stage 0 is in progress.** Each
> stage has its own gating prerequisites that must be met before the
> next stage begins.
>
> For the active five-phase pre-live roadmap, see [`VEROXA_OS_5_PHASE_PRELIVE_BUILD_MAP.md`](./VEROXA_OS_5_PHASE_PRELIVE_BUILD_MAP.md).

## Stage 0 — Current

- Public Client Demo: `/demo/client/dashboard`, `/demo/client/media`,
  `/demo/client/updates`, `/demo/client/requests`, and `/demo/client/reports`
  are sample-data routes and remain separate from real portal routes.
- Real Client Portal: `/client/*` is guarded by `ClientPortalGuard` and
  `RealPortalDataBoundary`. Placeholder preview login can enter the review
  portal, but production auth is still not enabled because `AUTH_MODE` remains
  `"placeholder"`.
- Team Portal: `/team/*` is guarded by `InternalDemoGuard role="team"` and
  `RealPortalDataBoundary`. Placeholder team login is not production auth.
- Docs and planning only for production auth, storage uploads, publishing, payments, and real client data.
- `VITE_VEROXA_DEV_*` placeholder credentials are preview-only; do not set them in public staging or production builds. Real auth must be reviewed before real client data is connected.

## Stage 1 — Team/Internal Admin alpha

- Real auth for **Veroxa Team / Internal Admin (Faraz)** first, with manual
  user creation only after explicit production-auth approval.
- No Owner or Operator dashboards; those roles remain parked unless Faraz
  explicitly requests them later.
- No client writes yet — just guarded Team/Internal Admin review access against
  real auth once that future gated work is approved.

## Stage 2 — Client read-only beta

- One test restaurant client onboarded manually.
- That client can log in to `/client/dashboard`.
- Read-only dashboard, reports, calendar — same queries as the demo,
  scoped by `client_id`.
- **Dev anon read policies removed** before this stage ships.
- No uploads, no writes from the client side.

## Stage 3 — Client onboarding writes

- First real write surface: onboarding answer saves
  (Priority 3 in `docs/FIRST_WRITE_SURFACE_PLAN.md`).
- `audit_logs` table live; every onboarding save writes an audit row.
- Team/Internal Admin review queue for completed onboarding.

## Stage 4 — Media upload beta

- Private `veroxa-client-media` bucket created.
- Server-side upload endpoint validates role / `client_id` / MIME /
  size.
- `media_assets` metadata rows + audit log rows on every upload.
- Team review queue wired against `media_assets.review_status`.

## Stage 5 — Team workflow beta

- Task status updates (Priority 1 writes).
- Draft workflow (concept → draft → approval).
- Report approval workflow (weekly + monthly).
- All transitions audited (see
  `docs/WORKFLOW_STATE_MACHINES.md`).

## Stage 6 — Manual publishing ops

- Veroxa tracks publish status for posts that humans post externally.
- No platform API calls yet.

## Stage 7 — AI-assisted content

- First AI provider integration (drafts only — captions, media
  summary, report drafts).
- Human approval gates remain in place everywhere.

## Stage 8 — Publishing integrations

- Direct platform API publishing (Meta, TikTok, GBP).
- Only after the previous stages are stable in production.

---

## Rollback principles

- Keep **demo routes separate** from real routes at all times. A
  `/demo/*` regression must never touch real client data.
- **Back up Supabase** (and export critical tables) before every
  migration.
- **Test RLS with separate users** for every role on every release
  that touches policies.
- **Feature-flag real routes** so a problematic surface can be turned
  off without redeploying.
- **Never remove the static demo fallback** until the corresponding
  real surface is stable in production traffic.

## Cross-references

- `docs/REAL_AUTH_READINESS_CHECKLIST.md`
- `docs/PRODUCTION_RLS_FINALIZATION_CHECKLIST.md`
- `docs/FIRST_WRITE_SURFACE_PLAN.md`
- `docs/SAFETY_AUDIT_CHECKLIST.md`
- `docs/WORKFLOW_STATE_MACHINES.md`
- `docs/AI_AGENT_ARCHITECTURE_PLAN.md`
- `docs/SOCIAL_PUBLISHING_PLAN.md`
- `docs/GOOGLE_SEO_GBP_PLAN.md`
