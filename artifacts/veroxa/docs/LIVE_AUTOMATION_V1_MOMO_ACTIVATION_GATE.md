# Live Automation V1 Controlled Momo Pilot Activation Gate

Status: GitHub PR #111 adds the Controlled Momo Pilot Activation Gate only.

## What PR #111 adds

- A Team-only internal route at `/team/momo-activation-gate`.
- A gated activation-decision helper requiring `AUTH_MODE === "real"`, `VITE_VEROXA_MOMO_ACTIVATION_GATE_ENABLED=true`, and an authenticated Team role.
- A read-only activation gate service that reuses PR #109 Momo readiness evidence and may read existing safe tables: `restaurants`, `restaurant_profile_fields`, `media_assets`, `messages`, `profile_corrections`, `activity_log`, `ai_drafts`, `reports`, and `approvals`.
- A Team navigation link labeled `Activation Gate`.
- A guardrail script for the PR #111 activation-gate-only boundary.

## Locked runtime truth

- PR #109 Momo Live Pilot Readiness Gate is already merged.
- PR #110 Post-PR109 Momo readiness alignment is already merged.
- This PR does not activate the pilot by default.
- This PR does not activate real auth.
- This PR does not create client credentials.
- This PR does not contact Momo’s House.
- This PR does not publish externally.
- This PR does not create platform integrations.
- This PR does not add payments, webhooks, cron jobs, or background jobs.
- `AUTH_MODE` remains `placeholder`.
- `/api/pilot-access` remains active.
- Roles remain `client` and `team` only.
- Momo owner walkthrough remains blocked until Faraz explicitly approves activation/walkthrough after the gate.
- Future real-world activation steps require a separate explicit Faraz approval.

## Decision categories

The gate summarizes Readiness Foundation, Business Truth Confirmation, Access Boundary, Client Portal Boundary, Team Control Boundary, External Platform Boundary, Publishing Boundary, Report Boundary, and Final Decision. It can show blocked, not allowed yet, ready for Faraz decision, owner confirmation needed, manual setup needed, or future activation step required.

## Not included

No account creation, no client invitation, no auth user creation, no live credentials, no external contact, no external publishing, no external platform connection, no payment setup, no scheduled/background automation, no token storage, no fake readiness, no fake metrics, no fake reports, and no fake activity are added.


## 2026-06-19 — PR #112 Post-PR111 Activation Gate Alignment

GitHub PR #112 is **Post-PR111 Activation Gate Alignment + Business Truth Status Hardening**. PR #109 Momo Live Pilot Readiness Gate is already merged, PR #110 Post-PR109 Momo readiness alignment is already merged, and PR #111 Controlled Momo Pilot Activation Gate is already merged. PR #112 corrects activation/readiness gate interpretation of current business-truth profile-field statuses (`please_review`, `pre_filled`, `confirmed`, `optional`, `veroxa_review`) and removes stale PR #110 activation-gate wording. PR #112 is corrective alignment only: it does not activate the pilot, does not activate real auth, does not create credentials, does not contact Momo’s House, does not publish externally, does not create platform integrations, and does not add payments, webhooks, cron jobs, or background jobs. `AUTH_MODE` remains `placeholder`, `/api/pilot-access` remains active, Momo owner walkthrough remains blocked, no next activation PR is approved by default, and future real-world activation requires separate explicit Faraz approval.
