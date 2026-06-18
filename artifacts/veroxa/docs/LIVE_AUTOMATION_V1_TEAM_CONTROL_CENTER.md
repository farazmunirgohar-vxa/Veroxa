# Live Automation V1 Team Automation Control Center Foundation

Status: GitHub PR #107 Team Automation Control Center Foundation only. PR #106 AI Draft Preparation is already merged.

## What GitHub PR #107 adds

- A Team-only/internal-only Control Center route at `/team/control-center`.
- A feature gate requiring `AUTH_MODE === "real"`, `VITE_VEROXA_TEAM_CONTROL_CENTER_ENABLED=true`, and an authenticated Team role.
- Read-only service helpers that summarize existing internal queues from `media_assets`, `messages`, `profile_corrections`, `activity_log`, `ai_drafts`, and safe `approvals` records when present.
- Links back to existing Team pages for upload inbox, messages, profile corrections, activity log, AI drafts, approvals, and the future report queue placeholder.

## Locked runtime truth

- `AUTH_MODE` remains `placeholder`.
- `/api/pilot-access` remains active.
- Roles remain `client` and `team` only.
- The Control Center is Team-only/internal-only.
- The Control Center summarizes existing queues only.
- The Control Center does not publish.
- The Control Center does not generate reports.
- The Control Center does not activate integrations.
- The Control Center does not contact clients.
- Public/customer-visible actions still require Faraz/Team review.
- Business-truth changes still require owner confirmation.
- Momo owner walkthrough remains blocked.

## Sequence lock

- GitHub PR #107 adds Team Automation Control Center Foundation only.
- Reports From Activity remain PR #108.
- Momo Live Pilot Readiness Gate remains PR #109.
- Controlled Momo Pilot Activation Gate remains PR #110.
