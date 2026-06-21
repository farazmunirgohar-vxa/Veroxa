## 2026-06-21 — Post-PR120 internal route lock

- `/team/momo-ai-generation` is Team-only/internal-only; no AI provider calls, no generated AI output, no DB writes, no publishing, no client exposure.
- `/team/momo-ai-approval` is Team-only/internal-only; no auto-approval, no publishing, no client exposure, no external side effects.
- `/team/momo-dry-run-go-no-go` is the PR #120 Team-only/internal-only Momo Dry Run route; no DB writes, no external side effects, no auth activation, no publishing, no client exposure.
- Old walkthrough/launch docs are historical/blocked references only and are not active owner-facing flow.
- AUTH_MODE remains placeholder. /api/pilot-access remains active. Roles remain client/team only. Momo owner walkthrough remains blocked. No next activation PR is approved by default. Future real-world activation requires separate explicit Faraz approval.

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
- Controlled Momo Pilot Activation Gate was delivered by PR #111; PR #112 is corrective alignment only.
- `AUTH_MODE` remains `placeholder`.
- Momo owner walkthrough remains blocked.

## PR #108 route addition

- `/team/reports-from-activity` — Team-only Reports From Activity Foundation for report drafts from real Veroxa activity/work history. Guarded by `InternalDemoGuard role="team"` and `RealPortalDataBoundary portal="team"`. It does not create fake metrics, does not use external analytics, does not claim revenue/orders/rankings/ROI/customers/walk-ins, and does not publish externally. Client-visible reports require Team review and are visible inside the client portal only. `AUTH_MODE` remains `placeholder`; Momo owner walkthrough remains blocked; PR #109 Momo Live Pilot Readiness Gate, PR #110 Post-PR109 readiness alignment, and PR #111 Controlled Momo Pilot Activation Gate are already merged.

- `/team/momo-live-readiness` → `src/pages/team-momo-live-readiness.tsx`; Team-only Momo Live Pilot Readiness Gate added by GitHub PR #109. It is guarded by `InternalDemoGuard role="team"` and `RealPortalDataBoundary portal="team"`; `AUTH_MODE` remains `placeholder`, `/api/pilot-access` remains active, PR #110, PR #111, and PR #112 are merged; no next activation PR is approved by default, and Momo owner walkthrough remains blocked.

## Team route — PR #111 Controlled Momo Pilot Activation Gate

- `/team/momo-activation-gate` renders `artifacts/veroxa/src/pages/team-momo-activation-gate.tsx`.
- GitHub PR #111 adds Controlled Momo Pilot Activation Gate only. PR #109 Momo Live Pilot Readiness Gate is already merged and PR #110 Post-PR109 Momo readiness alignment is already merged.
- The route is Team-only, guarded by `InternalDemoGuard role="team"`, and wrapped in `RealPortalDataBoundary portal="team"`.
- This PR does not activate the pilot by default, does not activate real auth, does not create client credentials, does not contact Momo’s House, does not publish externally, does not create platform integrations, and does not add payments, webhooks, cron jobs, or background jobs. `AUTH_MODE` remains `placeholder`; `/api/pilot-access` remains active. Momo owner walkthrough remains blocked until Faraz explicitly approves activation/walkthrough after the gate.


## 2026-06-19 — PR #112 Post-PR111 Activation Gate Alignment

GitHub PR #112 is **Post-PR111 Activation Gate Alignment + Business Truth Status Hardening**. PR #109 Momo Live Pilot Readiness Gate is already merged, PR #110 Post-PR109 Momo readiness alignment is already merged, and PR #111 Controlled Momo Pilot Activation Gate is already merged. PR #112 corrects activation/readiness gate interpretation of current business-truth profile-field statuses (`please_review`, `pre_filled`, `confirmed`, `optional`, `veroxa_review`) and removes stale PR #110 activation-gate wording. PR #112 is corrective alignment only: it does not activate the pilot, does not activate real auth, does not create credentials, does not contact Momo’s House, does not publish externally, does not create platform integrations, and does not add payments, webhooks, cron jobs, or background jobs. `AUTH_MODE` remains `placeholder`, `/api/pilot-access` remains active, Momo owner walkthrough remains blocked, no next activation PR is approved by default, and Future real-world activation requires separate explicit Faraz approval.

## 2026-06-19 — PR #113 Post-PR112 source-of-truth finalization

Latest completed Live Automation V1 alignment is through PR #112. PR #113 is source-of-truth finalization only and is not an activation PR.

