# Route Page Inventory

Status: active real-pilot route inventory. Public demo/preview portal aliases are retired. See `QUARANTINED_AND_FUTURE_FILES_REVIEW.md` before routing parked pages.

## 2026-06-07 — PR #82 route and matcher alignment

- Matcher safety was strengthened after PR #81: city mismatch prevents exact prefill unless exact phone/domain, strong address, or platform/domain proof exists.
- Retired demo routes remain disabled, and no live auth, writes, storage uploads, live AI, connectors, payments, cron jobs, or automated publishing were added.
- Active portals remain only Client Portal and Team/Internal Admin Portal.

## 2026-06-07 — Real Login V1 route/auth alignment

- Login copy is production/custom-domain clean: “Sign in to Veroxa” / “Access your Veroxa portal.”
- Pilot login destinations remain only Client Portal (`/client/dashboard`) and Team/Internal Admin Portal (`/team/dashboard`).
- Pilot account labels are Momo House San Antonio and Team Faraz. `AUTH_MODE` remains `placeholder`, so access is deterministic/manual rather than secure production auth.
- Retired public demo/preview portal routes remain disabled, and no Owner/Operator/Super Admin/generic Admin/Execution portals are active.

## Real-pilot route model

Veroxa now has only two active portal experiences: Client Portal and Team/Internal Admin Portal. The first real pilot client is **Momo House San Antonio**; internal operations run as **Team Faraz**. Public demo/preview portals are no longer part of the live app surface.

## Active public routes

- `/` — public home
- `/free-audit` — public/initial audit that can create a pre-live manual review lead
- `/login` — Real Login V1 pilot portal access for Momo House San Antonio and Team Faraz; deterministic/manual while `AUTH_MODE` remains `placeholder`
- `/services` — hidden compatibility route only; not the main funnel
- `/pricing` — hidden compatibility route only; not the main funnel

## Guarded client routes

Primary CP-V1 client navigation is exactly: Home, Media, Messages, Reports, Connections, Profile.

- `/client/dashboard` — Home
- `/client/media` — Media
- `/client/messages` — Messages
- `/client/reports` — Reports, including Weekly Updates and Monthly Reports
- `/client/connections` — Connections status for Meta Business Suite and Google Business Profile only
- `/client/profile` — editable business-truth Profile for Veroxa review

Hidden compatibility aliases may remain guarded only for continuity: `/client/onboarding`, `/client/updates`, and `/client/requests`. They must not appear in primary client navigation, and client-facing copy should model communication as Messages rather than tickets or requests.

Client routes must be guarded by `ClientPortalGuard` and `RealPortalDataBoundary`. They show the Momo House San Antonio pre-live pilot state after placeholder client login, with missing/unverified fields clearly labeled for owner/team verification. CP-V1 remains manual/pre-live: no live integrations, storage uploads, database writes, live AI, payments, or automated publishing.

## Guarded Team/manual routes

- `/team/dashboard`
- `/team/onboarding`
- `/team/audit-leads`
- `/team/visibility-audit`
- `/team/upload-inbox`
- `/team/work-queue`
- `/team/approval-queue`
- `/team/profile-corrections` — PR #104 gated Profile Correction Queue; real auth + explicit flag only, no public/platform updates
- `/team/direction-queue`
- `/team/report-queue`
- `/team/manual-execution`
- `/team/first-client-readiness`
- `/team/first-client-ops`

Team routes must be guarded by `InternalDemoGuard role=team` and `RealPortalDataBoundary`. Team surfaces should identify as Team Faraz and stay action-focused around Momo House audit review, audit-to-onboarding prefill, onboarding gaps, platform/credential checklists, media/content workflow, report/request/approval queues, first-week execution, and first-month report readiness.

## Disabled public demo/preview portal routes

These routes must fail guardrails if reintroduced: `/demo`, `/guided-demo`, `/upload`, `/demo/client/dashboard`, `/demo/client/media`, `/demo/client/updates`, `/demo/client/requests`, `/demo/client/reports`, and `/demo/client/onboarding`.

## Parked/blocked route classes

Owner, Operator, Super Admin, generic Admin, and Execution portals must not be exposed. Parked pages require owner approval, route inventory update, route surface map update, guardrail update, and RR before routing.

## Audit-to-onboarding visibility

Onboarding must show field status for: `prefilled_by_veroxa`, `needs_owner_verification`, `missing`, `owner_corrected`, `completed_by_team`, and `blocked_needs_access`. Sources can include audit, public info, owner, Veroxa team, and manual review. City/state matched means both city and state matched; city-conflicting prefill is manual review unless exact phone/domain/strong address/platform proof exists.

Retired demo/preview files remain quarantined unless the owner explicitly approves re-routing with docs and guardrails updated.


## 2026-06-13 — Momo CP-V1 live pilot readiness

- CP-V1 primary nav remains exactly Home, Media, Messages, Reports, Connections, Profile.
- `/client/requests` is a hidden guarded alias to Messages.
- `/client/updates` is a hidden guarded alias to Reports.
- `/client/onboarding` is a hidden guarded alias to the Profile setup-review experience.
- `/api/pilot-access` is the Vercel serverless pilot-login endpoint; SPA rewrites must not swallow `/api/*`.
- Manual/pre-live boundaries remain locked: no production auth, database writes, storage uploads, live integrations, OAuth, live AI, payments, publishing, cron jobs, fake metrics, fake upload success, or fake message delivery.

- `/team/messages` — guarded Team Portal Message Inbox for PR #104 portal-only real messages; requires Team login and remains empty in placeholder mode without fake messages.

## PR #105 route addition

- `/team/activity-log` — guarded Team Portal route for Activity Log Foundation. It requires Team auth route protection and the Activity Log runtime gate; placeholder mode shows an honest empty review state, not fake activity.
- `/client/dashboard` includes a small “Recent Veroxa Activity” card that only reads explicit `client_visible` activity when real auth and `VITE_VEROXA_ACTIVITY_LOG_ENABLED=true` are active.


## PR #106 route addition

- `/team/ai-drafts` — guarded Team-only AI Draft Queue for internal draft review. Requires real auth plus `VITE_VEROXA_AI_DRAFTS_ENABLED=true`; placeholder mode is empty/review-only. No client AI draft route, no publishing, no report generation.

## 2026-06-18 — GitHub PR #107 Team Automation Control Center Foundation

- GitHub PR #107 adds Team Automation Control Center Foundation only.
- PR #106 AI Draft Preparation is already merged.
- `/team/control-center` is Team-only/internal-only and summarizes existing queues from media, messages, profile corrections, activity log, AI drafts, and safe approvals when present.
- Control Center does not publish, does not generate reports, does not activate integrations, and does not contact clients.
- Reports From Activity remain PR #108.
- Momo Live Pilot Readiness Gate remains PR #109.
- Controlled Momo Pilot Activation Gate remains PR #110.
- `AUTH_MODE` remains `placeholder`.
- Momo owner walkthrough remains blocked.

## PR #108 route addition

- `/team/reports-from-activity` — Team-only Reports From Activity Foundation for report drafts from real Veroxa activity/work history. Guarded by `InternalDemoGuard role="team"` and `RealPortalDataBoundary portal="team"`. It does not create fake metrics, does not use external analytics, does not claim revenue/orders/rankings/ROI/customers/walk-ins, and does not publish externally. Client-visible reports require Team review and are visible inside the client portal only. `AUTH_MODE` remains `placeholder`; Momo owner walkthrough remains blocked; PR #109 remains Momo Live Pilot Readiness Gate and PR #110 remains Controlled Momo Pilot Activation Gate.
