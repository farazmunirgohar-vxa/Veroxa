# Momo Pilot Launch QA Checklist

Status: historical/stale blocked reference only. This is not an active launch checklist.

Momo owner walkthrough remains blocked. No next activation PR is approved by default. Future real-world activation requires separate explicit Faraz approval.

This checklist used to answer an older manual-pilot question. That question is no longer the active operating path after the automation-first pivot and PR #120 Momo Internal Dry Run + Go/No-Go Gate.

Do not use this doc to launch, activate, contact Momo’s House, start an owner walkthrough, invite a client, create credentials, turn on real auth, publish externally, connect platforms, or imply the pilot is ready.

## Current QA truth

The current internal review path is:

1. PR #109 — Momo Live Pilot Readiness Gate.
2. PR #110 — Post-PR109 Momo readiness alignment.
3. PR #111 — Controlled Momo Pilot Activation Gate.
4. PR #112 — Activation gate alignment + business-truth status hardening.
5. PR #113 — Source-of-truth finalization only.
6. PR #114 — Momo Internal Pilot Prep Pack.
7. PR #115 — Momo Business Truth Review Pack.
8. PR #116 — Momo Media + Content Inventory Pack.
9. PR #117 — Momo Brand Voice + AI Prompt Rules Pack.
10. PR #118 — Controlled AI Draft Generation Foundation.
11. PR #119 — AI Draft Approval Queue.
12. PR #120 — Momo Internal Dry Run + Go/No-Go Gate.

PR #120 is internal dry-run/go-no-go review only. It does not activate the pilot, activate real auth, create credentials, contact Momo’s House, expose anything to the client, generate AI output, create fake AI drafts, create fake approvals, create fake reports, upload/create/seed/generate/fake media, publish externally, connect external platforms, or add payments, webhooks, cron jobs, background jobs, scheduled jobs, or automation runners.

## Historical checks retained as blocked reference

These older checks remain useful only as context for what a future separately approved walkthrough plan would need to verify. They are not permission to act.

### Deployment/access context

- `AUTH_MODE` remains `placeholder`.
- `/api/pilot-access` remains active.
- Momo House would route to `/client/dashboard` only through the existing safe pilot access path.
- Team Faraz would route to `/team/dashboard` only through the existing safe pilot access path.
- No pilot password may appear in frontend source, browser-intended docs, or build output.
- `/demo`, `/guided-demo`, `/upload`, and `/demo/client/*` stay retired.

### Client portal context

- Client primary navigation remains Home, Media, Messages, Reports, Connections, and Profile.
- Client copy must not imply fake upload success, fake message delivery, fake reports, live integrations, or automated publishing.
- Business-truth changes still require owner confirmation before public/customer-visible use.
- Media usage rights require owner confirmation before public use.
- Sensitive claims are blocked until owner-confirmed.

### Team portal context

- Team routes remain internal and Team-only.
- Team copy must not imply live automation, live integrations, live publishing, storage uploads, or payments are connected.
- Momo owner walkthrough remains blocked.
- No next activation PR is approved by default.

## Required verification before any future separately approved walkthrough

A future walkthrough PR would need its own explicit Faraz approval and fresh verification. At minimum, run:

```bash
pnpm run typecheck
pnpm --filter @workspace/api-server run test:scan-url-safety
pnpm run verify:veroxa
pnpm --filter @workspace/veroxa run build
pnpm --filter @workspace/veroxa run test:e2e
```

Manual deployment checks remain outside this historical doc and must be confirmed only inside a future approved activation/walkthrough plan.
