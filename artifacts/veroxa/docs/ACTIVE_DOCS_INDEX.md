# Active Docs Index

Status: highest-level active contributor guide and current source-of-truth index. Read this file before relying on any older Veroxa doc.

## 2026-06-19 — Actual Live Automation V1 PR sequence correction

- `LIVE_AUTOMATION_V1_PR_SEQUENCE.md` is the current source of truth for GitHub PR numbering after Profile Corrections merged as GitHub PR #103.
- Actual completed sequence: PR #99 architecture, PR #100 auth foundation, PR #101 database foundation, PR #102 media upload/storage foundation, PR #103 Profile Corrections foundation, PR #104 Real Messages / Portal Threads foundation, PR #105 Activity Log foundation, PR #106 AI Draft Preparation foundation, PR #107 Team Automation Control Center foundation, PR #108 Reports From Activity foundation, PR #109 Momo Live Pilot Readiness Gate, and PR #110 Post-PR109 Momo readiness alignment.
- Latest completed Live Automation V1 alignment is through **PR #112 — Post-PR111 Activation Gate Alignment + Business Truth Status Hardening**; PR #113 is source-of-truth finalization only; PR #114 is internal preparation only, PR #115 is internal business-truth review only, and PR #116 is internal media/content inventory only. PR #117 is internal brand voice and AI prompt-rule preparation only; it does not generate AI output, call any AI provider, activate the pilot, activate real auth, create credentials, contact Momo’s House, upload/create/seed/generate/fake media, publish externally, connect external platforms, or approve a next activation PR.
- There is no next activation PR approved by default. Any future real-world activation, real-auth activation, external platform setup, or Momo owner walkthrough requires a separate explicit Faraz approval after this gate.
- If older docs still say Real Messages was PR #103, Profile Corrections was PR #104, PR #104/PR #107 is next, PR #110 is the activation gate, or PR #111 was intended to automatically activate, treat those as stale planning labels, not actual GitHub PR status.
- Momo owner walkthrough remains blocked until Faraz explicitly approves activation/walkthrough after reviewing the gate.

## 2026-06-15 — PR 100 Supabase Auth Foundation status

- PR 100 adds the Live Automation V1 real-auth foundation while keeping `AUTH_MODE` as `placeholder`.
- Current safe pilot login remains `/api/pilot-access` for Momo House San Antonio and Team Faraz.
- `REAL_AUTH_FOUNDATION_SETUP.md` is the setup checklist for required env vars, minimum auth tables, first client/team users, role-routing tests, and the remaining conditions before any future `AUTH_MODE = "real"` flip.
- Momo owner walkthrough remains blocked until the full Live Automation V1 sequence is implemented and approved.

## Current source-of-truth docs

These files reflect the current Veroxa operating truth and override historical/archive strategy notes. If another doc conflicts with this index, do not override this index; treat the conflicting note as stale until Faraz explicitly refreshes it:

- `VEROXA_LOCKED_OPERATING_MEMORY.md`
- `LIVE_AUTOMATION_V1_PR_SEQUENCE.md`
- `LIVE_AUTOMATION_V1_ARCHITECTURE.md`
- `CURRENT_BUILD_STATUS.md`
- `MOMO_INTERNAL_PILOT_PREP_PACK.md`
- `MOMO_BRAND_VOICE_AI_PROMPT_RULES.md`
- `LIVE_AUTOMATION_V1_MOMO_ACTIVATION_GATE.md`
- `LIVE_AUTOMATION_V1_MOMO_READINESS_GATE.md`
- `LIVE_AUTOMATION_V1_REPORTS_FROM_ACTIVITY.md`
- `LIVE_AUTOMATION_V1_TEAM_CONTROL_CENTER.md`
- `LIVE_AUTOMATION_V1_AI_DRAFT_PREPARATION.md`
- `LIVE_AUTOMATION_V1_ACTIVITY_LOG.md`
- `LIVE_AUTOMATION_V1_REAL_MESSAGES.md`
- `LIVE_AUTOMATION_V1_PROFILE_CORRECTIONS.md`
- `LIVE_AUTOMATION_V1_MEDIA_UPLOAD_STORAGE.md`
- `LIVE_AUTOMATION_V1_DATABASE_FOUNDATION.md`
- `PRICING_SOURCE_OF_TRUTH.md`
- `VEROXA_OS_SYSTEM_MAP.md`
- `ROUTE_PAGE_INVENTORY.md`
- `VEROXA_ROUTE_SURFACE_MAP.md`
- `PRE_PAID_ACTIVATION_GATE.md`
- `MANUAL_FIRST_CLIENT_LAUNCH_PACK.md`
- `FIRST_CLIENT_CLIENT_INSTRUCTIONS.md`
- `FIRST_CLIENT_TEAM_CHECKLIST.md`
- `FIRST_WEEK_EXECUTION_CHECKLIST.md`
- `FIRST_WEEK_WEEKLY_UPDATE_TEMPLATE.md`
- `FIRST_MONTH_MONTHLY_REPORT_TEMPLATE.md`
- `PAKISTAN_TEAM_EXECUTION_SOP.md`
- `FARAZ_ESCALATION_RULES.md`
- `FIRST_CLIENT_MANUAL_LAUNCH_INDEX.md`
- `REAL_AUTH_READINESS_AUDIT.md`
- `PRODUCTION_PREVIEW_LOGIN_CHECKLIST.md`
- `MOMO_LIVE_PILOT_READINESS.md`

