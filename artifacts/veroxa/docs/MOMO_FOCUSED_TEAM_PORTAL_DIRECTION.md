## 2026-06-21 — PR #130 Momo Work Queue Daily Operating Board

GitHub PR #130 adds Momo Work Queue Daily Operating Board only. PR #120 remains the current operating baseline. PR #123 locked the Momo-focused Team Portal direction. PR #126 added grouped Momo workspace routes. PR #128 made grouped Momo Workspace the primary navigation path while preserving standalone routes as compatibility/detail routes. PR #129 improved `/team/momo` as an internal operating snapshot dashboard. PR #130 improves `/team/momo/work` as an internal daily work board.

PR #130 does not activate the pilot, does not activate real auth, does not create credentials, does not contact Momo’s House, does not publish externally, does not connect external platforms, does not generate AI output, and does not create fake work items, fake queue counts, fake messages, fake media, fake approvals, fake activity, fake reports, or fake readiness.

AUTH_MODE remains placeholder. /api/pilot-access remains active. Roles remain client/team only. Momo owner walkthrough remains blocked. No next activation PR is approved by default. Future real-world activation requires separate explicit Faraz approval.

## PR #129 dashboard operating snapshot alignment

GitHub PR #129 adds Momo Workspace Dashboard Operating Snapshot only. PR #120 remains the current operating baseline. PR #123 locked the Momo-focused Team Portal direction. PR #126 added grouped Momo workspace routes. PR #127 elevated the Momo workspace docs into the current source-of-truth list. PR #128 made grouped Momo Workspace the primary navigation path while preserving standalone routes as compatibility/detail routes. PR #129 improves `/team/momo` as an internal operating snapshot/dashboard.

PR #129 does not activate the pilot, activate real auth, create credentials, contact Momo’s House, publish externally, connect external platforms, generate AI output, or create fake metrics, fake reports, fake approvals, fake AI output, fake activity, or fake readiness. AUTH_MODE remains placeholder. /api/pilot-access remains active. Roles remain client/team only. Momo owner walkthrough remains blocked. No next activation PR is approved by default. Future real-world activation requires separate explicit Faraz approval.

# Momo-Focused Team Portal Direction

Status: Current direction lock for the post-PR120 Momo pilot stage.

This document records the approved Team Portal direction before the next implementation/consolidation PR.

## Locked direction

For the current pilot stage, Team Portal is **Momo-only**.

Team Portal should not try to behave like a full multi-client Veroxa operations console yet. The immediate job is to help Team Faraz move **Momo's House** forward safely, clearly, and without clutter.

Locked operating rule:

```text
Team Portal = Momo-only internal operations workspace for now.
```

Not:

```text
Team Portal = all restaurants + all future Veroxa admin systems.
```

Multi-client generalization should come later, after the Momo operating workflow is usable and validated.

## Product goal

The Team Portal should answer one operational question:

> What does Team Faraz need to do for Momo's House right now?

It should not force the team to navigate many standalone internal Momo pages just to understand the next task.

## Why this is needed

The post-PR120 Momo system has many internal surfaces:

- Momo Live Readiness
- Momo Activation Gate
- Momo Internal Prep
- Momo Business Truth
- Momo Media + Content
- Momo Brand AI Rules
- Momo AI Generation Foundation
- Momo AI Approval Queue
- Momo Dry Run / Go-No-Go
- Activity Log
- Reports From Activity
- Messages
- Upload Inbox
- Profile Corrections
- Team Control Center

These are useful foundations, but the portal experience is becoming fragmented. The next step should be consolidation around a Momo workflow, not another standalone feature page.

## Preferred Team Portal structure

The Team Portal should be grouped into six Momo-focused areas:

```text
Momo Dashboard
Work Queue
Restaurant Intelligence
Content + AI
Reports + Activity
Readiness
```

### 1. Momo Dashboard

Purpose: one landing page for Momo's current internal state.

Should summarize:

- Momo pilot status
- current blockers
- today's work
- business-truth status
- media/content status
- AI draft readiness
- approval queue status
- activity/report status
- dry-run/go-no-go status

The dashboard should make it clear that the pilot is internal-only unless Faraz separately approves a future external step.

### 2. Work Queue

Purpose: daily execution area for Team Faraz.

Should group:

- messages
- upload inbox
- profile corrections
- AI drafts
- AI approval queue
- pending review items
- hold/reject/edit-needed items

This should become the main place where team members handle Momo work.

### 3. Restaurant Intelligence

Purpose: Momo's restaurant brain/source of truth.

Should group:

- business truth
- menu/order truth
- sensitive claims
- profile corrections
- media/content inventory
- brand voice
- AI prompt rules

This should feel like one Momo profile, not several unrelated pages.

### 4. Content + AI

Purpose: controlled internal content and AI workflow.

Should group:

- content pillars
- media-use rules
- brand AI rules
- AI generation eligibility
- AI generation disabled state
- AI approval workflow
- manual-execution review criteria

Still blocked:

- no auto-generation by default
- no auto-approval
- no auto-publishing
- no client-visible raw AI output
- no external platform sync

### 5. Reports + Activity

Purpose: show what Veroxa actually did for Momo.

