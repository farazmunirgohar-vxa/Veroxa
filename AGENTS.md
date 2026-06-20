# Veroxa Agent Instructions

Current docs authority: read `artifacts/veroxa/docs/ACTIVE_DOCS_INDEX.md` first, then `artifacts/veroxa/docs/VEROXA_LOCKED_OPERATING_MEMORY.md`, then `artifacts/veroxa/docs/LIVE_AUTOMATION_V1_PR_SEQUENCE.md`. Do not override the active docs index, locked operating memory, `PRICING_SOURCE_OF_TRUTH.md`, or `CURRENT_BUILD_STATUS.md` with older current-looking docs or archived strategy notes.

## 2026-06-19 — Post-PR120 operating lock

Latest completed Momo internal review chain is through **PR #120 — Momo Internal Dry Run + Go/No-Go Gate**.

Current completed sequence:

1. PR #99 — Live Automation V1 Architecture + Schema Design.
2. PR #100 — Supabase Auth Foundation.
3. PR #101 — Database Foundation.
4. PR #102 — Media Upload + Storage Foundation.
5. PR #103 — Profile Corrections Foundation.
6. PR #104 — Real Messages / Portal Threads Foundation.
7. PR #105 — Activity Log Foundation.
8. PR #106 — AI Draft Preparation Foundation.
9. PR #107 — Team Automation Control Center Foundation.
10. PR #108 — Reports From Activity Foundation.
11. PR #109 — Momo Live Pilot Readiness Gate.
12. PR #110 — Post-PR109 Momo readiness alignment.
13. PR #111 — Controlled Momo Pilot Activation Gate.
14. PR #112 — Post-PR111 Activation Gate Alignment + Business Truth Status Hardening.
15. PR #113 — Post-PR112 Source-of-Truth Finalization.
16. PR #114 — Momo Internal Pilot Prep Pack.
17. PR #115 — Momo Business Truth Review Pack.
18. PR #116 — Momo Media + Content Inventory Pack.
19. PR #117 — Momo Brand Voice + AI Prompt Rules Pack.
20. PR #118 — Controlled AI Draft Generation Foundation.
21. PR #119 — AI Draft Approval Queue.
22. PR #120 — Momo Internal Dry Run + Go/No-Go Gate.

PR #120 is internal dry-run/go-no-go review only. It does not activate the pilot, activate real auth, create credentials, contact Momo’s House, expose anything to the client, generate AI output, create fake AI drafts, create fake approvals, create fake reports, upload/create/seed/generate/fake media, publish externally, connect external platforms, or add payments, webhooks, cron jobs, background jobs, scheduled jobs, or automation runners.

`AUTH_MODE` remains `placeholder`. `/api/pilot-access` remains active. Roles remain `client` and `team` only. Momo owner walkthrough remains blocked. No next activation PR is approved by default. Future real-world activation, real-auth activation, external platform setup, owner walkthrough, or client exposure requires separate explicit Faraz approval.

## Product identity

Veroxa is an AI-assisted, automation-powered restaurant online presence and customer-growth operating system.

Public positioning stays: “We help restaurants become easier to find, easier to trust, and easier to choose.” Public/client copy must not guarantee orders, revenue, profit, ROI, customers, rankings, walk-ins, reach, engagement, or growth.

## Active roles

Active roles today:

1. Restaurant Partner / Client
2. Veroxa Team / Faraz

Owner, Operator, Super Admin, generic Admin, and Execution roles remain parked unless Faraz explicitly reintroduces them. Do not build Owner/Operator/Admin/Super Admin/Execution portals or workflows without an explicit new instruction.

Team Portal complexity remains deferred. Team surfaces must stay supporting/action-focused. No AI command-center automation should be added unless separately approved. Owner/Operator/Super Admin/generic Admin/Execution dashboards remain blocked.

## Current build stack

The active build stack is GitHub + Codex + Vercel.

- GitHub `main` is the source of truth.
- Codex is the primary engineering/build agent.
- Vercel is the deployment target.
- Browser/manual QA is used for visual checks.

## Default Codex workflow

- Pull latest `origin/main` before making changes.
- Create a branch for the task.
- Read the prompt completely and carefully before editing.
- Plan the work before editing.
- Stage and build the requested scope in order.
- Do not skip stages.
- Do not push directly to `main`.
- Open a PR when finished.

