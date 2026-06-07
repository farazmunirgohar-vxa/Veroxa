# Route Page Inventory

Status: active real-pilot route inventory. Public demo/preview portal aliases are retired. See `QUARANTINED_AND_FUTURE_FILES_REVIEW.md` before routing parked pages.

## 2026-06-07 — PR #82 route and matcher alignment

- Matcher safety was strengthened after PR #81: city mismatch prevents exact prefill unless exact phone/domain, strong address, or platform/domain proof exists.
- Retired demo routes remain disabled, and no live auth, writes, storage uploads, live AI, connectors, payments, cron jobs, or automated publishing were added.
- Active portals remain only Client Portal and Team/Internal Admin Portal.

## Real-pilot route model

Veroxa now has only two active portal experiences: Client Portal and Team/Internal Admin Portal. The first real pilot client is **Momo House San Antonio**; internal operations run as **Team Faraz**. Public demo/preview portals are no longer part of the live app surface.

## Active public routes

- `/` — public home
- `/free-audit` — public/initial audit that can create a pre-live manual review lead
- `/login` — placeholder portal login
- `/services` — hidden compatibility route only; not the main funnel
- `/pricing` — hidden compatibility route only; not the main funnel

## Guarded client routes

- `/client/dashboard`
- `/client/onboarding`
- `/client/media`
- `/client/updates`
- `/client/requests`
- `/client/reports`

Client routes must be guarded by `ClientPortalGuard` and `RealPortalDataBoundary`. They show the Momo House San Antonio pre-live pilot state after placeholder client login, with missing/unverified fields clearly labeled for owner/team verification.

## Guarded Team/manual routes

- `/team/dashboard`
- `/team/onboarding`
- `/team/audit-leads`
- `/team/visibility-audit`
- `/team/upload-inbox`
- `/team/work-queue`
- `/team/approval-queue`
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
