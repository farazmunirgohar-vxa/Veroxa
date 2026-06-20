# Active Docs Index

Status: highest-level active contributor guide and current source-of-truth index. Read this file before relying on any older Veroxa doc.

## 2026-06-19 — Post-PR120 current truth

`LIVE_AUTOMATION_V1_PR_SEQUENCE.md` is the current source of truth for GitHub PR numbering after Profile Corrections merged as GitHub PR #103.

Actual completed sequence: PR #99 architecture, PR #100 auth foundation, PR #101 database foundation, PR #102 media upload/storage foundation, PR #103 Profile Corrections foundation, PR #104 Real Messages / Portal Threads foundation, PR #105 Activity Log foundation, PR #106 AI Draft Preparation foundation, PR #107 Team Automation Control Center foundation, PR #108 Reports From Activity foundation, PR #109 Momo Live Pilot Readiness Gate, PR #110 Post-PR109 Momo readiness alignment, PR #111 Controlled Momo Pilot Activation Gate, PR #112 Post-PR111 Activation Gate Alignment + Business Truth Status Hardening, PR #113 Post-PR112 Source-of-Truth Finalization, PR #114 Momo Internal Pilot Prep Pack, PR #115 Momo Business Truth Review Pack, PR #116 Momo Media + Content Inventory Pack, PR #117 Momo Brand Voice + AI Prompt Rules Pack, PR #118 Controlled AI Draft Generation Foundation, PR #119 AI Draft Approval Queue, and PR #120 Momo Internal Dry Run + Go/No-Go Gate.

Latest completed Momo internal review surface is **PR #120 — Momo Internal Dry Run + Go/No-Go Gate**. Latest completed Live Automation V1 corrective alignment remains **PR #112 — Post-PR111 Activation Gate Alignment + Business Truth Status Hardening**. PR #113 is source-of-truth finalization only. PR #114 through PR #120 are internal Momo preparation/review/control surfaces only.

There is no next activation PR approved by default. Any future real-world activation, real-auth activation, external platform setup, Momo owner walkthrough, or client exposure requires a separate explicit Faraz approval.

Momo owner walkthrough remains blocked. `AUTH_MODE` remains `placeholder`. `/api/pilot-access` remains active. Real auth remains off. No external integrations are connected. Roles remain `client` and `team` only.

If older docs still say Real Messages was PR #103, Profile Corrections was PR #104, PR #104/PR #107 is next, PR #110 is the activation gate, PR #111 was intended to automatically activate, PR #118/#119/#120 are only future prompts, or the owner walkthrough can proceed by default, treat those as stale planning labels, not actual GitHub status.

## Current source-of-truth docs

These files reflect the current Veroxa operating truth and override historical/archive strategy notes. If another doc conflicts with this index, do not override this index; treat the conflicting note as stale until Faraz explicitly refreshes it. Do not override current docs with older current-looking files, changelog sections, or archived strategy notes.