Should group:

- activity log
- report readiness
- reports from real Veroxa activity only
- report blockers

Still blocked:

- no fake reports
- no fake metrics
- no ROI/sales/ranking/reach claims
- no customer-visible reports without review/approval

### 6. Readiness

Purpose: management review, not daily work.

Should group:

- readiness gate
- activation gate
- dry run / go-no-go
- real-auth blockers
- owner walkthrough blockers
- external platform blockers
- future Faraz approval requirements

This area should be available but not dominate the main nav.

## Preferred route direction

Future implementation should move toward this structure:

```text
/team
  -> Momo Team Workspace

/team/momo
  -> Momo Dashboard

/team/momo/work
  -> Work Queue

/team/momo/intelligence
  -> Business truth + media + brand rules

/team/momo/content-ai
  -> AI generation foundation + approval queue

/team/momo/reports
  -> Activity log + reports

/team/momo/readiness
  -> Readiness + activation gate + dry run/go-no-go
```

Existing standalone Momo routes may remain as compatibility/detail routes, but the primary navigation should be the grouped Momo workflow.

## Navigation rule

Avoid continuing this pattern:

```text
new Momo feature = new top-level Team nav item
```

Instead, new Momo work should be placed under one of the grouped Momo areas.

## Next recommended implementation PR

The next implementation PR should be a consolidation PR, not another new Momo feature.

Suggested title:

```text
Momo-Focused Team Portal Consolidation
```

Suggested objective:

```text
Consolidate the Team Portal into a Momo-only internal operations workspace with grouped sections for Dashboard, Work Queue, Restaurant Intelligence, Content + AI, Reports + Activity, and Readiness.
```

This should make the Team Portal easier to use without changing live-system behavior.

## Locked safety boundaries

The consolidation must not:

- activate the Momo pilot
- activate real auth
- create credentials
- create auth users
- invite the client
- contact Momo's House
- send emails, SMS, DMs, push notifications, or owner outreach
- publish externally
- post content
- connect Google, Meta, Instagram, Facebook, Yelp, TikTok, DoorDash, Uber Eats, Grubhub, or external platforms
- add OAuth
- add platform token handling
- add payments, checkout, Stripe, subscriptions, webhooks, cron jobs, background jobs, scheduled jobs, automation runners, or external sync
- expose service-role keys or backend secrets
- expose AI provider keys in frontend code
- add client-side AI provider calls
- generate AI output by default
- auto-approve AI output
- expose raw AI output to the client
- create fake readiness, fake metrics, fake reports, fake media, fake messages, fake approvals, fake AI output, fake client activity, fake publishing status, or fake content performance
- claim revenue, orders, ROI, rankings, walk-ins, customers, impressions, reach, engagement, or guaranteed growth

Locked technical truths remain:

- `AUTH_MODE` remains `placeholder`.
- `/api/pilot-access` remains active.
- Roles remain `client` and `team` only.
- Momo owner walkthrough remains blocked.
- No next activation PR is approved by default.
- Future real-world activation, real-auth activation, external platform setup, owner walkthrough, or client exposure requires separate explicit Faraz approval.

## Strategic rule

Do not build the full agency platform before Momo works.

Build the clean Momo operating workflow first. Then generalize it for future restaurants after the Momo pilot is proven usable.

## 2026-06-21 — PR #126 Momo-Focused Team Portal Consolidation

- GitHub PR #126 adds Momo-Focused Team Portal Consolidation only.
- PR #120 is the current operating baseline.
- PR #123 locked Momo-focused Team Portal direction.
- PR #124 and PR #125 are merged source-of-truth cleanup/fix-forward PRs.
- PR #126 adds grouped Team-only Momo workspace routes: `/team/momo`, `/team/momo/work`, `/team/momo/intelligence`, `/team/momo/content-ai`, `/team/momo/reports`, and `/team/momo/readiness`.
- Existing standalone Momo routes remain compatibility/detail routes.
- PR #126 does not activate the pilot, activate real auth, create credentials, contact Momo’s House, publish externally, connect external platforms, or generate AI output.
- AUTH_MODE remains placeholder; `/api/pilot-access` remains active; roles remain client/team only; Momo owner walkthrough remains blocked; no next activation PR is approved by default; future real-world activation requires separate explicit Faraz approval.

## GitHub PR #128 — Momo Workspace Primary Navigation Alignment

GitHub PR #128 adds Momo Workspace Primary Navigation Alignment only. PR #120 remains the current operating baseline. PR #123 locked the Momo-focused Team Portal direction. PR #126 added grouped Momo workspace routes. PR #127 elevated the Momo workspace docs into the current source-of-truth list. PR #128 makes the grouped Momo Workspace the primary navigation path while preserving standalone routes as compatibility/detail routes.

PR #128 does not activate the pilot, does not activate real auth, does not create credentials, does not contact Momo’s House, does not publish externally, does not connect external platforms, and does not generate AI output. AUTH_MODE remains placeholder, /api/pilot-access remains active, roles remain client/team only, Momo owner walkthrough remains blocked, no next activation PR is approved by default, and future real-world activation requires separate explicit Faraz approval.
