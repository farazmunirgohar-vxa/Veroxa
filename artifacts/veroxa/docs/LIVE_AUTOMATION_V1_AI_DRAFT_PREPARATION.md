# Live Automation V1 AI Draft Preparation Foundation

Status: GitHub PR #106 AI Draft Preparation Foundation only. PR #103 Profile Corrections, PR #104 Real Messages / Portal Threads, and PR #105 Activity Log are complete; follow `LIVE_AUTOMATION_V1_PR_SEQUENCE.md` for the locked numbering.

## What PR #106 adds

- A gated Team-only AI Draft Queue route at `/team/ai-drafts`.
- Team-only service helpers to list, create, hold, reject, and mark internal draft records reviewed.
- A conservative Supabase migration/RLS hardening layer for `ai_drafts`.
- Explicit draft type, status, source entity, and safety flag controls.
- A guardrail script for the AI Draft Preparation foundation.

## Locked runtime truth

- `AUTH_MODE` remains `placeholder`.
- `/api/pilot-access` remains active.
- AI Drafts require `AUTH_MODE === "real"`, authenticated Team role, and `VITE_VEROXA_AI_DRAFTS_ENABLED=true`.
- AI drafts are internal only.
- No raw AI output is client-visible.
- No publishing occurs from a draft.
- No auto-approval: no draft auto-approves itself.
- The existing database status `approved` is used only as an internal reviewed status in this PR. It is not public/customer-visible approval and does not publish anything.
- Safety flags are explicit: `ready_for_faraz_review`, `needs_owner_input`, `business_truth_confirmation_required`, or `low_confidence`.
- Business-truth changes still require owner/client confirmation.
- Public/customer-visible work still requires Faraz/Team approval.
- Momo owner walkthrough remains blocked.

## Not included

No live model invocation, client AI draft route, report generation, Team Automation Control Center, Reports From Activity, external publishing, Google/Meta/Yelp/TikTok integrations, payments, checkout, webhooks, cron jobs, background jobs, SMS/email automation, DMs, comments, refunds, order support, or customer-service inbox handling are added.

## Sequence lock

- Team Automation Control Center remains PR #107.
- Reports From Activity remain PR #108.
- Momo Live Pilot Readiness Gate remains PR #109.
- Controlled Momo Pilot Activation Gate is PR #111 and is already merged; no next activation PR is approved by default.

## 2026-06-19 — PR #116 Momo Media + Content Inventory Pack

GitHub PR #116 adds Momo Media + Content Inventory Pack only. PR #109 Momo Live Pilot Readiness Gate is merged. PR #110 Post-PR109 Momo readiness alignment is merged. PR #111 Controlled Momo Pilot Activation Gate is merged. PR #112 Post-PR111 Activation Gate Alignment + Business Truth Status Hardening is merged. PR #113 Post-PR112 Source-of-Truth Finalization is merged. PR #114 Momo Internal Pilot Prep Pack is merged. PR #115 Momo Business Truth Review Pack is merged. PR #116 is internal media/content inventory only. PR #116 does not activate the pilot, does not activate real auth, does not create credentials, does not contact Momo’s House, does not upload, create, seed, generate, or fake media, does not publish externally, does not connect external platforms, and does not add payments, webhooks, cron jobs, background jobs, scheduled jobs, or automation runners. AUTH_MODE remains placeholder. /api/pilot-access remains active. Roles remain client/team only. Momo owner walkthrough remains blocked. No next activation PR is approved by default. Future real-world activation requires separate explicit Faraz approval. Business-truth changes require owner confirmation before any public/customer-visible use. Media usage rights require owner confirmation before public/customer-visible use. Sensitive claims are blocked until owner-confirmed. AI may use only confirmed business truth and permissioned media in later internal drafts.

## PR #117 — Momo Brand Voice + AI Prompt Rules Pack

GitHub PR #117 adds Momo Brand Voice + AI Prompt Rules Pack only. PR #109 Momo Live Pilot Readiness Gate is merged. PR #110 Post-PR109 Momo readiness alignment is merged. PR #111 Controlled Momo Pilot Activation Gate is merged. PR #112 Post-PR111 Activation Gate Alignment + Business Truth Status Hardening is merged. PR #113 Post-PR112 Source-of-Truth Finalization is merged. PR #114 Momo Internal Pilot Prep Pack is merged. PR #115 Momo Business Truth Review Pack is merged. PR #116 Momo Media + Content Inventory Pack is merged.

PR #117 is internal brand voice and AI prompt-rule preparation only. PR #117 does not generate AI output. PR #117 does not call any AI provider. PR #117 does not activate the pilot. PR #117 does not activate real auth. PR #117 does not create credentials. PR #117 does not contact Momo’s House. PR #117 does not upload, create, seed, generate, or fake media. PR #117 does not publish externally. PR #117 does not connect external platforms. PR #117 does not add payments, webhooks, cron jobs, background jobs, scheduled jobs, or automation runners.

AUTH_MODE remains placeholder. /api/pilot-access remains active. Roles remain client/team only. Momo owner walkthrough remains blocked. No next activation PR is approved by default. Future real-world activation requires separate explicit Faraz approval. Business-truth changes require owner confirmation before any public/customer-visible use. Media usage rights require owner confirmation before public/customer-visible use. Sensitive claims are blocked until owner-confirmed. AI may use only confirmed business truth and permissioned media in later internal drafts. All future AI output requires Team/Faraz review before customer-visible use.

## GitHub PR #118 — Controlled AI Draft Generation Foundation