- `VEROXA_LOCKED_OPERATING_MEMORY.md`
- `LIVE_AUTOMATION_V1_PR_SEQUENCE.md`
- `MOMO_INTERNAL_DRY_RUN_GO_NO_GO_GATE.md` — GitHub PR #120 Momo Internal Dry Run + Go/No-Go Gate only; internal dry-run/go-no-go review only; AUTH_MODE placeholder; /api/pilot-access active; Momo owner walkthrough blocked; no next activation PR approved by default; future real-world activation requires separate explicit Faraz approval.
- `MOMO_AI_DRAFT_APPROVAL_QUEUE.md` — GitHub PR #119 AI Draft Approval Queue only; internal Team review queue; AUTH_MODE placeholder; /api/pilot-access active; Momo owner walkthrough blocked; no next activation PR approved by default; future real-world activation requires separate explicit Faraz approval.
- `MOMO_CONTROLLED_AI_DRAFT_GENERATION_FOUNDATION.md` — GitHub PR #118 controlled AI draft generation foundation only; AI generation disabled by default; AUTH_MODE placeholder; /api/pilot-access active; Momo owner walkthrough blocked; no next activation PR approved by default; future real-world activation requires separate explicit Faraz approval.
- `MOMO_BRAND_VOICE_AI_PROMPT_RULES.md` — PR #117 source of truth for Momo brand voice and AI prompt rules.
- `MOMO_MEDIA_CONTENT_INVENTORY_PACK.md` — PR #116 source of truth for Momo media/content inventory.
- `MOMO_BUSINESS_TRUTH_REVIEW_PACK.md` — PR #115 source of truth for Momo business-truth review.
- `MOMO_INTERNAL_PILOT_PREP_PACK.md` — PR #114 source of truth for Momo internal pilot prep.
- `LIVE_AUTOMATION_V1_ARCHITECTURE.md`
- `CURRENT_BUILD_STATUS.md`
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
- `REAL_AUTH_READINESS_AUDIT.md`
- `PRODUCTION_PREVIEW_LOGIN_CHECKLIST.md`
- `FIRST_CLIENT_MANUAL_LAUNCH_INDEX.md`
- `MANUAL_FIRST_CLIENT_LAUNCH_PACK.md`
- `FIRST_CLIENT_CLIENT_INSTRUCTIONS.md`
- `FIRST_CLIENT_TEAM_CHECKLIST.md`
- `FIRST_WEEK_EXECUTION_CHECKLIST.md`
- `FIRST_WEEK_WEEKLY_UPDATE_TEMPLATE.md`
- `FIRST_MONTH_MONTHLY_REPORT_TEMPLATE.md`
- `PAKISTAN_TEAM_EXECUTION_SOP.md`
- `FARAZ_ESCALATION_RULES.md`
- `MOMO_LIVE_PILOT_READINESS.md`

## PR #112 status interpretation lock

PR #112 is **Post-PR111 Activation Gate Alignment + Business Truth Status Hardening**. PR #109 Momo Live Pilot Readiness Gate is merged. PR #110 Post-PR109 Momo readiness alignment is merged. PR #111 Controlled Momo Pilot Activation Gate is merged. PR #112 Post-PR111 Activation Gate Alignment + Business Truth Status Hardening is merged. PR #113 is source-of-truth finalization only.

PR #112 corrected readiness/activation interpretation of current business-truth profile-field statuses: `please_review`, `pre_filled`, `confirmed`, `optional`, and `veroxa_review`. `please_review`, `pre_filled`, and `veroxa_review` must not count as owner-confirmed business truth. PR #112 removed stale PR #110 activation-gate wording.

No next activation PR is approved by default. Future real-world activation requires separate explicit Faraz approval. `AUTH_MODE` remains `placeholder`. `/api/pilot-access` remains active. Momo owner walkthrough remains blocked.

## Pricing truth

The only active public launch offer is **Complete Online Presence — $495/month**. Starter, Growth, Premium, Local Presence, Full Presence, old Complete Presence, $295, $995, $977, and $488 references are historical/deprecated/archive-only unless a current source-of-truth doc explicitly says otherwise.

## Deployment/auth truth

Production/custom-domain login is Real Login V1 pilot portal access for Momo House San Antonio and Team Faraz only. Public preview-login language and public preview credentials are retired from `/login`. `AUTH_MODE` remains `placeholder` until production-auth readiness is explicitly approved. Real Login V1 is deterministic/manual pilot access, not secure production auth.

## Routing truth

Active app portal experiences are only **Client Portal** and **Team/Internal Admin Portal**. Owner, Operator, Super Admin, generic Admin, and Execution portals remain parked/blocked. `/demo`, `/guided-demo`, `/upload`, and `/demo/client/*` must remain disabled from active routing.

Team-only Momo internal routes include `/team/momo-live-readiness`, `/team/momo-activation-gate`, `/team/momo-pilot-prep`, `/team/momo-business-truth`, `/team/momo-media-content`, `/team/momo-brand-ai-rules`, `/team/momo-ai-generation`, `/team/momo-ai-approval`, and `/team/momo-dry-run-go-no-go`. No client Momo activation/readiness/prep/business-truth/media/AI/dry-run route is approved.

## Archive rule

Historical docs remain useful as reference, but they must not override current source-of-truth docs. Older manual-first, first-client, preview-login, launch QA, and Momo walkthrough docs are historical context only unless refreshed by a newer source-of-truth doc. They must not override the post-PR120 sequence or the rule that Momo owner walkthrough remains blocked until Faraz separately approves it.