Before any large build, read `artifacts/veroxa/docs/PRE_BUILD_STABILITY_CHECKLIST.md`. Before Live Automation V1 work, read `artifacts/veroxa/docs/LIVE_AUTOMATION_V1_ARCHITECTURE.md` and `artifacts/veroxa/docs/LIVE_AUTOMATION_V1_PR_SEQUENCE.md`.

## RR/fix-forward rule

When Faraz asks ChatGPT to RR or review a Veroxa PR, the job is not only to identify issues. Fix every issue that can reasonably and safely be fixed directly before giving the final merge verdict. This includes guardrail/check failures, docs mismatches, PR sequence drift, TypeScript/schema mismatches, migration/RLS/security policy problems, route guard issues, unsafe client visibility, feature-gate mistakes, accidental scope creep, and CI/Veroxa Verify failures that can be patched from GitHub.

Only leave an issue for Faraz/Codex when it cannot be safely fixed directly. Do not call a PR merge-ready until fixable blockers are patched and relevant checks are green.

## Locked pricing

Do not change pricing unless Faraz explicitly instructs it.

Current locked public launch offer:

- Complete Online Presence — $495/month
- Includes Google Business Profile support, Google Maps/local visibility basics, local SEO/search visibility basics, existing website alignment/refinement if access is provided, business info consistency across Google/website/socials, Facebook support, Instagram support, picture-based content support, up to 3 total posts/updates per week depending on usable media, simple captions, basic content organization, media guidance/reminders, Client Portal access, portal request response/review/answer within 24 hours, weekly updates, monthly online presence report, and Veroxa team review before anything goes live.

Coming soon / not included at launch: Yelp, TikTok support, Reels/video support, ads management, daily posting, automated publishing, live integrations, and ads creative.

Do not expose old Starter/Growth/Premium, Local Presence, Full Presence, old Complete Presence, $295, $995, $977, or $488 offers as current public pricing.

## Routing rules

Do not merge demo and login flows.

Active public flow is Home -> Audit -> Login.

- `/login` is the portal access entry.
- Client login routes to `/client/dashboard`.
- Team login routes to `/team/dashboard`.
- `/client/*` remains a real Client Portal review route until production auth is explicitly approved.
- `/team/*` remains a real Team/Internal Admin review route guarded by `InternalDemoGuard` until production auth is explicitly approved.
- `/demo`, `/guided-demo`, `/upload`, and `/demo/client/*` remain retired/disabled from active routing.
- Do not promote public demo routes, public Client Demo CTAs, or old preview login language.
- If a real portal section is incomplete, stay inside the real route and show honest review/empty/building states rather than redirecting to demo.

## Core Veroxa OS flow

Target operating flow:

Veroxa audits -> Veroxa prepares exact action -> action enters approval/review queue -> Faraz approves, edits, skips, holds, or asks client -> Veroxa queues for later execution -> future connectors execute approved work only after separate approval -> client sees simple progress.

Do not build fake live execution. If connectors are not implemented, use calm language such as “Queue for later,” “Hold for later,” or “internal review only.”

## Automation boundaries

Automation may prepare and process internal work, including drafts, classifications, activity records, media organization, report inputs, Team review items, and next-step recommendations.

Automation must not bypass safety gates.

Public/customer-visible actions still require Veroxa/Faraz approval before anything goes live.

Business-truth changes require owner/client confirmation before approval or execution, including hours, menu items, availability, prices, offers, links, catering availability, halal/dietary/allergen/health/ownership/award/authenticity claims, and reputation-impacting language.

Media usage rights require owner/client confirmation before public/customer-visible use. Sensitive claims are blocked until owner-confirmed.

## Hard no-go list unless separately approved

Do not add or activate:

- real-auth cutover;
- live credentials/auth users/client invites;
- owner walkthrough/client exposure;
- Momo contact/outreach;
- external publishing/posting;
- Google/Meta/Yelp/TikTok/delivery connectors;
- OAuth/platform token handling;
- payments/checkout/Stripe/subscriptions;
- webhooks, cron jobs, background jobs, scheduled jobs, or automation runners;
- AI provider keys in frontend code;
- client-side AI provider calls;
- automatic AI generation;
- auto-approval or auto-publishing;
- fake readiness, fake metrics, fake reports, fake activity, fake media, fake approvals, fake AI output, or fake client activity.

## Relationship to older docs

Older manual-first, first-client, preview-login, launch QA, and Momo walkthrough docs remain historical context only unless refreshed by a newer source-of-truth doc. They must not override the automation-first Momo pivot, the post-PR120 sequence, or the rule that the Momo owner walkthrough remains blocked until Faraz separately approves it.