GitHub PR #118 adds Controlled AI Draft Generation Foundation only. PR #109 Momo Live Pilot Readiness Gate is merged. PR #110 Post-PR109 Momo readiness alignment is merged. PR #111 Controlled Momo Pilot Activation Gate is merged. PR #112 Post-PR111 Activation Gate Alignment + Business Truth Status Hardening is merged. PR #113 Post-PR112 Source-of-Truth Finalization is merged. PR #114 Momo Internal Pilot Prep Pack is merged. PR #115 Momo Business Truth Review Pack is merged. PR #116 Momo Media + Content Inventory Pack is merged. PR #117 Momo Brand Voice + AI Prompt Rules Pack is merged.

PR #118 is controlled AI draft generation foundation only. AI generation is disabled by default. PR #118 does not generate customer-visible AI output. PR #118 does not auto-approve AI output. PR #118 does not publish AI output. PR #118 does not activate the pilot. PR #118 does not activate real auth. PR #118 does not create credentials. PR #118 does not contact Momo’s House. PR #118 does not upload, create, seed, generate, or fake media. PR #118 does not publish externally. PR #118 does not connect external platforms. PR #118 does not add payments, webhooks, cron jobs, background jobs, scheduled jobs, or automation runners.

AUTH_MODE remains placeholder. /api/pilot-access remains active. Roles remain client/team only. Momo owner walkthrough remains blocked. No next activation PR is approved by default. Future real-world activation requires separate explicit Faraz approval.

Business-truth changes require owner confirmation before any public/customer-visible use. Media usage rights require owner confirmation before public/customer-visible use. Sensitive claims are blocked until owner-confirmed. AI may use only confirmed business truth and permissioned media in later internal drafts. All future AI output requires Team/Faraz review before customer-visible use.
## GitHub PR #119 — AI Draft Approval Queue

GitHub PR #119 adds AI Draft Approval Queue only. PR #109 Momo Live Pilot Readiness Gate is merged. PR #110 Post-PR109 Momo readiness alignment is merged. PR #111 Controlled Momo Pilot Activation Gate is merged. PR #112 Post-PR111 Activation Gate Alignment + Business Truth Status Hardening is merged. PR #113 Post-PR112 Source-of-Truth Finalization is merged. PR #114 Momo Internal Pilot Prep Pack is merged. PR #115 Momo Business Truth Review Pack is merged. PR #116 Momo Media + Content Inventory Pack is merged. PR #117 Momo Brand Voice + AI Prompt Rules Pack is merged. PR #118 Controlled AI Draft Generation Foundation is merged or immediately prior.

PR #119 is internal AI draft approval queue only. PR #119 does not generate AI output. PR #119 does not call any AI provider. PR #119 does not auto-approve AI output. PR #119 does not publish AI output. PR #119 does not expose AI output to the client. PR #119 does not activate the pilot. PR #119 does not activate real auth. PR #119 does not create credentials. PR #119 does not contact Momo’s House. PR #119 does not upload, create, seed, generate, or fake media. PR #119 does not publish externally. PR #119 does not connect external platforms. PR #119 does not add payments, webhooks, cron jobs, background jobs, scheduled jobs, or automation runners.

AUTH_MODE remains placeholder. /api/pilot-access remains active. Roles remain client/team only. Momo owner walkthrough remains blocked. No next activation PR is approved by default. Future real-world activation requires separate explicit Faraz approval. Business-truth changes require owner confirmation before any public/customer-visible use. Media usage rights require owner confirmation before public/customer-visible use. Sensitive claims are blocked until owner-confirmed. AI drafts may move forward only after Team/Faraz review. No AI output becomes customer-visible from this PR.

## PR #120 — Momo Internal Dry Run + Go/No-Go Gate

GitHub PR #120 adds Momo Internal Dry Run + Go/No-Go Gate only. PR #109 Momo Live Pilot Readiness Gate is merged. PR #110 Post-PR109 Momo readiness alignment is merged. PR #111 Controlled Momo Pilot Activation Gate is merged. PR #112 Post-PR111 Activation Gate Alignment + Business Truth Status Hardening is merged. PR #113 Post-PR112 Source-of-Truth Finalization is merged. PR #114 Momo Internal Pilot Prep Pack is merged. PR #115 Momo Business Truth Review Pack is merged. PR #116 Momo Media + Content Inventory Pack is merged. PR #117 Momo Brand Voice + AI Prompt Rules Pack is merged. PR #118 Controlled AI Draft Generation Foundation is merged. PR #119 AI Draft Approval Queue is merged or immediately prior. PR #120 is internal dry-run/go-no-go review only. PR #120 does not activate the pilot, does not activate real auth, does not create credentials, does not contact Momo’s House, does not expose anything to the client, does not generate AI output, does not create fake AI drafts, does not create fake approvals, does not create fake reports, does not upload/create/seed/generate/fake media, does not publish externally, does not connect external platforms, and does not add payments, webhooks, cron jobs, background jobs, scheduled jobs, or automation runners. AUTH_MODE remains placeholder. /api/pilot-access remains active. Roles remain client/team only. Momo owner walkthrough remains blocked. No next activation PR is approved by default. Future real-world activation requires separate explicit Faraz approval. Business-truth changes require owner confirmation before any public/customer-visible use. Media usage rights require owner confirmation before public/customer-visible use. Sensitive claims are blocked until owner-confirmed. Any future go-live, real-auth cutover, owner walkthrough, external platform setup, or client exposure requires a separate explicit Faraz approval.
