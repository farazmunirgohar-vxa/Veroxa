# Live Automation V1 Reports From Activity Foundation

Status: GitHub PR #108 Reports From Activity Foundation only. PR #107 Team Automation Control Center is already merged.

## What GitHub PR #108 adds

- A gated Team route at `/team/reports-from-activity` for preparing report drafts from real Veroxa `activity_log` records and internal work history.
- A Reports From Activity feature gate requiring `AUTH_MODE === "real"`, `VITE_VEROXA_REPORTS_FROM_ACTIVITY_ENABLED=true`, authenticated Team role for Team work, and authenticated Client role with active restaurant context for client reads.
- Report service helpers for listing report-eligible activity, creating drafts, listing Team reports, updating safe Team statuses, and listing only `published_to_client` reports for clients.
- Conservative reports table constraints and RLS so active Team can select/insert/update report records and active clients can select only their own `published_to_client` portal reports.
- Client Reports page behavior for future real-gated mode that shows only reviewed reports released inside the client portal.

## Locked runtime truth

- `AUTH_MODE` remains `placeholder`.
- `/api/pilot-access` remains active.
- Roles remain `client` and `team` only.
- Momo owner walkthrough remains blocked.
- Reports are based on real Veroxa activity/work history.
- Reports do not include fake metrics.
- Reports do not include external analytics.
- Reports do not claim revenue, orders, rankings, ROI, customers, or walk-ins.
- Reports do not publish externally.
- Client-visible reports require Team review and are visible inside the client portal only.
- Publishing means portal visibility only; it does not post to Google, Meta, Yelp, TikTok, email, SMS, or any external surface.

## Sequence lock

- GitHub PR #108 adds Reports From Activity Foundation only.
- Momo Live Pilot Readiness Gate remains PR #109.
- Controlled Momo Pilot Activation Gate is PR #111 and is already merged; no next activation PR is approved by default.

## PR #120 — Momo Internal Dry Run + Go/No-Go Gate

GitHub PR #120 adds Momo Internal Dry Run + Go/No-Go Gate only. PR #109 Momo Live Pilot Readiness Gate is merged. PR #110 Post-PR109 Momo readiness alignment is merged. PR #111 Controlled Momo Pilot Activation Gate is merged. PR #112 Post-PR111 Activation Gate Alignment + Business Truth Status Hardening is merged. PR #113 Post-PR112 Source-of-Truth Finalization is merged. PR #114 Momo Internal Pilot Prep Pack is merged. PR #115 Momo Business Truth Review Pack is merged. PR #116 Momo Media + Content Inventory Pack is merged. PR #117 Momo Brand Voice + AI Prompt Rules Pack is merged. PR #118 Controlled AI Draft Generation Foundation is merged. PR #119 AI Draft Approval Queue is merged or immediately prior. PR #120 is internal dry-run/go-no-go review only. PR #120 does not activate the pilot, does not activate real auth, does not create credentials, does not contact Momo’s House, does not expose anything to the client, does not generate AI output, does not create fake AI drafts, does not create fake approvals, does not create fake reports, does not upload/create/seed/generate/fake media, does not publish externally, does not connect external platforms, and does not add payments, webhooks, cron jobs, background jobs, scheduled jobs, or automation runners. AUTH_MODE remains placeholder. /api/pilot-access remains active. Roles remain client/team only. Momo owner walkthrough remains blocked. No next activation PR is approved by default. Future real-world activation requires separate explicit Faraz approval. Business-truth changes require owner confirmation before any public/customer-visible use. Media usage rights require owner confirmation before public/customer-visible use. Sensitive claims are blocked until owner-confirmed. Any future go-live, real-auth cutover, owner walkthrough, external platform setup, or client exposure requires a separate explicit Faraz approval.
