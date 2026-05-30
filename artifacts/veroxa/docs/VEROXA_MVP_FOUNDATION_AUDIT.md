# Veroxa MVP Foundation — Source-of-Truth Audit

_Staged stability + audit pass. Scope was deliberately conservative: verify the
merged codebase is stable, map what already exists, and avoid rewriting working
areas. No data model, portal, pricing, or positioning was changed during this pass._

## Post-merge stability (Stage 1)

- Working tree clean and in sync with `origin/main` (0 ahead / 0 behind).
- `pnpm install` — lockfile valid, nothing to install.
- `pnpm run typecheck` (all 4 packages: api-server, mockup-sandbox, veroxa, scripts) — **passes**.
- No merge-conflict markers anywhere under `artifacts/veroxa/src`.
- All three workflows running; public + portal + `/api/healthz` routes return 200.

**Result: the merged codebase builds cleanly. No build-breaking issues found, so no fixes were required.**

## What already exists (and is the source of truth)

### Data model — `src/lib/database/models.ts`
All 12 required objects exist with stable string IDs (documented as UUID PKs in
the real DB), enum-backed lifecycle statuses, `clientId` ownership links, and
`createdAt`/`updatedAt` timestamps (`ActivityLog` is append-only with `createdAt`):
`Client`, `ClientPlatform`, `OnboardingItem`, `MediaAsset`, `ContentConcept`,
`DraftSet`, `DraftVariant`, `Post`, `PostSlot`, `Notification`, `WeeklyReport`,
`MonthlyReport`, `ActivityLog`. Statuses live in `src/lib/database/enums.ts`.

### Client portal journey domain — `src/domain/clientPortalJourney/`
`types.ts`, `clientSafe.ts`, `repository.ts`, `weeklyUpdate.ts`, `monthlyReport.ts`,
`localVisibility.ts`, `languageSafety.ts`, `index.ts`. Pure model + client-safe
mapping. `languageSafety.ts` enforces a denylist so internal/AI/backend wording
cannot leak to clients.

### Client portal pages — `src/pages/client-*.tsx`
Dashboard, media, requests, updates, reports (plus onboarding, calendar, weekly/
monthly report, activity-log, account, google/local-visibility views).

### Team workflow — `src/pages/team-*.tsx`
Dashboard, work-queue, upload-inbox, media-review, ai-review, content-review,
drafts, scheduling, approval-queue, report-queue, plus related views. Lifecycle
states modeled via `src/lib/repositories/clientTeamWorkRepository.ts`.

### Roles & permissions (Stage 6)
`src/lib/permissions/` — `roles.ts` (client/team/operator/owner + system),
`permissionMatrix.ts`, `actions.ts`, `resources.ts`, `helpers.ts`. Domain-level
`can()` in `src/domain/users/permissions.ts`. Route access in
`src/domain/auth/routeAccess.ts`; guards in `src/components` route wrappers.

### Reporting (Stage 7)
Client-safe weekly/monthly generators in `clientPortalJourney/{weeklyUpdate,
monthlyReport}.ts`; internal report domain in `src/domain/reports/`. Demo data is
labeled as demo — no fake metrics presented as live.

### Automation / events / notifications / audit (Stage 8)
`src/domain/automation/{service,registry,types}.ts`, `src/domain/events/eventBus.ts`,
`src/domain/notifications/{service,engineV2,repository}.ts`,
`src/domain/audit/auditService.ts`, `src/lib/repositories/activityRepository.ts`.
Trigger/registry skeletons exist; no fragile external publishing is wired.

### Content supply & health (Stage 9)
`src/domain/clientHealth/engine.ts` computes unused media count, weekly posting
frequency, days/weeks of content left, and the exact health thresholds:
Healthy 14+ days, Caution 7–13, Urgent <7, Broken 0. Demo-valued and labeled.

### Persistence / data layer (Stage 3 adapter requirement)
`src/lib/data/` — `writeAdapter.ts` / `veroxaDataSource.ts` (adapter interface),
`supabaseReadOnlyData.ts` (read scaffolding, demo mode by default),
`devSupabaseWriteAdapter.ts` (metadata-only writes, gated behind
`VITE_VEROXA_ENABLE_DEV_WRITES`), `disabledWriteAdapter.ts`, readiness/verification
helpers. Default source of truth is in-memory demo fixtures.

## What is incomplete (intentionally deferred)

These are the prompt's own "future work" items and were **not** started this pass:

- Real database persistence (writes are metadata-only stubs, gated off by default).
- Real file storage for media uploads (currently metadata-only).
- AI media/concept/draft generation (no live AI calls from this foundation).
- Real scheduling engine and social publishing integrations.
- Google Business/Profile live metrics.
- Live notification delivery (creation logic is demo-scoped).

## What should be built next

1. Pick one persistence slice (e.g. media submissions) and move it from the
   demo adapter to the gated Supabase write adapter behind its existing flag.
2. Promote the operator portal pages that are already ready (tracked as a
   separate follow-up), keeping the visible-nav count invariant in sync.
3. Wire one end-to-end automation path (upload → usable → notification →
   activity log) through the existing event bus before adding external systems.

## What should not be touched yet

- Pricing and Veroxa positioning (locked).
- The 12 core data-model interfaces in `models.ts` (stable; extend, don't rewrite).
- Client-safe language guardrails in `clientPortalJourney/languageSafety.ts`.
- External integrations (AI, storage, scheduling, social, Google) — keep demo-labeled.