Merged sequence truth:

- PR #109 Momo Live Pilot Readiness Gate is merged.
- PR #110 Post-PR109 Momo readiness alignment is merged.
- PR #111 Controlled Momo Pilot Activation Gate is merged.
- PR #112 Post-PR111 Activation Gate Alignment + Business Truth Status Hardening is merged.

PR #112 hardened current business-truth profile-field status interpretation for `please_review`, `pre_filled`, `confirmed`, `optional`, and `veroxa_review`, and removed stale PR #110 activation-gate wording. No next activation PR is approved by default. Momo owner walkthrough remains blocked. `AUTH_MODE` remains `placeholder`. `/api/pilot-access` remains active. Real auth remains off. No external integrations are connected. No credentials, auth users, owner/client invitations, Momo contact, external publishing, platform connections, payments, webhooks, cron jobs, background jobs, scheduled jobs, or fake readiness/data are approved or added. Future real-world activation, real-auth activation, external platform setup, or owner walkthrough requires separate explicit Faraz approval.

Route surface truth after PR #112 and PR #113: `/team/momo-live-readiness` remains Team-only/internal-only. `/team/momo-activation-gate` remains Team-only/internal-only. No client activation route exists. No owner walkthrough route is active. No route activates real auth, credentials, external publishing, platform connections, payments, webhooks, cron jobs, background jobs, scheduled jobs, or fake data.


## PR #114 — Momo Internal Pilot Prep Pack

- GitHub PR #114 adds Momo Internal Pilot Prep Pack only.
- PR #109 Momo Live Pilot Readiness Gate is merged.
- PR #110 Post-PR109 Momo readiness alignment is merged.
- PR #111 Controlled Momo Pilot Activation Gate is merged.
- PR #112 Post-PR111 Activation Gate Alignment + Business Truth Status Hardening is merged.
- PR #113 Post-PR112 Source-of-Truth Finalization is merged.
- PR #114 is internal preparation only.
- PR #114 does not activate the pilot.
- PR #114 does not activate real auth.
- PR #114 does not create credentials.
- PR #114 does not contact Momo’s House.
- PR #114 does not publish externally.
- PR #114 does not connect external platforms.
- PR #114 does not add payments, webhooks, cron jobs, background jobs, scheduled jobs, or automation runners.
- AUTH_MODE remains placeholder.
- /api/pilot-access remains active.
- Roles remain client/team only.
- Momo owner walkthrough remains blocked.
- No next activation PR is approved by default.
- Future real-world activation requires separate explicit Faraz approval.
- Team route added for inventory/surface map: `/team/momo-pilot-prep` is guarded by InternalDemoGuard role="team" and RealPortalDataBoundary portal="team".

## PR #115 — Momo Business Truth Review Pack

GitHub PR #115 adds Momo Business Truth Review Pack only. PR #109 Momo Live Pilot Readiness Gate is merged. PR #110 Post-PR109 Momo readiness alignment is merged. PR #111 Controlled Momo Pilot Activation Gate is merged. PR #112 Post-PR111 Activation Gate Alignment + Business Truth Status Hardening is merged. PR #113 Post-PR112 Source-of-Truth Finalization is merged. PR #114 Momo Internal Pilot Prep Pack is merged or immediately prior. PR #115 is internal business-truth review only. PR #115 does not activate the pilot, does not activate real auth, does not create credentials, does not contact Momo’s House, does not publish externally, does not connect external platforms, and does not add payments, webhooks, cron jobs, background jobs, scheduled jobs, or automation runners. AUTH_MODE remains placeholder, /api/pilot-access remains active, roles remain client/team only, Momo owner walkthrough remains blocked, no next activation PR is approved by default, and future real-world activation requires separate explicit Faraz approval. Business-truth changes require owner confirmation before any public/customer-visible use. Sensitive claims are blocked until owner-confirmed. Team route: `/team/momo-business-truth`.

## 2026-06-19 — PR #116 Momo Media + Content Inventory Pack

