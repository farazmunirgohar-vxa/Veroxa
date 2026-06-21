# Momo Work Queue Daily Operating Board

Status: GitHub PR #130 work queue organization only for `/team/momo/work`.

GitHub PR #130 adds Momo Work Queue Daily Operating Board only. PR #120 remains the current operating baseline. PR #123 locked the Momo-focused Team Portal direction. PR #126 added grouped Momo workspace routes. PR #128 made grouped Momo Workspace the primary navigation path while preserving standalone routes as compatibility/detail routes. PR #129 improved `/team/momo` as an internal operating snapshot dashboard. PR #130 improves `/team/momo/work` as an internal daily work board.

## Purpose

The Momo Work Queue answers: what should Team Faraz review or work on internally today, and where should each type of work be handled?

It organizes existing Team-only surfaces into workflow lanes for work queue overview, message review, upload/media review, profile correction review, AI draft review, Momo AI approval review, activity logging, report/activity follow-through, blocked work, safe next internal actions, and safety boundaries.

## Scope lock

PR #130 does not activate the pilot. PR #130 does not activate real auth. PR #130 does not create credentials. PR #130 does not contact Momo’s House. PR #130 does not publish externally. PR #130 does not connect external platforms. PR #130 does not generate AI output. PR #130 does not create fake work items, fake queue counts, fake messages, fake media, fake approvals, fake activity, fake reports, or fake readiness.

AUTH_MODE remains placeholder. /api/pilot-access remains active. Roles remain client/team only. Momo owner walkthrough remains blocked. No next activation PR is approved by default. Future real-world activation requires separate explicit Faraz approval.

## Allowed internal workflow lanes

- Work queue overview: `/team/momo/work` is the daily internal execution board and organizes existing Team pages only.
- Messages: portal/internal review only; no SMS, email, DM, external messaging, owner outreach, or client-visible promise.
- Upload inbox: internal media review only; no upload is triggered; no fake media is created; media usage rights require owner confirmation before public use.
- Profile corrections: business-truth changes require owner confirmation before public/customer-visible use; no Google/Meta/public profile sync.
- AI drafts: internal-only; no AI generation, no raw AI output to clients, no auto-approval, and no publishing.
- Momo AI approval: Team/Faraz review required; owner-confirmation-needed is a blocker, not outreach.
- Activity log: real Veroxa work only; no fake activity or external side effects.
- Reports follow-through: real Veroxa activity only; no fake reports, fake metrics, ROI/sales/ranking/reach claims, or unreviewed client-visible reports.
- Blocked work: owner confirmation required, media rights unconfirmed, sensitive claim unconfirmed, real-auth activation not approved, external platform setup not approved, owner walkthrough not approved, and AI generation disabled by default.
- Safe next internal actions: review existing internal routes, record real internal activity only, review reports/activity, escalate risky items to Faraz, and keep owner walkthrough blocked.
- Safety boundaries: no pilot activation, no real auth activation, no credentials, no Momo contact, no publishing, no external integrations, no AI generation, no fake work items, no fake counts, and no next activation PR approved by default.
