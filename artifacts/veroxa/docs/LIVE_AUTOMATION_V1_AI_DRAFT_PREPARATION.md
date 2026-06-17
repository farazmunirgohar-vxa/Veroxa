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
- `approved_internal_only` means reviewed for internal use only; it is not public/customer-visible approval.
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
- Controlled Momo Pilot Activation Gate remains PR #110 and is not activated by default.
