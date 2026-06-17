# Live Automation V1 Actual PR Sequence

Status: current source-of-truth correction for GitHub PR numbering after Profile Corrections merged as GitHub PR #103, Real Messages merged as GitHub PR #104, and Activity Log merged as GitHub PR #105.

## Why this file exists

The original Live Automation V1 architecture planned Real Messages as PR #103 and Profile Corrections as PR #104. In the actual GitHub history, Profile Corrections was implemented and merged first as GitHub PR #103, Real Messages followed as GitHub PR #104, and Activity Log followed as GitHub PR #105.

This file locks the corrected GitHub sequence so future work does not drift or create confusion.

If this file conflicts with older PR-number wording in `LIVE_AUTOMATION_V1_ARCHITECTURE.md`, `CURRENT_BUILD_STATUS.md`, or other historical/current-looking docs, follow this file for PR numbering while preserving the same module order and safety gates.

## Completed GitHub PRs

- PR #99 — Live Automation V1 Architecture + Schema Design.
- PR #100 — Supabase Auth Foundation.
- PR #101 — Database Foundation.
- PR #102 — Media Upload + Storage Foundation.
- PR #103 — Profile Corrections Foundation for Live Automation V1.
- PR #104 — Real Messages / Portal Threads Foundation.
- PR #105 — Activity Log Foundation.

## Next GitHub PR

- PR #106 — AI Draft Preparation Foundation (current PR: internal Team-only AI drafts; no publishing, no reports, no client-visible raw AI output).

## Remaining planned GitHub sequence

- PR #107 — Team Automation Control Center Foundation.
- PR #108 — Reports From Activity Foundation.
- PR #109 — Momo Live Pilot Readiness Gate.
- PR #110 — Controlled Momo Pilot Activation Gate, post-readiness only and not part of the original PR #99–#109 architecture sequence.

## PR #106–#110 execution lock

PR #106 through PR #110 may be planned in one Codex task prompt, but they should still be executed as staged work with clean PR identity and source-of-truth updates. Do not collapse the meaning of the PR numbers. If Codex can only open one PR from the task, it should implement PR #106 first and leave docs/prompts for PR #107–#110 as future staged work unless explicitly instructed otherwise by Faraz.

## Safety lock

- `AUTH_MODE` remains `placeholder` until explicit real-auth activation approval.
- `/api/pilot-access` remains active until real-auth activation is approved.
- Profile Corrections are built as GitHub PR #103, but they are not public/platform updates.
- Real Messages are built as GitHub PR #104, but they are portal-only and not SMS/email/DM/comment/customer-service inbox handling.
- Activity Log is built as GitHub PR #105, but it is event memory only and not report generation.
- AI Draft Preparation is next as PR #106 and must stay internal-review only.
- Team Automation Control Center is PR #107 and must stay internal only.
- Reports From Activity is PR #108 and must use real activity without fake metrics or external publishing.
- Momo Live Pilot Readiness Gate is PR #109 and must not activate the pilot.
- Controlled Momo Pilot Activation Gate is PR #110 and must not activate by default unless Faraz explicitly approves activation.
- Momo owner walkthrough remains blocked until the full Live Automation V1 acceptance criteria are met and Faraz explicitly approves activation/walkthrough.

## ChatGPT operating lock

For future ChatGPT/Codex planning in this project:

- Treat Profile Corrections as already merged under GitHub PR #103.
- Treat Real Messages / Portal Threads as already merged under GitHub PR #104.
- Treat Activity Log as already merged under GitHub PR #105.
- Treat AI Draft Preparation as the next build, expected GitHub PR #106.
- After AI Draft Preparation, continue with Team Automation Control Center as PR #107.
- Then continue with Reports From Activity as PR #108.
- Then continue with Momo Live Pilot Readiness Gate as PR #109.
- Treat PR #110 as the controlled activation gate only after PR #109 readiness passes and Faraz explicitly approves moving toward activation.
- Do not skip to real-auth activation, integrations, publishing, payments, or Momo walkthrough before PR #109 readiness and PR #110 activation gates are handled safely.