GitHub PR #116 adds Momo Media + Content Inventory Pack only. PR #109 Momo Live Pilot Readiness Gate is merged. PR #110 Post-PR109 Momo readiness alignment is merged. PR #111 Controlled Momo Pilot Activation Gate is merged. PR #112 Post-PR111 Activation Gate Alignment + Business Truth Status Hardening is merged. PR #113 Post-PR112 Source-of-Truth Finalization is merged. PR #114 Momo Internal Pilot Prep Pack is merged. PR #115 Momo Business Truth Review Pack is merged. PR #116 is internal media/content inventory only. PR #116 does not activate the pilot, does not activate real auth, does not create credentials, does not contact Momo’s House, does not upload, create, seed, generate, or fake media, does not publish externally, does not connect external platforms, and does not add payments, webhooks, cron jobs, background jobs, scheduled jobs, or automation runners. AUTH_MODE remains placeholder. /api/pilot-access remains active. Roles remain client/team only. Momo owner walkthrough remains blocked. No next activation PR is approved by default. Future real-world activation requires separate explicit Faraz approval. Business-truth changes require owner confirmation before any public/customer-visible use. Media usage rights require owner confirmation before public/customer-visible use. Sensitive claims are blocked until owner-confirmed. AI may use only confirmed business truth and permissioned media in later internal drafts.

- Team route added for PR #116 media/content inventory: `/team/momo-media-content` renders `artifacts/veroxa/src/pages/team-momo-media-content.tsx`, is guarded by InternalDemoGuard role="team" and RealPortalDataBoundary portal="team", and remains internal media/content inventory only with no activation, no upload/publication, and owner walkthrough blocked.

## PR #117 — Momo Brand Voice + AI Prompt Rules Pack

GitHub PR #117 adds Momo Brand Voice + AI Prompt Rules Pack only. PR #109 Momo Live Pilot Readiness Gate is merged. PR #110 Post-PR109 Momo readiness alignment is merged. PR #111 Controlled Momo Pilot Activation Gate is merged. PR #112 Post-PR111 Activation Gate Alignment + Business Truth Status Hardening is merged. PR #113 Post-PR112 Source-of-Truth Finalization is merged. PR #114 Momo Internal Pilot Prep Pack is merged. PR #115 Momo Business Truth Review Pack is merged. PR #116 Momo Media + Content Inventory Pack is merged.

PR #117 is internal brand voice and AI prompt-rule preparation only. PR #117 does not generate AI output. PR #117 does not call any AI provider. PR #117 does not activate the pilot. PR #117 does not activate real auth. PR #117 does not create credentials. PR #117 does not contact Momo’s House. PR #117 does not upload, create, seed, generate, or fake media. PR #117 does not publish externally. PR #117 does not connect external platforms. PR #117 does not add payments, webhooks, cron jobs, background jobs, scheduled jobs, or automation runners.

AUTH_MODE remains placeholder. /api/pilot-access remains active. Roles remain client/team only. Momo owner walkthrough remains blocked. No next activation PR is approved by default. Future real-world activation requires separate explicit Faraz approval. Business-truth changes require owner confirmation before any public/customer-visible use. Media usage rights require owner confirmation before public/customer-visible use. Sensitive claims are blocked until owner-confirmed. AI may use only confirmed business truth and permissioned media in later internal drafts. All future AI output requires Team/Faraz review before customer-visible use.

- `/team/momo-brand-ai-rules` — Team-only Momo Brand Voice + AI Prompt Rules Pack route guarded by InternalDemoGuard role="team" and RealPortalDataBoundary portal="team".

## GitHub PR #118 — Controlled AI Draft Generation Foundation

GitHub PR #118 adds Controlled AI Draft Generation Foundation only. PR #109 Momo Live Pilot Readiness Gate is merged. PR #110 Post-PR109 Momo readiness alignment is merged. PR #111 Controlled Momo Pilot Activation Gate is merged. PR #112 Post-PR111 Activation Gate Alignment + Business Truth Status Hardening is merged. PR #113 Post-PR112 Source-of-Truth Finalization is merged. PR #114 Momo Internal Pilot Prep Pack is merged. PR #115 Momo Business Truth Review Pack is merged. PR #116 Momo Media + Content Inventory Pack is merged. PR #117 Momo Brand Voice + AI Prompt Rules Pack is merged.

PR #118 is controlled AI draft generation foundation only. AI generation is disabled by default. PR #118 does not generate customer-visible AI output. PR #118 does not auto-approve AI output. PR #118 does not publish AI output. PR #118 does not activate the pilot. PR #118 does not activate real auth. PR #118 does not create credentials. PR #118 does not contact Momo’s House. PR #118 does not upload, create, seed, generate, or fake media. PR #118 does not publish externally. PR #118 does not connect external platforms. PR #118 does not add payments, webhooks, cron jobs, background jobs, scheduled jobs, or automation runners.