## 2026-06-14 — Live Automation V1 architecture planned

- `LIVE_AUTOMATION_V1_ARCHITECTURE.md` defines the module build sequence after the automation-first pivot.
- `LIVE_AUTOMATION_V1_PR_SEQUENCE.md` now corrects the actual GitHub PR numbering after Profile Corrections merged as GitHub PR #103.
- The detailed architecture covers the Live Automation V1 module sequence: real auth, database foundation, media upload/storage, messages, profile corrections, activity log, AI draft preparation, Team Automation Control Center, reports from activity, Momo live pilot readiness gate, and controlled activation gate.
- This architecture is not live functionality. Production auth, full live messages, live AI, reports from real activity, publishing, integrations, payments, cron jobs, and webhooks remain unavailable until future approved implementation PRs.
- Momo owner walkthrough remains blocked until Faraz explicitly approves activation/walkthrough after reviewing the gate.

## 2026-06-14 — Automation-first Momo pivot

- `VEROXA_LOCKED_OPERATING_MEMORY.md` is now the first/highest-priority current source-of-truth doc after this index.
- No Momo owner walkthrough should happen until **Live Automation V1** exists.
- Old manual-first Momo walkthrough docs are historical/stale for the current Momo path unless Faraz explicitly re-approves a manual-first walkthrough.
- Automation may prepare and process internal Veroxa work: drafts, classifications, media organization, activity records, report inputs, and Team review items.
- Public/customer-visible actions still require Veroxa/Faraz approval before anything goes live.
- Business-truth changes still require client confirmation before approval or execution, including hours, menu, prices, offers, links, sensitive claims, and complaint/reputation-impacting language.
- Current technical truth remains that `AUTH_MODE` is `placeholder`; full live data/auth/messages/reports/AI are not connected yet, so Live Automation V1 is not completed functionality.

## 2026-06-13 — CP-V1 client portal lock

- Momo House Client Portal V1 primary navigation is locked to **Home, Media, Messages, Reports, Connections, Profile**.
- Home replaces owner-facing Dashboard language; Messages replaces Requests; Weekly Updates live inside Reports rather than primary navigation.
- Connections V1 tracks only Meta Business Suite and Google Business Profile status. Website and delivery platforms are outside Connections V1.
- Profile is the owner-editable business-truth page; owner edits become Pending Veroxa Review and do not publish automatically.
- Requests and Updates are hidden guarded compatibility aliases only; `/client/onboarding` renders Profile setup review. CP-V1 remains manual-first/pre-live: no production auth, live integrations, payments, live AI, automated publishing, fake upload success, fake message delivery, or fake metrics.

## Pricing truth

The only active public launch offer is **Complete Online Presence — $495/month**. Starter, Growth, Premium, Local Presence, Full Presence, old Complete Presence, $295, $995, $977, and $488 references are historical/deprecated/archive-only unless a current source-of-truth doc explicitly says otherwise.

## Archive rule

Historical docs remain useful as reference, but they must not override current source-of-truth docs. Do not override current docs with older current-looking files, changelog sections, or archived strategy notes. If an older file includes old pricing, multi-package language, Owner/Operator/Super Admin/generic Admin/Execution dashboards, or future automation plans, treat it as archive/reference only unless it has been explicitly refreshed as active.