AUTH_MODE remains placeholder. /api/pilot-access remains active. Roles remain client/team only. Momo owner walkthrough remains blocked. No next activation PR is approved by default. Future real-world activation requires separate explicit Faraz approval.

Business-truth changes require owner confirmation before any public/customer-visible use. Media usage rights require owner confirmation before public/customer-visible use. Sensitive claims are blocked until owner-confirmed. AI may use only confirmed business truth and permissioned media in later internal drafts. All future AI output requires Team/Faraz review before customer-visible use.

## PR #118 route inventory

- `/team/momo-ai-generation` — active routed Team-only internal Momo Controlled AI Draft Generation Foundation page. Guarded by `InternalDemoGuard role="team"` and `RealPortalDataBoundary portal="team"`. Controlled foundation only; AI generation disabled by default; no publishing, no activation, no owner contact, no credentials, no external integrations, and Momo owner walkthrough remains blocked.
## GitHub PR #119 — AI Draft Approval Queue

GitHub PR #119 adds AI Draft Approval Queue only. PR #109 Momo Live Pilot Readiness Gate is merged. PR #110 Post-PR109 Momo readiness alignment is merged. PR #111 Controlled Momo Pilot Activation Gate is merged. PR #112 Post-PR111 Activation Gate Alignment + Business Truth Status Hardening is merged. PR #113 Post-PR112 Source-of-Truth Finalization is merged. PR #114 Momo Internal Pilot Prep Pack is merged. PR #115 Momo Business Truth Review Pack is merged. PR #116 Momo Media + Content Inventory Pack is merged. PR #117 Momo Brand Voice + AI Prompt Rules Pack is merged. PR #118 Controlled AI Draft Generation Foundation is merged or immediately prior.

PR #119 is internal AI draft approval queue only. PR #119 does not generate AI output. PR #119 does not call any AI provider. PR #119 does not auto-approve AI output. PR #119 does not publish AI output. PR #119 does not expose AI output to the client. PR #119 does not activate the pilot. PR #119 does not activate real auth. PR #119 does not create credentials. PR #119 does not contact Momo’s House. PR #119 does not upload, create, seed, generate, or fake media. PR #119 does not publish externally. PR #119 does not connect external platforms. PR #119 does not add payments, webhooks, cron jobs, background jobs, scheduled jobs, or automation runners.

AUTH_MODE remains placeholder. /api/pilot-access remains active. Roles remain client/team only. Momo owner walkthrough remains blocked. No next activation PR is approved by default. Future real-world activation requires separate explicit Faraz approval. Business-truth changes require owner confirmation before any public/customer-visible use. Media usage rights require owner confirmation before public/customer-visible use. Sensitive claims are blocked until owner-confirmed. AI drafts may move forward only after Team/Faraz review. No AI output becomes customer-visible from this PR.

- `/team/momo-ai-approval` — PR #119 Team-only internal AI Draft Approval Queue guarded by InternalDemoGuard role="team" and RealPortalDataBoundary portal="team".

## PR #120 — Momo Internal Dry Run + Go/No-Go Gate route

- `/team/momo-dry-run-go-no-go` — Team-only internal dry-run/go-no-go review route. It is guarded by InternalDemoGuard role="team" and RealPortalDataBoundary portal="team". PR #120 is internal dry-run/go-no-go review only; AUTH_MODE remains placeholder, /api/pilot-access remains active, Momo owner walkthrough remains blocked, and future real-world activation requires separate explicit Faraz approval.

## 2026-06-21 — PR #126 Momo-Focused Team Portal Consolidation

- GitHub PR #126 adds Momo-Focused Team Portal Consolidation only.
- PR #120 is the current operating baseline.
- PR #123 locked Momo-focused Team Portal direction.
- PR #124 and PR #125 are merged source-of-truth cleanup/fix-forward PRs.
- PR #126 adds grouped Team-only Momo workspace routes: `/team/momo`, `/team/momo/work`, `/team/momo/intelligence`, `/team/momo/content-ai`, `/team/momo/reports`, and `/team/momo/readiness`.
- Existing standalone Momo routes remain compatibility/detail routes.
- PR #126 does not activate the pilot, activate real auth, create credentials, contact Momo’s House, publish externally, connect external platforms, or generate AI output.
- AUTH_MODE remains placeholder; `/api/pilot-access` remains active; roles remain client/team only; Momo owner walkthrough remains blocked; no next activation PR is approved by default; future real-world activation requires separate explicit Faraz approval.