## Deployment/auth truth

Production/custom-domain login is now Real Login V1 pilot portal access for Momo House San Antonio and Team Faraz only. Public preview-login language and public preview credentials are retired from `/login`. `AUTH_MODE` remains `placeholder` until production-auth readiness is explicitly approved; Real Login V1 is deterministic/manual pilot access, not secure production auth.


## 2026-06-07 — Real pilot mode lock

- Veroxa is moving from public demo/preview portal exposure into **real pilot pre-live/manual mode**.
- Public demo/preview portals are no longer part of the active live app surface; `/demo`, `/guided-demo`, `/upload`, and `/demo/client/*` must remain disabled from active routing.
- Active app portal experiences are only **Client Portal** and **Team/Internal Admin Portal**. Owner, Operator, Super Admin, generic Admin, and Execution portals remain parked/blocked.
- First real pilot client: **Momo House San Antonio**. Momo House is an internal unpaid cooperation pilot account for initial Veroxa improvement work, not a public pricing change.
- Internal operations identity: **Team Faraz**.
- Locked audit-to-onboarding workflow: public/initial audit → prefilled onboarding profile → owner verification → credential/platform connection → gap completion by owner + Veroxa team → final onboarding approval.
- Onboarding must show which fields were prefilled by Veroxa, need owner verification, are missing, were corrected by owner, or were completed by Veroxa.
- Safety remains pre-live/manual only: no production auth, live AI, connectors, payments, webhooks, cron, or automated customer-visible execution; `AUTH_MODE` remains `placeholder`.

## 2026-06-07 — PR #82 matcher safety and onboarding alignment

- Audit matching is conservative for location conflicts: state-only is not city/state matched, and city/state mismatches are penalized, and city-conflicting Momo House inputs must not exact-prefill San Antonio unless strong proof exists (phone, domain, strong address, or platform/domain link).
- Audit-to-onboarding prefill statuses are: `prefilled_by_veroxa`, `needs_owner_verification`, `missing`, `owner_corrected`, `completed_by_team`, and `blocked_needs_access`.
- Active portals remain only Client Portal and Team/Internal Admin Portal; retired demo/preview routes remain disabled.
- No live auth, writes, storage uploads, live AI, connectors, payments, cron/background jobs, or automated publishing were added.

## 2026-06-07 — Real Login V1 / pilot portal access

- Veroxa `/login` now uses real portal wording: “Sign in to Veroxa” and “Access your Veroxa portal.”
- Active pilot accounts are **Momo House San Antonio** for the Client Portal and **Team Faraz** for the Team/Internal Admin Portal.
- Login destinations remain only `/client/dashboard` and `/team/dashboard`; Owner, Operator, Super Admin, generic Admin, and Execution portals remain parked/blocked.
- Preview demo login language and public preview credentials are removed from the production/custom-domain login experience.
- `AUTH_MODE` remains `placeholder`; Real Login V1 is deterministic/manual pilot portal access, not secure production auth.
- `/demo`, `/guided-demo`, `/upload`, and `/demo/client/*` remain retired/disabled.
- No live AI, storage uploads, integrations, payments, publishing, cron/background jobs, database writes, or customer-visible automation were added.

## 2026-06-15 — PR 101 Database Foundation status

- PR 101 adds the Live Automation V1 database foundation while keeping `AUTH_MODE` as `placeholder`.
- Current safe pilot login remains `/api/pilot-access`; no portal page is live database-powered yet.
- `LIVE_AUTOMATION_V1_DATABASE_FOUNDATION.md` is the setup and safety reference for the new migration, tables, status models, RLS baseline, TypeScript contracts, and later Momo/Team Faraz setup notes.
- Momo owner walkthrough remains blocked until the full Live Automation V1 sequence is implemented and approved.


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

- `MOMO_BUSINESS_TRUTH_REVIEW_PACK.md`
- `MOMO_MEDIA_CONTENT_INVENTORY_PACK.md` — PR #115 Team-only internal business-truth review pack. PR #115 does not activate the pilot, does not activate real auth, does not create credentials, does not contact Momo’s House, does not publish externally, does not connect external platforms, AUTH_MODE remains placeholder, /api/pilot-access remains active, roles remain client/team only, Momo owner walkthrough remains blocked, no next activation PR is approved by default, and future real-world activation requires separate explicit Faraz approval.
